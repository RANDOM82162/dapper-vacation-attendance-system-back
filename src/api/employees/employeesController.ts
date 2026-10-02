import express, { NextFunction } from "express";
import { ParametersError } from "../../shared/classes/api-errors";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ROLES } from "../../middleware/auth.enum";
import * as service from "./employeesService";
import {
  EmployeeRole,
  EmployeeStatus,
  GetAllEmployeesFilters,
} from "./employeesDto";

export async function getEmployeesController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const filters: GetAllEmployeesFilters = {
      search: req.query.search as string,
      department: req.query.department as string,
      role: req.query.role as EmployeeRole,
      managerId: req.query.managerId as string,
      status: req.query.status as EmployeeStatus,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const serviceResponse = await service.getEmployees(filters);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Empleados obtenidos",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeByIdController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ParametersError("Missing id param", "getEmployeeById", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.getEmployeeById(id);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Empleado obtenido",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeByUidController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { uid } = req.params;
    const currentUser = req.user;

    if (!uid) {
      throw new ParametersError("Missing uid param", "getEmployeeByUid", HttpStatusCode.BAD_REQUEST);
    }

    if (
      currentUser &&
      currentUser?.uid !== uid &&
      currentUser?.role !== ROLES.ADMIN &&
      currentUser?.role !== ROLES.JEFE_DIRECTOR
    ) {
      return res.status(HttpStatusCode.NOT_AUTHORIZED).send({
        status: HttpStatusCode.NOT_AUTHORIZED,
        message: "No tienes permisos para consultar este empleado",
      });
    }

    const serviceResponse = await service.getEmployeeByUid(uid);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Empleado obtenido",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentEmployeeController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const serviceResponse = await service.getCurrentEmployeeProfile(req.user);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Empleado en sesión obtenido",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function createEmployeeController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const payload = req.body?.data || req.body;
    const currentUser = req.user;

    if (!payload) {
      throw new ParametersError("Faltan parámetros", "createEmployee", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.createEmployee(payload, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Empleado creado exitosamente",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const payload = req.body?.data || req.body;
    const currentUser = req.user;

    if (!id || !payload) {
      throw new ParametersError("Missing parameters", "updateEmployee", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.updateEmployee(id, payload, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Empleado actualizado",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployeeController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!id) {
      throw new ParametersError("Missing id param", "deleteEmployee", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.deleteEmployee(id, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Empleado eliminado",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}
