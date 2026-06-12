-- Approve all pending drivers so Manual Booking marketplace can list them.
-- Run: npx prisma db execute --file prisma/seed-marketplace-drivers.sql

UPDATE "DriverProfile"
SET "verificationStatus" = 'APPROVED',
    "availabilityStatus" = true
WHERE "verificationStatus" = 'PENDING';
