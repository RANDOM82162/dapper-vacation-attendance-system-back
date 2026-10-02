import express, { NextFunction } from "express";
import { ParametersError } from "../../shared/classes/api-errors";
import { HttpStatusCode } from "../../shared/models/http.model";
import * as service from "./vacationRequestsService";
import { ROLES } from "../../middleware/auth.enum";
import {
  GetAllVacationRequestsFilters,
  VacationRequestStatus,
} from "./vacationRequestsDto";

export async function getVacationRequestsController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const currentUser = req.user;
    const filters: GetAllVacationRequestsFilters = {
      search: req.query.search as string,
      employeeId: req.query.employeeId as string,
      employeeName: req.query.employeeName as string,
      managerId: req.query.managerId as string,
      status: req.query.status as VacationRequestStatus,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    if (currentUser?.role === ROLES.EMPLEADO) {
      filters.employeeId = currentUser.employeeId;
      filters.employeeName = currentUser.name;
    }

    const serviceResponse = await service.getVacationRequests(filters);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Solicitudes obtenidas",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVacationRequestByIdController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ParametersError("Missing id param", "getVacationRequestById", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.getVacationRequestById(id);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Solicitud obtenida",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function createVacationRequestController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const payload = req.body?.data || req.body;
    const currentUser = req.user;

    if (!payload) {
      throw new ParametersError("Faltan parámetros", "createVacationRequest", HttpStatusCode.BAD_REQUEST);
    }

    const safePayload = currentUser?.role === ROLES.EMPLEADO
      ? {
          ...payload,
          employeeId: currentUser.employeeId || payload.employeeId,
          employeeName: currentUser.name || payload.employeeName,
          department: currentUser.department || payload.department,
        }
      : payload;

    const serviceResponse = await service.createVacationRequest(safePayload, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Solicitud creada exitosamente",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVacationRequestController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const payload = req.body?.data || req.body;
    const currentUser = req.user;

    if (!id || !payload) {
      throw new ParametersError("Missing parameters", "updateVacationRequest", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.updateVacationRequest(id, payload, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Solicitud actualizada",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveVacationRequestController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const serviceResponse = await runStatusAction(req, service.approveVacationRequest);
    res.status(HttpStatusCode.OK).send({ status: HttpStatusCode.OK, message: "Solicitud aprobada", data: serviceResponse });
  } catch (error) {
    next(error);
  }
}

export async function rejectVacationRequestController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const serviceResponse = await runStatusAction(req, service.rejectVacationRequest);
    res.status(HttpStatusCode.OK).send({ status: HttpStatusCode.OK, message: "Solicitud rechazada", data: serviceResponse });
  } catch (error) {
    next(error);
  }
}

export async function requestVacationChangesController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const serviceResponse = await runStatusAction(req, service.requestVacationChanges);
    res.status(HttpStatusCode.OK).send({ status: HttpStatusCode.OK, message: "Cambios solicitados", data: serviceResponse });
  } catch (error) {
    next(error);
  }
}

export async function cancelVacationRequestController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const serviceResponse = await runStatusAction(req, service.cancelVacationRequest);
    res.status(HttpStatusCode.OK).send({ status: HttpStatusCode.OK, message: "Solicitud cancelada", data: serviceResponse });
  } catch (error) {
    next(error);
  }
}

export async function deleteVacationRequestController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!id) {
      throw new ParametersError("Missing id param", "deleteVacationRequest", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.deleteVacationRequest(id, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Solicitud eliminada",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

async function runStatusAction(
  req: express.Request | any,
  action: (id: string, comment: string, currentUser: any) => Promise<boolean>,
) {
  const { id } = req.params;
  const payload = req.body?.data || req.body || {};

  if (!id) {
    throw new ParametersError("Missing id param", "runStatusAction", HttpStatusCode.BAD_REQUEST);
  }

  return action(id, payload.comment || "", req.user);
}
