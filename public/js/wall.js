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

        album: _.template('<tr><td><i class="icon-book icon-white"></i></td><td><%= name %></td><td><%= year %></td></tr>'),

        currentlyPlaying: _.template('<h5><%= name %></h5><p><%= artists %></p>'),

        trackInQueue: _.template('<li class="playlist_fellows"><i class="icon-music icon-white"></i><strong><%= name %></strong> - <%= artists %></li>')
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
        console.log(t);
        if (!_.isEmpty(t)) {
            $('#playing').html(OpenSpice.templates.currentlyPlaying({
                name: t.name,
                artists: _.pluck(t.artists, 'name').join(', ')
            }));
        }
    };

    p.displayAlbumArtwork = function(artist, album) {
        var key = "b25b959554ed76058ac220b7b2e0a026";
        var url = "http://ws.audioscrobbler.com/2.0/";


        $.getJSON(url, {
            method: "album.getinfo",
            format: "json",
            api_key: key,
            artist: artist,
            album: album
        }, function(data) {
            var url = _.find(data.album.image, function(i) { return i.size == "extralarge"; })["#text"];
            $("#artwork").attr("src", url);
        });
    };

    p.updateDisplayedQueue = function(added) {
        if (_.isArray(added)) {
            _.each(added,
            function(track) {
                $('#playlist_next').append(OpenSpice.templates.trackInQueue({
                    name: track.name,
                    artists: _.pluck(track.artists, 'name').join(', '),
                    href: track.href
                }));
            });
        } else {
            $('#playlist_next').append(OpenSpice.templates.trackInQueue({
                name: added.name,
                artists: _.pluck(added.artists, 'name').join(', '),
                href: added.href
            }));
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
        $('#playlist_next tr:first').remove();
    });

    OpenSpice.socket.on('re_init',
    function() {
        $('#playlist_next').empty();
        OpenSpice.fetchQueue();
        OpenSpice.fetchCurrentTrack();
        OpenSpice.fetchCountry();
    });
});
