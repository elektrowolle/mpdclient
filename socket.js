function Socket (host, port, connectedE) {
    this.host           = host;
    this.port           = port;
    this.socketHandle   = null;
    this.connectedEvent = connectedE;
    this.listener       = [];
    this.errorListener  = [];

    this.init();
}

Socket.prototype = {
    constructor: Socket,

    init: function () {
        this.log("Create new Socket");

        var self = this;

        this.addReceiveListener(function (data) {
            self.log("data received: " + data);
        });

        this.addErrorListener(function (info) {
            self.log("Error while Receiving");
            self.log(info.resultCode);
        });

        chrome.sockets.tcp.onReceive     .addListener(function(info){self.toggleListener(info)});
        chrome.sockets.tcp.onReceiveError.addListener(function(info){self.toggleErrorListener(info)});



        chrome.sockets.tcp.create({bufferSize:4096*128}, function (handle) {
            self.socketHandle = handle.socketId;

            self.log("Handle is " + self.socketHandle);

            self.connect();
        });
    },


    connect: function () {
        var self = this;

        chrome.sockets.tcp.connect(this.socketHandle, this.host, this.port, function (result) {
            self.log("connected:" + result);
            if(typeof self.connectedEvent == "function")self.connectedEvent();
        })
    },

    log: function (msg) {
        console.log(
            "["
            + this.socketHandle
            + ":"
            + this.host
            + ":"
            + this.port
            + "]: "
            + msg);
    },

    addReceiveListener: function (f) {
        this.listener.push(f);
    },

    addErrorListener: function (f) {
        this.errorListener.push(f);
    },

    toggleListener: function(info){
        if(info.socketId != this.socketHandle) return;

        for(var _listener in this.listener){
            this.listener[_listener](abToS(info.data), info);
        }
    },

    toggleErrorListener: function(info){
        if(info.socketId != this.socketHandle) return;

        for(var _listener in this.errorListener){
            this.errorListener[_listener](info.resultCode);
        }
    },

    continue: function (f) {
        chrome.sockets.tcp.setPaused(this.socketHandle, false, f);
    },

    
    send: function (data) {
        var self = this;
        var ab   = str2ab(data + '\n');


        chrome.sockets.tcp.send(this.socketHandle, ab, function (sendInfo) {
            self.log(
                    "Sent[bytes: "
                    + sendInfo.bytesSent
                    + ":"
                    + sendInfo.resultCode
                    + "]: "
                    + abToS(ab)
            );
        })
    }
};

abToS = function(ab){
    var f = "";
    var u = new Uint8Array(ab);
    for(var _s in u){
        f = f+(String.fromCharCode(u[_s]));
    }
    return f;
};

str2ab = function(str) {
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    var strLen=str.length;
    for (var i=0; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

