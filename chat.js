// https://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-get-parameters
function getQueryParams(qs) {
    qs = qs.split('+').join(' ');

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}

// Get the chat room URL & nick name from HTML params
var thisUrl = window.location.href.split("?");
var params = getQueryParams(thisUrl[thisUrl.length - 1]);
var roomId = params["id"];
var username = params["username"];

// The web socket with which we connect to the server
var webSocket;

// Open web socket to server
setTimeout(function () {
    webSocket = new WebSocket(wsUrl + "chatsocket/");
    webSocket.onopen = function (ev) {
        // Send the login message to the server
        webSocket.send(JSON.stringify({
            type: "login",
            room: roomId,
            username: username
        }));
    };
    webSocket.onmessage = function (ev) {
        var data = JSON.parse(ev.data);
        console.log(data);
        switch (data.type) {
            case "error":
                $("body").append("<p>This Room does not exist :(</p>");
                break;
            case "message":
                addChatMessage(data.username + ": " + data.message);
                break;
            case "info-login":
                addChatMessage(data.username + " logged in!");
                break;
            case "info-logout":
                addChatMessage(data.username + " logged out!");
        }
    }
}, 100);

function addChatMessage(message) {
    const chatText = $("#chat-window")
    chatText.val(chatText.val() + "\n" + message);
}


// Enter press in text input
$('#chat-text').keypress(function (event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode === 13) {
        onSendClick();
    }
});

// Sends message that is in chat-text
function onSendClick() {
    var chatTextField = $("#chat-text");
    var text = chatTextField.val().trim();
    if (text === "") return;
    webSocket.send(JSON.stringify({
        type: "message",
        message: text
    }));
    chatTextField.val("");
}
