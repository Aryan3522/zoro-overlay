const axios = require("axios");
const overlay = require("./overlay.store");
const { broadcastOverlay } = require("../socket/socket");

let cachedLiveVideoId = null;

/**
 * Grabs the Live Video ID using the official YouTube Search API.
 * Costs 100 Quota units.
 */
const getLiveVideoId = async (channelId, apiKey) => {
    try {
        const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                channelId: channelId,
                eventType: "live",
                type: "video",
                key: apiKey
            }
        });

        const items = response.data.items;
        if (items && items.length > 0) {
            return items[0].id.videoId;
        }
        
        return null; // Not live
    } catch (error) {
        console.error("[YouTube] Error searching for live video:", error.message);
        return null;
    }
};

/**
 * Fetches Live Video statistics (Likes, Concurrent Viewers)
 * Costs 1 Quota unit.
 */
const getVideoStatistics = async (videoId, apiKey) => {
    try {
        const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
            params: {
                part: "liveStreamingDetails,statistics",
                id: videoId,
                key: apiKey
            }
        });

        const items = response.data.items;
        if (items && items.length > 0) {
            const stats = items[0].statistics || {};
            const liveDetails = items[0].liveStreamingDetails || {};
            
            return {
                likes: parseInt(stats.likeCount, 10) || 0,
                liveViewers: parseInt(liveDetails.concurrentViewers, 10) || 0,
                // Check if the stream has ended
                isLive: !!liveDetails.concurrentViewers
            };
        }
        return null;
    } catch (error) {
        console.error("[YouTube] Error fetching video statistics:", error.message);
        return null;
    }
};

/**
 * Fetches Channel statistics (Subs, Views, Videos)
 * Costs 1 Quota unit.
 */
const getChannelStatistics = async (channelId, apiKey) => {
    try {
        const response = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
            params: {
                part: "statistics",
                id: channelId,
                key: apiKey
            }
        });

        const items = response.data.items;
        if (items && items.length > 0) {
            const stats = items[0].statistics;
            return {
                subscribers: parseInt(stats.subscriberCount, 10) || 0,
                totalViews: parseInt(stats.viewCount, 10) || 0,
                totalVideos: parseInt(stats.videoCount, 10) || 0
            };
        } else {
            console.error("[YouTube ERROR] The API returned no channel data. Your CHANNEL_ID is likely incorrect.");
        }
        return null;
    } catch (error) {
        console.error("[YouTube] Error fetching channel statistics:", error.message);
        return null;
    }
};

const startPolling = () => {
    console.log("[YouTube] Starting Smart Polling service (120s interval)...");
    
    const fetchAndUpdate = async () => {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const channelId = process.env.CHANNEL_ID;

        if (!apiKey || !channelId) {
            console.warn("[YouTube] Missing API Key or Channel ID in .env. Skipping fetch.");
            return;
        }

        if (!channelId.startsWith("UC")) {
            console.error("[YouTube ERROR] Your CHANNEL_ID in .env is invalid! It MUST start with 'UC' (e.g. UCX6OQ3DkcsbYNE6H8uQqukA). Do not use handles like @Aryan.");
        }

        let updated = false;

        // 1. Fetch Channel Stats (Subs, Total Views)
        const channelStats = await getChannelStatistics(channelId, apiKey);
        if (channelStats) {
            console.log(`[YouTube] Successfully fetched channel stats. Subscribers: ${channelStats.subscribers}`);
            if (overlay.subscribers !== channelStats.subscribers) {
                overlay.subscribers = channelStats.subscribers;
                updated = true;
            }
            if (overlay.totalViews !== channelStats.totalViews) {
                overlay.totalViews = channelStats.totalViews;
                updated = true;
            }
            if (overlay.totalVideos !== channelStats.totalVideos) {
                overlay.totalVideos = channelStats.totalVideos;
                updated = true;
            }
        }

        // 2. Manage Live Video State
        if (!cachedLiveVideoId) {
            cachedLiveVideoId = await getLiveVideoId(channelId, apiKey);
            if (cachedLiveVideoId) {
                console.log(`[YouTube] Detected live stream! Video ID: ${cachedLiveVideoId}`);
            }
        }

        // 3. Fetch Live Video Stats if we are live
        if (cachedLiveVideoId) {
            const videoStats = await getVideoStatistics(cachedLiveVideoId, apiKey);
            if (videoStats) {
                if (overlay.likes !== videoStats.likes) {
                    overlay.likes = videoStats.likes;
                    updated = true;
                }
                if (overlay.liveViewers !== videoStats.liveViewers) {
                    overlay.liveViewers = videoStats.liveViewers;
                    updated = true;
                }
                
                // Reset cached ID if stream ended (no concurrent viewers returned)
                if (!videoStats.isLive) {
                    console.log("[YouTube] Live stream appears to have ended. Resetting cached Video ID.");
                    cachedLiveVideoId = null;
                    overlay.liveViewers = 0; // Reset live viewers to 0
                    updated = true;
                }
            } else {
                // If API fails to return the video entirely, clear cache to try again later
                cachedLiveVideoId = null;
            }
        }
        
        // Broadcast automatically if any data changed
        if (updated) {
            broadcastOverlay();
        }
    };

    // Fetch immediately, then every 120 seconds minimum gap
    fetchAndUpdate();
    setInterval(fetchAndUpdate, 120000);
};

module.exports = {
    getLiveVideoId,
    getVideoStatistics,
    getChannelStatistics,
    startPolling
};
