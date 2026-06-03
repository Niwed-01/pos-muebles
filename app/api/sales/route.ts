import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"
import { calcCreditSummary } from "@/lib/credit-calc"

const ITBIS_RATE = 0.18

const saleItemSchema = z.object({
  productId: z.string().min(1),
  cantidad: z.number().int().positive("La cantidad debe ser positiva"),
})

const creditInfoSchema = z.object({
  inicial: z.number().min(0),
  cuotas: z.number().int().positive(),
  frecuencia: z.enum(["SEMANAL", "QUINCENAL", "MENSUAL"]),
  tasaInteres: z.number().min(0).default(0),
  seguro: z.number().min(0).default(0),
})

const createSaleSchema = z.object({
  customerId: z.string().min(1, "El cliente es requerido"),
  items: z.array(saleItemSchema).min(1, "Debe haber al menos un producto"),
  metodoPago: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CREDITO"]),
  credito: creditInfoSchema.optional(),
})

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")
    const userId = searchParams.get("userId")
    const estado = searchParams.get("estado")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (fechaDesde || fechaHasta) {
      where.creadoEn = {}
      if (fechaDesde) where.creadoEn.gte = new Date(fechaDesde)
      if (fechaHasta) where.creadoEn.lte = new Date(fechaHasta)
    }
    if (userId) where.userId = userId
    if (estado) where.estado = estado

    const [data, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, nombre: true, cedula: true } },
          user: { select: { id: true, nombre: true } },
          credito: { select: { id: true, estado: true, saldo: true } },
        },
        skip,
        take: limit,
        orderBy: { creadoEn: "desc" },
      }),
      db.sale.count({ where }),
    ])

    return apiResponse({ items: data, total, page, limit })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener ventas"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    const body = await req.json()
    const parsed = createSaleSchema.parse(body)

    const sale = await db.$transaction(async (tx) => {
      const verifiedItems: {
        productId: string
        nombre: string
        cantidad: number
        precioUnitario: number
        subtotal: number
      }[] = []

      let subtotalBase = 0
      let totalConItbis = 0

      for (const item of parsed.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Producto no encontrado`)
        if (!product.activo) throw new Error(`Producto inactivo`)
        if (product.stock < item.cantidad) {
          throw new Error(
            `Stock insuficiente para ${product.nombre}: disponible ${product.stock}, requerido ${item.cantidad}`
          )
        }

        const precioUnitario = Number(product.precio)
        const subtotalItem = Math.round(precioUnitario * item.cantidad * 100) / 100
        const baseItem = Math.round((subtotalItem / (1 + ITBIS_RATE)) * 100) / 100

        subtotalBase += baseItem
        totalConItbis += subtotalItem

        verifiedItems.push({
          productId: item.productId,
          nombre: product.nombre,
          cantidad: item.cantidad,
          precioUnitario,
          subtotal: subtotalItem,
        })
      }

      for (const item of verifiedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.cantidad } },
        })
      }

      const impuesto = Math.round((totalConItbis - subtotalBase) * 100) / 100

      const saleRecord = await tx.sale.create({
        data: {
          userId: user.id,
          customerId: parsed.customerId,
          items: verifiedItems,
          subtotal: Math.round(subtotalBase * 100) / 100,
          impuesto,
          total: Math.round(totalConItbis * 100) / 100,
          metodoPago: parsed.metodoPago,
          estado: "PAGADA",
        },
        include: {
          customer: { select: { id: true, nombre: true, cedula: true } },
          user: { select: { id: true, nombre: true } },
        },
      })

      if (parsed.metodoPago === "CREDITO" && parsed.credito) {
        const saldo = Math.round((totalConItbis - parsed.credito.inicial) * 100) / 100

        const summary = calcCreditSummary({
          montoTotal: totalConItbis,
          inicial: parsed.credito.inicial,
          tasaInteres: parsed.credito.tasaInteres,
          cuotas: parsed.credito.cuotas,
          frecuencia: parsed.credito.frecuencia,
          seguroPorCuota: parsed.credito.seguro,
          fechaVenta: new Date(),
        })

        const credit = await tx.credit.create({
          data: {
            saleId: saleRecord.id,
            customerId: parsed.customerId,
            montoTotal: Math.round(totalConItbis * 100) / 100,
            inicial: parsed.credito.inicial,
            saldo: Math.max(0, saldo),
            cuotas: parsed.credito.cuotas,
            frecuencia: parsed.credito.frecuencia,
            tasaInteres: parsed.credito.tasaInteres,
            seguro: parsed.credito.seguro,
            estado: saldo <= 0 ? "PAGADO" : "ACTIVO",
          },
        })

        if (parsed.credito.inicial > 0) {
          await tx.creditPayment.create({
            data: {
              creditId: credit.id,
              monto: parsed.credito.inicial,
              notas: "Pago inicial",
            },
          })
        }

        return { ...saleRecord, credito: { ...credit, resumen: summary } }
      }

      return saleRecord
    })

    return apiResponse(sale, null, "Venta registrada exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al crear venta"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
