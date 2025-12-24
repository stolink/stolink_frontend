import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type StatColor = "sage" | "amber" | "blue" | "purple" | "red" | "green";

const colorClasses: Record<StatColor, { bg: string; text: string }> = {
  sage: { bg: "bg-sage-100", text: "text-sage-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  red: { bg: "bg-red-100", text: "text-red-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
};

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: StatColor;
  centered?: boolean;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  color = "sage",
  centered = false,
}: StatCardProps) {
  const { bg, text } = colorClasses[color];

  if (centered) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Icon className={`h-8 w-8 mx-auto ${text} mb-2`} />
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}
          >
            <Icon className={`h-5 w-5 ${text}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
