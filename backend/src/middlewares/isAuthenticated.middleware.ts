import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../utils/app.error";


const isAuthenticated = (req:Request, res: Response, next:NextFunction) => {
    if(!req.user || !req.user._id) {
        throw new UnauthorizedException("Unauthorized.please log in"); 
    }
    next(); 
}

export default isAuthenticated; 