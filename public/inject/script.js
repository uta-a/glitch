const ws = new WebSocket('wss://cloud.achex.ca/inject');
const resultDiv = document.getElementById('result');
ws.onopen = () => {
    ws.send('{"auth":"sender","passwd":"none"}');
}
ws.onmessage = mess => {
    console.log(mess.data);
    let res = JSON.parse(mess.data);
  
    if(res.msg) {
        window.open(`https://inject-app.glitch.me/${res.msg}`,'','width=800px,height=500px');
    }
    
    if(res.error == 'invalid user') {
        result(false);
    }
}

function sendMessage() {
    let message = document.getElementById('textarea').value;
    let user = document.getElementById('user').value;
  
    if(!user) {
        result(false);
        return;
    }
  
    ws.send(JSON.stringify({to: user,msg: message}));
    result(true);
    
}

function result(res) {
    if(res) {
        resultDiv.textContent = 'Success: Message sent!';
        resultDiv.className = 'result success';
    }
    else {
        resultDiv.textContent = 'Fail: Invalid user.';
        resultDiv.className = 'result fail'; 
    }  
}

function capture() {
    let user = document.getElementById('user').value;
    if(!user) {
        result(false);
        return;
    }
  
    ws.send(JSON.stringify({to: user,msg: 'capture'}));
    result(true);
}