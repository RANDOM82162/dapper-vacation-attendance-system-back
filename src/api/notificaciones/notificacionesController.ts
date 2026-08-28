import express, { NextFunction } from "express";
import * as service from "./notificacionesService";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ParametersError } from "../../shared/classes/api-errors";
import { GetNotificacionesFilters, CategoriaNotificacion } from "./notificacionesDto";

export async function getMisNotificacionesController(
  req: express.Request, res: express.Response, next: NextFunction
) {
  try {
    const usuarioId = (req as any).user.uid; 
    
    const filters: GetNotificacionesFilters = {
      usuarioId: usuarioId,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      categoria: req.query.categoria as CategoriaNotificacion,
      soloNoLeidas: req.query.soloNoLeidas === 'true',
    };

    const serviceResponse = await service.getNotificaciones(filters);
    
    const noLeidas = serviceResponse.meta.noLeidasCount;
    const msg = noLeidas > 0 ? `Tienes ${noLeidas} notificaciones sin leer` : "Tus Avisos";

    res.status(200).send({ 
        status: HttpStatusCode.OK, 
        message: msg, 
        data: serviceResponse 
    });
  } catch (error) { next(error); }
}

export async function getUltimasNotificacionesController(
  req: express.Request, res: express.Response, next: NextFunction
) {
  try {
    const usuarioId = (req as any).user.uid;
    const filters: GetNotificacionesFilters = {
      usuarioId: usuarioId,
      page: 1,
      limit: 3
    };
    const serviceResponse = await service.getNotificaciones(filters);
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "Últimas 3 notificaciones",
      data: serviceResponse.data 
    });
  } catch (error) {
    next(error);
  }
}

export async function marcarLeidaController(
  req: express.Request | any, res: express.Response, next: NextFunction
) {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    if (!id) throw new ParametersError("Missing id", "marcarLeida", HttpStatusCode.BAD_REQUEST);

    const serviceResponse = await service.marcarLeida(id, currentUser);
    res.status(200).send({ status: HttpStatusCode.OK, message: "Notificación marcada como leída", data: serviceResponse });
  } catch (error) { next(error); }
}

export async function marcarTodasLeidasController(
  req: express.Request | any, res: express.Response, next: NextFunction
) {
  try {
    const currentUser = req.user;
    const usuarioId = currentUser.uid;
    const serviceResponse = await service.marcarTodasLeidas(usuarioId, currentUser);
    res.status(200).send({ status: HttpStatusCode.OK, message: "Todas marcadas como leídas", data: serviceResponse });
  } catch (error) { next(error); }
}