import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconColor?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  iconColor = "text-sage-500",
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
        <Icon className={`h-6 w-6 ${iconColor}`} />
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
