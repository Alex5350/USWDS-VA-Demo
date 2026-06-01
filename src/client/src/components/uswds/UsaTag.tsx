import type { ReactNode } from "react";

type TagTone = "default" | "green" | "red" | "gold" | "blue";

type UsaTagProps = {
  children: ReactNode;
  tone?: TagTone;
};

function toneClass(tone: TagTone) {
  if (tone === "green") {
    return " bg-green text-white";
  }

  if (tone === "red") {
    return " bg-red text-white";
  }

  if (tone === "gold") {
    return " bg-gold text-ink";
  }

  if (tone === "blue") {
    return " bg-primary text-white";
  }

  return "";
}

export function UsaTag({ children, tone = "default" }: UsaTagProps) {
  return <span className={`usa-tag${toneClass(tone)}`}>{children}</span>;
}
