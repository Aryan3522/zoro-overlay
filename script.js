console.log("Overlay Loaded - Real-Time Architecture");

// Initialize Socket.IO connection
const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("[Socket.IO] Connected to backend:", socket.id);
});

// Calculate Giveaway Stats
const calculateGiveaway = (current, goal) => {
    const safeGoal = goal > 0 ? goal : 1;
    let percentage = (current / safeGoal) * 100;
    if (percentage > 100) percentage = 100; // Cap at 100%
    
    const remaining = goal - current;
    
    return {
        percentage,
        remaining: remaining > 0 ? remaining : 0,
        current,
        goal
    };
};

// Calculate Today's Goal Stats
const calculateTodayGoal = (currentSubs, goalSubs, currentLikes, goalLikes) => {
    const subsRemaining = goalSubs - currentSubs;
    const likesRemaining = goalLikes - currentLikes;
    
    const safeGoalSubs = goalSubs > 0 ? goalSubs : 1;
    const safeGoalLikes = goalLikes > 0 ? goalLikes : 1;
    
    let subsPercentage = (currentSubs / safeGoalSubs) * 100;
    let likesPercentage = (currentLikes / safeGoalLikes) * 100;
    
    return {
        subsRemaining: subsRemaining > 0 ? subsRemaining : 0,
        likesRemaining: likesRemaining > 0 ? likesRemaining : 0,
        subsPercentage: subsPercentage > 100 ? 100 : subsPercentage,
        likesPercentage: likesPercentage > 100 ? 100 : likesPercentage
    };
};

// Listen for overlay data updates from the backend
socket.on("overlay", (data) => {
    console.log("[Socket.IO] Received overlay update:", data);

    // Update Top Stats
    const likesEl = document.getElementById("likes");
    if (likesEl) likesEl.textContent = data.likes;

    const subsEl = document.getElementById("subs");
    if (subsEl) subsEl.textContent = data.subscribers;

    const latestSubMiniEl = document.getElementById("latestSubMini");
    if (latestSubMiniEl) {
        let subName = data.latestSubscriber;
        
        // If Streamer.bot fails to parse the variable, it passes the literal string.
        // We catch all common literal variable strings here and show nothing.
        const invalidNames = ["%username%", "%user%", "%name%", "username", "name"];
        
        if (!subName || invalidNames.includes(subName.toLowerCase())) {
            subName = "-"; // Show a dash or nothing if there's no valid name
        }
        
        latestSubMiniEl.textContent = subName;
    }

    // Process Today's Goals
    const todayStats = calculateTodayGoal(
        data.subscribers, 
        data.todayGoalSubs, 
        data.likes, 
        data.todayGoalLikes
    );

    const goalSubsEl = document.getElementById("goalSubs");
    if (goalSubsEl) goalSubsEl.textContent = `👤 ${data.subscribers} / ${data.todayGoalSubs}`;

    const goalLikesEl = document.getElementById("goalLikes");
    if (goalLikesEl) goalLikesEl.textContent = `👍 ${data.likes} / ${data.todayGoalLikes}`;

    // Process Giveaway Progress
    const giveawayStats = calculateGiveaway(data.subscribers, data.giveawayGoal);

    const currentSubsEl = document.getElementById("currentSubs");
    if (currentSubsEl) currentSubsEl.textContent = giveawayStats.current;
    
    const targetSubsEl = document.getElementById("targetSubs");
    if (targetSubsEl) targetSubsEl.textContent = giveawayStats.goal;

    const giveawayFillEl = document.getElementById("giveawayFill");
    if (giveawayFillEl) {
        giveawayFillEl.style.width = `${giveawayStats.percentage}%`;
    }

    // Process Total Views (if added to HTML)
    const totalViewsEl = document.getElementById("totalViews");
    if (totalViewsEl) totalViewsEl.textContent = data.totalViews;

    // Process Live Viewers (if added to HTML)
    const liveViewersEl = document.getElementById("liveViewers");
    if (liveViewersEl) liveViewersEl.textContent = data.liveViewers;

    // Future Widgets (Uptime, etc. are in data object, ready to be attached to DOM)
});

socket.on("disconnect", () => {
    console.log("[Socket.IO] Disconnected from backend.");
});