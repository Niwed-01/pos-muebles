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
  Wallet,
  ShoppingBag,
  Printer,
  X,
  FileText,
  Check,
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
  tipoSeguro: "FIJO" | "PORCENTAJE"
  gastosLegales: number
  detalleGastos: string
  modalidadGastos: "CUOTAS" | "INICIAL"
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(value)

const ITBIS_RATE = 0.18

const paymentMethods = [
  { key: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { key: "TARJETA", label: "Tarjeta", icon: CreditCard },
  { key: "TRANSFERENCIA", label: "Transferencia", icon: Landmark },
  { key: "CREDITO", label: "Crédito", icon: Wallet },
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
    tipoSeguro: "FIJO",
    gastosLegales: 0,
    detalleGastos: "",
    modalidadGastos: "CUOTAS",
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [showCashModal, setShowCashModal] = useState(false)
  const [activeCartIndex, setActiveCartIndex] = useState<number>(-1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const productSearchRef = useRef<HTMLInputElement>(null)
  const cartRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const t = setTimeout(() => setCustomerDebouncedSearch(customerSearch), 300)
    return () => clearTimeout(t)
  }, [customerSearch])

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

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.categoria.nombre))
    return Array.from(cats).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products
    return products.filter((p) => p.categoria.nombre === selectedCategory)
  }, [products, selectedCategory])

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

  const creditSchedule = useMemo(() => {
    if (creditForm.plazo <= 0 || total <= 0) return []
    
    const gastosLegales = creditForm.gastosLegales || 0
    const modalidadGastos = creditForm.modalidadGastos || "CUOTAS"
    
    let P = total - creditForm.inicial
    if (modalidadGastos === "CUOTAS" && gastosLegales > 0) {
      P = Math.round((P + gastosLegales) * 100) / 100
    }
    
    if (P <= 0) return []

    const r = creditForm.tasaInteres / 100
    const rPeriodo = creditForm.frecuencia === "MENSUAL" ? r / 12
      : creditForm.frecuencia === "QUINCENAL" ? r / (52 / 2)
      : r / 52
    const n = creditForm.plazo

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

      let seguro: number
      if (creditForm.tipoSeguro === "PORCENTAJE") {
        seguro = Math.round(saldo * ((creditForm.seguro || 0) / 100) * 100) / 100
      } else {
        seguro = creditForm.seguro || 0
      }

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

  const creditSummary = useMemo(() => {
    if (creditSchedule.length === 0) return null
    
    const gastosLegales = creditForm.gastosLegales || 0
    const modalidadGastos = creditForm.modalidadGastos || "CUOTAS"
    
    let montoFinanciado = total - creditForm.inicial
    if (modalidadGastos === "CUOTAS" && gastosLegales > 0) {
      montoFinanciado = Math.round((montoFinanciado + gastosLegales) * 100) / 100
    }
    
    const cuotaConSeguro = creditSchedule[0]?.monto ?? 0
    const totalAPagar = creditSchedule.reduce((sum, r) => sum + r.monto, 0) + creditForm.inicial + (modalidadGastos === "INICIAL" ? gastosLegales : 0)
    const totalIntereses = creditSchedule.reduce((sum, r) => sum + r.interes, 0)
    const totalSeguros = creditSchedule.reduce((sum, r) => sum + r.seguro, 0)
    
    return { 
      montoFinanciado, 
      cuotaConSeguro, 
      totalAPagar, 
      totalIntereses, 
      totalSeguros,
      gastosLegales,
      modalidadGastos 
    }
  }, [creditSchedule, creditForm.inicial, creditForm.gastosLegales, creditForm.modalidadGastos, total])

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
          seguro: creditForm.tipoSeguro === "FIJO" ? creditForm.seguro : 0,
          tipoSeguro: creditForm.tipoSeguro,
          valorSeguro: creditForm.seguro,
          gastosLegales: creditForm.gastosLegales,
          detalleGastos: creditForm.detalleGastos,
          modalidadGastos: creditForm.modalidadGastos,
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
    if (paymentMethod === "EFECTIVO") {
      setCashReceived(0)
      setShowCashModal(true)
      return
    }

    saleMutation.mutate()
  }

  const handleNewSale = () => {
    setCart([])
    setCustomer(null)
    setPaymentMethod(null)
    setCreditForm({
      inicial: 0,
      plazo: 1,
      frecuencia: "MENSUAL",
      tasaInteres: 0,
      seguro: 0,
      tipoSeguro: "FIJO",
      gastosLegales: 0,
      detalleGastos: "",
      modalidadGastos: "CUOTAS"
    })
    setShowCreditDrawer(false)
    setShowCashModal(false)
    setShowSuccess(false)
    setLastSale(null)
    setCashReceived(0)
    setActiveCartIndex(-1)
    setSelectedCategory(null)
    productSearchRef.current?.focus()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleProductSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredProducts.length === 1 && debouncedSearch) {
      e.preventDefault()
      addToCart(filteredProducts[0])
      setSearch("")
      setDebouncedSearch("")
      productSearchRef.current?.focus()
    }
  }

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

  const handleConfirmCredit = () => {
    setShowCreditDrawer(false)
  }

  const cashChange = paymentMethod === "EFECTIVO" && cashReceived > total ? cashReceived - total : 0
  const canCobrar =
    customer && cart.length > 0 && paymentMethod && !saleMutation.isPending

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-0 overflow-hidden">
      {/* LEFT PANEL */}
      <div className="flex-1 flex flex-col bg-slate-50 p-4 overflow-hidden">
        {/* Search bar */}
        <div className="flex-shrink-0 mb-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={productSearchRef}
            type="text"
            placeholder="Buscar producto, nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleProductSearchKeyDown}
            className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl shadow-sm text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            autoFocus
          />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex-shrink-0 mb-3 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 text-xs rounded-full py-1 px-3 font-medium transition-colors ${
                  selectedCategory === null
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 text-xs rounded-full py-1 px-3 font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {productsLoading ? (
            <LoadingSpinner className="mt-12" />
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              {debouncedSearch ? "Sin resultados" : "No hay productos disponibles"}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.productId === product.id)
                const outOfStock = product.stock <= 0
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className={`relative bg-white rounded-xl border p-3 text-left transition-all ${
                      outOfStock
                        ? "border-slate-200 opacity-50 cursor-not-allowed"
                        : inCart
                          ? "border-emerald-500 bg-emerald-50 cursor-pointer"
                          : "border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 hover:scale-[1.02] hover:shadow-md cursor-pointer"
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                      {product.imagenes?.[0] ? (
                        <img
                          src={product.imagenes[0]}
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate mt-2">
                      {product.nombre}
                    </p>
                    <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                      {formatCurrency(Number(product.precio))}
                    </p>
                    <p className={`text-xs mt-0.5 ${outOfStock ? "text-red-500" : "text-slate-400"}`}>
                      {outOfStock ? "Sin stock" : `${product.stock} ud`}
                    </p>
                    {inCart && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                        {inCart.cantidad}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[360px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full">
        {/* Cart header */}
        <div className="flex-shrink-0 py-3 px-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-800 flex items-center gap-2">
            Venta actual
            {cart.length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                {cart.length}
              </span>
            )}
          </h2>
        </div>

        {/* Cart items */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 space-y-2 py-2">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Agrega productos para comenzar
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={item.productId}
                ref={(el) => { cartRefs.current[index] = el }}
                tabIndex={0}
                onKeyDown={(e) => handleCartKeyDown(e, index)}
                onClick={() => setActiveCartIndex(index)}
                className={`bg-slate-50 rounded-lg p-3 border transition-colors cursor-pointer ${
                  activeCartIndex === index
                    ? "border-emerald-500 ring-1 ring-emerald-500/20"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 mr-2">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.nombre}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(item.precioUnitario)} c/u
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromCart(item.productId)
                    }}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateQuantity(item.productId, item.cantidad - 1)
                      }}
                      className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
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
                      className="w-12 text-center bg-white border border-slate-200 rounded text-sm text-slate-800 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
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
                      className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer selector */}
        <div className="flex-shrink-0 px-4 py-2.5 border-t border-slate-200">
          {customer ? (
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-800 truncate">{customer.nombre}</span>
              </div>
              <button
                onClick={() => {
                  setCustomer(null)
                  setCustomerSearch("")
                }}
                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
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
                className="w-full px-3 h-9 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              {customerDebouncedSearch && customers.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl max-h-32 overflow-y-auto z-10">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c)
                        setCustomerSearch("")
                        setCustomerDebouncedSearch("")
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {c.nombre}
                      {c.cedula && (
                        <span className="text-slate-400 ml-2">{c.cedula}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {customerDebouncedSearch && customers.length === 0 && !createCustomerMutation.isPending && (
                <button
                  onClick={() => createCustomerMutation.mutate(customerSearch)}
                  className="mt-1 w-full text-left px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  + Crear &quot;{customerSearch}&quot; como cliente
                </button>
              )}
              {createCustomerMutation.isPending && (
                <p className="mt-1 text-xs text-slate-400">Creando cliente...</p>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-slate-200 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal sin ITBIS</span>
            <span className="text-slate-800 font-mono">{formatCurrency(base)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">ITBIS 18%</span>
            <span className="text-slate-800 font-mono">{formatCurrency(impuesto)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200">
            <span className="text-base font-bold text-slate-800">TOTAL</span>
            <span className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-slate-200">
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
                  className={`flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-all border ${
                    isSelected
                      ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-400"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {method.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cobrar button */}
        <div className="flex-shrink-0 p-4 border-t border-slate-200">
          <button
            onClick={handleCobrar}
            disabled={!canCobrar}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saleMutation.isPending ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Cobrar {total > 0 && formatCurrency(total)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* CREDIT DRAWER */}
      {showCreditDrawer && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowCreditDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
            <div className="flex-shrink-0 p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Configurar crédito</h3>
              <button
                onClick={() => setShowCreditDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-slate-500 mb-1">Total de la venta</p>
                <p className="text-2xl font-bold text-slate-800 font-mono">{formatCurrency(total)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  value={creditForm.inicial}
                  onChange={(e) =>
                    setCreditForm((prev) => ({ ...prev, inicial: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3 h-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Número de cuotas</label>
                <input
                  type="number"
                  min={1}
                  value={creditForm.plazo}
                  onChange={(e) =>
                    setCreditForm((prev) => ({ ...prev, plazo: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  className="w-full px-3 h-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Frecuencia</label>
                <select
                  value={creditForm.frecuencia}
                  onChange={(e) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      frecuencia: e.target.value as CreditForm["frecuencia"],
                    }))
                  }
                  className="w-full px-3 h-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="SEMANAL">Semanal</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tasa de Interés (%)</label>
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
                  className="w-full px-3 h-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setCreditForm((prev) => ({ ...prev, tipoSeguro: "FIJO", seguro: 0 }))}
                    className={`flex-1 h-9 text-xs font-medium rounded-lg border transition-colors ${
                      creditForm.tipoSeguro === "FIJO"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
                    }`}
                  >
                    FIJO (RD$)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditForm((prev) => ({ ...prev, tipoSeguro: "PORCENTAJE", seguro: 0 }))}
                    className={`flex-1 h-9 text-xs font-medium rounded-lg border transition-colors ${
                      creditForm.tipoSeguro === "PORCENTAJE"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
                    }`}
                  >
                    % Porcentaje
                  </button>
                </div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {creditForm.tipoSeguro === "PORCENTAJE" ? "Seguro (%)" : "Seguro por cuota (RD$)"}
                </label>
                <input
                  type="number"
                  step={creditForm.tipoSeguro === "PORCENTAJE" ? "0.1" : "0.01"}
                  value={creditForm.seguro}
                  onChange={(e) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      seguro: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 h-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder={creditForm.tipoSeguro === "PORCENTAJE" ? "0" : "0"}
                />
              </div>

              {/* Sección Gastos legales (opcional) */}
              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-xs font-bold text-slate-550 uppercase tracking-wider">Gastos legales (opcional)</h4>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monto gastos legales (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={creditForm.gastosLegales || ""}
                    onChange={(e) =>
                      setCreditForm((prev) => ({
                        ...prev,
                        gastosLegales: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3 h-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={creditForm.detalleGastos}
                    onChange={(e) =>
                      setCreditForm((prev) => ({
                        ...prev,
                        detalleGastos: e.target.value,
                      }))
                    }
                    className="w-full px-3 h-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    placeholder="Ej: Notaría, registro..."
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-600">Modalidad de cobro</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditForm((prev) => ({ ...prev, modalidadGastos: "CUOTAS" }))}
                      className={`flex-1 h-9 text-xs font-medium rounded-lg border transition-all ${
                        creditForm.modalidadGastos === "CUOTAS"
                          ? "bg-slate-700 text-white border-slate-700"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      Incluir en cuotas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreditForm((prev) => ({ ...prev, modalidadGastos: "INICIAL" }))}
                      className={`flex-1 h-9 text-xs font-medium rounded-lg border transition-all ${
                        creditForm.modalidadGastos === "INICIAL"
                          ? "bg-slate-700 text-white border-slate-700"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      Cobrar con inicial
                    </button>
                  </div>
                </div>
              </div>

              {creditSummary && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <h4 className="text-sm font-medium text-emerald-800 mb-3">Resumen del Crédito</h4>
                  <div className="text-center mb-3">
                    <p className="text-xs text-slate-500">Cuota {creditForm.frecuencia === "MENSUAL" ? "mensual" : creditForm.frecuencia === "QUINCENAL" ? "quincenal" : "semanal"}</p>
                    <p className="text-2xl font-bold text-emerald-700 font-mono">{formatCurrency(creditSummary.cuotaConSeguro)}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monto financiado:</span>
                      <span className="text-slate-800 font-mono">{formatCurrency(creditSummary.montoFinanciado)}</span>
                    </div>
                    {creditSummary.gastosLegales > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gastos legales:</span>
                        <span className="text-slate-800 font-mono">
                          {formatCurrency(creditSummary.gastosLegales)} ({creditSummary.modalidadGastos === "CUOTAS" ? "en cuotas" : "al inicial"})
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total intereses:</span>
                      <span className="text-slate-880 font-mono">{formatCurrency(creditSummary.totalIntereses)}</span>
                    </div>
                    {creditSummary.totalSeguros > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total seguros:</span>
                        <span className="text-slate-800 font-mono">{formatCurrency(creditSummary.totalSeguros)}</span>
                      </div>
                    )}
                    {creditSummary.gastosLegales > 0 && creditSummary.modalidadGastos === "INICIAL" && (
                      <div className="flex justify-between border-t border-emerald-200/50 pt-2">
                        <span className="text-slate-650 font-medium">Pago Inicial Total:</span>
                        <span className="text-slate-800 font-bold font-mono">{formatCurrency(creditForm.inicial + creditSummary.gastosLegales)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-emerald-200 pt-2">
                      <span className="text-slate-880 font-medium">Total a pagar:</span>
                      <span className="text-emerald-700 font-bold font-mono">{formatCurrency(creditSummary.totalAPagar)}</span>
                    </div>
                  </div>
                </div>
              )}

              {creditSchedule.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Tabla de Cuotas</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-2 py-2 text-left text-slate-500 font-medium">#</th>
                          <th className="px-2 py-2 text-left text-slate-500 font-medium">Fecha</th>
                          <th className="px-2 py-2 text-right text-slate-500 font-medium">Capital</th>
                          <th className="px-2 py-2 text-right text-slate-500 font-medium">Interés</th>
                          <th className="px-2 py-2 text-right text-slate-500 font-medium">Seguro</th>
                          <th className="px-2 py-2 text-right text-slate-500 font-medium">Total</th>
                          <th className="px-2 py-2 text-right text-slate-500 font-medium">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {creditSchedule.map((row) => (
                          <tr key={row.cuota} className="hover:bg-slate-50">
                            <td className="px-2 py-2 text-slate-600 font-mono">{row.cuota}</td>
                            <td className="px-2 py-2 text-slate-600 whitespace-nowrap">
                              {row.fecha.toLocaleDateString("es-DO", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-2 py-2 text-right text-slate-600 font-mono">{formatCurrency(row.capital)}</td>
                            <td className="px-2 py-2 text-right text-slate-600 font-mono">{formatCurrency(row.interes)}</td>
                            <td className="px-2 py-2 text-right text-slate-600 font-mono">{formatCurrency(row.seguro)}</td>
                            <td className="px-2 py-2 text-right text-slate-800 font-mono font-medium">{formatCurrency(row.monto)}</td>
                            <td className="px-2 py-2 text-right text-slate-400 font-mono">{formatCurrency(row.saldo)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 font-medium">
                          <td colSpan={5} className="px-2 py-2 text-right text-slate-500">Total a financiar</td>
                          <td className="px-2 py-2 text-right text-slate-800 font-mono">
                            {formatCurrency(creditSchedule.reduce((sum, r) => sum + r.monto, 0))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 p-5 border-t border-slate-200">
              <button
                onClick={handleConfirmCredit}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base rounded-xl transition-colors"
              >
                Confirmar crédito
              </button>
            </div>
          </div>
        </>
      )}

      {/* CASH MODAL */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowCashModal(false); setCashReceived(0) }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">

            {/* Total */}
            <div className="text-center mb-6">
              <p className="text-sm text-slate-500 mb-1">Total a cobrar</p>
              <p className="text-3xl font-bold text-slate-800 font-mono">{formatCurrency(total)}</p>
            </div>

            {/* Input monto recibido */}
            <div className="mb-4">
              <input
                type="number"
                step="0.01"
                value={cashReceived || ""}
                onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                className="w-full h-14 text-3xl text-center bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="0"
                autoFocus
              />
            </div>

            {/* Botones de billetes */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[50, 100, 200, 500, 1000, 2000].map((bill) => (
                <button
                  key={bill}
                  onClick={() => setCashReceived((prev) => prev + bill)}
                  className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-lg border border-slate-200 transition-colors"
                >
                  RD${bill.toLocaleString()}
                </button>
              ))}
              <button
                onClick={() => setCashReceived(total)}
                className="h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-200 transition-colors col-span-2"
              >
                Exacto
              </button>
            </div>

            {/* Vuelto */}
            <div className={`rounded-xl p-4 mb-6 text-center ${cashChange >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
              <p className={`text-sm mb-1 ${cashChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {cashChange >= 0 ? "VUELTO" : "FALTA"}
              </p>
              <p className={`text-4xl font-bold font-mono ${cashChange >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {cashChange >= 0 ? formatCurrency(cashChange) : formatCurrency(Math.abs(cashChange))}
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCashModal(false); setCashReceived(0) }}
                className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-base rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowCashModal(false); saleMutation.mutate() }}
                disabled={cashReceived < total || saleMutation.isPending}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {saleMutation.isPending ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Cobrar {formatCurrency(total)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccess && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleNewSale} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">¡Venta registrada!</h3>
            <p className="text-sm text-slate-500 mb-6">
              Venta #{lastSale.numero} — {formatCurrency(Number(lastSale.total))}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handlePrint}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir recibo
              </button>
              <button
                onClick={() => {
                  handleNewSale()
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
              >
                <FileText className="h-4 w-4" />
                Ver detalle
              </button>
              <button
                onClick={handleNewSale}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
