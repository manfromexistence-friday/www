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
    
    // State for managing thinking indicator and message display
    const [thinkingVisible, setThinkingVisible] = useState(isThinking || false)
    const [thinkingAnimatedIn, setThinkingAnimatedIn] = useState(isThinking || false)
    const [latestMessages, setLatestMessages] = useState(messagesList)
    
    // Track when thinking status changes
    const wasThinking = useRef(isThinking)
    const thinkingTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const messageUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    
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
    
    // Critical effect: Handle thinking indicator and message sequencing
    useEffect(() => {
        // Clean up any existing timers to prevent race conditions
        if (thinkingTransitionTimer.current) {
            clearTimeout(thinkingTransitionTimer.current)
            thinkingTransitionTimer.current = null
        }
        
        if (messageUpdateTimer.current) {
            clearTimeout(messageUpdateTimer.current)
            messageUpdateTimer.current = null
        }
        
        // PHASE 1: Show thinking indicator when AI starts thinking
        if (isThinking && !thinkingVisible) {
            console.log("AI started thinking, showing indicator")
            setThinkingVisible(true)
            thinkingTransitionTimer.current = setTimeout(() => {
                setThinkingAnimatedIn(true)
            }, 16) // One frame delay
        } 
        
        // PHASE 2: AI stopped thinking - carefully sequence hiding indicator then showing response
        else if (!isThinking && thinkingVisible) {
            console.log("AI stopped thinking, hiding indicator")
            
            // 1. First fade out the indicator
            setThinkingAnimatedIn(false)
            
            // 2. After fade completes, remove indicator completely
            thinkingTransitionTimer.current = setTimeout(() => {
                setThinkingVisible(false)
                
                // 3. Only after indicator is fully removed, update messages with AI response
                messageUpdateTimer.current = setTimeout(() => {
                    console.log("Showing new messages after indicator removed")
                    setLatestMessages([...messagesList])
                }, 150) // Delay before showing response
                
            }, 500) // Ensure fadeout animation completes
        }
        
        // PHASE 3: Update messages while thinking (for streaming responses)
        else if (isThinking && thinkingVisible) {
            setLatestMessages([...messagesList])
        }
        
        // PHASE 4: Normal updates when not in transition
        else if (!wasThinking.current && !isThinking) {
            setLatestMessages([...messagesList])
        }
        
        // Update wasThinking reference for the next cycle
        wasThinking.current = isThinking
        
        // Clean up timers on unmount or before next effect
        return () => {
            if (thinkingTransitionTimer.current) clearTimeout(thinkingTransitionTimer.current)
            if (messageUpdateTimer.current) clearTimeout(messageUpdateTimer.current)
        }
    }, [isThinking, messagesList, thinkingVisible])
    
    // Scroll on new messages
    useLayoutEffect(() => {
        const messagesChanged = latestMessages.length !== prevMessagesLengthRef.current
        prevMessagesLengthRef.current = latestMessages.length
        
        if (messagesChanged) {
            scrollToBottom()
            const timeouts = [10, 50, 100, 300, 500].map(delay => 
                setTimeout(scrollToBottom, delay)
            )
            return () => timeouts.forEach(clearTimeout)
        }
    }, [latestMessages.length, scrollToBottom])
    
    // Add event listener for scroll
    useEffect(() => {
        const current = containerRef.current
        if (current) {
            current.addEventListener('scroll', handleScroll)
            return () => current.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])
    
    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            setTimeout(scrollToBottom, 100)
        }
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [scrollToBottom])
    
    // Initial scroll
    useEffect(() => {
        scrollToBottom()
    }, [scrollToBottom])

    return (
        <div 
            ref={containerRef}
            className="relative h-full flex-1 overflow-y-auto px-1 pb-32 pt-16 md:pb-14"
            style={{ scrollBehavior: 'smooth' }}
        >
            <div className="w-full space-y-3 md:px-4 lg:mx-auto lg:w-[90%] lg:px-0 xl:w-1/2">
                {/* Render message list */}
                {latestMessages.map((message, index) => (
                    <ChatMessage
                        key={`${message.id || index}-${message.timestamp}`}
                        message={message}
                        chatId={chatId}
                        index={index}
                    />
                ))}
                
                {/* Thinking indicator - back in the message flow */}
                {thinkingVisible && (
                    <div 
                        className={cn(
                            "mt-2 flex w-full justify-start transition-all duration-400",
                            thinkingAnimatedIn ? "opacity-100" : "opacity-0"
                        )}
                        aria-hidden={!isThinking}
                    >
                        <div className="flex items-start gap-2">
                            <div className="bg-background flex min-h-10 min-w-10 items-center justify-center rounded-full border">
                                <Sparkles className="size-4 animate-pulse" />
                            </div>
                            <div className="bg-background text-foreground relative rounded-xl rounded-tl-none border p-3 font-mono text-sm">
                                <AnimatedGradientText text="AI is thinking..." />
                            </div>
                        </div>
                    </div>
                )}
                
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