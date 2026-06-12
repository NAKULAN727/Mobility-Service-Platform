import { GraphQLError } from "graphql";
import { prisma } from "../prisma";
import { hashPassword, comparePassword, signToken } from "../auth";
import { GraphQLContext } from "./context";

// Helper for authentication check
function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return context.user;
}

// Helper for admin authorization check
function requireAdmin(context: GraphQLContext) {
  const user = requireAuth(context);
  if (user.role !== "ADMIN") {
    throw new GraphQLError("Access denied. Admin role required.", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return user;
}

// Helper for driver authorization check
function requireDriver(context: GraphQLContext) {
  const user = requireAuth(context);
  if (user.role !== "DRIVER") {
    throw new GraphQLError("Access denied. Driver role required.", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return user;
}

// Validation helpers
function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone: string): boolean {
  // Simple phone check
  const re = /^\+?[0-9\s-]{10,15}$/;
  return re.test(phone);
}

export const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      return prisma.user.findUnique({
        where: { id: authUser.userId },
      });
    },

    getUserProfile: async (_parent: any, { userId }: { userId: string }, context: GraphQLContext) => {
      const authUser = requireAuth(context);

      // A user can view their own profile, but only admins can view other users' profiles
      if (authUser.role !== "ADMIN" && authUser.userId !== userId) {
        throw new GraphQLError("Access denied. You can only view your own profile.", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      return prisma.user.findUnique({
        where: { id: userId },
      });
    },

    getAllDrivers: async (_parent: any, _args: any, context: GraphQLContext) => {
      requireAdmin(context);
      return prisma.driverProfile.findMany({
        orderBy: { createdAt: "desc" },
      });
    },

    getDriverById: async (_parent: any, { driverId }: { driverId: string }, context: GraphQLContext) => {
      const authUser = requireAuth(context);

      // Find the profile first
      const profile = await prisma.driverProfile.findUnique({
        where: { id: driverId },
      });

      if (!profile) {
        throw new GraphQLError("Driver profile not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Customer, Admin or the Driver themselves can view
      if (
        authUser.role !== "ADMIN" &&
        authUser.role !== "CUSTOMER" &&
        authUser.userId !== profile.userId
      ) {
        throw new GraphQLError("Access denied", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      return profile;
    },
  },

  Mutation: {
    registerCustomer: async (
      _parent: any,
      { fullName, email, phone, password }: any
    ) => {
      // Input validations
      if (!fullName || fullName.trim().length < 2) {
        throw new GraphQLError("Name must be at least 2 characters long", { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (!validateEmail(email)) {
        throw new GraphQLError("Invalid email address", { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (!validatePhone(phone)) {
        throw new GraphQLError("Invalid phone number", { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (!password || password.length < 6) {
        throw new GraphQLError("Password must be at least 6 characters long", { extensions: { code: "BAD_USER_INPUT" } });
      }

      // Check duplicate email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new GraphQLError("Email is already registered", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          fullName,
          email,
          phone,
          password: hashedPassword,
          role: "CUSTOMER",
          isVerified: true, // Customers do not need admin approval to be verified
        },
      });

      const token = signToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      return { token, user };
    },

    registerDriver: async (
      _parent: any,
      { fullName, email, phone, password, licenseNumber, experienceYears }: any
    ) => {
      // Input validations
      if (!fullName || fullName.trim().length < 2) {
        throw new GraphQLError("Name must be at least 2 characters long", { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (!validateEmail(email)) {
        throw new GraphQLError("Invalid email address", { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (!validatePhone(phone)) {
        throw new GraphQLError("Invalid phone number", { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (!password || password.length < 6) {
        throw new GraphQLError("Password must be at least 6 characters long", { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (!licenseNumber || licenseNumber.trim().length < 5) {
        throw new GraphQLError("Invalid driving license number", { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (experienceYears < 0) {
        throw new GraphQLError("Experience years cannot be negative", { extensions: { code: "BAD_USER_INPUT" } });
      }

      // Check duplicate email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new GraphQLError("Email is already registered", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          fullName,
          email,
          phone,
          password: hashedPassword,
          role: "DRIVER",
          isVerified: false, // Drivers start as unverified until admin approves
          driverProfile: {
            create: {
              licenseNumber,
              experienceYears,
              availabilityStatus: true,
              verificationStatus: "PENDING",
            },
          },
        },
      });

      const token = signToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      return { token, user };
    },

    login: async (_parent: any, { email, password }: any) => {
      if (!validateEmail(email)) {
        throw new GraphQLError("Invalid email address", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new GraphQLError("Invalid email or password", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        throw new GraphQLError("Invalid email or password", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const token = signToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      return { token, user };
    },

    updateProfile: async (
      _parent: any,
      { fullName, phone, profileImage }: any,
      context: GraphQLContext
    ) => {
      const authUser = requireAuth(context);

      const updateData: any = {};
      if (fullName !== undefined) {
        if (fullName.trim().length < 2) {
          throw new GraphQLError("Name must be at least 2 characters long", { extensions: { code: "BAD_USER_INPUT" } });
        }
        updateData.fullName = fullName;
      }
      if (phone !== undefined) {
        if (!validatePhone(phone)) {
          throw new GraphQLError("Invalid phone number", { extensions: { code: "BAD_USER_INPUT" } });
        }
        updateData.phone = phone;
      }
      if (profileImage !== undefined) {
        updateData.profileImage = profileImage;
      }

      return prisma.user.update({
        where: { id: authUser.userId },
        data: updateData,
      });
    },

    uploadDriverDocument: async (
      _parent: any,
      { documentType, documentUrl }: any,
      context: GraphQLContext
    ) => {
      const authUser = requireDriver(context);

      // Find the driver's profile ID
      const profile = await prisma.driverProfile.findUnique({
        where: { userId: authUser.userId },
      });

      if (!profile) {
        throw new GraphQLError("Driver profile not found", { extensions: { code: "NOT_FOUND" } });
      }

      // Upsert document (unique constraint on driverId + documentType)
      return prisma.driverDocument.upsert({
        where: {
          driverId_documentType: {
            driverId: profile.id,
            documentType,
          },
        },
        update: {
          documentUrl,
          uploadedAt: new Date(),
        },
        create: {
          driverId: profile.id,
          documentType,
          documentUrl,
        },
      });
    },

    verifyDriver: async (_parent: any, { driverId }: { driverId: string }, context: GraphQLContext) => {
      requireAdmin(context);

      // Update driver profile status to APPROVED
      const updatedProfile = await prisma.driverProfile.update({
        where: { id: driverId },
        data: { verificationStatus: "APPROVED" },
      });

      // Also set the related user as verified
      await prisma.user.update({
        where: { id: updatedProfile.userId },
        data: { isVerified: true },
      });

      return updatedProfile;
    },

    rejectDriver: async (_parent: any, { driverId }: { driverId: string }, context: GraphQLContext) => {
      requireAdmin(context);

      // Update driver profile status to REJECTED
      const updatedProfile = await prisma.driverProfile.update({
        where: { id: driverId },
        data: { verificationStatus: "REJECTED" },
      });

      // Set user verification as false
      await prisma.user.update({
        where: { id: updatedProfile.userId },
        data: { isVerified: false },
      });

      return updatedProfile;
    },

    changePassword: async (
      _parent: any,
      { oldPassword, newPassword }: any,
      context: GraphQLContext
    ) => {
      const authUser = requireAuth(context);

      const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
      });

      if (!user) {
        throw new GraphQLError("User not found", { extensions: { code: "NOT_FOUND" } });
      }

      const match = await comparePassword(oldPassword, user.password);
      if (!match) {
        throw new GraphQLError("Incorrect current password", { extensions: { code: "BAD_USER_INPUT" } });
      }

      if (!newPassword || newPassword.length < 6) {
        throw new GraphQLError("New password must be at least 6 characters long", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const hashedNew = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: authUser.userId },
        data: { password: hashedNew },
      });

      return true;
    },
  },

  User: {
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
    driverProfile: async (parent: any) => {
      if (parent.role !== "DRIVER") return null;
      return prisma.driverProfile.findUnique({
        where: { userId: parent.id },
      });
    },
  },

  DriverProfile: {
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
    user: async (parent: any) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
    documents: async (parent: any) => {
      return prisma.driverDocument.findMany({
        where: { driverId: parent.id },
      });
    },
  },

  DriverDocument: {
    uploadedAt: (parent: any) => parent.uploadedAt.toISOString(),
  },
};
