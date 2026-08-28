import { connect } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { FcmToken } from "./fcmTokensDto";

const COLLECTION = "fcm_tokens";

export async function upsertTokenMongo(uid: string, token: string, platform?: 'web' | 'android' | 'ios') {
    try {
        const db = await connect();
        const dbRef = db.collection<FcmToken>(COLLECTION);

        // Buscamos por UID. Si existe, actualizamos token y fecha. Si no, crea uno nuevo.
        const response = await dbRef.updateOne(
            { uid: uid }, 
            { 
                $set: { 
                    token: token, 
                    platform: platform || 'web',
                    updatedAt: new Date().getTime() 
                },
                $setOnInsert: {
                    createdAt: new Date().getTime()
                }
            },
            { upsert: true }
        );
        return response;
    } catch (error) {
        throw new BaseError("Inside catch: ", error, "upsertTokenMongo");
    }
}

export async function getTokenByUidMongo(uid: string): Promise<FcmToken | null> {
    try {
        const db = await connect();
        const dbRef = db.collection<FcmToken>(COLLECTION);
        
        const result = await dbRef.findOne({ uid: uid });
        return result;
    } catch (error) {
        throw new BaseError("Inside catch: ", error, "getTokenByUidMongo");
    }
}