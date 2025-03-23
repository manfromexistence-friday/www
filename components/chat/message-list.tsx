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
    
    // Instead of trying to coordinate transitions, use a hybrid approach
    // This will explicitly manage multiple states
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
    
    // Handle thinking indicator state changes
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
        
        // PHASE 1: Show thinking indicator
        if (isThinking && !thinkingVisible) {
            // Immediately make the thinking indicator visible but not animated in
            setThinkingVisible(true)
            // After a tiny delay, animate it in (this ensures the DOM element exists first)
            thinkingTransitionTimer.current = setTimeout(() => {
                setThinkingAnimatedIn(true)
            }, 16) // One frame delay
        } 
        
        // PHASE 2: Hide thinking indicator
        else if (!isThinking && thinkingVisible) {
            // First animate it out
            setThinkingAnimatedIn(false)
            
            // After animation completes, remove from DOM
            thinkingTransitionTimer.current = setTimeout(() => {
                setThinkingVisible(false)
                
                // If thinking just stopped (wasThinking=true), update messages after a delay
                if (wasThinking.current) {
                    messageUpdateTimer.current = setTimeout(() => {
                        setLatestMessages([...messagesList])
                    }, 100) // Short delay to prevent visual overlap
                }
            }, 400) // Match with animation duration
        }
        
        // PHASE 3: Update messages during thinking
        else if (isThinking) {
            // While thinking, always keep messages in sync
            setLatestMessages([...messagesList])
        }
        
        // PHASE 4: Update messages in normal state (not transitioning from thinking)
        else if (!wasThinking.current && !isThinking) {
            // Normal updates - just sync messages
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
            // For best results, scroll immediately then again after a delay
            scrollToBottom()
            
            // Multiple timeouts to ensure scroll after content renders
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
            className="relative h-full flex-1 overflow-y-auto px-1 pb-32 pt-16 md:pb-14"
            style={{ scrollBehavior: 'smooth' }}
        >
            <div className="w-full space-y-3 md:px-4 lg:mx-auto lg:w-[90%] lg:px-0 xl:w-1/2">
                {/* Render controlled message list - completely separate from thinking indicator */}
                {latestMessages.map((message, index) => (
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
            
            {/* ⚠️ CRITICAL CHANGE: Thinking indicator is now outside message flow, absolutely positioned */}
            {thinkingVisible && (
                <div 
                    className={cn(
                        "fixed z-10 bottom-36 left-1/2 transform -translate-x-1/2 w-full max-w-[90%] xl:max-w-[50%] transition-all duration-400",
                        thinkingAnimatedIn ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden={!isThinking}
                >
                    <div className="flex items-start gap-2 bg-background border rounded-xl shadow-md p-2">
                        <div className="bg-background flex min-h-10 min-w-10 items-center justify-center rounded-full border">
                            <Sparkles className="size-4 animate-pulse" />
                        </div>
                        <div className="bg-background text-foreground relative p-3 font-mono text-sm">
                            <AnimatedGradientText text="AI is thinking..." />
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll button - made larger and more visible */}
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