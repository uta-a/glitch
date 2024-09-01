const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_EXPIRATION_TIME = 10 * 60 * 1000; // n分後に削除（ミリ秒単位）

// JSONのパースをサポートするためのミドルウェア
app.use(bodyParser.json({ limit: '10mb' }));

// 静的ファイルの提供
app.use(express.static('public'));

// `/edit` のルートを追加して `edit.html` を提供
app.get('/edit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit', 'edit.html'));
});

// `/inject` のルートを追加して `inject.html` を提供
app.get('/inject', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inject', 'inject.html'));
});

// `/discord` のルートを追加して `discord.html` を提供
app.get('/discord', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'discord', 'discord.html'));
});

// 画像のData URLを受け取るエンドポイント
app.post('/upload-image', (req, res) => {
  const dataUrl = req.body.dataUrl;

  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).send('Invalid Data URL');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const fileName = `capture-${Date.now()}.png`;
  const filePath = path.join(__dirname, 'public', fileName);

  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      return res.status(500).send('Failed to save image');
    }

    res.send(`${fileName}`);

    // 自動削除のタイマー設定
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${fileName}`, err);
        } else {
          console.log(`File deleted automatically: ${fileName}`);
        }
      });
    }, FILE_EXPIRATION_TIME);
  });
});

// 特定のファイル削除のエンドポイント（.pngのみを削除）
app.delete('/delete-image', (req, res) => {
  const fileName = req.body.fileName;
  const filePath = path.join(__dirname, 'public', fileName);

  // 削除禁止ファイルおよび.png以外のファイルをチェック
  if (['edit.html', 'index.html', 'inject.html', 'discord.html'].includes(fileName) || !fileName.endsWith('.png')) {
    return res.status(403).send('Cannot delete this file');
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(404).send('File not found or could not be deleted');
    }

    res.send('File deleted successfully');
  });
});

// .pngファイルを一括削除するエンドポイント
app.delete('/delete-all-images', (req, res) => {
  const directoryPath = path.join(__dirname, 'public');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan files');
    }

    let deleteCount = 0;
    const deletePromises = files
      .filter(file => file.endsWith('.png')) // .pngファイルだけを対象にする
      .map((file) => {
        return new Promise((resolve, reject) => {
          const filePath = path.join(directoryPath, file);
          fs.unlink(filePath, (err) => {
            if (err) {
              reject(err);
            } else {
              deleteCount++;
              resolve();
            }
          });
        });
      });

    Promise.all(deletePromises)
      .then(() => {
        res.send(`${deleteCount} .png files deleted successfully`);
      })
      .catch((error) => {
        console.error('Error deleting files:', error);
        res.status(500).send('An error occurred while deleting files');
      });
  });
});

// ファイル一覧取得のエンドポイント
app.get('/list-images', (req, res) => {
  const directoryPath = path.join(__dirname, 'public');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan files');
    }

    const pngFiles = files.filter(file => file.endsWith('.png')); // .pngファイルだけをフィルタリング
    res.json(pngFiles);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
