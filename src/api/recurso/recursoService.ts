import * as model from "./recursoModel";
import { CreateRecursoDto, UpdateRecursoDto, GetAllRecursosFilters } from "./recursoDto";
import { BaseError } from "../../shared/classes/base-error";
import { ObjectId } from "mongodb";

import { registrarLog } from "../logs/logsService";
import { registrarMetrica } from "../metrics/metricsService";

export async function getRecursos(filters: GetAllRecursosFilters) {
  try {
    return await model.getAllRecursosMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getRecursos");
  }
}

export async function createRecurso(form: CreateRecursoDto, currentUser: any) {
  try {
    const folioGenerado = form.folio || `REC-${Math.floor(Math.random() * 10000)}`;

    const entidadCompleta: any = {
      _id: new ObjectId(),
      ...form,
      folio: folioGenerado,
      creationDateTS: new Date().getTime(),
    };

    const mongoResponse = await model.createRecursoMongo(entidadCompleta);

    if (mongoResponse.insertedId) {
        registrarLog({
          usuario_id: currentUser?.uid || "SYSTEM",
          rol_usuario: currentUser?.role || "SYSTEM",
          descripcion: `Creación de recurso manual con folio: ${folioGenerado}`,
          tipo_accion: "CREAR",
          entidad_afectada: "RECURSO",
          id_contribuyente: form.id_padre,
        }).catch(() => {});

        registrarMetrica("RECURSOS", form.id_padre, form.monto_total, 1);
    }

    return mongoResponse.insertedId;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createRecurso");
  }
}

export async function updateRecursoMonto(
  id: string,
  data: UpdateRecursoDto,
  currentUser: any,
) {
  try {
    const recursoActual = await model.getRecursoById(id);
    if (!recursoActual) {
      throw new BaseError("Not found", "Recurso no encontrado", "updateRecursoMonto", 404);
    }

    const mongoResponse = await model.updateRecursoMongo(id, data);

    if (mongoResponse.modifiedCount > 0) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Actualización de recurso: ${id}`,
        tipo_accion: "ESCRITURA",
        entidad_afectada: "RECURSO",
      }).catch(() => {});

      if (data.monto_total !== undefined) {
        const diferencia = data.monto_total - recursoActual.monto_total;
        if (diferencia !== 0) {
          registrarMetrica(
            "RECURSOS",
            recursoActual.id_padre,
            diferencia,
            0,
          );
        }
      }
    }

    return mongoResponse.modifiedCount > 0;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateRecursoMonto");
  }
}

export async function deleteRecurso(id: string, currentUser: any) {
  try {
    const recursoActual = await model.getRecursoById(id);
    
    if (!recursoActual) {
        throw new BaseError("Not found", "Recurso no encontrado", "deleteRecurso", 404);
    }

    const deleteResponse = await model.deleteRecursoMongo(id);

    if (deleteResponse.deletedCount > 0) {
        registrarLog({
            usuario_id: currentUser?.uid || "SYSTEM",
            rol_usuario: currentUser?.role || "SYSTEM",
            descripcion: `Eliminó el recurso con folio ${recursoActual.folio}`,
            tipo_accion: "BORRADO",
            entidad_afectada: "RECURSO",
            id_contribuyente: recursoActual.id_padre,
        }).catch(() => {});

        registrarMetrica(
            "RECURSOS",
            recursoActual.id_padre,
            -recursoActual.monto_total,
            -1,
        );
    }

    return deleteResponse.deletedCount > 0;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteRecurso");
  }
}
