// version spotify app
var EventEmitter = require('events').EventEmitter, microtime = require('microtime');


var Dospotify = function() {
    EventEmitter.call(this);
    this.io = null;
    this.socket = null;
	this.country = 'US';
    this.pass = 'tryo';
    this.current_track = {};
    this.current_track_start_time = 0;
    this.current_track_timer = 0;
    this.timeoutId = null;
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
    this.current_track = t;
    this.current_track_start_time = microtime.now();

    var timer = (Math.round(t.length)+1) * 1000;
    this.current_track_timer = timer;
    this.timeoutId = setTimeout(this.playing_is_finish.bind(this, t), timer);
};

p.playing_is_finish = function(t){
    if(t.href == this.current_track.href){
        this.emit('play_done', t);
    }else{
        console.log('bad timer for '+t.name);
    }
}

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
        this.socket.on('password_change',
        function(c) {
            this.pass = c;
        }.bind(this));
    }.bind(this));

    return this;
};

exports.instance = new Dospotify();
