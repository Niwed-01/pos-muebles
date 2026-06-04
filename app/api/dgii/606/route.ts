import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const mes = parseInt(searchParams.get("mes") ?? "1")
    const anio = parseInt(searchParams.get("anio") ?? String(new Date().getFullYear()))

    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 1)

    const compras = await db.purchase.findMany({
      where: {
        fechaComprobante: { gte: inicio, lt: fin },
      },
      include: { user: { select: { id: true, nombre: true } } },
      orderBy: { fechaComprobante: "desc" },
    })

    const resumen = {
      totalBienes: compras.reduce((s, c) => s + Number(c.montoBienes), 0),
      totalServicios: compras.reduce((s, c) => s + Number(c.montoServicios), 0),
      totalITBIS: compras.reduce((s, c) => s + Number(c.itbisFacturado), 0),
      cantidad: compras.length,
    }

    return apiResponse({ compras, resumen, periodo: `${anio}${String(mes).padStart(2, "0")}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener compras"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
