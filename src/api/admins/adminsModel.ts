import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { CreateAdminDto, GetAllAdminsFilters, PaginacionRespuesta, UpdateAdminDto } from "./adminsDto";
import { ObjectId } from "mongodb";

export interface Admin {
  _id: ObjectId;
  uid: string;
  name: string;
  email: string;
  branches: string[];
  role: string;
  photo: string;
  creationDateTS: number;
}

export async function createAdminMongo(admin: CreateAdminDto) {
  try {
    const db = await connect();
    const dbRef = db.collection<Omit<Admin, "_id">>("admins");
    const response = await dbRef.insertOne(admin);
    return response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createAdminMongo");
  }
}

export async function updateAdminMongo(id: string, admin: UpdateAdminDto) {
  try {
    const db = await connect();
    const dbRef = db.collection<Admin>("admins");
    const response = await dbRef.updateOne(
      { _id: getMongoId(id) },
      { $set: admin }
    );
    return response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateAdminMongo");
  }
}

export async function deleteAdminMongo(uid: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<Admin>("admins");
    const response = await dbRef.deleteOne({ uid });
    return response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteAdminMongo");
  }
}

export async function getAdminMongoByUid(uid: string, dataFilters = {}) {
  try {
    const db = await connect();
    const dbRef = db.collection<Admin>("admins");
    const response = await dbRef.findOne({ uid });
    return response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAdminMongoByUid");
  }
}

export async function getAdminMongoById(id: string, dataFilters = {}) {
  try {
    const db = await connect();
    const dbRef = db.collection<Admin>("admins");
    const response = await dbRef.findOne({ _id: getMongoId(id) });
    return response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAdminMongoById");
  }
}

export async function getAllAdminMongo(filters: GetAllAdminsFilters): Promise<PaginacionRespuesta<Admin>> {
  try {
    const db = await connect();
    const dbRef = db.collection<Admin>("admins");
    const query: any = {};

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    if (filters.year && filters.month) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      query.creationDateTS = {
        $gte: startDate.getTime(),
        $lte: endDate.getTime(),
      };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [totalItems, data] = await Promise.all([
      dbRef.countDocuments(query),
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
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAllAdminMongo");
  }
}
