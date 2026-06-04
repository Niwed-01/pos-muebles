import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

const expenseSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida"),
  monto: z.number().positive("El monto debe ser positivo"),
  comprobante: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    const body = await req.json()
    const parsed = expenseSchema.parse(body)

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

    // Validar que hay saldo suficiente
    const saldoActualNum = Number(cajaChica.saldoActual)
    if (parsed.monto > saldoActualNum) {
      return apiResponse(
        null,
        "Saldo insuficiente",
        `Saldo disponible: RD$ ${saldoActualNum}`,
        400
      )
    }

    // Crear movimiento y actualizar saldo
    const movimiento = await db.pettyCashMovement.create({
      data: {
        cajaChicaId: cajaChica.id,
        tipo: "REEMBOLSO",
        monto: parsed.monto,
        descripcion: parsed.descripcion,
        comprobante: parsed.comprobante,
        userId: user.id,
      },
      include: { user: true },
    })

    // Actualizar saldo de caja chica
    await db.pettyCash.update({
      where: { id: cajaChica.id },
      data: {
        saldoActual: { decrement: parsed.monto },
      },
    })

    return apiResponse(movimiento, null, "Gasto registrado exitosamente", 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, "Datos inválidos", error.errors.map(e => e.message).join(", "), 400)
    }
    if (error instanceof SyntaxError) {
      return apiResponse(null, "JSON inválido", undefined, 400)
    }
    const message = error instanceof Error ? error.message : "Error al registrar gasto"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
