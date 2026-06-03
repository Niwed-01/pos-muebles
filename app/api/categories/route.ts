import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET() {
  try {
    await getAuthUser()
    const data = await db.category.findMany({ orderBy: { nombre: "asc" } })
    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener categorías"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
