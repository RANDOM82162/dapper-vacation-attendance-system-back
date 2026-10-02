import express, { NextFunction } from "express";
import { ParametersError } from "../../shared/classes/api-errors";
import * as service from "./attendanceRecordsService";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ROLES } from "../../middleware/auth.enum";
import { GetAllAttendanceImportsFilters, GetAllAttendanceRecordsFilters } from "./attendanceRecordsDto";

export async function getAttendanceRecordsController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const currentUser = req.user;
    const filters: GetAllAttendanceRecordsFilters = {
      weekKey: req.query.weekKey as string,
      employeeId: req.query.employeeId as string,
      employeeName: req.query.employeeName as string,
      department: req.query.department as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    if (currentUser?.role === ROLES.EMPLEADO && !isDirectionUser(currentUser)) {
      filters.employeeName = currentUser.name;
      filters.employeeId = currentUser.employeeNumber;
    }

    const serviceResponse = await service.getAttendanceRecords(filters);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Registros de asistencia obtenidos",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceImportsController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const currentUser = req.user;
    const filters: GetAllAttendanceImportsFilters = {
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const serviceResponse = await service.getAttendanceImports(filters);
    const responseData = canViewFullAttendanceImports(currentUser)
      ? serviceResponse
      : {
          data: serviceResponse.data.map((attendanceImport) => ({
            weeks: (attendanceImport.weeks || [])
              .filter((week) => week.status === "GUARDADA")
              .map(({ weekKey, weekLabel, weekStartDate, weekEndDate, status }) => ({
                weekKey,
                weekLabel,
                weekStartDate,
                weekEndDate,
                status,
              })),
          })),
        };

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Cargas de asistencia obtenidas",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceSettingsController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const serviceResponse = await service.getAttendanceSettings();

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Configuración de asistencia obtenida",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendanceSettingsController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const payload = req.body?.data || req.body || {};

    if (!canManageAttendanceAdmin(req.user)) {
      return res.status(HttpStatusCode.NOT_AUTHORIZED).send({
        status: HttpStatusCode.NOT_AUTHORIZED,
        message: "No tienes permisos suficientes para modificar configuración de asistencia",
      });
    }

    const serviceResponse = await service.updateAttendanceSettings(payload, req.user);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Configuración de asistencia actualizada",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function importAttendanceRecordsController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const payload = req.body?.data || req.body;

    if (!canManageAttendanceAdmin(req.user)) {
      return res.status(HttpStatusCode.NOT_AUTHORIZED).send({
        status: HttpStatusCode.NOT_AUTHORIZED,
        message: "No tienes permisos suficientes para cargar asistencia",
      });
    }

    const serviceResponse = await service.importAttendanceRecords(payload, req.user);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Importacion de asistencia procesada",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttendanceImportController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ParametersError("Missing id param", "deleteAttendanceImport", HttpStatusCode.BAD_REQUEST);
    }

    if (!canManageAttendanceAdmin(req.user)) {
      return res.status(HttpStatusCode.NOT_AUTHORIZED).send({
        status: HttpStatusCode.NOT_AUTHORIZED,
        message: "No tienes permisos suficientes para eliminar cargas de asistencia",
      });
    }

    const serviceResponse = await service.deleteAttendanceImport(id, req.user);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Carga de asistencia eliminada",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendancePermissionController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const payload = req.body?.data || req.body;

    if (!id || !payload?.field || payload.hasPermission === undefined) {
      throw new ParametersError("Missing parameters", "updateAttendancePermission", HttpStatusCode.BAD_REQUEST);
    }

    if (!canManageAttendancePermissions(req.user)) {
      return res.status(HttpStatusCode.NOT_AUTHORIZED).send({
        status: HttpStatusCode.NOT_AUTHORIZED,
        message: "No tienes permisos suficientes para modificar permisos de asistencia",
      });
    }

    const serviceResponse = await service.updateAttendancePermission(
      id,
      { ...payload, hasPermission: Boolean(payload.hasPermission) },
      req.user,
    );

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Permiso actualizado",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendanceForgivenessController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const payload = req.body?.data || req.body;

    if (!id) {
      throw new ParametersError("Missing id param", "updateAttendanceForgiveness", HttpStatusCode.BAD_REQUEST);
    }

    if (!canManageAttendancePermissions(req.user)) {
      return res.status(HttpStatusCode.NOT_AUTHORIZED).send({
        status: HttpStatusCode.NOT_AUTHORIZED,
        message: "No tienes permisos suficientes para perdonar observaciones de asistencia",
      });
    }

    const serviceResponse = await service.updateAttendanceForgiveness(id, payload || {}, req.user);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Observaciones actualizadas",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

function canManageAttendancePermissions(currentUser: express.Request["user"]) {
  if (!currentUser) return false;
  if (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.JEFE_DIRECTOR) return true;

  return isDirectionUser(currentUser);
}

function canManageAttendanceAdmin(currentUser: express.Request["user"]) {
  if (!currentUser) return false;
  if (currentUser.role === ROLES.ADMIN) return true;

  return isDirectionUser(currentUser);
}

function isDirectionUser(currentUser: express.Request["user"]) {
  if (!currentUser) return false;

  const department = normalizeText(currentUser.department || "");
  return department.includes("direccion");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function canViewFullAttendanceImports(currentUser: express.Request["user"]) {
  if (!currentUser) return false;
  if (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.JEFE_DIRECTOR) return true;

  return isDirectionUser(currentUser);
}
