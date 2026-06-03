import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const createProductSchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  categoryId: z.string().min(1, "La categoría es requerida"),
  costo: z.number().positive("El costo debe ser positivo"),
  precio: z.number().positive("El precio debe ser positivo"),
  stock: z.number().int().min(0).default(0),
  stockMinimo: z.number().int().min(0).default(0),
  activo: z.boolean().default(true),
  imagenes: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const categoryId = searchParams.get("categoryId")
    const activo = searchParams.get("activo")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { codigo: { contains: search, mode: "insensitive" } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (activo !== null) where.activo = activo === "true"

    const [data, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { categoria: true },
        skip,
        take: limit,
        orderBy: { nombre: "asc" },
      }),
      db.product.count({ where }),
    ])

    return apiResponse({ items: data, total, page, limit })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener productos"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden crear productos", undefined, 403)
    }
    const body = await req.json()
    const parsed = createProductSchema.parse(body)
    const data = await db.product.create({
      data: parsed,
      include: { categoria: true },
    })
    return apiResponse(data, null, "Producto creado exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al crear producto"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
