import { ObjectId } from "mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { HttpStatusCode } from "../../shared/models/http.model";
import { registrarLog } from "../logs/logsService";
import { ROLES } from "../../middleware/auth.enum";
import { createNotificacionParaEmpleado, createNotificacionParaRoles } from "../notificaciones/notificacionesService";
import { CategoriaNotificacion, TipoNotificacion } from "../notificaciones/notificacionesDto";
import { EmployeeBase, EmployeeRole, EmployeeStatus } from "../employees/employeesDto";
import * as employeesModel from "../employees/employeesModel";
import {
  sendVacationRequestCreatedEmail,
  sendVacationStatusChangedEmail,
} from "../mail/mailService";
import { countVacationChargeableDays } from "../../shared/utils/vacationDays";
import {
  deleteVacationCalendarEvent,
  isGoogleCalendarEnabled,
  upsertVacationCalendarEvent,
} from "../../shared/services/googleCalendarService";
import {
  discountVacationBalance,
  getVacationBalanceForRequest,
  restoreVacationBalance,
} from "../vacation_balances/vacationBalancesService";
import * as model from "./vacationRequestsModel";
import {
  CreateVacationRequestDto,
  GetAllVacationRequestsFilters,
  UpdateVacationRequestDto,
  VacationRequestBase,
  VacationRequestStatus,
} from "./vacationRequestsDto";

export async function getVacationRequests(filters: GetAllVacationRequestsFilters) {
  try {
    return await model.getAllVacationRequestsMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getVacationRequests");
  }
}

export async function getVacationRequestById(id: string) {
  try {
    const request = await model.getVacationRequestById(id);

    if (!request) {
      throw new BaseError("Not found", "Solicitud no encontrada", "getVacationRequestById", HttpStatusCode.NOT_FOUND);
    }

    return request;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getVacationRequestById");
  }
}

export async function createVacationRequest(form: CreateVacationRequestDto, currentUser: any) {
  try {
    validateVacationRequest(form);

    const totalRequests = await model.countVacationRequests();
    const folio = `VAC-${String(totalRequests + 1).padStart(3, "0")}`;
    const now = new Date().getTime();
    const days = countVacationChargeableDays(form.startDate, form.endDate);
    const balance = await getVacationBalanceForRequest(form.employeeId, form.employeeName, form.startDate);
    const managerName = form.managerName?.trim() || "";
    const paidDays = Math.min(Math.max(balance.availableDays, 0), days);
    const unpaidDays = days - paidDays;

    const request: VacationRequestBase = {
      _id: new ObjectId(),
      ...form,
      folio,
      days,
      paidDays,
      unpaidDays,
      managerName,
      comments: form.comments || "",
      status: VacationRequestStatus.PENDIENTE,
      updatedAt: "Solicitud enviada",
      history: [
        `Solicitud creada por ${form.employeeName}.`,
        ...(unpaidDays > 0 ? [`Se estiman ${unpaidDays} día(s) sin goce de sueldo por exceder el saldo disponible.`] : []),
        managerName ? `Solicitud enviada a ${managerName}.` : "Solicitud enviada para revisión.",
      ].map((message) => ({ message, timestamp: now })),
      creationDateTS: now,
    };

    const mongoResponse = await model.createVacationRequestMongo(request);

    if (mongoResponse.insertedId) {
      createNotificacionParaRoles(
        [EmployeeRole.JEFE_DIRECTOR, EmployeeRole.ADMINISTRADOR],
        {
          titulo: "Nueva solicitud de vacaciones",
          mensaje: `${request.employeeName} envió la solicitud ${folio} para revisión.${unpaidDays > 0 ? ` Incluye ${unpaidDays} día(s) estimados sin goce de sueldo.` : ""}`,
          tipo: TipoNotificacion.INFO,
          categoria: CategoriaNotificacion.SISTEMA,
          link_accion: "/vacaciones/aprobaciones",
        },
        currentUser,
      ).catch(() => {});

      notifyVacationRequestCreatedByEmail(request).catch((mailError) => {
        console.error("Error enviando correo de nueva solicitud de vacaciones:", mailError);
      });

      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Creación de solicitud de vacaciones: ${folio}`,
        tipo_accion: "CREAR",
        entidad_afectada: "SOLICITUD_VACACIONES",
      }).catch(() => {});
    }

    return mongoResponse.insertedId;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "createVacationRequest");
  }
}

export async function updateVacationRequest(
  id: string,
  data: UpdateVacationRequestDto,
  currentUser: any,
) {
  try {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new BaseError("Invalid payload", "La actualización no es válida", "updateVacationRequest", HttpStatusCode.BAD_REQUEST);
    }

    const currentRequest = await getVacationRequestById(id);
    assertEmployeeOwnsRequest(currentRequest, currentUser, "updateVacationRequest");
    const suppliedFields = Object.keys(data);
    let updateData: UpdateVacationRequestDto;

    if (currentUser?.role === ROLES.EMPLEADO) {
      if (suppliedFields.includes("status")) {
        throw new BaseError("Access denied", "No puedes cambiar el estado de tu solicitud", "updateVacationRequest", HttpStatusCode.NOT_AUTHORIZED);
      }
      if (!canEmployeeEditRequest(currentRequest.status)) {
        throw new BaseError(
          "Invalid status",
          "Solo puedes modificar solicitudes pendientes o con cambios solicitados",
          "updateVacationRequest",
          HttpStatusCode.BAD_REQUEST,
        );
      }
      const employeeEditableFields: string[] = ["startDate", "endDate", "days", "comments"];
      if (suppliedFields.length === 0 || suppliedFields.some((field) => !employeeEditableFields.includes(field))) {
        throw new BaseError("Access denied", "Solo puedes modificar las fechas y comentarios de tu solicitud", "updateVacationRequest", HttpStatusCode.NOT_AUTHORIZED);
      }
      if (data.comments !== undefined && typeof data.comments !== "string") {
        throw new BaseError("Invalid comment", "El comentario no es válido", "updateVacationRequest", HttpStatusCode.BAD_REQUEST);
      }
      if ((data.startDate !== undefined && typeof data.startDate !== "string") || (data.endDate !== undefined && typeof data.endDate !== "string")) {
        throw new BaseError("Invalid dates", "Las fechas no son válidas", "updateVacationRequest", HttpStatusCode.BAD_REQUEST);
      }
      updateData = getEmployeeEditableRequestData(data);
    } else {
      if (!currentUser || (currentUser.role !== ROLES.JEFE_DIRECTOR && currentUser.role !== ROLES.ADMIN)) {
        throw new BaseError("Access denied", "No tienes permisos para actualizar esta solicitud", "updateVacationRequest", HttpStatusCode.NOT_AUTHORIZED);
      }
      if (suppliedFields.length !== 1 || suppliedFields[0] !== "managerComment") {
        throw new BaseError("Access denied", "Solo puedes modificar el comentario del jefe/director desde el historial", "updateVacationRequest", HttpStatusCode.NOT_AUTHORIZED);
      }
      if (typeof data.managerComment !== "string" || data.managerComment.length > 2000) {
        throw new BaseError("Invalid comment", "El comentario debe ser texto de hasta 2000 caracteres", "updateVacationRequest", HttpStatusCode.BAD_REQUEST);
      }
      updateData = { managerComment: data.managerComment.trim() };
    }

    updateData.updateDateTS = new Date().getTime();

    const nextStartDate = updateData.startDate || currentRequest.startDate;
    const nextEndDate = updateData.endDate || currentRequest.endDate;

    if (updateData.startDate || updateData.endDate) {
      if (nextEndDate < nextStartDate) {
        throw new BaseError("Invalid dates", "La fecha final no puede ser anterior a la fecha inicial", "updateVacationRequest", HttpStatusCode.BAD_REQUEST);
      }

      updateData.days = countVacationChargeableDays(nextStartDate, nextEndDate);

      if (updateData.days <= 0) {
        throw new BaseError(
          "Invalid days",
          "La solicitud debe incluir al menos un dia laboral descontable",
          "updateVacationRequest",
          HttpStatusCode.BAD_REQUEST,
        );
      }

      const balance = await getVacationBalanceForRequest(currentRequest.employeeId, currentRequest.employeeName, nextStartDate);
      updateData.paidDays = Math.min(Math.max(balance.availableDays, 0), updateData.days);
      updateData.unpaidDays = updateData.days - updateData.paidDays;
    }

    if (currentUser?.role === ROLES.EMPLEADO && currentRequest.status === VacationRequestStatus.CAMBIOS_SOLICITADOS) {
      updateData.status = VacationRequestStatus.PENDIENTE;
    }

    const historyEntry = getUpdateHistoryEntry(currentRequest.status, updateData, currentUser);

    if (historyEntry) {
      updateData.updatedAt = historyEntry;
    }

    const cleanUpdateData = removeUndefinedValues(updateData);
    const mongoResponse = historyEntry
      ? await model.pushVacationStatusMongo(id, cleanUpdateData, historyEntry)
      : await model.updateVacationRequestMongo(id, cleanUpdateData);

    if (mongoResponse.modifiedCount > 0 && data.status) {
      const status = data.status;
      const message = cleanUpdateData.updatedAt || `Solicitud actualizada a ${status}.`;

      createNotificacionParaEmpleado(
        currentRequest.employeeName,
        {
          titulo: `Solicitud ${status.toLowerCase()}`,
          mensaje: `${currentRequest.folio}: ${message}`,
          tipo: getNotificationTypeForVacationStatus(status),
          categoria: CategoriaNotificacion.SISTEMA,
          link_accion: "/vacaciones/mis-solicitudes",
        },
        currentUser,
      ).catch(() => {});

      notifyVacationStatusChangedByEmail(currentRequest, status, message, currentUser).catch((mailError) => {
        console.error("Error enviando correo de estado de solicitud:", mailError);
      });

      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Actualización de solicitud de vacaciones: ${currentRequest.folio}`,
        tipo_accion: "ESCRITURA",
        entidad_afectada: "SOLICITUD_VACACIONES",
      }).catch(() => {});
    }

    if (mongoResponse.modifiedCount > 0 && currentUser?.role === ROLES.EMPLEADO && !data.status) {
      createNotificacionParaRoles(
        [EmployeeRole.JEFE_DIRECTOR, EmployeeRole.ADMINISTRADOR],
        {
          titulo: "Solicitud de vacaciones actualizada",
          mensaje: `${currentRequest.employeeName} modificó la solicitud ${currentRequest.folio}.`,
          tipo: TipoNotificacion.INFO,
          categoria: CategoriaNotificacion.SISTEMA,
          link_accion: "/vacaciones/aprobaciones",
        },
        currentUser,
      ).catch(() => {});
    }

    if (mongoResponse.modifiedCount > 0 && currentUser?.role !== ROLES.EMPLEADO) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Actualizó el comentario del jefe/director de la solicitud ${currentRequest.folio}`,
        tipo_accion: "ESCRITURA",
        entidad_afectada: "SOLICITUD_VACACIONES",
      }).catch(() => {});
    }

    return mongoResponse.modifiedCount > 0;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "updateVacationRequest");
  }
}

export async function approveVacationRequest(id: string, comment: string, currentUser: any) {
  const currentRequest = await getVacationRequestById(id);

  if (currentRequest.status === VacationRequestStatus.APROBADA) {
    throw new BaseError("Already approved", "La solicitud ya fue aprobada", "approveVacationRequest", HttpStatusCode.BAD_REQUEST);
  }

  const balance = await getVacationBalanceForRequest(
    currentRequest.employeeId,
    currentRequest.employeeName,
    currentRequest.startDate,
  );
  const paidDays = Math.min(Math.max(balance.availableDays, 0), currentRequest.days);
  const unpaidDays = currentRequest.days - paidDays;

  if (!hasActiveVacationDiscount(balance, currentRequest.folio)) {
    if (paidDays > 0) {
      await discountVacationBalance(
        currentRequest.employeeId,
        currentRequest.employeeName,
        balance.year,
        paidDays,
        currentRequest.folio,
      );
    }
  }

  const updated = await changeVacationStatus(
    id,
    VacationRequestStatus.APROBADA,
    `Solicitud aprobada por ${getVacationReviewerName(currentUser)}. ${paidDays} día(s) con goce de sueldo y ${unpaidDays} sin goce de sueldo.`,
    comment,
    currentUser,
    { paidDays, unpaidDays },
  );

  if (updated) {
    await syncApprovedVacationWithCalendar(id);
  }

  return updated;
}

export async function rejectVacationRequest(id: string, comment: string, currentUser: any) {
  return changeVacationStatus(id, VacationRequestStatus.RECHAZADA, `Solicitud rechazada por ${getVacationReviewerName(currentUser)}.`, comment, currentUser);
}

export async function requestVacationChanges(id: string, comment: string, currentUser: any) {
  return changeVacationStatus(id, VacationRequestStatus.CAMBIOS_SOLICITADOS, `${getVacationReviewerName(currentUser)} solicitó cambios.`, comment, currentUser);
}

export async function cancelVacationRequest(id: string, comment: string, currentUser: any) {
  return changeVacationStatus(id, VacationRequestStatus.CANCELADA, "Solicitud cancelada.", comment, currentUser);
}

export async function deleteVacationRequest(id: string, currentUser: any) {
  try {
    const currentRequest = await getVacationRequestById(id);

    if (currentRequest.status === VacationRequestStatus.APROBADA) {
      await changeVacationStatus(
        id,
        VacationRequestStatus.CANCELADA,
        `Solicitud cancelada por ${getVacationReviewerName(currentUser)} antes de eliminarse.`,
        "",
        currentUser,
      );
    }

    const deleteResponse = await model.deleteVacationRequestMongo(id);

    if (deleteResponse.deletedCount > 0) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Eliminó la solicitud de vacaciones: ${currentRequest.folio}`,
        tipo_accion: "BORRADO",
        entidad_afectada: "SOLICITUD_VACACIONES",
      }).catch(() => {});
    }

    return deleteResponse.deletedCount > 0;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteVacationRequest");
  }
}

async function changeVacationStatus(
  id: string,
  status: VacationRequestStatus,
  historyBase: string,
  comment: string,
  currentUser: any,
  requestDetails: Partial<Pick<VacationRequestBase, "paidDays" | "unpaidDays">> = {},
) {
  try {
    const currentRequest = await getVacationRequestById(id);
    assertEmployeeOwnsRequest(currentRequest, currentUser, "changeVacationStatus");
    const cleanComment = comment?.trim();
    const historyEntry = cleanComment ? `${historyBase} Comentario: ${cleanComment}` : historyBase;
    const shouldRemoveCalendarEvent = currentRequest.status === VacationRequestStatus.APROBADA && status !== VacationRequestStatus.APROBADA;

    if (shouldRemoveCalendarEvent) {
      const balance = await getVacationBalanceForRequest(
        currentRequest.employeeId,
        currentRequest.employeeName,
        currentRequest.startDate,
      );

      if (hasActiveVacationDiscount(balance, currentRequest.folio)) {
        const paidDays = currentRequest.paidDays ?? currentRequest.days;
        if (paidDays > 0) {
          await restoreVacationBalance(
            currentRequest.employeeId,
            currentRequest.employeeName,
            balance.year,
            paidDays,
            currentRequest.folio,
          );
        }
      }
    }

    const mongoResponse = await model.pushVacationStatusMongo(
      id,
      {
        status,
        ...requestDetails,
        ...(currentUser?.role === ROLES.EMPLEADO ? {} : { managerComment: cleanComment || "" }),
        updatedAt: historyEntry,
        updateDateTS: new Date().getTime(),
      },
      historyEntry,
    );

    if (mongoResponse.modifiedCount > 0) {
      if (shouldRemoveCalendarEvent) {
        await deleteVacationFromCalendar(currentRequest);
      }

      createNotificacionParaEmpleado(
        currentRequest.employeeName,
        {
          titulo: `Solicitud ${status.toLowerCase()}`,
          mensaje: `${currentRequest.folio}: ${historyEntry}`,
          tipo: getNotificationTypeForVacationStatus(status),
          categoria: CategoriaNotificacion.SISTEMA,
          link_accion: "/vacaciones/mis-solicitudes",
        },
        currentUser,
      ).catch(() => {});

      notifyVacationStatusChangedByEmail({ ...currentRequest, ...requestDetails }, status, historyEntry, currentUser, cleanComment).catch((mailError) => {
        console.error("Error enviando correo de estado de solicitud:", mailError);
      });

      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Cambio de estado ${currentRequest.folio}: ${status}`,
        tipo_accion: "ESCRITURA",
        entidad_afectada: "SOLICITUD_VACACIONES",
      }).catch(() => {});
    }

    return mongoResponse.modifiedCount > 0;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "changeVacationStatus");
  }
}

function getNotificationTypeForVacationStatus(status: VacationRequestStatus) {
  if (status === VacationRequestStatus.APROBADA) return TipoNotificacion.SUCCESS;
  if (status === VacationRequestStatus.RECHAZADA || status === VacationRequestStatus.CANCELADA) return TipoNotificacion.ERROR;
  return TipoNotificacion.INFO;
}

function canEmployeeEditRequest(status: VacationRequestStatus) {
  return status === VacationRequestStatus.PENDIENTE || status === VacationRequestStatus.CAMBIOS_SOLICITADOS;
}

function getVacationReviewerName(currentUser: any) {
  return currentUser?.name || currentUser?.email || "jefe/director";
}

function getUpdateHistoryEntry(
  currentStatus: VacationRequestStatus,
  updateData: UpdateVacationRequestDto,
  currentUser: any,
) {
  if (currentUser?.role === ROLES.EMPLEADO) {
    if (currentStatus === VacationRequestStatus.CAMBIOS_SOLICITADOS) {
      return "Solicitud actualizada por el empleado y reenviada para revisión.";
    }

    return "Solicitud actualizada por el empleado.";
  }

  if (typeof updateData.managerComment === "string") {
    const comment = updateData.managerComment.trim() || "Comentario eliminado.";
    return `Comentario del jefe/director actualizado por ${getVacationReviewerName(currentUser)}. Comentario: ${comment}`;
  }

  return undefined;
}

function getEmployeeEditableRequestData(data: UpdateVacationRequestDto): UpdateVacationRequestDto {
  return {
    startDate: data.startDate,
    endDate: data.endDate,
    comments: data.comments,
  };
}

function removeUndefinedValues(data: UpdateVacationRequestDto): UpdateVacationRequestDto {
  const cleanData: any = {};

  for (const key in data) {
    if (data[key as keyof UpdateVacationRequestDto] !== undefined) {
      cleanData[key] = data[key as keyof UpdateVacationRequestDto];
    }
  }

  return cleanData as UpdateVacationRequestDto;
}

function assertEmployeeOwnsRequest(request: VacationRequestBase, currentUser: any, source: string) {
  if (currentUser?.role !== ROLES.EMPLEADO) return;

  if (request.employeeName === currentUser.name || request.employeeId === currentUser.employeeId) return;

  throw new BaseError(
    "Access denied",
    "No puedes modificar una solicitud de otro empleado",
    source,
    HttpStatusCode.NOT_AUTHORIZED,
  );
}

function validateVacationRequest(form: CreateVacationRequestDto) {
  if (!form.employeeName || !form.department || !form.startDate || !form.endDate) {
    throw new BaseError(
      "Missing parameters",
      "Los campos employeeName, department, startDate y endDate son obligatorios",
      "validateVacationRequest",
      HttpStatusCode.BAD_REQUEST,
    );
  }

  if (form.endDate < form.startDate) {
    throw new BaseError("Invalid dates", "La fecha final no puede ser anterior a la fecha inicial", "validateVacationRequest", HttpStatusCode.BAD_REQUEST);
  }

  if (countVacationChargeableDays(form.startDate, form.endDate) <= 0) {
    throw new BaseError(
      "Invalid days",
      "La solicitud debe incluir al menos un dia laboral descontable",
      "validateVacationRequest",
      HttpStatusCode.BAD_REQUEST,
    );
  }
}

function hasActiveVacationDiscount(balance: { movements?: string[] }, folio: string) {
  const movements = balance.movements || [];
  const approvals = movements.filter((movement) => movement.includes(`Solicitud ${folio} aprobada`)).length;
  const restorations = movements.filter((movement) => movement.includes(`Solicitud ${folio} dejó de estar aprobada`)).length;

  return approvals > restorations;
}

async function syncApprovedVacationWithCalendar(id: string) {
  const request = await getVacationRequestById(id);

  if (request.status !== VacationRequestStatus.APROBADA) return;

  if (!isGoogleCalendarEnabled()) {
    await model.updateVacationCalendarSyncMongo(id, {
      googleCalendarStatus: "SKIPPED",
      googleCalendarSyncedAt: new Date().getTime(),
      googleCalendarError: "Google Calendar no configurado",
    });
    return;
  }

  try {
    const calendarEvent = await upsertVacationCalendarEvent(
      {
        folio: request.folio,
        employeeName: request.employeeName,
        department: request.department,
        startDate: request.startDate,
        endDate: request.endDate,
        days: request.days,
        comments: request.comments,
      },
      request.googleCalendarEventId,
    );

    await model.updateVacationCalendarSyncMongo(id, {
      googleCalendarEventId: calendarEvent?.id,
      googleCalendarEventLink: calendarEvent?.htmlLink,
      googleCalendarStatus: "SYNCED",
      googleCalendarSyncedAt: new Date().getTime(),
      googleCalendarError: "",
    });
  } catch (error: any) {
    await model.updateVacationCalendarSyncMongo(id, {
      googleCalendarStatus: "ERROR",
      googleCalendarSyncedAt: new Date().getTime(),
      googleCalendarError: getCalendarErrorMessage(error),
    });
  }
}

async function deleteVacationFromCalendar(request: VacationRequestBase) {
  if (!request.googleCalendarEventId) {
    await model.updateVacationCalendarSyncMongo(request._id.toString(), {
      googleCalendarStatus: isGoogleCalendarEnabled() ? "DELETED" : "SKIPPED",
      googleCalendarSyncedAt: new Date().getTime(),
      googleCalendarError: "",
    }, true);
    return;
  }

  try {
    await deleteVacationCalendarEvent(request.googleCalendarEventId);
    await model.updateVacationCalendarSyncMongo(request._id.toString(), {
      googleCalendarStatus: "DELETED",
      googleCalendarSyncedAt: new Date().getTime(),
      googleCalendarError: "",
    }, true);
  } catch (error: any) {
    await model.updateVacationCalendarSyncMongo(request._id.toString(), {
      googleCalendarStatus: "ERROR",
      googleCalendarSyncedAt: new Date().getTime(),
      googleCalendarError: getCalendarErrorMessage(error),
    });
  }
}

function getCalendarErrorMessage(error: any) {
  return error?.response?.data?.error_description
    || error?.response?.data?.error?.message
    || error?.message
    || "Error al sincronizar Google Calendar";
}

async function notifyVacationRequestCreatedByEmail(request: VacationRequestBase) {
  const recipients = await getVacationReviewerMailRecipients();

  if (recipients.length === 0) return;

  await sendVacationRequestCreatedEmail(
    {
      folio: request.folio,
      employeeName: request.employeeName,
      employeeEmail: await getVacationEmployeeEmail(request),
      department: request.department,
      startDate: request.startDate,
      endDate: request.endDate,
      days: request.days,
      paidDays: request.paidDays,
      unpaidDays: request.unpaidDays,
      status: request.status,
      comments: request.comments,
      link: "/vacaciones/aprobaciones",
    },
    recipients,
  );
}

async function notifyVacationStatusChangedByEmail(
  request: VacationRequestBase,
  status: VacationRequestStatus,
  message: string,
  currentUser: any,
  managerComment?: string,
) {
  const employeeEmail = await getVacationEmployeeEmail(request);

  if (!employeeEmail) return;

  await sendVacationStatusChangedEmail({
    folio: request.folio,
    employeeName: request.employeeName,
    employeeEmail,
    department: request.department,
    startDate: request.startDate,
    endDate: request.endDate,
    days: request.days,
    paidDays: request.paidDays,
    unpaidDays: request.unpaidDays,
    status,
    comments: request.comments,
    managerComment: managerComment || message,
    reviewerName: getVacationReviewerName(currentUser),
    link: "/vacaciones/mis-solicitudes",
  });
}

async function getVacationEmployeeEmail(request: VacationRequestBase) {
  const employee = await findVacationEmployee(request);
  return employee?.email;
}

async function findVacationEmployee(request: VacationRequestBase) {
  const employeeId = request.employeeId?.trim();

  if (employeeId) {
    const byNumber = await employeesModel.getEmployeeByEmployeeNumber(employeeId);
    if (byNumber) return byNumber;

    if (ObjectId.isValid(employeeId)) {
      const byId = await employeesModel.getEmployeeById(employeeId);
      if (byId) return byId;
    }
  }

  return employeesModel.getEmployeeByName(request.employeeName);
}

async function getVacationReviewerMailRecipients() {
  const [directors, admins] = await Promise.all([
    getEmployeesByRole(EmployeeRole.JEFE_DIRECTOR),
    getEmployeesByRole(EmployeeRole.ADMINISTRADOR),
  ]);

  return [...directors, ...admins]
    .filter((employee) => employee.email)
    .map((employee) => ({ email: employee.email as string, name: employee.name }));
}

async function getEmployeesByRole(role: EmployeeRole): Promise<EmployeeBase[]> {
  const response = await employeesModel.getAllEmployeesMongo({
    role,
    status: EmployeeStatus.ACTIVO,
    page: 1,
    limit: 500,
  });

  return response.data;
}
