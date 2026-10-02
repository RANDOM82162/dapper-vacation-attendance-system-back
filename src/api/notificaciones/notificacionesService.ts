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
import { EmployeeRole, EmployeeStatus } from "../employees/employeesDto";
import * as employeesModel from "../employees/employeesModel";

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

    await sendPushNotification(form, mongoResponse.insertedId.toString());

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

export async function createNotificacionParaUsuariosUnaVez(
  usuarioIds: string[],
  notification: Omit<CreateNotificacionDto, "usuario_id">,
  recordatorioKey: string,
) {
  await Promise.all(Array.from(new Set(usuarioIds)).map(async (usuarioId) => {
    const notificacion: Notificacion = {
      _id: new ObjectId(),
      usuario_id: usuarioId,
      titulo: notification.titulo,
      mensaje: notification.mensaje,
      tipo: notification.tipo,
      categoria: notification.categoria || CategoriaNotificacion.GENERAL,
      leido: false,
      link_accion: notification.link_accion,
      fecha: new Date(),
      creationDateTS: Date.now(),
      recordatorioKey,
    };
    try {
      const insertedId = await model.createReminderNotificacionMongo(notificacion);

      if (insertedId) {
        await sendPushNotification({ ...notification, usuario_id: usuarioId }, insertedId.toString());
      }
    } catch (error) {
      console.error(`No se pudo crear recordatorio de vacaciones para ${usuarioId}:`, error);
    }
  }));
}

async function sendPushNotification(
  notification: Pick<CreateNotificacionDto, "usuario_id" | "titulo" | "mensaje" | "link_accion">,
  notificationId: string,
) {
  const fcmToken = await getFcmTokenByUid(notification.usuario_id);

  if (!fcmToken || !messaging) return;

  try {
    await messaging.send({
      token: fcmToken,
      data: {
        title: notification.titulo,
        body: notification.mensaje,
        url: notification.link_accion || "/notificaciones",
        notificacionId: notificationId,
      },
    });
  } catch (pushError) {
    console.error("Error enviando push notification:", pushError);
  }
}

export async function createNotificacionParaEmpleado(
  employeeName: string,
  notification: Omit<CreateNotificacionDto, "usuario_id">,
  currentUser?: any,
) {
  const employee = await employeesModel.getEmployeeByName(employeeName);
  const usuarioId = employee?.uid;

  if (!usuarioId) return null;

  return createNotificacion({ ...notification, usuario_id: usuarioId }, currentUser);
}

export async function createNotificacionParaRoles(
  roles: EmployeeRole[],
  notification: Omit<CreateNotificacionDto, "usuario_id">,
  currentUser?: any,
) {
  const employees = await employeesModel.getAllEmployeesMongo({
    status: EmployeeStatus.ACTIVO,
    page: 1,
    limit: 5000,
  });
  const realRecipients = employees.data
    .filter((employee) => roles.includes(employee.role) && employee.uid)
    .map((employee) => employee.uid as string);
  const recipients = Array.from(new Set(realRecipients));

  await Promise.all(recipients.map((usuarioId) => createNotificacion({ ...notification, usuario_id: usuarioId }, currentUser)));
}

export async function createNotificacionParaEmpleadosActivos(
  notification: Omit<CreateNotificacionDto, "usuario_id">,
  currentUser?: any,
) {
  const employees = await employeesModel.getAllEmployeesMongo({
    status: EmployeeStatus.ACTIVO,
    page: 1,
    limit: 5000,
  });
  const realRecipients = employees.data
    .filter((employee) => employee.role === EmployeeRole.EMPLEADO && employee.uid)
    .map((employee) => employee.uid as string);
  const recipients = Array.from(new Set(realRecipients));

  await Promise.all(recipients.map((usuarioId) => createNotificacion({ ...notification, usuario_id: usuarioId }, currentUser)));
}

export async function marcarLeida(id: string, currentUser: any) {
  try {
    const mongoResponse = await model.marcarLeidaMongo(id, currentUser.uid);

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

export async function marcarNoLeida(id: string, currentUser: any) {
  try {
    const mongoResponse = await model.marcarNoLeidaMongo(id, currentUser.uid);

    if (mongoResponse.modifiedCount > 0) {
      registrarLog({
        usuario_id: currentUser.uid,
        rol_usuario: currentUser.role,
        descripcion: `Notificación marcada como no leída: ${id}`,
        tipo_accion: "ACTUALIZAR",
        entidad_afectada: "NOTIFICACION",
      });
    }

    return mongoResponse.modifiedCount > 0;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "marcarNoLeida");
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
