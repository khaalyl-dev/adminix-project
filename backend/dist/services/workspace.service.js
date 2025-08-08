"use strict";
// Service for handling business logic related to workspaces.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkspaceService = exports.updateWorkspaceByIdService = exports.changeMemberRoleService = exports.getWorkspaceAnalyticsService = exports.getWorkspaceMembersService = exports.getWorkspaceByIdService = exports.getAllWorkspacesUserIsMemberService = exports.createWorkspaceService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const role_enum_1 = require("../enums/role.enum");
const member_model_1 = __importDefault(require("../models/member.model"));
const roles_permission_model_1 = __importDefault(require("../models/roles-permission.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const workspace_model_1 = __importDefault(require("../models/workspace.model"));
const app_error_1 = require("../utils/app.error");
const task_model_1 = __importDefault(require("../models/task.model"));
const task_enum_1 = require("../enums/task.enum");
const project_model_1 = __importDefault(require("../models/project.model"));
/**CREATE NEW WORKSPACE */
const createWorkspaceService = async (userId, body) => {
    const { name, description } = body;
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        throw new app_error_1.NotFoundException("User not found");
    }
    const ownerRole = await roles_permission_model_1.default.findOne({ name: role_enum_1.Roles.OWNER });
    if (!ownerRole) {
        throw new app_error_1.NotFoundException(" owner role not found");
    }
    const workspace = new workspace_model_1.default({
        name: name,
        description: description,
        owner: user._id,
    });
    await workspace.save();
    const member = new member_model_1.default({
        userId: user._id,
        workspaceId: workspace._id,
        role: ownerRole._id,
        joinedAt: new Date(),
    });
    await member.save();
    user.currentWorkspace = workspace._id;
    await user.save();
    return {
        workspace,
    };
};
exports.createWorkspaceService = createWorkspaceService;
/** GET WORKSPACE USER IS A MEMBER */
const getAllWorkspacesUserIsMemberService = async (userId) => {
    const user = await user_model_1.default.findById(userId);
    if (user && user.role === role_enum_1.Roles.SUPER_ADMIN) {
        const workspaces = await workspace_model_1.default.find();
        return { workspaces };
    }
    const memberships = await member_model_1.default.find({ userId })
        .populate("workspaceId")
        .select("-password")
        .exec();
    //extract workspace details from memberships
    const workspaces = memberships.map((membership) => membership.workspaceId);
    return { workspaces };
};
exports.getAllWorkspacesUserIsMemberService = getAllWorkspacesUserIsMemberService;
const getWorkspaceByIdService = async (workspaceId) => {
    const workspace = await workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new app_error_1.NotFoundException("Workspace not found");
    }
    const members = await member_model_1.default.find({
        workspaceId,
    }).populate("role");
    const workspaceWithMembers = {
        ...workspace.toObject(),
        members,
    };
    return {
        workspace: workspaceWithMembers,
    };
};
exports.getWorkspaceByIdService = getWorkspaceByIdService;
/**GET ALL MEMEBERS IN WORKSPACES  */
const getWorkspaceMembersService = async (workspaceId) => {
    // fetch all members of the workspace
    const members = await member_model_1.default.find({
        workspaceId,
    })
        .populate("userId", "name email profilePicture -password")
        .populate("role", "name");
    const roles = await roles_permission_model_1.default.find({}, { name: 1, _id: 1 })
        .select("-permission")
        .lean();
    return { members, roles };
};
exports.getWorkspaceMembersService = getWorkspaceMembersService;
const getWorkspaceAnalyticsService = async (workspaceId) => {
    const currentDate = new Date();
    const totalTasks = await task_model_1.default.countDocuments({
        workspace: workspaceId,
    });
    const overdueTasks = await task_model_1.default.countDocuments({
        workspace: workspaceId,
        dueDate: { $lt: currentDate },
        status: { $ne: task_enum_1.TaskStatusEnum.DONE },
    });
    const completedTasks = await task_model_1.default.countDocuments({
        workspace: workspaceId,
        status: task_enum_1.TaskStatusEnum.DONE,
    });
    const analytics = {
        totalTasks,
        overdueTasks,
        completedTasks,
    };
    return { analytics };
};
exports.getWorkspaceAnalyticsService = getWorkspaceAnalyticsService;
const changeMemberRoleService = async (workspaceId, memberId, roleId) => {
    const workspace = await workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new app_error_1.NotFoundException("Workspace not found");
    }
    const role = await roles_permission_model_1.default.findById(roleId);
    if (!role) {
        throw new app_error_1.NotFoundException("Role not found ! ");
    }
    const member = await member_model_1.default.findOne({
        userId: memberId,
        workspaceId: workspaceId,
    });
    if (!member) {
        throw new Error("Member not found in the workspace");
    }
    member.role = role;
    await member.save();
    return {
        member,
    };
};
exports.changeMemberRoleService = changeMemberRoleService;
/** UPDATE WORKSPACE */
const updateWorkspaceByIdService = async (workspaceId, name, description) => {
    const workspace = await workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new app_error_1.NotFoundException("Workspace not found");
    }
    // update the workspace details 
    workspace.name = name || workspace.name;
    workspace.description = description || workspace.description;
    await workspace.save();
    return {
        workspace,
    };
};
exports.updateWorkspaceByIdService = updateWorkspaceByIdService;
const deleteWorkspaceService = async (workspaceId, userId) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const workspace = await workspace_model_1.default.findById(workspaceId).session(session);
        if (!workspace) {
            throw new app_error_1.NotFoundException("Workspace not found");
        }
        // check if the user owns the workspace
        if (!workspace.owner.equals(new mongoose_1.default.Types.ObjectId(userId))) {
            throw new app_error_1.BadRequestException("You are not authorized to delete this workspace");
        }
        const user = await user_model_1.default.findById(userId).session(session);
        if (!user) {
            throw new app_error_1.NotFoundException("User not found");
        }
        await project_model_1.default.deleteMany({ workspace: workspace._id }).session(session);
        await task_model_1.default.deleteMany({ workspace: workspace._id }).session(session);
        await member_model_1.default.deleteMany({
            workspaceId: workspace._id
        }).session(session);
        // update the user's current workspace if it matchs the deleted workspace
        if (user?.currentWorkspace?.equals(workspaceId)) {
            const memberWorkspace = await member_model_1.default.findOne({ userId }).session(session);
            // update the user's currentWorkspace
            user.currentWorkspace = memberWorkspace
                ? memberWorkspace.workspaceId
                : null;
            await user.save({ session });
        }
        await workspace.deleteOne({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            currentWorkspace: user.currentWorkspace,
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.deleteWorkspaceService = deleteWorkspaceService;
