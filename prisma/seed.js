"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, admin, customer, driver, vehicle1, vehicle2, vehicle3, vehicle4, location1, location2, location3, booking1, booking2, booking3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Cleaning up existing database records...");
                    return [4 /*yield*/, prisma.payment.deleteMany()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma.booking.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.location.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.vehicle.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.driverDocument.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.driverProfile.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 7:
                    _a.sent();
                    console.log("Seeding Users & Drivers...");
                    hashedPassword = bcrypt.hashSync("password123", 10);
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                id: "admin-id-123",
                                fullName: "System Admin",
                                email: "admin@drivemate.com",
                                phone: "+919999999999",
                                password: hashedPassword,
                                role: client_1.Role.ADMIN,
                                isVerified: true,
                            },
                        })];
                case 8:
                    admin = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                id: "customer-id-123",
                                fullName: "Jane Customer",
                                email: "customer@drivemate.com",
                                phone: "+918888888888",
                                password: hashedPassword,
                                role: client_1.Role.CUSTOMER,
                                isVerified: true,
                            },
                        })];
                case 9:
                    customer = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                id: "driver-id-123",
                                fullName: "Bob Driver",
                                email: "driver@drivemate.com",
                                phone: "+917777777777",
                                password: hashedPassword,
                                role: client_1.Role.DRIVER,
                                isVerified: false,
                                driverProfile: {
                                    create: {
                                        id: "driver-profile-id-123",
                                        licenseNumber: "DL-9876543210",
                                        experienceYears: 6,
                                        availabilityStatus: true,
                                        verificationStatus: client_1.VerificationStatus.PENDING,
                                    },
                                },
                            },
                        })];
                case 10:
                    driver = _a.sent();
                    console.log("Seeding Vehicles...");
                    return [4 /*yield*/, prisma.vehicle.create({
                            data: {
                                vehicleNumber: "TX-9988-B",
                                vehicleType: client_1.VehicleType.SEDAN,
                                model: "Toyota Camry Hybrid 2024",
                                seatingCapacity: 4,
                                availabilityStatus: client_1.AvailabilityStatus.AVAILABLE,
                            },
                        })];
                case 11:
                    vehicle1 = _a.sent();
                    return [4 /*yield*/, prisma.vehicle.create({
                            data: {
                                vehicleNumber: "SUV-1122-C",
                                vehicleType: client_1.VehicleType.SUV,
                                model: "Tesla Model X 2023",
                                seatingCapacity: 6,
                                availabilityStatus: client_1.AvailabilityStatus.BOOKED,
                            },
                        })];
                case 12:
                    vehicle2 = _a.sent();
                    return [4 /*yield*/, prisma.vehicle.create({
                            data: {
                                vehicleNumber: "LX-7777-A",
                                vehicleType: client_1.VehicleType.LUXURY,
                                model: "Mercedes-Benz S-Class 2024",
                                seatingCapacity: 4,
                                availabilityStatus: client_1.AvailabilityStatus.MAINTENANCE,
                            },
                        })];
                case 13:
                    vehicle3 = _a.sent();
                    return [4 /*yield*/, prisma.vehicle.create({
                            data: {
                                vehicleNumber: "VN-5544-D",
                                vehicleType: client_1.VehicleType.VAN,
                                model: "Ford Transit Custom 2022",
                                seatingCapacity: 12,
                                availabilityStatus: client_1.AvailabilityStatus.AVAILABLE,
                            },
                        })];
                case 14:
                    vehicle4 = _a.sent();
                    console.log("Seeding Locations (Routes)...");
                    return [4 /*yield*/, prisma.location.create({
                            data: {
                                pickupLocation: "JFK International Airport Terminal 4, NY",
                                destinationLocation: "Times Square Manhattan, NY",
                                distance: 28.5,
                                estimatedDuration: 45,
                            },
                        })];
                case 15:
                    location1 = _a.sent();
                    return [4 /*yield*/, prisma.location.create({
                            data: {
                                pickupLocation: "Grand Central Terminal, NY",
                                destinationLocation: "Metropolitan Museum of Art, NY",
                                distance: 4.2,
                                estimatedDuration: 15,
                            },
                        })];
                case 16:
                    location2 = _a.sent();
                    return [4 /*yield*/, prisma.location.create({
                            data: {
                                pickupLocation: "Brooklyn Bridge Park, NY",
                                destinationLocation: "LaGuardia Airport Terminal B, NY",
                                distance: 16.8,
                                estimatedDuration: 30,
                            },
                        })];
                case 17:
                    location3 = _a.sent();
                    console.log("Seeding Bookings...");
                    return [4 /*yield*/, prisma.booking.create({
                            data: {
                                customerId: "cust-uuid-001",
                                driverId: "driver-uuid-101",
                                vehicleId: vehicle1.id,
                                bookingType: client_1.BookingType.VEHICLE_AND_DRIVER,
                                locationId: location1.id,
                                bookingDate: new Date("2026-06-10T00:00:00Z"),
                                bookingTime: "08:30:00",
                                fareAmount: 85.50,
                                bookingStatus: client_1.BookingStatus.TRIP_COMPLETED,
                            },
                        })];
                case 18:
                    booking1 = _a.sent();
                    return [4 /*yield*/, prisma.booking.create({
                            data: {
                                customerId: "cust-uuid-002",
                                driverId: "driver-uuid-102",
                                vehicleId: null,
                                bookingType: client_1.BookingType.DRIVER_ONLY,
                                locationId: location2.id,
                                bookingDate: new Date("2026-06-12T00:00:00Z"),
                                bookingTime: "14:00:00",
                                fareAmount: 35.00,
                                bookingStatus: client_1.BookingStatus.TRIP_STARTED,
                            },
                        })];
                case 19:
                    booking2 = _a.sent();
                    return [4 /*yield*/, prisma.booking.create({
                            data: {
                                customerId: "cust-uuid-003",
                                driverId: null,
                                vehicleId: vehicle4.id,
                                bookingType: client_1.BookingType.VEHICLE_AND_DRIVER,
                                locationId: location3.id,
                                bookingDate: new Date("2026-06-13T00:00:00Z"),
                                bookingTime: "18:15:00",
                                fareAmount: 65.00,
                                bookingStatus: client_1.BookingStatus.REQUESTED,
                            },
                        })];
                case 20:
                    booking3 = _a.sent();
                    console.log("Seeding Payments...");
                    // Payment for Booking 1 (SUCCESS)
                    return [4 /*yield*/, prisma.payment.create({
                            data: {
                                bookingId: booking1.id,
                                amount: 85.50,
                                paymentMethod: client_1.PaymentMethod.CARD,
                                paymentStatus: client_1.PaymentStatus.SUCCESS,
                                transactionId: "CARD-TX-9922883344",
                            },
                        })];
                case 21:
                    // Payment for Booking 1 (SUCCESS)
                    _a.sent();
                    // Payment for Booking 2 (PENDING)
                    return [4 /*yield*/, prisma.payment.create({
                            data: {
                                bookingId: booking2.id,
                                amount: 35.00,
                                paymentMethod: client_1.PaymentMethod.UPI,
                                paymentStatus: client_1.PaymentStatus.PENDING,
                                transactionId: "UPI-TX-1122334455",
                            },
                        })];
                case 22:
                    // Payment for Booking 2 (PENDING)
                    _a.sent();
                    // Payment for Booking 3 (PENDING)
                    return [4 /*yield*/, prisma.payment.create({
                            data: {
                                bookingId: booking3.id,
                                amount: 65.00,
                                paymentMethod: client_1.PaymentMethod.CARD,
                                paymentStatus: client_1.PaymentStatus.PENDING,
                                transactionId: null,
                            },
                        })];
                case 23:
                    // Payment for Booking 3 (PENDING)
                    _a.sent();
                    console.log("Database Seeding Completed Successfully!");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error("Error during database seeding:", e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
