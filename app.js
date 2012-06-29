var express = require('express'), 
http = require('http'), 
app = app = express(),
server = http.createServer(app),
io = require('socket.io').listen(server),
dospotify = require('./dospotify.js').instance.init(io),
musicqueue = require('./musicqueue.js').instance.init(dospotify),
masterpass = process.argv[2];

console.log(process.argv);

var cu_play = {};



server.listen(8066);


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

app.get('/api/country',
function(req, res) {
    res.contentType('application/json');
    res.send(JSON.stringify({
        'country': dospotify.getCountry()
    }));
});


app.get('/api/complete',
function(req, resi) {
    resi.contentType('application/json');
    var options = {
      host: 'www.google.com',
      port: 80,
      path: '/complete/search?output=toolbar&q='+require('url').parse(req.url, true).query.q,
      method: 'GET'
    };

    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
      var datarequire = '';
      res.on('data', function (chunk) {
         datarequire+=chunk;
      }.bind(this));    
      res.on('end', function () {
         var DOMParser = require('xmldom').DOMParser;
         var doc = new DOMParser().parseFromString(datarequire,'text/xml');
         var sugs = doc.getElementsByTagName('suggestion');
         var sendarray = [];
         for(var i = 0; i < sugs.length; i++){
            sendarray.push(sugs.item(i).getAttribute('data'));
         }
         resi.send(JSON.stringify(sendarray));
      }.bind(this));

    }.bind(this));
    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });
    req.end();    
});

io.sockets.on('connection',
function(socket) {

    socket.on('add_queue',
    function(data) {
        musicqueue.add(data);
    });

    socket.on('ask_volume_up',
    function(data) {
        dospotify.volumeUP();
    });
    socket.on('ask_volume_down',
    function(data) {
        dospotify.volumeDOWN();
    });

    
    socket.on('require_flush',
    function(data) {
        if(data.pass == masterpass){
            musicqueue.flushQueue();
            io.sockets.emit('re_init');
        }
    });

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
