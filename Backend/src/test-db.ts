import { connectDB, prisma } from "./lib/prisma";

async function main() {
  console.log("Testing database connection...");
  const isConnected = await connectDB();
  if (isConnected) {
    const userCount = await prisma.user.count();
    const taskCount = await prisma.task.count();
    console.log(`Database tables ready. Users: ${userCount}, Tasks: ${taskCount}`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
