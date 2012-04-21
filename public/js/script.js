var socket = io.connect(window.location);

var options = {
    country: "FR"
};


$(function() {


    $.ajax({
        url: "/api/queue",
    }).done(function(data) {
        _.each(data,
        function(t, i) {
            //			$('#result').append('<tr data-spurl="'+t.href+'"><td>    <i class="icon-music"></i></td><td>'+t.name+'</td><td>'+t.artists[0].name+'</td></tr>');
            $('#mainmenu').append('<li class="playlist_fellows"><i class="icon-music"></i><strong>' + t.name + '</strong> - ' + t.artists[0].name + '</li>');
        });
    });


    $('#nextmusic').click(_.bind(function() {
        socket.emit('nextmusic_request', {});
    },
    this));
    $.ajax({
        url: "/api/playing",
    }).done(function(t) {
        if (t.name != undefined) {
            $('#playing').html('<h5>' + t.name + '</h5><p>' + t.artists[0].name + '</p>');
        }
    });
    socket.on('play',
    function(t) {
        $('#playing').html('<h5>' + t.name + '</h5><p>' + t.artists[0].name + '</p>');
    });




    socket.on('queue_add',
    function(t) {
        $('#mainmenu').append('<li class="playlist_fellows"><i class="icon-music"></i><strong>' + t.name + '</strong> - ' + t.artists[0].name + '</li>');
    });

    socket.on('queue_next_a',
    function(t) {
        $('#mainmenu li.playlist_fellows:first').remove();
    });


});

var trackInSearchTemplate = _.template('<tr><td><i class="icon-music"></i></td><td><%= name %></td><td><%= artists %></td><td><%= album%></td><td><button class="btn fnct_plus <%= disabled%>"><i class="icon-plus"></i></button></td></tr>');

var trackInAlbumTemplate = _.template('<tr><td><i class="icon-music"></i></td><td><%= number %></td><td><%= name %></td><td><%= artists %></td><td><button class="btn fnct_plus <%= disabled%>"><i class="icon-plus"></i></button></td></tr>');

var albumTemplate = _.template('<tr><td><i class="icon-music"></i></td><td><%= name %></td><td><%= year %></td></tr>');

var searchfor = function(qq, pagenum) {
    var pagenum = (typeof pagenum == "undefined" ? 1: pagenum);

    $('#result').empty();
    $('.pagination').empty();
    $('.controls').empty();
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
                .click(_.bind(searchfor, this, di.query, di.page - 1))
                .appendTo('.pagination');
            }
            var maxpages = Math.ceil(di.num_results / di.limit);
            var brokepagination = maxpages > 6;
            var pageid = (brokepagination ? (di.page > 4 ? di.page - 2: 1) : 1);
            if (pageid > 1) {
                $('<li><a href="#">1</a></li>')
                .click(_.bind(searchfor, this, di.query, 1))
                .appendTo('.pagination');
                $('<li><a class=".disabled" href="#">...</a></li>').appendTo('.pagination');
            }
            for (var i = 0; (i < 6 && pageid <= maxpages); i++) {
                $('<li' + (pageid == di.page ? ' class="active"': '') + '><a href="#">' + pageid + '</a></li>')
                .click(_.bind(searchfor, this, di.query, pageid))
                .appendTo('.pagination');
                pageid++;
            }
            if (pageid < maxpages) {
                $('<li><a class=".disabled" href="#">...</a></li>').appendTo('.pagination');
            }
            if (pageid <= maxpages) {
                $('<li><a href="#">' + maxpages + '</a></li>')
                .click(_.bind(searchfor, this, di.query, maxpages))
                .appendTo('.pagination');
            }
            if (di.page < maxpages) {
                $('<li><a href="#"><i class="icon-arrow-right"></i></a></li>')
                .click(_.bind(searchfor, this, di.query, di.page + 1))
                .appendTo('.pagination');
            }
        }

        _.each(data.tracks,
        function(t, i) {
            $(trackInSearchTemplate({
                name: t.name,
                artists: _.map(t.artists, function(a) {
                    return '<a href="#" data-spuri="'+ a.href +'" class="artist">'+ a.name +'</a>';
                }).join(", "),
                album: '<a href="#" data-spuri="' + t.album.href + '" class="album">' + t.album.name + '</a>',
                disabled: (!_.include(t.album.availability.territories.split(" "), options.country) ? "disabled": "")
            })).data('trackdata', t).appendTo('#result');
        });
        $('#result button.fnct_plus:not(.disabled)').click(function(e) {
            socket.emit('add_queue', $(e.target).parents('tr').data('trackdata'));
        });
        $('#result a.album').click(function(e) {
            showAlbum($(e.target).attr("data-spuri"));
            return false;
        });
        $('#result a.artist').click(function(e) {
            showArtist($(e.target).attr("data-spuri"));
            return false;
        });

    });
};

var performLookup = function(uri, extras, callback) {
    $.ajax({
        url: "http://ws.spotify.com/lookup/1/.json",
        data: {
            'uri': uri,
            'extras': extras.join(",")
        },
        dataType: 'json'
    }).done(callback);
};

var showAlbum = function(albumURI) {
    $('#result').empty();
    $('.pagination').empty();
    $('.controls').empty();
    $('h3').text("Chargement");
    performLookup(albumURI, ['trackdetail'], function(data) {
        $('h3').text(data.album.artist +' - '+ data.album.name);
        var disabled = !_.include(data.album.availability.territories.split(" "), options.country) ? ' disabled' : '';
        _.each(data.album.tracks, function(t) {
            $(trackInAlbumTemplate({
                number: t['track-number'],
                name: t.name,
                artists: _.map(t.artists, function(a) {
                    return '<a href="#" data-spuri="'+ a.href +'" class="artist">'+ a.name +'</a>';
                }).join(", "),
                disabled: disabled
            })).data('trackdata', t).appendTo('#result');
        });
    });
    $('<button class="btn btn-success add-all"><i class="icon-plus icon-white"></i>Add everything</button>').appendTo('.controls');
    $('.add-all').click(function(e) {
        _.each($('#result tr'), function(row) {
            socket.emit('add_queue', $(row).data('trackdata'));
        });
    });
    $('#result button.fnct_plus:not(.disabled)').click(function(e) {
        socket.emit('add_queue', $(e.target).parents('tr').data('trackdata'));
    });

};

var showArtist = function(artistURI) {
    $('#result').empty();
    $('.pagination').empty();
    $('.controls').empty();
    $('h3').text("Chargement");
    performLookup(artistURI, ['albumdetail'], function(data) {
        $('h3').text(data.artist.name);
        _.each(data.artist.albums, function(a) {
            $(albumTemplate({
                name: a.album.name,
                year: a.album.released
            })).data('albumdata', a).appendTo('#result');
        });
    });
};

$(function() {

    $('#search_track a').click(function(e) {
        $('#search_track').submit();
    });

    $('#search_track').submit(function(e) {
        e.preventDefault();
        searchfor($('#search_track input').val());
        $('<li class="recentqueuryitem">' + $('#search_track input').val() + '</li>').click(function(e) {
            searchfor($(e.target).parent('li').text());
        }).insertAfter('#recent_query');
        $('li.recentqueuryitem:gt(5)').remove();
    });
});
