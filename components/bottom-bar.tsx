"use client"

import Link from "next/link"
import { Home, Sparkles, CircleSlash2, LibraryBig, Ellipsis } from "lucide-react"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"
import { useCategorySidebar } from "@/components/sidebar/category-sidebar"
import { useSubCategorySidebar } from "@/components/sidebar/sub-category-sidebar"

export function BottomBar() {
  const params = useParams()
  const { categorySidebarState } = useCategorySidebar()
  const { subCategorySidebarState } = useSubCategorySidebar()

  const navItems = [
    {
      href: "/home",
      icon: Home,
      label: "Home"
    },
    {
      href: "/automations",
      icon: Sparkles,
      label: "Automations"  
    },
    {
      href: "/variants",
      icon: CircleSlash2,
      label: "Variants"
    },
    {
      href: "/library",
      icon: LibraryBig,
      label: "Library"
    },
    {
      href: "/more",
      icon: Ellipsis,
      label: "More"
    }
  ]

  return (
    <nav className={cn(
      "bg-background fixed bottom-0 z-50 flex h-12 items-center justify-around border-t md:hidden lg:hidden",
      "w-full", // Always full width on mobile
    )}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={{ pathname: item.href }}
          className={cn(
            "flex flex-col items-center gap-1",
            params?.slug === item.href.replace("/", "") 
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className="size-4" />
          <span className="text-[8.5px]">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}