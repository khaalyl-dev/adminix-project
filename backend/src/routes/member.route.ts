// Express route definitions for member-related API endpoints.
import { Router } from "express";
import { joinWorkspaceController, importCSVWorkersController, getCSVWorkersController } from "../controllers/member.controller";
import isAuthenticated from "../middlewares/isAuthenticated.middleware";

const memberRoutes = Router();

memberRoutes.post("/workspace/:inviteCode/join", joinWorkspaceController);

// CSV Workers routes
memberRoutes.post("/workspace/:workspaceId/csv-workers/import", isAuthenticated, importCSVWorkersController);
memberRoutes.get("/workspace/:workspaceId/csv-workers", isAuthenticated, getCSVWorkersController);

export default memberRoutes;

