"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.JWT_SECRET = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
exports.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-cashball-key';
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Missing credentials' });
    const hash = await bcryptjs_1.default.hash(password, 10);
    db_1.db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function (err) {
        if (err)
            return res.status(400).json({ error: 'Username taken' });
        const token = jsonwebtoken_1.default.sign({ id: this.lastID, username }, exports.JWT_SECRET);
        res.json({ token, user: { id: this.lastID, username } });
    });
});
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db_1.db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user)
            return res.status(401).json({ error: 'Invalid credentials' });
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, exports.JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username } });
    });
});
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
router.get('/me', exports.authMiddleware, (req, res) => {
    res.json({ user: req.user });
});
exports.default = router;
