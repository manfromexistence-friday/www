import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from "react"
import { Message } from "@/types/chat"
import { ChatMessage } from "@/components/chat/chat-message"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MessageListProps {
  chatId: string
  messages: Message[]
  messagesEndRef: React.RefObject<HTMLDivElement>
  isThinking?: boolean
}

export function MessageList({
  chatId,
  messages,
  messagesEndRef,
  isThinking
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Display state machine: each state is explicit about what's showing
  type DisplayState = 'normal' | 'showing-thinking' | 'hiding-thinking' | 'showing-response'
  const [displayState, setDisplayState] = useState<DisplayState>('normal')
  
  // The messages we're actually rendering
  const [visibleMessages, setVisibleMessages] = useState<Message[]>(messages)
  
  // Keep track of the pending AI response when we're hiding the thinking indicator
  const pendingResponseRef = useRef<Message[]>([])
  
  // Timer references
  const hideThinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showResponseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Whether the thinking indicator is visible
  const thinkingVisible = displayState === 'showing-thinking'

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight + 1000
      setShowScrollButton(false)
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const nearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!nearBottom)
    }
  }, [])

  // Clear any active timers
  const clearTimers = useCallback(() => {
    if (hideThinkingTimer.current) {
      clearTimeout(hideThinkingTimer.current)
      hideThinkingTimer.current = null
    }
    if (showResponseTimer.current) {
      clearTimeout(showResponseTimer.current)
      showResponseTimer.current = null
    }
  }, [])

  // Handle state transitions based on isThinking changes
  useEffect(() => {
    // First, clear any pending timers
    clearTimers()
    
    if (isThinking) {
      console.log("AI is thinking - showing indicator")
      // When thinking starts, show the thinking indicator immediately
      setVisibleMessages([...messages]) // Update with latest messages (including user message)
      setDisplayState('showing-thinking')
    } else {
      // If we were previously thinking and now we're not
      if (displayState === 'showing-thinking') {
        console.log("AI stopped thinking - starting removal sequence")
        // Save the latest messages (AI response) for later
        pendingResponseRef.current = [...messages]
        
        // First transition: hide the thinking indicator
        setDisplayState('hiding-thinking')
        
        // After a delay, remove it completely
        hideThinkingTimer.current = setTimeout(() => {
          console.log("Thinking indicator removed, now showing response")
          // Now transition to showing the response
          setDisplayState('showing-response')
          
          // After another delay to ensure DOM updates, show the AI response
          showResponseTimer.current = setTimeout(() => {
            console.log("Showing AI response")
            setVisibleMessages([...pendingResponseRef.current])
            setDisplayState('normal')
          }, 200)
        }, 600) // Longer delay to ensure indicator has time to animate out
      } else {
        // Normal updates (not during thinking transitions)
        setVisibleMessages([...messages])
        setDisplayState('normal')
      }
    }
    
    return clearTimers
  }, [isThinking, displayState, messages, clearTimers])

  // Re-scroll on message changes
  useLayoutEffect(() => {
    scrollToBottom()
  }, [visibleMessages, scrollToBottom])

  // Watch for container scrolling
  useEffect(() => {
    const ref = containerRef.current
    if (!ref) return
    ref.addEventListener("scroll", handleScroll)
    return () => ref.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Scroll on resize
  useEffect(() => {
    const handleResize = () => setTimeout(scrollToBottom, 100)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [scrollToBottom])

  // Add the thinking indicator if needed
  const messagesToRender: Message[] = thinkingVisible
    ? [
        ...visibleMessages,
        {
          id: "thinking-indicator",
          content: "thinking",
          role: "assistant",
          timestamp: Date.now().toString(),
        }
      ]
    : visibleMessages

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-1 overflow-y-auto px-1 pb-32 pt-16 md:pb-14"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="w-full space-y-3 md:px-4 lg:mx-auto lg:w-[90%] lg:px-0 xl:w-1/2">
        {messagesToRender.map((message, index) => (
          <ChatMessage
            key={`${message.id || index}-${message.timestamp}`}
            message={message}
            chatId={chatId}
            index={index}
          />
        ))}

        <div ref={messagesEndRef} className="h-20 w-full" />
      </div>

      <Button
        onClick={scrollToBottom}
        className={cn(
          "fixed bottom-48 right-4 z-[1001] size-12 rounded-full p-0 shadow-lg transition-all duration-300 md:bottom-36 md:right-[3%] lg:bottom-[135px] lg:right-[2.5%] xl:bottom-36 xl:right-[24.5%]",
          showScrollButton ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
        )}
        size="icon"
        variant="outline"
      >
        <ChevronDown className="size-6" />
      </Button>
    </div>
  )
}