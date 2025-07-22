"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = void 0;
const getEnv = (Key, defaultValue = "") => {
    const value = process.env[Key];
    if (value === undefined) {
        if (defaultValue) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${Key} is not set`);
    }
    return value;
};
exports.getEnv = getEnv;
