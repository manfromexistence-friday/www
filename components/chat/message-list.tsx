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
  const messagesList = Array.isArray(messages) ? messages : []
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const prevMessagesLengthRef = useRef(messagesList.length)

  // Track final messages to show (without the thinking state).
  const [latestMessages, setLatestMessages] = useState<Message[]>(messagesList)

  // Track displayed "thinking" state.
  const [thinkingVisible, setThinkingVisible] = useState(isThinking || false)

  const wasThinking = useRef(isThinking)
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight + 1000
      setShowScrollButton(false)
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const atBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!atBottom)
    }
  }, [])

  // Show/hide thinking logic
  useEffect(() => {
    if (responseTimer.current) {
      clearTimeout(responseTimer.current)
      responseTimer.current = null
    }

    if (isThinking) {
      // AI started thinking
      setThinkingVisible(true)
    } else if (wasThinking.current && !isThinking) {
      // AI just finished thinking - remove indicator, then show response
      setThinkingVisible(false)
      responseTimer.current = setTimeout(() => {
        setLatestMessages([...messagesList])
      }, 500)
    } else {
      // Normal updates (user message, etc.)
      setLatestMessages([...messagesList])
    }

    wasThinking.current = isThinking

    return () => {
      if (responseTimer.current) clearTimeout(responseTimer.current)
    }
  }, [isThinking, messagesList])

  // Scroll when messages change
  useLayoutEffect(() => {
    const messagesChanged = latestMessages.length !== prevMessagesLengthRef.current
    prevMessagesLengthRef.current = latestMessages.length

    if (messagesChanged) {
      scrollToBottom()
      const timeouts = [10, 50, 100, 300, 500].map((delay) =>
        setTimeout(scrollToBottom, delay)
      )
      return () => timeouts.forEach(clearTimeout)
    }
  }, [latestMessages, scrollToBottom])

  // Scroll listener
  useEffect(() => {
    const current = containerRef.current
    if (!current) return
    current.addEventListener("scroll", handleScroll)
    return () => current.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Scroll on resize
  useEffect(() => {
    const handleResize = () => setTimeout(scrollToBottom, 100)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [scrollToBottom])

  // Initial scroll
  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom])

  // If thinking is visible, display a fake "assistant message" at the end
  const visibleMessages: Message[] = thinkingVisible
    ? [
        ...latestMessages,
        {
          id: "thinking-indicator",
          content: "thinking", // a placeholder we’ll interpret in chat-message
          role: "assistant",
          timestamp: Date.now().toString(),
        } as Message,
      ]
    : latestMessages

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-1 overflow-y-auto px-1 pb-32 pt-16 md:pb-14"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="w-full space-y-3 md:px-4 lg:mx-auto lg:w-[90%] lg:px-0 xl:w-1/2">
        {/* Render message list */}
        {visibleMessages.map((message, index) => (
          <ChatMessage
            key={`${message.id || index}-${message.timestamp}`}
            message={message}
            chatId={chatId}
            index={index}
          />
        ))}

        {/* This element is used for scrolling to bottom */}
        <div ref={messagesEndRef} className="h-20 w-full"></div>
      </div>

      {/* Scroll button */}
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