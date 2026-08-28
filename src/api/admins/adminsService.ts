import * as firebase from "../../shared/database/firebase";
import { BaseError } from "../../shared/classes/base-error";
import {
  CreateAdminDto,
  CreateAdminFormDto,
  GetAllAdminsFilters,
  UpdateAdminDto,
} from "./adminsDto";
import { HttpStatusCode } from "../../shared/models/http.model";
import {
  createAdminMongo,
  deleteAdminMongo,
  getAdminMongoById,
  getAdminMongoByUid,
  getAllAdminMongo,
  updateAdminMongo,
} from "./adminsModel";
import { registrarLog } from "../logs/logsService";
import { PERMISSIONS, ROLES } from "../../middleware/auth.enum";
import { registrarMetrica } from "../metrics/metricsService";
import { sendNewUserCredentials } from "../mail/mailService";


const firebaseAuth = firebase.auth();

export async function getAdmins(filters: GetAllAdminsFilters) {
  try {
    const mongoResponse = await getAllAdminMongo(filters);
    return mongoResponse;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAdmins");
  }
}

export async function getAdminByUid(uid: string) {
  try {
    const mongoResponse = await getAdminMongoByUid(uid);
    return mongoResponse;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAdminByUid");
  }
}

export async function getAdminById(id: string) {
  try {
    const mongoResponse = await getAdminMongoById(id);
    return mongoResponse;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAdminById");
  }
}

export async function createAdmin(
  admin: CreateAdminFormDto,
  currentUser?: any,
) {
  try {
    const adminRecord = await firebaseAuth.createUser({
      email: admin.email,
      displayName: admin.name,
      emailVerified: true,
      password: admin.password,
    });

    await firebaseAuth.setCustomUserClaims(adminRecord.uid, {
      role: ROLES.ADMIN,
      permissions: [],
    });

    const adminObject: CreateAdminDto = {
      uid: adminRecord.uid,
      name: admin.name,
      email: admin.email,
      branches: admin.branches,
      role: admin.role,
      photo:
        "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3383.jpg?semt=ais_hybrid&w=740&q=80",
      creationDateTS: new Date().getTime(),
    };

    const mongoResponse = await createAdminMongo(adminObject);

    registrarLog({
      usuario_id: currentUser?.uid || "SYSTEM",
      nombre_usuario: currentUser?.name || "SYSTEM",
      rol_usuario: currentUser?.role || "SYSTEM",
      tipo_accion: "CREAR",
      entidad_afectada: "ADMINS",
      descripcion: `Creó un nuevo administrador: ${admin.email}`,
    });

    registrarMetrica("ADMINS", "SYSTEM", 0, 1);

    try {
      const notificationEmail = currentUser.email;

      await sendNewUserCredentials(
        {
          name: admin.name,
          email: admin.email,
          id: adminRecord.uid,
          password: admin.password,
          role: ROLES.ADMIN,
        },
        notificationEmail,
      );
    } catch (mailError) {
      console.error("Error enviando correos en createAdmin:", mailError);
    }

    return mongoResponse.insertedId;
  } catch (error: any) {
    if (error?.errorInfo?.code == "auth/email-already-exists") {
      throw new BaseError(
        "Inside catch",
        "El correo electrónico ingresado ya fue registrado anteriormente",
        "createAdmin",
        HttpStatusCode.CONFLICT,
      );
    }
    throw new BaseError("Inside catch: ", error, "createAdmin");
  }
}

export async function updateAdmin(
  id: string,
  admin: UpdateAdminDto,
  currentUser?: any,
) {
  try {
    let uid = admin.uid;
    if (!uid) {
      const existing = await getAdminById(id);
      if (existing) uid = existing.uid;
    }

    if (uid && (admin.email || admin.photo || admin.name)) {
      await firebaseAuth.updateUser(uid, {
        email: admin.email,
        photoURL: admin.photo,
        displayName: admin.name,
      });
      if (admin.role) {
        await firebaseAuth.setCustomUserClaims(uid, { role: admin.role });
      }
    }

    const mongoResponse = await updateAdminMongo(id, admin);

    registrarLog({
      usuario_id: currentUser?.uid || "SYSTEM",
      nombre_usuario: currentUser?.name || "SYSTEM",
      rol_usuario: currentUser?.role || "SYSTEM",
      tipo_accion: "ACTUALIZAR",
      entidad_afectada: "ADMINS",
      descripcion: `Actualizó datos del administrador: ${admin.email || uid}`,
    });

    return mongoResponse.upsertedId;
  } catch (error: any) {
    if (error?.errorInfo?.code == "auth/email-already-exists") {
      throw new BaseError(
        "Inside catch",
        "El correo electrónico ya está registrado",
        "updateAdmin",
        HttpStatusCode.CONFLICT,
      );
    }
    throw new BaseError("Inside catch: ", error, "updateAdmin");
  }
}

export async function deleteAdmin(uid: string, currentUser?: any) {
  try {
    await firebase.auth().deleteUser(uid);
    await deleteAdminMongo(uid);

    registrarLog({
      usuario_id: currentUser?.uid || "SYSTEM",
      nombre_usuario: currentUser?.name || "SYSTEM",
      rol_usuario: currentUser?.role || "SYSTEM",
      tipo_accion: "ELIMINAR",
      entidad_afectada: "ADMINS",
      descripcion: `Eliminó al administrador con UID: ${uid}`,
    });

    registrarMetrica("ADMINS", "SYSTEM", 0, -1);

    return true;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteAdmin");
  }
}

export async function updatePassword(
  uid: string,
  password: string,
  currentUser?: any,
) {
  try {
    await firebase.auth().updateUser(uid, { password });

    registrarLog({
      usuario_id: currentUser?.uid || "SYSTEM",
      nombre_usuario: currentUser?.name || "SYSTEM",
      rol_usuario: currentUser?.role || "SYSTEM",
      tipo_accion: "ACTUALIZAR",
      entidad_afectada: "ADMINS",
      descripcion: `Actualizó contraseña del administrador: ${uid}`,
    });

    return true;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updatePassword");
  }
}
