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
        $('#playing').html('<h5>' + t.name + '</h5><p>' + t.artists[0].name + '</p>');
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

var searchfor = function(qq) {
    var trackRowTemplate = _.template(
            '<tr><td><i class="icon-music"></i></td><td><%= name %></td><td><%= artists %></td><td><%= album%></td><td><button class="btn fnct_plus <%= disabled%>"><i class="icon-plus"></i></button></td></tr>');
    $('#result').empty();
    $('h3').text(qq);
    $.ajax({
        url: "http://ws.spotify.com/search/1/track.json",
        data: {
            'q': qq
        },
        dataType: 'json'
    }).done(function(data) {
        $('h3').text(data.info.query);
        _.each(data.tracks,
        function(t, i) {
            $(trackRowTemplate({
                name: t.name,
                artists: _.pluck(t.artists, "name").join(", "),
                album: '<a href="#" data-spuri="'+t.album.href+'" class="album">'+t.album.name+'</a>',
                disabled: (!_.include(t.album.availability.territories.split(" "), options.country) ? "disabled" : "")
            })).data('trackdata', t).appendTo('#result');
        });
        $('#result button.fnct_plus:not(.disabled)').click(function(e) {
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
		$('<li class="recentqueuryitem">'+$('#search_track input').val()+'</li>').click(function(e){
			searchfor($(e.target).parent('li').text());
		}).insertAfter('#recent_query');
		$('li.recentqueuryitem:gt(5)').remove();
    });
});