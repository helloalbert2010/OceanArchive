import Image from "next/image";

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`avatar avatar-${size}`} title={name}>
      <Image src="/brand-logo.png" alt="" width={64} height={64} />
    </span>
  );
}
