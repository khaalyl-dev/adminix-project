"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_config_1 = require("./app.config");
const connectDatabase = async () => {
    try {
        await mongoose_1.default.connect(app_config_1.config.MONGO_URL);
        console.log("oumourek mrygla");
    }
    catch (error) {
        console.log("error o raja3 rou7ek ");
        process.exit(1);
    }
};
exports.default = connectDatabase;
