import type { ReactNode } from "react";

interface SettingRowProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 mr-4">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
