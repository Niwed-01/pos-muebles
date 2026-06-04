import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const estado = searchParams.get("estado") || "EN_PROCESO"
    const search = searchParams.get("search")

    const andFilters: Record<string, any>[] = [{ estado }]

    if (search) {
      andFilters.push({
        credit: {
          customer: {
            OR: [
              { nombre: { contains: search, mode: "insensitive" } },
              { cedula: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      })
    }

    const data = await db.creditRecovery.findMany({
      where: { AND: andFilters },
      include: {
        credit: {
          include: {
            customer: { select: { id: true, nombre: true, cedula: true, telefono: true, direccion: true } },
            venta: { select: { id: true, numero: true, total: true, creadoEn: true, items: true } },
            pagos: { orderBy: { fecha: "desc" } },
          },
        },
        acciones: { orderBy: { fecha: "desc" } },
        user: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaInicio: "desc" },
    })

    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener recuperaciones"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
