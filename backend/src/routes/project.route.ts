import { Router } from "express";
import { createProjectController,
    deleteProjectController,
    getAllProjectsInWorkspaceController,
    getProjectAnalyticsController,
    getProjectByIdAndWorkspaceIdController, 
    updateProjectController,
    getProjectActivitiesController,
    postProjectActivityController,
    pinProjectActivityController,
    unpinProjectActivityController,
    getProjectFilesController,
    uploadProjectFileController,
    upload } from "../controllers/project.controller";
import path from "path";
import fs from "fs";


const projectRoutes = Router(); 

projectRoutes.post("/workspace/:workspaceId/create", createProjectController);


projectRoutes.put(
  "/:id/workspace/:workspaceId/update",
  updateProjectController
);

projectRoutes.delete(
  "/:id/workspace/:workspaceId/delete",
  deleteProjectController
);
projectRoutes.get(
    "/workspace/:workspaceId/all",
    getAllProjectsInWorkspaceController); 
projectRoutes.get(
    "/:id/workspace/:workspaceId/analytics",
    getProjectAnalyticsController);   
projectRoutes.get('/:id/activities', getProjectActivitiesController);
projectRoutes.post('/:id/activities', postProjectActivityController);
projectRoutes.patch('/activities/:activityId/pin', pinProjectActivityController);
projectRoutes.patch('/activities/:activityId/unpin', unpinProjectActivityController);
projectRoutes.get('/:id/files', getProjectFilesController);
projectRoutes.post('/:id/files', upload.single('file'), uploadProjectFileController);

// Download endpoint for project files
projectRoutes.get('/files/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  res.download(filePath, filename);
});

projectRoutes.get(
    "/:id/workspace/:workspaceId",
    getProjectByIdAndWorkspaceIdController);     



export default projectRoutes ; 