import express, { NextFunction } from "express";
import * as service from "./recursoService";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ParametersError } from "../../shared/classes/api-errors";
import { GetAllRecursosFilters, EstadoRecurso } from "./recursoDto";

export async function getRecursosController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const filters: GetAllRecursosFilters = {
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      fechaInicio: req.query.fechaInicio ? parseInt(req.query.fechaInicio as string) : undefined,
      fechaFin: req.query.fechaFin ? parseInt(req.query.fechaFin as string) : undefined,
      id_padre: req.query.id_padre as string,
      estado: req.query.estado as EstadoRecurso,
    };

    const serviceResponse = await service.getRecursos(filters);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Recursos obtenidos",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function createRecursoController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const payload = req.body;
    const currentUser = req.user;

    if (!payload || !payload.id_padre) {
      throw new ParametersError(
        "Faltan parámetros",
        "Cuerpo de la petición o [id_padre] vacíos",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const serviceResponse = await service.createRecurso(payload, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Recurso creado exitosamente",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRecursoController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const payload = req.body;
    const currentUser = req.user;

    if (!id || !payload) {
      throw new ParametersError(
        "Missing parameters",
        "updateRecurso",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const serviceResponse = await service.updateRecursoMonto(id, payload, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Recurso actualizado",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecursoController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!id) {
      throw new ParametersError(
        "Missing id param",
        "deleteRecurso",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const serviceResponse = await service.deleteRecurso(id, currentUser);

    res.status(HttpStatusCode.OK).send({
      status: HttpStatusCode.OK,
      message: "Recurso eliminado",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}
