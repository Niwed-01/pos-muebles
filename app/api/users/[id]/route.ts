import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const patchUserSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional(),
  rol: z.enum(["ADMIN", "VENDEDOR"]).optional(),
  activo: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden modificar usuarios", undefined, 403)
    }

    if (user.id === params.id) {
      const body = await req.json()
      if (body.activo === false) {
        return apiResponse(null, "No puedes desactivarte a ti mismo", undefined, 400)
      }
    }

    const body = await req.json()
    const parsed = patchUserSchema.parse(body)

    if (parsed.email) {
      const existing = await db.user.findFirst({
        where: { email: parsed.email, id: { not: params.id } },
      })
      if (existing) {
        return apiResponse(null, "Ya existe otro usuario con ese email", undefined, 400)
      }
    }

    const data = await db.user.update({
      where: { id: params.id },
      data: parsed,
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    })

    return apiResponse(data, null, "Usuario actualizado exitosamente")
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    const message = error instanceof Error ? error.message : "Error al actualizar usuario"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
