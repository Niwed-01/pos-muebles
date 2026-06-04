import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/utils"
import { generateF606, PurchaseFor606 } from "@/lib/dgii"

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

    const compras = await db.purchase.findMany({
      where: { fechaComprobante: { gte: inicio, lt: fin } },
      orderBy: { fechaComprobante: "asc" },
    })

    const comprasForLib: PurchaseFor606[] = compras.map((c) => ({
      rncProveedor: c.rncProveedor,
      tipoId: c.tipoId,
      tipoBien: c.tipoBien,
      ncf: c.ncf,
      ncfModificado: c.ncfModificado,
      fechaComprobante: c.fechaComprobante,
      fechaPago: c.fechaPago,
      montoServicios: Number(c.montoServicios),
      montoBienes: Number(c.montoBienes),
      itbisFacturado: Number(c.itbisFacturado),
      itbisRetenido: Number(c.itbisRetenido),
      itbisCosto: Number(c.itbisCosto),
      tipoRetencionISR: c.tipoRetencionISR,
      montoRetencionISR: c.montoRetencionISR ? Number(c.montoRetencionISR) : null,
      formaPago: c.formaPago,
    }))

    const content = generateF606(periodo, rnc, comprasForLib)

    const totalMonto = compras.reduce((s, c) => s + Number(c.montoBienes) + Number(c.montoServicios), 0)
    const totalITBIS = compras.reduce((s, c) => s + Number(c.itbisFacturado), 0)

    await db.dgiiSubmission.create({
      data: {
        tipo: "606",
        periodo,
        registros: compras.length,
        totalMonto: Math.round(totalMonto * 100) / 100,
        totalITBIS: Math.round(totalITBIS * 100) / 100,
        userId: user.id,
      },
    })

    const fileName = `DGII_F_606_${rnc}_${periodo}.TXT`
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
    const message = error instanceof Error ? error.message : "Error al generar archivo 606"
    return NextResponse.json({ data: null, error: message, message: null }, { status: 500 })
  }
}
