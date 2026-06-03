import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const updateProductSchema = z.object({
  codigo: z.string().optional().nullable(),
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  categoryId: z.string().min(1).optional(),
  costo: z.number().positive().optional(),
  precio: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  stockMinimo: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
  imagenes: z.array(z.string()).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getAuthUser()
    const data = await db.product.findUnique({
      where: { id: params.id },
      include: { categoria: true },
    })
    if (!data) return apiResponse(null, "Producto no encontrado", undefined, 404)
    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener producto"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden modificar productos", undefined, 403)
    }
    const existing = await db.product.findUnique({ where: { id: params.id } })
    if (!existing) return apiResponse(null, "Producto no encontrado", undefined, 404)

    const body = await req.json()
    const parsed = updateProductSchema.parse(body)

    const data = await db.product.update({
      where: { id: params.id },
      data: parsed,
      include: { categoria: true },
    })
    return apiResponse(data, null, "Producto actualizado exitosamente")
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al actualizar producto"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden eliminar productos", undefined, 403)
    }
    const existing = await db.product.findUnique({ where: { id: params.id } })
    if (!existing) return apiResponse(null, "Producto no encontrado", undefined, 404)

    await db.product.update({
      where: { id: params.id },
      data: { activo: false },
    })
    return apiResponse(null, null, "Producto desactivado exitosamente")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar producto"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
