"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const role_enum_1 = require("../enums/role.enum");
const account_model_1 = __importDefault(require("../models/account.model"));
const account_provider_enums_1 = require("../enums/account-provider.enums");
const MONGO_URL = process.env.MONGO_URL;
async function seedSuperAdmin() {
    await mongoose_1.default.connect(MONGO_URL);
    const email = "contact@digix.tn";
    const password = "SuperSecurePassword123";
    const name = "Digixi";
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
    const account = await account_model_1.default.findOne({ provider: account_provider_enums_1.ProviderEnum.EMAIL, providerId: email });
    if (!account) {
        await account_model_1.default.create({
            userId: user._id,
            provider: account_provider_enums_1.ProviderEnum.EMAIL,
            providerId: email,
            refreshToken: null,
            tokenExpiry: null,
        });
        console.log("Super Admin account created in AccountModel.");
    }
    await mongoose_1.default.disconnect();
}
seedSuperAdmin().catch(console.error);
