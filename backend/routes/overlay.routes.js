const express = require("express");
const router = express.Router();
const { getOverlay, updateOverlay, updateLatestSubscriber } = require("../controllers/overlay.controller");

// As per spec: GET /overlay, POST /overlay
router.get("/overlay", getOverlay);
router.post("/overlay", updateOverlay);

// Dedicated latestSubscriber endpoint
router.post("/latestSubscriber", updateLatestSubscriber);
router.get("/latestSubscriber", updateLatestSubscriber);

module.exports = router;
