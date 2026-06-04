"use client"

import dynamic from "next/dynamic"

const QRCodeSVG = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-[80px] h-[80px] bg-gray-100" />,
})

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

interface ReceiptHTMLProps {
  sale: SaleData
  settings?: {
    empresa_nombre?: string
    empresa_rnc?: string
    empresa_telefono?: string
    empresa_direccion?: string
  }
}

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value))

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

export function ReceiptHTML({ sale, settings }: ReceiptHTMLProps) {
  return (
    <div className="bg-white text-black p-6 max-w-sm mx-auto font-mono text-sm print:p-0">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4 mb-4">
        <h1 className="text-lg font-bold">{settings?.empresa_nombre ?? "Mi Empresa"}</h1>
        {settings?.empresa_rnc && <p className="text-xs text-gray-500">RNC: {settings.empresa_rnc}</p>}
        {settings?.empresa_direccion && <p className="text-xs text-gray-500">{settings.empresa_direccion}</p>}
        {settings?.empresa_telefono && <p className="text-xs text-gray-500">Tel: {settings.empresa_telefono}</p>}
      </div>

      {/* Customer Section */}
      {sale.metodoPago === "CREDITO" ? (
        <div className="border border-yellow-400 bg-yellow-50 p-3 rounded mb-4 text-xs">
          <p className="font-bold text-sm text-center mb-2">CONTRATO DE CRÉDITO</p>
          <div className="flex justify-between">
            <span>Cliente: {sale.customer.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span>Cédula: {sale.customer.cedula ?? "N/A"}</span>
          </div>
          {sale.customer.telefono && (
            <div className="flex justify-between">
              <span>Teléfono: {sale.customer.telefono}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Fecha: {formatDate(sale.creadoEn)}</span>
          </div>
          {sale.credito && (
            <>
              <div className="flex justify-between">
                <span>{sale.credito.cuotas} cuotas ({frecuenciaLabel[sale.credito.frecuencia] ?? sale.credito.frecuencia})</span>
              </div>
              <div className="flex justify-between">
                <span>Cuota {sale.credito.frecuencia === "MENSUAL" ? "mensual" : sale.credito.frecuencia === "QUINCENAL" ? "quincenal" : "semanal"}: {formatCurrency(Number(sale.credito.montoTotal) / sale.credito.cuotas)}</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 p-3 rounded mb-4 text-xs">
          <p className="font-bold mb-1">Cliente:</p>
          <div className="flex justify-between">
            <span>Nombre: {sale.customer.nombre}</span>
          </div>
          {sale.customer.cedula && (
            <div className="flex justify-between">
              <span>Cédula: {sale.customer.cedula}</span>
            </div>
          )}
          {sale.customer.telefono && (
            <div className="flex justify-between">
              <span>Tel: {sale.customer.telefono}</span>
            </div>
          )}
        </div>
      )}

      {/* Sale Info */}
      <div className="mb-4 space-y-1">
        <div className="flex justify-between text-xs">
          <span>{sale.metodoPago === "CREDITO" ? `Contrato #${sale.numero}` : `Factura #${sale.numero}`}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Fecha: {formatDate(sale.creadoEn)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Vendedor: {sale.user.nombre}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="border-t border-b border-gray-300 py-2 mb-4">
        <div className="flex text-xs font-bold border-b border-gray-200 pb-1 mb-1">
          <span className="w-2/5">Producto</span>
          <span className="w-1/5 text-center">Cant</span>
          <span className="w-1/5 text-right">Precio</span>
          <span className="w-1/5 text-right">Subtotal</span>
        </div>
        {sale.items.map((item, i) => (
          <div key={i} className="flex text-xs py-1 border-b border-gray-100">
            <span className="w-2/5 truncate">{item.nombre}</span>
            <span className="w-1/5 text-center">{item.cantidad}</span>
            <span className="w-1/5 text-right">{formatCurrency(item.precioUnitario)}</span>
            <span className="w-1/5 text-right">{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>ITBIS (18%):</span>
          <span>{formatCurrency(sale.impuesto)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="text-xs mb-4">
        <span>Método de pago: {metodoPagoLabel[sale.metodoPago] ?? sale.metodoPago}</span>
      </div>

      {/* Credit Section */}
      {sale.credito && (
        <div className="bg-yellow-50 p-3 rounded mb-4 text-xs">
          <p className="font-bold mb-1">Plan de Crédito</p>
          <p>Inicial pagado: {formatCurrency(sale.credito.inicial)}</p>
          <p>Saldo financiado: {formatCurrency(sale.credito.saldo)}</p>
          <p>
            {sale.credito.cuotas} cuotas ({frecuenciaLabel[sale.credito.frecuencia] ?? sale.credito.frecuencia})
          </p>
          {Number(sale.credito.tasaInteres) > 0 && (
            <p>Tasa de interés: {sale.credito.tasaInteres}%</p>
          )}
          <p>Monto total del crédito: {formatCurrency(sale.credito.montoTotal)}</p>
        </div>
      )}

      {/* QR Code */}
      <div className="text-center mb-4">
        <QRCodeSVG
          value={`https://pos-muebles.com/ventas/${sale.id}`}
          size={80}
          level="M"
        />
        <p className="text-xs text-gray-500 mt-2">Escanee para ver detalles</p>
      </div>

      {/* Signature */}
      <div className="text-center mt-8 mb-4">
        <div className="w-48 border-t border-gray-300 mx-auto mb-1" />
        <p className="text-xs text-gray-500">Firma del vendedor</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
        <p>¡Gracias por su compra!</p>
        <p>POS Muebles</p>
      </div>
    </div>
  )
}
