// version spotify app
var EventEmitter = require('events').EventEmitter;


var Dospotify = function() {
    EventEmitter.call(this);
    this.io = null;
    this.socket = null;
    return this;
}

var p = Dospotify.prototype = Object.create(EventEmitter.prototype);


p.play = function(t) {
    try {
        this.socket.emit('playmusic_order', t);
    } catch(e) {
        console.log(e);
    }
    this.emit('play', t);
    var timeoutId = setTimeout(this.emit.bind(this, 'play_done', t), Math.round(t.length) * 1000);
    // 1 hour
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
    }.bind(this));


    return this;
};

exports.instance = new Dospotify();
