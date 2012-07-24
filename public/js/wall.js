var MASTERPASS = '', OpenSpice = (function() {


    var Op = function() {
        this.initialize();
    };

    var p = Op.prototype;

    p.initialize = function() {
        this.socket = io.connect(window.location.href.substring(0, window.location.href.lastIndexOf('/')));
        this.options = {
            country: "FR"
        };
    };

    p.templates = {
        trackInAlbum: _.template('<tr><td><i class="icon-music icon-white"></i></td><td><%= number %></td><td><%= name %></td><td><%= artists %></td><td><button class="btn fnct_plus <%= disabled%>"><i class="icon-plus"></i></button></td></tr>'),

        currentlyPlaying: _.template('<h5><%= name %></h5><p><%= album %><br /><%= artists %></p>'),

        trackInQueue: _.template('<li class="playlist_fellows"><p><strong><%= title %></strong> - <span><%= artists %></span></p><img src="<%= src %>" alt=""/></li>')
    };

    p.fetchQueue = function() {
        $.ajax({
            url: "/api/queue",
        }).done(function(data) {
            OpenSpice.updateDisplayedQueue(data);
        });
    };

    p.fetchCurrentTrack = function() {
        $.ajax({
            url: "/api/playing",
        }).done(this.displayCurrentTrack);
    };

    p.fetchCountry = function() {
        $.ajax({
            url: "/api/country",
        }).done(_.bind(function(d) {
            this.options.country = d.country;
        },
        this));
    };

    p.displayCurrentTrack = function(t) {
        if (!_.isEmpty(t)) {
            $('#playing').html(OpenSpice.templates.currentlyPlaying({
                name: t.name,
                album: t.album.name,
                artists: _.pluck(t.artists, 'name').join(', ')
            }));
            OpenSpice.useAlbumArtwork(t, "extralarge", OpenSpice.updateAlbumArtwork);
        }
    };

    p.updateAlbumArtwork = function(newUrl) {
       $("#artwork-container img:last").addClass("old");
       $("#artwork-container").prepend($('<img src="'+newUrl+'" />'));
       $("#artwork-container img.old").css("opacity", "0");
       setTimeout(function() { $("#artwork-container img.old").remove(); }, 1000);
    };

    p.useAlbumArtwork = function(track, size, cb) {
        var key = "b25b959554ed76058ac220b7b2e0a026";
        var url = "http://ws.audioscrobbler.com/2.0/";


        $.getJSON(url, {
            method: "album.getinfo",
            format: "json",
            api_key: key,
            artist: _.pluck(track.artists, "name").join(", "),
            album: track.album.name,
            autocorrect: 1
        }, function(data) {
            var url = "";
            if(typeof data.album !== "undefined") {
                url = _.find(data.album.image, function(i) { return i.size == size; })["#text"];
                if(typeof url === "undefined" || url == "") url = "/img/default_"+size+".jpg";
            } else {
                url = "/img/default_"+size+".jpg";
            }
            cb(url);
        });
    };

    p.updateDisplayedQueue = function(added) {
        if (_.isArray(added)) {
            _.each(added,
            function(track) {
                OpenSpice.useAlbumArtwork(track, "large", function(url) {
                  $('#playlist_next').append(OpenSpice.templates.trackInQueue({
                      title: track.name,
                      artists: _.pluck(track.artists, "name").join(", "),
                      src: url
                  }));
                });
            });
        } else {
            OpenSpice.useAlbumArtwork(added, "large", function(url) {
              $('#playlist_next').prepend(OpenSpice.templates.trackInQueue({
                   title: added.name,
                   artists: _.pluck(added.artists, "name").join(", "),
                   src: url
              }));
            });
        }
        $('.fnct_rm').click(OpenSpice.ask_rm_this).addClass('fnct_rm_done').removeClass('fnct_rm');
        $('#playlist_next tr:first').find('.fnct_rm_done').remove();
    };

    p.manageTrackProgression = function(e) {
        if (!_.isEmpty(e)) {
            var elem = $('#playing_box .progress .bar');
            elem.stop(true, true);
            elem.css({
                'width': '0%',
                '-webkit-transition': 'none',
                '-ms-transition': 'none',
                '-moz-transition': 'none',
                '-o-transition': 'none',
                'transition': 'none'
            });
            elem.animate({
                'width': '100%'
            },
            (e.length * 1000));
        }
    };

    return new Op();
})();

$(function() {

    // Init navbar
    OpenSpice.fetchQueue();
    OpenSpice.fetchCurrentTrack();
    OpenSpice.fetchCountry();

    // Register socket events
    OpenSpice.socket.on('play', OpenSpice.displayCurrentTrack);
    OpenSpice.socket.on('play', OpenSpice.manageTrackProgression);
    OpenSpice.socket.on('queue_add', OpenSpice.updateDisplayedQueue);
    OpenSpice.socket.on('queue_next_a',
    function(t) {
        $('#wall_queue li.playlist_fellows:first').remove();
    });

    OpenSpice.socket.on('re_init',
    function() {
        $('#playlist_next').empty();
        OpenSpice.fetchQueue();
        OpenSpice.fetchCurrentTrack();
        OpenSpice.fetchCountry();
    });
});
