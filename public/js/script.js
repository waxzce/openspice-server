var socket = io.connect(window.location);


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

var searchfor = function(qq, pagenum) {
    if (typeof pagenum == undefined) {
        pagenum = 1;
    }
    $('#result').empty();
    $('h3').text(qq);
    $.ajax({
        url: "http://ws.spotify.com/search/1/track.json",
        data: {
            'q': qq,
            'page': pagenum
        },
        dataType: 'json'
    }).done(function(data) {
        console.log(data);
        var di = data.info;
        $('h3').text(di.query);

        if (di.num_results > di.limit) {
			$('.pagination').empty();
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
            if (pageid < maxpages ) {
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
            $('<tr data-spurl="' + t.href + '"><td>    <i class="icon-music"></i></td><td>' + t.name + '</td><td>' + t.artists[0].name + '</td><td><button class="btn fnct_plus"><i class="icon-plus"></i></button></td></tr>')
            .data('trackdata', t).appendTo('#result');
        });
        $('#result button.fnct_plus').click(function(e) {
            socket.emit('add_queue', $(e.target).parents('tr').data('trackdata'));
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