"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Database configuration settings for the backend. This file manages database connection and related options.
const mongoose_1 = __importDefault(require("mongoose"));
const app_config_1 = require("./app.config");
const connectDatabase = async () => {
    try {
        await mongoose_1.default.connect(app_config_1.config.MONGO_URL);
        console.log("Jaweek behy el database ala 3ajla");
    }
    catch (error) {
        console.log("bro 7yetek 3adheb");
        process.exit(1);
    }
};
exports.default = connectDatabase;
