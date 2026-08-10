"use client";

import Link from "next/link";
import { Sailboat, SquarePen } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const showCreate = pathname !== "/create";

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="OceanArchive 首页">
          <span className="brand-mark"><Sailboat /></span>
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
