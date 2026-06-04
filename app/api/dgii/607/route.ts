import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"
import { calcularResumen607 } from "@/lib/dgii"

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const mes = parseInt(searchParams.get("mes") ?? "1")
    const anio = parseInt(searchParams.get("anio") ?? String(new Date().getFullYear()))
    const periodo = `${anio}${String(mes).padStart(2, "0")}`

    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 1)

    const ventas = await db.sale.findMany({
      where: {
        creadoEn: { gte: inicio, lt: fin },
        estado: { not: "ANULADA" },
      },
      include: { customer: { select: { nombre: true, cedula: true } } },
      orderBy: { creadoEn: "desc" },
    })

    const ventasForLib = ventas.map((v) => ({
      id: v.id,
      ncf: v.ncf,
      tipoIngreso: v.tipoIngreso,
      subtotal: Number(v.subtotal),
      impuesto: Number(v.impuesto),
      total: Number(v.total),
      itbisRetenido: Number(v.itbisRetenido ?? 0),
      propina: Number(v.propina ?? 0),
      metodoPago: v.metodoPago,
      estado: v.estado,
      creadoEn: v.creadoEn,
      customer: v.customer ? { cedula: v.customer.cedula, nombre: v.customer.nombre } : null,
    }))

    const resumen = calcularResumen607(ventasForLib)
    const detalle = ventas.map((v) => ({
      id: v.id,
      ncf: v.ncf,
      fecha: v.creadoEn,
      cliente: v.customer?.nombre ?? "Consumidor Final",
      cedula: v.customer?.cedula ?? "",
      subtotal: Number(v.subtotal),
      itbis: Number(v.impuesto),
      total: Number(v.total),
      metodoPago: v.metodoPago,
    }))

    return apiResponse({ periodo, resumen, detalle, cantidadVentas: ventas.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener reporte 607"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
