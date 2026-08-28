import * as firebase from "../../shared/database/firebase";
import { BaseError } from "../../shared/classes/base-error";
import * as model from "./notificacionesModel";
import {
  CreateNotificacionDto,
  GetNotificacionesFilters,
  Notificacion,
  CategoriaNotificacion,
} from "./notificacionesDto";
import { ObjectId } from "mongodb";
import { registrarLog } from "../logs/logsService";
import { getFcmTokenByUid } from "../fcm_tokens/fcmTokensService";

const messaging = firebase.messaging();

export async function getNotificaciones(filters: GetNotificacionesFilters) {
  try {
    return await model.getNotificacionesMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getNotificaciones");
  }
}

export async function createNotificacion(
  form: CreateNotificacionDto,
  currentUser?: any,
) {
  try {
    const nuevaNotificacion: Notificacion = {
      _id: new ObjectId(),
      usuario_id: form.usuario_id,
      titulo: form.titulo,
      mensaje: form.mensaje,
      tipo: form.tipo,
      categoria: form.categoria || CategoriaNotificacion.GENERAL,
      leido: false,
      link_accion: form.link_accion,
      fecha: new Date(),
      creationDateTS: new Date().getTime(),
    };

    const mongoResponse =
      await model.createNotificacionMongo(nuevaNotificacion);

    const fcmToken = await getFcmTokenByUid(form.usuario_id);

    if (fcmToken) {
      try {
        await messaging.send({
          token: fcmToken,
          data: {
            title: form.titulo,
            body: form.mensaje,
            url: form.link_accion || "/notificaciones",
            notificacionId: mongoResponse.insertedId.toString(),
          },
        });
      } catch (pushError) {
        console.error("Error enviando push notification:", pushError);
      }
    }

    if (currentUser) {
      registrarLog({
        usuario_id: currentUser.uid,
        rol_usuario: currentUser.role,
        descripcion: `Creación de notificación: ${form.titulo}`,
        tipo_accion: "CREAR",
        entidad_afectada: "NOTIFICACION",
        id_contribuyente: form.usuario_id,
      });
    }

    return mongoResponse.insertedId;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createNotificacion");
  }
}

export async function marcarLeida(id: string, currentUser: any) {
  try {
    const mongoResponse = await model.marcarLeidaMongo(id);

    if (mongoResponse.modifiedCount > 0) {
      registrarLog({
        usuario_id: currentUser.uid,
        rol_usuario: currentUser.role,
        descripcion: `Notificación marcada como leída: ${id}`,
        tipo_accion: "ACTUALIZAR",
        entidad_afectada: "NOTIFICACION",
      });
    }

    return mongoResponse.modifiedCount > 0;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "marcarLeida");
  }
}

export async function marcarTodasLeidas(usuarioId: string, currentUser: any) {
  try {
    const mongoResponse = await model.marcarTodasLeidasMongo(usuarioId);

    if (mongoResponse.modifiedCount > 0) {
      registrarLog({
        usuario_id: currentUser.uid,
        rol_usuario: currentUser.role,
        descripcion: `Todas las notificaciones marcadas como leídas para el usuario: ${usuarioId}`,
        tipo_accion: "ACTUALIZAR",
        entidad_afectada: "NOTIFICACION",
      });
    }

    return mongoResponse.modifiedCount;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "marcarTodasLeidas");
  }
}
