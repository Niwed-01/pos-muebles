import { NextRequest } from "next/server"
import { z } from "zod"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const createUserSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.enum(["ADMIN", "VENDEDOR"]),
})

export async function GET() {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden listar usuarios", undefined, 403)
    }

    const data = await db.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
      orderBy: { nombre: "asc" },
    })

    return apiResponse(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener usuarios"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden crear usuarios", undefined, 403)
    }

    const body = await req.json()
    const parsed = createUserSchema.parse(body)

    const existing = await db.user.findUnique({ where: { email: parsed.email } })
    if (existing) {
      return apiResponse(null, "Ya existe un usuario con ese email", undefined, 400)
    }

    const passwordHash = await hash(parsed.password, 12)

    const data = await db.user.create({
      data: {
        nombre: parsed.nombre,
        email: parsed.email,
        passwordHash,
        rol: parsed.rol,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
    })

    return apiResponse(data, null, "Usuario creado exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al crear usuario"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
