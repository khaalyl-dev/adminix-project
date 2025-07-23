import { Request, Response } from "express";
import { google } from "googleapis";
import AccountModel from "../models/account.model";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { ProviderEnum } from "../enums/account-provider.enums";
import { config } from "../config/app.config";

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
      e => e.description && e.description.includes(`ProjectId: ${projectId}`)
    );
  }

  return res.json({ events });
}); 