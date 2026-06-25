import * as dashboardService from "../services/dashboard.service.js";

/**
 * GET /api/dashboard/stats
 * Protegido: authMiddleware + adminMiddleware
 */
export async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
