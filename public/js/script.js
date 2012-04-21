var OpenSpice = {};

OpenSpice.socket = io.connect(window.location);

OpenSpice.options = { country: "FR" };

OpenSpice.fetchQueue = function() {
    $.ajax({
        url: "/api/queue",
    }).done(function(data) {
        _.each(data,
        function(t, i) {
            $('#mainmenu').append(OpenSpice.templates.trackInQueue({
                name: t.name,
                artists: _.pluck(t.artists, 'name').join(', ')
            }));
        });
    });
};

OpenSpice.fetchCurrentTrack = function() {
    $.ajax({
        url: "/api/playing",
    }).done(function(t) {
        if (t.name != undefined) {
            $('#playing').html('<h5>' + t.name + '</h5><p>' + t.artists[0].name + '</p>');
        }
    });
};

OpenSpice.updateDisplayedQueue = function(added) {
    if (_.isArray(added)) {
        _.each(added,
        function(track) {
            $('#mainmenu').append(OpenSpice.templates.trackInQueue({
                name: track.name,
                artists: _.pluck(track.artists, 'name').join(', ')
            }));
        });
    } else {
        $('#mainmenu').append(OpenSpice.templates.trackInQueue({
            name: added.name,
            artists: _.pluck(added.artists, 'name').join(', ')
        }));
    }
};

OpenSpice.updateDisplayedCurrentTrack = function(track) {
    $('#playing').html('<h5>' + track.name + '</h5><p>' + track.artists[0].name + '</p>');
};

OpenSpice.updateRecentQueries = function(newQuery) {
    $('<li class="recentqueryitem">' + newQuery + '</li>').click(function(e) {
        OpenSpice.performSearch($(e.target).text());
    }).insertAfter('#recent_query');
    $('li.recentqueryitem:gt(5)').remove();
};


OpenSpice.templates = {
    trackInSearch: _.template('<tr><td><i class="icon-music"></i></td><td><%= name %></td><td><%= artists %></td><td><%= album%></td><td><button class="btn fnct_plus <%= disabled%>"><i class="icon-plus"></i></button></td></tr>'),

    trackInAlbum:  _.template('<tr><td><i class="icon-music"></i></td><td><%= number %></td><td><%= name %></td><td><%= artists %></td><td><button class="btn fnct_plus <%= disabled%>"><i class="icon-plus"></i></button></td></tr>'),

    album: _.template('<tr><td><i class="icon-book"></i></td><td><%= name %></td><td><%= year %></td></tr>'),

    trackInQueue: _.template('<li class="playlist_fellows"><i class="icon-music"></i><strong><%= name %></strong> - <%= artists %></li>')
};

OpenSpice.clearSearchArea = function() {
    $('#result').empty();
    $('.pagination').empty();
    $('.controls').empty();
};

OpenSpice.performSearch = function(qq, pagenum) {
    var pagenum = (typeof pagenum == "undefined" ? 1: pagenum);

    OpenSpice.clearSearchArea();
    $('h3').text(qq);
    $.ajax({
        url: "http://ws.spotify.com/search/1/track.json",
        data: {
            'q': qq,
            'page': pagenum
        },
        dataType: 'json'
    }).done(function(data) {
        $('h3').text(data.info.query);

        var di = data.info;
        $('h3').text(di.query);

        if (di.num_results > di.limit) {
            if (di.page > 1) {
                $('<li><a href="#"><i class="icon-arrow-left"></i></a></li>')
                .click(_.bind(OpenSpice.performSearch, this, di.query, di.page - 1))
                .appendTo('.pagination');
            }
            var maxpages = Math.ceil(di.num_results / di.limit);
            var brokepagination = maxpages > 6;
            var pageid = (brokepagination ? (di.page > 4 ? di.page - 2: 1) : 1);
            if (pageid > 1) {
                $('<li><a href="#">1</a></li>')
                .click(_.bind(OpenSpice.performSearch, this, di.query, 1))
                .appendTo('.pagination');
                $('<li><a class=".disabled" href="#">...</a></li>').appendTo('.pagination');
            }
            for (var i = 0; (i < 6 && pageid <= maxpages); i++) {
                $('<li' + (pageid == di.page ? ' class="active"': '') + '><a href="#">' + pageid + '</a></li>')
                .click(_.bind(OpenSpice.performSearch, this, di.query, pageid))
                .appendTo('.pagination');
                pageid++;
            }
            if (pageid < maxpages) {
                $('<li><a class=".disabled" href="#">...</a></li>').appendTo('.pagination');
            }
            if (pageid <= maxpages) {
                $('<li><a href="#">' + maxpages + '</a></li>')
                .click(_.bind(OpenSpice.performSearch, this, di.query, maxpages))
                .appendTo('.pagination');
            }
            if (di.page < maxpages) {
                $('<li><a href="#"><i class="icon-arrow-right"></i></a></li>')
                .click(_.bind(OpenSpice.performSearch, this, di.query, di.page + 1))
                .appendTo('.pagination');
            }
        }

        _.each(data.tracks,
        function(t, i) {
            $(OpenSpice.templates.trackInSearch({
                name: t.name,
                artists: _.map(t.artists,
                function(a) {
                    return '<a href="#" data-spuri="' + a.href + '" class="artist">' + a.name + '</a>';
                }).join(", "),
                album: '<a href="#" data-spuri="' + t.album.href + '" class="album">' + t.album.name + '</a>',
                disabled: (!_.include(t.album.availability.territories.split(" "), OpenSpice.options.country) ? "disabled": "")
            })).data('trackdata', t).appendTo('#result');
        });
        $('#result button.fnct_plus:not(.disabled)').click(function(e) {
            OpenSpice.socket.emit('add_queue', $(e.target).parents('tr').data('trackdata'));
        });
        $('#result a.album').click(function(e) {
            OpenSpice.showAlbum($(e.target).attr("data-spuri"));
            return false;
        });
        $('#result a.artist').click(function(e) {
            OpenSpice.showArtist($(e.target).attr("data-spuri"));
            return false;
        });

    });
};

OpenSpice.performLookup = function(uri, extras, callback) {
    $.ajax({
        url: "http://ws.spotify.com/lookup/1/.json",
        data: {
            'uri': uri,
            'extras': extras.join(",")
        },
        dataType: 'json'
    }).done(callback);
};

OpenSpice.showAlbum = function(albumURI) {
    OpenSpice.clearSearchArea();
    $('h3').text("Chargement");
    OpenSpice.performLookup(albumURI, ['trackdetail'],
    function(data) {
        $('h3').text(data.album.artist + ' - ' + data.album.name);
        var disabled = !_.include(data.album.availability.territories.split(" "), OpenSpice.options.country) ? ' disabled': '';
        _.each(data.album.tracks,
        function(t) {
            $(OpenSpice.templates.trackInAlbum({
                number: t['track-number'],
                name: t.name,
                artists: _.map(t.artists,
                function(a) {
                    return '<a href="#" data-spuri="' + a.href + '" class="artist">' + a.name + '</a>';
                }).join(", "),
                disabled: disabled
            })).data('trackdata', t).appendTo('#result');
        });

        $('<button class="btn btn-success add-all"><i class="icon-plus icon-white"></i>Add everything</button>').appendTo('.controls');

        $('.add-all').click(function(e) {
            OpenSpice.socket.emit('add_queue', _.map($('#result tr'),
            function(row) {
                return $(row).data('trackdata');
            }));;
        });

        $('#result button.fnct_plus:not(.disabled)').click(function(e) {
            OpenSpice.socket.emit('add_queue', $(e.target).parents('tr').data('trackdata'));
        });

        $('#result a.artist').click(function(e) {
            OpenSpice.showArtist($(e.target).attr("data-spuri"));
            return false;
        });
    });

};

OpenSpice.showArtist = function(artistURI) {
    OpenSpice.clearSearchArea();
    $('h3').text("Chargement");
    OpenSpice.performLookup(artistURI, ['albumdetail'],
    function(data) {
        $('h3').text(data.artist.name);
        _.each(data.artist.albums,
        function(a) {
            var disabled = !_.include(a.album.availability.territories.split(" "), OpenSpice.options.country) ? true : false;
            $(OpenSpice.templates.album({
                name: (disabled ?  a.album.name : '<a href="#" class="album">' + a.album.name + '</a>'),
                year: a.album.released
            })).data('albumdata', a).appendTo('#result');
        });

        $('#result a.album').click(function(e) {
            OpenSpice.showAlbum($(e.target).parents('tr').data("albumdata").album.href);
            return false;
        });
    });
};

$(function() {

    // Init navbar
    OpenSpice.fetchQueue();
    OpenSpice.fetchCurrentTrack();

    // Register socket events
    OpenSpice.socket.on('play', OpenSpice.updateDisplayedCurrentTrack);
    OpenSpice.socket.on('queue_add', OpenSpice.updateDisplayedQueue);
    OpenSpice.socket.on('queue_next_a', function(t) { $('#mainmenu li.playlist_fellows:first').remove(); });

    // Register UI events
    $('#search_track a').click(function(e) {
        $('#search_track').submit();
    });

    $('#search_track').submit(function(e) {
        var query = $('#search_track input').val();
        e.preventDefault();
        OpenSpice.performSearch(query);
        OpenSpice.updateRecentQueries(query);
    });
});
