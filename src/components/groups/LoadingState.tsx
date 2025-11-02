const LoadingState = () => {
  return (
    <div className="space-y-8 p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-neutral-200 rounded-xl"></div>
          <div className="h-4 w-64 bg-neutral-200 rounded-lg"></div>
        </div>
        <div className="h-10 w-10 bg-neutral-200 rounded-full"></div>
      </div>

      {/* Members List Skeleton */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <div className="h-6 w-32 bg-neutral-200 rounded-lg mb-4"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-12 w-12 bg-neutral-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-neutral-200 rounded-lg"></div>
              <div className="h-3 w-32 bg-neutral-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Skeleton */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <div className="h-6 w-20 bg-neutral-200 rounded-lg"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className={`h-16 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'} bg-neutral-200 rounded-2xl`}></div>
          </div>
        ))}
      </div>
      
      <div className="text-center py-4">
        <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-heading font-semibold text-neutral-700">Chargement de ton groupe...</p>
      </div>
    </div>
  );
};

export default LoadingState;
