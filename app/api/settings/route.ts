import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const ALLOWED_KEYS = [
  "empresa_nombre",
  "empresa_rnc",
  "empresa_telefono",
  "empresa_direccion",
  "empresa_logo",
  "itbis_activo",
  "itbis_porcentaje",
  "interes_default",
  "seguro_default",
  "moneda",
]

const updateSettingSchema = z.object({
  clave: z.string().min(1, "La clave es requerida"),
  valor: z.string(),
})

const bulkUpdateSchema = z.object({
  settings: z.array(z.object({
    clave: z.string(),
    valor: z.string(),
  })),
})

export async function GET() {
  try {
    await getAuthUser()
    const data = await db.setting.findMany({ orderBy: { clave: "asc" } })
    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener configuración"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden modificar configuración", undefined, 403)
    }

    const body = await req.json()

    if (body.settings && Array.isArray(body.settings)) {
      const parsed = bulkUpdateSchema.parse(body)
      const results = await Promise.all(
        parsed.settings
          .filter((s) => ALLOWED_KEYS.includes(s.clave))
          .map((s) =>
            db.setting.upsert({
              where: { clave: s.clave },
              update: { valor: s.valor },
              create: { clave: s.clave, valor: s.valor },
            })
          )
      )
      return apiResponse(results, null, "Configuración actualizada exitosamente")
    }

    const parsed = updateSettingSchema.parse(body)

    if (!ALLOWED_KEYS.includes(parsed.clave)) {
      return apiResponse(
        null,
        `Clave no permitida: ${parsed.clave}`,
        undefined,
        400
      )
    }

    const data = await db.setting.upsert({
      where: { clave: parsed.clave },
      update: { valor: parsed.valor },
      create: { clave: parsed.clave, valor: parsed.valor },
    })

    return apiResponse(data, null, "Configuración actualizada exitosamente")
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al actualizar configuración"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
