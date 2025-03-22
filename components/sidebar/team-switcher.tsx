"use client"

import * as React from "react"
import type { SVGProps } from "react"
import { PanelRight } from "lucide-react"
import { motion } from "framer-motion"
import { startOfWeek, addDays, isSameDay } from "date-fns"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Orb,
  oceanDepthsPreset,
  galaxyPreset,
  caribeanPreset,
  cherryBlossomPreset,
  emeraldPreset,
  multiColorPreset,
  goldenGlowPreset,
  volcanicPreset
} from "@/components/friday/index"
import Friday from "../friday/friday"

export const LogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    height="1em"
    xmlns="http://www.w3.org/2000/svg"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="1em"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M9.50321 5.5H13.2532C13.3123 5.5 13.3704 5.5041 13.4273 5.51203L9.51242 9.42692C9.50424 9.36912 9.5 9.31006 9.5 9.25L9.5 5.5L8 5.5L8 9.25C8 10.7688 9.23122 12 10.75 12H14.5V10.5L10.75 10.5C10.6899 10.5 10.6309 10.4958 10.5731 10.4876L14.4904 6.57028C14.4988 6.62897 14.5032 6.68897 14.5032 6.75V10.5H16.0032V6.75C16.0032 5.23122 14.772 4 13.2532 4H9.50321V5.5ZM0 5V5.00405L5.12525 11.5307C5.74119 12.3151 7.00106 11.8795 7.00106 10.8822V5H5.50106V9.58056L1.90404 5H0Z"
      fill="white"
      fillRule="evenodd"
    />
  </svg>
)

export function TeamSwitcher({ }: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const { toggleSidebar, state } = useSidebar()
  const [currentPreset, setCurrentPreset] = React.useState(multiColorPreset)

  // Array of all presets
  const presets = [
    multiColorPreset,
    oceanDepthsPreset,
    galaxyPreset,
    caribeanPreset,
    cherryBlossomPreset,
    emeraldPreset,
    goldenGlowPreset,
    volcanicPreset
  ]

  // Get preset based on day of week
  const getPresetForDate = (date: Date) => {
    const weekStart = startOfWeek(date)
    const dayIndex = presets.length - 1

    for (let i = 0; i < presets.length; i++) {
      const currentDay = addDays(weekStart, i)
      if (isSameDay(date, currentDay)) {
        return presets[i]
      }
    }

    return presets[dayIndex]
  }

  // Handle drag end to change preset
  const handleDragEnd = (event: any, info: any) => {
    const { offset } = info
    const date = new Date()

    // Change preset based on drag direction
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal drag
      const newIndex = offset.x > 0 ?
        (presets.indexOf(currentPreset) + 1) % presets.length :
        (presets.indexOf(currentPreset) - 1 + presets.length) % presets.length
      setCurrentPreset(presets[newIndex])
    } else {
      // Vertical drag - use date-based preset
      setCurrentPreset(getPresetForDate(date))
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="peer/menu-button ring-sidebar-ring data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground flex h-8 w-full items-center gap-2 rounded-md p-2 !px-0 text-left text-sm outline-none transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0">
          {/* <motion.div
            className="text-sidebar-primary-foreground flex aspect-square min-h-8 min-w-8 items-center justify-center rounded-lg cursor-pointer"
            drag
            dragElastic={0.05} // Reduced elastic feel even more
            dragConstraints={{
              top: 0, // Reduced constraints
              left: 0,
              right: 0,
              bottom: 0
            }}
            dragMomentum={false} // Disable momentum for precise return
            whileDrag={{ scale: 1.05 }} // Reduced scale effect
            whileTap={{ scale: 1.2 }}
            onClick={() => {
              const nextIndex = (presets.indexOf(currentPreset) + 1) % presets.length
              setCurrentPreset(presets[nextIndex])
            }}
            onDragEnd={handleDragEnd}
            transition={{
              type: "spring",
              stiffness: 2000, // Increased stiffness significantly
              damping: 50, // Increased damping
              mass: 0.2, // Reduced mass further
              restDelta: 0.0001, // Even smaller rest delta
              restSpeed: 0.001 // Added rest speed for precise stopping
            }}
          >
            <Orb className="" baseOrbSize={25} baseShapeSize={21} {...currentPreset} />
          </motion.div> */}
          <Friday />
          {state === "expanded" ? (<PanelRight
            onClick={() => {
              toggleSidebar()
            }}
            className="ml-auto"
          />) : null}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
