import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get("accountId")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")

    if (!accountId) return apiResponse(null, "accountId es requerido", undefined, 400)

    const account = await db.account.findUnique({ where: { id: accountId } })
    if (!account) return apiResponse(null, "Cuenta no encontrada", undefined, 404)

    const where: Record<string, unknown> = { accountId }
    if (desde || hasta) {
      const fechaFilter: Record<string, Date> = {}
      if (desde) fechaFilter.gte = new Date(desde)
      if (hasta) {
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        fechaFilter.lte = fin
      }
      where.entry = { fecha: fechaFilter }
    }

    const lines = await db.journalLine.findMany({
      where,
      include: {
        entry: {
          select: { id: true, numero: true, fecha: true, descripcion: true, referencia: true },
        },
      },
      orderBy: { entry: { fecha: "asc" } },
    })

    const movimientos = lines.map((l) => ({
      entryId: l.entryId,
      numero: l.entry.numero,
      fecha: l.entry.fecha,
      descripcion: l.entry.descripcion,
      referencia: l.entry.referencia,
      debe: Number(l.debe),
      haber: Number(l.haber),
    }))

    let saldoAcumulado = 0
    const conSaldo = movimientos.map((m) => {
      saldoAcumulado += m.debe - m.haber
      return { ...m, saldo: Math.round(saldoAcumulado * 100) / 100 }
    })

    const totalDebe = movimientos.reduce((s, m) => s + m.debe, 0)
    const totalHaber = movimientos.reduce((s, m) => s + m.haber, 0)

    return apiResponse({
      account: { id: account.id, codigo: account.codigo, nombre: account.nombre, tipo: account.tipo },
      movimientos: conSaldo,
      totalDebe: Math.round(totalDebe * 100) / 100,
      totalHaber: Math.round(totalHaber * 100) / 100,
      saldoFinal: Math.round(saldoAcumulado * 100) / 100,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener mayor"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
