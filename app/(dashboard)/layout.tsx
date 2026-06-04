"use client"

import { useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  CreditCard,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  LogOut,
  Loader2,
  Wallet,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react"
import { useUIStore } from "@/lib/store"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
  { href: "/credits", label: "Créditos", icon: CreditCard },
  { href: "/recovery", label: "Recuperación", icon: AlertTriangle },
  { href: "/petty-cash", label: "Caja Chica", icon: Wallet },
  { href: "/dgii", label: "DGII", icon: FileSpreadsheet, children: [
    { href: "/dgii", label: "606 / 607" },
    { href: "/dgii/history", label: "Historial" },
  ]},
  { href: "/accounting", label: "Contabilidad", icon: BookOpen, children: [
    { href: "/accounting", label: "Diario / Mayor" },
    { href: "/accounting/accounts", label: "Catálogo de Cuentas" },
  ]},
  { href: "/settings", label: "Configuración", icon: Settings, children: [
    { href: "/settings", label: "General" },
    { href: "/settings/users", label: "Usuarios" },
  ]},
]

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Productos",
  "/customers": "Clientes",
  "/pos": "Punto de Venta",
  "/credits": "Créditos",
  "/recovery": "Recuperación de Muebles",
  "/dgii": "Declaración DGII",
  "/dgii/history": "Historial DGII",
  "/petty-cash": "Caja Chica",
  "/settings": "Configuración General",
  "/settings/users": "Gestión de Usuarios",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } = useUIStore()
  const pageTitle = pageTitles[pathname] ?? "Dashboard"

  const { data: lowStockProducts } = useQuery({
    queryKey: ["products", "low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/products?activo=true&limit=200")
      const json = await res.json()
      const products: any[] = json.data?.items ?? []
      return products.filter((p) => p.stock <= p.stockMinimo)
    },
    refetchInterval: 60000,
  })

  useEffect(() => {
    setSidebarMobileOpen(false)
  }, [pathname, setSidebarMobileOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarMobileOpen(false)
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [setSidebarMobileOpen])

  const handleOverlayClick = useCallback(() => {
    setSidebarMobileOpen(false)
  }, [setSidebarMobileOpen])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const lowStockCount = lowStockProducts?.length ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={handleOverlayClick}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-200
          transition-all duration-300 flex flex-col
          w-60
          ${sidebarCollapsed ? "md:w-16" : ""}
          ${sidebarMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center h-16 px-4 border-b border-slate-200">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          {!sidebarCollapsed && (
            <span className="ml-3 font-semibold text-slate-800">POS Muebles</span>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/")
            const hasChildren = item.children && item.children.length > 0
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
                {hasChildren && !sidebarCollapsed && isActive && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`
                            block px-3 py-1.5 rounded-lg text-xs transition-colors
                            ${childActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            }
                          `}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-slate-600">
                  {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {session?.user?.name ?? "Usuario"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {session?.user?.email ?? ""}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-slate-600">
                  {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-60"}`}>
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>

            <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            {lowStockCount > 0 && (
              <Link
                href="/products"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {lowStockCount} producto(s) bajo stock
                </span>
                <span className="sm:hidden">{lowStockCount}</span>
              </Link>
            )}
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
