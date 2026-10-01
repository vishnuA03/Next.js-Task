"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.getLoginLogs = getLoginLogs;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const auth_schema_1 = require("../validation/auth.schema");
// Register a new user
async function register(req, res) {
    try {
        const parseResult = auth_schema_1.registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
            return;
        }
        const { email, password, name } = parseResult.data;
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            res.status(409).json({ error: "An account with this email already exists" });
            return;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Create user in database
        const user = await prisma_1.prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({ userId: user.id, email: user.email });
        res.status(201).json({
            message: "User registered successfully",
            user,
            token,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
}
// Login user and store login audit log in DB
async function login(req, res) {
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        null;
    const userAgent = req.headers["user-agent"] || null;
    try {
        const parseResult = auth_schema_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
            return;
        }
        const { email, password } = parseResult.data;
        // Find user by email
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            // Record failed login attempt in database
            await prisma_1.prisma.loginLog.create({
                data: {
                    userId: user.id,
                    ipAddress: ipAddress ? String(ipAddress) : null,
                    userAgent: userAgent ? String(userAgent) : null,
                    status: "FAILED",
                },
            });
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Record successful login in DB and update lastLoginAt
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.loginLog.create({
                data: {
                    userId: user.id,
                    ipAddress: ipAddress ? String(ipAddress) : null,
                    userAgent: userAgent ? String(userAgent) : null,
                    status: "SUCCESS",
                },
            }),
            prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            }),
        ]);
        // Generate token
        const token = (0, jwt_1.generateToken)({ userId: user.id, email: user.email });
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                lastLoginAt: new Date(),
            },
            token,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to authenticate" });
    }
}
// Get current authenticated user profile
async function getMe(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                lastLoginAt: true,
                createdAt: true,
                _count: {
                    select: {
                        tasks: true,
                        loginLogs: true,
                        savedItems: true,
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
}
// Get login history / audit logs stored in DB for the current user
async function getLoginLogs(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;
        const [total, logs] = await Promise.all([
            prisma_1.prisma.loginLog.count({ where: { userId: req.user.id } }),
            prisma_1.prisma.loginLog.findMany({
                where: { userId: req.user.id },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);
        res.json({
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("Get login logs error:", error);
        res.status(500).json({ error: "Failed to fetch login logs" });
    }
}
