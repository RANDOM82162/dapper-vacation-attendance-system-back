import { connect } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error"; 

export interface Analytics {
  _id: string;
  context: string;
  companyId: string;
  year: number;
  global: { count: number; value: number };
  monthly: Record<string, { count: number; value: number }>;
  weekly: Record<string, { count: number; value: number }>;
  daily: Record<string, { count: number; value: number }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getAnalyticsByIdMongo(id: string) {
  try {
    const db = await connect();
    const collection = db.collection<Analytics>("analytics");
    const response = await collection.findOne({ _id: id });
    return response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAnalyticsByIdMongo");
  }
}

export async function updateAnalyticsMetricMongo(id: string, updateQuery: any) {
  try {
    const db = await connect();
    const collection = db.collection<Analytics>("analytics");

    const response = await collection.updateOne(
      { _id: id },
      updateQuery,
      { upsert: true }
    );
    return response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateAnalyticsMetricMongo");
  }
}

export async function getAnalyticsByQueryMongo(query: any) {
  try {
    const db = await connect();
    const collection = db.collection<Analytics>("analytics");
    return await collection.find(query).toArray();
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAnalyticsByQueryMongo");
  }
}