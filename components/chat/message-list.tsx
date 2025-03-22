import React from "react"
import { Message } from "@/types/chat"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat/chat-message"
import { Sparkles, Loader2 } from "lucide-react"
import AnimatedGradientText from "@/components/ui/animated-gradient-text"

interface MessageListProps {
    chatId: string
    messages: Message[];
    messagesEndRef: React.RefObject<HTMLDivElement>
    isThinking?: boolean
}

export function MessageList({ chatId, messages, messagesEndRef, isThinking }: MessageListProps) {
    // Use the messages passed from the parent directly instead of fetching them again
    // Ensure messages is always an array
    const messagesList = Array.isArray(messages) ? messages : []

    // Improved scroll effect with extra padding
    React.useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                // Get the parent scroll container
                const scrollContainer = messagesEndRef.current.parentElement
                if (scrollContainer) {
                    // Add extra padding to ensure message is fully visible
                    scrollContainer.scrollTop = scrollContainer.scrollHeight + 20
                }
                
                messagesEndRef.current.scrollIntoView({ 
                    behavior: "smooth",
                    block: "end"
                })
            }
        }
        
        // Immediate scroll for user messages, delayed for AI responses
        const timeoutId = setTimeout(scrollToBottom, isThinking ? 200 : 0)
        return () => clearTimeout(timeoutId)
    }, [messagesList.length, isThinking, messagesEndRef])

    // Remove the delayed thinking state
    const [showThinking, setShowThinking] = React.useState(false)

    React.useEffect(() => {
        setShowThinking(isThinking ?? false)
    }, [isThinking])

    return (
        <ScrollArea className="z-10 max-h-full flex-1 pt-12">
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
        </ScrollArea>
    )
}