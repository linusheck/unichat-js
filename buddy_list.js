
var buddyList = [];

function getBuddyList() {
    buddyList = getCookie("unichat-buddy-list").split(",");
}

function saveBuddyList() {
    setCookie("unichat-buddy-list", buddyList.join());
}

function deleteBuddyList() {
    setCookie("unichat-buddy-list", null);
}