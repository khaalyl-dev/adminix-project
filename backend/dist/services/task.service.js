"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTasksBySprintService = exports.deleteTaskService = exports.getTaskByIdService = exports.getAllTasksService = exports.updateTaskAIPredictionsService = exports.updateTaskService = exports.createTaskService = void 0;
// Service for handling business logic related to tasks.
const task_enum_1 = require("../enums/task.enum");
const member_model_1 = __importDefault(require("../models/member.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const task_model_1 = __importDefault(require("../models/task.model"));
const app_error_1 = require("../utils/app.error");
const createTaskService = async (workspaceId, projectId, userId, body) => {
    const { title, description, priority, status, assignedTo, dueDate, sprint, } = body;
    const project = await project_model_1.default.findById(projectId);
    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to this workspace");
    }
    if (assignedTo) {
        const isAssignedUserMember = await member_model_1.default.exists({
            userId: assignedTo,
            workspaceId,
        });
        if (!isAssignedUserMember) {
            throw new Error("Assigned user is not a member of this workspace.");
        }
    }
    // Validate sprint date constraints if sprint is assigned
    if (sprint && dueDate) {
        const SprintModel = (await Promise.resolve().then(() => __importStar(require("../models/sprint.model")))).default;
        const sprintData = await SprintModel.findById(sprint);
        if (sprintData) {
            const taskDueDate = new Date(dueDate);
            const sprintStart = sprintData.startDate ? new Date(sprintData.startDate) : new Date();
            const sprintEnd = sprintData.endDate ? new Date(sprintData.endDate) : new Date("2100-12-31");
            if (taskDueDate < sprintStart || taskDueDate > sprintEnd) {
                throw new app_error_1.BadRequestException(`Task due date must be within sprint period: ${sprintStart.toDateString()} to ${sprintEnd.toDateString()}`);
            }
        }
    }
    const task = new task_model_1.default({
        title,
        description,
        priority: priority || task_enum_1.TaskPriorityEnum.MEDIUM,
        status: status || task_enum_1.TaskStatusEnum.TODO,
        assignedTo,
        createdBy: userId,
        workspace: workspaceId,
        project: projectId,
        dueDate,
        sprint,
    });
    await task.save();
    return { task };
};
exports.createTaskService = createTaskService;
const updateTaskService = async (workspaceId, projectId, taskId, body) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to this workspace");
    }
    const task = await task_model_1.default.findById(taskId);
    if (!task || task.project.toString() !== projectId.toString()) {
        throw new app_error_1.NotFoundException("This task does not exist or is not associated with this project");
    }
    // Validate sprint date constraints if sprint is assigned
    if (body.sprint && body.dueDate) {
        const SprintModel = (await Promise.resolve().then(() => __importStar(require("../models/sprint.model")))).default;
        const sprintData = await SprintModel.findById(body.sprint);
        if (sprintData) {
            const taskDueDate = new Date(body.dueDate);
            const sprintStart = sprintData.startDate ? new Date(sprintData.startDate) : new Date();
            const sprintEnd = sprintData.endDate ? new Date(sprintData.endDate) : new Date("2100-12-31");
            if (taskDueDate < sprintStart || taskDueDate > sprintEnd) {
                throw new app_error_1.BadRequestException(`Task due date must be within sprint period: ${sprintStart.toDateString()} to ${sprintEnd.toDateString()}`);
            }
        }
    }
    const updatedTask = await task_model_1.default.findByIdAndUpdate(taskId, {
        ...body,
    }, { new: true });
    if (!updatedTask) {
        throw new app_error_1.BadRequestException("Failed to update task");
    }
    return { updatedTask };
};
exports.updateTaskService = updateTaskService;
const updateTaskAIPredictionsService = async (workspaceId, projectId, taskId, predictions) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to this workspace");
    }
    const task = await task_model_1.default.findById(taskId);
    if (!task || task.project.toString() !== projectId.toString()) {
        throw new app_error_1.NotFoundException("This task does not exist or is not associated with this project");
    }
    const updatedTask = await task_model_1.default.findByIdAndUpdate(taskId, {
        aiComplexity: predictions.aiComplexity,
        aiRisk: predictions.aiRisk,
        aiPriority: predictions.aiPriority,
        aiPredictionDate: new Date(),
    }, { new: true });
    if (!updatedTask) {
        throw new app_error_1.BadRequestException("Failed to update task AI predictions");
    }
    return { updatedTask };
};
exports.updateTaskAIPredictionsService = updateTaskAIPredictionsService;
const getAllTasksService = async (workspaceId, filters, pagination) => {
    const query = {
        workspace: workspaceId,
    };
    if (filters.projectId) {
        query.project = filters.projectId;
    }
    if (filters.status && filters.status?.length > 0) {
        query.status = { $in: filters.status };
    }
    if (filters.priority && filters.priority?.length > 0) {
        query.priority = { $in: filters.priority };
    }
    if (filters.assignedTo && filters.assignedTo?.length > 0) {
        query.assignedTo = { $in: filters.assignedTo };
    }
    if (filters.keyword && filters.keyword !== undefined) {
        query.title = { $regex: filters.keyword, $options: "i" };
    }
    if (filters.dueDate) {
        query.dueDate = {
            $eq: new Date(filters.dueDate),
        };
    }
    if (filters.sprintId) {
        query.sprint = filters.sprintId;
    }
    // pagination LOGIC  
    const { pageSize, pageNumber } = pagination;
    const skip = (pageNumber - 1) * pageSize;
    const [tasks, totalCount] = await Promise.all([
        task_model_1.default.find(query)
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .populate("assignedTo", "_id name profilePicture -password")
            .populate("project", "_id emoji name")
            .populate("sprint", "_id name sprintNumber status"),
        task_model_1.default.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
        tasks,
        pagination: {
            pageSize,
            pageNumber,
            totalCount,
            totalPages,
            skip,
        }
    };
};
exports.getAllTasksService = getAllTasksService;
const getTaskByIdService = async (workspaceId, projectId, taskId) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to this workspace");
    }
    const task = await task_model_1.default.findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
    }).populate("assignedTo", "_id name profilePicture -password")
        .populate("sprint", "_id name sprintNumber status");
    if (!task) {
        throw new app_error_1.NotFoundException("Task not found.");
    }
    return task;
};
exports.getTaskByIdService = getTaskByIdService;
const deleteTaskService = async (workspaceId, taskId) => {
    const task = await task_model_1.default.findByIdAndDelete({
        _id: taskId,
        workspacd: workspaceId,
    });
    if (!task) {
        throw new app_error_1.NotFoundException("Task not found or does not belong to the specified workspace");
    }
    return;
};
exports.deleteTaskService = deleteTaskService;
const getTasksBySprintService = async (workspaceId, projectId, sprintId) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to this workspace");
    }
    // Verify sprint exists and belongs to the project
    const SprintModel = (await Promise.resolve().then(() => __importStar(require("../models/sprint.model")))).default;
    const sprint = await SprintModel.findOne({
        _id: sprintId,
        project: projectId,
    });
    if (!sprint) {
        throw new app_error_1.NotFoundException("Sprint not found or does not belong to this project");
    }
    const tasks = await task_model_1.default.find({
        workspace: workspaceId,
        project: projectId,
        sprint: sprintId,
    })
        .populate("assignedTo", "_id name profilePicture -password")
        .populate("project", "_id emoji name")
        .populate("sprint", "_id name sprintNumber status")
        .sort({ createdAt: -1 });
    const totalCount = await task_model_1.default.countDocuments({
        workspace: workspaceId,
        project: projectId,
        sprint: sprintId,
    });
    return {
        tasks,
        totalCount,
    };
};
exports.getTasksBySprintService = getTasksBySprintService;
