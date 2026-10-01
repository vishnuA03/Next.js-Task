"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDB = connectDB;
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing in .env");
}
const adapter = new adapter_mariadb_1.PrismaMariaDb(connectionString);
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
async function connectDB() {
    try {
        await exports.prisma.$connect();
        // Verify connection by executing a lightweight query
        await exports.prisma.$queryRaw `SELECT 1`;
        console.log("✅ Successfully connected to MySQL database via Prisma.");
        return true;
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        return false;
    }
}
exports.default = exports.prisma;
