"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Express route definitions for member-related API endpoints.
const express_1 = require("express");
const member_controller_1 = require("../controllers/member.controller");
const isAuthenticated_middleware_1 = __importDefault(require("../middlewares/isAuthenticated.middleware"));
const memberRoutes = (0, express_1.Router)();
memberRoutes.post("/workspace/:inviteCode/join", member_controller_1.joinWorkspaceController);
// CSV Workers routes
memberRoutes.post("/workspace/:workspaceId/csv-workers/import", isAuthenticated_middleware_1.default, member_controller_1.importCSVWorkersController);
memberRoutes.get("/workspace/:workspaceId/csv-workers", isAuthenticated_middleware_1.default, member_controller_1.getCSVWorkersController);
exports.default = memberRoutes;
