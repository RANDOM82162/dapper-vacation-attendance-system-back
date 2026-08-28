import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { 
    Notificacion, 
    GetNotificacionesFilters, 
    PaginacionRespuesta
} from "./notificacionesDto";

const COLLECTION = "notificaciones";

export async function createNotificacionMongo(notificacion: Notificacion) {
  try {
    const db = await connect();
    const dbRef = db.collection<Notificacion>(COLLECTION);
    const response = await dbRef.insertOne(notificacion);
    return response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createNotificacionMongo");
  }
}

export async function getNotificacionesMongo(filters: GetNotificacionesFilters): Promise<PaginacionRespuesta<Notificacion>> {
  try {
    const db = await connect();
    const dbRef = db.collection<Notificacion>(COLLECTION);
    const query: any = { usuario_id: filters.usuarioId };

    if (filters.categoria) {
        query.categoria = filters.categoria;
    }

    if (filters.soloNoLeidas) {
        query.leido = false;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [totalItems, noLeidasCount, data] = await Promise.all([
      dbRef.countDocuments(query),
      dbRef.countDocuments({ usuario_id: filters.usuarioId, leido: false }),
      dbRef.find(query)
        .sort({ creationDateTS: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()
    ]);

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
        noLeidasCount
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getNotificacionesMongo");
  }
}

export async function marcarLeidaMongo(id: string) {
    try {
      const db = await connect();
      const dbRef = db.collection<Notificacion>(COLLECTION);
      return await dbRef.updateOne(
        { _id: getMongoId(id) },
        { $set: { leido: true } }
      );
    } catch (error) {
      throw new BaseError("Inside catch: ", error, "marcarLeidaMongo");
    }
}

export async function marcarTodasLeidasMongo(usuarioId: string) {
    try {
      const db = await connect();
      const dbRef = db.collection<Notificacion>(COLLECTION);
      return await dbRef.updateMany(
        { usuario_id: usuarioId, leido: false },
        { $set: { leido: true } }
      );
    } catch (error) {
      throw new BaseError("Inside catch: ", error, "marcarTodasLeidasMongo");
    }
}