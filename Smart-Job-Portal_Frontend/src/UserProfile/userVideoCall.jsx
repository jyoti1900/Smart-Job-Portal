import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
    FaVideo,
    FaVideoSlash,
    FaMicrophone,
    FaMicrophoneSlash,
    FaDesktop,
    FaPhone,
    FaPhoneSlash,
    FaTimes,
    FaUser,
    FaBuilding,
    FaClock,
    FaSpinner,
    FaExclamationTriangle,
    FaSync,
    FaSignInAlt,
    FaUserCircle
} from "react-icons/fa";
import {
    MdScreenShare,
    MdStopScreenShare,
    MdCallEnd
} from "react-icons/md";
import {
    IoIosPhonePortrait,
    IoIosPhoneLandscape
} from "react-icons/io";
import {
    RiSignalWifiLine
} from "react-icons/ri";
import styles from "./userVideoCall.module.css";

// WebRTC peer connection manager
class WebRTCPeer {
    constructor(config = {}) {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.isNegotiating = false;
        this.pendingCandidates = [];
        this.config = {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun3.l.google.com:19302" },
                { urls: "stun:stun4.l.google.com:19302" }
            ],
            ...config
        };
        this.onRemoteStream = () => {};
        this.onConnectionStateChange = () => {};
        this.onIceCandidate = () => {};
    }

    async initialize(localStream) {
        this.localStream = localStream;
        this.peerConnection = new RTCPeerConnection(this.config);

        // Add all tracks from local stream
        this.localStream.getTracks().forEach((track) => {
            console.log(`🎯 User: Adding ${track.kind} track to peer connection`);
            this.peerConnection.addTrack(track, this.localStream);
        });

        // Handle incoming tracks
        this.peerConnection.ontrack = (event) => {
            console.log("🔵 User: Track received:", event.track.kind, event.track.id);

            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
                console.log("🆕 Created new remote stream");
            }

            // Add track to remote stream
            this.remoteStream.addTrack(event.track);
            console.log(
                "✅ Added track to remote stream, total tracks:",
                this.remoteStream.getTracks().length
            );

            // Notify about the remote stream
            this.onRemoteStream(this.remoteStream);

            // Log stream info
            console.log("📊 Remote stream info:", {
                videoTracks: this.remoteStream.getVideoTracks().length,
                audioTracks: this.remoteStream.getAudioTracks().length,
                active: event.track.readyState === "live",
                enabled: event.track.enabled,
                muted: event.track.muted
            });
        };

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection.connectionState;
            console.log("🔄 User: Connection state changed:", state);
            this.onConnectionStateChange(state);
        };

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("🧊 User: Local ICE candidate");
                this.onIceCandidate(event.candidate);
            } else {
                console.log("✅ User: All ICE candidates gathered");
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            console.log("🧊 User: ICE connection state:", this.peerConnection.iceConnectionState);
        };

        // Track added/removed events
        this.peerConnection.onsignalingstatechange = () => {
            console.log("📶 Signaling state:", this.peerConnection.signalingState);
        };

        return this.peerConnection;
    }

    async createOffer() {
        if (!this.peerConnection) {
            throw new Error("Peer connection not initialized");
        }

        console.log("📤 User: Creating offer...");
        const offer = await this.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });

        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    async setRemoteDescription(description) {
        if (!this.peerConnection) {
            throw new Error("Peer connection not initialized");
        }

        console.log("📥 User: Setting remote description:", description.type);

        // Process any pending ICE candidates
        for (const candidate of this.pendingCandidates) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("🧊 Applied pending ICE candidate");
            } catch (err) {
                console.warn("⚠️ Error applying pending ICE candidate:", err);
            }
        }
        this.pendingCandidates = [];

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
    }

    async createAnswer() {
        if (!this.peerConnection) {
            throw new Error("Peer connection not initialized");
        }

        console.log("📤 User: Creating answer...");

        // Check if we're already in stable state
        if (this.peerConnection.signalingState === "stable") {
            console.log("⚠️ Already stable, skipping answer creation");
            return null;
        }

        // Check if remote description is set
        if (this.peerConnection.remoteDescription === null) {
            console.log("⚠️ No remote description, cannot create answer");
            return null;
        }

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    async addIceCandidate(candidate) {
        if (!this.peerConnection) {
            throw new Error("Peer connection not initialized");
        }

        console.log("🧊 User: Adding ICE candidate");

        // If remote description is not set yet, store candidate for later
        if (this.peerConnection.remoteDescription === null) {
            console.log("📦 Storing ICE candidate for later (no remote description yet)");
            this.pendingCandidates.push(candidate);
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.warn("❌ Error adding ICE candidate:", err);
        }
    }

    close() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
            this.localStream = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach((track) => track.stop());
            this.remoteStream = null;
        }

        this.pendingCandidates = [];
        this.isNegotiating = false;
    }
}

const UserVideoCall = ({ recruiter, applicationId, onClose }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenShared, setIsScreenShared] = useState(false);
    const [isMirrored, setIsMirrored] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [callStatus, setCallStatus] = useState("initial");
    const [error, setError] = useState("");
    const [callTime, setCallTime] = useState(0);
    const [callData, setCallData] = useState(null);
    const [isCallAccepted, setIsCallAccepted] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [mediaInitialized, setMediaInitialized] = useState(false);
    const [hasRemoteStream, setHasRemoteStream] = useState(false);
    const [isViewingPresentation, setIsViewingPresentation] = useState(false);
    const [screenShareLayout, setScreenShareLayout] = useState("default");
    const [connectionState, setConnectionState] = useState("disconnected");
    const [iceState, setIceState] = useState("disconnected");

    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const callIntervalRef = useRef(null);
    const socketRef = useRef(null);
    const originalVideoTrackRef = useRef(null);
    const notificationAudioRef = useRef(null);
    const playPromiseRef = useRef(null);
    const isProcessingOfferRef = useRef(false);
    const retryTimeoutRef = useRef(null);

    const API_BASE_URL = "http://localhost:8080/api/v1/common";
    const SOCKET_URL = "http://localhost:8080";

    const getAuthToken = () => {
        const token =
            localStorage.getItem("userToken") ||
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("accessToken");

        console.log("🔑 Token retrieved:", token ? "Token found" : "NO TOKEN FOUND");
        return token || "";
    };

    // ADD THE MISSING validateToken FUNCTION HERE
    const validateToken = async () => {
        try {
            const token = getAuthToken();

            if (!token) {
                return { valid: false, reason: "No token found" };
            }

            const parts = token.split(".");
            if (parts.length !== 3) {
                return { valid: false, reason: "Invalid token format" };
            }

            try {
                const payload = JSON.parse(atob(parts[1]));
                const expiry = payload.exp ? new Date(payload.exp * 1000) : null;

                if (expiry && expiry < new Date()) {
                    return { valid: false, reason: "Token expired", expiry };
                }

                return { valid: true, payload };
            } catch (decodeErr) {
                return { valid: false, reason: "Cannot decode token" };
            }
        } catch (err) {
            return { valid: false, reason: err.message };
        }
    };

    const debugAuth = () => {
        const token = getAuthToken();
        console.log("🔐 Auth Debug:", {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenStart: token?.substring(0, 10) + "...",
            userId: localStorage.getItem("userId"),
            timestamp: new Date().toISOString()
        });
    };

    // Safe video play function with better error handling
    const safePlayVideo = (videoElement) => {
        if (!videoElement) return;

        // Clear any existing play promises
        if (playPromiseRef.current) {
            playPromiseRef.current
                .catch(() => {})
                .finally(() => {
                    playPromiseRef.current = null;
                });
        }

        if (!videoElement.srcObject) {
            console.log("⚠️ No srcObject for video element");
            return;
        }

        if (!videoElement.paused) {
            console.log("ℹ️ Video already playing");
            return;
        }

        console.log("▶️ Attempting to play video...");

        playPromiseRef.current = videoElement.play();

        if (playPromiseRef.current !== undefined) {
            playPromiseRef.current
                .then(() => {
                    console.log("✅ Video playing successfully");
                    playPromiseRef.current = null;
                })
                .catch((error) => {
                    console.log("❌ Video play error:", error.name, error.message);
                    playPromiseRef.current = null;

                    // If autoplay is blocked, wait for user interaction
                    if (error.name === "NotAllowedError") {
                        console.log("⚠️ Autoplay blocked, waiting for user interaction");
                        // We'll try again when user interacts
                    } else {
                        // Try again after a short delay for other errors
                        setTimeout(() => {
                            if (videoElement && !videoElement.paused) return;
                            videoElement.play().catch((e) => {
                                console.log("Second play attempt failed:", e);
                            });
                        }, 1000);
                    }
                });
        }
    };

    // Handle remote video stream updates
    const handleRemoteStream = useRef((remoteStream) => {
        console.log("🔄 handleRemoteStream called with:", remoteStream);

        if (!remoteStream) {
            console.log("⚠️ No remote stream provided");
            return;
        }

        const tracks = remoteStream.getTracks();
        console.log("📊 Remote stream tracks:", tracks.length);
        tracks.forEach((track, index) => {
            console.log(`Track ${index}:`, {
                kind: track.kind,
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState,
                label: track.label || "no label"
            });
        });

        // Update ref
        remoteStreamRef.current = remoteStream;

        // Update state
        setHasRemoteStream(tracks.length > 0);

        // Update video element
        if (remoteVideoRef.current) {
            console.log("🎬 Setting remote video srcObject");
            remoteVideoRef.current.srcObject = remoteStream;

            // Set up event listeners for the remote video
            remoteVideoRef.current.onloadedmetadata = () => {
                console.log("✅ Remote video metadata loaded");
                console.log("📐 Video dimensions:", {
                    width: remoteVideoRef.current.videoWidth,
                    height: remoteVideoRef.current.videoHeight,
                    readyState: remoteVideoRef.current.readyState
                });
                safePlayVideo(remoteVideoRef.current);
            };

            remoteVideoRef.current.oncanplay = () => {
                console.log("✅ Remote video can play");
                safePlayVideo(remoteVideoRef.current);
            };

            remoteVideoRef.current.onplay = () => {
                console.log("▶️ Remote video started playing");
            };

            remoteVideoRef.current.onerror = (error) => {
                console.error("❌ Remote video error:", error);
                console.log("Video error details:", remoteVideoRef.current.error);
            };

            // Try to play immediately
            setTimeout(() => {
                safePlayVideo(remoteVideoRef.current);
            }, 100);
        } else {
            console.log("⚠️ remoteVideoRef.current is null");
        }
    }).current;

    // Initialize call when component mounts
    useEffect(() => {
        console.log("🔧 User Component mounted with:", {
            applicationId,
            recruiter,
            hasToken: !!getAuthToken(),
            socketUrl: SOCKET_URL,
            apiUrl: API_BASE_URL
        });

        if (!recruiter || !applicationId) return;

        console.log("🎯 User: Initializing video call component");
        console.log("📋 Application ID:", applicationId);
        console.log("👤 Recruiter:", recruiter);

        notificationAudioRef.current = new Audio();

        const initializeCall = async () => {
            try {
                setError("");
                setCallStatus("initializing");

                const tokenValidation = await validateToken();
                console.log("🔐 Initial token validation:", tokenValidation);

                if (!tokenValidation.valid) {
                    setError(
                        `Authentication error: ${tokenValidation.reason}. Please refresh the page.`
                    );
                    setCallStatus("failed");
                    return;
                }

                console.log("Step 1: Setting up WebSocket...");
                setupWebSocket();

                setCallStatus("checking_status");
                try {
                    const token = getAuthToken();
                    const response = await axios.get(
                        `${API_BASE_URL}/applications/${applicationId}/call-status`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            },
                            timeout: 5000
                        }
                    );

                    if (response.data.success) {
                        setCallData(response.data.data);
                        const existingStatus = response.data.data.status;

                        if (existingStatus === "ongoing") {
                            setIsLoading(true);
                            setCallStatus("joining_call");
                            await handleJoinOngoingCall();
                            return;
                        } else if (existingStatus === "ringing") {
                            setCallStatus("incoming");
                            playNotificationSound();
                            return;
                        }
                    }
                } catch (err) {
                    console.log("ℹ️ No active call found or error checking status:", err.message);
                }

                setCallStatus("waiting");
            } catch (err) {
                console.error("❌ Error initializing call:", err);
                setError(`Failed to initialize call: ${err.message}`);
                setCallStatus("failed");
            }
        };

        initializeCall();

        return () => {
            cleanupCall();
            if (notificationAudioRef.current) {
                notificationAudioRef.current.pause();
                notificationAudioRef.current = null;
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [recruiter, applicationId]);

    const handleJoinOngoingCall = async () => {
        try {
            await initializeMediaStream();
            initializeWebRTCPeer();

            if (socketRef.current?.connected) {
                socketRef.current.emit("requestOffer", {
                    applicationId: applicationId,
                    userId: localStorage.getItem("userId") || "user-" + Date.now()
                });
            }
        } catch (err) {
            console.error("❌ Error joining ongoing call:", err);
            setError(`Failed to join call: ${err.message}`);
            setCallStatus("failed");
        } finally {
            setIsLoading(false);
            setMediaInitialized(true);
        }
    };

    const setupWebSocket = () => {
        const token = getAuthToken();

        console.log("🔌 User: Setting up WebSocket connection");
        console.log("WebSocket token available:", !!token);

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const socketOptions = {
            path: "/socket.io",
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            query: {}
        };

        if (token) {
            socketOptions.query = {
                token: token,
                role: "user",
                applicationId: applicationId,
                userId: localStorage.getItem("userId") || "user-" + Date.now()
            };
        }

        const socket = io(SOCKET_URL, socketOptions);

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("✅ User WebSocket CONNECTED:", socket.id);
            setSocketConnected(true);
            setError("");

            socket.emit("joinApplicationRoom", {
                applicationId: applicationId,
                userId: localStorage.getItem("userId") || "user-" + Date.now(),
                role: "job_seeker",
                timestamp: new Date().toISOString()
            });
        });

        socket.on("roomJoined", (data) => {
            console.log("✅ User joined room:", data);
        });

        socket.on("connect_error", (error) => {
            console.error("❌ User WebSocket connection error:", error);
            setSocketConnected(false);
            setError("Failed to connect to server. Please refresh.");
        });

        socket.on("disconnect", (reason) => {
            console.log("⚠️ User WebSocket disconnected:", reason);
            setSocketConnected(false);
        });

        socket.on("auth_error", (error) => {
            console.error("🔐 Socket authentication error:", error);
            setError("Authentication failed. Please refresh the page.");
        });

        socket.on("incomingCall", (data) => {
            console.log("📞 User: INCOMING CALL!", data);
            setCallStatus("incoming");
            setCallData(data);
            playNotificationSound();
        });

        socket.on("webrtcOffer", async (offerData) => {
            console.log("📨 User: Received WebRTC offer");

            if (isProcessingOfferRef.current) {
                console.log("⚠️ Already processing an offer, skipping");
                return;
            }

            isProcessingOfferRef.current = true;
            try {
                await handleIncomingOffer(offerData);
            } finally {
                isProcessingOfferRef.current = false;
            }
        });

        socket.on("webrtcAnswer", async (answerData) => {
            console.log("📨 User: Received WebRTC answer");
            if (peerRef.current && answerData.answer) {
                try {
                    await peerRef.current.setRemoteDescription(answerData.answer);
                    console.log("✅ Remote description set from answer");
                } catch (err) {
                    console.error("❌ Error setting answer:", err);
                }
            }
        });

        socket.on("iceCandidate", async (candidateData) => {
            console.log("🧊 User: Received ICE candidate");
            if (peerRef.current && candidateData.candidate) {
                try {
                    await peerRef.current.addIceCandidate(candidateData.candidate);
                    console.log("✅ ICE candidate added");
                } catch (err) {
                    console.error("❌ Error adding ICE candidate:", err);
                }
            }
        });

        socket.on("callAccepted", (data) => {
            console.log("✅ User: Call acceptance confirmed");
        });

        socket.on("callAcceptConfirmed", (data) => {
            console.log("✅ User: Call accept confirmed by server");
        });

        socket.on("callRejected", (data) => {
            console.log("❌ User: Call rejected by recruiter");
            setCallStatus("rejected");
            setError("Recruiter cancelled the call");
            setTimeout(() => cleanupAndClose(), 2000);
        });

        socket.on("callEnded", (data) => {
            console.log("📞 User: Call ended by recruiter");
            setCallStatus("ended");
            setError("Recruiter has ended the call");
            setTimeout(() => cleanupAndClose(), 3000);
        });

        socket.on("callStarted", (data) => {
            console.log("📞 User: Call started event received");
        });

        socket.on("offerRequested", async (data) => {
            console.log("📨 User: Offer requested, creating offer...");
            if (peerRef.current) {
                try {
                    const offer = await peerRef.current.createOffer();

                    socket.emit("webrtcOffer", {
                        offer: offer,
                        applicationId: applicationId,
                        to: data.from
                    });
                } catch (err) {
                    console.error("❌ Error creating offer:", err);
                }
            }
        });

        socket.on("screenShareStarted", (data) => {
            console.log("📺 User: Recruiter started screen sharing");
            setIsViewingPresentation(true);
            setScreenShareLayout("viewing");
        });

        socket.on("screenShareStopped", (data) => {
            console.log("📺 User: Recruiter stopped screen sharing");
            setIsViewingPresentation(false);
            setScreenShareLayout("default");
        });
    };

    const playNotificationSound = () => {
        try {
            if (notificationAudioRef.current) {
                notificationAudioRef.current.src =
                    "https://assets.mixkit.co/sfx/preview/mixkit-classic-alarm-995.mp3";
                notificationAudioRef.current.loop = true;
                notificationAudioRef.current
                    .play()
                    .catch((e) => console.log("Audio play failed:", e));
            }
        } catch (err) {
            console.log("Could not play notification sound:", err);
        }
    };

    const stopNotificationSound = () => {
        if (notificationAudioRef.current) {
            notificationAudioRef.current.pause();
            notificationAudioRef.current.currentTime = 0;
        }
    };

    const handleIncomingOffer = async (offerData) => {
        try {
            console.log("🚀 User: Processing incoming offer");

            if (callStatus === "incoming") {
                setCallStatus("connecting");
                setIsLoading(true);
            }

            if (!localStreamRef.current) {
                await initializeMediaStream();
            }

            if (!peerRef.current) {
                initializeWebRTCPeer();
            }

            // Check if we already have an active connection
            if (
                peerRef.current.peerConnection &&
                peerRef.current.peerConnection.signalingState === "stable" &&
                peerRef.current.peerConnection.remoteDescription
            ) {
                console.log("⚠️ Already have an active connection, ignoring duplicate offer");
                return;
            }

            await peerRef.current.setRemoteDescription(offerData.offer);

            const answer = await peerRef.current.createAnswer();

            if (answer && socketRef.current?.connected) {
                socketRef.current.emit("webrtcAnswer", {
                    answer: answer,
                    applicationId: applicationId,
                    to: offerData.from || "recruiter"
                });
            }

            setIsCallAccepted(true);
            setCallStatus("connected");
            startCallTimer();
            stopNotificationSound();
            setError("");
        } catch (err) {
            console.error("❌ Error handling incoming offer:", err);
            setError(`Failed to connect: ${err.message}`);
            setCallStatus("failed");
        } finally {
            setIsLoading(false);
        }
    };

    const initializeMediaStream = async () => {
        try {
            console.log("🎥 User: Requesting media access...");

            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                    facingMode: "user"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            localStreamRef.current = stream;
            originalVideoTrackRef.current = stream.getVideoTracks()[0];

            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            console.log("📊 Local stream tracks:", {
                video: videoTrack
                    ? {
                          id: videoTrack.id,
                          enabled: videoTrack.enabled,
                          readyState: videoTrack.readyState,
                          label: videoTrack.label
                      }
                    : "No video track",
                audio: audioTrack
                    ? {
                          id: audioTrack.id,
                          enabled: audioTrack.enabled,
                          readyState: audioTrack.readyState,
                          label: audioTrack.label
                      }
                    : "No audio track"
            });

            if (audioTrack) {
                setIsMuted(!audioTrack.enabled);
            }
            if (videoTrack) {
                setIsCameraOn(videoTrack.enabled);
            }

            if (localVideoRef.current) {
                console.log("🎬 Setting local video srcObject");
                localVideoRef.current.srcObject = stream;
                safePlayVideo(localVideoRef.current);

                // Set up event listeners for local video
                localVideoRef.current.onloadedmetadata = () => {
                    console.log("✅ Local video metadata loaded");
                };
            }

            setMediaInitialized(true);
            return stream;
        } catch (err) {
            console.error("❌ Error accessing media:", err);
            throw new Error("Cannot access camera/microphone. Please check permissions.");
        }
    };

    const initializeWebRTCPeer = () => {
        if (!localStreamRef.current) {
            throw new Error("No local media stream available");
        }

        console.log("🔄 User: Initializing WebRTC peer...");
        peerRef.current = new WebRTCPeer();

        peerRef.current.onRemoteStream = (remoteStream) => {
            console.log("📡 WebRTC: onRemoteStream callback fired");
            handleRemoteStream(remoteStream);
        };

        peerRef.current.onConnectionStateChange = (state) => {
            console.log("🔄 User: Connection state:", state);
            setConnectionState(state);

            if (state === "connected") {
                console.log("🎉 WebRTC connection established!");
                startCallTimer();

                // Try to play remote video after connection is established
                if (remoteVideoRef.current && remoteStreamRef.current) {
                    setTimeout(() => {
                        console.log("🔄 Attempting to play remote video after connection");
                        safePlayVideo(remoteVideoRef.current);
                    }, 500);
                }
            }
        };

        peerRef.current.onIceCandidate = (candidate) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit("iceCandidate", {
                    candidate: candidate,
                    applicationId: applicationId,
                    to: "recruiter"
                });
            }
        };

        peerRef.current.initialize(localStreamRef.current);

        // Log peer connection details
        console.log("🔍 Peer connection initialized:", {
            signalingState: peerRef.current.peerConnection.signalingState,
            iceConnectionState: peerRef.current.peerConnection.iceConnectionState,
            connectionState: peerRef.current.peerConnection.connectionState,
            hasLocalStream: !!localStreamRef.current,
            localTrackCount: localStreamRef.current?.getTracks().length || 0
        });
    };

    const startCallTimer = () => {
        if (callIntervalRef.current) {
            clearInterval(callIntervalRef.current);
        }
        callIntervalRef.current = setInterval(() => {
            setCallTime((prevTime) => prevTime + 1);
        }, 1000);
    };

    const cleanupCall = () => {
        console.log("🧹 User: Cleaning up call...");

        if (callIntervalRef.current) {
            clearInterval(callIntervalRef.current);
            callIntervalRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }

        if (playPromiseRef.current) {
            playPromiseRef.current
                .catch(() => {})
                .finally(() => {
                    playPromiseRef.current = null;
                });
        }

        const stopAllTracks = (stream) => {
            if (stream) {
                stream.getTracks().forEach((track) => {
                    console.log(`Stopping ${track.kind} track`);
                    track.stop();
                });
            }
        };

        stopAllTracks(localStreamRef.current);
        localStreamRef.current = null;

        stopAllTracks(screenStreamRef.current);
        screenStreamRef.current = null;

        stopAllTracks(remoteStreamRef.current);
        remoteStreamRef.current = null;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
            localVideoRef.current.pause();
        }

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
            remoteVideoRef.current.pause();
        }

        setIsCallAccepted(false);
        setIsScreenShared(false);
        setMediaInitialized(false);
        setHasRemoteStream(false);
        setIsViewingPresentation(false);
        setScreenShareLayout("default");
        stopNotificationSound();
        isProcessingOfferRef.current = false;
        setConnectionState("disconnected");
        setIceState("disconnected");
    };

    const cleanupAndClose = () => {
        cleanupCall();
        if (onClose) onClose();
    };

    const handleAcceptCall = async () => {
        try {
            console.log("✅ User: Accepting call");
            setCallStatus("connecting");
            setIsLoading(true);
            setError("");
            stopNotificationSound();

            await initializeMediaStream();
            initializeWebRTCPeer();

            if (socketRef.current?.connected) {
                socketRef.current.emit("acceptCall", {
                    applicationId: applicationId,
                    acceptedAt: new Date().toISOString(),
                    userId: localStorage.getItem("userId")
                });
            }

            const token = getAuthToken();

            if (!token) {
                throw new Error("No authentication token found. Please log in again.");
            }

            console.log("📡 Sending accept-call request...");

            const response = await axios.post(
                `${API_BASE_URL}/applications/${applicationId}/accept-call`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 10000
                }
            );

            console.log("📡 API Response:", response.data);

            if (response.data.success) {
                console.log("✅ Call accepted via API");
                setIsCallAccepted(true);

                setCallStatus("connected");
                startCallTimer();
            } else {
                throw new Error(response.data.message || "API call failed");
            }
        } catch (err) {
            console.error("❌ Error accepting call:", err);

            let errorMessage = `Failed to accept call: ${err.message}`;

            if (err.response) {
                console.error("Response status:", err.response.status);
                console.error("Response data:", err.response.data);

                if (err.response.status === 403) {
                    errorMessage =
                        "Access denied. Your session may have expired. Please refresh the page.";
                } else if (err.response.status === 404) {
                    errorMessage = "Call not found. The recruiter may have cancelled the call.";
                } else if (err.response.status === 500) {
                    errorMessage = "Server error. Please try again.";
                }
            } else if (err.request) {
                console.error("No response received:", err.request);
                errorMessage = "No response from server. Check your internet connection.";
            }

            setError(errorMessage);
            setCallStatus("failed");
            setIsLoading(false);
        }
    };

    const handleEndCall = async () => {
        try {
            setIsLoading(true);

            if (socketRef.current?.connected) {
                socketRef.current.emit("endCall", {
                    applicationId: applicationId,
                    reason: "User ended the call"
                });
            }

            const token = getAuthToken();
            try {
                await axios.post(
                    `${API_BASE_URL}/applications/${applicationId}/end-call`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        timeout: 5000
                    }
                );
            } catch (apiErr) {
                console.warn("API error (may be expected):", apiErr.message);
            }

            setTimeout(() => cleanupAndClose(), 500);
        } catch (err) {
            console.error("❌ Error ending call:", err);
            setError("Error ending call");
            setIsLoading(false);
        }
    };

    const handleRejectCall = async () => {
        try {
            setIsLoading(true);
            stopNotificationSound();

            if (socketRef.current?.connected) {
                socketRef.current.emit("rejectCall", {
                    applicationId: applicationId,
                    reason: "User rejected the call"
                });
            }

            const token = getAuthToken();
            try {
                await axios.post(
                    `${API_BASE_URL}/applications/${applicationId}/reject-call`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        timeout: 5000
                    }
                );
            } catch (apiErr) {
                console.warn("API error:", apiErr.message);
            }

            setCallStatus("rejected");
            setError("Call rejected");
            setTimeout(() => cleanupAndClose(), 1500);
        } catch (err) {
            console.error("❌ Error rejecting call:", err);
            setError("Failed to reject call");
            setIsLoading(false);
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            if (audioTracks.length > 0) {
                const audioTrack = audioTracks[0];
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);

                if (peerRef.current?.peerConnection) {
                    const senders = peerRef.current.peerConnection.getSenders();
                    const audioSender = senders.find(
                        (sender) => sender.track && sender.track.kind === "audio"
                    );
                    if (audioSender) {
                        audioSender.replaceTrack(audioTrack);
                    }
                }
            }
        }
    };

    const toggleCamera = () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            if (videoTracks.length > 0) {
                const videoTrack = videoTracks[0];
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);

                if (peerRef.current?.peerConnection) {
                    const senders = peerRef.current.peerConnection.getSenders();
                    const videoSender = senders.find(
                        (sender) => sender.track && sender.track.kind === "video"
                    );
                    if (videoSender) {
                        videoSender.replaceTrack(videoTrack);
                    }
                }
            }
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (!isScreenShared) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: "always",
                        displaySurface: "monitor"
                    },
                    audio: true
                });

                screenStreamRef.current = screenStream;
                setIsScreenShared(true);
                setScreenShareLayout("presentation");

                if (socketRef.current?.connected) {
                    socketRef.current.emit("screenShareStarted", {
                        applicationId: applicationId,
                        presenter: localStorage.getItem("userId") || "user-" + Date.now()
                    });
                }

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                    safePlayVideo(localVideoRef.current);
                }

                if (peerRef.current?.peerConnection && screenStream.getVideoTracks().length > 0) {
                    const senders = peerRef.current.peerConnection.getSenders();
                    const videoSender = senders.find(
                        (sender) => sender.track && sender.track.kind === "video"
                    );
                    if (videoSender) {
                        videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
                    }
                }

                screenStream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                };
            } else {
                stopScreenShare();
            }
        } catch (err) {
            console.error("❌ Error sharing screen:", err);
            setIsScreenShared(false);
        }
    };

    const stopScreenShare = async () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }

        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            safePlayVideo(localVideoRef.current);
        }

        if (peerRef.current?.peerConnection && localStreamRef.current?.getVideoTracks()[0]) {
            const senders = peerRef.current.peerConnection.getSenders();
            const videoSender = senders.find(
                (sender) => sender.track && sender.track.kind === "video"
            );
            if (videoSender) {
                videoSender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
            }
        }

        setIsScreenShared(false);
        setScreenShareLayout("default");

        if (socketRef.current?.connected) {
            socketRef.current.emit("screenShareStopped", {
                applicationId: applicationId
            });
        }
    };

    const toggleMirror = () => {
        setIsMirrored(!isMirrored);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const retryMediaAccess = async () => {
        setError("");
        setIsLoading(true);
        try {
            await initializeMediaStream();
            setIsLoading(false);
        } catch (err) {
            setError(`Failed to access media: ${err.message}`);
            setIsLoading(false);
        }
    };

    const retryConnection = () => {
        setError("");
        setIsLoading(true);
        setCallStatus("connecting");
        cleanupCall();
        setTimeout(() => {
            setupWebSocket();
            setIsLoading(false);
        }, 500);
    };

    // Force video play on user interaction
    const handleUserInteraction = () => {
        console.log("👆 User interaction detected");
        if (remoteVideoRef.current && remoteVideoRef.current.paused) {
            console.log("🔄 Attempting to play remote video on user interaction");
            safePlayVideo(remoteVideoRef.current);
        }
        if (localVideoRef.current && localVideoRef.current.paused) {
            console.log("🔄 Attempting to play local video on user interaction");
            safePlayVideo(localVideoRef.current);
        }
    };

    // Debug function to check video state
    const debugVideoState = () => {
        console.log("🔍 Video State Debug:");
        console.log("Local Video:", {
            srcObject: !!localVideoRef.current?.srcObject,
            paused: localVideoRef.current?.paused,
            readyState: localVideoRef.current?.readyState,
            videoWidth: localVideoRef.current?.videoWidth,
            videoHeight: localVideoRef.current?.videoHeight,
            error: localVideoRef.current?.error
        });
        console.log("Remote Video:", {
            srcObject: !!remoteVideoRef.current?.srcObject,
            paused: remoteVideoRef.current?.paused,
            readyState: remoteVideoRef.current?.readyState,
            videoWidth: remoteVideoRef.current?.videoWidth,
            videoHeight: remoteVideoRef.current?.videoHeight,
            error: remoteVideoRef.current?.error
        });
        console.log("Remote Stream:", {
            exists: !!remoteStreamRef.current,
            tracks: remoteStreamRef.current?.getTracks().length || 0,
            videoTracks: remoteStreamRef.current?.getVideoTracks().length || 0,
            audioTracks: remoteStreamRef.current?.getAudioTracks().length || 0
        });
        console.log("Peer Connection:", {
            exists: !!peerRef.current?.peerConnection,
            signalingState: peerRef.current?.peerConnection?.signalingState,
            iceConnectionState: peerRef.current?.peerConnection?.iceConnectionState,
            connectionState: peerRef.current?.peerConnection?.connectionState
        });
    };

    if (!recruiter || !applicationId) return null;

    return (
        <div className={styles.callOverlay} onClick={handleUserInteraction}>
            <div
                className={`${styles.callWindow} ${
                    isViewingPresentation || isScreenShared ? styles.presentationMode : ""
                }`}
            >
                <header className={styles.callHeader}>
                    <div className={styles.callInfo}>
                        <h3>
                            <FaUserCircle /> {recruiter.name || "Recruiter"}
                        </h3>
                        <p>
                            <FaBuilding /> {recruiter.company || "Company"} • Interview
                        </p>
                        <div className={styles.callTimer}>
                            {callTime > 0 && (
                                <>
                                    <FaClock /> {formatTime(callTime)}
                                </>
                            )}
                            {callStatus === "waiting" && (
                                <>
                                    <IoIosPhonePortrait /> Ready to receive call
                                </>
                            )}
                            {callStatus === "incoming" && (
                                <>
                                    <IoIosPhoneLandscape /> Incoming call...
                                </>
                            )}
                            {callStatus === "connecting" && (
                                <>
                                    <FaSpinner /> Connecting...
                                </>
                            )}
                            {callStatus === "initializing" && (
                                <>
                                    <FaSpinner /> Initializing...
                                </>
                            )}
                            {callStatus === "checking_status" && (
                                <>
                                    <FaSpinner /> Checking call status...
                                </>
                            )}
                            {callStatus === "joining_call" && (
                                <>
                                    <FaSpinner /> Joining existing call...
                                </>
                            )}
                            {callStatus === "connected" && !hasRemoteStream && (
                                <>
                                    <RiSignalWifiLine /> Connecting video...
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={callStatus === "incoming" ? handleRejectCall : handleEndCall}
                        disabled={isLoading}
                    >
                        <FaTimes />
                    </button>
                </header>

                <div className={styles.videoArea}>
                    {/* Remote video - Shows recruiter's video */}
                    <div className={styles.remoteVideo}>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className={styles.remoteVideoElement}
                            onClick={(e) => {
                                e.stopPropagation();
                                safePlayVideo(remoteVideoRef.current);
                            }}
                        />

                        {!hasRemoteStream && callStatus === "connected" && (
                            <div className={styles.connectingOverlay}>
                                <div className={styles.connectingSpinner}></div>
                                <p>Waiting for recruiter's video...</p>
                                <button
                                    className={styles.retryButton}
                                    onClick={() => {
                                        if (remoteVideoRef.current && remoteStreamRef.current) {
                                            remoteVideoRef.current.srcObject =
                                                remoteStreamRef.current;
                                            safePlayVideo(remoteVideoRef.current);
                                        }
                                    }}
                                >
                                    <FaSync /> Retry Video
                                </button>
                            </div>
                        )}

                        {callStatus === "incoming" && (
                            <div className={styles.incomingCallOverlay}>
                                <div className={styles.ringingAnimation}>
                                    <div className={styles.ringingCircle}></div>
                                    <div className={styles.ringingCircle}></div>
                                    <div className={styles.ringingCircle}></div>
                                </div>
                                <h3>Incoming Video Call</h3>
                                <p>
                                    <FaUser /> From: {recruiter.name || "Recruiter"}
                                </p>
                                <div className={styles.incomingCallButtons}>
                                    <button
                                        type="button"
                                        className={styles.acceptCallButton}
                                        onClick={handleAcceptCall}
                                        disabled={isLoading}
                                    >
                                        <FaPhone /> Accept
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.rejectCallButton}
                                        onClick={handleRejectCall}
                                        disabled={isLoading}
                                    >
                                        <FaPhoneSlash /> Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {(callStatus === "connecting" || callStatus === "waiting") &&
                            !hasRemoteStream && (
                                <div className={styles.connectingOverlay}>
                                    <div className={styles.connectingSpinner}></div>
                                    <p>
                                        {callStatus === "connecting"
                                            ? "Connecting..."
                                            : "Ready to receive call"}
                                    </p>
                                </div>
                            )}

                        <div className={styles.remoteLabel}>
                            <FaUserCircle /> {recruiter.name || "Recruiter"} • Recruiter
                            {hasRemoteStream && " (Live)"}
                            {!hasRemoteStream && callStatus === "connected" && " (Connecting...)"}
                        </div>
                    </div>

                    {/* Local video - Shows user's own video */}
                    <div className={`${styles.selfPreview} ${isMirrored ? styles.mirrored : ""}`}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={styles.selfVideoElement}
                            onClick={(e) => {
                                e.stopPropagation();
                                safePlayVideo(localVideoRef.current);
                            }}
                        />
                        <div className={styles.selfVideoOverlay}>
                            {!isCameraOn && (
                                <div className={styles.cameraOffOverlay}>
                                    <span>
                                        <FaVideoSlash />
                                    </span>
                                    <span>Camera off</span>
                                </div>
                            )}
                            {isMuted && (
                                <div className={styles.muteIndicator}>
                                    <span>
                                        <FaMicrophoneSlash />
                                    </span>
                                    <span>Muted</span>
                                </div>
                            )}
                            {isScreenShared && (
                                <div className={styles.screenShareIndicator}>
                                    <span>
                                        <FaDesktop />
                                    </span>
                                    <span>Screen Sharing</span>
                                </div>
                            )}
                            <span className={styles.selfLabel}>
                                <FaUser /> You • Candidate
                            </span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className={styles.controlsBar}>
                    {callStatus === "connected" ? (
                        <>
                            <div className={styles.leftControls}>
                                <button
                                    type="button"
                                    className={`${styles.controlButton} ${
                                        isMuted ? styles.controlOff : ""
                                    }`}
                                    onClick={toggleMute}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    <span className={styles.controlIcon}>
                                        {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                    </span>
                                    <span className={styles.controlLabel}>
                                        {isMuted ? "Unmute" : "Mute"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.controlButton} ${
                                        !isCameraOn ? styles.controlOff : ""
                                    }`}
                                    onClick={toggleCamera}
                                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                                >
                                    <span className={styles.controlIcon}>
                                        {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
                                    </span>
                                    <span className={styles.controlLabel}>
                                        {isCameraOn ? "Stop Video" : "Start Video"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.controlButton} ${
                                        isScreenShared ? styles.controlActive : ""
                                    }`}
                                    onClick={isScreenShared ? stopScreenShare : toggleScreenShare}
                                    title={isScreenShared ? "Stop screen sharing" : "Share screen"}
                                >
                                    <span className={styles.controlIcon}>
                                        {isScreenShared ? <MdStopScreenShare /> : <MdScreenShare />}
                                    </span>
                                    <span className={styles.controlLabel}>
                                        {isScreenShared ? "Stop Share" : "Share"}
                                    </span>
                                </button>
                            </div>

                            <button
                                type="button"
                                className={styles.endCallButton}
                                onClick={handleEndCall}
                            >
                                <MdCallEnd /> End Call
                            </button>
                        </>
                    ) : callStatus === "incoming" ? (
                        <>
                            <div className={styles.leftControls}>
                                <button
                                    type="button"
                                    className={`${styles.controlButton} ${
                                        isMuted ? styles.controlOff : ""
                                    }`}
                                    onClick={toggleMute}
                                    title={isMuted ? "Unmute" : "Mute"}
                                    disabled
                                >
                                    <span className={styles.controlIcon}>
                                        {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                    </span>
                                    <span className={styles.controlLabel}>
                                        {isMuted ? "Unmute" : "Mute"}
                                    </span>
                                </button>
                            </div>

                            <div className={styles.centerControls}>
                                <button
                                    type="button"
                                    className={styles.acceptCallButton}
                                    onClick={handleAcceptCall}
                                    disabled={isLoading}
                                >
                                    <FaPhone /> Accept Call
                                </button>
                                <button
                                    type="button"
                                    className={styles.rejectCallButton}
                                    onClick={handleRejectCall}
                                    disabled={isLoading}
                                >
                                    <FaPhoneSlash /> Reject Call
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.leftControls}>
                                <button
                                    type="button"
                                    className={`${styles.controlButton} ${
                                        isMuted ? styles.controlOff : ""
                                    }`}
                                    onClick={toggleMute}
                                    title={isMuted ? "Unmute" : "Mute"}
                                    disabled={!mediaInitialized}
                                >
                                    <span className={styles.controlIcon}>
                                        {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                    </span>
                                    <span className={styles.controlLabel}>
                                        {isMuted ? "Unmute" : "Mute"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.controlButton} ${
                                        !isCameraOn ? styles.controlOff : ""
                                    }`}
                                    onClick={toggleCamera}
                                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                                    disabled={!mediaInitialized}
                                >
                                    <span className={styles.controlIcon}>
                                        {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
                                    </span>
                                    <span className={styles.controlLabel}>
                                        {isCameraOn ? "Stop Video" : "Start Video"}
                                    </span>
                                </button>
                            </div>

                            <button
                                type="button"
                                className={styles.endCallButton}
                                onClick={handleEndCall}
                                disabled={isLoading}
                            >
                                {callStatus === "initializing" || callStatus === "connecting" ? (
                                    <>
                                        <FaTimes /> Cancel
                                    </>
                                ) : (
                                    <>
                                        <MdCallEnd /> End Call
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Status */}
                <div className={styles.statusBar}>
                    <div className={styles.statusItem}>
                        <span
                            className={`${styles.statusDot} ${
                                connectionState === "connected"
                                    ? styles.connected
                                    : ["connecting", "incoming"].includes(callStatus)
                                    ? styles.connecting
                                    : styles.disconnected
                            }`}
                        ></span>
                        <span className={styles.statusText}>
                            {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
                            {!socketConnected && " • Disconnected"}
                            {callStatus === "connected" &&
                                !hasRemoteStream &&
                                " • Connecting video..."}
                        </span>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className={styles.errorMessage}>
                        <div className={styles.errorHeader}>
                            <span>
                                <FaExclamationTriangle />
                            </span>
                            <span>Connection Error</span>
                        </div>
                        <div className={styles.errorDetails}>{error}</div>
                        <div className={styles.errorActions}>
                            <button
                                type="button"
                                className={styles.retryButton}
                                onClick={retryConnection}
                            >
                                <FaSync /> Retry Connection
                            </button>
                            <button
                                type="button"
                                className={styles.refreshButton}
                                onClick={() => window.location.reload()}
                            >
                                <FaSync /> Refresh Page
                            </button>
                            {error.includes("expired") && (
                                <button
                                    type="button"
                                    className={styles.loginButton}
                                    onClick={() => (window.location.href = "/login")}
                                >
                                    <FaSignInAlt /> Login Again
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingSpinner}></div>
                        <p>
                            {callStatus === "joining_call" && "Joining call..."}
                            {callStatus === "connecting" && "Connecting..."}
                            {callStatus === "initializing" && "Initializing..."}
                            {!["joining_call", "connecting", "initializing"].includes(callStatus) &&
                                "Please wait..."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserVideoCall;
