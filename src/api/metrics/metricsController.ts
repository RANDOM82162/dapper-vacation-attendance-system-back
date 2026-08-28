import { Request, Response } from "express";
import { AnalyticsService } from "./metricsService";
import { ParametersError } from "../../shared/classes/api-errors";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ROLES } from "../../middleware/auth.enum";

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  // GET /api/analytics?context=CLIENTES&year=2026&month=3
  async getModuleStats(req: Request, res: Response) {
    try {
      const { context, year, month, week } = req.query;
      const role = req.user.role;
      let companyId: string | string[] | undefined;

      if (role === ROLES.ADMIN) {
        companyId = undefined;
      } else if (role === ROLES.DESPACHO) {
        //const contribuyenteIds = await getContribuyenteIdsByDespacho(req.user.uid!, {});
        const contribuyenteIds = ["68d894575710000000000000"];
        companyId = [req.user.uid!, ...contribuyenteIds];
      } else if (role === ROLES.AUXILIAR) {
        //const auxiliar = await getAuxiliarByUid(req.user.uid!);
        const auxiliar = {
          relacion_contribuyente_id: "68d894575710000000000000"
        };
        if (auxiliar) {
          companyId = auxiliar.relacion_contribuyente_id;
        } else {
          // Handle case where auxiliar is not found or has no contribuyente
          return res.status(404).json({ msg: "Auxiliar not found or not associated with a contribuyente." });
        }
      } else {
        companyId = req.user.uid;
      }

      const weekInt = week ? parseInt(week as string) : undefined;

      if (!context) {
        return res.status(400).json({ msg: "Context is required" });
      }

      const yearInt = year
        ? parseInt(year as string)
        : new Date().getFullYear();
      const monthInt = month ? parseInt(month as string) : undefined;

      const stats = await analyticsService.getStats(
        context as string,
        companyId,
        yearInt,
        monthInt,
        weekInt,
        role
      );

      return res.json(stats);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Error retrieving analytics" });
    }
  }

  async getMainDashboard(req: Request, res: Response) {
    try {
      const { mode } = req.query; // 'week' o 'month'
      const viewMode = mode === "week" ? "week" : "month"; // Default month

      const role = req.user.role;
      let companyId: string | string[] | undefined;

      if (role === ROLES.ADMIN) {
        companyId = undefined;
      } else if (role === ROLES.DESPACHO) {
        //const contribuyenteIds = await getContribuyenteIdsByDespacho(req.user.uid!, {});
        const contribuyenteIds = ["68d894575710000000000000"];
        companyId = [req.user.uid!, ...contribuyenteIds];
      } else if (role === ROLES.AUXILIAR) {
        //const auxiliar = await getAuxiliarByUid(req.user.uid!);
        const auxiliar = {
          relacion_contribuyente_id: "68d894575710000000000000"
        };
        if (auxiliar) {
          companyId = auxiliar.relacion_contribuyente_id;
        } else {
          return res.status(404).json({ msg: "Auxiliar not found or not associated with a contribuyente." });
        }
      } else {
        companyId = req.user.uid;
      }

      const data = await analyticsService.getMainDashboardStats(
        companyId,
        viewMode,
        role
      );

      res.json(data);
    } catch (error) {
      res.status(500).json({ msg: "Error loading dashboard" });
    }
  }

  async setBudget(req: Request, res: Response) {
    try {
      const { year, month, amount } = req.body;
      const companyId = req.user.uid;

      if (!year || !month || amount === undefined || !companyId) throw new ParametersError("Missing fields", "setBudget", HttpStatusCode.BAD_REQUEST);

      await analyticsService.setBudget(companyId, year, month, amount);
      res.status(200).json({ status: HttpStatusCode.OK, message: "Presupuesto actualizado correctamente" });
    } catch (error) {
      res.status(500).json({ msg: "Error setting budget" });
    }
  }
}
