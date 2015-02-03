var lastData = "";

function Mpd(host, port){
    var self = this;
    this.requestQueue = [];

    this.player       = new Mpd.Player(this);
    this.playlist     = new Mpd.Playlist(this);

    this.playlists                       = [];
    this.callBackOnstoredPlaylistsUpdate = [];

    this.cmdSocket = new Socket(host, port);
    this.statusSocket = new Socket(host, port, function () {
        //self.statusSocket.send("\nidle\n");
    });




    this.cmdSocket.addReceiveListener(function (msg) {
        self.processResult(msg);

    });

    this.statusSocket.addReceiveListener(function (info) {
        try{
            var updateStA = info.match(/^.+: (.+)$/mi);
            updateStA.shift();
            lastData = info;

            self.statusSocket.log("status: " + (info));

            updateStA.forEach(function(name){
                self.statusSocket.log("status changed: " + (name));
                switch(name){
                    case "player":
                        self.player.status();
                        break;

                    case "playlist":
                        self.playlist.info();
                        break;

                    case "stored_playlist":
                        self.listplaylists();
                        break;
                }
            })

        }catch(e){
            console.log("status unknown");
            console.log(info);
        }

        setTimeout(function () {
            self.idle();
        },300);

    });

    this.statusSocket.addErrorListener(function (info) {
        self.statusSocket.continue(function () {
            self.idle();
        });

    });

    setTimeout(function () {
        self.playlist.info();
    }, 1000)
}

Mpd.prototype = {
    constructor: Mpd,

    idle: function(){
        this.statusSocket.send("idle");
    },

    processResult: function(msg){
        var cmd = this.requestQueue.shift();
        console.log("cmd: " + cmd + "\ndata: " + msg);
        lastData = msg;

        switch (cmd){
            case "playlistinfo":
                this.playlist.processPlaylistinfo(msg);
                break;

            case "status":
                this.player.processStatus(msg);
                break;

            case "listplaylists":
                this.processListplaylists(msg);
                break;

        }
    },

    process: function(cmd, data){
        this.requestQueue.push(cmd);
        this.cmdSocket.send(cmd + (typeof data != "undefined" || data == "" ? " " + data : ""));

    },

    listplaylists: function(){
        this.process("listplaylists");
    },

    processListplaylists: function (msg) {
        var self       = this;
        this.playlists = [];

        splitIntoObject(msg, function (name, value) {
            if(name == "playlist") self.playlists.push(value);
        })

        this.storedPlaylistsUpdated();
    },

    storedPlaylistsUpdated: function () {
        var self = this;
        this.callBackOnstoredPlaylistsUpdate.forEach(
            function(e,i,a){
                e(self.playlists)
            });
    },

    addOnUpdateCallback: function (f) {
        this.callBackOnstoredPlaylistsUpdate.push(f);
    },

    removePlaylist: function (name) {
        this.process("rm", name);
    },

    addPlaylist: function (name, url) {
        this.process("playlistadd", name + " " + url);
    }
}


Mpd.Player = function (mpd, callBackOnUpdate){
    this.mpd              = mpd;
    this.callBackOnUpdate = [];

    this.properties = {
        song          : 0,
        repeat        : 0,
        random        : 0,
        single        : 0,
        playlist      : this.mpd.playlist,
        playlistlength: 0,
        state         : "play",
        time          : 0,
        elapsed       : 0
    };

    if(typeof callBackOnUpdate != "undefined")
        this.addOnUpdateCallback(callBackOnUpdate);

}

Mpd.Player.prototype = {
    constructor: Mpd.Player,

    play: function(songId){
        this.mpd.process(
            "play",
            typeof songId != "undefined" ? " " + songId : ""
        );
    },

    stop: function () {
        this.mpd.process("stop");
    },

    next: function () {
        this.mpd.process("next");
    },

    pause: function(b) {
        this.mpd.process("pause ",
            b ? 1 : 0);
    },

    previous: function () {
        this.mpd.process("previous");
    },

    seekcur: function (t) {
        this.mpd.process(
            "seek",
            t
        );
    },

    status: function () {
        this.mpd.process("status");
    },

    processStatus: function(msg) {
        var self = this;
        splitIntoObject(msg, function (name, value) {
            self.properties[name] = value;
        })

        this.playerUpdated();
    },


    playerUpdated: function () {
        this.callBackOnUpdate.forEach(function(e,i,a){e(this)});
    },

    addOnUpdateCallback: function (f) {
        this.callBackOnUpdate.push(f);
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

    //var seperatedSt = str.match(re);

    splitIntoObject(str, function (name, value) {
        switch (name){

            case "Artist":
                artist = value;
                break;

            case "Title" :
                title = value;
                break;

            case "Album" :
                album = value;
                break;

            case "Track" :
                track = value;
                break;

            case "Pos"   :
                pos = value;
                break;

            case "Id"    :
                id = value;
                break;

        }
    })

    return new Mpd.Song(mpd, artist, title, album, track, pos, id);
}

Mpd.Playlist = function (mpd, callBackOnUpdate){
    this.mpd              = mpd;
    this.callBackOnUpdate = [];
    this.songs            = [];
    this.name             = "";

    if(typeof callBackOnUpdate != "undefined")
        this.addOnUpdateCallback(callBackOnUpdate);
}

Mpd.Playlist.prototype = {
    constructor: Mpd.Player,

    add: function (url) {
        this.mpd.process(
            "add",
            url
        );
    },

    clear: function () {
        this.mpd.process("clear");
    },

    delete: function(start, end){
        var data = start
            + (typeof end != "undefined" ? end : "");
        this.mpd.process(
            "delete",
            data
        );
    },

    info: function () {
        this.mpd.process("playlistinfo");
    },

    shuffle: function () {
        this.mpd.process("shuffle");
    },

    move: function(to, start, end){
        this.mpd.process(
            "move",
            start
            + typeof end != "undefined" ? end : " "
            + to
        );
    },

    processPlaylistinfo: function(msg) {
        var self    = this;
        var re      = /file:.+\n/g;
        var songsSt = msg.split(re);
        var songs   = [];

        songsSt.shift();
        console.log(songsSt);

        songsSt.forEach(function(songSt){
            songs.push(Mpd.Song.createFromString(self.mpd, songSt));
        });

        console.log(songs);

        this.songs = songs;
        this.playlistUpdated();
        
    },
    
    playlistUpdated: function () {
        var self = this;
        this.callBackOnUpdate.forEach(function(e,i,a){e(self)});
    },

    addOnUpdateCallback: function (f) {
        this.callBackOnUpdate.push(f);
    },

    save: function (name) {
        this.mpd.process("save", name);
    },

    load: function (playlistName) {
        this.mpd.process("load", playlistName);
    }
}

splitIntoObject = function(st, forEachCallback){
    var re  = /(.+): (.+)/gmi;
    var rem = /(.+): (.+)/i;

    var obj = {};

    var seperatedSt = st.match(re);

    seperatedSt.forEach(function (st) {
        var data  = st.match(rem);
        var name  = data[1];
        var value = data[2];

        obj[data[1]] = data[2];

        if(typeof forEachCallback != "undefined") forEachCallback(name, value);
    })

    return obj;
}