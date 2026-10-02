import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import {
  EmployeeBase,
  GetAllEmployeesFilters,
  PaginacionRespuesta,
  UpdateEmployeeDto,
} from "./employeesDto";

const COLLECTION = "employees";

export async function createEmployeeMongo(employee: EmployeeBase) {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    return await dbRef.insertOne(employee);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createEmployeeMongo");
  }
}

export async function getEmployeeById(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    return await dbRef.findOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEmployeeById");
  }
}

export async function getEmployeeByUid(uid: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    return await dbRef.findOne({ uid });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEmployeeByUid");
  }
}

export async function getEmployeeByEmail(email: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    return await dbRef.findOne({ email });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEmployeeByEmail");
  }
}

export async function getEmployeeByEmployeeNumber(employeeNumber: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    return await dbRef.findOne({ employeeNumber });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEmployeeByEmployeeNumber");
  }
}

export async function getEmployeeByName(name: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    return await dbRef.findOne({ name });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEmployeeByName");
  }
}

export async function updateEmployeeMongo(id: string, data: UpdateEmployeeDto) {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    return await dbRef.updateOne({ _id: getMongoId(id) }, { $set: data });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateEmployeeMongo");
  }
}

export async function getAllEmployeesMongo(
  filters: GetAllEmployeesFilters,
): Promise<PaginacionRespuesta<EmployeeBase>> {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    const query: any = {};

    if (filters.department) query.department = filters.department;
    if (filters.role) query.role = filters.role;
    if (filters.managerId) query.managerId = filters.managerId;
    if (filters.status) query.status = filters.status;

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { employeeNumber: searchRegex },
        { department: searchRegex },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [totalItems, data] = await Promise.all([
      dbRef.countDocuments(query),
      dbRef
        .find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return {
      data: data as EmployeeBase[],
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAllEmployeesMongo");
  }
}

export async function deleteEmployeeMongo(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<EmployeeBase>(COLLECTION);
    return await dbRef.deleteOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteEmployeeMongo");
  }
}
