// Service for handling business logic related to sprints.
import SprintModel from "../models/sprint.model";
import ProjectModel from "../models/project.model";
import { BadRequestException, NotFoundException } from "../utils/app.error";

export const createSprintService = async (
    workspaceId: string,
    projectId: string,
    userId: string,
    body: {
        name: string;
        description?: string;
        sprintNumber: number;
        startDate?: string;
        endDate?: string;
        capacity?: number;
        status?: string;
    }
) => {
    const { name, description, sprintNumber, startDate, endDate, capacity, status } = body;

    const project = await ProjectModel.findById(projectId);
    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new NotFoundException(
            "Project not found or does not belong to this workspace"
        );
    }

    // Check if sprint number already exists for this project
    const existingSprint = await SprintModel.findOne({
        project: projectId,
        sprintNumber: sprintNumber,
    });

    if (existingSprint) {
        throw new BadRequestException(
            `Sprint number ${sprintNumber} already exists for this project`
        );
    }

    const sprint = new SprintModel({
        name,
        description,
        project: projectId,
        workspace: workspaceId,
        sprintNumber,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        capacity: capacity || 40,
        status: status || 'PLANNED',
        createdBy: userId,
    });

    await sprint.save();

    return { sprint };
};

export const updateSprintService = async (
    workspaceId: string,
    projectId: string,
    sprintId: string,
    body: {
        name?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        capacity?: number;
        status?: string;
    }
) => {
    const project = await ProjectModel.findById(projectId);

    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new NotFoundException(
            "Project not found or does not belong to this workspace"
        );
    }

    const sprint = await SprintModel.findById(sprintId);

    if (!sprint || sprint.project.toString() !== projectId.toString()) {
        throw new NotFoundException(
            "This sprint does not exist or is not associated with this project"
        );
    }

    const updatedSprint = await SprintModel.findByIdAndUpdate(
        sprintId,
        {
            ...body,
            startDate: body.startDate ? new Date(body.startDate) : sprint.startDate,
            endDate: body.endDate ? new Date(body.endDate) : sprint.endDate,
        },
        { new: true }
    );

    if (!updatedSprint) {
        throw new BadRequestException("Failed to update sprint");
    }

    return { updatedSprint };
};

export const getAllSprintsService = async (
    workspaceId: string,
    projectId: string,
    filters: {
        status?: string[];
        keyword?: string;
    },
    pagination: {
        pageSize: number;
        pageNumber: number;
    }
) => {
    const project = await ProjectModel.findById(projectId);

    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new NotFoundException(
            "Project not found or does not belong to this workspace"
        );
    }

    const query: Record<string, any> = {
        workspace: workspaceId,
        project: projectId,
    };

    if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status };
    }

    if (filters.keyword && filters.keyword !== undefined) {
        query.name = { $regex: filters.keyword, $options: "i" };
    }

    const { pageSize, pageNumber } = pagination;
    const skip = (pageNumber - 1) * pageSize;

    const [sprints, totalCount] = await Promise.all([
        SprintModel.find(query)
            .skip(skip)
            .limit(pageSize)
            .sort({ sprintNumber: 1 })
            .populate("createdBy", "_id name profilePicture -password"),
        SprintModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
        sprints,
        pagination: {
            pageSize,
            pageNumber,
            totalCount,
            totalPages,
            skip,
        },
    };
};

export const getSprintByIdService = async (
    workspaceId: string,
    projectId: string,
    sprintId: string
) => {
    const project = await ProjectModel.findById(projectId);

    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new NotFoundException(
            "Project not found or does not belong to this workspace"
        );
    }

    const sprint = await SprintModel.findOne({
        _id: sprintId,
        workspace: workspaceId,
        project: projectId,
    }).populate("createdBy", "_id name profilePicture -password");

    if (!sprint) {
        throw new NotFoundException("Sprint not found.");
    }

    return sprint;
};

export const deleteSprintService = async (
    workspaceId: string,
    projectId: string,
    sprintId: string,
    options?: {
        deleteTasks?: boolean; // true = delete tasks, false = unassign tasks, undefined = error if tasks exist
    }
) => {
    const project = await ProjectModel.findById(projectId);

    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new NotFoundException(
            "Project not found or does not belong to this workspace"
        );
    }

    const sprint = await SprintModel.findById(sprintId);

    if (!sprint || sprint.project.toString() !== projectId.toString()) {
        throw new NotFoundException(
            "This sprint does not exist or is not associated with this project"
        );
    }

    // Check if any tasks are assigned to this sprint
    const TaskModel = (await import("../models/task.model")).default;
    const tasksWithSprint = await TaskModel.countDocuments({
        sprint: sprintId,
    });

    if (tasksWithSprint > 0) {
        if (options?.deleteTasks === undefined) {
            throw new BadRequestException(
                `Cannot delete sprint. ${tasksWithSprint} task(s) are assigned to this sprint. Please reassign or delete these tasks first.`
            );
        }

        if (options.deleteTasks) {
            // Delete all tasks assigned to this sprint
            await TaskModel.deleteMany({
                sprint: sprintId,
            });
        } else {
            // Unassign tasks from this sprint (set sprint to null)
            await TaskModel.updateMany(
                { sprint: sprintId },
                { $unset: { sprint: "" } }
            );
        }
    }

    await SprintModel.findByIdAndDelete(sprintId);

    const action = options?.deleteTasks ? "deleted" : "unassigned";
    return { 
        message: `Sprint deleted successfully. ${tasksWithSprint} task(s) ${action}.` 
    };
};

export const getNextSprintNumberService = async (
    workspaceId: string,
    projectId: string
) => {
    const project = await ProjectModel.findById(projectId);

    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new NotFoundException(
            "Project not found or does not belong to this workspace"
        );
    }

    // Find the highest sprint number for this project
    const highestSprint = await SprintModel.findOne({
        project: projectId,
    }).sort({ sprintNumber: -1 });

    // Return the next number (1 if no sprints exist, otherwise highest + 1)
    const nextNumber = highestSprint ? highestSprint.sprintNumber + 1 : 1;

    return { nextSprintNumber: nextNumber };
}; 