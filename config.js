var url;
var wsUrl;

if (document.location.href.indexOf("localhost") !== -1) {
    url = "http://localhost:4567/";
    wsUrl = "ws://127.0.0.1:4567/";
} else {
    url = "https://cha-th.herokuapp.com/";
    wsUrl = "wss://cha-th.herokuapp.com/";
}