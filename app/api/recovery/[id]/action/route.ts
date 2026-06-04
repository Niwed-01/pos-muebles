import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const actionSchema = z.object({
  tipo: z.enum(["AVISO_ESCRITO", "LLAMADA", "VISITA", "NOTIFICACION_LEGAL", "RECUPERACION"]),
  descripcion: z.string().min(1, "La descripción es requerida"),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()
    const recovery = await db.creditRecovery.findUnique({ where: { id: params.id } })
    if (!recovery) return apiResponse(null, "Proceso de recuperación no encontrado", undefined, 404)

    if (recovery.estado !== "EN_PROCESO") {
      return apiResponse(null, "El proceso de recuperación no está activo", undefined, 400)
    }

    const body = await req.json()
    const parsed = actionSchema.parse(body)

    const action = await db.recoveryAction.create({
      data: {
        recoveryId: params.id,
        tipo: parsed.tipo,
        descripcion: parsed.descripcion,
        userId: user.id,
      },
    })

    return apiResponse(action, null, "Acción registrada exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al registrar acción"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
