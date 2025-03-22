"use client"

import { useCategorySidebar } from "@/components/sidebar/category-sidebar"
import { useSubCategorySidebar } from "@/components/sidebar/sub-category-sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MainProps {
    children: React.ReactNode
}

export function Main({ children }: MainProps) {
    const { categorySidebarState } = useCategorySidebar()
    const { subCategorySidebarState } = useSubCategorySidebar()
    const { state: leftSidebarState } = useSidebar()

    return (
        <ScrollArea className={cn(
            "flex flex-col transition-all duration-200 ease-linear",
            // Add padding for fixed headers
            "pt-12 pb-12 md:pb-0", // Account for header height (12) and bottom bar on mobile
            // Height calculations
            "h-screen", // Full height
            // Width adjustments - always full width
            "w-full", 
            // Left margin based on sidebar state
            leftSidebarState === "expanded" ? "md:ml-16" : "md:ml-0",
            // Right margin based on sidebar states
            categorySidebarState === "expanded" ? "md:mr-64" : "",
            subCategorySidebarState === "expanded" ? "md:mr-64" : "",
            // If both are expanded, adjust accordingly
            categorySidebarState === "expanded" && subCategorySidebarState === "expanded" ? "md:mr-128" : "",
            // Enable scrolling
            "overflow-y-auto no-scrollbar", // Hide scrollbar but keep functionality
        )}>
            {children}
        </ScrollArea>
    )
}