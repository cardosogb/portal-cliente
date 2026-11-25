import type { ReactNode } from "react";
import { InboxIcon } from "@/components/Icons";

export function EmptyState({
  icon = <InboxIcon />,
  title,
  description,
}: {
  icon?: ReactNode;
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
