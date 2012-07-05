// version spotify app
var EventEmitter = require('events').EventEmitter;


var Dospotify = function() {
    EventEmitter.call(this);
    this.io = null;
    this.socket = null;
	this.country = 'US';
    return this;
}

var p = Dospotify.prototype = Object.create(EventEmitter.prototype);

p.getCountry = function(){
	return this.country;
}

p.play = function(t) {
    try {
        this.socket.emit('playmusic_order', t);
    } catch(e) {
        console.log(e);
    }
    var timer = Math.round(t.length) * 1000;
    console.log("start");
    console.log(t);
    console.log(timer);
    var timeoutId = setTimeout(this.emit.bind(this, 'play_done', t), timer);
};

p.volumeUP = function(t) {
    try {
        this.socket.emit('volume_up');
    } catch(e) {
        console.log(e);
    }
};

p.volumeDOWN = function(t) {
    try {
        this.socket.emit('volume_down');
    } catch(e) {
        console.log(e);
    }
};


p.init = function(io_p) {
    this.io = io_p;
    var controll_socket = this
    .io
    .of('/controll')
    .on('connection',
    function(socket_p) {
        this.socket = socket_p;
        this.emit('connected');
        this.socket.on('playing',
        function(t) {
            this.emit('play', t);
        }.bind(this));
		this.socket.on('country',
        function(c) {
            this.country = c;
        }.bind(this));
    }.bind(this));

    return this;
};

exports.instance = new Dospotify();
