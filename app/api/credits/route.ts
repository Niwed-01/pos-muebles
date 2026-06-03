import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"
import { calcCreditSummary } from "@/lib/credit-calc"

const createCreditSchema = z.object({
  saleId: z.string().min(1),
  customerId: z.string().min(1),
  montoTotal: z.number().positive("El monto total debe ser positivo"),
  inicial: z.number().min(0, "El inicial no puede ser negativo"),
  cuotas: z.number().int().positive("El número de cuotas debe ser positivo"),
  frecuencia: z.enum(["SEMANAL", "QUINCENAL", "MENSUAL"]),
  tasaInteres: z.number().min(0, "La tasa de interés no puede ser negativa").default(0),
  seguro: z.number().min(0).default(0),
})

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get("customerId")
    const estado = searchParams.get("estado")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (customerId) where.customerId = customerId
    if (estado) where.estado = estado

    const [data, total] = await Promise.all([
      db.credit.findMany({
        where,
        include: {
          customer: { select: { id: true, nombre: true, cedula: true } },
          venta: { select: { id: true, numero: true, total: true, creadoEn: true } },
          pagos: { orderBy: { fecha: "desc" }, take: 1 },
        },
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      db.credit.count({ where }),
    ])

    return apiResponse({ items: data, total, page, limit })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener créditos"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAuthUser()
    const body = await req.json()
    const parsed = createCreditSchema.parse(body)

    const sale = await db.sale.findUnique({ where: { id: parsed.saleId } })
    if (!sale) return apiResponse(null, "Venta no encontrada", undefined, 404)

    const existingCredit = await db.credit.findUnique({ where: { saleId: parsed.saleId } })
    if (existingCredit) {
      return apiResponse(null, "Esta venta ya tiene un crédito asociado", undefined, 400)
    }

    const saldo = Math.round((parsed.montoTotal - parsed.inicial) * 100) / 100

    const summary = calcCreditSummary({
      montoTotal: parsed.montoTotal,
      inicial: parsed.inicial,
      tasaInteres: parsed.tasaInteres,
      cuotas: parsed.cuotas,
      frecuencia: parsed.frecuencia,
      seguroPorCuota: parsed.seguro,
      fechaVenta: new Date(),
    })

    const credit = await db.$transaction(async (tx) => {
      const c = await tx.credit.create({
        data: {
          saleId: parsed.saleId,
          customerId: parsed.customerId,
          montoTotal: parsed.montoTotal,
          inicial: parsed.inicial,
          saldo,
          cuotas: parsed.cuotas,
          frecuencia: parsed.frecuencia,
          tasaInteres: parsed.tasaInteres,
          seguro: parsed.seguro,
          estado: saldo <= 0 ? "PAGADO" : "ACTIVO",
        },
        include: {
          customer: { select: { id: true, nombre: true } },
          venta: { select: { id: true, numero: true } },
        },
      })

      if (parsed.inicial > 0) {
        await tx.creditPayment.create({
          data: {
            creditId: c.id,
            monto: parsed.inicial,
            notas: "Pago inicial",
          },
        })
      }

      return c
    })

    return apiResponse(
      { ...credit, resumen: summary },
      null,
      "Crédito creado exitosamente",
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al crear crédito"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
