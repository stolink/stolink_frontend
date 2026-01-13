import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface RelationshipRadarProps {
  data: {
    emotionalBond: number;
    functionalTrust: number;
    valueAlignment: number;
    interdependence: number;
    latentTension: number;
  };
  className?: string;
}

const METRIC_LABELS: Record<string, string> = {
  emotionalBond: "정서적 유대",
  functionalTrust: "기능적 신뢰",
  valueAlignment: "가치관 일치",
  interdependence: "상호 의존성",
  latentTension: "잠재적 갈등",
};

export function RelationshipRadar({ data, className }: RelationshipRadarProps) {
  // Safe validation
  const hasValues = Object.values(data).some((v) => v !== undefined && v > 0);
  if (!hasValues) return null;

  const chartData = [
    {
      subject: METRIC_LABELS.emotionalBond,
      A: data.emotionalBond || 0,
      fullMark: 10,
    },
    {
      subject: METRIC_LABELS.functionalTrust,
      A: data.functionalTrust || 0,
      fullMark: 10,
    },
    {
      subject: METRIC_LABELS.interdependence,
      A: data.interdependence || 0,
      fullMark: 10,
    },
    {
      subject: METRIC_LABELS.latentTension,
      A: data.latentTension || 0,
      fullMark: 10,
    },
    {
      subject: METRIC_LABELS.valueAlignment,
      A: data.valueAlignment || 0,
      fullMark: 10,
    },
  ];

  return (
    <div className={cn("w-full h-[200px] text-xs", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#7D5A4B", fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Relationship"
            dataKey="A"
            stroke="#A47764"
            fill="#A47764"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
