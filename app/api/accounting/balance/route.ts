import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    await getAuthUser()
    const { searchParams } = new URL(req.url)
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")

    const where: Record<string, unknown> = {}
    if (desde || hasta) {
      const fechaFilter: Record<string, Date> = {}
      if (desde) fechaFilter.gte = new Date(desde)
      if (hasta) {
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        fechaFilter.lte = fin
      }
      where.fecha = fechaFilter
    }

    const lines = await db.journalLine.findMany({
      where: { entry: where },
      include: { account: { select: { id: true, codigo: true, nombre: true, tipo: true } } },
    })

    const balanceMap = new Map<string, { debe: number; haber: number; cuenta: { codigo: string; nombre: string; tipo: string } }>()

    for (const line of lines) {
      const current = balanceMap.get(line.accountId) ?? {
        debe: 0,
        haber: 0,
        cuenta: { codigo: line.account.codigo, nombre: line.account.nombre, tipo: line.account.tipo },
      }
      current.debe += Number(line.debe)
      current.haber += Number(line.haber)
      balanceMap.set(line.accountId, current)
    }

    const balances = Array.from(balanceMap.entries())
      .map(([accountId, b]) => ({
        accountId,
        codigo: b.cuenta.codigo,
        nombre: b.cuenta.nombre,
        tipo: b.cuenta.tipo,
        saldoDebe: Math.round(b.debe * 100) / 100,
        saldoHaber: Math.round(b.haber * 100) / 100,
        saldoNeto: Math.round((b.debe - b.haber) * 100) / 100,
      }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo))

    const totalDebe = balances.reduce((s, b) => s + b.saldoDebe, 0)
    const totalHaber = balances.reduce((s, b) => s + b.saldoHaber, 0)

    return apiResponse({
      balances,
      totalDebe: Math.round(totalDebe * 100) / 100,
      totalHaber: Math.round(totalHaber * 100) / 100,
      cuadra: Math.round(totalDebe * 100) / 100 === Math.round(totalHaber * 100) / 100,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener balance"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
