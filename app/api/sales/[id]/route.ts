import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getAuthUser()
    const data = await db.sale.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, nombre: true, cedula: true, telefono: true } },
        user: { select: { id: true, nombre: true } },
        credito: {
          include: {
            pagos: { orderBy: { fecha: "desc" } },
          },
        },
      },
    })
    if (!data) return apiResponse(null, "Venta no encontrada", undefined, 404)
    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener venta"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden anular ventas", undefined, 403)
    }

    const sale = await db.sale.findUnique({ where: { id: params.id } })
    if (!sale) return apiResponse(null, "Venta no encontrada", undefined, 404)
    if (sale.estado === "ANULADA") {
      return apiResponse(null, "La venta ya está anulada", undefined, 400)
    }

    await db.$transaction(async (tx) => {
      const items = sale.items as Array<{ productId: string; cantidad: number }>
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.cantidad } },
        })
      }
      await tx.sale.update({
        where: { id: params.id },
        data: { estado: "ANULADA" },
      })
    })

    return apiResponse(null, null, "Venta anulada exitosamente")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al anular venta"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
