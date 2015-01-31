function Socket (host, port) {
    this.host              = host;
    this.port              = port;
    this.socketHandle      = null;

    this.log("Create new Socket");

    var self = this;

    chrome.sockets.tcp.create({}, function (handle) {
        self.socketHandle = handle.socketId;

        self.log("Handle is " + self.socketHandle);

        self.addReceiveListener(function (info) {
            self.log("data received: " + abToS(info.data));
        });

        chrome.sockets.tcp.onReceiveError.addListener(function (info) {
            self.log("Error while Receiving");
            console.log(info);
        });

        self.connect();
    });


}

Socket.prototype = {
    constructor: Socket,

    connect: function () {
        var self = this;

        chrome.sockets.tcp.connect(this.socketHandle, this.host, this.port, function (result) {
            self.log("connected:" + result);
        })
    },

    log: function (msg) {
        console.log("[" + this.host + ":" + this.port + "]: " + msg);
    },

    addReceiveListener: function (f) {
        chrome.sockets.tcp.onReceive.addListener(f);
    },

    
    send: function (data) {
        var self = this;
        var ab   = str2ab(data);


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
}

abToS = function(ab){
    var f = "";
    var u = new Uint8Array(ab);
    for(var _s in u){
        f=f+(String.fromCharCode(u[_s]));
    }
    return f;
};

str2ab = function(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    var strLen=str.length;
    for (var i=0; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}