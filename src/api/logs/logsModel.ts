import { connect } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { 
    LogActividad, 
    GetLogsFilters, 
    PaginacionRespuesta 
} from "./logsDto";

const COLLECTION = "logs";

export async function createLogMongo(log: LogActividad) {
  try {
    const db = await connect();
    const dbRef = db.collection<LogActividad>(COLLECTION);
    // Insertamos de manera "fire and forget" usualmente, pero retornamos resultado por si acaso
    const response = await dbRef.insertOne(log);
    return response;
  } catch (error) {
    // En logs, a veces es mejor solo consologuear el error para no detener el flujo principal
    console.error("Error creando log en Mongo:", error);
    return null; 
  }
}

export async function getLogsMongo(filters: GetLogsFilters): Promise<PaginacionRespuesta<LogActividad>> {
  try {
    const db = await connect();
    const dbRef = db.collection<LogActividad>(COLLECTION);
    const query: any = {};

    if (filters.usuarioId) query.usuario_id = filters.usuarioId;
    if (filters.idDespacho) query.id_despacho = filters.idDespacho;
    if (filters.idContribuyente) query.id_contribuyente = filters.idContribuyente;
    if (filters.rol) query.rol_usuario = filters.rol;

    // Filtro de Fechas
    if (filters.fechaInicio || filters.fechaFin) {
        query.fecha = {};
        if (filters.fechaInicio) query.fecha.$gte = new Date(filters.fechaInicio);
        if (filters.fechaFin) query.fecha.$lte = new Date(filters.fechaFin);
    }

    // Filtro de Búsqueda (Search)
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { descripcion: searchRegex },
        { nombre_usuario: searchRegex },
        { tipo_accion: searchRegex },
        { entidad_afectada: searchRegex },
        { nombre_despacho: searchRegex },
        { nombre_contribuyente: searchRegex }
      ];
    }

    // Filtro por Año y Mes
    if (filters.year && filters.month) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      query.creationDateTS = {
        $gte: startDate.getTime(),
        $lte: endDate.getTime(),
      };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20; // Logs suelen ser listas largas
    const skip = (page - 1) * limit;

    const [totalItems, data] = await Promise.all([
      dbRef.countDocuments(query),
      dbRef.aggregate([
        { $match: query },
        { $sort: { fecha: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Buscamos en todas las colecciones posibles de usuarios
        {
          $lookup: {
            from: "admins",
            localField: "usuario_id",
            foreignField: "uid",
            as: "admin_info"
          }
        },
        {
          $lookup: {
            from: "despachos",
            localField: "usuario_id",
            foreignField: "uid",
            as: "despacho_info"
          }
        },
        {
          $lookup: {
            from: "auxiliares",
            localField: "usuario_id",
            foreignField: "uid",
            as: "auxiliar_info"
          }
        },
        {
          $lookup: {
            from: "contribuyentes",
            localField: "usuario_id",
            foreignField: "uid",
            as: "contribuyente_info"
          }
        },
        // Lookup para obtener detalles del despacho relacionado (si existe id_despacho)
        {
          $lookup: {
            from: "despachos",
            localField: "id_despacho",
            foreignField: "uid",
            as: "despacho_relacionado_info"
          }
        },
        // Lookup para obtener detalles del contribuyente relacionado (si existe id_contribuyente)
        {
          $lookup: {
            from: "contribuyentes",
            localField: "id_contribuyente",
            foreignField: "uid",
            as: "contribuyente_relacionado_info"
          }
        },
        // Unificamos el resultado en un solo campo
        {
          $addFields: {
            usuario_detalle: {
              $ifNull: [
                { $arrayElemAt: ["$admin_info", 0] },
                { $arrayElemAt: ["$despacho_info", 0] },
                { $arrayElemAt: ["$auxiliar_info", 0] },
                { $arrayElemAt: ["$contribuyente_info", 0] }
              ]
            },
            despacho_detalle: { $arrayElemAt: ["$despacho_relacionado_info", 0] },
            contribuyente_detalle: { $arrayElemAt: ["$contribuyente_relacionado_info", 0] }
          }
        },
        // Limpiamos los arrays temporales
        {
          $project: {
            admin_info: 0,
            despacho_info: 0,
            auxiliar_info: 0,
            contribuyente_info: 0,
            despacho_relacionado_info: 0,
            contribuyente_relacionado_info: 0
          }
        }
      ]).toArray()
    ]);

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getLogsMongo");
  }
}