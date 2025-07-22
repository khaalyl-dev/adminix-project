"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_error_1 = require("../utils/app.error");
const isAuthenticated = (req, res, next) => {
    if (!req.user || !req.user._id) {
        throw new app_error_1.UnauthorizedException("Unauthorized.please log in");
    }
    next();
};
exports.default = isAuthenticated;
