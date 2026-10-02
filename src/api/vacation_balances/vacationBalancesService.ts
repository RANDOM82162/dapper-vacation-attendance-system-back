import { ObjectId } from "mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { HttpStatusCode } from "../../shared/models/http.model";
import { registrarLog } from "../logs/logsService";
import { EmployeeBase, EmployeeStatus } from "../employees/employeesDto";
import * as employeesModel from "../employees/employeesModel";
import * as model from "./vacationBalancesModel";
import { getVacationPeriodForDate } from "../../shared/utils/mexicanVacationPolicy";
import {
  CreateVacationBalanceDto,
  GetAllVacationBalancesFilters,
  UpdateVacationBalanceDto,
  VacationBalanceBase,
} from "./vacationBalancesDto";

export async function getVacationBalances(filters: GetAllVacationBalancesFilters) {
  try {
    await syncVacationBalancesWithMexicanLaw(parseReferenceDate(filters.referenceDate));
    return await model.getAllVacationBalancesMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getVacationBalances");
  }
}

export async function getVacationBalanceById(id: string) {
  try {
    const balance = await model.getVacationBalanceById(id);

    if (!balance) {
      throw new BaseError("Not found", "Saldo no encontrado", "getVacationBalanceById", HttpStatusCode.NOT_FOUND);
    }

    return balance;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getVacationBalanceById");
  }
}

export async function getVacationBalanceForEmployee(employeeId: string | undefined, employeeName: string, year: number) {
  try {
    const balance = await model.getVacationBalanceForEmployee(employeeId, employeeName, year);

    if (!balance) {
      throw new BaseError("Not found", "Saldo de vacaciones no encontrado", "getVacationBalanceForEmployee", HttpStatusCode.NOT_FOUND);
    }

    return balance;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "getVacationBalanceForEmployee");
  }
}

export async function getVacationBalanceForRequest(employeeId: string | undefined, employeeName: string, requestDate: string) {
  try {
    const employee = await findEmployeeForVacationBalance(employeeId, employeeName);
    const period = employee?.hireDate
      ? getVacationPeriodForDate(employee.hireDate, new Date(`${requestDate}T00:00:00`))
      : null;

    const year = period?.year || Number(requestDate.slice(0, 4));

    if (employee && period) {
      await syncEmployeeVacationBalanceWithMexicanLaw(employee, undefined, new Date(`${requestDate}T00:00:00`));
    }

    const balance = await model.getVacationBalanceForEmployee(
      employee?._id?.toString() || employeeId,
      employee?.name || employeeName,
      year,
    );

    return balance || {
      _id: new ObjectId(),
      employeeId: employee?._id?.toString() || employeeId,
      employeeName: employee?.name || employeeName,
      department: employee?.department || "",
      hireDate: employee?.hireDate,
      year,
      serviceYears: period?.serviceYears,
      legalDays: period?.legalDays ?? 0,
      periodStartDate: period?.periodStartDate,
      periodEndDate: period?.periodEndDate,
      initialDays: 0,
      usedDays: 0,
      availableDays: 0,
      creationDateTS: new Date().getTime(),
    };
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "getVacationBalanceForRequest");
  }
}

export async function createVacationBalance(form: CreateVacationBalanceDto, currentUser: any) {
  try {
    if (!form.employeeName || !form.department || !form.year || form.initialDays === undefined) {
      throw new BaseError(
        "Missing parameters",
        "Los campos employeeName, department, year e initialDays son obligatorios",
        "createVacationBalance",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const existingBalance = await model.getVacationBalanceForEmployee(form.employeeId, form.employeeName, Number(form.year));

    if (existingBalance) {
      throw new BaseError(
        "Duplicated vacation balance",
        "Este empleado ya tiene un saldo registrado para ese año",
        "createVacationBalance",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const usedDays = form.usedDays || 0;
    const balance: VacationBalanceBase = {
      _id: new ObjectId(),
      ...form,
      usedDays,
      availableDays: form.availableDays ?? form.initialDays - usedDays,
      lastMove: form.lastMove || "Saldo inicial",
      movements: form.lastMove ? [form.lastMove] : ["Saldo inicial"],
      creationDateTS: new Date().getTime(),
    };

    const mongoResponse = await model.createVacationBalanceMongo(balance);

    if (mongoResponse.insertedId) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Creación de saldo de vacaciones: ${balance.employeeName} ${balance.year}`,
        tipo_accion: "CREAR",
        entidad_afectada: "SALDO_VACACIONES",
      }).catch(() => {});
    }

    return mongoResponse.insertedId;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "createVacationBalance");
  }
}

export async function updateVacationBalance(id: string, data: UpdateVacationBalanceDto, currentUser: any) {
  try {
    const currentBalance = await getVacationBalanceById(id);
    const updateData: UpdateVacationBalanceDto = {
      ...data,
      updateDateTS: new Date().getTime(),
    };

    if (data.initialDays !== undefined || data.usedDays !== undefined) {
      const initialDays = data.initialDays ?? currentBalance.initialDays;
      const usedDays = data.usedDays ?? currentBalance.usedDays;
      updateData.availableDays = data.availableDays ?? initialDays - usedDays;
    }

    updateData.lastMove = data.lastMove || "Saldo editado manualmente";

    const mongoResponse = await model.updateVacationBalanceMongo(id, updateData);

    if (mongoResponse.modifiedCount > 0) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Actualización de saldo de vacaciones: ${currentBalance.employeeName} ${currentBalance.year}`,
        tipo_accion: "ESCRITURA",
        entidad_afectada: "SALDO_VACACIONES",
      }).catch(() => {});
    }

    return mongoResponse.modifiedCount > 0;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateVacationBalance");
  }
}

export async function deleteVacationBalance(id: string, currentUser: any) {
  try {
    const currentBalance = await getVacationBalanceById(id);
    const mongoResponse = await model.deleteVacationBalanceMongo(id);

    if (mongoResponse.deletedCount > 0) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Eliminación de saldo de vacaciones: ${currentBalance.employeeName} ${currentBalance.year}`,
        tipo_accion: "BORRADO",
        entidad_afectada: "SALDO_VACACIONES",
      }).catch(() => {});
    }

    return mongoResponse.deletedCount > 0;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "deleteVacationBalance");
  }
}

export async function deleteVacationBalancesForEmployee(employee: {
  _id?: { toString(): string };
  uid?: string;
  employeeNumber?: string;
  name: string;
}, currentUser: any) {
  try {
    const employeeIdentifiers = [
      employee._id?.toString(),
      employee.employeeNumber,
      employee.uid,
    ].filter((value): value is string => Boolean(value));

    const mongoResponse = await model.deleteVacationBalancesForEmployeeMongo(employeeIdentifiers, employee.name);

    if (mongoResponse.deletedCount > 0) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Eliminó ${mongoResponse.deletedCount} saldo(s) de vacaciones del empleado: ${employee.name}`,
        tipo_accion: "BORRADO",
        entidad_afectada: "SALDO_VACACIONES",
      }).catch(() => {});
    }

    return mongoResponse.deletedCount;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteVacationBalancesForEmployee");
  }
}

export async function syncVacationBalancesWithMexicanLaw(referenceDate = new Date()) {
  const employees = await employeesModel.getAllEmployeesMongo({
    status: EmployeeStatus.ACTIVO,
    page: 1,
    limit: 5000,
  });

  await Promise.all(
    employees.data.map((employee) => syncEmployeeVacationBalanceWithMexicanLaw(employee, undefined, referenceDate)),
  );
}

export async function syncEmployeeVacationBalanceWithMexicanLaw(
  employee: EmployeeBase,
  currentUser?: any,
  referenceDate = new Date(),
) {
  if (!employee.hireDate || employee.status !== EmployeeStatus.ACTIVO) return null;

  const period = getVacationPeriodForDate(employee.hireDate, referenceDate);

  if (!period) return null;

  const balance: VacationBalanceBase = {
    _id: new ObjectId(),
    employeeId: employee._id.toString(),
    employeeName: employee.name,
    department: employee.department,
    hireDate: employee.hireDate,
    year: period.year,
    serviceYears: period.serviceYears,
    legalDays: period.legalDays,
    periodStartDate: period.periodStartDate,
    periodEndDate: period.periodEndDate,
    initialDays: period.legalDays,
    usedDays: 0,
    availableDays: period.legalDays,
    lastMove: `Saldo legal automático por ${period.serviceYears} año(s) de antigüedad`,
    movements: [`Saldo legal automático por ${period.serviceYears} año(s) de antigüedad`],
    creationDateTS: new Date().getTime(),
  };

  const mongoResponse = await model.upsertVacationBalanceMongo(balance);

  if (mongoResponse.upsertedId) {
    registrarLog({
      usuario_id: currentUser?.uid || "SYSTEM",
      rol_usuario: currentUser?.role || "SYSTEM",
      descripcion: `Creación automática de saldo legal: ${employee.name} ${period.year}`,
      tipo_accion: "CREAR",
      entidad_afectada: "SALDO_VACACIONES",
    }).catch(() => {});
  }

  return mongoResponse;
}

export async function discountVacationBalance(
  employeeId: string | undefined,
  employeeName: string,
  year: number,
  days: number,
  folio: string,
) {
  try {
    const balance = await getVacationBalanceForEmployee(employeeId, employeeName, year);

    if (balance.availableDays < days) {
      throw new BaseError("Insufficient balance", "El empleado no tiene saldo suficiente", "discountVacationBalance", HttpStatusCode.BAD_REQUEST);
    }

    const movement = `Solicitud ${folio} aprobada: -${days} dias`;
    const mongoResponse = await model.discountVacationBalanceMongo(balance._id.toString(), days, movement);

    if (mongoResponse.modifiedCount === 0) {
      throw new BaseError("Insufficient balance", "El empleado no tiene saldo suficiente", "discountVacationBalance", HttpStatusCode.BAD_REQUEST);
    }

    return true;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "discountVacationBalance");
  }
}

export async function restoreVacationBalance(
  employeeId: string | undefined,
  employeeName: string,
  year: number,
  days: number,
  folio: string,
) {
  try {
    const balance = await getVacationBalanceForEmployee(employeeId, employeeName, year);
    const movement = `Solicitud ${folio} dejó de estar aprobada: +${days} dias`;
    const mongoResponse = await model.restoreVacationBalanceMongo(balance._id.toString(), days, movement);

    if (mongoResponse.modifiedCount === 0) {
      throw new BaseError("Invalid balance", "No se pudo devolver el saldo de vacaciones", "restoreVacationBalance", HttpStatusCode.BAD_REQUEST);
    }

    return true;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "restoreVacationBalance");
  }
}

function parseReferenceDate(referenceDate?: string) {
  if (!referenceDate) return new Date();

  const date = new Date(`${referenceDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function findEmployeeForVacationBalance(employeeId: string | undefined, employeeName: string) {
  if (employeeId) {
    const employeeById = await employeesModel.getEmployeeById(employeeId);
    if (employeeById) return employeeById;

    const employeeByNumber = await employeesModel.getEmployeeByEmployeeNumber(employeeId);
    if (employeeByNumber) return employeeByNumber;
  }

  return await employeesModel.getEmployeeByName(employeeName);
}
