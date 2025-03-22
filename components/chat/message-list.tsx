import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from "react"
import { Message } from "@/types/chat"
import { ChatMessage } from "@/components/chat/chat-message"
import { Sparkles, ChevronDown } from "lucide-react"
import AnimatedGradientText from "@/components/ui/animated-gradient-text"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MessageListProps {
    chatId: string
    messages: Message[];
    messagesEndRef: React.RefObject<HTMLDivElement>
    isThinking?: boolean
}

export function MessageList({ chatId, messages, messagesEndRef, isThinking }: MessageListProps) {
    // Use the messages passed from the parent directly
    const messagesList = Array.isArray(messages) ? messages : []
    const containerRef = useRef<HTMLDivElement>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const prevMessagesLengthRef = useRef(messagesList.length)
    
    // Use a ref to track the previous thinking state for smoother transitions
    const prevThinkingRef = useRef(isThinking)
    
    // Add delay to hide the thinking indicator for smoother transitions
    const [delayedThinking, setDelayedThinking] = useState(isThinking || false)
    
    // Handle the thinking state with delay on hiding
    useEffect(() => {
        if (isThinking) {
            // When thinking starts, show immediately
            setDelayedThinking(true)
        } else {
            // When thinking stops, delay hiding slightly
            const timeoutId = setTimeout(() => {
                setDelayedThinking(false)
            }, 500) // 500ms delay before hiding
            
            return () => clearTimeout(timeoutId)
        }
    }, [isThinking])
    
    // Simple scroll function that works with plain DOM
    const scrollToBottom = useCallback(() => {
        if (containerRef.current) {
            const scrollHeight = containerRef.current.scrollHeight
            containerRef.current.scrollTop = scrollHeight + 1000
            setShowScrollButton(false)
        }
    }, [])
    
    // Check if we need to show the scroll button
    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current
            const atBottom = scrollHeight - scrollTop - clientHeight < 100
            setShowScrollButton(!atBottom)
        }
    }, [])
    
    // Scroll on new messages or thinking state changes - 
    // useLayoutEffect happens before browser paint
    useLayoutEffect(() => {
        const messagesChanged = messagesList.length !== prevMessagesLengthRef.current
        prevMessagesLengthRef.current = messagesList.length
        
        if (messagesChanged || isThinking !== prevThinkingRef.current) {
            prevThinkingRef.current = isThinking
            
            // For best results, scroll immediately then again after a delay
            scrollToBottom()
            
            // Multiple timeouts to ensure scroll after content renders
            const timeouts = [10, 50, 100, 300, 500].map(delay => 
                setTimeout(scrollToBottom, delay)
            )
            
            return () => timeouts.forEach(clearTimeout)
        }
    }, [messagesList.length, isThinking, scrollToBottom])
    
    // Add event listener for scroll
    useEffect(() => {
        const current = containerRef.current
        if (current) {
            current.addEventListener('scroll', handleScroll)
            return () => current.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])
    
    // Special effect to scroll when window resizes (helps with keyboard)
    useEffect(() => {
        const handleResize = () => {
            setTimeout(scrollToBottom, 100)
        }
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [scrollToBottom])
    
    // Force initial scroll after mounting
    useEffect(() => {
        scrollToBottom()
    }, [scrollToBottom])

    return (
        <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto h-full pt-16 pb-32 md:pb-14 px-1 relative"
            style={{ scrollBehavior: 'smooth' }}
        >
            <div className="w-full space-y-3 lg:mx-auto lg:w-[90%] lg:px-0 xl:w-1/2 md:px-4">
                {messagesList.map((message, index) => (
                    <ChatMessage
                        key={`${message.id || index}-${message.timestamp}`}
                        message={message}
                        chatId={chatId}
                        index={index}
                    />
                ))}
                
                {/* Thinking indicator */}
                {delayedThinking && (
                    <div className="mt-2 flex w-full justify-start transition-all duration-300">
                        <div className="flex items-start gap-2">
                            <div className="flex min-h-10 min-w-10 items-center justify-center rounded-full border bg-background">
                                <Sparkles className="size-4 animate-pulse" />
                            </div>
                            <div className="bg-background text-foreground relative rounded-xl rounded-tl-none p-3 font-mono text-sm shadow-sm">
                                <AnimatedGradientText text="AI is thinking..." />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* This element is used for scrolling to bottom */}
                <div ref={messagesEndRef} className="h-20 w-full"></div>
            </div>

            {/* Scroll button - made larger and more visible */}
            <Button
                onClick={scrollToBottom}
                className={cn(
                    "fixed bottom-48 md:bottom-36 lg:bottom-[135px] md:right-[3%] xl:right-[24.5%] xl:bottom-36 lg:right-[2.5%] right-4 z-[1001] h-12 w-12 rounded-full p-0 shadow-lg transition-all duration-300",
                    showScrollButton ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                )}
                size="icon"
                variant="outline"
            >
                <ChevronDown className="h-6 w-6" />
            </Button>
        </div>
    )
}