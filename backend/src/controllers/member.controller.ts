// Controller for handling member-related API endpoints and business logic.
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { z } from "zod";
import { HTTPSTATUS } from "../config/http.config";
import { joinWorkspaceByInviteService, importCSVWorkersService, getCSVWorkersService } from "../services/member.service";

export const joinWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const userId = req.user?._id;

    const { workspaceId, role } = await joinWorkspaceByInviteService(
      userId,
      inviteCode
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace",
      workspaceId,
      role,
    });
  }
);

export const importCSVWorkersController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = z.string().parse(req.params.workspaceId);
    const csvData = z.string().parse(req.body.csvData);

    const result = await importCSVWorkersService(workspaceId, csvData);

    return res.status(HTTPSTATUS.OK).json({
      message: "CSV workers imported successfully",
      ...result,
    });
  }
);

export const getCSVWorkersController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = z.string().parse(req.params.workspaceId);

    const csvWorkers = await getCSVWorkersService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "CSV workers retrieved successfully",
      csvWorkers,
    });
  }
);