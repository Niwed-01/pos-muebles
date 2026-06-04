import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const createPurchaseSchema = z.object({
  ncf: z.string().min(1, "NCF es requerido"),
  ncfModificado: z.string().optional().nullable(),
  rncProveedor: z.string().min(1, "RNC del proveedor es requerido"),
  tipoId: z.string().default("1"),
  tipoBien: z.string().default("09"),
  fechaComprobante: z.string().min(1, "Fecha del comprobante es requerida"),
  fechaPago: z.string().optional().nullable(),
  montoServicios: z.number().min(0).default(0),
  montoBienes: z.number().min(0).default(0),
  itbisFacturado: z.number().min(0).default(0),
  itbisRetenido: z.number().min(0).default(0),
  itbisCosto: z.number().min(0).default(0),
  tipoRetencionISR: z.string().optional().nullable(),
  montoRetencionISR: z.number().optional().nullable(),
  formaPago: z.string().default("1"),
  descripcion: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const mes = parseInt(searchParams.get("mes") ?? "0")
    const anio = parseInt(searchParams.get("anio") ?? "0")
    const search = searchParams.get("search")
    const tipoBien = searchParams.get("tipoBien")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")))

    const where: Record<string, unknown> = {}
    if (mes > 0 && anio > 0) {
      const inicio = new Date(anio, mes - 1, 1)
      const fin = new Date(anio, mes, 1)
      where.fechaComprobante = { gte: inicio, lt: fin }
    }
    if (search) {
      where.OR = [
        { rncProveedor: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
      ]
    }
    if (tipoBien) where.tipoBien = tipoBien

    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      db.purchase.findMany({
        where,
        include: { user: { select: { id: true, nombre: true } } },
        skip,
        take: limit,
        orderBy: { fechaComprobante: "desc" },
      }),
      db.purchase.count({ where }),
    ])

    return apiResponse({ items: data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener compras"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    const body = await req.json()
    const parsed = createPurchaseSchema.parse(body)

    const data = await db.purchase.create({
      data: {
        ncf: parsed.ncf,
        ncfModificado: parsed.ncfModificado ?? null,
        rncProveedor: parsed.rncProveedor,
        tipoId: parsed.tipoId,
        tipoBien: parsed.tipoBien,
        fechaComprobante: new Date(parsed.fechaComprobante),
        fechaPago: parsed.fechaPago ? new Date(parsed.fechaPago) : null,
        montoServicios: parsed.montoServicios,
        montoBienes: parsed.montoBienes,
        itbisFacturado: parsed.itbisFacturado,
        itbisRetenido: parsed.itbisRetenido,
        itbisCosto: parsed.itbisCosto,
        tipoRetencionISR: parsed.tipoRetencionISR ?? null,
        montoRetencionISR: parsed.montoRetencionISR ?? null,
        formaPago: parsed.formaPago,
        descripcion: parsed.descripcion ?? null,
        userId: user.id,
      },
    })

    return apiResponse(data, null, "Compra registrada exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map((e) => e.message).join(", "), 400)
    }
    const message = error instanceof Error ? error.message : "Error al registrar compra"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return apiResponse(null, "ID de compra requerido", undefined, 400)

    const purchase = await db.purchase.findUnique({ where: { id } })
    if (!purchase) return apiResponse(null, "Compra no encontrada", undefined, 404)

    await db.purchase.delete({ where: { id } })
    return apiResponse(null, null, "Compra eliminada exitosamente")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar compra"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
