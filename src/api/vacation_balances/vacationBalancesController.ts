import express, { NextFunction } from "express";
import { ParametersError } from "../../shared/classes/api-errors";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ROLES } from "../../middleware/auth.enum";
import * as service from "./vacationBalancesService";
import { GetAllVacationBalancesFilters } from "./vacationBalancesDto";

export async function getVacationBalancesController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const currentUser = req.user;
    const filters: GetAllVacationBalancesFilters = {
      search: req.query.search as string,
      employeeId: req.query.employeeId as string,
      employeeName: req.query.employeeName as string,
      department: req.query.department as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      referenceDate: req.query.referenceDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    if (currentUser?.role === ROLES.EMPLEADO) {
      filters.employeeId = currentUser.employeeId;
      filters.employeeName = currentUser.name;
    }

    const serviceResponse = await service.getVacationBalances(filters);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Saldos obtenidos",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVacationBalanceByIdController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ParametersError("Missing id param", "getVacationBalanceById", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.getVacationBalanceById(id);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Saldo obtenido",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function createVacationBalanceController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const payload = req.body?.data || req.body;
    const serviceResponse = await service.createVacationBalance(payload, req.user);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Saldo creado exitosamente",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVacationBalanceController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const payload = req.body?.data || req.body;

    if (!id || !payload) {
      throw new ParametersError("Missing parameters", "updateVacationBalance", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.updateVacationBalance(id, payload, req.user);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Saldo actualizado",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteVacationBalanceController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ParametersError("Missing id param", "deleteVacationBalance", HttpStatusCode.BAD_REQUEST);
    }

    const serviceResponse = await service.deleteVacationBalance(id, req.user);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Saldo eliminado",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}
