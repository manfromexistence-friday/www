"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useAuth } from '@/contexts/auth-context'
import LoadingAnimation from '@/components/chat/loading-animation'
import { db } from "@/lib/firebase/config"
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore"
import { useEffect, useRef, useState, useCallback } from "react"
import { useCategorySidebar } from "@/components/sidebar/category-sidebar"
import { useSubCategorySidebar } from "@/components/sidebar/sub-category-sidebar"
import { aiService } from '@/lib/services/ai-service'
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea'
import { MessageList } from '@/components/chat/message-list'
import { ChatInput } from '@/components/chat/chat-input'
import { useQueryClient } from "@tanstack/react-query"
import type { Message } from "@/types/chat"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const MIN_HEIGHT = 48
const MAX_HEIGHT = 164

interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

type Params = {
    slug: string
}

export default function ChatPage() {
    const { user } = useAuth()
    const params = useParams<Params>() ?? { slug: '' }
    const [isValidating, setIsValidating] = useState(true)
    const queryClient = useQueryClient()
    const { categorySidebarState } = useCategorySidebar()
    const { subCategorySidebarState } = useSubCategorySidebar()
    const [value, setValue] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
    const [selectedAI, setSelectedAI] = useState("gemini-2.0-flash")
    const [chatData, setChatData] = useState<any>(null)
    
    // Get session ID from URL parameter
    const sessionId = params.slug
    
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: MIN_HEIGHT,
        maxHeight: MAX_HEIGHT,
    })

    const [inputHeight, setInputHeight] = useState(MIN_HEIGHT)
    const [showSearch, setShowSearch] = useState(false)
    const [showResearch, setShowReSearch] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    // Add chat state management - with a single source of truth
    const [chatState, setChatState] = useState<ChatState>({
        messages: [],
        isLoading: false,
        error: null,
    })

    // Set up Firestore listener for real-time updates
    useEffect(() => {
        if (!sessionId) return;
        
        console.log("Setting up Firestore listener for chat:", sessionId);
        
        const chatRef = doc(db, "chats", sessionId);
        const unsubscribe = onSnapshot(
            chatRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    console.log("Received chat data update:", data);
                    setChatData(data);
                    
                    // Update chat state with messages from Firestore
                    if (data?.messages) {
                        setChatState(prev => ({
                            ...prev,
                            messages: data.messages,
                            isLoading: false
                        }));
                    }
                }
            },
            (error) => {
                console.error("Error listening to chat updates:", error);
                setChatState(prev => ({
                    ...prev,
                    error: "Failed to receive message updates",
                    isLoading: false
                }));
                toast.error("Failed to receive message updates");
            }
        );
        
        // Load initial AI model from chat data
        const loadInitialData = async () => {
            try {
                const docSnap = await getDoc(chatRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data?.model) {
                        setSelectedAI(data.model);
                    }
                }
            } catch (error) {
                console.error("Error loading initial chat data:", error);
            }
        };
        
        loadInitialData();
        
        return () => unsubscribe();
    }, [sessionId]);

    // Handle auto-submit when coming from home page
    useEffect(() => {
        const shouldAutoSubmit = sessionStorage.getItem('autoSubmit') === 'true';
        const initialPrompt = sessionStorage.getItem('initialPrompt');
        const storedModel = sessionStorage.getItem('selectedAI');
        
        if (shouldAutoSubmit && initialPrompt && sessionId) {
            console.log("Auto-submitting initial prompt:", initialPrompt);
            
            // Clear the auto-submit flag immediately to prevent duplicate submissions
            sessionStorage.removeItem('autoSubmit');
            sessionStorage.removeItem('initialPrompt');
            
            // Set the selected AI model if available
            if (storedModel) {
                setSelectedAI(storedModel);
                aiService.setModel(storedModel);
            }
            
            // We don't need to set value or call handleSubmit - the initial message
            // should already be in Firestore from the home page submission
        }
    }, [sessionId]);

    const handleSubmit = async () => {
        if (!value.trim() || !sessionId || chatState.isLoading) return;

        try {
            // Set loading state
            setChatState(prev => ({
                ...prev,
                isLoading: true,
                error: null
            }));
            
            // 1. Create user message
            const userMessage: Message = {
                id: crypto.randomUUID(),
                role: "user",
                content: value.trim(),
                timestamp: new Date().toISOString(),
            };

            // 2. Add user message to Firestore
            const chatRef = doc(db, "chats", sessionId);
            await updateDoc(chatRef, {
                messages: arrayUnion(userMessage),
                updatedAt: new Date().toISOString()
            });

            // Clear input and reset height
            setValue("");
            if (textareaRef.current) {
                textareaRef.current.style.height = `${MIN_HEIGHT}px`;
            }

            // 3. Generate AI response
            aiService.setModel(selectedAI);
            const aiResponse = await aiService.generateResponse(userMessage.content);

            // 4. Add AI response to Firestore
            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: aiResponse,
                timestamp: new Date().toISOString(),
            };

            await updateDoc(chatRef, {
                messages: arrayUnion(assistantMessage),
                updatedAt: new Date().toISOString()
            });

            // The onSnapshot listener will update the UI automatically

        } catch (error) {
            console.error("Error:", error);
            setChatState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to get AI response"
            }));
            toast.error("Failed to get AI response", { 
                description: error instanceof Error ? error.message : "Please try again"
            });
        }
    };

    // Handle height adjustment for textarea
    const handleAdjustHeight = useCallback((reset = false) => {
        if (!textareaRef.current) return;
        
        if (reset) {
            textareaRef.current.style.height = `${MIN_HEIGHT}px`;
            return;
        }
        
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, MAX_HEIGHT)}px`;
    }, [textareaRef]);

    if (!user) {
        return <LoadingAnimation />;
    }

    return (
        <div className={cn(
            "flex h-full w-full flex-col transition-[left,right,width,margin-right] duration-200 ease-linear",
        )}>
            {chatState.error && (
                <div className="bg-destructive/90 absolute inset-x-0 top-0 z-50 p-2 text-center text-sm">
                    {chatState.error}
                </div>
            )}
            <MessageList
                chatId={sessionId}
                messages={chatState.messages}
                messagesEndRef={messagesEndRef}
                isThinking={chatState.isLoading}
            />
            <ChatInput
                className="absolute bottom-14 left-1/2 z-[1000] -translate-x-1/2 md:bottom-2"
                value={value}
                chatState={chatState}
                setChatState={setChatState}
                showSearch={showSearch}
                showResearch={showResearch}
                imagePreview={imagePreview}
                inputHeight={inputHeight}
                textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
                onSubmit={handleSubmit}
                onChange={setValue}
                onHeightChange={handleAdjustHeight}
                onImageChange={(file) =>
                    file ? setImagePreview(URL.createObjectURL(file)) : setImagePreview(null)
                }
                onSearchToggle={() => setShowSearch(!showSearch)}
                onResearchToggle={() => setShowReSearch(!showResearch)}
                selectedAI={selectedAI}
                onAIChange={(model) => {
                    setSelectedAI(model);
                    aiService.setModel(model);
                }}
            />
        </div>
    );
}