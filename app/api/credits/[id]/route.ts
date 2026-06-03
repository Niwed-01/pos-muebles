import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"
import { generateSchedule, calcCreditSummary, isOverdue } from "@/lib/credit-calc"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getAuthUser()
    const data = await db.credit.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, nombre: true, cedula: true, telefono: true } },
        venta: { select: { id: true, numero: true, total: true, creadoEn: true } },
        pagos: { orderBy: { fecha: "asc" } },
      },
    })
    if (!data) return apiResponse(null, "Crédito no encontrado", undefined, 404)

    const sale = await db.sale.findUnique({ where: { id: data.saleId } })
    const schedule = generateSchedule({
      montoTotal: Number(data.montoTotal),
      inicial: Number(data.inicial),
      tasaInteres: Number(data.tasaInteres),
      cuotas: data.cuotas,
      frecuencia: data.frecuencia as "SEMANAL" | "QUINCENAL" | "MENSUAL",
      seguroPorCuota: Number(data.seguro),
      fechaVenta: sale?.creadoEn ?? new Date(),
    })

    const summary = calcCreditSummary({
      montoTotal: Number(data.montoTotal),
      inicial: Number(data.inicial),
      tasaInteres: Number(data.tasaInteres),
      cuotas: data.cuotas,
      frecuencia: data.frecuencia as "SEMANAL" | "QUINCENAL" | "MENSUAL",
      seguroPorCuota: Number(data.seguro),
      fechaVenta: sale?.creadoEn ?? new Date(),
    })

    let totalPagado = 0
    const pagosDetallados = data.pagos.map((p) => {
      totalPagado += Number(p.monto)
      return { ...p, acumulado: totalPagado }
    })

    const today = new Date()
    const scheduleWithStatus = schedule.map((row) => {
      const pagada = totalPagado >= row.totalCuota * row.cuota
      const atrasada = !pagada && isOverdue(row.fecha, today)
      return {
        ...row,
        pagada,
        atrasada,
      }
    })

    const tieneCuotaAtrasada = scheduleWithStatus.some((r) => r.atrasada)
    const nuevoSaldo = Math.max(0, Math.round((Number(data.saldo)) * 100) / 100)
    let estadoCalculado: string
    if (nuevoSaldo <= 0) {
      estadoCalculado = "PAGADO"
    } else if (tieneCuotaAtrasada) {
      estadoCalculado = "ATRASADO"
    } else {
      estadoCalculado = "ACTIVO"
    }

    return apiResponse({
      ...data,
      estado: estadoCalculado,
      schedule: scheduleWithStatus,
      resumen: summary,
      pagosDetallados,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener crédito"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
