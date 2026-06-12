import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing users
  await prisma.user.deleteMany({});
  console.log("Cleared existing users.");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      fullName: "System Admin",
      email: "admin@drivemate.com",
      phone: "+919999999999",
      password: hashedPassword,
      role: "ADMIN",
      isVerified: true,
    },
  });
  console.log(`Created Admin: ${admin.email}`);

  // 2. Create Customer
  const customer = await prisma.user.create({
    data: {
      fullName: "Jane Customer",
      email: "customer@drivemate.com",
      phone: "+918888888888",
      password: hashedPassword,
      role: "CUSTOMER",
      isVerified: true,
    },
  });
  console.log(`Created Customer: ${customer.email}`);

  // 3. Create Driver
  const driver = await prisma.user.create({
    data: {
      fullName: "Bob Driver",
      email: "driver@drivemate.com",
      phone: "+917777777777",
      password: hashedPassword,
      role: "DRIVER",
      isVerified: false,
      driverProfile: {
        create: {
          licenseNumber: "DL-9876543210",
          experienceYears: 6,
          availabilityStatus: true,
          verificationStatus: "PENDING",
        },
      },
    },
  });
  console.log(`Created Driver: ${driver.email}`);

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
