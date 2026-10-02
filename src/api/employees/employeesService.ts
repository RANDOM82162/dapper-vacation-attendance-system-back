import { ObjectId } from "mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { HttpStatusCode } from "../../shared/models/http.model";
import { registrarLog } from "../logs/logsService";
import { auth } from "../../shared/database/firebase";
import * as model from "./employeesModel";
import {
  CreateEmployeeDto,
  EmployeeBase,
  EmployeeRole,
  EmployeeStatus,
  GetAllEmployeesFilters,
  UpdateEmployeeDto,
} from "./employeesDto";

const ALLOWED_DEPARTMENTS = ["Direccion", "Desarrollo"];

export async function getEmployees(filters: GetAllEmployeesFilters) {
  try {
    return await model.getAllEmployeesMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEmployees");
  }
}

export async function getEmployeeById(id: string) {
  try {
    const employee = await model.getEmployeeById(id);

    if (!employee) {
      throw new BaseError("Not found", "Empleado no encontrado", "getEmployeeById", HttpStatusCode.NOT_FOUND);
    }

    return employee;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEmployeeById");
  }
}

export async function getEmployeeByUid(uid: string) {
  try {
    const employee = await model.getEmployeeByUid(uid);

    if (!employee) {
      throw new BaseError("Not found", "Empleado no encontrado", "getEmployeeByUid", HttpStatusCode.NOT_FOUND);
    }

    return employee;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEmployeeByUid");
  }
}

export async function getCurrentEmployeeProfile(currentUser: any) {
  try {
    if (!currentUser?.uid) {
      throw new BaseError("Unauthorized", "Usuario no autenticado", "getCurrentEmployeeProfile", HttpStatusCode.NOT_AUTHORIZED);
    }

    const email = normalizeEmail(currentUser.email);
    const employeeByUid = await model.getEmployeeByUid(currentUser.uid);
    const employee = employeeByUid || (email ? await model.getEmployeeByEmail(email) : null);

    if (!employee) {
      throw new BaseError(
        "Not found",
        "No encontramos un empleado vinculado a esta cuenta. Revisa que el correo exista en Empleados.",
        "getCurrentEmployeeProfile",
        HttpStatusCode.NOT_FOUND,
      );
    }

    if (!employee.uid) {
      await model.updateEmployeeMongo(employee._id.toString(), {
        uid: currentUser.uid,
        updateDateTS: new Date().getTime(),
      });

      return {
        ...employee,
        uid: currentUser.uid,
      };
    }

    return employee;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "getCurrentEmployeeProfile");
  }
}

export async function createEmployee(form: CreateEmployeeDto, currentUser: any) {
  try {
    validateEmployee(form);

    const { password, ...employeeForm } = form;
    const email = normalizeEmail(form.email);
    validateRealUserCredentials(email, password, "createEmployee");
    const employeeNumber = normalizeEmployeeNumber(form.employeeNumber);

    const existingEmployee = await model.getEmployeeByEmail(email);
    if (existingEmployee) {
      throw new BaseError(
        "Already exists",
        "Ya existe un empleado con ese correo",
        "createEmployee",
        HttpStatusCode.ALREADY_EXISTS,
      );
    }

    const existingEmployeeNumber = await model.getEmployeeByEmployeeNumber(employeeNumber);
    if (existingEmployeeNumber) {
      throw new BaseError(
        "Already exists",
        "Ya existe un empleado con ese número de empleado",
        "createEmployee",
        HttpStatusCode.ALREADY_EXISTS,
      );
    }

    const uid = await upsertFirebaseUserForEmployee({
      uid: form.uid,
      name: form.name,
      email,
      password,
      role: form.role,
      status: form.status || EmployeeStatus.ACTIVO,
    });

    const employee: EmployeeBase = {
      _id: new ObjectId(),
      ...employeeForm,
      employeeNumber,
      uid: uid || form.uid,
      email,
      status: form.status || EmployeeStatus.ACTIVO,
      creationDateTS: new Date().getTime(),
    };

    const mongoResponse = await model.createEmployeeMongo(employee);

    if (mongoResponse.insertedId) {
      await syncVacationBalanceForEmployee(employee, currentUser);
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Creación de empleado: ${employee.name}`,
        tipo_accion: "CREAR",
        entidad_afectada: "EMPLEADO",
      }).catch(() => {});
    }

    return mongoResponse.insertedId;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "createEmployee");
  }
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeDto,
  currentUser: any,
) {
  try {
    const currentEmployee = await model.getEmployeeById(id);

    if (!currentEmployee) {
      throw new BaseError("Not found", "Empleado no encontrado", "updateEmployee", HttpStatusCode.NOT_FOUND);
    }

    if (data.role && !Object.values(EmployeeRole).includes(data.role)) {
      throw new BaseError("Invalid role", "Perfil de empleado inválido", "updateEmployee", HttpStatusCode.BAD_REQUEST);
    }

    if (data.status && !Object.values(EmployeeStatus).includes(data.status)) {
      throw new BaseError("Invalid status", "Estado de empleado inválido", "updateEmployee", HttpStatusCode.BAD_REQUEST);
    }

    if (data.hireDate && !isValidIsoDate(data.hireDate)) {
      throw new BaseError("Invalid hireDate", "La fecha de ingreso no es válida", "updateEmployee", HttpStatusCode.BAD_REQUEST);
    }

    if (data.department && !ALLOWED_DEPARTMENTS.includes(data.department)) {
      throw new BaseError("Invalid department", "Departamento inválido", "updateEmployee", HttpStatusCode.BAD_REQUEST);
    }

    const { password, ...employeeData } = data;
    const nextEmail = data.email !== undefined ? normalizeEmail(data.email) : normalizeEmail(currentEmployee.email);
    const nextEmployeeNumber = data.employeeNumber !== undefined
      ? normalizeEmployeeNumber(data.employeeNumber)
      : normalizeEmployeeNumber(currentEmployee.employeeNumber);

    validateEmailForRealUser(nextEmail, "updateEmployee");

    if (!currentEmployee.uid) {
      validateRealUserCredentials(nextEmail, password, "updateEmployee", "Este empleado no tiene cuenta vinculada. Captura una contraseña temporal para crearla.");
    } else if (password) {
      validatePassword(password, "updateEmployee");
    }

    const updateData: UpdateEmployeeDto = {
      ...employeeData,
      updateDateTS: new Date().getTime(),
    };

    if (data.email !== undefined) {
      const existingEmployee = nextEmail ? await model.getEmployeeByEmail(nextEmail) : null;

      if (existingEmployee && existingEmployee._id.toString() !== id) {
        throw new BaseError(
          "Already exists",
          "Ya existe un empleado con ese correo",
          "updateEmployee",
          HttpStatusCode.ALREADY_EXISTS,
        );
      }

      updateData.email = nextEmail;
    }

    if (data.employeeNumber !== undefined) {
      const existingEmployeeNumber = await model.getEmployeeByEmployeeNumber(nextEmployeeNumber);

      if (existingEmployeeNumber && existingEmployeeNumber._id.toString() !== id) {
        throw new BaseError(
          "Already exists",
          "Ya existe un empleado con ese número de empleado",
          "updateEmployee",
          HttpStatusCode.ALREADY_EXISTS,
        );
      }

      updateData.employeeNumber = nextEmployeeNumber;
    }

    const firebaseUid = await upsertFirebaseUserForEmployee({
      uid: currentEmployee.uid,
      name: updateData.name || currentEmployee.name,
      email: nextEmail,
      password,
      role: updateData.role || currentEmployee.role,
      status: updateData.status || currentEmployee.status,
    });

    if (firebaseUid && firebaseUid !== currentEmployee.uid) {
      updateData.uid = firebaseUid;
    }

    const mongoResponse = await model.updateEmployeeMongo(id, updateData);

    if (mongoResponse.modifiedCount > 0) {
      await syncVacationBalanceForEmployee(
        {
          ...currentEmployee,
          ...updateData,
        },
        currentUser,
      );
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Actualización de empleado: ${currentEmployee.name}`,
        tipo_accion: "ESCRITURA",
        entidad_afectada: "EMPLEADO",
      }).catch(() => {});
    }

    return mongoResponse.modifiedCount > 0;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "updateEmployee");
  }
}

export async function deleteEmployee(id: string, currentUser: any) {
  try {
    const currentEmployee = await model.getEmployeeById(id);

    if (!currentEmployee) {
      throw new BaseError("Not found", "Empleado no encontrado", "deleteEmployee", HttpStatusCode.NOT_FOUND);
    }

    await model.updateEmployeeMongo(id, {
      status: EmployeeStatus.INACTIVO,
      updateDateTS: new Date().getTime(),
    });
    await disableFirebaseUserForEmployee(currentEmployee);
    await deleteVacationBalancesForEmployee(currentEmployee, currentUser);
    await deleteFirebaseUserForEmployee(currentEmployee);

    const deleteResponse = await model.deleteEmployeeMongo(id);

    if (deleteResponse.deletedCount > 0) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Eliminó el empleado: ${currentEmployee.name}`,
        tipo_accion: "BORRADO",
        entidad_afectada: "EMPLEADO",
      }).catch(() => {});
    }

    return deleteResponse.deletedCount > 0;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "deleteEmployee");
  }
}

async function disableFirebaseUserForEmployee(employee: EmployeeBase) {
  try {
    let uid = employee.uid;

    if (!uid && employee.email) {
      const existingUser = await auth().getUserByEmail(employee.email);
      uid = existingUser.uid;
    }

    if (!uid) return;

    await auth().updateUser(uid, { disabled: true });
  } catch (error: any) {
    if (error?.code === "auth/user-not-found") return;
    throwFirebaseError(error, "disableFirebaseUserForEmployee");
  }
}

async function upsertFirebaseUserForEmployee(data: {
  uid?: string;
  name: string;
  email?: string;
  password?: string;
  role: EmployeeRole;
  status: EmployeeStatus;
}) {
  if (!data.email) return data.uid;
  if (data.password) validatePassword(data.password, "upsertFirebaseUserForEmployee");

  try {
    const disabled = data.status === EmployeeStatus.INACTIVO;
    const baseUpdate = {
      email: data.email,
      displayName: data.name,
      disabled,
    };

    const user = data.uid
      ? await auth().updateUser(data.uid, {
          ...baseUpdate,
          ...(data.password ? { password: data.password } : {}),
        })
      : await createOrUpdateFirebaseUserByEmail(data.email, data.password, baseUpdate);

    await auth().setCustomUserClaims(user.uid, {
      role: data.role,
      permissions: {},
    });

    return user.uid;
  } catch (error: any) {
    if (error?.code === "auth/user-not-found" && data.email) {
      const user = await createOrUpdateFirebaseUserByEmail(data.email, data.password, {
        email: data.email,
        displayName: data.name,
        disabled: data.status === EmployeeStatus.INACTIVO,
      });
      await auth().setCustomUserClaims(user.uid, {
        role: data.role,
        permissions: {},
      });
      return user.uid;
    }

    throwFirebaseError(error, "upsertFirebaseUserForEmployee");
  }
}

async function deleteFirebaseUserForEmployee(employee: EmployeeBase) {
  try {
    let uid = employee.uid;

    if (!uid && employee.email) {
      const existingUser = await auth().getUserByEmail(employee.email);
      uid = existingUser.uid;
    }

    if (!uid) return;

    await auth().deleteUser(uid);
  } catch (error: any) {
    if (error?.code === "auth/user-not-found") return;
    throwFirebaseError(error, "deleteFirebaseUserForEmployee");
  }
}

async function createOrUpdateFirebaseUserByEmail(
  email: string,
  password: string | undefined,
  baseUpdate: { email: string; displayName: string; disabled: boolean },
) {
  try {
    return await auth().createUser({
      ...baseUpdate,
      ...(password ? { password } : {}),
    });
  } catch (error: any) {
    if (error?.code !== "auth/email-already-exists") {
      throw error;
    }

    const existingUser = await auth().getUserByEmail(email);
    return await auth().updateUser(existingUser.uid, {
      ...baseUpdate,
      ...(password ? { password } : {}),
    });
  }
}

function validateRealUserCredentials(
  email: string | undefined,
  password: string | undefined,
  source: string,
  passwordMessage = "La contraseña temporal es obligatoria para crear la cuenta de acceso",
): asserts email is string {
  validateEmailForRealUser(email, source);

  if (!password) {
    throw new BaseError("Missing password", passwordMessage, source, HttpStatusCode.BAD_REQUEST);
  }

  validatePassword(password, source);
}

function validateEmailForRealUser(email: string | undefined, source: string): asserts email is string {
  if (!email) {
    throw new BaseError("Missing email", "El correo es obligatorio para crear la cuenta de acceso", source, HttpStatusCode.BAD_REQUEST);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BaseError("Invalid email", "El correo no tiene un formato válido", source, HttpStatusCode.BAD_REQUEST);
  }
}

function validatePassword(password: string, source: string) {
  if (password.length < 6) {
    throw new BaseError(
      "Invalid password",
      "La contraseña temporal debe tener al menos 6 caracteres",
      source,
      HttpStatusCode.BAD_REQUEST,
    );
  }
}

function throwFirebaseError(error: any, source: string): never {
  const firebaseMessages: Record<string, string> = {
    "auth/email-already-exists": "Ya existe una cuenta de Firebase con ese correo",
    "auth/invalid-email": "El correo no tiene un formato válido para Firebase",
    "auth/invalid-password": "La contraseña temporal no es válida",
    "auth/user-not-found": "No encontramos la cuenta de Firebase vinculada a este empleado",
  };

  const message = firebaseMessages[error?.code] || "No se pudo sincronizar la cuenta de Firebase";

  throw new BaseError(
    error?.code || "Firebase error",
    message,
    source,
    HttpStatusCode.BAD_REQUEST,
  );
}

function validateEmployee(form: CreateEmployeeDto) {
  if (!form.name || !form.employeeNumber || !form.department || !form.hireDate || !form.role) {
    throw new BaseError(
      "Missing parameters",
      "Los campos name, employeeNumber, department, hireDate y role son obligatorios",
      "validateEmployee",
      HttpStatusCode.BAD_REQUEST,
    );
  }

  if (!isValidIsoDate(form.hireDate)) {
    throw new BaseError("Invalid hireDate", "La fecha de ingreso no es válida", "validateEmployee", HttpStatusCode.BAD_REQUEST);
  }

  if (!Object.values(EmployeeRole).includes(form.role)) {
    throw new BaseError("Invalid role", "Perfil de empleado inválido", "validateEmployee", HttpStatusCode.BAD_REQUEST);
  }

  if (!ALLOWED_DEPARTMENTS.includes(form.department)) {
    throw new BaseError("Invalid department", "Departamento inválido", "validateEmployee", HttpStatusCode.BAD_REQUEST);
  }

  if (form.status && !Object.values(EmployeeStatus).includes(form.status)) {
    throw new BaseError("Invalid status", "Estado de empleado inválido", "validateEmployee", HttpStatusCode.BAD_REQUEST);
  }
}

function normalizeEmail(email?: string) {
  return email ? email.trim().toLowerCase() : undefined;
}

function normalizeEmployeeNumber(employeeNumber?: string) {
  const normalizedEmployeeNumber = employeeNumber?.trim();

  if (!normalizedEmployeeNumber) {
    throw new BaseError(
      "Missing employeeNumber",
      "El número de empleado es obligatorio",
      "normalizeEmployeeNumber",
      HttpStatusCode.BAD_REQUEST,
    );
  }

  return normalizedEmployeeNumber;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

async function syncVacationBalanceForEmployee(employee: EmployeeBase, currentUser: any) {
  const vacationBalancesService = await import("../vacation_balances/vacationBalancesService");
  await vacationBalancesService.syncEmployeeVacationBalanceWithMexicanLaw(employee, currentUser);
}

async function deleteVacationBalancesForEmployee(employee: EmployeeBase, currentUser: any) {
  const vacationBalancesService = await import("../vacation_balances/vacationBalancesService");
  await vacationBalancesService.deleteVacationBalancesForEmployee(employee, currentUser);
}
