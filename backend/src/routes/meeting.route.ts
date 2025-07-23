import { Router } from "express";
import { scheduleMeetingController, getUpcomingEventsController } from "../controllers/meeting.controller";
import isAuthenticated from "../middlewares/isAuthenticated.middleware";

const meetingRoutes = Router();

meetingRoutes.post("/schedule", isAuthenticated, scheduleMeetingController);
meetingRoutes.get("/events", isAuthenticated, getUpcomingEventsController);

export default meetingRoutes; 