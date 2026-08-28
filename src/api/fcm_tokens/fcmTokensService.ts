import { BaseError } from "../../shared/classes/base-error";
import * as model from "./fcmTokensModel";
import { SaveTokenDto } from "./fcmTokensDto";

export async function saveToken(currentUser: any, data: SaveTokenDto) {
    try {
        const uid = currentUser.uid; 
        
        await model.upsertTokenMongo(uid, data.token, data.platform);
        
        return { success: true };
    } catch (error) {
        throw new BaseError("Inside catch: ", error, "saveToken");
    }
}

export async function getFcmTokenByUid(targetUid: string): Promise<string | null> {
    try {
        if (!targetUid) return null;
        
        const record = await model.getTokenByUidMongo(targetUid);
        
        if (!record || !record.token) return null;
        
        return record.token;
    } catch (error) {
        // Logueamos el error pero no rompemos el flujo del llamador, retornamos null
        console.error("Error obteniendo FCM token para usuario", targetUid, error);
        return null; 
    }
}