import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/utils"
import { generateF607 } from "@/lib/dgii"

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    const body = await req.json()
    const { mes, anio } = body as { mes: number; anio: number }
    const periodo = `${anio}${String(mes).padStart(2, "0")}`

    const rncSetting = await db.setting.findUnique({ where: { clave: "empresa_rnc" } })
    const rnc = rncSetting?.valor ?? "000000000"

    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 1)

    const ventas = await db.sale.findMany({
      where: {
        creadoEn: { gte: inicio, lt: fin },
        estado: { not: "ANULADA" },
      },
      include: { customer: { select: { nombre: true, cedula: true } } },
      orderBy: { creadoEn: "asc" },
    })

    const ventasForLib = ventas.map((v) => ({
      id: v.id,
      ncf: v.ncf,
      tipoIngreso: v.tipoIngreso,
      subtotal: Number(v.subtotal),
      impuesto: Number(v.impuesto),
      total: Number(v.total),
      itbisRetenido: Number(v.itbisRetenido ?? 0),
      propina: Number(v.propina ?? 0),
      metodoPago: v.metodoPago,
      estado: v.estado,
      creadoEn: v.creadoEn,
      customer: v.customer ? { cedula: v.customer.cedula, nombre: v.customer.nombre } : null,
    }))

    const content = generateF607(periodo, rnc, ventasForLib)

    const totalMonto = ventas.reduce((s, v) => s + Number(v.total), 0)
    const totalITBIS = ventas.reduce((s, v) => s + Number(v.impuesto), 0)

    await db.dgiiSubmission.create({
      data: {
        tipo: "607",
        periodo,
        registros: ventas.length,
        totalMonto: Math.round(totalMonto * 100) / 100,
        totalITBIS: Math.round(totalITBIS * 100) / 100,
        userId: user.id,
      },
    })

    const fileName = `DGII_F_607_${rnc}_${periodo}.TXT`
    const encoder = new TextEncoder()
    const bytes = encoder.encode(content)

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(bytes.length),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al generar archivo 607"
    return NextResponse.json({ data: null, error: message, message: null }, { status: 500 })
  }
}
