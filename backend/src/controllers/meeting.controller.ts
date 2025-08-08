// Controller for handling meeting-related API endpoints and business logic.
import { Request, Response } from "express";
import { google } from "googleapis";
import AccountModel from "../models/account.model";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { ProviderEnum } from "../enums/account-provider.enums";
import { config } from "../config/app.config";
import Notification from "../models/notification.model";
import Activity from "../models/activity.model";
import ProjectModel from "../models/project.model";
import { format } from "date-fns";

export const scheduleMeetingController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { title, start, end, guests, projectId, description } = req.body;

  // Find the user's Google account
  const account = await AccountModel.findOne({
    userId,
    provider: ProviderEnum.GOOGLE,
  });

  if (!account || !account.refreshToken) {
    return res.status(400).json({ error: "Google account not linked or missing refresh token." });
  }

  // Set up OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    ""
  );
  oauth2Client.setCredentials({ refresh_token: account.refreshToken });

  // Get a new access token using the refresh token
  await oauth2Client.getAccessToken();

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Create the event
  let eventDescription = description || '';
  if (projectId) {
    eventDescription = `ProjectId: ${projectId}\n${eventDescription}`;
  }
  const event = {
    summary: title,
    start: { dateTime: start },
    end: { dateTime: end },
    attendees: guests.map((email: string) => ({ email })),
    description: eventDescription,
    conferenceData: {
      createRequest: { requestId: Date.now().toString() }
    }
  };

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: event
  });

  let workspaceId;
  let notificationType: 'workspace' | 'project' = 'workspace';
  if (projectId) {
    const project = await ProjectModel.findById(projectId);
    if (project) {
      workspaceId = project.workspace;
      notificationType = 'project';
    }
  }
  if (!workspaceId) {
    workspaceId = req.body.workspaceId || req.user?.currentWorkspace;
  }
  const formattedStart = format(new Date(start), "PPpp");
  const formattedEnd = format(new Date(end), "p");
  const duration = Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60));
  const guestCount = guests.length;
  
  // Create notification
  await Notification.create({
    userId,
    workspaceId,
    type: notificationType,
    message: `Meeting {{${title}}} scheduled from ${formattedStart} to ${formattedEnd}`,
  });

  // Create activity log with professional details
  if (projectId) {
    const meetingDetails = [
      `📅 ${title}`,
      `⏰ ${formattedStart} - ${formattedEnd} (${duration} min)`,
      guestCount > 0 ? `👥 ${guestCount} attendee${guestCount > 1 ? 's' : ''}` : '',
      description ? `📝 ${description}` : '',
      `🔗 Google Meet link available`
    ].filter(Boolean).join('\n');
    
    await Activity.create({
      userId,
      projectId,
      type: 'meeting_schedule',
      message: `Scheduled meeting:\n${meetingDetails}`,
    });
  }

  return res.json({
    meetLink: data.hangoutLink,
    eventId: data.id,
    event: data
  });
});

export const getUpcomingEventsController = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const account = await AccountModel.findOne({
    userId,
    provider: ProviderEnum.GOOGLE,
  });

  if (!account || !account.refreshToken) {
    return res.status(400).json({ error: "Google account not linked or missing refresh token." });
  }

  const oauth2Client = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    ""
  );
  oauth2Client.setCredentials({ refresh_token: account.refreshToken });
  await oauth2Client.getAccessToken();

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const now = new Date().toISOString();
  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: now,
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  let events = data.items || [];
  const projectId = req.query.projectId;
  if (projectId) {
    events = events.filter(
      (e: any) => e.description && e.description.includes(`ProjectId: ${projectId}`)
    );
  }

  return res.json({ events });
}); 