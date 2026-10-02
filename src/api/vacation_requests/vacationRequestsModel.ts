import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import {
  GetAllVacationRequestsFilters,
  PaginacionRespuesta,
  UpdateVacationRequestDto,
  VacationRequestBase,
  VacationRequestStatus,
} from "./vacationRequestsDto";

const COLLECTION = "vacation_requests";

export async function createVacationRequestMongo(request: VacationRequestBase) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);
    return await dbRef.insertOne(request);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createVacationRequestMongo");
  }
}

export async function getVacationRequestById(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);
    return await dbRef.findOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getVacationRequestById");
  }
}

export async function countVacationRequests() {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);
    return await dbRef.countDocuments();
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "countVacationRequests");
  }
}

export async function updateVacationRequestMongo(id: string, data: UpdateVacationRequestDto) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);
    return await dbRef.updateOne({ _id: getMongoId(id) }, { $set: data });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateVacationRequestMongo");
  }
}

export async function getAllVacationRequestsMongo(
  filters: GetAllVacationRequestsFilters,
): Promise<PaginacionRespuesta<VacationRequestBase>> {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);
    const query: any = {};

    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.employeeName) query.employeeName = filters.employeeName;
    if (filters.managerId) query.managerId = filters.managerId;
    if (filters.status) query.status = filters.status;

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { folio: searchRegex },
        { employeeName: searchRegex },
        { department: searchRegex },
        { managerName: searchRegex },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [totalItems, data] = await Promise.all([
      dbRef.countDocuments(query),
      dbRef
        .find(query)
        .sort({ creationDateTS: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return {
      data: data as VacationRequestBase[],
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAllVacationRequestsMongo");
  }
}

export async function getApprovedVacationRequestsOverlappingRange(startDate: string, endDate: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);

    return await dbRef
      .find({
        status: VacationRequestStatus.APROBADA,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      })
      .toArray();
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getApprovedVacationRequestsOverlappingRange");
  }
}

export async function pushVacationStatusMongo(id: string, data: UpdateVacationRequestDto, historyEntry: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);
    const historyEvent = { message: historyEntry, timestamp: Date.now() };
    return await dbRef.updateOne(
      { _id: getMongoId(id) },
      {
        $set: data,
        $push: { history: historyEvent } as any,
      },
    );
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "pushVacationStatusMongo");
  }
}

export async function updateVacationCalendarSyncMongo(id: string, data: UpdateVacationRequestDto, unsetEvent = false) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);
    const update: any = { $set: data };

    if (unsetEvent) {
      update.$unset = {
        googleCalendarEventId: "",
        googleCalendarEventLink: "",
      };
    }

    return await dbRef.updateOne({ _id: getMongoId(id) }, update);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateVacationCalendarSyncMongo");
  }
}

export async function deleteVacationRequestMongo(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<VacationRequestBase>(COLLECTION);
    return await dbRef.deleteOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteVacationRequestMongo");
  }
}
