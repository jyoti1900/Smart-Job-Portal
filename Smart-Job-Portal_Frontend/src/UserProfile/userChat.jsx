import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import styles from './userChat.module.css';

const CHAT_API_BASE = 'http://localhost:8080/api/v1/common/applications';
const SOCKET_URL = 'http://localhost:8080';

const ChatApplication = ({ candidate, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const messageIdsRef = useRef(new Set()); // Track message IDs to prevent duplicates

  // Initialize Socket.io connection
  useEffect(() => {
    if (!candidate) return;

    const applicationId = candidate.applicationId || candidate.id;
    if (!applicationId) {
      console.warn('No applicationId found');
      return;
    }

    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setFetchError('Authentication required. Please login again.');
      return;
    }

    // Clean up previous socket connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }

    console.log('Initializing Socket.io connection for application:', applicationId);
    
    // Create Socket.io connection
    const socket = io(SOCKET_URL, {
      auth: {
        token: token,
        applicationId: applicationId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      query: {
        applicationId: applicationId
      }
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.io connected successfully. Socket ID:', socket.id);
      setIsConnected(true);
      setFetchError(null);
      
      // Join the specific chat room
      socket.emit('joinChat', { applicationId });
      console.log('Joined chat room:', applicationId);
    });

    // Listen for new messages
    socket.on('receiveMessage', (data) => {
      console.log('📨 Received new message via Socket.io:', data);
      
      // Only process if it's for our current chat
      if (data.applicationId === applicationId) {
        handleIncomingMessage(data.message);
      }
    });

    // Listen for message history
    socket.on('messageHistory', (data) => {
      console.log('Received message history:', data);
      if (data.applicationId === applicationId && Array.isArray(data.messages)) {
        processIncomingMessages(data.messages);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 Socket.io disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, need to manually reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
      setIsConnected(false);
      setFetchError('Connection error. Attempting to reconnect...');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection...');
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [candidate]);

  // Handle incoming message from Socket.io - FIXED: Removed messages dependency
  const handleIncomingMessage = useCallback((messageData) => {
    // Check if this message already exists using ref
    const messageId = messageData._id || messageData.id;
    if (messageIdsRef.current.has(messageId)) {
      console.log('Duplicate message received, ignoring:', messageId);
      return;
    }

    // Add to tracking set
    if (messageId) {
      messageIdsRef.current.add(messageId);
    }

    // Map senderRole for user side
    const sender = messageData.senderRole === 'job_seeker' ? 'candidate' : 'recruiter';
    
    const messageDate = new Date(messageData.createdAt || new Date());
    const time = messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const formattedMessage = {
      id: messageId || `msg-${Date.now()}-${Math.random()}`,
      sender: sender,
      text: messageData.message || '',
      time: time,
      timestamp: messageDate.getTime(),
      createdAt: messageData.createdAt || new Date().toISOString(),
      senderId: messageData.senderId,
      senderRole: messageData.senderRole
    };

    console.log('Adding incoming message:', formattedMessage);
    setMessages(prev => [...prev, formattedMessage]);
  }, []); // Empty dependency array - using ref instead of state

  // Process multiple incoming messages
  const processIncomingMessages = useCallback((messagesArray) => {
    if (!Array.isArray(messagesArray)) return;

    const newMessages = [];
    
    messagesArray.forEach((messageData) => {
      const messageId = messageData._id || messageData.id;
      
      // Skip duplicates
      if (messageIdsRef.current.has(messageId)) {
        return;
      }
      
      if (messageId) {
        messageIdsRef.current.add(messageId);
      }

      const sender = messageData.senderRole === 'job_seeker' ? 'candidate' : 'recruiter';
      
      const messageDate = new Date(messageData.createdAt || new Date());
      const time = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      newMessages.push({
        id: messageId || `msg-${Date.now()}-${Math.random()}`,
        sender: sender,
        text: messageData.message || '',
        time: time,
        timestamp: messageDate.getTime(),
        createdAt: messageData.createdAt || new Date().toISOString(),
        senderId: messageData.senderId,
        senderRole: messageData.senderRole
      });
    });

    // Sort by timestamp and add to state
    if (newMessages.length > 0) {
      const sortedMessages = newMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(prev => {
        // Merge with existing messages and remove duplicates
        const allMessages = [...prev, ...sortedMessages];
        const uniqueMessages = [];
        const seenIds = new Set();
        
        allMessages.forEach(msg => {
          if (!seenIds.has(msg.id)) {
            seenIds.add(msg.id);
            uniqueMessages.push(msg);
          }
        });
        
        // Sort again to ensure chronological order
        return uniqueMessages.sort((a, b) => a.timestamp - b.timestamp);
      });
    }
  }, []);

  // Fetch initial messages from API with retry logic
  const fetchMessages = useCallback(async (forceRetry = false) => {
    if (!candidate) {
      setMessages([]);
      return;
    }

    const applicationId = candidate.applicationId || candidate.id;
    if (!applicationId) {
      console.warn('No applicationId found for candidate');
      setMessages([]);
      return;
    }

    // Clear previous messages and tracking
    if (forceRetry) {
      setMessages([]);
      messageIdsRef.current.clear();
    }

    setLoading(true);
    setFetchError(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        const errorMsg = 'Authentication token not found. Please login again.';
        setFetchError(errorMsg);
        setMessages([]);
        setLoading(false);
        return;
      }

      console.log('Fetching messages for applicationId:', applicationId);

      const response = await axios.get(
        `${CHAT_API_BASE}/${applicationId}/chat`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('Chat API Response:', response.data);

      // Clear tracking set
      messageIdsRef.current.clear();

      // Map API messages to UI format
      const apiData = response.data?.data || response.data;
      const apiMessages = Array.isArray(apiData?.messages) ? apiData.messages : [];
      
      if (apiMessages.length === 0) {
        console.log('No messages found in API response');
      }

      const mappedMessages = apiMessages.map((msg, index) => {
        const sender = msg.senderRole === 'job_seeker' ? 'candidate' : 'recruiter';
        
        const messageDate = new Date(msg.createdAt);
        const time = messageDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const messageId = msg._id || `msg-${index}`;
        
        // Add to tracking set
        if (msg._id) {
          messageIdsRef.current.add(msg._id);
        }

        return {
          id: messageId,
          sender: sender,
          text: msg.message || '',
          time: time,
          timestamp: messageDate.getTime(),
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          senderRole: msg.senderRole
        };
      });

      // Sort messages by timestamp
      const sortedMessages = mappedMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sortedMessages);
      setRetryCount(0); // Reset retry count on success

    } catch (error) {
      console.error('Failed to fetch messages:', error);
      
      let errorMessage = 'Failed to load messages';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection.';
      } else if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
          if (onClose) onClose();
        } else if (status === 403) {
          errorMessage = 'You do not have permission to view these messages.';
        } else if (status === 404) {
          errorMessage = 'Chat not found for this application.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data?.message || data?.error || `Server error (${status})`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'Failed to load messages';
      }
      
      setFetchError(errorMessage);
      setMessages([]);
      
      // Auto-retry logic (max 3 retries)
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchMessages();
        }, 3000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [candidate, retryCount, onClose]);

  // Fetch messages on candidate change
  useEffect(() => {
    fetchMessages(true); // Force fetch when candidate changes
  }, [candidate, fetchMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [candidate]);

  // Manual reconnect function
  const handleReconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
    fetchMessages(true);
  };

  // Manual retry fetch
  const handleRetryFetch = () => {
    setRetryCount(0);
    fetchMessages(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !candidate || sending) return;

    const applicationId = candidate.applicationId || candidate.id;
    if (!applicationId) {
      alert('Application ID not found');
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        const errorMsg = 'Authentication token not found. Please login again.';
        alert(errorMsg);
        setNewMessage(messageText);
        setSending(false);
        if (onClose) onClose();
        return;
      }

      console.log('Sending message to applicationId:', applicationId);

      // Send message to API
      const response = await axios.post(
        `${CHAT_API_BASE}/${applicationId}/chat`,
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Message sent successfully:', response.data);
      
      // If socket is disconnected, add message locally for immediate feedback
      if (!isConnected && socketRef.current) {
        const tempMessage = {
          id: `temp-${Date.now()}`,
          sender: 'recruiter', // Assuming this is recruiter side
          text: messageText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
          isPending: true
        };
        
        handleIncomingMessage(tempMessage);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      let errorMessage = 'Failed to send message. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
          alert(errorMessage);
          if (onClose) onClose();
        } else if (status === 403) {
          errorMessage = 'You do not have permission to send messages.';
          alert(errorMessage);
        } else if (status === 404) {
          errorMessage = 'Chat not found for this application.';
          alert(errorMessage);
        } else {
          errorMessage = data?.message || data?.error || `Server error (${status})`;
          alert(errorMessage);
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
        alert(errorMessage);
      } else {
        errorMessage = error.message || 'Failed to send message';
        alert(errorMessage);
      }
      
      setNewMessage(messageText); // Restore the message text
    } finally {
      setSending(false);
      // Focus back on input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if we should show connection warning
  const shouldShowWarning = !isConnected && messages.length > 0;

  if (!candidate) return null;

  return (
    <div className={styles.chatWidgetOverlay} onClick={onClose}>
      <div className={styles.chatWidgetContainer} onClick={(e) => e.stopPropagation()}>
        {/* Chat Header */}
        <div className={styles.chatWidgetHeader}>
          <div className={styles.chatUserInfo}>
            <div className={styles.chatAvatar}>
              <span>{candidate.name?.charAt(0) || 'C'}</span>
            </div>
            <div className={styles.chatUserDetails}>
              <h3 className={styles.chatUserName}>{candidate.name}</h3>
              <p className={styles.chatUserTitle}>{candidate.position || 'Backend Developer'}</p>
            </div>
          </div>
          
          <div className={styles.chatHeaderControls}>
            {/* Socket.io connection status */}
            <div className={styles.connectionStatus}>
              <span 
                className={`${styles.statusDot} ${
                  isConnected ? styles.connected : styles.disconnected
                }`}
                title={isConnected ? 'Connected' : 'Disconnected'}
              />
              <span className={styles.statusText}>
                {isConnected ? 'Live' : 'Offline'}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {fetchError && !loading && (
          <div className={styles.errorContainer}>
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{fetchError}</span>
              <button 
                onClick={handleRetryFetch}
                className={styles.retryButton}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className={styles.chatMessagesContainer}>
          {loading ? (
            <div className={styles.chatLoading}>
              <div className={styles.loadingDots}>
                <div></div>
                <div></div>
                <div></div>
              </div>
              <p>Loading messages... {retryCount > 0 && `(Retry ${retryCount}/3)`}</p>
            </div>
          ) : fetchError && messages.length === 0 ? (
            <div className={styles.noMessages}>
              <p className={styles.errorText}>{fetchError}</p>
              <button 
                onClick={handleRetryFetch}
                className={styles.retryButtonLarge}
              >
                Try Again
              </button>
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
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageItem} ${
                    message.sender === 'recruiter'
                      ? styles.received
                      : styles.sent
                  } ${message.isPending ? styles.pendingMessage : ''}`}
                >
                  <div className={styles.messageBubble}>
                    <div className={styles.messageText}>{message.text}</div>
                    <div className={styles.messageTime}>
                      {message.time}
                      {message.sender === 'candidate' && (
                        <span className={styles.messageStatus}>
                          {message.isPending ? '🕒' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className={styles.chatInputWrapper}>
          <div className={styles.chatInputContainer}>
            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                className={`${styles.chatInput} ${!isConnected ? styles.disconnectedInput : ''}`}
                placeholder={isConnected ? "Type your message..." : "Reconnecting..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isConnected && messages.length > 0}
              />
              {shouldShowWarning && (
                <div className={styles.connectionWarning}>
                  ⚠️ Connection lost. Messages may not be delivered.
                </div>
              )}
            </div>
            <button
              type="button"
              className={`${styles.sendButton} ${newMessage.trim() ? styles.active : ''} ${
                !isConnected && messages.length > 0 ? styles.disabledButton : ''
              }`}
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || (!isConnected && messages.length > 0)}
              title={!isConnected && messages.length > 0 ? "Reconnect to send messages" : "Send message"}
            >
              {sending ? (
                <div className={styles.sendingSpinner}></div>
              ) : !isConnected && messages.length > 0 ? (
                'Offline'
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatApplication;