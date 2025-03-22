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
    
    // Use a ref to track the previous thinking state to help with debugging
    const prevThinkingRef = React.useRef(isThinking)
    const prevMessagesLengthRef = React.useRef(messagesList.length)
    
    // Add delay to hide the thinking indicator for smoother transitions
    const [delayedThinking, setDelayedThinking] = React.useState(isThinking || false)
    
    // Update thinking state with delay on hiding (more stable UI)
    React.useEffect(() => {
        // If previous state was different, log the change
        if (prevThinkingRef.current !== isThinking) {
            console.log(`Thinking state changed from ${prevThinkingRef.current} to ${isThinking}`)
            prevThinkingRef.current = isThinking
        }
        
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
    
    // More robust scrollToBottom function
    const scrollToBottom = React.useCallback((force = false) => {
        console.log("Attempting to scroll to bottom");
        
        // 1. Find all potential scroll containers
        const scrollContainers = [
            scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]'), // Radix ScrollArea
            scrollAreaRef.current, // The ScrollArea itself
            document.querySelector('.ScrollArea-viewport'), // Alternative Radix selector
            document.querySelector('[data-radix-scroll-area-viewport]'), // Generic Radix selector
            document.scrollingElement, // Document scrolling element
            document.documentElement, // HTML element
            document.body // Body element
        ].filter(Boolean) as Element[];
        
        // If we found scroll containers, try to scroll them all
        if (scrollContainers.length > 0) {
            console.log(`Found ${scrollContainers.length} potential scroll containers`);
            
            // Try to scroll each container
            scrollContainers.forEach(container => {
                try {
                    container.scrollTop = container.scrollHeight;
                    console.log("Applied scrollTop to container:", container);
                } catch (e) {
                    console.error("Failed to scroll container:", e);
                }
            });
        }
        
        // Also try scrollIntoView as a fallback
        if (messagesEndRef.current) {
            try {
                messagesEndRef.current.scrollIntoView({ block: "end", behavior: "smooth" });
                console.log("Applied scrollIntoView to messagesEndRef");
            } catch (e) {
                console.error("Failed to scrollIntoView:", e);
            }
        }
        
        // Hide the scroll button
        setShowScrollButton(false);
    }, [messagesEndRef]);
    
    // Track scroll position to show/hide scroll button
    const handleScroll = React.useCallback(() => {
        const scrollContainers = [
            scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
            scrollAreaRef.current,
            document.querySelector('.ScrollArea-viewport'),
            document.querySelector('[data-radix-scroll-area-viewport]')
        ].filter(Boolean) as Element[];
        
        let isAtBottom = true;
        
        // Check if any container is not at the bottom
        for (const container of scrollContainers) {
            const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            if (scrollBottom > 100) {
                isAtBottom = false;
                break;
            }
        }
        
        setShowScrollButton(!isAtBottom);
    }, []);
    
    // Add scroll event listeners to all potential containers
    React.useEffect(() => {
        const scrollContainers = [
            scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
            scrollAreaRef.current,
            document.querySelector('.ScrollArea-viewport'),
            document.querySelector('[data-radix-scroll-area-viewport]')
        ].filter(Boolean) as Element[];
        
        scrollContainers.forEach(container => {
            container.addEventListener('scroll', handleScroll);
        });
        
        return () => {
            scrollContainers.forEach(container => {
                container.removeEventListener('scroll', handleScroll);
            });
        };
    }, [handleScroll]);
    
    // Aggressive scroll on mount and when dependencies change
    React.useEffect(() => {
        // Calculate if messages were added
        const messagesAdded = messagesList.length > prevMessagesLengthRef.current;
        prevMessagesLengthRef.current = messagesList.length;
        
        // Scroll with a small delay to ensure content is rendered
        const timeoutId = setTimeout(() => {
            scrollToBottom(messagesAdded);
        }, 100);
        
        // Scroll again after a longer delay (for images or slow rendering content)
        const secondTimeoutId = setTimeout(() => {
            scrollToBottom(false);
        }, 500);
        
        return () => {
            clearTimeout(timeoutId);
            clearTimeout(secondTimeoutId);
        };
    }, [messagesList.length, delayedThinking, scrollToBottom]);
    
    // Additional scroll on window resize (helps with keyboard appearance)
    React.useEffect(() => {
        const handleResize = () => {
            // Delay to let the keyboard animation complete
            setTimeout(() => scrollToBottom(true), 300);
        };
        
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [scrollToBottom]);

    return (
        <ScrollArea 
            ref={scrollAreaRef} 
            className="z-10 h-full flex-1 pt-12"
            onScrollCapture={handleScroll}
        >
            <div className="w-full space-y-2.5 px-2 pt-3.5 lg:mx-auto lg:w-[90%] lg:px-0 xl:w-1/2">
                {messagesList.map((message, index) => (
                    <ChatMessage
                        key={`${message.id || index}-${message.timestamp}`}
                        message={message}
                        chatId={chatId}
                        index={index}
                    />
                ))}
                
                {/* Use delayedThinking for smoother transitions */}
                {delayedThinking && (
                    <div className="mt-2 flex w-full justify-start transition-opacity duration-300 ease-in-out">
                        <div className="flex items-start gap-2">
                            <div className="flex min-h-10 min-w-10 items-center justify-center rounded-full border bg-background">
                                <Sparkles className="size-4 animate-pulse" />
                            </div>
                            <div className="hover:bg-primary-foreground bg-background text-foreground relative rounded-xl rounded-tl-none p-3 font-mono text-sm">
                                <AnimatedGradientText text="AI is thinking..." />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* This element is used for scrolling to bottom */}
                <div ref={messagesEndRef} id="messages-end" className="h-4 w-full" />
            </div>
            {/* Extra space at bottom to prevent content being hidden behind input */}
            <div className="h-[175px] w-full md:h-[115px]"></div>
            {/* Scroll to bottom button - more visible and better positioned */}
            <Button
                onClick={() => scrollToBottom(true)}
                className={cn(
                    "fixed bottom-48 right-4 z-[1001] h-10 w-10 rounded-full p-0 shadow-md transition-all duration-200 md:bottom-28",
                    showScrollButton ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                )}
                size="icon"
                variant="secondary"
            >
                <ChevronDown className="h-5 w-5" />
            </Button>
        </ScrollArea>
    )
}