import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const tipo = searchParams.get("tipo")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")))
    const skip = (page - 1) * limit

    // Obtener caja chica
    const cajaChica = await db.pettyCash.findFirst()
    if (!cajaChica) {
      return apiResponse({
        items: [],
        total: 0,
        page,
        limit,
        cajaChica: null,
      })
    }

    // Construir filtros
    const where: Record<string, unknown> = {
      cajaChicaId: cajaChica.id,
    }

    if (desde || hasta) {
      const fechaFilter: Record<string, Date> = {}
      if (desde) {
        fechaFilter.gte = new Date(desde)
      }
      if (hasta) {
        const hoy = new Date(hasta)
        hoy.setHours(23, 59, 59, 999)
        fechaFilter.lte = hoy
      }
      where.fecha = fechaFilter
    }

    if (tipo) {
      where.tipo = tipo
    }

    // Obtener movimientos
    const [movimientos, total] = await Promise.all([
      db.pettyCashMovement.findMany({
        where,
        include: { user: true },
        orderBy: { fecha: "desc" },
        skip,
        take: limit,
      }),
      db.pettyCashMovement.count({ where }),
    ])

    return apiResponse({
      items: movimientos,
      total,
      page,
      limit,
      cajaChica,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener reporte"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
