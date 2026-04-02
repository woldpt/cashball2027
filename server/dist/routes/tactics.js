"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("./auth");
const ai_1 = require("../engine/ai");
const matchLoop_1 = require("../engine/matchLoop");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post("/submit", (req, res) => {
    const userId = req.user.id;
    const { roomId, formation, style, starting_eleven, subs } = req.body;
    if (!roomId || !formation)
        return res.status(400).json({ error: "Missing params" });
    // 1. Get the room's current week & state
    db_1.db.get("SELECT current_week, game_state FROM rooms WHERE id = ?", [roomId], (err, room) => {
        if (err || !room)
            return res.status(404).json({ error: "Room err" });
        if (room.game_state !== "IN_PROGRESS" &&
            room.game_state !== "PRE_MATCH") {
            return res
                .status(400)
                .json({ error: "Game is not waiting for tactics right now." });
        }
        // 2. Identify the active club of this user
        db_1.db.get("SELECT club_id FROM managers WHERE room_id = ? AND user_id = ? AND status = ?", [roomId, userId, "ACTIVE"], (err, manager) => {
            if (err || !manager)
                return res
                    .status(403)
                    .json({ error: "Not an active manager in this room" });
            const clubId = manager.club_id;
            const currentWeek = room.current_week;
            // 3. Find the match ID for this club in the current week
            db_1.db.get("SELECT id FROM matches WHERE room_id = ? AND week = ? AND (home_club_id = ? OR away_club_id = ?)", [roomId, currentWeek, clubId, clubId], (err, match) => {
                if (err || !match)
                    return res
                        .status(400)
                        .json({
                        error: "No match for you this week (calendar empty?)",
                    });
                const matchId = match.id;
                db_1.db.serialize(() => {
                    db_1.db.run("BEGIN TRANSACTION");
                    // Update or insert tactic
                    db_1.db.get("SELECT id FROM tactics WHERE match_id = ? AND club_id = ?", [matchId, clubId], (err, existingTactic) => {
                        if (existingTactic) {
                            db_1.db.run("UPDATE tactics SET formation = ?, style = ?, starting_eleven = ?, subs = ?, submitted = 1 WHERE id = ?", [
                                formation,
                                style,
                                JSON.stringify(starting_eleven || []),
                                JSON.stringify(subs || []),
                                existingTactic.id,
                            ]);
                        }
                        else {
                            db_1.db.run("INSERT INTO tactics (match_id, club_id, formation, style, submitted, starting_eleven, subs) VALUES (?, ?, ?, ?, 1, ?, ?)", [
                                matchId,
                                clubId,
                                formation,
                                style,
                                JSON.stringify(starting_eleven || []),
                                JSON.stringify(subs || []),
                            ]);
                        }
                        db_1.db.run("COMMIT", async (err) => {
                            if (err)
                                return res
                                    .status(500)
                                    .json({ error: "DB commit error" });
                            res.json({ message: "Tactic submitted successfully." });
                            // Gate Logic: Check if all HUMAN managers submitted
                            checkGateAndExecute(roomId, currentWeek);
                        });
                    });
                });
            });
        });
    });
});
router.post("/substitute", (req, res) => {
    const userId = req.user.id;
    const { roomId, formation, style } = req.body;
    if (!roomId || !style)
        return res.status(400).json({ error: "Missing params" });
    db_1.db.get("SELECT current_week, game_state FROM rooms WHERE id = ?", [roomId], (err, room) => {
        if (err || !room)
            return res.status(404).json({ error: "Room err" });
        // Substitutions only allowed during MATCH_DAY_LIVE (specifically at halftime pause)
        if (room.game_state !== "MATCH_DAY_LIVE") {
            return res
                .status(400)
                .json({
                error: "Substitutions are only allowed during the live match.",
            });
        }
        db_1.db.get("SELECT club_id FROM managers WHERE room_id = ? AND user_id = ? AND status = ?", [roomId, userId, "ACTIVE"], (err, manager) => {
            if (err || !manager)
                return res.status(403).json({ error: "Unauthorized" });
            const clubId = manager.club_id;
            db_1.db.get("SELECT id FROM matches WHERE room_id = ? AND week = ? AND (home_club_id = ? OR away_club_id = ?)", [roomId, room.current_week, clubId, clubId], (err, match) => {
                if (err || !match)
                    return res.status(400).json({ error: "No live match found" });
                db_1.db.run("UPDATE tactics SET formation = ?, style = ? WHERE match_id = ? AND club_id = ?", [formation, style, match.id, clubId], (err) => {
                    if (err)
                        return res.status(500).json({ error: "DB Error" });
                    res.json({ message: "Tactic updated for 2nd half!" });
                });
            });
        });
    });
});
// NEW ENDPOINT: Get players for squad selection
router.get("/squad", (req, res) => {
    const userId = req.user.id;
    const roomId = req.query.roomId;
    if (!roomId)
        return res.status(400).json({ error: "Missing roomId" });
    db_1.db.get("SELECT club_id FROM managers WHERE room_id = ? AND user_id = ? AND status = ?", [roomId, userId, "ACTIVE"], (err, manager) => {
        if (err || !manager)
            return res.status(403).json({ error: "Not a manager" });
        db_1.db.all("SELECT id, name, position, quality, salary, aggressiveness, craque FROM players WHERE club_id = ? ORDER BY position ASC, quality DESC", [manager.club_id], (err, players) => {
            if (err)
                return res.status(500).json({ error: "DB error" });
            res.json({ players: players || [] });
        });
    });
});
async function checkGateAndExecute(roomId, week) {
    // Get count of active human managers
    db_1.db.get("SELECT COUNT(*) as c FROM managers WHERE room_id = ? AND status = ?", [roomId, "ACTIVE"], (err, row) => {
        if (err || !row)
            return;
        const humanCount = row.c;
        // Get count of submitted tactics by humans this week
        db_1.db.get(`
      SELECT COUNT(*) as c 
      FROM tactics t
      JOIN managers m ON m.club_id = t.club_id
      WHERE t.match_id IN (SELECT id FROM matches WHERE room_id = ? AND week = ?)
      AND m.room_id = ? AND m.status = 'ACTIVE'
      AND t.submitted = 1
    `, [roomId, week, roomId], async (err, rowT) => {
            const submittedCount = rowT ? rowT.c : 0;
            console.log(`✅ Room ${roomId} Week ${week} Gate Check: ${submittedCount} / ${humanCount}`);
            if (submittedCount >= humanCount) {
                // TRIGGER CORE ENGINE!
                console.log(`🚀 All humans ready! Triggering AutoAI and Match Loop for Room ${roomId}`);
                await (0, ai_1.autoSubmitAITactics)(roomId, week);
                // This runs asynchronously in background, emitting websockets
                (0, matchLoop_1.startMatchLoop)(roomId, week);
            }
        });
    });
}
exports.default = router;
