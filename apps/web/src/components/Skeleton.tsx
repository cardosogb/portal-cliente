/**
 * Placeholder animado enquanto o conteúdo real carrega — substitui um
 * "Carregando..." seco por algo que já mostra o formato do que está por
 * vir, menos confuso pra quem não está acostumado com telas de app.
 */
export function Skeleton({ width = "100%", height = 14, style }: { width?: number | string; height?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

export function CardSkeleton() {
  return (
    <div className="card">
      <Skeleton width="40%" height={11} style={{ marginBottom: 10 }} />
      <Skeleton width="70%" height={18} style={{ marginBottom: 10 }} />
      <Skeleton width="50%" height={13} />
    </div>
  );
}
