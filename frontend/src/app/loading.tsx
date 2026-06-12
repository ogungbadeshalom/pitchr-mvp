export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-teal-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" role="status" aria-label="Loading" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
