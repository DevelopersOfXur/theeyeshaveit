var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let rooms = {};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('join new room', () => {
        let roomid = Math.floor(Math.random() * 10000);
        while (rooms[roomid]) {
            roomid = Math.floor(Math.random() * 10000);
        }
        roomid = roomid.toString();
        rooms[roomid] = {
            users: [socket],
            eyes: []
        }
        socket.emit('new room id', roomid);
        mainSocketLoop(socket, roomid);
    })
    socket.on('room join', (roomid) => {
        if (rooms[roomid]) {
            socket.emit('room join result', true)
            rooms[roomid]['users'].push(socket);
        } else {
            socket.emit('room join result', false);
            return;
        }

        mainSocketLoop(socket, roomid);
    });
});

function mainSocketLoop(socket, roomid) {
    socket.emit('initial eyes', rooms[roomid]['eyes'].join())

    socket.on('eye clicked', (eye) => {
        if (rooms[roomid]['eyes'].includes(eye)) {
            rooms[roomid]['eyes'].splice(rooms[roomid]['eyes'].indexOf(eye), 1)
        } else {
            rooms[roomid]['eyes'].push(eye);
        }
        console.log(rooms[roomid]['eyes']);
        rooms[roomid]['users'].forEach((s) => {
            if (s != socket) {
                s.emit('update eye', eye);
            }
        });
    })
    socket.on('disconnect', () => {
        rooms[roomid]['users'].splice(rooms[roomid]['users'].indexOf(socket), 1);
        if (rooms[roomid]['users'].length == 0) {
            delete rooms[roomid];
        }
    })
}

http.listen(3000, function(){
    console.log('listening on *:3000');
});