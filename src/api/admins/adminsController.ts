import express, { NextFunction } from "express";
import * as service from "./adminsService";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ParametersError } from "../../shared/classes/api-errors";
import { GetAllAdminsFilters } from "./adminsDto";

export async function getAdminsController(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  try {
    const filters: GetAllAdminsFilters = {
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
    };
    const serviceResponse = await service.getAdmins(filters);
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "All Good!",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminByUidController(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  try {
    const uid = req.params.uid;
    if (uid == null || uid == undefined) {
      throw new ParametersError(
        "Missing body",
        "getAdminByUidController",
        HttpStatusCode.BAD_REQUEST
      );
    }
    const serviceResponse = await service.getAdminByUid(uid);
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "All Good!",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminByIdController(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    if (id == null || id == undefined) {
      throw new ParametersError(
        "Missing body",
        "getAdminByIdController",
        HttpStatusCode.BAD_REQUEST
      );
    }
    const serviceResponse = await service.getAdminById(id);
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "All Good!",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminController(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  try {
    const admin = req.body.admin;
    if (admin == null || admin == undefined) {
      throw new ParametersError(
        "Missing body",
        "createAdminController",
        HttpStatusCode.BAD_REQUEST
      );
    }
    const serviceResponse = await service.createAdmin(admin, req.user);
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "All Good!",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminController(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  try {
    const admin = req.body.admin;
    const id = req.params.id;
    if (admin == null || admin == undefined || id == null || id == undefined) {
      throw new ParametersError(
        "Missing body",
        "updateAdminController",
        HttpStatusCode.BAD_REQUEST
      );
    }
    const serviceResponse = await service.updateAdmin(id, admin, req.user);
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "All Good!",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminController(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  try {
    const uid = req.params.uid;
    if (uid == null || uid == undefined) {
      throw new ParametersError(
        "Missing body",
        "deleteAdminController",
        HttpStatusCode.BAD_REQUEST
      );
    }
    const serviceResponse = await service.deleteAdmin(uid, req.user);
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "All Good!",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePasswordController(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  try {
    const uid = req.params.uid;
    const password = req.body.password;
    if (
      uid == null ||
      uid == undefined ||
      password == null ||
      password == undefined
    ) {
      throw new ParametersError(
        "Missing body",
        "updatePasswordController",
        HttpStatusCode.BAD_REQUEST
      );
    }
    const serviceResponse = await service.updatePassword(uid, password, req.user);
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "All Good!",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}