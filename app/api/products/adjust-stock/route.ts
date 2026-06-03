import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const adjustStockSchema = z.object({
  productId: z.string().min(1),
  cantidad: z.number().int(),
  motivo: z.string().min(1, "El motivo es requerido"),
})

export async function POST(req: NextRequest) {
  try {
    await getAuthUser()
    const body = await req.json()
    const parsed = adjustStockSchema.parse(body)

    const product = await db.product.findUnique({ where: { id: parsed.productId } })
    if (!product) return apiResponse(null, "Producto no encontrado", undefined, 404)

    const nuevoStock = product.stock + parsed.cantidad
    if (nuevoStock < 0) {
      return apiResponse(
        null,
        `Stock insuficiente: actual ${product.stock}, ajuste ${parsed.cantidad}`,
        undefined,
        400
      )
    }

    const data = await db.product.update({
      where: { id: parsed.productId },
      data: { stock: nuevoStock },
      select: { id: true, nombre: true, stock: true },
    })

    return apiResponse(
      { ...data, ajuste: parsed.cantidad, motivo: parsed.motivo },
      null,
      `Stock actualizado: ${product.stock} → ${nuevoStock}`
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    const message = error instanceof Error ? error.message : "Error al ajustar stock"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
