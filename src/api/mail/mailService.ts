import axios from "axios";

interface UserMailData {
  name: string;
  email: string;
  id: string | number;
  password?: string;
  role: string;
}

interface BrevoRecipient {
  email: string;
  name?: string;
}

interface SendBrevoTemplateEmailParams {
  to: BrevoRecipient[];
  templateId?: string;
  params: Record<string, unknown>;
  subject?: string;
  replyTo?: BrevoRecipient;
}

interface VacationMailData {
  folio: string;
  employeeName: string;
  employeeEmail?: string;
  department: string;
  startDate: string;
  endDate: string;
  days: number;
  paidDays?: number;
  unpaidDays?: number;
  status: string;
  comments?: string;
  managerComment?: string;
  reviewerName?: string;
  link?: string;
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function isBrevoEnabled() {
  return process.env.BREVO_ENABLED === "true" && Boolean(process.env.BREVO_API_KEY);
}

function getSender() {
  return {
    name: process.env.BREVO_SENDER_NAME || "Dapper RH",
    email: process.env.BREVO_SENDER_EMAIL || "no-reply@dappertechnologies.com",
  };
}

function getTemplateId(value?: string) {
  const templateId = Number(value);
  return Number.isFinite(templateId) && templateId > 0 ? templateId : undefined;
}

async function sendBrevoTemplateEmail(data: SendBrevoTemplateEmailParams) {
  if (!isBrevoEnabled()) {
    console.log("Brevo no configurado; correo omitido.");
    return false;
  }

  const templateId = getTemplateId(data.templateId);

  if (!templateId) {
    console.log("Template de Brevo no configurado; correo omitido.");
    return false;
  }

  await axios.post(
    BREVO_API_URL,
    {
      sender: getSender(),
      to: data.to,
      templateId,
      params: data.params,
      subject: data.subject,
      replyTo: data.replyTo,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY || "",
        "content-type": "application/json",
        accept: "application/json",
      },
    },
  );

  return true;
}

export async function sendNewUserCredentials(userData: UserMailData, notificationEmail?: string) {
  if (notificationEmail) {
    await sendBrevoTemplateEmail({
      to: [{ email: notificationEmail }],
      templateId: process.env.BREVO_TEMPLATE_NEW_USER_ADMIN_ID,
      subject: `Nuevo usuario creado: ${userData.name}`,
      params: {
        user: userData,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        employeeNumber: userData.id,
        year: new Date().getFullYear(),
      },
    });
  }

  if (userData.email && userData.password) {
    await sendBrevoTemplateEmail({
      to: [{ email: userData.email, name: userData.name }],
      templateId: process.env.BREVO_TEMPLATE_NEW_USER_CREDENTIALS_ID,
      subject: "Bienvenido a Dapper RH",
      params: {
        user: userData,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        employeeNumber: userData.id,
        year: new Date().getFullYear(),
      },
    });
  }

  return "Correos de alta procesados";
}

export async function sendVacationRequestCreatedEmail(request: VacationMailData, recipients: BrevoRecipient[]) {
  return sendBrevoTemplateEmail({
    to: uniqueRecipients(recipients),
    templateId: process.env.BREVO_TEMPLATE_VACATION_REQUEST_CREATED_ID,
    subject: `Nueva solicitud de vacaciones ${request.folio}`,
    params: buildVacationTemplateParams(request),
  });
}

export async function sendVacationStatusChangedEmail(request: VacationMailData) {
  if (!request.employeeEmail) return false;

  return sendBrevoTemplateEmail({
    to: [{ email: request.employeeEmail, name: request.employeeName }],
    templateId: process.env.BREVO_TEMPLATE_VACATION_STATUS_CHANGED_ID,
    subject: `Tu solicitud ${request.folio} fue actualizada`,
    params: buildVacationTemplateParams(request),
  });
}

function buildVacationTemplateParams(request: VacationMailData) {
  return {
    folio: request.folio,
    employeeName: request.employeeName,
    employeeEmail: request.employeeEmail || "",
    department: request.department,
    startDate: request.startDate,
    endDate: request.endDate,
    days: request.days,
    paidDays: request.paidDays ?? request.days,
    unpaidDays: request.unpaidDays ?? 0,
    status: request.status,
    comments: request.comments || "",
    managerComment: request.managerComment || "",
    reviewerName: request.reviewerName || "",
    link: request.link || "",
    year: new Date().getFullYear(),
  };
}

function uniqueRecipients(recipients: BrevoRecipient[]) {
  const unique = new Map<string, BrevoRecipient>();

  for (const recipient of recipients) {
    const email = recipient.email?.trim().toLowerCase();
    if (!email) continue;
    unique.set(email, { ...recipient, email });
  }

  return Array.from(unique.values());
}
