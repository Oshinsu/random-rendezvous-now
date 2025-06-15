
const LoadingState = () => {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h3 className="text-lg font-heading font-semibold text-neutral-800 mb-2">
        Chargement en cours...
      </h3>
      <p className="text-sm text-neutral-600 font-body">Synchronisation avec votre groupe</p>
    </div>
  );
};

export default LoadingState;
