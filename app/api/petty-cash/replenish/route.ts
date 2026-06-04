import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const replenishSchema = z.object({
  monto: z.number().positive("El monto debe ser positivo"),
  descripcion: z.string().min(1, "La descripción es requerida"),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (user.rol !== "ADMIN") {
      return apiResponse(null, "Solo administradores pueden reponer el fondo", undefined, 403)
    }

    const body = await req.json()
    const parsed = replenishSchema.parse(body)

    // Obtener caja chica
    let cajaChica = await db.pettyCash.findFirst()
    if (!cajaChica) {
      cajaChica = await db.pettyCash.create({
        data: {
          nombre: "Caja Chica",
          fondoAsignado: 10000,
          saldoActual: 10000,
        },
      })
    }

    // Validar que no supere el fondo asignado
    const saldoActualNum = Number(cajaChica.saldoActual)
    const fondoAsignadoNum = Number(cajaChica.fondoAsignado)
    const nuevoSaldo = saldoActualNum + parsed.monto
    if (nuevoSaldo > fondoAsignadoNum) {
      return apiResponse(
        null,
        "Excede el fondo asignado",
        `Fondo máximo: RD$ ${fondoAsignadoNum}, nuevo saldo sería: RD$ ${nuevoSaldo}`,
        400
      )
    }

    // Crear movimiento y actualizar saldo
    const movimiento = await db.pettyCashMovement.create({
      data: {
        cajaChicaId: cajaChica.id,
        tipo: "REPOSICION",
        monto: parsed.monto,
        descripcion: parsed.descripcion,
        userId: user.id,
      },
      include: { user: true },
    })

    // Actualizar saldo de caja chica
    await db.pettyCash.update({
      where: { id: cajaChica.id },
      data: {
        saldoActual: { increment: parsed.monto },
      },
    })

    return apiResponse(movimiento, null, "Fondo repuesto exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al reponer fondo"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
