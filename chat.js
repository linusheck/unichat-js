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
        "<div class='col-sm chat-alert'>" +
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
    add("message", username, message, self, time)
}

function add(thing, username, message, self, time) {
    const chatDiv = $("#chat-window");
    const c = self ? thing + "-y" : thing + "-o";
    const chatMessage = $(
        "<div class='row-lg' style='clear: both'>" +
        "<div class='" + c + "'>\n" +
        "    <span></span>\n" +
        "    <span class='time'>" + time + "</span>" + (self ? "\xa0\xa0" : "") +
        "    <span class='name'><b>" + username + "</b></span>\n" + (!self ? "\xa0\xa0" : "") +
        "    <br>\n" +
        (thing === "message" ?
                "    <span class='message'>" + message + "</span>\n" :
                "    <img src=" + message +">"
        ) +
        "</div>\n" +
        "</div>" +
        "<div class='row-md form-group' style='clear: both;'></div>"
    );

    var scrolledDown = isScrolledDown();
    chatDiv.append(chatMessage);
    if (scrolledDown) {
        scrollDown();
    }
}

function addImage(username, image, self, time) {
    add("image", username, image, self, time)
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


function sendImageAsBase64(ev, depth) {
    if (depth === undefined) {
        depth = 0;
    }
    if (depth >= 5) {
        addChatAlert("Could not load your image");
        return;
    }
    var file = ev.target.files[0];
    var reader = new FileReader();
    reader.addEventListener("load", function () {
        var img = new Image();
        img.src = reader.result;
        if (img.width === 0 && img.height === 0) {
            // Yes. This just retries the process.
            // I was forced to do this by JS. Contact me if you have a better solution
            sendImageAsBase64(ev, depth + 1);
            return;
        }
        var res = resizeImage(img);
        webSocket.send(JSON.stringify({
            type: "image",
            image: res
        }));
        $('#image-select').slideToggle();
    });
    reader.onerror = function (ev2) {
        sendImageAsBase64(ev);
    };
    reader.readAsDataURL(file);
}

function resizeImage(img) {
    var MAX_WIDTH = 400;
    var MAX_HEIGHT = 400;
    var width = img.width;
    var height = img.height;

    if (width > height) {
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
        }
    }
    var canvas = $("#canvas")[0];
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg");
}