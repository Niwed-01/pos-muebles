import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    
    // Obtener o crear caja chica (debe existir una única)
    let cajaChica = await db.pettyCash.findFirst()
    
    if (!cajaChica) {
      cajaChica = await db.pettyCash.create({
        data: {
          nombre: "Caja Chica",
          fondoAsignado: 10000,
          saldoActual: 10000,
        },
      })
    }

    // Obtener últimos 20 movimientos
    const movimientos = await db.pettyCashMovement.findMany({
      where: { cajaChicaId: cajaChica.id },
      include: { user: true },
      orderBy: { fecha: "desc" },
      take: 20,
    })

    return apiResponse({
      cajaChica,
      movimientos,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener caja chica"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
