var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var hri = require('human-readable-ids').hri;

let rooms = {};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('join new room', () => {
        let roomid = hri.random();
        while (rooms[roomid]) {
            roomid = hri.random();
        }
        roomid = roomid.toString();
        rooms[roomid] = {
            users: [socket],
            eyes: []
        }
        socket.emit('new room id', roomid);
        socket.emit('user count update', rooms[roomid]['users'].length);
        mainSocketLoop(socket, roomid);
    })
    socket.on('room join', (enteredid) => {
        let roomExists = false;
        let roomid = enteredid;
        Object.keys(rooms).forEach(r => {
            if (r.replace(/-/g, '') == roomid.replace(/-/g, '')) {
                roomExists = true;
                roomid = r;
            }
        });
        if (roomExists) {
            if (rooms[roomid]['users'].length < 6) {
                socket.emit('room join result', 'success');
                rooms[roomid]['users'].push(socket);
                rooms[roomid]['users'].forEach(s => {
                    s.emit('user count update', rooms[roomid]['users'].length);
                });    
            } else {
                socket.emit('room join result', 'count');
            }
        } else {
            socket.emit('room join result', 'doesnt exist');
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
        } else {
            rooms[roomid]['users'].forEach(s => {
                s.emit('user count update', rooms[roomid]['users'].length);
            })
        }
    })
}

http.listen(80, function(){
    console.log('listening');
});