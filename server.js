/**
 * broadscast message
 *
 * @param msg
 */
function sendMessage(d) {
    const data = Buffer.from(JSON.stringify(d));
    const client = dgram.createSocket('udp4');

    client.send(data, 0, data.byteLength, 9999, d.to ? d.to : '192.168.0.255', function(err, bytes) {
        client.close();
    });
}

/**
 * httpserver, socketio
 */
const app = require('http').createServer(handler);
const io = require('socket.io')(app);
const fs = require('fs');

app.listen(9998);
console.log('listening on port: ' + 9998);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
        (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

let currentSocket;
io.on('connection', (socket) => {
    currentSocket = socket;

    socket.on('send message', (data) => {
        let d = JSON.parse(data);
        sendMessage(d);
    })
});


/**
 * udp server
 */
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.on('message', (msg, rinfo) => {
    msg = JSON.parse(msg.toString());
    const {type, data} = msg;

    if(type === "alert") {
        const notifier = require('node-notifier');
        notifier.notify({
            title: 'Figyelem!',
            message: data
        });
    }
    if(type === "private") {
        const date = (new Date()).toLocaleTimeString();
        currentSocket.emit('message received', `<i>[${date}] ${rinfo.address}: ${data}<i>`);
    }
    else {
        const date = (new Date()).toLocaleTimeString();
        currentSocket.emit('message received', `[${date}] ${rinfo.address}: ${data}`);
    }
});

server.bind(9999, '0.0.0.0');

(function() {
    const {app, BrowserWindow} = require('electron');

    function createWindow () {
        // Create the browser window.
        let win = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            }
        });

        win.maximize();
        win.webContents.openDevTools();

        // and load the index.html of the app.
        win.loadURL('http://localhost:9998');

    }

    app.whenReady().then(createWindow);

    app.on('window-all-closed', () => {
        if(process.platform !== "darwin") {
            app.quit();
        }
    })
})();
