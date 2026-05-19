"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiOutlineHome,
  HiOutlineCollection,
  HiOutlinePlusCircle,
  HiOutlineSearch,
} from "react-icons/hi";

const navItems = [
  { href: "/", label: "ড্যাশবোর্ড", icon: HiOutlineHome },
  { href: "/batches", label: "ব্যাচ সমূহ", icon: HiOutlineCollection },
  { href: "/batches/new", label: "নতুন ব্যাচ", icon: HiOutlinePlusCircle },
  { href: "/#search", label: "কাস্টমার", icon: HiOutlineSearch },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  // Hide bottom nav when virtual keyboard is likely open
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        // If viewport is significantly smaller than window, keyboard is open
        setHidden(viewportHeight < windowHeight * 0.75);
      }
    };

    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      return () => window.visualViewport?.removeEventListener("resize", handleResize);
    }
  }, []);

  const handleNavClick = (href: string) => {
    if (href === "/#search") {
      // Focus the search input on the dashboard
      if (pathname === "/") {
        const searchInput = document.querySelector('input[placeholder*="কাস্টমার"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  return (
    <nav className={`bottom-nav no-print ${hidden ? "hidden" : ""}`}>
      {navItems.map((item) => {
        const isSearch = item.href === "/#search";
        const isActive = isSearch
          ? false
          : pathname === item.href ||
            (item.href === "/batches" && pathname.match(/^\/batches\/[a-f0-9]+$/i) !== null);

        if (isSearch) {
          return (
            <Link
              key={item.href}
              href="/"
              className="bottom-nav-item"
              onClick={() => handleNavClick(item.href)}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
