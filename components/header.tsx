"use client";

import Link from "next/link";
import Image from "next/image";
import { SquarePen } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const showCreate = pathname !== "/create";

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="OceanArchive 首页">
          <span className="brand-mark"><Image src="/brand-logo.png" alt="" width={40} height={40} priority /></span>
          <span>OceanArchive</span>
        </Link>
        {showCreate && (
          <Link href="/create" className="primary-button header-create">
            <SquarePen />
            <span>分享航海故事</span>
          </Link>
        )}
      </div>
    </header>
  );
}
