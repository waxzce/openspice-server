var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');


$(function() {
    var socket = io.connect('http://colabzik.fake:8066/controll');
    socket.on('connect',
    function() {
		socket.emit('country', models.session.country);

        socket.on('playmusic_order',
        function(t) {
            models.player.play(t.href);
			socket.emit('playing', t);
			document.write('.');
        });


        socket.on('volume_up',
        function(msg) {
            if (models.player.volume < 1) {
                models.player.volume = models.player.volume + 0.1;
            }
        });

        socket.on('volume_down',
        function(msg) {
            if (models.player.volume > 0) {
                models.player.volume = models.player.volume - 0.1;
            }
        });

        models.player.observe(models.EVENT.CHANGE,
        function(e) {
            //         console.log(e);
            if (e.type == 'playerStateChanged' && e.data.curtrack) {
                //			socket.emit('nextmusic_ask', {});
                }
        });



    });



});