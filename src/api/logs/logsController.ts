import express, { NextFunction } from "express";
import * as service from "./logsService";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ParametersError } from "../../shared/classes/api-errors";
import { GetLogsFilters } from "./logsDto";
import { ROLES } from "../../middleware/auth.enum";

// 1. Endpoint para ADMIN (Ve todo)
export async function getAllLogsAdminController(
  req: express.Request, res: express.Response, next: NextFunction
) {
  try {
    const filters: GetLogsFilters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      // Admin puede filtrar por cualquier cosa opcionalmente
      idDespacho: req.query.idDespacho as string,
      rol: req.query.rol as string,
      search: req.query.search as string,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
    };

    const serviceResponse = await service.getLogs(filters);
    res.status(200).send({ status: HttpStatusCode.OK, message: "Bitácora completa obtenida", data: serviceResponse });
  } catch (error) { next(error); }
}

// 2. Endpoint para DESPACHO (Ve logs propios y de sus contribuyentes/auxiliares)
export async function getLogsDespachoController(
  req: express.Request, res: express.Response, next: NextFunction
) {
  try {
    const { uid } = req.params;
    if (!uid) throw new ParametersError("Missing despachoId", "getLogsDespacho", HttpStatusCode.BAD_REQUEST);

    const filters: GetLogsFilters = {
      idDespacho: uid, // Filtro clave: Solo logs asociados a este despacho
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      rol: req.query.rol as string, // Puede filtrar por 'CONTRIBUYENTE' para ver qué hacen sus clientes
      search: req.query.search as string,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
    };

    const serviceResponse = await service.getLogs(filters);
    res.status(200).send({ status: HttpStatusCode.OK, message: "Bitácora del despacho obtenida", data: serviceResponse });
  } catch (error) { next(error); }
}

// 3. Endpoint para CONTRIBUYENTE (Ve sus propios movimientos)
export async function getLogsContribuyenteController(
  req: express.Request, res: express.Response, next: NextFunction
) {
  try {
    const { uid } = req.params;
    if (!uid) throw new ParametersError("Missing contribuyenteId", "getLogsContribuyente", HttpStatusCode.BAD_REQUEST);

    const filters: GetLogsFilters = {
      idContribuyente: uid, // Filtro clave
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      search: req.query.search as string,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
    };

    const serviceResponse = await service.getLogs(filters);
    res.status(200).send({ status: HttpStatusCode.OK, message: "Tu historial de actividad", data: serviceResponse });
  } catch (error) { next(error); }
}