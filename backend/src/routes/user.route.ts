// Express route definitions for user-related API endpoints.
import { Router } from "express";
import { getCurrentUserController } from "../controllers/user.controller";

const userRoutes = Router(); 

userRoutes.get("/current",getCurrentUserController); 

export default userRoutes; 