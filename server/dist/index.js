"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_1 = require("./socket");
const rooms_1 = __importDefault(require("./routes/rooms"));
const tactics_1 = __importDefault(require("./routes/tactics"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Rate limiting
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);
const httpServer = (0, http_1.createServer)(app);
exports.io = (0, socket_1.setupSocket)(httpServer);
// Basic routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CashBall Server is running' });
});
// Game Routes
app.use('/api/rooms', rooms_1.default);
app.use('/api/tactics', tactics_1.default);
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
