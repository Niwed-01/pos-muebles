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
  tipoSeguro: z.enum(["FIJO", "PORCENTAJE"]).default("FIJO"),
  valorSeguro: z.number().min(0).default(0),
})

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const estado = searchParams.get("estado")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    
    const montoMinStr = searchParams.get("montoMin")
    const montoMaxStr = searchParams.get("montoMax")
    const montoMin = montoMinStr ? parseFloat(montoMinStr) : undefined
    const montoMax = montoMaxStr ? parseFloat(montoMaxStr) : undefined

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
    const skip = (page - 1) * limit

    const andFilters: Record<string, any>[] = []

    if (search) {
      andFilters.push({
        customer: {
          OR: [
            { nombre: { contains: search, mode: "insensitive" } },
            { cedula: { contains: search, mode: "insensitive" } },
          ],
        },
      })
    }

    if (estado && estado !== "ALL") {
      andFilters.push({ estado: estado as any })
    }

    if (desde || hasta) {
      const fechaFilter: Record<string, Date> = {}
      if (desde) fechaFilter.gte = new Date(desde)
      if (hasta) {
        const finDia = new Date(hasta)
        finDia.setHours(23, 59, 59, 999)
        fechaFilter.lte = finDia
      }
      andFilters.push({
        venta: {
          creadoEn: fechaFilter,
        },
      })
    }

    if (montoMin !== undefined || montoMax !== undefined) {
      const montoFilter: Record<string, number> = {}
      if (montoMin !== undefined) montoFilter.gte = montoMin
      if (montoMax !== undefined) montoFilter.lte = montoMax
      andFilters.push({ montoTotal: montoFilter })
    }

    const where = andFilters.length > 0 ? { AND: andFilters } : {}

    const [data, total] = await Promise.all([
      db.credit.findMany({
        where,
        include: {
          customer: { select: { id: true, nombre: true, cedula: true, telefono: true } },
          venta: { select: { id: true, numero: true, total: true, creadoEn: true } },
          pagos: { orderBy: { fecha: "desc" } },
        },
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      db.credit.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return apiResponse({ 
      items: data, 
      total, 
      page, 
      limit,
      totalPages 
    })
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
      tipoSeguro: parsed.tipoSeguro,
      valorSeguro: parsed.valorSeguro,
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
          tipoSeguro: parsed.tipoSeguro,
          valorSeguro: parsed.valorSeguro,
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
