var app = require('express').createServer(),
io = require('socket.io').listen(app),
express = require('express'),
dospotify = require('./dospotify.js').instance.init(io),
musicqueue = require('./musicqueue.js').instance.init(dospotify);

var cu_play = {};

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

app.get('/api/playing',
function(req, res) {
    res.contentType('application/json');
    res.send(JSON.stringify(cu_play));
});

io.sockets.on('connection',
function(socket) {

    socket.on('add_queue',
    function(data) {
        musicqueue.add(data);
    });
    /*
    socket.on('nextmusic_request',
    function(data) {
        musicqueue.playNext();
    });
*/
});



dospotify.on('play',
function(e) {
    io.sockets.emit('play', e);
    cu_play = e;
}.bind(this));

dospotify.on('play_done',
function(e) {
    musicqueue.playNext();
});

musicqueue.on('added',
function(e) {
    io.sockets.emit('queue_add', e);
});

musicqueue.on('next',
function(e) {
    io.sockets.emit('queue_next_a');
});
