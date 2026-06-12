export const typeDefs = `#graphql
  enum Role {
    CUSTOMER
    DRIVER
    ADMIN
  }

  enum VerificationStatus {
    PENDING
    APPROVED
    REJECTED
  }

  enum DocumentType {
    DRIVING_LICENSE
    AADHAAR
    PAN_CARD
    VEHICLE_CERTIFICATE
  }

  type User {
    id: ID!
    fullName: String!
    email: String!
    phone: String!
    role: Role!
    profileImage: String
    isVerified: Boolean!
    createdAt: String!
    updatedAt: String!
    driverProfile: DriverProfile
  }

  type DriverProfile {
    id: ID!
    userId: ID!
    licenseNumber: String!
    experienceYears: Int!
    availabilityStatus: Boolean!
    verificationStatus: VerificationStatus!
    createdAt: String!
    updatedAt: String!
    user: User!
    documents: [DriverDocument!]!
  }

  type DriverDocument {
    id: ID!
    driverId: ID!
    documentType: DocumentType!
    documentUrl: String!
    uploadedAt: String!
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  type Query {
    me: User
    getUserProfile(userId: ID!): User
    getAllDrivers: [DriverProfile!]!
    getDriverById(driverId: ID!): DriverProfile
  }

  type Mutation {
    registerCustomer(
      fullName: String!
      email: String!
      phone: String!
      password: String!
    ): AuthResponse!

    registerDriver(
      fullName: String!
      email: String!
      phone: String!
      password: String!
      licenseNumber: String!
      experienceYears: Int!
    ): AuthResponse!

    login(
      email: String!
      password: String!
    ): AuthResponse!

    updateProfile(
      fullName: String
      phone: String
      profileImage: String
    ): User!

    uploadDriverDocument(
      documentType: DocumentType!
      documentUrl: String!
    ): DriverDocument!

    verifyDriver(driverId: ID!): DriverProfile!
    rejectDriver(driverId: ID!): DriverProfile!
    changePassword(oldPassword: String!, newPassword: String!): Boolean!
  }
`;
