var url;
var wsUrl;

if (document.location.href.indexOf("localhost") !== -1) {
    url = "http://localhost:4567/";
    wsUrl = "ws://127.0.0.1:4567/";
} else {
    url = "https://cha-th.herokuapp.com/";
    wsUrl = "wss://cha-th.herokuapp.com/";
}

var path = window.location.pathname;

const beginPrivate = "-----BEGIN RSA PRIVATE KEY-----$";
const endPrivate = "$-----END RSA PRIVATE KEY-----$";

function keyToPassw(key) {
    return key.split("\r\n").join("$").replace(beginPrivate, "").replace(endPrivate, "");
}

function passwToKey(password) {
    console.log(password);
    return (beginPrivate + password + endPrivate).split("$").join("\r\n");
}