const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const migrationName =
  "20260909225000_reconcile_existing_tree_schema";

const migrationPath = path.join(
  process.cwd(),
  "prisma",
  "migrations",
  migrationName,
  "migration.sql"
);

async function main() {
  if (!fs.existsSync(migrationPath)) {
    throw new Error(
      `Migration file not found: ${migrationPath}`
    );
  }

  const contents = fs.readFileSync(migrationPath);

  const checksum = crypto
    .createHash("sha256")
    .update(contents)
    .digest("hex");

  const existing = await prisma.$queryRawUnsafe(
    `
      SELECT
        migration_name,
        checksum,
        finished_at,
        rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name = $1
    `,
    migrationName
  );

  if (!existing.length) {
    throw new Error(
      `Migration ${migrationName} is not recorded in the database.`
    );
  }

  const migration = existing[0];

  console.log("Migration:", migrationName);
  console.log("Recorded checksum:", migration.checksum);
  console.log("Local checksum:   ", checksum);
  console.log("Finished at:      ", migration.finished_at);
  console.log("Rolled back at:   ", migration.rolled_back_at);

  if (migration.rolled_back_at) {
    throw new Error(
      "Migration is marked as rolled back. No checksum change was made."
    );
  }

  if (!migration.finished_at) {
    throw new Error(
      "Migration is not marked as successfully applied. No checksum change was made."
    );
  }

  if (migration.checksum === checksum) {
    console.log(
      "\nChecksum already matches. Nothing to change."
    );
    return;
  }

  const updated = await prisma.$executeRawUnsafe(
    `
      UPDATE "_prisma_migrations"
      SET checksum = $1
      WHERE migration_name = $2
    `,
    checksum,
    migrationName
  );

  if (updated !== 1) {
    throw new Error(
      `Expected to update 1 migration row, but updated ${updated}.`
    );
  }

  console.log(
    "\nChecksum synchronized successfully."
  );
}

main()
  .catch((error) => {
    console.error("\nERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });