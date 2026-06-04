import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"
import { generateSchedule, isOverdue } from "@/lib/credit-calc"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getAuthUser()
    const recovery = await db.creditRecovery.findUnique({
      where: { id: params.id },
      include: {
        credit: {
          include: {
            customer: { select: { id: true, nombre: true, cedula: true, telefono: true, direccion: true } },
            venta: { select: { id: true, numero: true, total: true, creadoEn: true, items: true } },
            pagos: { orderBy: { fecha: "asc" } },
          },
        },
        acciones: { orderBy: { fecha: "asc" } },
        user: { select: { id: true, nombre: true } },
      },
    })
    if (!recovery) return apiResponse(null, "Proceso de recuperación no encontrado", undefined, 404)

    const sale = await db.sale.findUnique({ where: { id: recovery.credit.saleId } })
    const schedule = generateSchedule({
      montoTotal: Number(recovery.credit.montoTotal),
      inicial: Number(recovery.credit.inicial),
      tasaInteres: Number(recovery.credit.tasaInteres),
      cuotas: recovery.credit.cuotas,
      frecuencia: recovery.credit.frecuencia as "SEMANAL" | "QUINCENAL" | "MENSUAL",
      seguroPorCuota: Number(recovery.credit.seguro),
      tipoSeguro: (recovery.credit.tipoSeguro ?? "FIJO") as "FIJO" | "PORCENTAJE",
      valorSeguro: Number(recovery.credit.valorSeguro ?? 0),
      fechaVenta: sale?.creadoEn ?? new Date(),
    })

    const totalPagado = recovery.credit.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const today = new Date()
    const cuotasAtrasadas = schedule.filter((row) => !row.saldoRestante || isOverdue(row.fecha, today))
    const diasAtraso = cuotasAtrasadas.length > 0
      ? Math.ceil((today.getTime() - cuotasAtrasadas[0].fecha.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return apiResponse({
      ...recovery,
      schedule,
      totalPagado,
      diasAtraso: Math.max(0, diasAtraso),
      productos: sale?.items ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener recuperación"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()
    const body = await req.json()
    const { estado, devolverStock } = body as { estado: string; devolverStock?: boolean }

    const recovery = await db.creditRecovery.findUnique({
      where: { id: params.id },
      include: { credit: true },
    })
    if (!recovery) return apiResponse(null, "Proceso de recuperación no encontrado", undefined, 404)

    const estadosValidos = ["RECUPERADO", "RESUELTO", "DESISTIDO"]
    if (!estadosValidos.includes(estado)) {
      return apiResponse(null, "Estado inválido", undefined, 400)
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.creditRecovery.update({
        where: { id: params.id },
        data: {
          estado,
          fechaCierre: new Date(),
        },
      })

      let nuevoEstadoCredito: string
      if (estado === "RESUELTO") {
        nuevoEstadoCredito = "PAGADO"
        await tx.credit.update({
          where: { id: recovery.creditId },
          data: { saldo: 0, estado: "PAGADO" },
        })
      } else if (estado === "RECUPERADO") {
        nuevoEstadoCredito = "PAGADO"
        await tx.credit.update({
          where: { id: recovery.creditId },
          data: { saldo: 0, estado: "PAGADO" },
        })
        if (devolverStock && recovery.credit) {
          const sale = await tx.sale.findUnique({ where: { id: recovery.credit.saleId } })
          if (sale) {
            const items = sale.items as Array<{ productId: string; cantidad: number }>
            for (const item of items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.cantidad } },
              })
            }
          }
        }
      } else {
        nuevoEstadoCredito = "ACTIVO"
        await tx.credit.update({
          where: { id: recovery.creditId },
          data: { estado: "ACTIVO" },
        })
      }

      await tx.recoveryAction.create({
        data: {
          recoveryId: params.id,
          tipo: "RECUPERACION",
          descripcion: `Caso ${estado === "RECUPERADO" ? "recuperado" : estado === "RESUELTO" ? "resuelto (pagó)" : "desistido"}`,
          userId: user.id,
        },
      })

      return updated
    })

    return apiResponse(result, null, `Caso ${estado.toLowerCase()} exitosamente`)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al actualizar recuperación"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
