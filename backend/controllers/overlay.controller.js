const overlay = require("../services/overlay.store");
const { broadcastOverlay } = require("../socket/socket");

const fs = require("fs");
const path = require("path");

const saveStore = () => {
    try {
        const storePath = path.join(__dirname, "../data/store.json");
        const dataDir = path.dirname(storePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Save the persistent fields
        const dataToSave = {
            latestSubscriber: overlay.latestSubscriber,
            giveawayGoal: overlay.giveawayGoal,
            todayGoalSubs: overlay.todayGoalSubs,
            todayGoalLikes: overlay.todayGoalLikes
        };
        
        fs.writeFileSync(storePath, JSON.stringify(dataToSave, null, 2));
        console.log("[Store] Successfully saved persistent data to store.json");
    } catch (fileError) {
        console.error("[Store ERROR] Could not save to store.json:", fileError.message);
    }
};

const getOverlay = (req, res) => {
    res.status(200).json(overlay);
};

const updateOverlay = (req, res) => {
    try {
        const updates = req.body;
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "Empty request body" });
        }

        // merge the object
        for (const key in updates) {
            if (updates.hasOwnProperty(key) && overlay.hasOwnProperty(key)) {
                overlay[key] = updates[key];
            }
        }

        // broadcast changes automatically
        broadcastOverlay();
        
        // persist any changes to goals
        saveStore();

        // return updated overlay
        res.status(200).json(overlay);
    } catch (error) {
        console.error("[Overlay] Error updating overlay:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateLatestSubscriber = (req, res) => {
    try {
        console.log(`[DEBUG Step 2] Received ${req.method} /latestSubscriber.`);
        
        // Support both POST (req.body) and GET (req.query)
        const name = req.body.name || req.query.name;
        
        if (!name) {
            console.log("[DEBUG] Missing name in body or query!");
            return res.status(400).json({ error: "Missing 'name' parameter" });
        }

        overlay.latestSubscriber = name;
        console.log("[DEBUG Step 3] overlayStore updated:", overlay);
        
        broadcastOverlay();
        saveStore();
        
        res.status(200).json(overlay);
    } catch (error) {
        console.error("[Overlay] Error updating latest subscriber:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getOverlay,
    updateOverlay,
    updateLatestSubscriber
};
