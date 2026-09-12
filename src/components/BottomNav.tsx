"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusSquare,
  Clapperboard,
  User,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function BottomNav() {
  const pathname = usePathname();
  const { user , isLoaded} = useUser();

  if (!isLoaded) return null;
  if (!user) return null;

  const emailPrefix = user.emailAddresses[0]?.emailAddress.split("@")[0] ?? "profile";
  const profileUserName = user.username ?? emailPrefix;

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Search",
      href: "/search",
      icon: Search,
    },
    {
      name: "Create",
      href: "/create",
      icon: PlusSquare,
    },
    {
      name: "Reels",
      href: "/reels",
      icon: Clapperboard,
    },
    {
      name: "Profile",
      href: `/profile/${profileUserName}`,
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex h-full flex-1 flex-col items-center justify-center gap-1 transition ${
                isActive
                  ? "text-black dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                fill={
                  isActive && item.name === "Home"
                    ? "currentColor"
                    : "none"
                }
              />

              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}