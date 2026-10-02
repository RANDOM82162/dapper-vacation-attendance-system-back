import axios from "axios";
import fs from "fs";
import jwt from "jsonwebtoken";

interface GoogleCalendarCredentials {
  client_email?: string;
  private_key?: string;
}

export interface CalendarVacationEvent {
  folio: string;
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string;
  days: number;
  comments?: string;
}

interface CalendarEventResponse {
  id: string;
  htmlLink?: string;
}

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3/calendars";

export function isGoogleCalendarEnabled() {
  return process.env.GOOGLE_CALENDAR_ENABLED === "true" && Boolean(process.env.GOOGLE_CALENDAR_ID && getCredentials().client_email && getCredentials().private_key);
}

export async function upsertVacationCalendarEvent(event: CalendarVacationEvent, eventId?: string) {
  if (!isGoogleCalendarEnabled()) return null;

  if (eventId) {
    try {
      return await updateVacationCalendarEvent(eventId, event);
    } catch (error: any) {
      if (error?.response?.status !== 404) throw error;
    }
  }

  return await createVacationCalendarEvent(event);
}

export async function deleteVacationCalendarEvent(eventId?: string) {
  if (!isGoogleCalendarEnabled() || !eventId) return false;

  const accessToken = await getAccessToken();
  const calendarId = encodeURIComponent(getCalendarId());

  try {
    await axios.delete(`${CALENDAR_API_URL}/${calendarId}/events/${encodeURIComponent(eventId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return true;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 410) return true;
    throw error;
  }
}

async function createVacationCalendarEvent(event: CalendarVacationEvent) {
  const accessToken = await getAccessToken();
  const calendarId = encodeURIComponent(getCalendarId());
  const response = await axios.post<CalendarEventResponse>(
    `${CALENDAR_API_URL}/${calendarId}/events`,
    buildGoogleCalendarEvent(event),
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return response.data;
}

async function updateVacationCalendarEvent(eventId: string, event: CalendarVacationEvent) {
  const accessToken = await getAccessToken();
  const calendarId = encodeURIComponent(getCalendarId());
  const response = await axios.put<CalendarEventResponse>(
    `${CALENDAR_API_URL}/${calendarId}/events/${encodeURIComponent(eventId)}`,
    buildGoogleCalendarEvent(event),
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return response.data;
}

async function getAccessToken() {
  const credentials = getCredentials();
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: credentials.client_email,
      scope: CALENDAR_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    normalizePrivateKey(credentials.private_key || ""),
    { algorithm: "RS256" },
  );

  const response = await axios.post<{ access_token: string }>(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );

  return response.data.access_token;
}

function buildGoogleCalendarEvent(event: CalendarVacationEvent) {
  return {
    summary: `Vacaciones - ${event.employeeName}`,
    description: [
      `Folio: ${event.folio}`,
      `Empleado: ${event.employeeName}`,
      `Departamento: ${event.department}`,
      `Dias descontables: ${event.days}`,
      event.comments ? `Comentario del empleado: ${event.comments}` : "",
    ].filter(Boolean).join("\n"),
    start: { date: event.startDate },
    end: { date: getExclusiveEndDate(event.endDate) },
  };
}

function getExclusiveEndDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || "";
}

function getCredentials(): GoogleCalendarCredentials {
  if (process.env.GOOGLE_CALENDAR_CLIENT_EMAIL && process.env.GOOGLE_CALENDAR_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY,
    };
  }

  if (process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH && fs.existsSync(process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH)) {
    const rawCredentials = fs.readFileSync(process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH, "utf8");
    return JSON.parse(rawCredentials);
  }

  return {};
}

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n");
}
