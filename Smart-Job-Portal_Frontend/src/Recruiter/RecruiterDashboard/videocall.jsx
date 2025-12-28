import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  FaVideo, 
  FaVideoSlash, 
  FaMicrophone, 
  FaMicrophoneSlash,
  FaTimes,
  FaClock,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSync,
  FaUserCircle,
  FaBroadcastTower,
  FaDesktop as FaDesktopScreen,
  FaUser as FaUserIcon
} from 'react-icons/fa';
import { 
  MdScreenShare, 
  MdStopScreenShare,
  MdCallEnd,
  MdCheckCircle as MdCheckCircleIcon,
  MdBusiness,
} from 'react-icons/md';
import { 
  IoPhonePortrait,
  IoEye,
  IoLaptop
} from 'react-icons/io5';
import { 
  RiSignalWifiLine,
  RiComputerLine as RiComputerScreen
} from 'react-icons/ri';
import styles from './videocall.module.css';

// WebRTC peer connection manager
class WebRTCPeer {
  constructor(config = {}) {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.screenStream = null;
    this.currentVideoTrack = null;
    this.originalVideoTrack = null;
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      ...config
    };
    this.onRemoteStream = () => {};
    this.onConnectionStateChange = () => {};
    this.onIceCandidate = () => {};
    this.remoteTracks = { audio: null, video: null };
    this.hasRemoteVideo = false;
  }

  async initialize(localStream) {
    this.localStream = localStream;
    this.peerConnection = new RTCPeerConnection(this.config);

    // Store original video track
    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      this.originalVideoTrack = videoTracks[0];
      this.currentVideoTrack = videoTracks[0];
    }

    // Add all tracks from local stream
    this.localStream.getTracks().forEach(track => {
      console.log(`🎯 Adding ${track.kind} track`);
      this.peerConnection.addTrack(track, this.localStream);
    });

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      console.log('🔵 Track received:', event.track.kind, 'streams:', event.streams.length);
      
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        console.log('✅ Got remote stream from track event');
      } else if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        console.log('🆕 Created new remote stream');
      }
      
      if (event.track) {
        this.remoteStream.addTrack(event.track);
        this.remoteTracks[event.track.kind] = event.track;
        
        if (event.track.kind === 'video') {
          this.hasRemoteVideo = true;
          console.log('✅ Video track received - notifying');
          this.onRemoteStream(this.remoteStream);
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('🔄 Connection state:', state);
      this.onConnectionStateChange(state);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated');
        this.onIceCandidate(event.candidate);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      console.log('🧊 ICE connection state:', state);
      
      if (state === 'connected' || state === 'completed') {
        console.log('✅ ICE connection established');
        if (this.remoteStream && this.hasRemoteVideo) {
          setTimeout(() => {
            this.onRemoteStream(this.remoteStream);
          }, 100);
        }
      }
    };

    return this.peerConnection;
  }

  // Camera toggle method
  toggleCamera(enabled) {
    if (!this.peerConnection || !this.localStream) return;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
      console.log(`🎥 Camera ${enabled ? 'enabled' : 'disabled'}`);
      
      // Update the track in the peer connection
      const senders = this.peerConnection.getSenders();
      const videoSender = senders.find(sender => 
        sender.track && sender.track.kind === 'video'
      );
      
      if (videoSender && this.currentVideoTrack) {
        // Only send if we're not sharing screen
        if (!this.screenStream) {
          videoSender.replaceTrack(this.currentVideoTrack);
        }
      }
    }
  }

  // Microphone toggle method
  toggleMicrophone(enabled) {
    if (!this.peerConnection || !this.localStream) return;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
      console.log(`🎤 Microphone ${enabled ? 'enabled' : 'disabled'}`);
      
      // Update the track in the peer connection
      const senders = this.peerConnection.getSenders();
      const audioSender = senders.find(sender => 
        sender.track && sender.track.kind === 'audio'
      );
      
      if (audioSender && audioTrack) {
        audioSender.replaceTrack(audioTrack);
      }
    }
  }

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('📤 Creating offer...');
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ Offer created and set as local description');
      return offer;
    } catch (err) {
      console.error('❌ Error creating offer:', err);
      throw err;
    }
  }

  async setRemoteDescription(description) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('📥 Setting remote description:', description.type);
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      );
      console.log('✅ Remote description set');
      return true;
    } catch (err) {
      console.error('❌ Error setting remote description:', err);
      if (err.message && err.message.includes('stable')) {
        console.log('ℹ️ Already in stable state, continuing...');
        return true;
      }
      throw err;
    }
  }

  async createAnswer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('📤 Creating answer...');
    try {
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Answer created');
      return answer;
    } catch (err) {
      console.error('❌ Error creating answer:', err);
      throw err;
    }
  }

  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
      console.log('✅ ICE candidate added');
    } catch (err) {
      console.warn('⚠️ Failed to add ICE candidate:', err.message);
    }
  }

  // Screen sharing methods
  async startScreenShare(screenStream) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('🖥️ Starting screen share...');
    this.screenStream = screenStream;
    const screenTrack = screenStream.getVideoTracks()[0];
    
    if (screenTrack) {
      const senders = this.peerConnection.getSenders();
      const videoSender = senders.find(sender => 
        sender.track && sender.track.kind === 'video'
      );
      
      if (videoSender) {
        await videoSender.replaceTrack(screenTrack);
        this.currentVideoTrack = screenTrack;
        console.log('✅ Screen share track replaced');
        
        screenTrack.onended = () => {
          console.log('🖥️ Screen sharing stopped by browser');
          this.stopScreenShare();
        };
      }
      
      return screenTrack;
    }
    
    return null;
  }

  async stopScreenShare() {
    if (!this.peerConnection || !this.originalVideoTrack) {
      return;
    }

    console.log('🖥️ Stopping screen share...');
    
    const senders = this.peerConnection.getSenders();
    const videoSender = senders.find(sender => 
      sender.track && sender.track.kind === 'video'
    );
    
    if (videoSender && this.originalVideoTrack) {
      await videoSender.replaceTrack(this.originalVideoTrack);
      this.currentVideoTrack = this.originalVideoTrack;
      console.log('✅ Restored original video track');
    }
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }

  close() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    this.currentVideoTrack = null;
    this.originalVideoTrack = null;
    this.remoteTracks = { audio: null, video: null };
    this.hasRemoteVideo = false;
  }
}

const VideoCall = ({ candidate, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callStatus, setCallStatus] = useState('initializing');
  const [error, setError] = useState('');
  const [callTime, setCallTime] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isViewingPresentation, setIsViewingPresentation] = useState(false);
  const [localMediaReady, setLocalMediaReady] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const callIntervalRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const initializationStartedRef = useRef(false);

  const API_BASE_URL = 'http://localhost:8080/api/v1/common';
  const SOCKET_URL = 'http://localhost:8080';

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           localStorage.getItem('accessToken') ||
           localStorage.getItem('userToken') || '';
  };

  const playVideo = (videoElement, stream = null) => {
    if (!videoElement) return;
    
    if (stream && videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }
    
    setTimeout(() => {
      if (videoElement.srcObject && videoElement.paused) {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Video play prevented:', error.name);
          });
        }
      }
    }, 100);
  };

  const handleRemoteStream = useRef((remoteStream) => {
    console.log('🔄 handleRemoteStream called with:', remoteStream);
    
    if (!remoteStream) {
      console.log('⚠️ No remote stream provided');
      return;
    }
    
    const videoTracks = remoteStream.getVideoTracks();
    const audioTracks = remoteStream.getAudioTracks();
    
    console.log('📊 Remote stream info:', {
      videoTracks: videoTracks.length,
      audioTracks: audioTracks.length,
      active: remoteStream.active
    });
    
    remoteStreamRef.current = remoteStream;
    setHasRemoteStream(true);
    
    if (remoteVideoRef.current) {
      console.log('🎬 Setting remote video srcObject');
      remoteVideoRef.current.srcObject = remoteStream;
      
      remoteVideoRef.current.onloadedmetadata = () => {
        console.log('✅ Remote video metadata loaded');
        playVideo(remoteVideoRef.current);
      };
      
      remoteVideoRef.current.oncanplay = () => {
        console.log('✅ Remote video can play');
        playVideo(remoteVideoRef.current);
      };
      
      playVideo(remoteVideoRef.current);
    }
  }).current;

  // Initialize call
  useEffect(() => {
    console.log('🎯 Starting video call for:', candidate?.name);
    
    if (!candidate?.applicationId) {
      setError('No candidate information');
      return;
    }

    // Prevent multiple initializations
    if (initializationStartedRef.current && !isRetrying) return;
    initializationStartedRef.current = true;

    const initializeCall = async () => {
      try {
        setIsLoading(true);
        setError('');
        setCallStatus('initializing');
        setIsRetrying(false); // Reset retry flag

        const token = getAuthToken();
        if (!token) {
          setError('Please log in again');
          setCallStatus('failed');
          setIsLoading(false);
          return;
        }

        console.log('🔌 Setting up WebSocket...');
        setupWebSocket();

        console.log('🎥 Getting media stream...');
        await initializeMediaStream();

        console.log('📡 Starting call via API...');
        try {
          const response = await axios.post(
            `${API_BASE_URL}/applications/${candidate.applicationId}/start-call`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 8000
            }
          );
          
          console.log('✅ API success:', response.data);
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          console.log('🔄 Setting up WebRTC...');
          initializeWebRTCPeer();
          
          console.log('📤 Sending offer...');
          await sendOffer();
          
          setCallStatus('ringing');
          startCallTimer();
          
          connectionTimeoutRef.current = setTimeout(() => {
            if (!hasRemoteStream && callStatus === 'connected') {
              console.log('⚠️ No video after 10s, checking connection...');
              checkConnection();
            }
          }, 10000);
          
        } catch (apiError) {
          console.error('❌ API Error:', apiError);
          
          // ONLY join existing call if NOT retrying
          if (apiError.response?.status === 400 && !isRetrying) {
            console.log('📞 Joining existing call...');
            
            await waitForSocketConnection();
            
            initializeWebRTCPeer();
            
            socketRef.current.emit('requestOffer', {
              applicationId: candidate.applicationId,
              userId: localStorage.getItem('userId') || 'recruiter-' + Date.now()
            });
            
            setCallStatus('connecting');
            startCallTimer();
          } else {
            throw apiError;
          }
        }
        
      } catch (err) {
        console.error('❌ Call init error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to start call');
        setCallStatus('failed');
      } finally {
        setIsLoading(false);
      }
    };

    const checkConnection = () => {
      if (peerRef.current?.peerConnection) {
        console.log('🔍 Checking connection state:', {
          connectionState: peerRef.current.peerConnection.connectionState,
          iceState: peerRef.current.peerConnection.iceConnectionState,
          signalingState: peerRef.current.peerConnection.signalingState,
          hasRemoteStream: !!remoteStreamRef.current
        });
        
        if (peerRef.current.peerConnection.connectionState === 'connected' && !hasRemoteStream) {
          console.log('🔄 Connection established but no video, resending offer...');
          sendOffer();
        }
      }
    };

    initializeCall();

    return () => {
      cleanupCall();
      initializationStartedRef.current = false;
    };
  }, [candidate?.applicationId]);

  const waitForSocketConnection = () => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.connected) {
        resolve();
        return;
      }
      
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkConnection = () => {
        if (socketRef.current?.connected) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkConnection, 100);
        } else {
          reject(new Error('Socket connection timeout'));
        }
      };
      
      checkConnection();
    });
  };

  const sendOffer = async () => {
    if (!peerRef.current) {
      console.error('❌ No peer connection');
      return;
    }
    
    try {
      console.log('📤 Creating offer...');
      const offer = await peerRef.current.createOffer();
      
      if (socketRef.current?.connected) {
        console.log('📡 Sending offer...');
        socketRef.current.emit('webrtcOffer', {
          offer: offer,
          applicationId: candidate.applicationId,
          to: 'user'
        });
        console.log('✅ Offer sent');
      } else {
        console.error('❌ Socket not connected');
        setTimeout(() => {
          if (socketRef.current?.connected) {
            sendOffer();
          }
        }, 1000);
      }
    } catch (err) {
      console.error('❌ Error sending offer:', err);
    }
  };

  const setupWebSocket = () => {
    const token = getAuthToken();
    
    console.log('🔌 Setting up WebSocket...');
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    const socketOptions = {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {}
    };
    
    if (token) {
      socketOptions.query = {
        token: token,
        role: 'recruiter',
        applicationId: candidate.applicationId,
        userId: localStorage.getItem('userId') || 'recruiter-' + Date.now()
      };
    }
    
    const socket = io(SOCKET_URL, socketOptions);
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setSocketConnected(true);
      setError('');
      
      socket.emit('joinApplicationRoom', {
        applicationId: candidate.applicationId,
        userId: localStorage.getItem('userId') || 'recruiter-' + Date.now(),
        role: 'recruiter'
      });
    });
    
    socket.on('roomJoined', (data) => {
      console.log('✅ Room joined:', data);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket error:', error);
      setSocketConnected(false);
    });
    
    socket.on('disconnect', () => {
      console.log('⚠️ Socket disconnected');
      setSocketConnected(false);
    });
    
    socket.on('callAccepted', (data) => {
      console.log('✅ Call accepted by user');
      setCallStatus('connected');
    });
    
    socket.on('callRejected', () => {
      console.log('❌ Call rejected');
      setCallStatus('rejected');
      setError('Candidate rejected');
      setTimeout(() => cleanupAndClose(), 2000);
    });
    
    socket.on('webrtcAnswer', async (answerData) => {
      console.log('📨 Received answer');
      if (peerRef.current && answerData.answer) {
        try {
          await peerRef.current.setRemoteDescription(answerData.answer);
          console.log('✅ Answer processed');
          setCallStatus('connected');
          
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
        } catch (err) {
          console.error('❌ Error processing answer:', err);
          if (err.message.includes('stable')) {
            console.log('ℹ️ Connection already established');
            setCallStatus('connected');
          }
        }
      }
    });
    
    socket.on('iceCandidate', async (candidateData) => {
      console.log('🧊 Received ICE candidate');
      if (peerRef.current && candidateData.candidate) {
        await peerRef.current.addIceCandidate(candidateData.candidate);
      }
    });
    
    socket.on('requestOffer', async (data) => {
      console.log('📨 User requested offer');
      if (peerRef.current) {
        await sendOffer();
      }
    });
    
    socket.on('callEnded', () => {
      console.log('📞 Call ended by user');
      setCallStatus('ended');
      setError('Candidate ended call');
      setTimeout(() => cleanupAndClose(), 3000);
    });
    
    socket.on('screenShareStarted', (data) => {
      console.log('📺 User started screen sharing');
      setIsViewingPresentation(true);
    });
    
    socket.on('screenShareStopped', (data) => {
      console.log('📺 User stopped screen sharing');
      setIsViewingPresentation(false);
    });
  };

  const initializeMediaStream = async () => {
    try {
      console.log('🎥 Getting media...');
      
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media obtained');
      
      localStreamRef.current = stream;
      setLocalMediaReady(true);
      
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      
      if (audioTrack) setIsMuted(!audioTrack.enabled);
      if (videoTrack) setIsCameraOn(videoTrack.enabled);
      
      if (localVideoRef.current) {
        console.log('🎬 Setting local video srcObject');
        localVideoRef.current.srcObject = stream;
        
        localVideoRef.current.onloadedmetadata = () => {
          console.log('✅ Local video metadata loaded');
          playVideo(localVideoRef.current);
        };
        
        playVideo(localVideoRef.current);
      }
      
    } catch (err) {
      console.error('❌ Media error:', err);
      let errorMessage = 'Cannot access camera/microphone. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone access.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera/microphone found.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const initializeWebRTCPeer = () => {
    if (!localStreamRef.current) {
      throw new Error('No local stream');
    }

    console.log('🔄 Initializing WebRTC...');
    peerRef.current = new WebRTCPeer();
    
    peerRef.current.onRemoteStream = (remoteStream) => {
      console.log('📡 WebRTC: onRemoteStream callback fired');
      handleRemoteStream(remoteStream);
    };
    
    peerRef.current.onConnectionStateChange = (state) => {
      console.log('🔄 WebRTC Connection state:', state);
      setConnectionState(state);
      
      if (state === 'connected') {
        console.log('🎉 WebRTC connection established!');
        setCallStatus('connected');
        setError('');
        
        if (remoteVideoRef.current && remoteStreamRef.current) {
          setTimeout(() => {
            console.log('🔄 Attempting to play remote video after connection');
            playVideo(remoteVideoRef.current);
          }, 500);
        }
      }
    };
    
    peerRef.current.onIceCandidate = (candidate) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('iceCandidate', {
          candidate: candidate,
          applicationId: candidate.applicationId,
          to: 'user'
        });
      }
    };
    
    peerRef.current.initialize(localStreamRef.current);
    
    console.log('🔍 Peer connection initialized:', {
      signalingState: peerRef.current.peerConnection.signalingState,
      iceConnectionState: peerRef.current.peerConnection.iceConnectionState,
      connectionState: peerRef.current.peerConnection.connectionState
    });
  };

  const startCallTimer = () => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
    }
    callIntervalRef.current = setInterval(() => {
      setCallTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const cleanupCall = () => {
    console.log('🧹 Cleaning up...');
    
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
      callIntervalRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Stopping local ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        console.log(`Stopping remote ${track.kind} track`);
        track.stop();
      });
      remoteStreamRef.current = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.pause();
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.pause();
    }
    
    setHasRemoteStream(false);
    setConnectionState('disconnected');
    setIsScreenShared(false);
    setIsViewingPresentation(false);
    setLocalMediaReady(false);
    initializationStartedRef.current = false;
  };

  const cleanupAndClose = () => {
    cleanupCall();
    if (onClose) onClose();
  };

  // FIXED: New retry function that starts fresh call
  const retryConnection = async () => {
    console.log('🔄 Retrying connection...');
    setError('');
    setIsLoading(true);
    setIsRetrying(true); // Set retry flag
    setCallStatus('reconnecting');
    
    // First cleanup everything
    cleanupCall();
    
    // Short delay before starting fresh
    setTimeout(async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token');
        }

        // Start fresh call - don't join existing
        console.log('🚀 Starting fresh call on retry...');
        
        // Setup WebSocket
        setupWebSocket();
        
        // Get media stream
        await initializeMediaStream();
        
        // Start new call via API
        try {
          const response = await axios.post(
            `${API_BASE_URL}/applications/${candidate.applicationId}/start-call`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 8000
            }
          );
          
          console.log('✅ API success on retry:', response.data);
          
          // Wait a bit for socket
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Setup WebRTC
          initializeWebRTCPeer();
          
          // Send new offer
          await sendOffer();
          
          setCallStatus('ringing');
          startCallTimer();
          setIsRetrying(false); // Reset retry flag
          
          // Set timeout for connection
          connectionTimeoutRef.current = setTimeout(() => {
            if (!hasRemoteStream && callStatus === 'connected') {
              console.log('⚠️ No video after 10s on retry');
            }
          }, 10000);
          
        } catch (apiError) {
          console.error('❌ API Error on retry:', apiError);
          
          // On retry, always start fresh - don't join existing
          if (apiError.response?.status === 400) {
            console.log('🔄 Retry: Call already exists, ending it first...');
            
            // Try to end the existing call first
            try {
              await axios.post(
                `${API_BASE_URL}/applications/${candidate.applicationId}/end-call`,
                {},
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  timeout: 3000
                }
              );
              console.log('✅ Ended existing call, retrying...');
              
              // Wait a bit and retry
              setTimeout(() => {
                retryConnection();
              }, 1000);
              return;
            } catch (endError) {
              console.log('⚠️ Could not end existing call:', endError.message);
              // Continue anyway
            }
          }
          
          throw apiError;
        }
        
      } catch (err) {
        console.error('❌ Retry failed:', err);
        setError('Retry failed: ' + (err.message || 'Unknown error'));
        setCallStatus('failed');
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleEndCall = async () => {
    try {
      setIsLoading(true);
      
      if (socketRef.current?.connected) {
        socketRef.current.emit('endCall', {
          applicationId: candidate.applicationId,
          reason: 'Recruiter ended'
        });
      }
      
      const token = getAuthToken();
      try {
        await axios.post(
          `${API_BASE_URL}/applications/${candidate.applicationId}/end-call`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (apiErr) {
        console.warn('API error on end call:', apiErr.message);
      }
      
      setTimeout(() => cleanupAndClose(), 500);
      
    } catch (err) {
      console.error('End call error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks[0]) {
        const newState = !audioTracks[0].enabled;
        audioTracks[0].enabled = newState;
        setIsMuted(!newState);
        
        if (peerRef.current) {
          peerRef.current.toggleMicrophone(newState);
        }
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks[0]) {
        const newState = !videoTracks[0].enabled;
        videoTracks[0].enabled = newState;
        setIsCameraOn(newState);
        
        if (peerRef.current) {
          peerRef.current.toggleCamera(newState);
        }
      }
    }
  };

  // Screen sharing functionality
  const toggleScreenShare = async () => {
    try {
      if (!isScreenShared) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor'
          },
          audio: false
        });

        if (peerRef.current) {
          await peerRef.current.startScreenShare(screenStream);
          setIsScreenShared(true);
          
          if (socketRef.current?.connected) {
            socketRef.current.emit('screenShareStarted', {
              applicationId: candidate.applicationId,
              presenter: localStorage.getItem('userId') || 'recruiter-' + Date.now()
            });
          }
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
            playVideo(localVideoRef.current);
          }
          
          screenStream.getVideoTracks()[0].onended = () => {
            stopScreenShare();
          };
        }
      } else {
        await stopScreenShare();
      }
    } catch (err) {
      console.error('❌ Error sharing screen:', err);
      if (err.name !== 'NotAllowedError') {
        setError('Failed to share screen: ' + err.message);
      }
      setIsScreenShared(false);
    }
  };

  const stopScreenShare = async () => {
    if (peerRef.current) {
      await peerRef.current.stopScreenShare();
      setIsScreenShared(false);
      
      if (socketRef.current?.connected) {
        socketRef.current.emit('screenShareStopped', {
          applicationId: candidate.applicationId
        });
      }
      
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        playVideo(localVideoRef.current);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUserInteraction = () => {
    if (remoteVideoRef.current && remoteVideoRef.current.paused) {
      playVideo(remoteVideoRef.current);
    }
    
    if (localVideoRef.current && localVideoRef.current.paused) {
      playVideo(localVideoRef.current);
    }
  };

  if (!candidate) return null;

  return (
    <div className={styles.callOverlay} onClick={handleUserInteraction}>
      <div className={`${styles.callWindow} ${isViewingPresentation ? styles.presentationMode : ''}`}>
        <header className={styles.callHeader}>
          <div className={styles.callInfo}>
            <h3><FaUserIcon /> {candidate.name}</h3>
            <p><MdBusiness /> {candidate.position}</p>
            <div className={styles.callTimer}>
              {callTime > 0 && <><FaClock /> {formatTime(callTime)}</>}
              {callStatus === 'initializing' && <><FaSpinner /> Starting...</>}
              {callStatus === 'reconnecting' && <><FaSync /> Reconnecting...</>}
              {callStatus === 'ringing' && <><IoPhonePortrait /> Calling...</>}
              {callStatus === 'connecting' && <><FaSync /> Connecting...</>}
              {callStatus === 'connected' && !hasRemoteStream && <><RiSignalWifiLine /> Getting video...</>}
              {callStatus === 'connected' && hasRemoteStream && <><FaCheckCircle /> Connected</>}
              {isScreenShared && <><MdScreenShare /> Sharing Screen</>}
              {isViewingPresentation && <><IoEye /> Viewing Presentation</>}
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleEndCall}
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </header>

        <div className={styles.videoArea}>
          {/* Remote video */}
          <div className={styles.remoteVideo}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={styles.remoteVideoElement}
              onClick={(e) => {
                e.stopPropagation();
                playVideo(remoteVideoRef.current);
              }}
            />
            
            {!hasRemoteStream && callStatus === 'connected' && (
              <div className={styles.connectingOverlay}>
                <div className={styles.connectingSpinner}></div>
                <p>Establishing video connection...</p>
                <p className={styles.connectingHint}>Click Retry to restart connection</p>
                <button 
                  className={styles.retryButton}
                  onClick={retryConnection}
                  disabled={isLoading}
                >
                  {isLoading ? <FaSpinner /> : <FaSync />} {isLoading ? 'Retrying...' : 'Retry Connection'}
                </button>
              </div>
            )}
            
            {callStatus === 'ringing' && (
              <div className={styles.ringingOverlay}>
                <div className={styles.ringingAnimation}>
                  <div className={styles.ringingCircle}></div>
                  <div className={styles.ringingCircle}></div>
                  <div className={styles.ringingCircle}></div>
                </div>
                <h3>Calling Candidate</h3>
                <p>Waiting for {candidate.name} to answer...</p>
              </div>
            )}
            
            {isViewingPresentation && (
              <div className={styles.presentationOverlay}>
                <div className={styles.presentationBadge}>
                  <span><IoLaptop /></span>
                  <span>Viewing Candidate's Screen</span>
                </div>
              </div>
            )}
            
            <div className={styles.remoteLabel}>
              <FaUserCircle /> {candidate.name} • Candidate
              {hasRemoteStream && <FaBroadcastTower />}
              {hasRemoteStream && ' Live'}
              {isViewingPresentation && <IoEye />}
              {isViewingPresentation && ' Viewing Screen'}
            </div>
          </div>

          {/* Local video */}
          <div className={styles.selfPreview}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={styles.selfVideoElement}
              onClick={(e) => {
                e.stopPropagation();
                playVideo(localVideoRef.current);
              }}
            />
            <div className={styles.selfVideoOverlay}>
              {!isCameraOn && !isScreenShared && (
                <div className={styles.cameraOffOverlay}>
                  <span><FaVideoSlash /></span>
                  <span>Camera off</span>
                </div>
              )}
              {isScreenShared && (
                <div className={styles.screenShareOverlay}>
                  <span><MdScreenShare /></span>
                  <span>Sharing Screen</span>
                </div>
              )}
              {isMuted && (
                <div className={styles.muteIndicator}>
                  <span><FaMicrophoneSlash /></span>
                  <span>Muted</span>
                </div>
              )}
              {!localMediaReady && (
                <div className={styles.cameraLoading}>
                  <span><FaSpinner /></span>
                  <span>Loading camera...</span>
                </div>
              )}
              <span className={styles.selfLabel}>
                <FaUserIcon /> You • Recruiter
                {isScreenShared && <MdScreenShare />}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controlsBar}>
          <div className={styles.leftControls}>
            <button
              type="button"
              className={`${styles.controlButton} ${isMuted ? styles.controlOff : ''}`}
              onClick={toggleMute}
              disabled={isLoading}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <span className={styles.controlIcon}>
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </span>
              <span className={styles.controlLabel}>
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.controlButton} ${!isCameraOn ? styles.controlOff : ''}`}
              onClick={toggleCamera}
              disabled={isLoading || isScreenShared}
              title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
            >
              <span className={styles.controlIcon}>
                {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
              </span>
              <span className={styles.controlLabel}>
                {isCameraOn ? 'Stop Video' : 'Start Video'}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.controlButton} ${isScreenShared ? styles.controlActive : ''}`}
              onClick={toggleScreenShare}
              disabled={isLoading}
              title={isScreenShared ? "Stop screen sharing" : "Share screen"}
            >
              <span className={styles.controlIcon}>
                {isScreenShared ? <MdStopScreenShare /> : <MdScreenShare />}
              </span>
              <span className={styles.controlLabel}>
                {isScreenShared ? 'Stop Share' : 'Share'}
              </span>
            </button>
          </div>

          <button
            type="button"
            className={styles.endCallButton}
            onClick={handleEndCall}
            disabled={isLoading}
          >
            <MdCallEnd /> End Call
          </button>
        </div>

        {/* Status */}
        <div className={styles.statusBar}>
          <div className={styles.statusItem}>
            <span className={`${styles.statusDot} ${
              connectionState === 'connected' ? styles.connected : 
              ['connecting', 'ringing', 'reconnecting'].includes(callStatus) ? styles.connecting : 
              styles.disconnected
            }`}></span>
            <span className={styles.statusText}>
              {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
              {!socketConnected && ' • Connecting...'}
              {callStatus === 'connected' && !hasRemoteStream && ' • Establishing video...'}
              {isScreenShared && ' • Sharing screen'}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorMessage}>
            <div className={styles.errorHeader}>
              <span><FaExclamationTriangle /></span>
              <span>Connection Issue</span>
            </div>
            <div className={styles.errorDetails}>
              {error}
            </div>
            <div className={styles.errorActions}>
              <button 
                type="button" 
                className={styles.retryButton}
                onClick={retryConnection}
                disabled={isLoading}
              >
                {isLoading ? <FaSpinner /> : <FaSync />} {isLoading ? 'Retrying...' : 'Start New Call'}
              </button>
              <button 
                type="button" 
                className={styles.refreshButton}
                onClick={() => window.location.reload()}
              >
                <FaSync /> Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>
              {callStatus === 'initializing' && 'Starting call...'}
              {callStatus === 'reconnecting' && 'Reconnecting...'}
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'ringing' && 'Calling candidate...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;