"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Save,
  Building2,
  Percent,
  CreditCard,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

interface Setting {
  id: string
  clave: string
  valor: string
}

const SETTING_KEYS = [
  "empresa_nombre",
  "empresa_rnc",
  "empresa_telefono",
  "empresa_direccion",
  "empresa_logo",
  "itbis_porcentaje",
  "itbis_activo",
  "interes_default",
  "seguro_default",
  "moneda",
] as const

type SettingsMap = Record<string, string>

export default function SettingsGeneralPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SettingsMap>({})
  const [saving, setSaving] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings")
      const json = await res.json()
      return (json.data ?? []) as Setting[]
    },
  })

  useEffect(() => {
    if (settings && settings.length > 0) {
      const map: SettingsMap = {}
      for (const s of settings) {
        map[s.clave] = s.valor
      }
      for (const key of SETTING_KEYS) {
        if (!(key in map)) {
          if (key === "itbis_activo") map[key] = "true"
          else if (key === "itbis_porcentaje") map[key] = "18"
          else if (key === "moneda") map[key] = "RD$"
          else map[key] = ""
        }
      }
      setForm((prev) => ({ ...map, ...prev }))
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const settingsPayload = SETTING_KEYS.map((clave) => ({
        clave,
        valor: form[clave] ?? "",
      }))
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsPayload }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? "Error al guardar")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      toast.success("Configuración guardada exitosamente")
      setSaving(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setSaving(false)
    },
  })

  const handleSaveAll = () => {
    setSaving(true)
    updateMutation.mutate()
  }

  if (isLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Configuración General" description="Ajustes del sistema" />

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Información de la Empresa</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nombre de la Empresa
            </label>
            <input
              value={form.empresa_nombre ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, empresa_nombre: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="Mi Empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">RNC / Cédula Fiscal</label>
            <input
              value={form.empresa_rnc ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, empresa_rnc: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="000-00000-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Teléfono</label>
            <input
              value={form.empresa_telefono ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, empresa_telefono: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="809-000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Dirección</label>
            <input
              value={form.empresa_direccion ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, empresa_direccion: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="Dirección fiscal"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Logo (URL)
          </label>
          <input
            value={form.empresa_logo ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, empresa_logo: e.target.value }))}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            placeholder="https://ejemplo.com/logo.png"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Moneda</label>
          <input
            value={form.moneda ?? "RD$"}
            onChange={(e) => setForm((prev) => ({ ...prev, moneda: e.target.value }))}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            placeholder="RD$"
          />
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">ITBIS</h2>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  itbis_activo: prev.itbis_activo === "true" ? "false" : "true",
                }))
              }
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.itbis_activo === "true" ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  form.itbis_activo === "true" ? "translate-x-4" : ""
                }`}
              />
            </div>
            <span className="text-sm text-slate-300">Activar ITBIS</span>
          </label>
        </div>

        <div className="sm:w-48">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Porcentaje (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={form.itbis_porcentaje ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, itbis_porcentaje: e.target.value }))
            }
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            placeholder="18"
          />
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">
            Valores por Defecto para Créditos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Tasa de Interés Default (% anual)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.interes_default ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, interes_default: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Seguro por Cuota (RD$)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.seguro_default ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, seguro_default: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Todo
            </>
          )}
        </button>
      </div>
    </div>
  )
}
