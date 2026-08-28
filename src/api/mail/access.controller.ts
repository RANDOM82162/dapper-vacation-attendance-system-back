import { Request, Response } from "express";
import { sendAccessRequest } from "./mailService";

export const requestAccessController = async (req: Request, res: Response) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios: correo y mensaje.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "El formato del correo electrónico no es válido.",
      });
    }

    const adminEmail = "a.roano@dappertechnologies.com";

    await sendAccessRequest({ email, message }, adminEmail);

    return res.status(200).json({
      success: true,
      message:
        "Solicitud enviada correctamente. Hemos notificado al administrador.",
    });
  } catch (error) {
    console.error("Error en requestAccessController:", error);
    return res.status(500).json({
      success: false,
      message:
        "Ocurrió un error interno al procesar tu solicitud. Por favor intenta más tarde.",
    });
  }
};
