"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const schema_1 = require("./schema");
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.resolve(__dirname, '../../cashball.sqlite');
exports.db = new sqlite3_1.default.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
    else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});
function initDb() {
    exports.db.exec(schema_1.schemaSQL, (err) => {
        if (err) {
            console.error('Error applying schema:', err.message);
        }
        else {
            console.log('Database schema applied successfully.');
        }
    });
}
