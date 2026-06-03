export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-10 bg-slate-800 rounded-lg animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={`h-10 bg-slate-800/50 rounded-lg animate-pulse ${
                j === 0 ? "w-1/4" : j === cols - 1 ? "w-1/6" : "flex-1"
              }`}
              style={{ animationDelay: `${(i * cols + j) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
