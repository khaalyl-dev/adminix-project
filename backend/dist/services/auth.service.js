"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUserService = exports.registerUserService = exports.loginOrCreateAccountService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const account_model_1 = __importDefault(require("../models/account.model"));
const app_error_1 = require("../utils/app.error");
const account_provider_enums_1 = require("../enums/account-provider.enums");
const loginOrCreateAccountService = async (data) => {
    const { providerId, provider, displayName, email, picture } = data;
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        console.log("Start Session ...");
        let user = await user_model_1.default.findOne({ email }).session(session);
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
            // Do NOT create workspace, member, or set currentWorkspace here
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
