
var buddyList = {};

function getBuddyList() {
    const buddyString = getCookie("unichat-buddy-list");
    try {
        if (buddyString != null) {
            buddyList = JSON.parse(buddyString);
        }
    } catch (e) {

    }

}

function buddyListAdd(id, username) {
    buddyList[id] = username;
}

function buddyListRemove(id) {
    delete buddyList[id];
}

function saveBuddyList() {
    setCookie("unichat-buddy-list", JSON.stringify(buddyList));
}

function deleteBuddyList() {
    setCookie("unichat-buddy-list", null);
}