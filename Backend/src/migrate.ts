import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

async function run() {
  const connection = await mysql.createConnection(databaseUrl!);

  console.log("Creating/updating tables safely...");

  // 1. Ensure users table has lastLoginAt
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`email\` VARCHAR(191) NOT NULL UNIQUE,
      \`name\` VARCHAR(191) NULL,
      \`password\` VARCHAR(191) NOT NULL,
      \`lastLoginAt\` DATETIME(3) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Check if lastLoginAt exists in users
  const [userCols]: any = await connection.query("SHOW COLUMNS FROM `users` LIKE 'lastLoginAt'");
  if (userCols.length === 0) {
    await connection.query("ALTER TABLE `users` ADD COLUMN `lastLoginAt` DATETIME(3) NULL AFTER `password`");
    console.log("Added `lastLoginAt` column to `users` table.");
  }

  // 2. Ensure login_logs table exists
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`login_logs\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`userId\` INT NOT NULL,
      \`ipAddress\` VARCHAR(191) NULL,
      \`userAgent\` TEXT NULL,
      \`status\` VARCHAR(50) NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX \`login_logs_userId_idx\` (\`userId\`),
      CONSTRAINT \`login_logs_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("Verified `login_logs` table.");

  // 3. Ensure tasks table exists with columns
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`tasks\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`title\` VARCHAR(191) NOT NULL,
      \`description\` TEXT NULL,
      \`completed\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`category\` VARCHAR(191) NULL,
      \`priority\` VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
      \`userId\` INT NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX \`tasks_userId_idx\` (\`userId\`),
      CONSTRAINT \`tasks_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [taskCols]: any = await connection.query("SHOW COLUMNS FROM `tasks` LIKE 'category'");
  if (taskCols.length === 0) {
    await connection.query("ALTER TABLE `tasks` ADD COLUMN `category` VARCHAR(191) NULL");
    await connection.query("ALTER TABLE `tasks` ADD COLUMN `priority` VARCHAR(50) NOT NULL DEFAULT 'MEDIUM'");
    console.log("Added category/priority columns to tasks.");
  }

  // 4. Ensure saved_items table exists
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`saved_items\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`externalId\` INT NOT NULL,
      \`title\` VARCHAR(191) NOT NULL,
      \`description\` TEXT NULL,
      \`category\` VARCHAR(191) NULL,
      \`price\` DOUBLE NULL,
      \`thumbnail\` TEXT NULL,
      \`source\` VARCHAR(50) NOT NULL DEFAULT 'dummyjson',
      \`userId\` INT NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY \`saved_items_userId_externalId_source_key\` (\`userId\`, \`externalId\`, \`source\`),
      INDEX \`saved_items_userId_idx\` (\`userId\`),
      CONSTRAINT \`saved_items_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("Verified `saved_items` table.");

  await connection.end();
  console.log("✅ Database schema migration complete.");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
