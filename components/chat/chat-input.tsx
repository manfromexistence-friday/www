import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChatState } from '@/types/chat'
import { Textarea } from '@/components/ui/textarea'
import { AnimatedPlaceholder } from '@/components/chat/animated-placeholder'
import { InputActions } from '@/components/chat/input-actions'
import { ImagePreview } from '@/components/chat/image-preview'

interface ChatInputProps {
  className?: string
  value: string
  chatState: ChatState
  showSearch: boolean
  showResearch: boolean
  imagePreview: string | null
  inputHeight: number
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onSubmit: () => void
  onChange: (value: string) => void
  onHeightChange: () => void
  onImageChange: (file: File | null) => void
  onSearchToggle: () => void
  onResearchToggle: () => void
  setChatState: (state: React.SetStateAction<ChatState>) => void
  selectedAI: string
  onAIChange: (model: string) => void
}

export function ChatInput({
  className,
  value,
  chatState,
  showSearch,
  showResearch,
  imagePreview,
  inputHeight,
  textareaRef,
  onSubmit,
  onChange,
  onHeightChange,
  onImageChange,
  onSearchToggle,
  onResearchToggle,
  selectedAI,
  onAIChange,
}: ChatInputProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false)
  const [initialHeight, setInitialHeight] = React.useState(0)
  
  // Detect mobile keyboard
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setInitialHeight(window.innerHeight)
      
      const handleResize = () => {
        // If window height reduced significantly (by at least 25%), assume keyboard is open
        const heightDifference = initialHeight - window.innerHeight
        const heightChangePercentage = (heightDifference / initialHeight) * 100
        
        if (heightChangePercentage > 25) {
          setIsKeyboardVisible(true)
        } else {
          setIsKeyboardVisible(false)
        }
      }
      
      // Focus/blur detection for additional reliability
      const handleFocus = (e: FocusEvent) => {
        const target = e.target as HTMLElement
        if (target.id === 'ai-input') {
          setTimeout(() => setIsKeyboardVisible(true), 100)
        }
      }
      
      const handleBlur = () => {
        setTimeout(() => setIsKeyboardVisible(false), 100)
      }

      window.addEventListener('resize', handleResize)
      document.addEventListener('focusin', handleFocus)
      document.addEventListener('focusout', handleBlur)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        document.removeEventListener('focusin', handleFocus)
        document.removeEventListener('focusout', handleBlur)
      }
    }
  }, [initialHeight])
  
  // Dynamically apply positioning classes based on keyboard visibility
  const positioningClasses = React.useMemo(() => {
    return isKeyboardVisible
      ? "!fixed !bottom-2" // Position at bottom-1 when keyboard is visible
      : "" // Default positioning
  }, [isKeyboardVisible])

  return (
    <div className={cn('rounded-2xl border shadow-xl lg:w-1/2 w-[95%]', positioningClasses, className)}>
      {imagePreview && (
        <ImagePreview
          imagePreview={imagePreview}
          inputHeight={inputHeight}
          onRemove={() => onImageChange(null)}
        />
      )}
      <div className="bg-primary-foreground relative flex flex-col rounded-2xl">
        <div className="relative">
          <Textarea
            id="ai-input"
            value={value}
            placeholder=""
            disabled={chatState.isLoading}
            className={cn(
              'w-full resize-none rounded-2xl rounded-b-none border-b px-4 py-3 leading-[1.2] focus-visible:ring-0',
              chatState.isLoading && 'opacity-50'
            )}
            ref={textareaRef}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey && !chatState.isLoading) {
                e.preventDefault()
                if (value.trim()) {
                  onSubmit()
                }
              }
            }}
            onChange={(e) => {
              onChange(e.target.value)
              onHeightChange()
            }}
          />
          {!value && (
            <div className="absolute left-4 top-3">
              <AnimatedPlaceholder showResearch={showResearch} showSearch={showSearch} />
            </div>
          )}
        </div>
        <InputActions
          isLoading={chatState.isLoading}
          showSearch={showSearch}
          showResearch={showResearch}
          value={value}
          selectedAI={selectedAI}
          imagePreview={imagePreview}
          onSubmit={onSubmit}
          onSearchToggle={onSearchToggle}
          onResearchToggle={onResearchToggle}
          onImageUpload={(file: File | null) => onImageChange(file)}
          onAIChange={onAIChange}
        />
      </div>
    </div>
  )
}