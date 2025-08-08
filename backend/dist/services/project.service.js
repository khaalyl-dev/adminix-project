"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProjectService = exports.updateProjectService = exports.getProjectAnalyticsService = exports.getProjectByIdAndWorkspaceIdService = exports.getProjectsInWorkspaceService = exports.createProjectService = void 0;
// Service for handling business logic related to projects.
const mongoose_1 = __importDefault(require("mongoose"));
const project_model_1 = __importDefault(require("../models/project.model"));
const task_model_1 = __importDefault(require("../models/task.model"));
const app_error_1 = require("../utils/app.error");
const task_enum_1 = require("../enums/task.enum");
const createProjectService = async (userId, workspaceId, body) => {
    const project = new project_model_1.default({
        ...(body.emoji && { emoji: body.emoji }),
        name: body.name,
        description: body.description,
        workspace: workspaceId,
        createdBy: userId,
    });
    await project.save();
    return { project };
};
exports.createProjectService = createProjectService;
const getProjectsInWorkspaceService = async (workspaceId, pageSize, pageNumber) => {
    // find all the projects in the workspace as first step
    const totalCount = await project_model_1.default.countDocuments({
        workspace: workspaceId,
    });
    const skip = (pageNumber - 1) * pageSize;
    const projects = await project_model_1.default.find({
        workspace: workspaceId
    })
        .skip(skip)
        .limit(pageSize)
        .populate("createdBy", "_id name profilePicture -password")
        .sort({ createdAt: -1 });
    const totalPages = Math.ceil(totalCount / pageSize);
    return { projects, totalCount, totalPages, skip };
};
exports.getProjectsInWorkspaceService = getProjectsInWorkspaceService;
const getProjectByIdAndWorkspaceIdService = async (workspaceId, projectId) => {
    const project = await project_model_1.default.findOne({
        _id: projectId,
        workspace: workspaceId,
    }).select("_id emoji name description");
    if (!project) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to the specified workspace");
    }
    return { project };
};
exports.getProjectByIdAndWorkspaceIdService = getProjectByIdAndWorkspaceIdService;
const getProjectAnalyticsService = async (workspaceId, projectId) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to this workspace");
    }
    const currentDate = new Date();
    // using mongoose agregate
    const taskAnalytics = await task_model_1.default.aggregate([
        {
            $match: {
                project: new mongoose_1.default.Types.ObjectId(projectId),
            },
        },
        {
            $facet: {
                totalTasks: [{ $count: "count" }],
                overdueTasks: [
                    {
                        $match: {
                            dueDate: { $lt: currentDate },
                            status: {
                                $ne: task_enum_1.TaskStatusEnum.DONE,
                            },
                        },
                    },
                    {
                        $count: "count",
                    },
                ],
                completedTasks: [
                    {
                        $match: {
                            status: task_enum_1.TaskStatusEnum.DONE,
                        },
                    },
                    { $count: "count" },
                ],
            },
        },
    ]);
    const _analytics = taskAnalytics[0];
    const analytics = {
        totalTasks: _analytics.totalTasks[0]?.count || 0,
        overdueTasks: _analytics.overdueTasks[0]?.count || 0,
        completedTasks: _analytics.completedTasks[0]?.count || 0,
    };
    // Call ML service for AI-powered project analysis
    let aiAnalytics = null;
    try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:3000";
        const response = await fetch(`${mlServiceUrl}/predict/project`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                project_title: project.name,
                project_description: project.description || "",
                max_workers_per_task: 3,
                workspace_id: workspaceId
            })
        });
        if (response.ok) {
            aiAnalytics = await response.json();
        }
        else {
            console.log(`ML service error: ${response.status} - ${response.statusText}`);
        }
    }
    catch (error) {
        console.log(`Failed to call ML service: ${error}`);
    }
    return {
        analytics,
        aiAnalytics,
    };
};
exports.getProjectAnalyticsService = getProjectAnalyticsService;
const updateProjectService = async (workspaceId, projectId, body) => {
    const { name, emoji, description } = body;
    const project = await project_model_1.default.findOne({
        _id: projectId,
        workspace: workspaceId,
    });
    if (!project) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to the specified workspace");
    }
    if (emoji)
        project.emoji = emoji;
    if (name)
        project.name = name;
    if (description)
        project.description = description;
    await project.save();
    return { project };
};
exports.updateProjectService = updateProjectService;
const deleteProjectService = async (workspaceId, projectId) => {
    const project = await project_model_1.default.findOne({
        _id: projectId,
        workspace: workspaceId,
    });
    if (!project) {
        throw new app_error_1.NotFoundException("Project not found or does not belong to the specified workspace");
    }
    await project.deleteOne();
    await task_model_1.default.deleteMany({
        project: project._id,
    });
    return project;
};
exports.deleteProjectService = deleteProjectService;
