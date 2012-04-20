var app = require('express').createServer(),
io = require('socket.io').listen(app),
express = require('express'),
dospotify = require('./dospotify.js').instance.init(io),
musicqueue = require('./musicqueue.js').instance.init(dospotify);

app.listen(8066);

app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.get('/',
function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/api/queue',
function(req, res) {
    res.contentType('application/json');
    res.send(JSON.stringify(musicqueue.getQueue()));
});


io.sockets.on('connection',
function(socket) {

    socket.on('add_queue',
    function(data) {
        musicqueue.add(data);
    });

    socket.on('nextmusic_request',
    function(data) {
        musicqueue.playNext();
    });

});



dospotify.on('play',
function(e) {
    io.sockets.emit('play', e);
});

dospotify.on('play_done',
function(e) {
    musicqueue.playNext();
});

musicqueue.on('added',
function(e) {
    io.sockets.emit('queue_add', e);
});
