"use client"

import { useState, useRef, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Save, Upload, X, Loader2, Package } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { QueryError } from "@/components/shared/query-error"

const productFormSchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  costo: z.coerce.number().positive("El costo debe ser positivo"),
  precio: z.coerce.number().positive("El precio debe ser positivo"),
  stockMinimo: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo").default(0),
})

type ProductFormData = z.infer<typeof productFormSchema>

export default function ProductFormPage() {
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const isNew = params.id === "new"
  const productId = isNew ? null : (params.id as string)

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [stockActual, setStockActual] = useState(0)
  const [ajusteStock, setAjusteStock] = useState("")
  const [motivoAjuste, setMotivoAjuste] = useState("")
  const [showStockModal, setShowStockModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      categoryId: "",
      costo: undefined,
      precio: undefined,
      stockMinimo: 0,
    },
  })

  const costo = watch("costo")
  const precio = watch("precio")

  const margen = useMemo(() => {
    const c = Number(costo)
    const p = Number(precio)
    if (!c || !p || c <= 0) return null
    return ((p - c) / c) * 100
  }, [costo, precio])

  const ganancia = useMemo(() => {
    const c = Number(costo || 0)
    const p = Number(precio || 0)
    return p - c
  }, [costo, precio])

  const { isLoading: productLoading, refetch } = useQuery({
    queryKey: ["product", productId],
    enabled: !!productId,
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      const p = json.data
      reset({
        codigo: p.codigo ?? "",
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        categoryId: p.categoryId,
        costo: Number(p.costo),
        precio: Number(p.precio),
        stockMinimo: p.stockMinimo,
      })
      setExistingImages(p.imagenes ?? [])
      setStockActual(p.stock)
      return p
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      const json = await res.json()
      return json.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData & { imagenes: string[]; stock: number }) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al crear producto")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto creado exitosamente")
      router.push("/products")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData & { imagenes: string[] }) => {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al actualizar producto")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      toast.success("Producto actualizado exitosamente")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const stockMutation = useMutation({
    mutationFn: async () => {
      const cantidad = Number(ajusteStock)
      const res = await fetch("/api/products/adjust-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          cantidad,
          motivo: motivoAjuste,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al ajustar stock")
      return json.data
    },
    onSuccess: (data) => {
      setStockActual(data.stock)
      setAjusteStock("")
      setMotivoAjuste("")
      setShowStockModal(false)
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(`Stock actualizado: ${data.stock}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = async (formData: ProductFormData) => {
    setUploading(true)
    try {
      let allImages = [...existingImages]
      if (newFiles.length > 0) {
        const uploadFormData = new FormData()
        newFiles.forEach((f) => uploadFormData.append("files", f))
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFormData })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadJson.message ?? "Error al subir imágenes")
        allImages = [...allImages, ...uploadJson.data]
      }

      if (isNew) {
        createMutation.mutate({ ...formData, imagenes: allImages, stock: 0 })
      } else {
        updateMutation.mutate({ ...formData, imagenes: allImages })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const total = existingImages.length + newFiles.length + files.length
    if (total > 3) {
      toast.error("Máximo 3 imágenes")
      return
    }
    setNewFiles((prev) => [...prev, ...files].slice(0, 3 - existingImages.length))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  if (productLoading) return <LoadingSpinner className="mt-20" />

  const isSaving = createMutation.isPending || updateMutation.isPending || uploading
  const totalImages = existingImages.length + newFiles.length

  return (
    <div>
      <PageHeader
        title={isNew ? "Nuevo Producto" : "Editar Producto"}
        description={isNew ? "Añade un nuevo producto al catálogo" : "Modifica los datos del producto"}
      >
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-800">Información General</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Código / SKU</label>
            <input
              {...register("codigo")}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              placeholder="Ej: MUE-001 (opcional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
            <input
              {...register("nombre")}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              placeholder="Nombre del producto"
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
            <textarea
              {...register("descripcion")}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
              placeholder="Descripción opcional del producto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
            <select
              {...register("categoryId")}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat: { id: string; nombre: string }) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-800">Precios</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Costo (RD$)</label>
              <input
                type="number"
                step="0.01"
                {...register("costo")}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="0.00"
              />
              {errors.costo && <p className="mt-1 text-xs text-red-600">{errors.costo.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio de Venta (RD$)</label>
              <input
                type="number"
                step="0.01"
                {...register("precio")}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="0.00"
              />
              {errors.precio && <p className="mt-1 text-xs text-red-600">{errors.precio.message}</p>}
            </div>
          </div>

          {margen !== null && (
            <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Margen de ganancia</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    margen >= 50
                      ? "text-emerald-600"
                      : margen >= 25
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {margen >= 0 ? "+" : ""}
                  {margen.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ganancia por unidad:{" "}
                {new Intl.NumberFormat("es-DO", {
                  style: "currency",
                  currency: "DOP",
                }).format(ganancia)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Inventario</h2>
            {!isNew && (
              <button
                type="button"
                onClick={() => setShowStockModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                <Package className="h-3.5 w-3.5" />
                Ajustar Stock
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Stock Actual</p>
              <p className="text-2xl font-bold text-slate-800 font-mono">{stockActual}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock Mínimo</label>
              <input
                type="number"
                {...register("stockMinimo")}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="0"
              />
              {errors.stockMinimo && (
                <p className="mt-1 text-xs text-red-600">{errors.stockMinimo.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Imágenes</h2>
            <span className="text-xs text-slate-400">{totalImages}/3</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {existingImages.map((url, i) => (
              <div key={`existing-${i}`} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Imagen ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            {newFiles.map((file, i) => (
              <div key={`new-${i}`} className="relative group aspect-square">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            {totalImages < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span className="text-xs">Subir</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isNew ? "Crear Producto" : "Guardar Cambios"}
              </>
            )}
          </button>
        </div>
      </form>

      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Ajuste de Inventario</h3>
              <button
                onClick={() => {
                  setShowStockModal(false)
                  setAjusteStock("")
                  setMotivoAjuste("")
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 mb-4">
              <p className="text-xs text-slate-500">Stock actual</p>
              <p className="text-2xl font-bold text-slate-800 font-mono">{stockActual}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ajuste (+ para agregar, - para restar)
                </label>
                <input
                  type="number"
                  step="1"
                  value={ajusteStock}
                  onChange={(e) => setAjusteStock(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="+5 o -3"
                />
                {ajusteStock && (
                  <p className="mt-1 text-xs text-slate-500">
                    Nuevo stock: {stockActual + Number(ajusteStock)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Motivo (requerido)
                </label>
                <input
                  type="text"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="Ej: Conteo físico, mercancía dañada..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStockModal(false)
                  setAjusteStock("")
                  setMotivoAjuste("")
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => stockMutation.mutate()}
                disabled={
                  !ajusteStock ||
                  Number(ajusteStock) === 0 ||
                  !motivoAjuste.trim() ||
                  stockMutation.isPending
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {stockMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Aplicar Ajuste"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
