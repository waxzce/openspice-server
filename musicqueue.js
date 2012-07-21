var EventEmitter = require('events').EventEmitter;


var Mu = function() {
    EventEmitter.call(this);
    this.queue = [];
    this.dospotify = null;
    return this;
}

var p = Mu.prototype = Object.create(EventEmitter.prototype);


p.add = function(t) {
    var tmpql = this.queue.length;
	if(Array.isArray(t)){
		for(var i in t){
			this.queue.push(t[i]);
		}
	}else{
		this.queue.push(t);
	}
    if (tmpql == 0) {
        this.dospotify.play(this.queue[0]);
    }
    this.emit('added', t);
};

p.getQueue = function(t) {
    return this.queue;
};

p.flushQueue = function() {
    return this.queue = [];
};

p.isEmpty = function(t) {
    return this.queue.length == 0;
};

p.isMany = function(t) {
    return this.queue.length >= 1;
};

p.playNext = function() {
    this.queue.shift();
    if (this.isMany()) {
        this.dospotify.play(this.queue[0]);
    }
    this.emit('next');

};

p.init = function(dspf) {
    this.dospotify = dspf;
    return this;
};

exports.instance = new Mu();

