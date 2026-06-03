import { db } from "@/lib/db"
import { apiResponse, getAuthUser } from "@/lib/utils"

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export async function GET() {
  try {
    await getAuthUser()

    const now = new Date()
    const startToday = startOfDay(now)
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Ventas últimos 7 días — una sola query
    const start7Dias = new Date(now)
    start7Dias.setDate(start7Dias.getDate() - 6)
    start7Dias.setHours(0, 0, 0, 0)

    const ventasAgregadas = await db.sale.findMany({
      where: {
        estado: "PAGADA",
        creadoEn: { gte: start7Dias, lte: endOfDay(now) },
      },
      select: { total: true, creadoEn: true },
    })

    const ventasMap = new Map<string, number>()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      ventasMap.set(d.toISOString().split("T")[0], 0)
    }
    for (const v of ventasAgregadas) {
      const fecha = new Date(v.creadoEn).toISOString().split("T")[0]
      const prev = ventasMap.get(fecha) ?? 0
      ventasMap.set(fecha, prev + Number(v.total))
    }
    const ventas7Dias = Array.from(ventasMap.entries()).map(([fecha, total]) => ({ fecha, total }))

    const startWeek = new Date(now)
    startWeek.setDate(startWeek.getDate() - 7)
    startWeek.setHours(0, 0, 0, 0)

    const [
      ventasHoy,
      ventasMes,
      creditosActivos,
      clientesNuevosMes,
      ultimasVentas,
      ventasSemana,
    ] = await Promise.all([
      db.sale.aggregate({
        where: { estado: "PAGADA", creadoEn: { gte: startToday } },
        _count: true,
        _sum: { total: true },
      }),
      db.sale.aggregate({
        where: { estado: "PAGADA", creadoEn: { gte: startMonth } },
        _count: true,
        _sum: { total: true },
      }),
      db.credit.aggregate({
        where: { estado: { in: ["ACTIVO", "ATRASADO"] } },
        _count: true,
        _sum: { saldo: true },
      }),
      db.customer.count({
        where: { creadoEn: { gte: startMonth } },
      }),
      db.sale.findMany({
        where: { estado: "PAGADA" },
        orderBy: { creadoEn: "desc" },
        take: 5,
        include: {
          customer: { select: { id: true, nombre: true } },
          user: { select: { id: true, nombre: true } },
        },
      }),
      db.sale.findMany({
        where: { estado: "PAGADA", creadoEn: { gte: startWeek } },
        select: { items: true },
      }),
    ])

    interface SaleItem {
      productId: string
      nombre: string
      cantidad: number
      subtotal: number
    }

    const productMap = new Map<string, { nombre: string; cantidad: number; total: number }>()
    for (const sale of ventasSemana) {
      const items = sale.items as SaleItem[]
      for (const item of items) {
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.cantidad += item.cantidad
          existing.total += item.subtotal
        } else {
          productMap.set(item.productId, {
            nombre: item.nombre,
            cantidad: item.cantidad,
            total: item.subtotal,
          })
        }
      }
    }

    const topProductos = Array.from(productMap.entries())
      .sort((a, b) => b[1].cantidad - a[1].cantidad)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }))

    return apiResponse({
      ventasHoy: {
        count: ventasHoy._count,
        total: ventasHoy._sum.total,
      },
      ventasMes: {
        count: ventasMes._count,
        total: ventasMes._sum.total,
      },
      creditosActivos: {
        count: creditosActivos._count,
        saldoPendiente: creditosActivos._sum.saldo,
      },
      clientesNuevosMes,
      ventas7Dias,
      ultimasVentas,
      topProductos,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener dashboard"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
