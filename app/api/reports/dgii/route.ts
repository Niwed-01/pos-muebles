import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const mes = parseInt(searchParams.get("mes") ?? "")
    const anio = parseInt(searchParams.get("anio") ?? "")

    if (isNaN(mes) || mes < 1 || mes > 12) {
      return apiResponse(null, "El parámetro 'mes' debe estar entre 1 y 12", undefined, 400)
    }
    if (isNaN(anio) || anio < 2000 || anio > 2100) {
      return apiResponse(null, "El parámetro 'anio' debe ser un año válido", undefined, 400)
    }

    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59, 999)

    const sales = await db.sale.findMany({
      where: {
        creadoEn: { gte: inicio, lte: fin },
        estado: "PAGADA",
      },
      include: {
        customer: { select: { id: true, nombre: true, cedula: true, telefono: true } },
      },
      orderBy: { creadoEn: "asc" },
    })

    let totalVentas = 0
    let totalBase = 0
    let totalITBISCobrado = 0
    let totalVentasContado = 0
    let totalVentasCredito = 0
    const ventasPorMetodo = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0, CREDITO: 0 }

    for (const sale of sales) {
      const total = Number(sale.total)
      const impuesto = Number(sale.impuesto)
      const base = Number(sale.subtotal)

      totalVentas += total
      totalBase += base
      totalITBISCobrado += impuesto

      if (sale.metodoPago === "CREDITO") {
        totalVentasCredito += total
      } else {
        totalVentasContado += total
      }

      ventasPorMetodo[sale.metodoPago] += total
    }

    const detalle606 = sales.map((sale) => ({
      id: sale.id,
      fecha: sale.creadoEn.toISOString().split("T")[0],
      ncf: sale.ncf ?? "",
      cliente: sale.customer.nombre,
      rnc: sale.customer.cedula ?? "",
      monto: Number(sale.total),
      itbis: Number(sale.impuesto),
      base: Number(sale.subtotal),
      metodoPago: sale.metodoPago,
    }))

    return apiResponse({
      periodoMes: mes,
      periodoAnio: anio,
      totalVentas: Math.round(totalVentas * 100) / 100,
      totalBase: Math.round(totalBase * 100) / 100,
      totalITBISCobrado: Math.round(totalITBISCobrado * 100) / 100,
      totalVentasContado: Math.round(totalVentasContado * 100) / 100,
      totalVentasCredito: Math.round(totalVentasCredito * 100) / 100,
      ventasPorMetodo: {
        EFECTIVO: Math.round(ventasPorMetodo.EFECTIVO * 100) / 100,
        TARJETA: Math.round(ventasPorMetodo.TARJETA * 100) / 100,
        TRANSFERENCIA: Math.round(ventasPorMetodo.TRANSFERENCIA * 100) / 100,
        CREDITO: Math.round(ventasPorMetodo.CREDITO * 100) / 100,
      },
      cantidadFacturas: sales.length,
      detalle606,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al generar reporte DGII"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
