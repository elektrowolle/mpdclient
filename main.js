var mpc         = {};
var $tabs       = $(".tab");
var $tabChooser = $(".tabChooser");

window.onload = function() {

    mpc = new Mpd("pi.lab", 6600);

    $tabChooser.click(function(){
        changeTab($(this).attr("data-tab"));
    });

    $("#navbar ul li").click(function(){
        $(".navbar-toggle").click()
    });

    $("#addSongBtn").click(function () {
        addSong();
    });

    $("#addPlaylistBtn").click(function () {
        addPlaylist();
    })

    mpc.playlist.addOnUpdateCallback(function (playlist) {
        buildSongList(playlist);
        mpc.player.status();
        mpc.listplaylists();
    });

    mpc.player.addOnUpdateCallback(function (player) {
        updatePlayer(player);
    });
    
    mpc.addOnUpdateCallback(function (playlists) {
        buildPlaylistList(playlists);
    });

    $(".playerBtn").click(function () {
        console.log(this);
        console.log("clicked");
        mpc.player[$(this).attr("data-player-fn")]();
    });

    changeTab("player");

};

function changeTab(tabName){
    var $tab         = $("#" + tabName + "Tab");
    var $_tabChooser = $(".tabChooser[data-tab=" + tabName + "]");

    $tabChooser .removeClass("active");
    $_tabChooser.addClass("active");

    $tabs.hide();
    $tab .show();
}



////Player

var buildSongList = function (playlist) {
    console.log("rebuild Playlist");
    var $playlist = $('.activePlaylist');


    $playlist.empty();

    playlist.songs.forEach(function(song, i, a){
        addSongToPlaylist($playlist, song);
    });
};

function addSongToPlaylist($playlist, song) {
    var $template = $($('#playlistSongItmT').html().trim());
    $template.attr("data-playlist-song-id", song.pos);
    $template.find(".playlistSongItmName").html(song.artist + " - " + song.title);
    $template.find(".playlistSongItmRemoveBtn").click(function(){removeSong(song)});
    $template.click(function(){playSong(song)});

    console.log("append " + song.title);

    $template.appendTo($playlist);
}

function playSong(song) {
    mpc.player.play(song.pos);
}

function removeSong(song){
    mpc.playlist.delete(song.pos);
}

function updatePlayer (player) {
    activateSongInPlaylist(mpc.player.properties.song);
}

function activateSongInPlaylist(song){
    console.log("activate song " + song);
    var $songItms = $(".playlistSongItm");
    var $playItm  = $(".playlistSongItm[data-playlist-song-id=" + song + "]");
    $songItms.removeClass("active");
    $playItm .addClass("active");
}

function addSong(){
    $form = $("#addSongForm");
    url   = $form.find("#songUrlInput").val();

    mpc.playlist.add(url);
}

////Playlist

var buildPlaylistList = function (playlists) {
    console.log("rebuild Playlist");
    var $playlists = $('.playlists');


    $playlists.empty();

    playlists.forEach(function(playlist, i, a){
        addToPlaylist($playlists, playlist);
    });
};

function addToPlaylist($playlist, playlist) {
    var $template = $($('#playlistItmT').html().trim());
    $template.attr("data-playlist-name", playlist);
    $template.find(".playlistItmName").html(playlist);
    $template.find(".playlistItmRemoveBtn").click(function(){removePlaylist(playlist)});
    $template.click(function(){choosePlaylist(playlist)});

    console.log("append " + playlist);

    $template.appendTo($playlist);
}

function choosePlaylist(playlist) {
    mpc.playlist.load(playlist);
}

function removePlaylist(playlist){
    mpc.removePlaylist(playlist);
}

function addPlaylist(){
    var $form = $("#addPlaylistForm");
    var url   = $form.find("#playlistUrlInput").val();
    var name  = $form.find("#playlistNameInput").val();

    mpc.addPlaylist(name, url);
}