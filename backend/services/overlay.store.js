const fs = require("fs");
const path = require("path");
require("dotenv").config();

// The single source of truth for the overlay
const overlay = {
    subscribers: 0,
    totalViews: 0,
    totalVideos: 0,
    liveViewers: 0,
    likes: 0,
    latestSubscriber: "",
    latestDonation: "",
    latestMember: "",
    giveawayGoal: parseInt(process.env.GIVEAWAY_GOAL, 10) || 500,
    todayGoalSubs: parseInt(process.env.TODAY_SUB_GOAL, 10) || 350,
    todayGoalLikes: parseInt(process.env.TODAY_LIKE_GOAL, 10) || 25,
    uptime: "00:00:00"
};

// Attempt to load persisted latest subscriber and dynamic goals from disk on boot
const storePath = path.join(__dirname, "../data/store.json");
try {
    if (fs.existsSync(storePath)) {
        const rawData = fs.readFileSync(storePath, "utf8");
        const parsedData = JSON.parse(rawData);
        
        if (parsedData.latestSubscriber) overlay.latestSubscriber = parsedData.latestSubscriber;
        if (parsedData.giveawayGoal) overlay.giveawayGoal = parsedData.giveawayGoal;
        if (parsedData.todayGoalSubs) overlay.todayGoalSubs = parsedData.todayGoalSubs;
        if (parsedData.todayGoalLikes) overlay.todayGoalLikes = parsedData.todayGoalLikes;
        
        console.log(`[Store] Loaded persistent data. Latest Sub: ${overlay.latestSubscriber}`);
    }
} catch (error) {
    console.error("[Store ERROR] Failed to load store.json on boot:", error.message);
}

module.exports = overlay;
