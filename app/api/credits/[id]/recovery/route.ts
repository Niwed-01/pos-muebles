import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const recoverySchema = z.object({
  motivo: z.string().min(1, "El motivo es requerido"),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()
    const credit = await db.credit.findUnique({ where: { id: params.id } })
    if (!credit) return apiResponse(null, "Crédito no encontrado", undefined, 404)

    if (Number(credit.saldo) <= 0) {
      return apiResponse(null, "El crédito ya está pagado", undefined, 400)
    }

    if (credit.estado === "RECUPERACION") {
      return apiResponse(null, "El crédito ya está en recuperación", undefined, 400)
    }

    if (credit.estado !== "ATRASADO") {
      return apiResponse(null, "Solo créditos atrasados pueden pasar a recuperación", undefined, 400)
    }

    const body = await req.json()
    const parsed = recoverySchema.parse(body)

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.credit.update({
        where: { id: params.id },
        data: { estado: "RECUPERACION" },
      })

      const recovery = await tx.creditRecovery.create({
        data: {
          creditId: params.id,
          motivo: parsed.motivo,
          userId: user.id,
        },
      })

      return { credit: updated, recovery }
    })

    return apiResponse(result, null, "Proceso de recuperación iniciado exitosamente")
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al iniciar recuperación"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
