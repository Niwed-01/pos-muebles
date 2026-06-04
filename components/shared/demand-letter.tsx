import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4TYFqL_KWxQ.ttf", fontWeight: "normal" },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#555",
  },
  date: {
    textAlign: "right",
    fontSize: 10,
    marginBottom: 20,
    color: "#555",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 4,
  },
  field: {
    flexDirection: "row",
    marginBottom: 4,
  },
  fieldLabel: {
    width: 100,
    fontWeight: "bold",
    color: "#333",
  },
  fieldValue: {
    flex: 1,
    color: "#000",
  },
  body: {
    marginTop: 20,
    textAlign: "justify",
  },
  paragraph: {
    marginBottom: 10,
    fontSize: 11,
  },
  highlight: {
    backgroundColor: "#fff3cd",
    padding: "4 8",
    marginVertical: 4,
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableHeader: {
    backgroundColor: "#1e3a5f",
    padding: 6,
    fontWeight: "bold",
    color: "white",
    fontSize: 9,
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    flex: 1,
  },
  signature: {
    marginTop: 50,
    textAlign: "center",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    width: 250,
    marginHorizontal: "auto",
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#888",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
})

interface DemandLetterProps {
  customerName: string
  cedula: string
  direccion: string
  productos: any[]
  montoAdeudado: number
  diasAtraso: number
  numeroCredito: number
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

function formatDateSpanish(date: Date): string {
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${day} de ${month} de ${year}`
}

export function DemandLetter({
  customerName,
  cedula,
  direccion,
  productos,
  montoAdeudado,
  diasAtraso,
  numeroCredito,
}: DemandLetterProps) {
  const today = formatDateSpanish(new Date())

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(value)

  const productNames = productos
    .map((p: any) => p.nombre || p.productId || "Mueble")
    .join(", ")

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>CARTA DE DEMANDA</Text>
          <Text style={styles.subtitle}>Recuperación de Mueble por Incumplimiento de Pago</Text>
        </View>

        <Text style={styles.date}>Santo Domingo, {today}</Text>

        <Text style={styles.sectionTitle}>Datos del Deudor</Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nombre:</Text>
          <Text style={styles.fieldValue}>{customerName}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Cédula:</Text>
          <Text style={styles.fieldValue}>{cedula}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Dirección:</Text>
          <Text style={styles.fieldValue}>{direccion}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>No. Crédito:</Text>
          <Text style={styles.fieldValue}>{numeroCredito}</Text>
        </View>

        <Text style={styles.sectionTitle}>Detalles de la Deuda</Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Mueble(s):</Text>
          <Text style={styles.fieldValue}>{productNames}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Monto Adeudado:</Text>
          <Text style={styles.fieldValue}>{formatCurrency(montoAdeudado)}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Días de Atraso:</Text>
          <Text style={styles.fieldValue}>{diasAtraso} días</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.paragraph}>
            Por medio de la presente, y en representación de la empresa, le notificamos que
            usted ha incurrido en un atraso de <Text style={{ fontWeight: "bold" }}>{diasAtraso} días</Text> en el
            pago del crédito No. <Text style={{ fontWeight: "bold" }}>{numeroCredito}</Text> correspondiente
            a la compra del(los) siguiente(s) mueble(s): <Text style={{ fontWeight: "bold" }}>{productNames}</Text>.
          </Text>

          <Text style={styles.paragraph}>
            A la fecha, el monto total adeudado asciende a{" "}
            <Text style={{ fontWeight: "bold" }}>{formatCurrency(montoAdeudado)}</Text>,
            por lo que le solicitamos de manera formal y definitiva realizar el pago total de
            la deuda pendiente en un plazo no mayor a CINCO (5) DÍAS calendario a partir de la
            recepción de la presente comunicación.
          </Text>

          <Text style={styles.paragraph}>
            Le recordamos que el contrato de crédito firmado establece que, en caso de
            incumplimiento, la empresa se reserva el derecho de recuperar el(los) mueble(s)
            vendido(s), así como de iniciar las acciones legales correspondientes para el cobro
            de la deuda, incluyendo el reporte ante las centrales de riesgo y el cobro judicial.
          </Text>

          <Text style={styles.paragraph}>
            En caso de no recibir el pago en el plazo indicado, procederemos a:
          </Text>

          <Text style={styles.paragraph}>
            {"1. "}Recuperar el(los) mueble(s) vendido(s).{"\n"}
            {"2. "}Iniciar acciones legales para el cobro de la deuda.{"\n"}
            {"3. "}Reportar el incumplimiento ante las centrales de riesgo (DataCrédito, etc.).
          </Text>

          <Text style={styles.paragraph}>
            Agradecemos su atención y quedamos a la espera de su pronta respuesta para evitar
            mayores inconvenientes.
          </Text>

          <Text style={styles.paragraph}>
            Para cualquier consulta o acuerdo de pago, favor comunicarse al teléfono de la
            empresa en horario de oficina.
          </Text>
        </View>

        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>Firma del Negocio</Text>
          <Text style={{ fontSize: 10, color: "#555", marginTop: 3 }}>POS Muebles</Text>
        </View>

        <Text style={styles.footer}>
          Esta carta tiene carácter de demanda formal y forma parte del proceso de recuperación.
          Documento generado el {today}.
        </Text>
      </Page>
    </Document>
  )
}
