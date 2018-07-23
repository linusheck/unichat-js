function buildRooms(list) {
    var roomList = $("<ul class='rooms list-group' style='display: none;'>");
    for (j in list.rooms) {
        var room = list.rooms[j];
        console.log(room.name);
        roomList.append(
            $("<li class='list-group-item'>").append(
                $("<a href='javascript:void(0);' link-id='" + room.chatRoomId + "'>" + room.name + "&nbsp"
                    + "</a>").click(function (e) {
                    var target = $(e.target);
                    var chatRoomId = target.attr("link-id");
                    var username = getCookie("unichat-username");
                    if (!username) {
                        username = prompt("Your nickname:");
                    }
                    if (!username) return;
                    const password = $("#password").val();
                    if (password !== "") {
                        sessionStorage.setItem("privateKey", password);
                    }
                    window.location.replace("chat.html?id=" + chatRoomId + "&username=" + username);
                }),
                $("<span style='color: #6b6c6b;'>" + (room.onlineUsers !== 0 ? "\xa0(" + room.onlineUsers
                    + " online)" : "") + "\xa0" + room.current + "</span>")
            )
        );
    }
    $("#room-select").append(
        $("<li class='list-group-item'>").append(
            $("<a href='javascript:void(0);' style='text-decoration: none'>" + list.name + "</a>").click(function (e) {
                var target = $(e.target);
                var rooms = target.find(".rooms");
                rooms.slideToggle();
            }).append(
                roomList
            )
        )
    );
    return roomList;
}

var lastData = null;

function searchRooms(query) {
    console.log("Searching for " + query);
    $.get(url + "searchrooms?q=" + query, function (data) {
        if (lastData === data) {
            return;
        }
        lastData = data;
        $("#room-select").empty();
        var b = data;
        b.name = "";
        buildRooms(b).show();
    })
}

function getAllRooms() {

    lastData = null;
    $("#room-select").empty();
    $.get(url + "allrooms", function (data) {
        if (data.buildings.length === 0) {
            $("#room-select").append("<p>The server is booting up, " +
                "and currently retrieving the rooms from the RWTH. " +
                "Please try again in a minute or so. :)</p>");
        } else for (i in data.buildings) {
            var b = data.buildings[i];
            buildRooms(b);
        }
        $("#spinner").hide();
    })
}

setTimeout(getAllRooms, 100);


keyDown = false;

$("#search").keydown(function () {
    keyDown = true;
});

$("#search").keyup(function (e) {
    if (!keyDown) return;
    keyDown = false;
    var target = $(e.target);
    var text = target.val();
    if (text) {
        searchRooms(text);
    } else {
        getAllRooms();
    }
});

$("#username-btn").click(function(e) {
    const usernameInput = $("#username-input");
    setCookie("unichat-username", usernameInput.val(), 5000);
    usernameInput.val("")
});

$("#delete-username").click(function(e) {
    setCookie("unichat-username", null);
    $("#username-input").val("")
});

function showPassword() {
    $("#password").attr("type", "text")
}