"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUserService = exports.registerUserService = exports.loginOrCreateAccountService = void 0;
// Service for handling authentication and authorization logic.
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const account_model_1 = __importDefault(require("../models/account.model"));
const workspace_model_1 = __importDefault(require("../models/workspace.model"));
const roles_permission_model_1 = __importDefault(require("../models/roles-permission.model"));
const role_enum_1 = require("../enums/role.enum");
const app_error_1 = require("../utils/app.error");
const member_model_1 = __importDefault(require("../models/member.model"));
const account_provider_enums_1 = require("../enums/account-provider.enums");
const loginOrCreateAccountService = async (data) => {
    const { providerId, provider, displayName, email, picture } = data;
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        console.log("Start Session ...");
        console.log("Provider:", provider, "ProviderId:", providerId, "Email:", email);
        let user = await user_model_1.default.findOne({ email }).session(session);
        let isNewUser = false;
        if (!user) {
            //create new user if doesn't exist
            user = new user_model_1.default({
                email,
                name: displayName,
                profilePicture: picture || null,
            });
            await user.save({ session });
            const account = new account_model_1.default({
                userId: user._id,
                provider: provider,
                providerId: providerId,
            });
            await account.save({ session });
            isNewUser = true;
        }
        else {
            // Check if account already exists for this provider
            const existingAccount = await account_model_1.default.findOne({
                provider: provider,
                providerId: providerId
            }).session(session);
            console.log("Existing account found:", existingAccount ? "YES" : "NO");
            if (!existingAccount) {
                // Create new account for existing user
                console.log("Creating new account for existing user");
                const account = new account_model_1.default({
                    userId: user._id,
                    provider: provider,
                    providerId: providerId,
                });
                await account.save({ session });
                console.log("Account created successfully");
            }
            else {
                // Account exists, just return the user
                console.log("Account already exists for this provider, skipping account creation");
            }
        }
        // If the user is new and has no currentWorkspace, create a default workspace
        if (!user.currentWorkspace) {
            const ownerRole = await roles_permission_model_1.default.findOne({ name: role_enum_1.Roles.OWNER });
            if (!ownerRole) {
                throw new Error("Owner role not found");
            }
            const workspace = new workspace_model_1.default({
                name: `${user.name || "My Workspace"}`,
                description: "Default workspace",
                owner: user._id,
            });
            await workspace.save({ session });
            const member = new member_model_1.default({
                userId: user._id,
                workspaceId: workspace._id,
                role: ownerRole._id,
                joinedAt: new Date(),
            });
            await member.save({ session });
            user.currentWorkspace = workspace._id;
            await user.save({ session });
        }
        await session.commitTransaction();
        session.endSession();
        console.log("End Session ...");
        return { user };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
    finally {
        session.endSession();
    }
};
exports.loginOrCreateAccountService = loginOrCreateAccountService;
const registerUserService = async (body) => {
    const { email, name, password } = body;
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const existingUser = await user_model_1.default.findOne({ email }).session(session);
        if (existingUser) {
            throw new app_error_1.BadRequestException("email already exists!");
        }
        const user = new user_model_1.default({
            email,
            name,
            password,
        });
        await user.save({ session });
        const account = new account_model_1.default({
            userId: user._id,
            provider: account_provider_enums_1.ProviderEnum.EMAIL,
            providerId: email,
        });
        await account.save({ session });
        // Do NOT create workspace, member, or set currentWorkspace here
        await session.commitTransaction();
        session.endSession();
        console.log("End Session ...");
        return {
            userId: user._id
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.registerUserService = registerUserService;
const verifyUserService = async ({ email, password, provider = account_provider_enums_1.ProviderEnum.EMAIL, }) => {
    const account = await account_model_1.default.findOne({ provider, providerId: email });
    if (!account) {
        throw new app_error_1.NotFoundException("invalid email or password");
    }
    const user = await user_model_1.default.findById(account.userId);
    if (!user) {
        throw new app_error_1.NotFoundException("user not found for the given account");
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new app_error_1.UnauthorizedException("invalid email or password");
    }
    return user.omitPassword();
};
exports.verifyUserService = verifyUserService;
