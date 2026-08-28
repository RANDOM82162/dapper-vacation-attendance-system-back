import express, { NextFunction } from "express";
import * as service from "./fcmTokensService";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ParametersError } from "../../shared/classes/api-errors";

export async function saveTokenController(
    req: express.Request | any, res: express.Response, next: NextFunction
) {
    try {
        const { token, platform } = req.body;
        const currentUser = req.user;

        if (!token) {
            throw new ParametersError("Missing token", "saveTokenController", HttpStatusCode.BAD_REQUEST);
        }
        
        // No necesitamos validar rol, solo que exista el usuario (currentUser)
        if (!currentUser || !currentUser.uid) {
             throw new ParametersError("User not authenticated", "saveTokenController", HttpStatusCode.NOT_AUTHORIZED);
        }

        const serviceResponse = await service.saveToken(currentUser, { token, platform });
        
        res.status(200).send({ 
            status: HttpStatusCode.OK, 
            message: "Token registrado correctamente", 
            data: serviceResponse 
        });
    } catch (error) { next(error); }
}