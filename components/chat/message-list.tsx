import React from "react"
import { Message } from "@/types/chat"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const [showScrollButton, setShowScrollButton] = React.useState(false)
    const [showThinking, setShowThinking] = React.useState(false)
    
    // Track if user has scrolled up
    const handleScroll = React.useCallback(() => {
        if (!scrollAreaRef.current) return
        
        // Get the scroll container (might be different on various devices)
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') || scrollAreaRef.current
        
        // Calculate if we're near the bottom (within 100px)
        const isNearBottom = 
            scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
            
        setShowScrollButton(!isNearBottom)
    }, [])
    
    // Enhanced scroll function that works across devices
    const scrollToBottom = React.useCallback((smooth = true) => {
        if (!messagesEndRef.current) return
        
        // Try different approaches for different scroll containers
        
        // 1. Try the scroll area viewport (Radix ScrollArea implementation)
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight
        }
        
        // 2. Try the scroll area itself
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
        
        // 3. Use scrollIntoView as fallback
        messagesEndRef.current.scrollIntoView({
            behavior: smooth ? "smooth" : "auto",
            block: "end"
        })
        
        // Hide the scroll button when we're at the bottom
        setShowScrollButton(false)
    }, [messagesEndRef])

    // Scroll on new messages or when thinking state changes
    React.useEffect(() => {
        const timeoutId = setTimeout(() => scrollToBottom(true), isThinking ? 200 : 0)
        return () => clearTimeout(timeoutId)
    }, [messagesList.length, isThinking, scrollToBottom])

    // Add scroll event listener
    React.useEffect(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') || scrollAreaRef.current
        
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll)
            return () => scrollContainer.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])

    // Update thinking state
    React.useEffect(() => {
        setShowThinking(isThinking ?? false)
    }, [isThinking])

    return (
        <ScrollArea ref={scrollAreaRef} className="z-10 max-h-full flex-1 pt-12">
            <div className="w-full space-y-2.5 px-2 pt-3.5 lg:mx-auto lg:w-[90%] lg:px-0 xl:w-1/2">
                {messagesList.map((message, index) => (
                    <ChatMessage
                        key={`${message.id || index}-${message.timestamp}`}
                        message={message}
                        chatId={chatId}
                        index={index}
                    />
                ))}
                {isThinking && (
                    <div className="mt-2 flex w-full justify-start">
                        <div className="flex items-start gap-2">
                            <div className="flex min-h-10 min-w-10 items-center justify-center rounded-full border">
                                <Sparkles className="size-4" />
                            </div>
                            <div className="hover:bg-primary-foreground text-muted-foreground relative rounded-xl rounded-tl-none border p-2 font-mono text-sm">
                                <AnimatedGradientText text="AI is thinking..." />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>
            <div className="h-[175px] w-full md:h-[115px]"></div>

            {/* Scroll to bottom button */}
            <Button
                onClick={() => scrollToBottom(true)}
                className={cn(
                    "fixed bottom-32 right-4 z-50 h-10 w-10 rounded-full p-0 shadow-md transition-all duration-200 md:bottom-24",
                    showScrollButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
                )}
                size="icon"
                variant="secondary"
            >
                <ChevronDown className="h-5 w-5" />
            </Button>
        </ScrollArea>
    )
}