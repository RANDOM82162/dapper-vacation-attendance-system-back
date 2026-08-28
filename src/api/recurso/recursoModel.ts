import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import {
  RecursoBase,
  UpdateRecursoDto,
  GetAllRecursosFilters,
  PaginacionRespuesta,
} from "./recursoDto";

const COLLECTION = "recurso";

export async function createRecursoMongo(entidad: RecursoBase) {
  try {
    const db = await connect();
    const dbRef = db.collection<RecursoBase>(COLLECTION);
    return await dbRef.insertOne(entidad);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createRecursoMongo");
  }
}

export async function getRecursoById(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<RecursoBase>(COLLECTION);
    return await dbRef.findOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getRecursoById");
  }
}

export async function updateRecursoMongo(id: string, data: UpdateRecursoDto) {
  try {
    const db = await connect();
    const dbRef = db.collection<RecursoBase>(COLLECTION);
    return await dbRef.updateOne({ _id: getMongoId(id) }, { $set: data });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateRecursoMongo");
  }
}

export async function getAllRecursosMongo(
  filters: GetAllRecursosFilters,
): Promise<PaginacionRespuesta<RecursoBase>> {
  try {
    const db = await connect();
    const dbRef = db.collection<RecursoBase>(COLLECTION);
    const query: any = {};

    if (filters.id_padre) query.id_padre = filters.id_padre;

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [{ folio: searchRegex }];
    }
    if (filters.estado) query.estado = filters.estado;

    if (filters.fechaInicio || filters.fechaFin) {
      query.creationDateTS = {};
      if (filters.fechaInicio) query.creationDateTS.$gte = filters.fechaInicio;
      if (filters.fechaFin) query.creationDateTS.$lte = filters.fechaFin;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [totalItems, data] = await Promise.all([
      dbRef.countDocuments(query),
      dbRef
        .find(query)
        .sort({ creationDateTS: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return {
      data: data as RecursoBase[],
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAllRecursosMongo");
  }
}

export async function deleteRecursoMongo(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<RecursoBase>(COLLECTION);
    return await dbRef.deleteOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteRecursoMongo");
  }
}

export async function pushCambioDeEstadoMongo(
  id: string,
  nuevoEstado: string,
  logHistorico: any,
) {
  try {
    const db = await connect();
    const dbRef = db.collection<RecursoBase>(COLLECTION);
    return await dbRef.updateOne(
      { _id: getMongoId(id) },
      {
        $set: { estado: nuevoEstado as any },
        $push: { historico_estados: logHistorico } as any,
      }
    );
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "pushCambioDeEstadoMongo");
  }
}
