import { type ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import customParse from "dayjs/plugin/customParseFormat";
dayjs.extend(customParse);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCZK(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseDeadline(s?: string | null): Date | undefined {
  if (!s) return undefined;
  const d = dayjs(
    s.trim(),
    ["D. M. YYYY H:mm", "DD. MM. YYYY HH:mm", "YYYY-MM-DDTHH:mm:ss"],
    "cs",
    true
  );
  return d.isValid() ? d.toDate() : undefined;
}
