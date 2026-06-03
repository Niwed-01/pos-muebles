import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"
import { generateSchedule, isOverdue } from "@/lib/credit-calc"

const createPaymentSchema = z.object({
  monto: z.number().positive("El monto debe ser positivo"),
  notas: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getAuthUser()
    const credit = await db.credit.findUnique({ where: { id: params.id } })
    if (!credit) return apiResponse(null, "Crédito no encontrado", undefined, 404)

    const data = await db.creditPayment.findMany({
      where: { creditId: params.id },
      orderBy: { fecha: "desc" },
    })

    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener pagos"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getAuthUser()
    const credit = await db.credit.findUnique({ where: { id: params.id } })
    if (!credit) return apiResponse(null, "Crédito no encontrado", undefined, 404)
    if (credit.estado === "PAGADO") {
      return apiResponse(null, "El crédito ya está pagado", undefined, 400)
    }

    const body = await req.json()
    const parsed = createPaymentSchema.parse(body)

    if (parsed.monto > Number(credit.saldo)) {
      return apiResponse(
        null,
        `El pago excede el saldo pendiente (${credit.saldo})`,
        undefined,
        400
      )
    }

    const sale = await db.sale.findUnique({ where: { id: credit.saleId } })
    const schedule = generateSchedule({
      montoTotal: Number(credit.montoTotal),
      inicial: Number(credit.inicial),
      tasaInteres: Number(credit.tasaInteres),
      cuotas: credit.cuotas,
      frecuencia: credit.frecuencia as "SEMANAL" | "QUINCENAL" | "MENSUAL",
      seguroPorCuota: Number(credit.seguro),
      fechaVenta: sale?.creadoEn ?? new Date(),
    })

    const today = new Date()
    const tieneCuotaAtrasada = schedule.some(
      (row) => isOverdue(row.fecha, today) && row.saldoRestante > 0
    )

    const result = await db.$transaction(async (tx) => {
      const payment = await tx.creditPayment.create({
        data: {
          creditId: params.id,
          monto: parsed.monto,
          notas: parsed.notas ?? null,
        },
      })

      const nuevoSaldo = Math.max(0, Math.round((Number(credit.saldo) - parsed.monto) * 100) / 100)

      let nuevoEstado: "ACTIVO" | "ATRASADO" | "PAGADO"
      if (nuevoSaldo <= 0) {
        nuevoEstado = "PAGADO"
      } else if (tieneCuotaAtrasada) {
        nuevoEstado = "ATRASADO"
      } else {
        nuevoEstado = "ACTIVO"
      }

      const updatedCredit = await tx.credit.update({
        where: { id: params.id },
        data: {
          saldo: nuevoSaldo,
          estado: nuevoEstado,
        },
      })

      return { payment, credit: updatedCredit }
    })

    return apiResponse(result, null, "Pago registrado exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al registrar pago"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
