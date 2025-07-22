import { Router } from "express";
import { createTaskController, deleteTaskController, getAllTasksController, getTaskByIdController, updateTaskController, getTaskCommentsController, postTaskCommentController, editTaskCommentController, deleteTaskCommentController } from "../controllers/task.controller";


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

taskRoutes.get("/workspace/:workspaceId/all",getAllTasksController); 

taskRoutes.get(
  "/:id/project/:projectId/workspace/:workspaceId",
  getTaskByIdController
);

taskRoutes.get('/:id/comments', getTaskCommentsController);
taskRoutes.post('/:id/comments', postTaskCommentController);
taskRoutes.patch('/:id/comments/:commentId', editTaskCommentController);
taskRoutes.delete('/:id/comments/:commentId', deleteTaskCommentController);

export default taskRoutes; 



