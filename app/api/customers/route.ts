import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const createCustomerSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cedula: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  direccion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { cedula: { contains: search, mode: "insensitive" } },
        { telefono: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const [data, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: {
          _count: { select: { ventas: true, creditos: true } },
        },
        skip,
        take: limit,
        orderBy: { nombre: "asc" },
      }),
      db.customer.count({ where }),
    ])

    return apiResponse({ items: data, total, page, limit })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener clientes"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAuthUser()
    const body = await req.json()
    const parsed = createCustomerSchema.parse(body)

    if (parsed.email === "") parsed.email = null

    const data = await db.customer.create({ data: parsed })
    return apiResponse(data, null, "Cliente creado exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al crear cliente"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
