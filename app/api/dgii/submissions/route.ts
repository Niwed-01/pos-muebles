import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET() {
  try {
    await getAuthUser()
    const data = await db.dgiiSubmission.findMany({
      include: { user: { select: { id: true, nombre: true } } },
      orderBy: { generadoEn: "desc" },
      take: 50,
    })
    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener historial"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
