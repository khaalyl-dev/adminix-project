"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = void 0;
const app_error_1 = require("./app.error");
const role_permission_1 = require("./role-permission");
const roleGuard = (role, requiredPermissions) => {
    const permissions = role_permission_1.RolePermissions[role];
    const hasPermission = requiredPermissions.every((permission) => permissions.includes(permission));
    if (!hasPermission) {
        throw new app_error_1.UnauthorizedException("You don't have the necessary permissions to perform this action");
    }
};
exports.roleGuard = roleGuard;
