import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

interface SaleItem {
  productId: string
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface SaleData {
  id: string
  numero: number
  items: SaleItem[]
  subtotal: number
  impuesto: number
  total: number
  metodoPago: string
  estado: string
  creadoEn: string
  customer: { id: string; nombre: string; cedula: string | null; telefono: string | null; email: string | null; direccion: string | null }
  user: { id: string; nombre: string }
  credito?: {
    id: string
    inicial: string
    cuotas: number
    frecuencia: string
    tasaInteres: string
    saldo: string
    montoTotal: string
  } | null
}

interface ReceiptProps {
  sale: SaleData
  settings?: {
    empresa_nombre?: string
    empresa_rnc?: string
    empresa_telefono?: string
    empresa_direccion?: string
  }
  format?: "thermal80" | "a4"
}

// 80mm thermal receipt styles
const thermalStyles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
    width: 226, // 80mm
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 7,
    color: "#666",
    marginBottom: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    fontSize: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    backgroundColor: "#f0f0f0",
    padding: 2,
  },
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 2,
    marginBottom: 2,
    fontWeight: "bold",
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    fontSize: 8,
  },
  colDesc: { width: "40%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "25%", textAlign: "right" },
  totalsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
    fontSize: 8,
  },
  totalLabel: { width: 80, textAlign: "right", marginRight: 8 },
  totalValue: { width: 60, textAlign: "right", fontFamily: "Helvetica-Bold" },
  grandTotal: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 8,
  },
  signature: {
    marginTop: 20,
    textAlign: "center",
  },
  signatureLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginHorizontal: "auto",
    marginBottom: 2,
  },
  creditSection: {
    marginTop: 8,
    backgroundColor: "#fdf6e3",
    padding: 6,
    borderRadius: 4,
  },
  qrSection: {
    marginTop: 10,
    alignItems: "center",
  },
})

// A4 receipt styles
const a4Styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    backgroundColor: "#f0f0f0",
    padding: 4,
  },
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  colDesc: { width: "40%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "25%", textAlign: "right" },
  totalsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  totalLabel: { width: 100, textAlign: "right", marginRight: 10 },
  totalValue: { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold" },
  grandTotal: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  signature: {
    marginTop: 30,
    textAlign: "center",
  },
  signatureLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginHorizontal: "auto",
    marginBottom: 4,
  },
  creditSection: {
    marginTop: 10,
    backgroundColor: "#fdf6e3",
    padding: 8,
    borderRadius: 4,
  },
  qrSection: {
    marginTop: 20,
    alignItems: "center",
  },
  customerSection: {
    marginTop: 10,
    padding: 8,
    border: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
})

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(
    Number(value)
  )

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  CREDITO: "Crédito",
}

const frecuenciaLabel: Record<string, string> = {
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
}

export function Receipt({ sale, settings, format = "thermal80" }: ReceiptProps) {
  const styles = format === "thermal80" ? thermalStyles : a4Styles
  const isThermal = format === "thermal80"

  return (
    <Document>
      <Page
        size={isThermal ? { width: 226, height: "auto" } : "A4"}
        style={styles.page}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {settings?.empresa_nombre ?? "Mi Empresa"}
          </Text>
          {settings?.empresa_rnc && (
            <Text style={styles.subtitle}>RNC: {settings.empresa_rnc}</Text>
          )}
          {settings?.empresa_direccion && (
            <Text style={styles.subtitle}>{settings.empresa_direccion}</Text>
          )}
          {settings?.empresa_telefono && (
            <Text style={styles.subtitle}>Tel: {settings.empresa_telefono}</Text>
          )}
        </View>

        {/* Sale Info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text>Recibo de Venta #{sale.numero}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text>Fecha: {formatDate(sale.creadoEn)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text>Cliente: {sale.customer.nombre}</Text>
          </View>
          {sale.customer.cedula && (
            <View style={styles.infoRow}>
              <Text>Cédula: {sale.customer.cedula}</Text>
            </View>
          )}
          {sale.customer.telefono && (
            <View style={styles.infoRow}>
              <Text>Tel: {sale.customer.telefono}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text>Vendedor: {sale.user.nombre}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Producto</Text>
            <Text style={styles.colQty}>Cant</Text>
            <Text style={styles.colPrice}>Precio</Text>
            <Text style={styles.colTotal}>Subtotal</Text>
          </View>
          {sale.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.nombre}</Text>
              <Text style={styles.colQty}>{item.cantidad}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.precioUnitario)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(sale.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ITBIS (18%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(sale.impuesto)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>{formatCurrency(sale.total)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.infoRow}>
          <Text>Método de pago: {metodoPagoLabel[sale.metodoPago] ?? sale.metodoPago}</Text>
        </View>

        {/* Credit Section */}
        {sale.credito && (
          <View style={styles.creditSection}>
            <Text style={{ fontWeight: "bold", marginBottom: 4, fontSize: isThermal ? 8 : 10 }}>
              Plan de Crédito
            </Text>
            <Text>Inicial pagado: {formatCurrency(sale.credito.inicial)}</Text>
            <Text>Saldo financiado: {formatCurrency(sale.credito.saldo)}</Text>
            <Text>
              {sale.credito.cuotas} cuotas ({frecuenciaLabel[sale.credito.frecuencia] ?? sale.credito.frecuencia})
            </Text>
            {Number(sale.credito.tasaInteres) > 0 && (
              <Text>Tasa de interés: {sale.credito.tasaInteres}%</Text>
            )}
            <Text>Monto total del crédito: {formatCurrency(sale.credito.montoTotal)}</Text>
          </View>
        )}

        {/* QR Code */}
        <View style={styles.qrSection}>
          <Text style={{ fontSize: isThermal ? 7 : 8, color: "#666", marginBottom: 4 }}>
            Escanee para ver detalles
          </Text>
          {/* QR rendered as text placeholder - actual QR would need SVG support in react-pdf */}
          <Text style={{ fontSize: isThermal ? 6 : 8, color: "#999" }}>
            Venta #{sale.numero} | {settings?.empresa_nombre ?? "POS Muebles"}
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: isThermal ? 7 : 9, color: "#666" }}>Firma del vendedor</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>¡Gracias por su compra!</Text>
          <Text>POS Muebles</Text>
        </View>
      </Page>
    </Document>
  )
}
