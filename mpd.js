function Mpd(host, port){
    var self = this;

    this.cmdSocket = new Socket(host, port);
    this.statusSocket = new Socket(host, port, function () {
        //self.statusSocket.send("\nidle\n");
    });

    this.player   = new Mpd.Player(this);
    this.playlist = new Mpd.Playlist(this);

    this.statusSocket.addReceiveListener(function (info) {
        //console.log(""info);
        self.statusSocket.log("status: " + abToS(info.data));

        setTimeout(function () {
            self.idle();
        },300);

    })

    this.statusSocket.addErrorListener(function (info) {
        self.statusSocket.continue(function () {
            self.idle();
        });

    })
}

Mpd.prototype = {
    constructor: Mpd,

    idle: function(){
        this.statusSocket.send("idle");
    }
}

Mpd.Player = function (mpd){
    this.mpd  = mpd;
    this.Song = new Mpd.Song();
}

Mpd.Player.prototype = {
    constructor: Mpd.Player,

    play: function(songId){
        this.mpd.cmdSocket.send("play" + (typeof songId != "undefined" ? (" " + songId) : ""))
    },

    stop: function () {
        this.mpd.cmdSocket.send("stop");
    },

    next: function () {
        this.mpd.cmdSocket.send("next");
    },

    pause: function() {
        this.mpd.cmdSocket.send("pause");
    },

    previous: function () {
        this.mpd.cmdSocket.send("previous");
    },

    seekcur: function (t) {
        this.mpd.cmdSocket.send("seek " + t);
    }
}

Mpd.Song = function(mpd, _artist, _title, _album, _track, _pos, _id){
    this.mpd = mpd;

    this.artist = _artist;
    this.title  = _title ;
    this.album  = _album ;
    this.track  = _track ;
    this.pos    = _pos   ;
    this.id     = _id    ;
}

Mpd.Song.createFromString = function(mpd, str){
    var artist = "";
    var title  = "";
    var album  = "";
    var track  = "";
    var pos    = "";
    var id     = "";

    var re  = /(.+): (.+)/gmi;
    var rem = /(.+): (.+)/i;

    var seperatedSt = str.match(re);

    seperatedSt.forEach(function (st) {
        var data = st.match(rem);
        switch (data[1]){

            case "Artist":
                artist = data[2];
                break;

            case "Title" :
                title = data[2];
                break;

            case "Album" :
                album = data[2];
                break;

            case "Track" :
                track = data[2];
                break;

            case "Pos"   :
                pos = data[2];
                break;

            case "Id"    :
                id = data[2];
                break;

        }
    });

    return new Mpd.Song(mpd, artist, title, album, track, pos, id);
}

Mpd.Playlist = function (mpd){
    this.mpd  = mpd;
}

Mpd.Playlist.prototype = {
    constructor: Mpd.Player,

    add: function (url) {
        this.mpd.cmdSocket.send("add " + url);
    },

    clear: function () {
        this.mpd.cmdSocket.send("clear");
    },

    delete: function(start, end){
        this.mpd.cmdSocket(
            "delete "
            + start
            + typeof end != "undefined" ? end : ""
        );
    },

    info: function () {
        this.mpd.cmdSocket.send("playlistinfo");
    },

    shuffle: function () {
        this.mpd.cmdSocket.send("shuffle");
    },

    move: function(to, start, end){
        this.mpd.cmdSocket(
            "move "
            + start
            + typeof end != "undefined " ? end : " "
            + to
        );
    }
}