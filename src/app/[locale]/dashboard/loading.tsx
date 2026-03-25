export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-surface-sunken flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-subtle">Loading...</p>
      </div>
    </div>
  )
}
