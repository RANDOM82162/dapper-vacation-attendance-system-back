import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import {
  GetAllVacationBalancesFilters,
  PaginacionRespuesta,
  UpdateVacationBalanceDto,
  VacationBalanceBase,
} from "./vacationBalancesDto";

const COLLECTION = "vacation_balances";

export async function createVacationBalanceMongo(balance: VacationBalanceBase) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    return await dbRef.insertOne(balance);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createVacationBalanceMongo");
  }
}

export async function getVacationBalanceById(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    return await dbRef.findOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getVacationBalanceById");
  }
}

export async function getVacationBalanceForEmployee(employeeId: string | undefined, employeeName: string, year: number) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    const query = employeeId
      ? {
          year,
          $or: [
            { employeeId },
            { employeeName },
          ],
        }
      : { employeeName, year };

    return await dbRef.findOne(query);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getVacationBalanceForEmployee");
  }
}

export async function updateVacationBalanceMongo(id: string, data: UpdateVacationBalanceDto) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    const movement = data.lastMove;
    const update: any = { $set: data };

    if (movement) {
      update.$push = { movements: movement };
    }

    return await dbRef.updateOne({ _id: getMongoId(id) }, update);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateVacationBalanceMongo");
  }
}

export async function upsertVacationBalanceMongo(balance: VacationBalanceBase) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    return await dbRef.updateOne(
      { employeeId: balance.employeeId, year: balance.year },
      {
        $set: {
          employeeName: balance.employeeName,
          department: balance.department,
          hireDate: balance.hireDate,
          serviceYears: balance.serviceYears,
          legalDays: balance.legalDays,
          periodStartDate: balance.periodStartDate,
          periodEndDate: balance.periodEndDate,
          updateDateTS: new Date().getTime(),
        },
        $setOnInsert: {
          _id: balance._id,
          employeeId: balance.employeeId,
          year: balance.year,
          initialDays: balance.initialDays,
          usedDays: balance.usedDays,
          availableDays: balance.availableDays,
          lastMove: balance.lastMove,
          movements: balance.movements,
          creationDateTS: balance.creationDateTS,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "upsertVacationBalanceMongo");
  }
}

export async function deleteVacationBalanceMongo(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    return await dbRef.deleteOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteVacationBalanceMongo");
  }
}

export async function deleteVacationBalancesForEmployeeMongo(employeeIdentifiers: string[], employeeName: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    const cleanIdentifiers = Array.from(new Set(employeeIdentifiers.map((value) => value?.trim()).filter(Boolean)));
    const cleanEmployeeName = employeeName?.trim();
    const queryOptions: any[] = [];

    if (cleanIdentifiers.length > 0) {
      queryOptions.push({ employeeId: { $in: cleanIdentifiers } });
    }

    if (cleanEmployeeName) {
      queryOptions.push({ employeeName: new RegExp(`^${escapeRegex(cleanEmployeeName)}$`, "i") });
    }

    if (queryOptions.length === 0) {
      return { deletedCount: 0 };
    }

    return await dbRef.deleteMany({ $or: queryOptions });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteVacationBalancesForEmployeeMongo");
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function discountVacationBalanceMongo(id: string, days: number, movement: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    return await dbRef.updateOne(
      { _id: getMongoId(id), availableDays: { $gte: days } },
      {
        $inc: { usedDays: days, availableDays: -days },
        $set: {
          lastMove: movement,
          updateDateTS: new Date().getTime(),
        },
        $push: { movements: movement } as any,
      },
    );
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "discountVacationBalanceMongo");
  }
}

export async function restoreVacationBalanceMongo(id: string, days: number, movement: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    return await dbRef.updateOne(
      { _id: getMongoId(id), usedDays: { $gte: days } },
      {
        $inc: { usedDays: -days, availableDays: days },
        $set: {
          lastMove: movement,
          updateDateTS: new Date().getTime(),
        },
        $push: { movements: movement } as any,
      },
    );
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "restoreVacationBalanceMongo");
  }
}

export async function getAllVacationBalancesMongo(
  filters: GetAllVacationBalancesFilters,
): Promise<PaginacionRespuesta<VacationBalanceBase>> {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationBalanceBase>(COLLECTION);
    const query: any = {};

    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.employeeName) query.employeeName = filters.employeeName;
    if (filters.department) query.department = filters.department;
    if (filters.year) query.year = filters.year;

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { employeeName: searchRegex },
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
        .sort({ employeeName: 1, year: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return {
      data: data as VacationBalanceBase[],
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAllVacationBalancesMongo");
  }
}
