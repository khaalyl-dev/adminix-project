"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Express route definitions for task-related API endpoints.
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const taskRoutes = (0, express_1.Router)();
taskRoutes.post("/project/:projectId/workspace/:workspaceId/create", task_controller_1.createTaskController);
taskRoutes.delete("/:id/workspace/:workspaceId/delete", task_controller_1.deleteTaskController);
taskRoutes.put("/:id/project/:projectId/workspace/:workspaceId/update", task_controller_1.updateTaskController);
taskRoutes.put("/:id/project/:projectId/workspace/:workspaceId/ai-predictions", task_controller_1.updateTaskAIPredictionsController);
taskRoutes.get("/workspace/:workspaceId/all", task_controller_1.getAllTasksController);
taskRoutes.get("/:id/project/:projectId/workspace/:workspaceId", task_controller_1.getTaskByIdController);
taskRoutes.get('/:id/comments', task_controller_1.getTaskCommentsController);
taskRoutes.post('/:id/comments', task_controller_1.postTaskCommentController);
taskRoutes.patch('/:id/comments/:commentId', task_controller_1.editTaskCommentController);
taskRoutes.delete('/:id/comments/:commentId', task_controller_1.deleteTaskCommentController);
// Get tasks by sprint
taskRoutes.get("/:workspaceId/projects/:projectId/sprint/:sprintId/tasks", task_controller_1.getTasksBySprintController);
exports.default = taskRoutes;
