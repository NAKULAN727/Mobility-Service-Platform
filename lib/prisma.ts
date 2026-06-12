import bcrypt from "bcryptjs";

export type Role = "CUSTOMER" | "DRIVER" | "ADMIN";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DocumentType = "DRIVING_LICENSE" | "AADHAAR" | "PAN_CARD" | "VEHICLE_CERTIFICATE";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  profileImage: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  experienceYears: number;
  availabilityStatus: boolean;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverDocument {
  id: string;
  driverId: string;
  documentType: DocumentType;
  documentUrl: string;
  uploadedAt: Date;
}

// ---------------------------------------------------------------------------
// Global singleton store — survives Next.js hot module replacement in dev
// ---------------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __db: {
    users: User[];
    driverProfiles: DriverProfile[];
    driverDocuments: DriverDocument[];
    seeded: boolean;
  } | undefined;
}

if (!global.__db) {
  global.__db = { users: [], driverProfiles: [], driverDocuments: [], seeded: false };
}

const db = global.__db;

if (!db.seeded) {
  const hashedPassword = bcrypt.hashSync("password123", 10);

  db.users = [
    {
      id: "admin-id-123",
      fullName: "System Admin",
      email: "admin@drivemate.com",
      phone: "+919999999999",
      password: hashedPassword,
      role: "ADMIN",
      profileImage: null,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "customer-id-123",
      fullName: "Jane Customer",
      email: "customer@drivemate.com",
      phone: "+918888888888",
      password: hashedPassword,
      role: "CUSTOMER",
      profileImage: null,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "driver-id-123",
      fullName: "Bob Driver",
      email: "driver@drivemate.com",
      phone: "+917777777777",
      password: hashedPassword,
      role: "DRIVER",
      profileImage: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  db.driverProfiles = [
    {
      id: "driver-profile-id-123",
      userId: "driver-id-123",
      licenseNumber: "DL-9876543210",
      experienceYears: 6,
      availabilityStatus: true,
      verificationStatus: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  db.driverDocuments = [];
  db.seeded = true;
}

// ---------------------------------------------------------------------------
// Prisma-compatible mock client
// ---------------------------------------------------------------------------
export const prisma = {
  $disconnect: async () => {},

  user: {
    findUnique: async (args: { where: { id?: string; email?: string } }): Promise<User | null> => {
      if (args.where.id) return db.users.find(u => u.id === args.where.id) ?? null;
      if (args.where.email) return db.users.find(u => u.email === args.where.email) ?? null;
      return null;
    },

    create: async (args: { data: any }): Promise<User> => {
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 11),
        fullName: args.data.fullName,
        email: args.data.email,
        phone: args.data.phone,
        password: args.data.password,
        role: args.data.role,
        profileImage: args.data.profileImage ?? null,
        isVerified: args.data.isVerified ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.users.push(newUser);

      if (args.data.driverProfile?.create) {
        const dp = args.data.driverProfile.create;
        db.driverProfiles.push({
          id: Math.random().toString(36).substring(2, 11),
          userId: newUser.id,
          licenseNumber: dp.licenseNumber,
          experienceYears: dp.experienceYears,
          availabilityStatus: dp.availabilityStatus ?? true,
          verificationStatus: dp.verificationStatus ?? "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return newUser;
    },

    update: async (args: { where: { id: string }; data: any }): Promise<User> => {
      const idx = db.users.findIndex(u => u.id === args.where.id);
      if (idx === -1) throw new Error("User not found");
      db.users[idx] = { ...db.users[idx], ...args.data, updatedAt: new Date() };
      return db.users[idx];
    },
  },

  driverProfile: {
    findMany: async (_args?: any): Promise<DriverProfile[]> => {
      return [...db.driverProfiles].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    findUnique: async (args: { where: { id?: string; userId?: string } }): Promise<DriverProfile | null> => {
      if (args.where.id) return db.driverProfiles.find(d => d.id === args.where.id) ?? null;
      if (args.where.userId) return db.driverProfiles.find(d => d.userId === args.where.userId) ?? null;
      return null;
    },

    update: async (args: { where: { id: string }; data: any }): Promise<DriverProfile> => {
      const idx = db.driverProfiles.findIndex(d => d.id === args.where.id);
      if (idx === -1) throw new Error("Driver profile not found");
      db.driverProfiles[idx] = { ...db.driverProfiles[idx], ...args.data, updatedAt: new Date() };
      return db.driverProfiles[idx];
    },
  },

  driverDocument: {
    findMany: async (args: { where: { driverId: string } }): Promise<DriverDocument[]> => {
      return db.driverDocuments.filter(doc => doc.driverId === args.where.driverId);
    },

    upsert: async (args: {
      where: { driverId_documentType: { driverId: string; documentType: DocumentType } };
      update: any;
      create: any;
    }): Promise<DriverDocument> => {
      const { driverId, documentType } = args.where.driverId_documentType;
      const idx = db.driverDocuments.findIndex(
        doc => doc.driverId === driverId && doc.documentType === documentType
      );
      if (idx !== -1) {
        db.driverDocuments[idx] = { ...db.driverDocuments[idx], ...args.update, uploadedAt: new Date() };
        return db.driverDocuments[idx];
      }
      const created: DriverDocument = {
        id: Math.random().toString(36).substring(2, 11),
        driverId,
        documentType: args.create.documentType,
        documentUrl: args.create.documentUrl,
        uploadedAt: new Date(),
      };
      db.driverDocuments.push(created);
      return created;
    },
  },
};
