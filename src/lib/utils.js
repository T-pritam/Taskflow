import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(inputs);
}

export function initialsOf(member) {
  const source = member?.full_name || member?.email || "?";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
