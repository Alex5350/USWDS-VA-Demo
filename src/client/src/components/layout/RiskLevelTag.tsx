import { UsaTag } from "@/components/uswds/UsaTag";
import type { RiskLevel } from "@/lib/api-client";

type RiskLevelTagProps = {
  level: RiskLevel;
};

export function RiskLevelTag({ level }: RiskLevelTagProps) {
  const tone = level === "Critical" ? "red" : level === "High" ? "gold" : level === "Medium" ? "blue" : "green";

  return <UsaTag tone={tone}>{level}</UsaTag>;
}
