import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./RecruiterApplications.css";
import {
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  Video,
  Check,
  Ban,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import Navbar from "./recruiter_navbar";
import ChatApplication from "./chat";
import VideoCall from "./videocall";

const API_BASE = 'http://localhost:8080/api/v1/recruiter/job';

// Map backend application -> frontend application shape
const mapApiApplicationToUiApplication = async (apiApp, jobId, token) => {
  if (!apiApp) return null;

  const { _id, status, jobType, chatEnabled, appliedDate, user, userDetails } = apiApp;
  
  // Try to get user details from userDetails first, then fetch if not available
  let userProfile = userDetails;
  
  // If userDetails is not populated or incomplete, fetch user profile using user ObjectId
  if ((!userProfile || !userProfile.name) && user) {
    try {
      console.log('Fetching user profile for user ID:', user);
      
      // Try multiple possible API endpoints
      const endpoints = [
        `http://localhost:8080/api/v1/customer/user-list/${user}`,
        `http://localhost:8080/api/v1/customer/user/${user}`,
        `http://localhost:8080/api/v1/user/${user}`,
        `http://localhost:8080/api/v1/users/${user}`
      ];
      
      let userResponse = null;
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data) {
            userResponse = response;
            console.log('User profile fetched from:', endpoint);
            break;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
          continue;
        }
      }
      
      if (userResponse && userResponse.data) {
        // Handle different response structures
        const data = userResponse.data;
        userProfile = data.data || data.user || data;
      } else {
        console.warn('No user profile found for user:', user);
        // Create a minimal user profile to prevent crash
        userProfile = {
          name: 'Unknown User',
          email: 'N/A',
          mobile: 'N/A',
          profile_image: 'https://via.placeholder.com/150',
          education: [],
          experience: [],
          document: ''
        };
      }
    } catch (error) {
      console.warn('Failed to fetch user profile for user:', user, error);
      // Create a minimal user profile to prevent crash
      userProfile = {
        name: 'Unknown User',
        email: 'N/A',
        mobile: 'N/A',
        profile_image: 'https://via.placeholder.com/150',
        education: [],
        experience: [],
        document: ''
      };
    }
  }

  if (!userProfile) {
    console.warn('No user details found for application:', _id);
    // Return minimal application data to prevent crash
    return {
      id: _id,
      name: 'Unknown User',
      photo: 'https://via.placeholder.com/150',
      position: '',
      company: '',
      date: new Date(appliedDate || Date.now()).toISOString().split('T')[0],
      status: status || 'Applied',
      email: 'N/A',
      phone: 'N/A',
      resume: '',
      experience: 'No experience',
      education: 'Not specified',
      jobPostId: jobId,
      chatEnabled: chatEnabled || false,
      jobType: jobType || '',
      applicationId: _id,
      originalStatus: status
    };
  }

  // Extract user details with fallbacks
  const {
    mobile = 'N/A',
    profile_image = 'https://via.placeholder.com/150',
    name = 'Unknown User',
    email = 'N/A',
    education = [],
    experience = [],
    document = ''
  } = userProfile;

  // Format education array to string
  const educationStr = Array.isArray(education) && education.length > 0
    ? education.map(edu => {
        if (typeof edu === 'string') return edu;
        return `${edu.degree || 'Degree'} from ${edu.institution || 'Institution'}`;
      }).join(', ')
    : 'Not specified';

  // Calculate total experience from experience array
  const experienceStr = Array.isArray(experience) && experience.length > 0
    ? `${experience.length} ${experience.length === 1 ? 'position' : 'positions'}`
    : 'No experience';

  // Format applied date
  const formatDate = (dateString) => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    try {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      return d.toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  };

  // Map backend status to frontend status
  const mapStatus = (backendStatus) => {
    if (!backendStatus) return 'Applied';
    const statusLower = backendStatus.toLowerCase();
    
    if (statusLower === 'selected' || statusLower === 'shortlisted') return 'Selected';
    if (statusLower === 'rejected') return 'Rejected';
    return 'Applied';
  };

  return {
    id: _id,
    name: name,
    photo: profile_image,
    position: '', // Will be filled from job data
    company: '', // Will be filled from job data
    date: formatDate(appliedDate),
    status: mapStatus(status),
    email: email,
    phone: mobile,
    resume: document,
    experience: experienceStr,
    education: educationStr,
    jobPostId: jobId,
    chatEnabled: chatEnabled || false,
    jobType: jobType || '',
    applicationId: _id,
    originalStatus: status
  };
};

export default function RecruiterApplications() {
  // Navbar states
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const profileRef = useRef(null);
  const bellRef = useRef(null);

  const user = {
    name: "Hasanoor zaman",
    email: "admin-01@gmail.com",
    profilePic: "https://via.placeholder.com/40",
  };

  const notifications = [
    { id: 1, text: "New Application Received", time: "2h ago" },
    { id: 2, text: "Candidate Shortlisted", time: "1d ago" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check authentication and prevent back-button navigation while recruiter is logged in
  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    const userType = localStorage.getItem("user_type");
    const isRecruiter = (userType === "job_provider" || userType === "recruiter") && token;
    
    if (!isRecruiter) {
      console.warn("User not authenticated. Redirecting to login...");
      // Optionally redirect to login if not authenticated
      // window.location.href = '/recruiterlogin';
      return;
    }

    window.history.pushState(null, "", window.location.href);
    const onPopState = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("recruiterId");
    localStorage.removeItem("user_type");
    localStorage.removeItem("userEmail");
    Navigate("/", { replace: true });
    window.location.reload();
  };
  const handleBellClick = () => {
    setBellOpen(!bellOpen);
    setHasUnread(false);
  };

  // Application states
  const [filters, setFilters] = useState({
    jobStatus: [], // Multiple selection: Applied, Shortlisted, Rejected
    selectedJobPost: null, // Single selection: Active job post ID
    applyTime: "lastFirst", // Single selection: "lastFirst" or "firstFirst"
  });
  const [openSection, setOpenSection] = useState(new Set(["jobPosts", "jobStatus", "applyTime"]));
  const [selectedApp, setSelectedApp] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatCandidate, setChatCandidate] = useState(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoCandidate, setVideoCandidate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeJobs, setActiveJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsError, setApplicationsError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  // Helper function to validate MongoDB ObjectId
  const isValidObjectId = (id) => {
    if (!id) return false;
    const idStr = String(id);
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(idStr);
  };

  // Fetch jobs from API to get latest data with title field
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (!token) {
          console.warn('No token found, using localStorage jobs as fallback');
          // Fallback to localStorage if no token
          const savedJobs = localStorage.getItem("recruiterJobs");
          if (savedJobs) {
            const jobs = JSON.parse(savedJobs);
            const allJobs = jobs
              .filter((job) => (job.status === "Active" || job.status === "Closed") && isValidObjectId(job.id))
              .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
            setActiveJobs(allJobs);
          }
          return;
        }

        const response = await axios.get('http://localhost:8080/api/v1/recruiter/jobs', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const apiJobs = Array.isArray(response.data?.data) ? response.data.data : [];
        
        if (apiJobs.length > 0) {
          // Map API jobs to UI format, preserving title field
          const mappedJobs = apiJobs
            .map((job) => {
              const { _id, title, company, status, postDate, endDate, closed } = job;
              
              // Compute status
              let jobStatus = status;
              if (!jobStatus || (jobStatus !== 'Active' && jobStatus !== 'Closed')) {
                if (closed === true || closed === 1 || closed === '1' || String(closed).toLowerCase() === 'true') {
                  jobStatus = 'Closed';
                } else if (endDate) {
                  const now = new Date();
                  const end = new Date(endDate);
                  jobStatus = end >= now ? 'Active' : 'Closed';
                } else {
                  jobStatus = 'Active';
                }
              }

              // Format date
              const formatDate = (value) => {
                if (!value) return '';
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) return '';
                return d.toISOString().split('T')[0];
              };

              return {
                id: _id,
                title: title || '', // Preserve title from backend
                jobName: title || '', // Also set jobName for compatibility
                company: company || '',
                status: jobStatus,
                startDate: formatDate(postDate),
                endDate: formatDate(endDate)
              };
            })
            .filter((job) => 
              (job.status === "Active" || job.status === "Closed") && 
              isValidObjectId(job.id)
            )
            .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));

          setActiveJobs(mappedJobs);
          
          // Also update localStorage for other components
          localStorage.setItem("recruiterJobs", JSON.stringify(mappedJobs));
        } else {
          // Fallback to localStorage if API returns no jobs
          const savedJobs = localStorage.getItem("recruiterJobs");
          if (savedJobs) {
            const jobs = JSON.parse(savedJobs);
            const allJobs = jobs
              .filter((job) => (job.status === "Active" || job.status === "Closed") && isValidObjectId(job.id))
              .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
            setActiveJobs(allJobs);
          }
        }
      } catch (error) {
        console.error('Failed to fetch jobs from API, using localStorage:', error);
        // Fallback to localStorage on error
        const savedJobs = localStorage.getItem("recruiterJobs");
        if (savedJobs) {
          const jobs = JSON.parse(savedJobs);
          const allJobs = jobs
            .filter((job) => (job.status === "Active" || job.status === "Closed") && isValidObjectId(job.id))
            .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
          setActiveJobs(allJobs);
        }
      }
    };

    fetchJobs();
  }, []);

  // Set default selected job post when activeJobs are loaded
  useEffect(() => {
    if (activeJobs.length > 0 && !filters.selectedJobPost) {
      setFilters((prev) => ({ ...prev, selectedJobPost: activeJobs[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJobs]);

  // Fetch applications from API when a job is selected
  useEffect(() => {
    const fetchApplications = async () => {
      if (!filters.selectedJobPost) {
        setApplications([]);
        setApplicationsError(null);
        return;
      }

      const jobId = filters.selectedJobPost;
      
      // Validate that jobId is a valid MongoDB ObjectId
      if (!isValidObjectId(jobId)) {
        console.warn('Invalid job ID format. Expected MongoDB ObjectId (24 hex characters), got:', jobId);
        setApplications([]);
        setApplicationsError('Please select a valid job from the list. Invalid job ID format.');
        setLoadingApplications(false);
        return;
      }

      setLoadingApplications(true);
      setApplicationsError(null);

      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (!token) {
          const errorMsg = 'Authentication token not found. Please login again.';
          console.error(errorMsg);
          setApplicationsError(errorMsg);
          setApplications([]);
          setLoadingApplications(false);
          return;
        }

        console.log('Fetching applications for job:', jobId);
        console.log('Using token:', token.substring(0, 20) + '...');

        const response = await axios.get(`${API_BASE}/${jobId}/applicants`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('API Response:', response.data);

        // Handle different response structures
        const apiApplications = Array.isArray(response.data?.data) 
          ? response.data.data 
          : Array.isArray(response.data) 
            ? response.data 
            : [];

        console.log('Extracted applications:', apiApplications);

        if (apiApplications.length === 0) {
          setApplicationsError('No applications found for this job.');
          setApplications([]);
          setLoadingApplications(false);
          return;
        }

        // Find the selected job to get job name (title) and company
        const selectedJob = activeJobs.find(job => job.id === jobId);
        const jobName = selectedJob?.jobName || selectedJob?.title || '';
        const company = selectedJob?.company || '';

        // Map API applications to UI format (with async user profile fetching)
        const mappedApplicationsPromises = apiApplications.map(async (app) => {
          console.log('Processing application:', app._id, 'user:', app.user);
          const mapped = await mapApiApplicationToUiApplication(app, jobId, token);
          if (mapped) {
            mapped.position = jobName;
            mapped.company = company;
            console.log('Mapped application:', mapped);
          } else {
            console.log('Failed to map application:', app._id);
          }
          return mapped;
        });

        const mappedApplications = (await Promise.all(mappedApplicationsPromises)).filter(Boolean);

        console.log('Final mapped applications:', mappedApplications);
        setApplications(mappedApplications);
        setApplicationsError(null);
      } catch (error) {
        console.error('Failed to fetch applications', error);
        
        let errorMessage = 'Failed to load applications';
        
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 401) {
            errorMessage = 'Authentication failed. Please login again.';
          } else if (status === 403) {
            errorMessage = 'You do not have permission to view these applications.';
          } else if (status === 404) {
            errorMessage = 'Job not found or no applications available.';
          } else {
            errorMessage = data?.message || data?.error || `Server error (${status}). Please try again.`;
          }
          
          console.error('Error response:', {
            status,
            data,
            headers: error.response.headers
          });
        } else if (error.request) {
          // Request made but no response received
          errorMessage = 'No response from server. Please check your connection.';
          console.error('No response received:', error.request);
        } else {
          // Error setting up the request
          errorMessage = error.message || 'Failed to load applications';
          console.error('Request setup error:', error.message);
        }
        
        setApplicationsError(errorMessage);
        setApplications([]);
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [filters.selectedJobPost, activeJobs]);

  const toggleSection = (section) => {
    setOpenSection((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleStatusChange = async (id, newStatus) => {
    // Set updating state for this specific application
    setUpdatingStatus(prev => ({ ...prev, [id]: true }));
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        alert('Please login again to update application status');
        return;
      }

      // Validate status is one of the allowed values
      const validStatuses = ["Applied", "Selected", "Rejected"];
      if (!validStatuses.includes(newStatus)) {
        console.error('Invalid status value:', newStatus);
        return;
      }

      // Call the API to update status
      const response = await axios.put(
        `http://localhost:8080/api/v1/recruiter/application/${id}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === id ? { ...app, status: newStatus, animate: true } : app
          )
        );

        // Update selected app if it's currently open
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp(prev => ({
            ...prev,
            status: newStatus
          }));
        }
      } else {
        console.error('Failed to update status:', response.data);
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      
      let errorMessage = 'Failed to update application status';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = 'Your session has expired. Please login again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to update this application.';
        } else if (status === 404) {
          errorMessage = 'Application not found.';
        } else if (status === 400) {
          errorMessage = data?.message || 'Invalid status value.';
        } else {
          errorMessage = data?.message || `Server error (${status}).`;
        }
      }
      
      alert(errorMessage);
    } finally {
      // Reset animation and updating state
      setTimeout(() => {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, animate: false } : app))
        );
        setUpdatingStatus(prev => ({ ...prev, [id]: false }));
      }, 300);
    }
  };

  // Handle job status filter (multiple selection)
  const handleJobStatusToggle = (status) => {
    setIsFiltering(true);
    setFilters((prev) => {
      const currentStatuses = prev.jobStatus || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];
      return { ...prev, jobStatus: newStatuses };
    });
    setTimeout(() => setIsFiltering(false), 300);
  };

  // Handle active job post selection (single selection)
  const handleJobPostSelect = (jobId) => {
    setIsFiltering(true);
    setFilters((prev) => ({ ...prev, selectedJobPost: jobId }));
    setTimeout(() => setIsFiltering(false), 300);
  };

  // Handle apply time filter (single selection)
  const handleApplyTimeSelect = (timeOption) => {
    setIsFiltering(true);
    setFilters((prev) => ({ ...prev, applyTime: timeOption }));
    setTimeout(() => setIsFiltering(false), 300);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setIsFiltering(true);
    const firstActiveJob = activeJobs.length > 0 ? activeJobs[0].id : null;
    setFilters({
      jobStatus: [],
      selectedJobPost: firstActiveJob,
      applyTime: "lastFirst",
    });
    setTimeout(() => setIsFiltering(false), 300);
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter((app) => {
      // Filter by selected job post
      if (filters.selectedJobPost && app.jobPostId !== filters.selectedJobPost) {
        return false;
      }
      // Filter by job status (multiple selection)
      if (filters.jobStatus && filters.jobStatus.length > 0) {
        // Map old status names to new ones if needed
        const appStatus = app.status === "Pending" ? "Applied" : 
                         app.status === "Shortlisted" ? "Selected" : 
                         app.status;
        if (!filters.jobStatus.includes(appStatus)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by apply time filter
      if (filters.applyTime === "lastFirst") {
        // Last applied first (newest first)
        return new Date(b.date) - new Date(a.date);
      } else {
        // First applied first (oldest first)
        return new Date(a.date) - new Date(b.date);
      }
    });

  const handleOpenChat = (application) => {
    setChatCandidate(application);
    setIsChatOpen(true);
  };

  const handleOpenVideo = (application) => {
    setVideoCandidate(application);
    setIsVideoOpen(true);
  };

  return (
    <>
      <Navbar/>
    <div className="applications-container">
      {/* ===== Rest of your original Applications Section ===== */}
      <div className="applications-body">
        <aside className={`filter-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
              <div className="filter-header">
                <h3>Filter</h3>
                <button className="reset-btn" onClick={handleResetFilters}>
                  Reset
                </button>
              </div>

              {/* Job Posts (Active and Closed) - Single Selection */}
              <div className="filter-section">
                <div
                  className="filter-title"
                  onClick={() => toggleSection("jobPosts")}
                >
                  <h4>Job Posts</h4>
                  {openSection.has("jobPosts") ? <ChevronUp /> : <ChevronDown />}
                </div>
                {openSection.has("jobPosts") && (
                  <div className="filter-options fade-in">
                    {activeJobs.length === 0 ? (
                      <p className="no-jobs-text">No jobs available</p>
                    ) : (
                      activeJobs.map((job) => (
                        <label key={job.id} className="radio-label">
                          <input
                            type="radio"
                            name="jobPost"
                            checked={filters.selectedJobPost === job.id}
                            onChange={() => handleJobPostSelect(job.id)}
                          />
                          <span>
                            {job.title || job.jobName || 'Untitled Job'} 
                            <span style={{ marginLeft: '8px', fontSize: '0.85em', color: job.status === 'Active' ? '#43A046' : '#E53935' }}>
                              ({job.status})
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Job Status Filter (Multiple Selection) */}
              <div className="filter-section">
                <div
                  className="filter-title"
                  onClick={() => toggleSection("jobStatus")}
                >
                  <h4>Job Status</h4>
                  {openSection.has("jobStatus") ? <ChevronUp /> : <ChevronDown />}
                </div>
                {openSection.has("jobStatus") && (
                  <div className="filter-options fade-in">
                    {["Applied", "Selected", "Rejected"].map((status) => (
                      <label key={status} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={(filters.jobStatus || []).includes(status)}
                          onChange={() => handleJobStatusToggle(status)}
                        />
                        <span>{status}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Apply Time Filter (Single Selection) */}
              <div className="filter-section">
                <div
                  className="filter-title"
                  onClick={() => toggleSection("applyTime")}
                >
                  <h4>Apply Time</h4>
                  {openSection.has("applyTime") ? <ChevronUp /> : <ChevronDown />}
                </div>
                {openSection.has("applyTime") && (
                  <div className="filter-options fade-in">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="applyTime"
                        checked={filters.applyTime === "lastFirst"}
                        onChange={() => handleApplyTimeSelect("lastFirst")}
                      />
                      <span>Last Applied first</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="applyTime"
                        checked={filters.applyTime === "firstFirst"}
                        onChange={() => handleApplyTimeSelect("firstFirst")}
                      />
                      <span>First Applied first</span>
                    </label>
                  </div>
                )}
              </div>
        </aside>

        {/* Main Section */}
        <main className="applications-main">
          <div className="applications-header">
            <h2>Manage Applications</h2>
          </div>

          <div className={`applications-list ${isFiltering ? "filtering" : ""}`}>
            {loadingApplications ? (
              <div className="no-applications">
                <p>Loading applications...</p>
              </div>
            ) : applicationsError ? (
              <div className="no-applications">
                <p style={{ color: '#E53935', fontWeight: 'bold' }}>Error: {applicationsError}</p>
                {applicationsError.includes('Authentication') || applicationsError.includes('token') ? (
                  <button 
                    onClick={() => window.location.href = '/recruiterlogin'} 
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#43A046',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Go to Login
                  </button>
                ) : null}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="no-applications">
                <p>No applications found matching the selected filters.</p>
                {!filters.selectedJobPost && (
                  <p style={{ marginTop: '10px', color: '#666' }}>
                    Please select a job from the filter sidebar.
                  </p>
                )}
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className={`application-card fade-in-card ${app.animate ? "updated" : ""}`}
                >
                <div className="app-info">
                  <img
                    src={app.photo}
                    alt={app.name}
                    className="candidate-photo"
                  />
                  <div>
                    <h4>{app.name}</h4>
                    {/* <p>
                      <strong>{app.position}</strong> at {app.company}
                    </p> */}
                    <span className={`status-tag ${(app.status === "Pending" ? "Applied" : app.status === "Shortlisted" ? "Selected" : app.status).toLowerCase()}`}>
                      {app.status === "Pending" ? "Applied" : app.status === "Shortlisted" ? "Selected" : app.status}
                    </span>
                  </div>
                </div>
                <div className="app-meta">
                  <p>Applied on: {app.date}</p>
                  {/* <p>Type: {app.type}</p> */}
                </div>
                <div className="app-actions">
                  <button
                    className="view-btn"
                    onClick={() => setSelectedApp(app)}
                    disabled={updatingStatus[app.id]}
                  >
                    View
                  </button>
                  <button
                    className="shortlist-btn"
                    onClick={() => handleStatusChange(app.id, "Selected")}
                    disabled={app.status === "Selected" || updatingStatus[app.id]}
                  >
                    <Check size={16} /> 
                    {updatingStatus[app.id] && app.status === "Selected" ? "Updating..." : 
                     app.status === "Selected" ? "Selected" : "Select"}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleStatusChange(app.id, "Rejected")}
                    disabled={app.status === "Rejected" || updatingStatus[app.id]}
                  >
                    <Ban size={16} /> 
                    {updatingStatus[app.id] && app.status === "Rejected" ? "Updating..." : 
                     app.status === "Rejected" ? "Rejected" : "Reject"}
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Candidate details popup – styled like viewapplication resume popup */}
      {selectedApp && (
        <div className="resumePopup">
          <div className="popupOverlay" onClick={() => setSelectedApp(null)}></div>
          <div className="popupContent" onClick={(e) => e.stopPropagation()}>
            <button
              className="popupCloseBtn"
              onClick={() => setSelectedApp(null)}
              aria-label="Close popup"
            >
              &times;
            </button>

            <div className="popupHeader">
              <h2>{selectedApp.name}</h2>
              <p className="popupSubtitle">
                {selectedApp.position} at {selectedApp.company}
              </p>
            </div>

            <div className="popupBody">
              <div className="resumePreview">
                <div className="resumeHeader">
                  <h3>Candidate Details</h3>
                  <p>
                    {selectedApp.name} has {selectedApp.experience} of experience for the{" "}
                    {selectedApp.position} role at {selectedApp.company}.
                  </p>
                </div>

                <div className="resumeSection">
                  <h4>Contact Information</h4>
                  <ul>
                    <li>
                      <strong>Email:</strong> {selectedApp.email}
                    </li>
                    <li>
                      <strong>Phone:</strong> {selectedApp.phone}
                    </li>
                  </ul>
                </div>

                <div className="resumeSection">
                  <h4>Background</h4>
                  <p>
                    <strong>Education:</strong> {selectedApp.education}
                  </p>
                  
                  <p>
                    <strong>Experience:</strong> {selectedApp.experience}
                  </p>
                  <p>
                    <strong>Applied on:</strong> {selectedApp.date}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`status-tag ${(selectedApp.status === "Pending" ? "Applied" : selectedApp.status === "Shortlisted" ? "Selected" : selectedApp.status).toLowerCase()}`}
                    >
                      {selectedApp.status === "Pending" ? "Applied" : selectedApp.status === "Shortlisted" ? "Selected" : selectedApp.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="popupActions">
                <a
                  href={selectedApp.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="popupPrimaryButton"
                >
                  View Resume
                </a>
                {selectedApp.chatEnabled !== false && (
                  <button
                    className="popupPrimaryButton"
                    onClick={() => handleOpenChat(selectedApp)}
                  >
                    <MessageSquare size={18} /> Chat
                  </button>
                )}
                <button
                  className="popupSecondaryButton"
                  onClick={() => handleOpenVideo(selectedApp)}
                >
                  <Video size={18} /> Video Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1:1 chat popup using ChatApplication */}
      {isChatOpen && chatCandidate && (
        <ChatApplication
          candidate={chatCandidate}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* 1:1 video call popup using VideoCall */}
      {isVideoOpen && videoCandidate && (
        <VideoCall
          candidate={videoCandidate}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </div>
    </>
  );
}