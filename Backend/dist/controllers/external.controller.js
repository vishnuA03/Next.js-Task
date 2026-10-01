"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getCategories = getCategories;
exports.getProduct = getProduct;
exports.saveItem = saveItem;
exports.getSavedItems = getSavedItems;
exports.deleteSavedItem = deleteSavedItem;
const dummyjson_service_1 = require("../services/dummyjson.service");
const prisma_1 = require("../lib/prisma");
// Helper to safely parse numeric ID from request params
function getParamId(param) {
    if (!param)
        return NaN;
    const str = Array.isArray(param) ? param[0] : param;
    return parseInt(str, 10);
}
// Fetch products from third-party API with search, filter, and pagination
async function getProducts(req, res) {
    try {
        const { search, q, category, minPrice, maxPrice, sortBy, order, page, limit, } = req.query;
        const searchTerm = search || q || undefined;
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
        const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;
        const sortOrder = order === "desc" ? "desc" : "asc";
        const result = await (0, dummyjson_service_1.fetchThirdPartyProducts)({
            search: searchTerm,
            category: category,
            minPrice: isNaN(Number(minPriceNum)) ? undefined : minPriceNum,
            maxPrice: isNaN(Number(maxPriceNum)) ? undefined : maxPriceNum,
            sortBy: sortBy,
            order: sortOrder,
            page: isNaN(pageNum) ? 1 : pageNum,
            limit: isNaN(limitNum) ? 10 : limitNum,
        });
        res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        console.error("Error fetching third-party products:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch external data",
        });
    }
}
// Fetch all categories for filter options
async function getCategories(_req, res) {
    try {
        const categories = await (0, dummyjson_service_1.fetchCategories)();
        res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch categories",
        });
    }
}
// Fetch single product by id
async function getProduct(req, res) {
    try {
        const id = getParamId(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid product ID" });
            return;
        }
        const product = await (0, dummyjson_service_1.fetchProductById)(id);
        res.json({
            success: true,
            data: product,
        });
    }
    catch (error) {
        console.error(`Error fetching product:`, error);
        res.status(404).json({
            success: false,
            error: error instanceof Error ? error.message : "Product not found",
        });
    }
}
// Save an external product to DB for the authenticated user
async function saveItem(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { externalId, title, description, category, price, thumbnail } = req.body;
        if (!externalId || !title) {
            res.status(400).json({ error: "externalId and title are required" });
            return;
        }
        const saved = await prisma_1.prisma.savedItem.upsert({
            where: {
                userId_externalId_source: {
                    userId: req.user.id,
                    externalId: Number(externalId),
                    source: "dummyjson",
                },
            },
            update: {
                title,
                description: description || null,
                category: category || null,
                price: price ? parseFloat(price) : null,
                thumbnail: thumbnail || null,
            },
            create: {
                userId: req.user.id,
                externalId: Number(externalId),
                title,
                description: description || null,
                category: category || null,
                price: price ? parseFloat(price) : null,
                thumbnail: thumbnail || null,
                source: "dummyjson",
            },
        });
        res.status(201).json({
            message: "Item saved to database",
            data: saved,
        });
    }
    catch (error) {
        console.error("Save item error:", error);
        res.status(500).json({ error: "Failed to save item to database" });
    }
}
// Get saved items stored in DB with search, category filtering, and pagination
async function getSavedItems(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { search, category, page, limit } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;
        const where = {
            userId: req.user.id,
        };
        if (search && typeof search === "string" && search.trim().length > 0) {
            where.OR = [
                { title: { contains: search.trim() } },
                { description: { contains: search.trim() } },
            ];
        }
        if (category && typeof category === "string" && category.trim().length > 0) {
            where.category = { equals: category.trim() };
        }
        const [total, items] = await Promise.all([
            prisma_1.prisma.savedItem.count({ where }),
            prisma_1.prisma.savedItem.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limitNum,
            }),
        ]);
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        });
    }
    catch (error) {
        console.error("Get saved items error:", error);
        res.status(500).json({ error: "Failed to fetch saved items" });
    }
}
// Delete saved item
async function deleteSavedItem(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const id = getParamId(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid item ID" });
            return;
        }
        const item = await prisma_1.prisma.savedItem.findFirst({
            where: { id, userId: req.user.id },
        });
        if (!item) {
            res.status(404).json({ error: "Item not found or unauthorized" });
            return;
        }
        await prisma_1.prisma.savedItem.delete({ where: { id } });
        res.json({ message: "Item removed successfully" });
    }
    catch (error) {
        console.error("Delete saved item error:", error);
        res.status(500).json({ error: "Failed to delete saved item" });
    }
}
