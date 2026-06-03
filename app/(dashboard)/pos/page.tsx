"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
  ShoppingBag,
  Printer,
  X,
  ChevronRight,
  Eye,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { toast } from "sonner"

interface Product {
  id: string
  codigo?: string | null
  nombre: string
  precio: string
  stock: number
  imagenes: string[]
  categoria: { nombre: string }
}

interface Customer {
  id: string
  nombre: string
  cedula: string | null
  telefono: string | null
}

interface CartItem {
  productId: string
  nombre: string
  codigo?: string | null
  cantidad: number
  precioUnitario: number
  subtotal: number
  stock: number
}

interface CreditForm {
  inicial: number
  plazo: number
  frecuencia: "SEMANAL" | "QUINCENAL" | "MENSUAL"
  tasaInteres: number
  seguro: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(value)

const ITBIS_RATE = 0.18

const paymentMethods = [
  { key: "EFECTIVO", label: "Efectivo", icon: Banknote, color: "bg-emerald-500 hover:bg-emerald-600" },
  { key: "TARJETA", label: "Tarjeta", icon: CreditCard, color: "bg-blue-500 hover:bg-blue-600" },
  { key: "TRANSFERENCIA", label: "Transferencia", icon: Landmark, color: "bg-purple-500 hover:bg-purple-600" },
  { key: "CREDITO", label: "Crédito", icon: Smartphone, color: "bg-amber-500 hover:bg-amber-600" },
] as const

type PaymentMethod = (typeof paymentMethods)[number]["key"]

export default function POSPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerDebouncedSearch, setCustomerDebouncedSearch] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [showCreditDrawer, setShowCreditDrawer] = useState(false)
  const [creditForm, setCreditForm] = useState<CreditForm>({
    inicial: 0,
    plazo: 1,
    frecuencia: "MENSUAL",
    tasaInteres: 0,
    seguro: 0,
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [activeCartIndex, setActiveCartIndex] = useState<number>(-1)
  const productSearchRef = useRef<HTMLInputElement>(null)
  const cartRefs = useRef<(HTMLDivElement | null)[]>([])

  // 200ms debounce for product search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const t = setTimeout(() => setCustomerDebouncedSearch(customerSearch), 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  // Auto-focus on mount
  useEffect(() => {
    productSearchRef.current?.focus()
  }, [])

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", "pos", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ activo: "true", limit: "200" })
      if (debouncedSearch) params.set("search", debouncedSearch)
      const res = await fetch(`/api/products?${params}`)
      const json = await res.json()
      return (json.data?.items ?? []) as Product[]
    },
  })

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", "search", customerDebouncedSearch],
    queryFn: async () => {
      if (!customerDebouncedSearch) return []
      const params = new URLSearchParams({ search: customerDebouncedSearch, limit: "10" })
      const res = await fetch(`/api/customers?${params}`)
      const json = await res.json()
      return (json.data?.items ?? []) as Customer[]
    },
    enabled: customerDebouncedSearch.length > 0,
  })

  const createCustomerMutation = useMutation({
    mutationFn: async (nombre: string) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? "Error al crear cliente")
      return json.data as Customer
    },
    onSuccess: (data) => {
      setCustomer(data)
      setCustomerSearch("")
      setCustomerDebouncedSearch("")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente creado", { description: data.nombre })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        if (existing.cantidad >= product.stock) {
          toast.warning("Sin stock disponible", { description: product.nombre })
          return prev
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario,
              }
            : item
        )
      }
      if (product.stock <= 0) {
        toast.warning("Producto sin stock", { description: product.nombre })
        return prev
      }
      toast.success("Agregado al carrito", { description: product.nombre })
      return [
        ...prev,
        {
          productId: product.id,
          nombre: product.nombre,
          codigo: product.codigo,
          cantidad: 1,
          precioUnitario: Number(product.precio),
          subtotal: Number(product.precio),
          stock: product.stock,
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId))
      toast.info("Producto eliminado del carrito")
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, cantidad, subtotal: cantidad * item.precioUnitario }
          : item
      )
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
    toast.info("Producto eliminado del carrito")
  }, [])

  const { subtotal, base, impuesto, total } = useMemo(() => {
    const s = cart.reduce((sum, item) => sum + item.subtotal, 0)
    const b = s / (1 + ITBIS_RATE)
    const i = s - b
    return { subtotal: s, base: b, impuesto: i, total: s }
  }, [cart])

  // Real-time credit schedule preview using shared module
  const creditSchedule = useMemo(() => {
    if (creditForm.plazo <= 0 || total <= 0) return []
    const P = total - creditForm.inicial
    if (P <= 0) return []

    const r = creditForm.tasaInteres / 100
    const rPeriodo = creditForm.frecuencia === "MENSUAL" ? r / 12
      : creditForm.frecuencia === "QUINCENAL" ? r / (52 / 2)
      : r / 52
    const n = creditForm.plazo
    const seguro = creditForm.seguro || 0

    let cuotaFija: number
    if (rPeriodo === 0) {
      cuotaFija = Math.round((P / n) * 100) / 100
    } else {
      const factor = Math.pow(1 + rPeriodo, n)
      cuotaFija = Math.round((P * (rPeriodo * factor) / (factor - 1)) * 100) / 100
    }

    const dias = creditForm.frecuencia === "MENSUAL" ? 30
      : creditForm.frecuencia === "QUINCENAL" ? 15 : 7

    const schedule: { cuota: number; fecha: Date; capital: number; interes: number; seguro: number; monto: number; saldo: number }[] = []
    let saldo = P

    for (let i = 1; i <= n; i++) {
      const interes = Math.round(saldo * rPeriodo * 100) / 100
      const capital = Math.round((cuotaFija - interes) * 100) / 100
      const totalCuota = Math.round((cuotaFija + seguro) * 100) / 100
      const saldoRestante = i === n ? 0 : Math.round((saldo - capital) * 100) / 100

      schedule.push({
        cuota: i,
        fecha: new Date(Date.now() + i * dias * 86_400_000),
        capital,
        interes,
        seguro,
        monto: totalCuota,
        saldo: saldoRestante,
      })

      saldo = saldoRestante
    }

    return schedule
  }, [creditForm, total])

  // Credit summary for real-time preview
  const creditSummary = useMemo(() => {
    if (creditSchedule.length === 0) return null
    const montoFinanciado = total - creditForm.inicial
    const cuotaConSeguro = creditSchedule[0]?.monto ?? 0
    const totalAPagar = creditSchedule.reduce((sum, r) => sum + r.monto, 0) + creditForm.inicial
    const totalIntereses = creditSchedule.reduce((sum, r) => sum + r.interes, 0)
    const totalSeguros = creditSchedule.reduce((sum, r) => sum + r.seguro, 0)
    return { montoFinanciado, cuotaConSeguro, totalAPagar, totalIntereses, totalSeguros }
  }, [creditSchedule, creditForm.inicial, total])

  const saleMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        customerId: customer!.id,
        items: cart.map((item) => ({
          productId: item.productId,
          cantidad: item.cantidad,
        })),
        metodoPago: paymentMethod,
      }

      if (paymentMethod === "CREDITO") {
        payload.credito = {
          inicial: creditForm.inicial,
          cuotas: creditForm.plazo,
          frecuencia: creditForm.frecuencia,
          tasaInteres: creditForm.tasaInteres,
          seguro: creditForm.seguro,
        }
      }

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al procesar venta")
      return json.data
    },
    onSuccess: (saleData) => {
      setLastSale(saleData)
      setShowSuccess(true)
      toast.success("Venta registrada exitosamente", {
        description: `Venta #${saleData.numero} — ${formatCurrency(Number(saleData.total))}`,
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleCobrar = () => {
    if (!customer) return toast.error("Selecciona un cliente")
    if (cart.length === 0) return toast.error("Agrega productos al carrito")
    if (!paymentMethod) return toast.error("Selecciona un método de pago")
    if (paymentMethod === "CREDITO" && creditForm.inicial > total)
      return toast.error("El inicial no puede superar el total")

    saleMutation.mutate()
  }

  const handleNewSale = () => {
    setCart([])
    setCustomer(null)
    setPaymentMethod(null)
    setCreditForm({ inicial: 0, plazo: 1, frecuencia: "MENSUAL", tasaInteres: 0, seguro: 0 })
    setShowCreditDrawer(false)
    setShowSuccess(false)
    setLastSale(null)
    setCashReceived(0)
    setActiveCartIndex(-1)
    productSearchRef.current?.focus()
  }

  const handlePrint = () => {
    window.print()
  }

  // Auto-add single product on Enter
  const handleProductSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && products.length === 1 && debouncedSearch) {
      e.preventDefault()
      addToCart(products[0])
      setSearch("")
      setDebouncedSearch("")
      productSearchRef.current?.focus()
    }
  }

  // Arrow key navigation for cart
  const handleCartKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault()
      const next = Math.min(index + 1, cart.length - 1)
      setActiveCartIndex(next)
      cartRefs.current[next]?.focus()
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault()
      const prev = Math.max(index - 1, 0)
      setActiveCartIndex(prev)
      cartRefs.current[prev]?.focus()
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault()
      const item = cart[index]
      if (item && item.cantidad < item.stock) {
        updateQuantity(item.productId, item.cantidad + 1)
      }
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault()
      const item = cart[index]
      if (item) {
        if (item.cantidad <= 1) {
          removeFromCart(item.productId)
        } else {
          updateQuantity(item.productId, item.cantidad - 1)
        }
      }
    }
  }

  const cashChange = paymentMethod === "EFECTIVO" && cashReceived > total ? cashReceived - total : 0
  const canCobrar =
    customer && cart.length > 0 && paymentMethod && !saleMutation.isPending &&
    (paymentMethod !== "EFECTIVO" || cashReceived >= total)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* LEFT COLUMN — Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative mb-4 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            ref={productSearchRef}
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleProductSearchKeyDown}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {productsLoading ? (
            <LoadingSpinner className="mt-12" />
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              {debouncedSearch ? "Sin resultados" : "No hay productos disponibles"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => {
                const inCart = cart.find((c) => c.productId === product.id)
                const outOfStock = product.stock <= 0
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className={`bg-slate-800 rounded-xl border p-3 text-left transition-all group ${
                      outOfStock
                        ? "border-slate-700 opacity-40 cursor-not-allowed"
                        : "border-slate-700 hover:border-emerald-500/50 cursor-pointer"
                    }`}
                  >
                    <div className="aspect-square bg-slate-900 rounded-lg mb-2 overflow-hidden">
                      {product.imagenes?.[0] ? (
                        <img
                          src={product.imagenes[0]}
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-200 font-medium truncate">
                      {product.nombre}
                    </p>
                    {product.codigo && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        SKU: {product.codigo}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-mono text-emerald-400 font-bold">
                        {formatCurrency(Number(product.precio))}
                      </span>
                      <span className={`text-xs ${outOfStock ? "text-red-400" : "text-slate-500"}`}>
                        {outOfStock ? "Agotado" : inCart ? `(${inCart.cantidad})` : `${product.stock} ud`}
                      </span>
                    </div>
                    {inCart && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-xs text-emerald-400 font-medium">
                          En carrito: {inCart.cantidad}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN — Cart */}
      <div className="w-full md:w-96 flex flex-col bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex-shrink-0">
        {/* Cart header */}
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            Venta
            {cart.length > 0 && (
              <span className="text-sm font-normal text-slate-400">({cart.length} items)</span>
            )}
          </h2>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Carrito vacío
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={item.productId}
                ref={(el) => { cartRefs.current[index] = el }}
                tabIndex={0}
                onKeyDown={(e) => handleCartKeyDown(e, index)}
                onClick={() => setActiveCartIndex(index)}
                className={`bg-slate-900/50 rounded-lg p-3 border transition-colors cursor-pointer ${
                  activeCartIndex === index
                    ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                    : "border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 mr-2">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {item.nombre}
                    </p>
                    {item.codigo && (
                      <p className="text-xs text-slate-500 font-mono">{item.codigo}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromCart(item.productId)
                    }}
                    className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateQuantity(item.productId, item.cantidad - 1)
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0
                        updateQuantity(item.productId, v)
                      }}
                      className="w-12 text-center bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      min={1}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item.cantidad < item.stock) {
                          updateQuantity(item.productId, item.cantidad + 1)
                        }
                      }}
                      disabled={item.cantidad >= item.stock}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-slate-200">
                      {formatCurrency(item.subtotal)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(item.precioUnitario)} c/u
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer selector */}
        <div className="px-4 py-3 border-t border-slate-700">
          {customer ? (
            <div className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{customer.nombre}</p>
                  {customer.cedula && (
                    <p className="text-xs text-slate-500">{customer.cedula}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setCustomer(null)
                  setCustomerSearch("")
                }}
                className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar o crear cliente..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
              {customerDebouncedSearch && customers.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto z-10">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c)
                        setCustomerSearch("")
                        setCustomerDebouncedSearch("")
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      {c.nombre}
                      {c.cedula && (
                        <span className="text-slate-500 ml-2">{c.cedula}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {customerDebouncedSearch && customers.length === 0 && !createCustomerMutation.isPending && (
                <button
                  onClick={() => createCustomerMutation.mutate(customerSearch)}
                  className="mt-1 w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  + Crear &quot;{customerSearch}&quot; como nuevo cliente
                </button>
              )}
              {createCustomerMutation.isPending && (
                <p className="mt-1 text-xs text-slate-500">Creando cliente...</p>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-t border-slate-700 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal (sin ITBIS)</span>
            <span className="text-slate-200 font-mono">{formatCurrency(base)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">ITBIS (18%)</span>
            <span className="text-slate-200 font-mono">{formatCurrency(impuesto)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-1.5 border-t border-slate-700">
            <span className="text-white">Total</span>
            <span className="text-white font-mono">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Cash change display */}
        {paymentMethod === "EFECTIVO" && (
          <div className="px-4 py-3 border-t border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Monto recibido
            </label>
            <input
              type="number"
              step="0.01"
              value={cashReceived || ""}
              onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="0.00"
            />
            {cashReceived > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-slate-400">Cambio:</span>
                <span className={`text-lg font-bold font-mono ${cashChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(cashChange)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Payment methods */}
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = paymentMethod === method.key
              return (
                <button
                  key={method.key}
                  onClick={() => {
                    setPaymentMethod(method.key)
                    if (method.key === "CREDITO") {
                      setShowCreditDrawer(true)
                    } else {
                      setShowCreditDrawer(false)
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    isSelected
                      ? `${method.color} text-white border-transparent`
                      : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{method.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cobrar button */}
        <div className="p-4 pt-2">
          <button
            onClick={handleCobrar}
            disabled={!canCobrar}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-base font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saleMutation.isPending ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </>
            ) : (
              <>
                Cobrar {total > 0 && formatCurrency(total)}
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* CREDIT DRAWER */}
      {showCreditDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreditDrawer(false)} />
          <div className="relative w-full max-w-lg bg-slate-800 border-l border-slate-700 h-full overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 z-10 p-5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-400" />
                Crédito
              </h3>
              <button
                onClick={() => setShowCreditDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Total de la venta</p>
                <p className="text-2xl font-bold text-white font-mono">{formatCurrency(total)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={creditForm.inicial}
                  onChange={(e) =>
                    setCreditForm((prev) => ({ ...prev, inicial: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Número de cuotas
                </label>
                <input
                  type="number"
                  min={1}
                  value={creditForm.plazo}
                  onChange={(e) =>
                    setCreditForm((prev) => ({ ...prev, plazo: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Frecuencia
                </label>
                <select
                  value={creditForm.frecuencia}
                  onChange={(e) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      frecuencia: e.target.value as CreditForm["frecuencia"],
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="SEMANAL">Semanal</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Tasa de Interés (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={creditForm.tasaInteres}
                  onChange={(e) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      tasaInteres: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Seguro por cuota (RD$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={creditForm.seguro}
                  onChange={(e) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      seguro: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="0"
                />
              </div>

              {/* Real-time credit summary */}
              {creditSummary && (
                <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                  <h4 className="text-sm font-medium text-emerald-400 mb-3">Resumen del Crédito</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monto financiado:</span>
                      <span className="text-slate-200 font-mono">{formatCurrency(creditSummary.montoFinanciado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cuota fija:</span>
                      <span className="text-slate-200 font-mono">{formatCurrency(creditSummary.cuotaConSeguro)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total intereses:</span>
                      <span className="text-slate-200 font-mono">{formatCurrency(creditSummary.totalIntereses)}</span>
                    </div>
                    {creditSummary.totalSeguros > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total seguros:</span>
                        <span className="text-slate-200 font-mono">{formatCurrency(creditSummary.totalSeguros)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-emerald-500/20 pt-2">
                      <span className="text-white font-medium">Total a pagar:</span>
                      <span className="text-emerald-400 font-bold font-mono">{formatCurrency(creditSummary.totalAPagar)}</span>
                    </div>
                  </div>
                </div>
              )}

              {creditSchedule.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">
                    Tabla de Cuotas
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="px-2 py-2 text-left text-slate-400">#</th>
                          <th className="px-2 py-2 text-left text-slate-400">Fecha</th>
                          <th className="px-2 py-2 text-right text-slate-400">Capital</th>
                          <th className="px-2 py-2 text-right text-slate-400">Interés</th>
                          <th className="px-2 py-2 text-right text-slate-400">Seguro</th>
                          <th className="px-2 py-2 text-right text-slate-400">Total</th>
                          <th className="px-2 py-2 text-right text-slate-400">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {creditSchedule.map((row) => (
                          <tr key={row.cuota} className="hover:bg-slate-700/30">
                            <td className="px-2 py-2 text-slate-300 font-mono">{row.cuota}</td>
                            <td className="px-2 py-2 text-slate-300 whitespace-nowrap">
                              {row.fecha.toLocaleDateString("es-DO", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-2 py-2 text-right text-slate-300 font-mono">
                              {formatCurrency(row.capital)}
                            </td>
                            <td className="px-2 py-2 text-right text-slate-300 font-mono">
                              {formatCurrency(row.interes)}
                            </td>
                            <td className="px-2 py-2 text-right text-slate-300 font-mono">
                              {formatCurrency(row.seguro)}
                            </td>
                            <td className="px-2 py-2 text-right text-slate-200 font-mono font-medium">
                              {formatCurrency(row.monto)}
                            </td>
                            <td className="px-2 py-2 text-right text-slate-400 font-mono">
                              {formatCurrency(row.saldo)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-700 font-medium">
                          <td colSpan={5} className="px-2 py-2 text-right text-slate-400">
                            Total a financiar
                          </td>
                          <td className="px-2 py-2 text-right text-slate-200 font-mono">
                            {formatCurrency(
                              creditSchedule.reduce((sum, r) => sum + r.monto, 0)
                            )}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccess && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4 text-center">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Venta Registrada</h3>
            <p className="text-sm text-slate-400 mb-2">
              Venta #{lastSale.numero} — {formatCurrency(Number(lastSale.total))}
            </p>
            <p className="text-xs text-slate-500 mb-6">
              {lastSale.metodoPago === "EFECTIVO"
                ? "Pago en efectivo"
                : lastSale.metodoPago === "TARJETA"
                  ? "Pago con tarjeta"
                  : lastSale.metodoPago === "TRANSFERENCIA"
                    ? "Pago por transferencia"
                    : "Pago a crédito"}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handlePrint}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir Recibo
              </button>
              <button
                onClick={() => {
                  // TODO: navigate to sale detail page
                  handleNewSale()
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                Ver Detalle
              </button>
              <button
                onClick={handleNewSale}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
