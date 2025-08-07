// Routes for sprint-related API endpoints.
import { Router } from "express";
import {
    createSprintController,
    deleteSprintController,
    getAllSprintsController,
    getSprintByIdController,
    updateSprintController,
    getNextSprintNumberController,
} from "../controllers/sprint.controller";

const router = Router();

// Create a new sprint
router.post(
    "/:workspaceId/projects/:projectId/sprints",
    createSprintController
);

// Get all sprints for a project
router.get(
    "/:workspaceId/projects/:projectId/sprints",
    getAllSprintsController
);

// Get next available sprint number
router.get(
    "/:workspaceId/projects/:projectId/sprints/next-number",
    getNextSprintNumberController
);

// Get a specific sprint
router.get(
    "/:workspaceId/projects/:projectId/sprints/:sprintId",
    getSprintByIdController
);

// Update a sprint
router.put(
    "/:workspaceId/projects/:projectId/sprints/:sprintId",
    updateSprintController
);

// Delete a sprint
router.delete(
    "/:workspaceId/projects/:projectId/sprints/:sprintId",
    deleteSprintController
);

export default router; 