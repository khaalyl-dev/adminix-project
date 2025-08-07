// Controller for handling user-related API endpoints and business logic.
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { getCurrentUserService } from "../services/user.service";


export const getCurrentUserController = asyncHandler(
    async(req:Request, res:Response) => {
        const userId = req.user?._id; 
        
        if (!userId) {
            return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                message: "User not authenticated",
                error: "No user ID found in session"
            });
        }

        const {user} = await getCurrentUserService(userId); 

        return res.status(HTTPSTATUS.OK).json({
            message:"User fetch successfully", 
            user,
        });
    }
);