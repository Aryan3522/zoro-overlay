const overlay = require("./overlay.store");
const { broadcastOverlay } = require("../socket/socket");

const updateLatestSubscriber = (name) => {
    if (name) {
        overlay.latestSubscriber = name;
        broadcastOverlay();
    }
};

const updateLatestDonation = (donationDetails) => {
    if (donationDetails) {
        overlay.latestDonation = donationDetails;
        broadcastOverlay();
    }
};

const updateLatestMember = (memberName) => {
    if (memberName) {
        overlay.latestMember = memberName;
        broadcastOverlay();
    }
};

module.exports = {
    updateLatestSubscriber,
    updateLatestDonation,
    updateLatestMember
};
