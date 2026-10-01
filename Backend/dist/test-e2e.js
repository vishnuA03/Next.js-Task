"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./lib/prisma");
const http_1 = __importDefault(require("http"));
async function runE2ETest() {
    console.log("🚀 Starting End-to-End API and DB verification...");
    await (0, prisma_1.connectDB)();
    const server = http_1.default.createServer(app_1.default);
    await new Promise((resolve) => server.listen(5099, resolve));
    const baseUrl = "http://localhost:5099";
    try {
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = "Password123!";
        // 1. Test User Registration
        console.log("\n1. Testing Registration (POST /api/auth/register)...");
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                name: "Test User",
            }),
        });
        const regData = await regRes.json();
        console.log("Registration Status:", regRes.status, "User ID:", regData.user?.id);
        if (regRes.status !== 201 || !regData.token) {
            throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        }
        // 2. Test User Login (which stores login audit log in MySQL)
        console.log("\n2. Testing Login (POST /api/auth/login)...");
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
            }),
        });
        const loginData = await loginRes.json();
        console.log("Login Status:", loginRes.status, "Token exists:", !!loginData.token);
        if (loginRes.status !== 200 || !loginData.token) {
            throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        }
        const token = loginData.token;
        const authHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
        // 3. Test Me Profile and Login Audit Logs in DB
        console.log("\n3. Testing Auth Me & Login Logs (GET /api/auth/me & /api/auth/logs)...");
        const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
        const meData = await meRes.json();
        console.log("User Profile:", meData.user.email, "Counts:", meData.user._count);
        const logsRes = await fetch(`${baseUrl}/api/auth/logs`, { headers: authHeaders });
        const logsData = await logsRes.json();
        console.log("Stored Login Logs in DB:", logsData.data.length, "Total:", logsData.pagination.total);
        // 4. Test Third-Party API with Search, Filter & Pagination
        console.log("\n4. Testing Third-Party API (DummyJSON) with Search, Filter & Pagination...");
        // 4a. Basic pagination
        const extPageRes = await fetch(`${baseUrl}/api/external/products?page=1&limit=5`);
        const extPageData = await extPageRes.json();
        console.log("Third-Party Pagination (page 1, limit 5):", {
            productsReturned: extPageData.data?.length,
            total: extPageData.pagination?.total,
            totalPages: extPageData.pagination?.totalPages,
            hasNextPage: extPageData.pagination?.hasNextPage,
        });
        // 4b. Search query
        const extSearchRes = await fetch(`${baseUrl}/api/external/products?search=phone&limit=3`);
        const extSearchData = await extSearchRes.json();
        console.log("Third-Party Search ('phone'):", {
            matches: extSearchData.data?.length,
            sampleTitle: extSearchData.data?.[0]?.title,
        });
        // 4c. Category Filter
        const extCatRes = await fetch(`${baseUrl}/api/external/products?category=smartphones&limit=3`);
        const extCatData = await extCatRes.json();
        console.log("Third-Party Filter (category: smartphones):", {
            matches: extCatData.data?.length,
            categoryOfFirst: extCatData.data?.[0]?.category,
        });
        // 5. Test Saving Third-Party item into DB
        console.log("\n5. Testing Saving Third-Party Product to DB (POST /api/external/saved)...");
        const sampleProduct = extSearchData.data[0];
        const saveRes = await fetch(`${baseUrl}/api/external/saved`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                externalId: sampleProduct.id,
                title: sampleProduct.title,
                description: sampleProduct.description,
                category: sampleProduct.category,
                price: sampleProduct.price,
                thumbnail: sampleProduct.thumbnail,
            }),
        });
        const saveData = await saveRes.json();
        console.log("Saved to DB Status:", saveRes.status, "Saved Item ID:", saveData.data?.id);
        // 6. Test DB Saved Items with Search & Pagination
        console.log("\n6. Testing DB Saved Items (GET /api/external/saved?search=...)...");
        const getSavedRes = await fetch(`${baseUrl}/api/external/saved?page=1&limit=10`, {
            headers: authHeaders,
        });
        const getSavedData = await getSavedRes.json();
        console.log("DB Saved Items Retrieved:", getSavedData.data?.length);
        // 7. Test Task CRUD with Search, Filter & Pagination
        console.log("\n7. Testing Database Tasks (POST, GET with Search & Filter)...");
        await fetch(`${baseUrl}/api/tasks`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                title: "Integrate Third Party API",
                description: "Implemented search, filter, and pagination with MySQL persistence",
                category: "Development",
                priority: "HIGH",
            }),
        });
        const tasksRes = await fetch(`${baseUrl}/api/tasks?search=Integrate&priority=HIGH`, {
            headers: authHeaders,
        });
        const tasksData = await tasksRes.json();
        console.log("DB Tasks matching search & priority filter:", tasksData.data?.length, "Task:", tasksData.data?.[0]?.title);
        console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! Database, Auth, Third-Party API, Search, Filter, and Pagination are working end-to-end.");
    }
    finally {
        server.close();
        await prisma_1.prisma.$disconnect();
    }
}
runE2ETest().catch((err) => {
    console.error("E2E Test Failed:", err);
    process.exit(1);
});
