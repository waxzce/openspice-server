var app = require('express').createServer(),
io = require('socket.io').listen(app),
express = require('express'),
dospotify = require('./dospotify.js').instance.init(io),
queue_of_music = [];

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
    res.send(JSON.stringify(queue_of_music));
});


io.sockets.on('connection',
function(socket) {
    socket.emit('news', {
        hello: 'world'
    });
/*
    socket.on('playmusic_request',
    function(data) {
        socket.broadcast.emit('playmusic_order', data);
    });
*/
socket.on('playmusic_request',
function(data) {
    dospotify.play(data);
});

    socket.on('add_queue',
    function(data) {
	    queue_of_music.push(data);
    
        if (queue_of_music.length <= 1) {
		    dospotify.play(data);
        }
    
    });

    socket.on('nextmusic_request',
    function(data) {
        if (queue_of_music.length > 1) {
            queue_of_music.shift();
			dospotify.play(queue_of_music[0]);  
        }
    });

	socket.on('nextmusic_ask',
    function(data) {
            queue_of_music.shift();
        if (queue_of_music.length > 1) {
			dospotify.play(queue_of_music[0]);
        }
    });

});



dospotify.on('play',function(e){
	io.sockets.emit('play', e);
});

dospotify.on('play_done',function(e){
	    queue_of_music.shift();
        if (queue_of_music.length > 1) {
			dospotify.play(queue_of_music[0]);
        }
});
