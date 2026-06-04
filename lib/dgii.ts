export interface SaleFor607 {
  id: string
  ncf: string | null
  tipoIngreso: string | null
  subtotal: number
  impuesto: number
  total: number
  itbisRetenido: number
  propina: number
  metodoPago: string
  estado: string
  creadoEn: Date
  customer: {
    cedula: string | null
    nombre: string
  } | null
}

export interface PurchaseFor606 {
  rncProveedor: string
  tipoId: string
  tipoBien: string
  ncf: string
  ncfModificado: string | null
  fechaComprobante: Date
  fechaPago: Date | null
  montoServicios: number
  montoBienes: number
  itbisFacturado: number
  itbisRetenido: number
  itbisCosto: number
  tipoRetencionISR: string | null
  montoRetencionISR: number | null
  formaPago: string
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function formatNum(n: number): string {
  return n.toFixed(2)
}

function detectIdType(cedula: string | null): { id: string; tipo: string } {
  if (!cedula) return { id: "", tipo: "" }
  const clean = cedula.replace(/[-\s]/g, "")
  if (/^\d{9}$/.test(clean)) return { id: clean, tipo: "1" }
  if (/^\d{11}$/.test(clean)) return { id: clean, tipo: "2" }
  return { id: clean, tipo: "3" }
}

export function generateF607(
  periodo: string,
  rnc: string,
  ventas: SaleFor607[]
): string {
  const lineas: string[] = []
  lineas.push(`607|${rnc}|${periodo}|${ventas.length}`)

  for (const v of ventas) {
    const { id: idCliente, tipo: tipoId } = detectIdType(v.customer?.cedula ?? null)
    const ncfClean = (v.ncf ?? "").replace(/-/g, "")
    const montoTotal = v.total
    const metodo = v.metodoPago

    const efvo = metodo === "EFECTIVO" ? montoTotal : 0
    const tranf = metodo === "TRANSFERENCIA" ? montoTotal : 0
    const tarj = metodo === "TARJETA" ? montoTotal : 0
    const cred = metodo === "CREDITO" ? montoTotal : 0

    lineas.push([
      idCliente,
      tipoId,
      ncfClean,
      "",
      v.tipoIngreso ?? "01",
      formatDate(v.creadoEn),
      "",
      formatNum(v.subtotal),
      formatNum(v.impuesto),
      formatNum(v.itbisRetenido ?? 0),
      "0",
      "0",
      "0",
      "0",
      "0",
      formatNum(v.propina ?? 0),
      formatNum(efvo),
      formatNum(tranf),
      formatNum(tarj),
      formatNum(cred),
      "0",
      "0",
      "0",
    ].join("|"))
  }

  return lineas.join("\r\n")
}

export function generateF606(
  periodo: string,
  rnc: string,
  compras: PurchaseFor606[]
): string {
  const lineas: string[] = []
  lineas.push(`606|${rnc}|${periodo}|${compras.length}`)

  for (const c of compras) {
    const ncfClean = c.ncf.replace(/-/g, "")
    const ncfModClean = c.ncfModificado ? c.ncfModificado.replace(/-/g, "") : ""

    lineas.push([
      c.rncProveedor,
      c.tipoId,
      c.tipoBien,
      ncfClean,
      ncfModClean,
      formatDate(c.fechaComprobante),
      c.fechaPago ? formatDate(c.fechaPago) : "",
      formatNum(c.montoServicios),
      formatNum(c.montoBienes),
      formatNum(c.montoServicios + c.montoBienes),
      formatNum(c.itbisFacturado),
      formatNum(c.itbisRetenido),
      "0",
      formatNum(c.itbisCosto),
      formatNum(c.itbisFacturado - c.itbisCosto),
      "0",
      c.tipoRetencionISR ?? "",
      c.montoRetencionISR ? formatNum(c.montoRetencionISR) : "0",
      "0",
      "0",
      "0",
      "0",
      c.formaPago,
    ].join("|"))
  }

  return lineas.join("\r\n")
}

export interface Resumen607 {
  totalVentas: number
  totalBaseImponible: number
  totalITBIS: number
  cantidadFacturas: number
  ventasPorMetodo: Record<string, number>
  facturasPorDia: number[]
}

export function calcularResumen607(ventas: SaleFor607[]): Resumen607 {
  const ventasPorMetodo: Record<string, number> = {
    EFECTIVO: 0,
    TRANSFERENCIA: 0,
    TARJETA: 0,
    CREDITO: 0,
  }
  const facturasPorDia: number[] = Array(31).fill(0)

  let totalVentas = 0
  let totalBaseImponible = 0
  let totalITBIS = 0

  for (const v of ventas) {
    totalVentas += v.total
    totalBaseImponible += v.subtotal
    totalITBIS += v.impuesto
    if (ventasPorMetodo[v.metodoPago] !== undefined) {
      ventasPorMetodo[v.metodoPago] += v.total
    }
    const dia = new Date(v.creadoEn).getDate()
    if (dia >= 1 && dia <= 31) facturasPorDia[dia - 1]++
  }

  return {
    totalVentas: Math.round(totalVentas * 100) / 100,
    totalBaseImponible: Math.round(totalBaseImponible * 100) / 100,
    totalITBIS: Math.round(totalITBIS * 100) / 100,
    cantidadFacturas: ventas.length,
    ventasPorMetodo,
    facturasPorDia,
  }
}
