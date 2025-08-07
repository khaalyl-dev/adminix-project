// Service for handling business logic related to users.
import UserModel from "../models/user.model"
import { BadRequestException } from "../utils/app.error";


export const getCurrentUserService = async(userId: string) => {
    if (!userId) {
        throw new BadRequestException("User ID is required");
    }

    const user = await UserModel.findById(userId).populate("currentWorkspace").select("-password"); 

    if(!user) {
        throw new BadRequestException(`User not found with ID: ${userId}`); 
    }

    return {
        user,
    }
}; 