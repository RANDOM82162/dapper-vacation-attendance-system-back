import { BaseError } from "../../shared/classes/base-error";
import * as model from "./logsModel";
import { 
    CreateLogDto, 
    GetLogsFilters, 
    LogActividad 
} from "./logsDto";
import { ObjectId } from "mongodb";
import { registrarMetrica } from "../metrics/metricsService";

// --- FUNCIÓN PÚBLICA PARA USAR EN OTROS SERVICIOS ---
export async function registrarLog(dto: CreateLogDto) {
  try {
    const nuevoLog: LogActividad = {
      _id: new ObjectId(),
      fecha: new Date(),
      descripcion: dto.descripcion,
      id_despacho: dto.id_despacho,
      nombre_despacho: dto.nombre_despacho,
      id_contribuyente: dto.id_contribuyente,
      nombre_contribuyente: dto.nombre_contribuyente,
      usuario_id: dto.usuario_id,
      nombre_usuario: dto.nombre_usuario,
      rol_usuario: dto.rol_usuario,
      tipo_accion: dto.tipo_accion || 'INFO',
      entidad_afectada: dto.entidad_afectada || 'SISTEMA',
      creationDateTS: new Date().getTime(),
    };

    // No usamos await para no bloquear la respuesta al usuario en el flujo principal
    model.createLogMongo(nuevoLog).catch(err => console.error("Fallo background log:", err));

    const companyId = dto.id_despacho || dto.id_contribuyente || dto.usuario_id;
    if (companyId) {
        registrarMetrica('LOGS', companyId, 0, 1);
    }
    
    return true;
  } catch (error) {
    console.error("Error en servicio registrarLog:", error);
    return false;
  }
}

export async function getLogs(filters: GetLogsFilters) {
  try {
    return await model.getLogsMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getLogs");
  }
}