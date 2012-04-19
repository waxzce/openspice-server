var socket = io.connect('http://colabzik.fake:8066');

socket.on('play',
function(data) {
    console.log(data);
});


$(function() {





    $('#nextmusic').click(_.bind(function() {
        socket.emit('nextmusic_request', {});
    },
    this));


    $('#queue_list').click(_.bind(function() {
        $('#result').empty();
        $('h3').text('Next tracks...');
        $.ajax({
            url: "/api/queue",
        }).done(function(data) {
            _.each(data,
            function(t, i) {
                //			$('#result').append('<tr data-spurl="'+t.href+'"><td>    <i class="icon-music"></i></td><td>'+t.name+'</td><td>'+t.artists[0].name+'</td></tr>');
                $('#result').append('<tr>><td>    <i class="icon-music"></i></td><td>' + t.name + '</td><td>' + t.artists[0].name + '</td></tr>');

            });


        });
    },
    this));

});


$(function() {

    $('#search_track a').click(function(e) {
        $('#search_track').submit();
    });

    $('#search_track').submit(function(e) {
        e.preventDefault();
        $('#result').empty();
        $('h3').text($('#search_track input').val());
        $.ajax({
            url: "http://ws.spotify.com/search/1/track.json",
            data: {
                'q': $('#search_track input').val()
            },
            dataType: 'json'
        }).done(function(data) {
            console.log(data);
            $('h3').text(data.info.query);
            _.each(data.tracks,
            function(t, i) {
                $('<tr data-spurl="' + t.href + '"><td>    <i class="icon-music"></i></td><td>' + t.name + '</td><td>' + t.artists[0].name + '</td></tr>')
                .data('trackdata', t).appendTo('#result');
            });
            $('#result tr').click(function(e) {
                socket.emit('add_queue', $(e.target).parent('tr').data('trackdata'));
            });

        });
    });
});