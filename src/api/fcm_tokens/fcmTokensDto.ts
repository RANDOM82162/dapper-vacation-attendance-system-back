import { ObjectId } from "mongodb";

export interface FcmToken {
    _id?: ObjectId;
    uid: string;          // ID del usuario (Firebase Auth UID)
    token: string;        // El token de FCM
    platform?: 'web' | 'android' | 'ios'; // Opcional, pero útil
    createdAt: number;
    updatedAt: number;
}

export interface SaveTokenDto {
    token: string;
    platform?: 'web' | 'android' | 'ios';
}

export interface FcmTokenResponse {
    success: boolean;
    message: string;
}