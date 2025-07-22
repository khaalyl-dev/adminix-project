"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinWorkspaceByInviteService = exports.getMemberRoleInWorkspace = void 0;
const error_code_enum_1 = require("../enums/error-code.enum");
const role_enum_1 = require("../enums/role.enum");
const member_model_1 = __importDefault(require("../models/member.model"));
const roles_permission_model_1 = __importDefault(require("../models/roles-permission.model"));
const workspace_model_1 = __importDefault(require("../models/workspace.model"));
const app_error_1 = require("../utils/app.error");
const user_model_1 = __importDefault(require("../models/user.model"));
const getMemberRoleInWorkspace = async (userId, workspaceId) => {
    // If the user is SUPER_ADMIN, allow access to any workspace (view-only)
    const user = await user_model_1.default.findById(userId);
    if (user && user.role === role_enum_1.Roles.SUPER_ADMIN) {
        // SUPER_ADMIN can view all workspaces, even if not a member
        return { role: role_enum_1.Roles.SUPER_ADMIN };
    }
    // Existing logic for members
    const workspace = await workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new app_error_1.NotFoundException("Workspace not found");
    }
    const member = await member_model_1.default.findOne({
        userId,
        workspaceId,
    }).populate("role");
    if (!member) {
        throw new app_error_1.UnauthorizedException("You are not a member of this workspace", error_code_enum_1.ErrorCodeEnum.ACCESS_UNAUTHORIZED);
    }
    const roleName = member.role?.name;
    return { role: roleName };
};
exports.getMemberRoleInWorkspace = getMemberRoleInWorkspace;
const joinWorkspaceByInviteService = async (userId, inviteCode) => {
    // Find workspace by invite code
    const workspace = await workspace_model_1.default.findOne({ inviteCode }).exec();
    if (!workspace) {
        throw new app_error_1.NotFoundException("Invalid invite code or workspace not found");
    }
    // Check if user is already a member
    const existingMember = await member_model_1.default.findOne({
        userId,
        workspaceId: workspace._id,
    }).exec();
    if (existingMember) {
        throw new app_error_1.BadRequestException("You are already a member of this workspace");
    }
    const role = await roles_permission_model_1.default.findOne({ name: role_enum_1.Roles.MEMBER });
    if (!role) {
        throw new app_error_1.NotFoundException("Role not found");
    }
    // Add user to workspace as a member
    const newMember = new member_model_1.default({
        userId,
        workspaceId: workspace._id,
        role: role._id,
    });
    await newMember.save();
    return { workspaceId: workspace._id, role: role.name };
};
exports.joinWorkspaceByInviteService = joinWorkspaceByInviteService;
