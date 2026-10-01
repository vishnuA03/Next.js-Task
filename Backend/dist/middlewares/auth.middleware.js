"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_1 = require("../lib/jwt");
const prisma_1 = require("../lib/prisma");
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
        return;
    }
    const token = authHeader.split(" ")[1];
    const payload = (0, jwt_1.verifyToken)(token);
    if (!payload) {
        res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
        return;
    }
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, name: true },
        });
        if (!user) {
            res.status(401).json({ error: "Unauthorized: User no longer exists" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ error: "Internal server error during authentication" });
    }
}
