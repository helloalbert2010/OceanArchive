import { Sailboat } from "lucide-react";

const colors = ["#d7ecf2", "#f1e3cb", "#dce6da", "#e8dcec", "#d8e0ec"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <span className={`avatar avatar-${size}`} style={{ backgroundColor: color }} aria-hidden="true">
      <Sailboat />
    </span>
  );
}
