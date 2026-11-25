export function EmptyState({
  icon = "📭",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <div className="icon" aria-hidden="true">{icon}</div>
      <p className="title">{title}</p>
      {description && <p className="desc">{description}</p>}
    </div>
  );
}
