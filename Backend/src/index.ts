import app from "./app";
import { connectDB, prisma } from "./lib/prisma";

const PORT = process.env.PORT || 5000;

async function startServer() {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error("❌ Exiting process because database connection failed.");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log("🔌 Prisma disconnected. Server terminated.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});
