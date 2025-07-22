"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const role_enum_1 = require("../enums/role.enum");
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/your-db";
async function seedSuperAdmin() {
    await mongoose_1.default.connect(MONGO_URL);
    const email = "superadmin@example.com";
    const password = "SuperSecurePassword123";
    const name = "Super Admin";
    let user = await user_model_1.default.findOne({ email });
    if (!user) {
        user = await user_model_1.default.create({
            name,
            email,
            password,
            isActive: true,
            profilePicture: null,
            role: role_enum_1.Roles.SUPER_ADMIN,
        });
        console.log("Super Admin created:", user.email);
    }
    else {
        console.log("Super Admin already exists:", user.email);
    }
    await mongoose_1.default.disconnect();
}
seedSuperAdmin().catch(console.error);
