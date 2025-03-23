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
    const [latestMessages, setLatestMessages] = useState(messagesList)
    
    // Track when thinking status changes
    const wasThinking = useRef(isThinking)
    const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    
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
    
    // Effect to handle thinking state and message updates
    useEffect(() => {
        // Clear any existing timers to prevent race conditions
        if (responseTimer.current) {
            clearTimeout(responseTimer.current)
            responseTimer.current = null
        }
        
        // Show thinking indicator immediately when AI starts thinking
        if (isThinking) {
            setThinkingVisible(true)
        } 
        
        // When AI stops thinking, hide the indicator before showing the response
        else if (wasThinking.current && !isThinking) {
            setThinkingVisible(false)
            
            // Wait for the indicator to be removed before showing the response
            responseTimer.current = setTimeout(() => {
                setLatestMessages([...messagesList])
            }, 500) // Delay to ensure indicator is fully removed
        } 
        
        // Normal updates when not in transition
        else {
            setLatestMessages([...messagesList])
        }
        
        wasThinking.current = isThinking
        
        return () => {
            if (responseTimer.current) clearTimeout(responseTimer.current)
        }
    }, [isThinking, messagesList])
    
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
                        className="mt-2 flex w-full justify-start transition-opacity duration-500"
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