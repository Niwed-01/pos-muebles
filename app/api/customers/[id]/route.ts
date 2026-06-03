import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const updateCustomerSchema = z.object({
  nombre: z.string().min(1).optional(),
  cedula: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  direccion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getAuthUser()
    const data = await db.customer.findUnique({
      where: { id: params.id },
      include: {
        ventas: {
          orderBy: { creadoEn: "desc" },
          take: 50,
          include: { user: { select: { id: true, nombre: true } } },
        },
        creditos: {
          include: { pagos: { orderBy: { fecha: "desc" }, take: 10 } },
          orderBy: { id: "desc" },
        },
      },
    })
    if (!data) return apiResponse(null, "Cliente no encontrado", undefined, 404)
    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener cliente"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden modificar clientes", undefined, 403)
    }
    const existing = await db.customer.findUnique({ where: { id: params.id } })
    if (!existing) return apiResponse(null, "Cliente no encontrado", undefined, 404)

    const body = await req.json()
    const parsed = updateCustomerSchema.parse(body)

    if (parsed.email === "") parsed.email = null

    const data = await db.customer.update({
      where: { id: params.id },
      data: parsed,
    })
    return apiResponse(data, null, "Cliente actualizado exitosamente")
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al actualizar cliente"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
