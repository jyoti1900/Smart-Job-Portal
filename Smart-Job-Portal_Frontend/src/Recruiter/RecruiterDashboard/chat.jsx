import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import styles from "./chat.module.css";

const CHAT_API_BASE = "http://localhost:8080/api/v1/common/applications";
const SOCKET_URL = "http://localhost:8080";

const ChatInput = ({ onSendMessage, isConnected, sending, hasMessages, newMessage, setNewMessage }) => {
    const handleSend = () => {
        if (!newMessage.trim() || sending) return;
        onSendMessage(newMessage.trim());
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.chatInputArea}>
            <div className={styles.inputWrapper}>
                <textarea
                    className={`${styles.messageInput} ${!isConnected ? styles.disconnectedInput : ''}`}
                    placeholder={isConnected ? "Type your message..." : "Reconnecting..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={!isConnected && hasMessages}
                />
                {!isConnected && hasMessages && (
                    <div className={styles.connectionWarning}>
                        ⚠️ Connection lost. Messages may not be delivered.
                    </div>
                )}
            </div>
            <button
                type="button"
                className={`${styles.sendButton} ${newMessage.trim() ? styles.active : ''} ${
                    !isConnected && hasMessages ? styles.disabledButton : ''
                }`}
                onClick={handleSend}
                disabled={!newMessage.trim() || sending || (!isConnected && hasMessages)}
                title={!isConnected && hasMessages ? "Reconnect to send messages" : "Send message"}
            >
                {sending ? (
                    <>
                        <span className={styles.sendingSpinner}></span>
                        Sending...
                    </>
                ) : !isConnected && hasMessages ? (
                    'Offline'
                ) : (
                    'Send'
                )}
            </button>
        </div>
    );
};

const ChatApplication = ({ candidate, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const messageIdsRef = useRef(new Set());
    const chatContainerRef = useRef(null);
    const hasFetchedRef = useRef(false);

    // Initialize Socket.io connection
    useEffect(() => {
        if (!candidate) return;

        const applicationId = candidate.applicationId || candidate.id;
        if (!applicationId) {
            console.warn("No applicationId found for candidate");
            return;
        }

        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        if (!token) {
            console.error("No authentication token found");
            setFetchError("Authentication required. Please login again.");
            return;
        }

        // Clean up previous socket connection
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current.removeAllListeners();
            socketRef.current = null;
        }

        console.log("Initializing Socket.io connection for application:", applicationId);

        // Create Socket.io connection
        const socket = io(SOCKET_URL, {
            auth: {
                token: token,
                applicationId: applicationId
            },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
            query: {
                applicationId: applicationId,
                userType: "recruiter"
            }
        });

        // Connection events
        socket.on("connect", () => {
            console.log("✅ Socket.io connected successfully. Socket ID:", socket.id);
            setIsConnected(true);
            setFetchError(null);

            // Join the specific chat room
            socket.emit("joinChat", { 
                applicationId: applicationId,
                userType: "recruiter"
            });
            console.log("Joined chat room:", applicationId);
        });

        // Listen for new messages
        socket.on("receiveMessage", (data) => {
            console.log("📨 Received new message via Socket.io:", data);
            
            if (data && data.message) {
                handleIncomingMessage(data.message);
            }
        });

        socket.on("disconnect", (reason) => {
            console.log("🔴 Socket.io disconnected:", reason);
            setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
            console.error("❌ Socket.io connection error:", error);
            setIsConnected(false);
            setFetchError("Connection error. Please try reconnecting.");
        });

        socket.on("error", (error) => {
            console.error("Socket error:", error);
        });

        socketRef.current = socket;

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                console.log("Cleaning up socket connection...");
                socketRef.current.disconnect();
                socketRef.current.removeAllListeners();
                socketRef.current = null;
            }
            setIsConnected(false);
            hasFetchedRef.current = false;
        };
    }, [candidate]);

    // Handle incoming message from Socket.io
    const handleIncomingMessage = useCallback((messageData) => {
        if (!messageData) return;
        
        const messageId = messageData._id || messageData.id;
        
        // Skip duplicates
        if (messageId && messageIdsRef.current.has(messageId)) {
            console.log("Duplicate message received, ignoring:", messageId);
            return;
        }

        // Add to tracking set
        if (messageId) {
            messageIdsRef.current.add(messageId);
        }

        // Determine sender
        const sender = messageData.senderRole === "job_provider" ? "recruiter" : "candidate";
        
        const messageDate = new Date(messageData.createdAt || new Date());
        const time = messageDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

        const formattedMessage = {
            id: messageId || `msg-${Date.now()}`,
            _id: messageId,
            sender: sender,
            text: messageData.message || "",
            time: time,
            timestamp: messageDate.getTime(),
            createdAt: messageData.createdAt || new Date().toISOString(),
            senderId: messageData.senderId,
            senderRole: messageData.senderRole,
            isSent: true
        };

        console.log("Adding incoming message:", formattedMessage);
        setMessages(prev => {
            // Check if this message already exists
            const exists = prev.some(msg => msg._id === messageId);
            
            if (exists) {
                console.log("Message already exists, skipping");
                return prev;
            }
            
            return [...prev, formattedMessage];
        });
    }, []);

    // Fetch messages from API when candidate changes
    const fetchMessages = useCallback(
        async () => {
            if (!candidate) {
                setMessages([]);
                return;
            }

            const applicationId = candidate.applicationId || candidate.id;
            if (!applicationId) {
                console.warn("No applicationId found for candidate");
                setMessages([]);
                return;
            }

            setFetchError(null);

            try {
                const token = localStorage.getItem("authToken") || localStorage.getItem("token");

                if (!token) {
                    const errorMsg = "Authentication token not found. Please login again.";
                    setFetchError(errorMsg);
                    setMessages([]);
                    return;
                }

                console.log("Fetching messages for applicationId:", applicationId);

                const response = await axios.get(`${CHAT_API_BASE}/${applicationId}/chat`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 10000
                });

                console.log("Chat API Response:", response.data);

                // Clear tracking set
                messageIdsRef.current.clear();

                // Map API messages to UI format
                const apiData = response.data?.data || response.data;
                const apiMessages = Array.isArray(apiData?.messages) ? apiData.messages : [];

                const mappedMessages = apiMessages.map((msg, index) => {
                    const sender = msg.senderRole === "job_provider" ? "recruiter" : "candidate";
                    const messageDate = new Date(msg.createdAt);
                    const time = messageDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    });

                    const messageId = msg._id || `msg-${index}`;

                    // Add to tracking set
                    if (msg._id) {
                        messageIdsRef.current.add(msg._id);
                    }

                    return {
                        id: messageId,
                        _id: msg._id,
                        sender: sender,
                        text: msg.message || "",
                        time: time,
                        timestamp: messageDate.getTime(),
                        createdAt: msg.createdAt,
                        senderId: msg.senderId,
                        senderRole: msg.senderRole,
                        isSent: true
                    };
                });

                // Sort messages by timestamp
                const sortedMessages = mappedMessages.sort((a, b) => a.timestamp - b.timestamp);
                setMessages(sortedMessages);
                hasFetchedRef.current = true;
            } catch (error) {
                console.error("Failed to fetch messages:", error);

                let errorMessage = "Failed to load messages";

                if (error.code === "ECONNABORTED") {
                    errorMessage = "Request timeout. Please check your connection.";
                } else if (error.response) {
                    const status = error.response.status;
                    const data = error.response.data;

                    if (status === 401) {
                        errorMessage = "Authentication failed. Please login again.";
                        if (onClose) onClose();
                    } else if (status === 403) {
                        errorMessage = "You do not have permission to view these messages.";
                    } else if (status === 404) {
                        errorMessage = "Chat not found for this application.";
                        setMessages([]);
                    } else if (status >= 500) {
                        errorMessage = "Server error. Please try again later.";
                    } else {
                        errorMessage = data?.message || data?.error || `Server error (${status})`;
                    }
                } else if (error.request) {
                    errorMessage = "No response from server. Please check your connection.";
                } else {
                    errorMessage = error.message || "Failed to load messages";
                }

                if (error.response?.status !== 404) {
                    setFetchError(errorMessage);
                }

                setMessages([]);
            }
        },
        [candidate, onClose]
    );

    // Fetch messages on candidate change
    useEffect(() => {
        // Reset and fetch only if not already fetched
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchMessages();
        }
    }, [candidate, fetchMessages]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current && chatContainerRef.current) {
            // Check if user is near bottom before auto-scrolling
            const container = chatContainerRef.current;
            const isNearBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 100;

            if (isNearBottom) {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            }
        }
    }, [messages]);

    // Manual reconnect function
    const handleReconnect = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current.connect();
        }
        fetchMessages();
    };

    // Manual retry fetch
    const handleRetryFetch = () => {
        setFetchError(null);
        hasFetchedRef.current = false;
        fetchMessages();
    };

    const handleSendMessage = async (messageText) => {
        if (!messageText || !candidate || sending) return;

        const applicationId = candidate.applicationId || candidate.id;
        if (!applicationId) {
            alert("Application ID not found");
            return;
        }

        setNewMessage("");
        setSending(true);

        try {
            const token = localStorage.getItem("authToken") || localStorage.getItem("token");

            if (!token) {
                const errorMsg = "Authentication token not found. Please login again.";
                alert(errorMsg);
                setNewMessage(messageText);
                setSending(false);
                if (onClose) onClose();
                return;
            }

            console.log("Sending message via API:", { applicationId, messageText });

            // Send message via API
            const response = await axios.post(
                `${CHAT_API_BASE}/${applicationId}/chat`,
                { 
                    message: messageText
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log("API response:", response.data);
            
            // Message will appear via Socket.io receiveMessage event
            
        } catch (error) {
            console.error("Failed to send message:", error);
            
            let errorMessage = "Failed to send message. Please try again.";

            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (status === 401) {
                    errorMessage = "Authentication failed. Please login again.";
                    alert(errorMessage);
                    if (onClose) onClose();
                } else if (status === 403) {
                    errorMessage = "You do not have permission to send messages.";
                    alert(errorMessage);
                } else if (status === 404) {
                    errorMessage = "Chat not found for this application.";
                    alert(errorMessage);
                } else {
                    errorMessage = data?.message || data?.error || `Server error (${status})`;
                    alert(errorMessage);
                }
            } else if (error.request) {
                errorMessage = "No response from server. Please check your connection.";
                alert(errorMessage);
            } else {
                errorMessage = error.message || "Failed to send message";
                alert(errorMessage);
            }

            setNewMessage(messageText); // Restore the message text
        } finally {
            setSending(false);
        }
    };

    if (!candidate) return null;

    return (
        <div className={styles.chatPopupOverlay} onClick={onClose}>
            <div className={styles.chatPopup} onClick={(e) => e.stopPropagation()}>
                <div className={styles.chatHeader}>
                    <div className={styles.chatHeaderInfo}>
                        <div className={styles.chatAvatar}>
                            <span className={styles.avatarText}>
                                {candidate.name?.charAt(0) || "C"}
                            </span>
                        </div>
                        <div>
                            <h3 className={styles.chatTitle}>{candidate.name}</h3>
                            <p className={styles.chatSubtitle}>
                                {candidate.position || "Candidate"}
                            </p>
                        </div>
                    </div>

                    <div className={styles.chatHeaderControls}>
                        <div className={styles.connectionStatus}>
                            <span
                                className={`${styles.statusDot} ${
                                    isConnected ? styles.connected : styles.disconnected
                                }`}
                                title={isConnected ? "Connected" : "Disconnected"}
                            />
                            <span className={styles.statusText}>
                                {isConnected ? "Live" : "Offline"}
                            </span>
                            {!isConnected && (
                                <button
                                    onClick={handleReconnect}
                                    className={styles.reconnectButton}
                                    title="Reconnect"
                                >
                                    ↻
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            className={styles.chatCloseButton}
                            onClick={onClose}
                            aria-label="Close chat"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {fetchError && (
                    <div className={styles.errorContainer}>
                        <div className={styles.errorMessage}>
                            <span className={styles.errorIcon}>⚠️</span>
                            <span>{fetchError}</span>
                            <button onClick={handleRetryFetch} className={styles.retryButton}>
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                <div ref={chatContainerRef} className={styles.messagesContainer}>
                    {messages.length === 0 && !fetchError && !hasFetchedRef.current ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.loadingSpinner}></div>
                            <p>Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className={styles.noMessages}>
                            <p>No messages yet. Start the conversation!</p>
                            {!isConnected && (
                                <button
                                    onClick={handleReconnect}
                                    className={styles.reconnectButtonLarge}
                                >
                                    Reconnect to receive live messages
                                </button>
                            )}
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`${styles.messageWrapper} ${
                                    message.sender === "recruiter"
                                        ? styles.recruiter
                                        : styles.candidate
                                }`}
                            >
                                <div className={styles.messageContent}>
                                    <div className={styles.messageBubble}>
                                        <p className={styles.messageText}>{message.text}</p>
                                        <div className={styles.messageFooter}>
                                            <span className={styles.messageTime}>
                                                {message.time}
                                            </span>
                                            {message.sender === "recruiter" && message.isSent && (
                                                <span className={styles.messageStatus}>
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <ChatInput
                    onSendMessage={handleSendMessage}
                    isConnected={isConnected}
                    sending={sending}
                    hasMessages={messages.length > 0}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                />
            </div>
        </div>
    );
};

export default ChatApplication;