"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuth, SEED_USERS } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS_BY_ROLE: Record<string, NavLink[]> = {
  admin: [{ label: "Orders", href: "/admin" }],
  technician: [{ label: "My Jobs", href: "/technician" }],
  manager: [
    { label: "Reviews", href: "/manager" },
    { label: "Dashboard", href: "/manager/dashboard" },
    { label: "AI Assistant", href: "/manager/ai" },
  ],
};

export function Navbar() {
  const { currentUser, switchUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = NAV_LINKS_BY_ROLE[currentUser.role] ?? [];

  function handleUserSwitch(userId: string) {
    switchUser(userId);
    const user = SEED_USERS.find((u) => u.id === userId);
    if (!user) return;

    const roleRoutes: Record<string, string> = {
      admin: "/admin",
      technician: "/technician",
      manager: "/manager",
    };
    router.push(roleRoutes[user.role]);
    setIsMobileMenuOpen(false);
  }

  const roleSwitcher = (
    <div className="relative">
      <select
        value={currentUser.id}
        onChange={(e) => handleUserSwitch(e.target.value)}
        className="w-full appearance-none rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {SEED_USERS.map((user) => {
          const hasRole = user.name.includes("(");
          const label = hasRole
            ? user.name
            : `${user.name} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`;
          return (
            <option key={user.id} value={user.id}>
              {label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: App name */}
          <Link href="/" className="shrink-0 text-lg font-semibold text-gray-900">
            <span className="sm:hidden">Sejuk Sejuk</span>
            <span className="hidden sm:inline">Sejuk Sejuk Service Portal</span>
          </Link>

          {/* Center: Desktop nav links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Desktop role switcher + mobile hamburger */}
          <div className="flex items-center gap-3">
            {/* Role switcher — desktop only */}
            <div className="hidden md:block">{roleSwitcher}</div>

            {/* Mobile hamburger */}
            <button
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — nav links + role switcher */}
      {isMobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 border-t pt-3">
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Switch User
              </p>
              {roleSwitcher}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
