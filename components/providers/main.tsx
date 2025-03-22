'use client'

import { useCategorySidebar } from '@/components/sidebar/category-sidebar'
import { useSubCategorySidebar } from '@/components/sidebar/sub-category-sidebar'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MainProps {
  children: React.ReactNode
}

export function Main({ children }: MainProps) {
  const { categorySidebarState } = useCategorySidebar()
  const { subCategorySidebarState } = useSubCategorySidebar()
  const { state: leftSidebarState } = useSidebar()

  return (
    <ScrollArea
      className={cn(
        'flex flex-col transition-all duration-200 ease-linear pt-12 pb-12 md:pb-0 h-screen w-full overflow-y-auto no-scrollbar',
        categorySidebarState === 'expanded' && 'pr-64',
        subCategorySidebarState === 'expanded' && 'pr-64'
      )}
    >
      {children}
    </ScrollArea>
  )
}
