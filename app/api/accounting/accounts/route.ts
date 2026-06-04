import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET() {
  try {
    await getAuthUser()
    const data = await db.account.findMany({
      include: { children: { include: { children: true } } },
      where: { parentId: null },
      orderBy: { codigo: "asc" },
    })
    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener cuentas"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

const createAccountSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.enum(["ACTIVO", "PASIVO", "CAPITAL", "INGRESO", "GASTO"]),
  nivel: z.number().int().min(1).default(1),
  parentId: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden crear cuentas", undefined, 403)
    }

    const body = await req.json()
    const parsed = createAccountSchema.parse(body)

    if (parsed.parentId) {
      const parent = await db.account.findUnique({ where: { id: parsed.parentId } })
      if (!parent) return apiResponse(null, "Cuenta padre no encontrada", undefined, 404)
    }

    const data = await db.account.create({
      data: {
        codigo: parsed.codigo,
        nombre: parsed.nombre,
        tipo: parsed.tipo,
        nivel: parsed.nivel,
        parentId: parsed.parentId ?? null,
      },
    })

    return apiResponse(data, null, "Cuenta creada exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    const message = error instanceof Error ? error.message : "Error al crear cuenta"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
