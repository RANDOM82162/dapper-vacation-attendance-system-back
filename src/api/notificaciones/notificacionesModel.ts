import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { 
    Notificacion, 
    GetNotificacionesFilters, 
    PaginacionRespuesta
} from "./notificacionesDto";

const COLLECTION = "notifications";

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

export async function ensureReminderNotificationIndex() {
  const db = await connect();
  return db.collection<Notificacion>(COLLECTION).createIndex(
    { recordatorioKey: 1, usuario_id: 1 },
    {
      unique: true,
      partialFilterExpression: { recordatorioKey: { $exists: true } },
      name: "unique_vacation_reminder_per_user",
    },
  );
}

export async function createReminderNotificacionMongo(notificacion: Notificacion) {
  try {
    const db = await connect();
    const dbRef = db.collection<Notificacion>(COLLECTION);
    const response = await dbRef.updateOne(
      { recordatorioKey: notificacion.recordatorioKey, usuario_id: notificacion.usuario_id },
      { $setOnInsert: notificacion },
      { upsert: true },
    );

    return response.upsertedId?._id || null;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createReminderNotificacionMongo");
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

export async function marcarLeidaMongo(id: string, usuarioId: string) {
    try {
      const db = await connect();
      const dbRef = db.collection<Notificacion>(COLLECTION);
      return await dbRef.updateOne(
        { _id: getMongoId(id), usuario_id: usuarioId },
        { $set: { leido: true } }
      );
    } catch (error) {
      throw new BaseError("Inside catch: ", error, "marcarLeidaMongo");
    }
}

export async function marcarNoLeidaMongo(id: string, usuarioId: string) {
    try {
      const db = await connect();
      const dbRef = db.collection<Notificacion>(COLLECTION);
      return await dbRef.updateOne(
        { _id: getMongoId(id), usuario_id: usuarioId },
        { $set: { leido: false } }
      );
    } catch (error) {
      throw new BaseError("Inside catch: ", error, "marcarNoLeidaMongo");
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
