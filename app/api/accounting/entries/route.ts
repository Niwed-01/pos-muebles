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

    const where: Record<string, unknown> = {}
    if (desde || hasta) {
      const fechaFilter: Record<string, Date> = {}
      if (desde) fechaFilter.gte = new Date(desde)
      if (hasta) {
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        fechaFilter.lte = fin
      }
      where.fecha = fechaFilter
    }
    if (tipo) where.tipo = tipo

    const [data, total] = await Promise.all([
      db.journalEntry.findMany({
        where,
        include: {
          lineas: {
            include: { account: { select: { codigo: true, nombre: true } } },
          },
          user: { select: { id: true, nombre: true } },
        },
        skip,
        take: limit,
        orderBy: { fecha: "desc" },
      }),
      db.journalEntry.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    return apiResponse({ items: data, total, page, limit, totalPages })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener asientos"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
