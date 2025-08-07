// Express route definitions for task-related API endpoints.
import { Router } from "express";
import { createTaskController, deleteTaskController, getAllTasksController, getTaskByIdController, updateTaskController, updateTaskAIPredictionsController, getTaskCommentsController, postTaskCommentController, editTaskCommentController, deleteTaskCommentController, getTasksBySprintController } from "../controllers/task.controller";


const taskRoutes = Router(); 


taskRoutes.post(
  "/project/:projectId/workspace/:workspaceId/create",
  createTaskController
);

taskRoutes.delete("/:id/workspace/:workspaceId/delete", deleteTaskController); 

taskRoutes.put(
  "/:id/project/:projectId/workspace/:workspaceId/update",
  updateTaskController
);

taskRoutes.put(
  "/:id/project/:projectId/workspace/:workspaceId/ai-predictions",
  updateTaskAIPredictionsController
);

taskRoutes.get("/workspace/:workspaceId/all",getAllTasksController); 

taskRoutes.get(
  "/:id/project/:projectId/workspace/:workspaceId",
  getTaskByIdController
);

taskRoutes.get('/:id/comments', getTaskCommentsController);
taskRoutes.post('/:id/comments', postTaskCommentController);
taskRoutes.patch('/:id/comments/:commentId', editTaskCommentController);
taskRoutes.delete('/:id/comments/:commentId', deleteTaskCommentController);

// Get tasks by sprint
taskRoutes.get("/:workspaceId/projects/:projectId/sprint/:sprintId/tasks", getTasksBySprintController);

export default taskRoutes; 



