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
function setupWebSocket() {
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
        for (var p in data) {
            if (data.hasOwnProperty(p) && (typeof data[p]) === "string") {
                data[p] = escapeHtml(data[p]);
            }
        }
        switch (data.type) {
            case "error":
                addChatAlert("Error: " + data.reason);
                break;
            case "message":
                addChatMessage(data.username, data.message, data.username === username, msToTime(data.time));
                break;
            case "image":
                addImage(data.username, data.image, data.username === username, msToTime(data.time));
                break;
            case "info-login":
                addChatAlert(data.username + " logged in!");
                break;
            case "info-logout":
                addChatAlert(data.username + " logged out!");
                break;

        }
    };
    webSocket.onclose = function (ev) {
        setTimeout(setupWebSocket, 100)
    }
}

setTimeout(setupWebSocket, 100);

function msToTime(ms) {
    return new Date(ms).toISOString().slice(11, 16);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
}

function addChatAlert(message) {
    const chatDiv = $("#chat-window");
    const alert = $(
        "<div class=\"col-sm chat-alert\">" +
        "    <span><b>" + message + "</b></span>" +
        "</div>"
    );
    chatDiv.append(alert);

    scrollDown();
}

function isScrolledDown() {
    const obj = $("#chat-window")[0];
    return (obj.scrollTop === Math.max((obj.scrollHeight - obj.offsetHeight) - 100, obj.scrollTop));
}

function scrollDown() {
    $(function () {
        $("#chat-window").scrollTop(1E10);
    });
}


function addChatMessage(username, message, self, time) {
    const chatDiv = $("#chat-window");
    const c = self ? "msg-y" : "msg-o";
    const chatMessage = $(
        "<div class=\"" + c + " col-sm\">\n" +
        "    <span></span>\n" +
        "    <span class=\"time\">" + time + "</span>\n" +
        "    <span class=\"name\"><b>" + username + "</b></span>\n" +
        "    <br>\n" +
        "    <span class=\"message\">" + message + "</span>\n" +
        "</div>\n" +
        "<div class=\"col-md-6 form-group\"></div>"
    );

    var scrolledDown = isScrolledDown();
    chatDiv.append(chatMessage);
    if (scrolledDown) {
        scrollDown();
    }
}

function addImage(username, image, self, time) {
    const chatDiv = $("#chat-window");
    const c = self ? "msg-y" : "msg-o";
    const chatMessage = $(
        "<div class=\"" + c + " col-sm\">\n" +
        "    <span></span>\n" +
        "    <span class=\"time\">" + time + "</span>\n" +
        "    <span class=\"name\"><b>" + username + "</b></span>\n" +
        "    <br>\n" +
        "    <img class=\"message\" src='" + image + "'/>\n" +
        "</div>\n" +
        "<div class=\"col-md-6 form-group\"></div>"
    );

    var scrolledDown = isScrolledDown();
    chatDiv.append(chatMessage);
    if (scrolledDown) {
        scrollDown();
    }
}

// On resize (i.e. on-screen-keyboard open), scroll down
$(window).on("resize", function () {
    scrollDown()
});


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

const imageUpload = $("#image-upload");

imageUpload.on('click touchstart', function () {
    $(this).val('');
});

imageUpload.change(sendImageAsBase64);

imageUpload.on("change", function (ev) {
    sendImageAsBase64(ev.target);
});


// THANK YOU https://stackoverflow.com/questions/6150289/how-to-convert-image-into-base64-string-using-javascript
function sendImageAsBase64(ev) {
    const element = ev.currentTarget;
    var file = element.files[0];
    var reader = new FileReader();
    reader.onloadend = function() {
        webSocket.send(JSON.stringify({
            type: "image",
            image: reader.result
        }));
    };
    reader.readAsDataURL(file);
}