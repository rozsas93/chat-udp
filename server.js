/**
 * broadscast message
 *
 * @param msg
 */
function sendMessage(msg) {
    const client = dgram.createSocket('udp4');
    client.send(Buffer.from(msg), 0, 12, 9999, '192.168.0.255', function(err, bytes) {
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
        sendMessage(data);
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
    currentSocket.emit('message received', `${rinfo.address}: ${msg}`);
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

        win.webContents.openDevTools();

        // and load the index.html of the app.
        win.loadURL('http://localhost:9998');
    }

    app.whenReady().then(createWindow);
})();
