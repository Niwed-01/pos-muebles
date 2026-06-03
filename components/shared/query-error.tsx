import { AlertTriangle, RefreshCw } from "lucide-react"

interface QueryErrorProps {
  message?: string
  onRetry?: () => void
}

export function QueryError({ message = "Algo salió mal", onRetry }: QueryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-300 mb-1">Error</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      )}
    </div>
  )
}
