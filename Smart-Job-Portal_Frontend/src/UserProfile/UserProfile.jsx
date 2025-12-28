// src/UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineArrowLeft } from "react-icons/ai";
import styles from "./UserProfile.module.css";
import EditProfileModal from "./EditProfileModal";
import ProfileHeader from "./ProfileHeader";
import SectionAbout from "./SectionAbout";
import SectionSkills from "./SectionSkills";
import SectionExperience from "./SectionExperience";
import SectionProjects from "./SectionProjects";
import SectionCertifications from "./SectionCertifications";
import SectionEducation from "./SectionEducation";
import SectionApplicationDetails from "./SectionApplicationDetails";
import SectionResume from "./SectionResume"; // if present

const API_BASE = "http://localhost:8080/api/v1";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to normalize experience data from API format (start_date/end_date) to display format
  const normalizeExperience = (exp) => {
    if (!exp) return exp;
    const normalized = { ...exp };
    
    // Convert start_date from {month: {...}, year: {...}} to startMonth and startYear
    if (exp.start_date) {
      if (exp.start_date.month) {
        normalized.startMonth = typeof exp.start_date.month === 'object' 
          ? (exp.start_date.month.month || exp.start_date.month.name || exp.start_date.month) 
          : exp.start_date.month;
      }
      if (exp.start_date.year) {
        normalized.startYear = typeof exp.start_date.year === 'object' 
          ? (exp.start_date.year.year || exp.start_date.year.name || String(exp.start_date.year)) 
          : String(exp.start_date.year);
      }
      // For display in SectionExperience component
      normalized.month = normalized.startMonth;
      normalized.year = normalized.startYear;
    }
    
    // Convert end_date from {month: {...}, year: {...}} to endMonth and endYear
    if (exp.end_date) {
      if (exp.end_date.month) {
        normalized.endMonth = typeof exp.end_date.month === 'object' 
          ? (exp.end_date.month.month || exp.end_date.month.name || exp.end_date.month) 
          : exp.end_date.month;
      }
      if (exp.end_date.year) {
        normalized.endYear = typeof exp.end_date.year === 'object' 
          ? (exp.end_date.year.year || exp.end_date.year.name || String(exp.end_date.year)) 
          : String(exp.end_date.year);
      }
    }
    
    // Check if present (if end_date is null or missing, it's present)
    normalized.present = !exp.end_date || exp.present === true;
    
    return normalized;
  };

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const loggedInEmail = localStorage.getItem("userEmail"); // Get stored email from login

      // If userId is missing, try to resolve current user from token via known endpoints
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        const tryEndpoints = [
          `${API_BASE}/customer/user-list`,
          `${API_BASE}/customer/me`,
          `${API_BASE}/customer/profile`
        ];

        for (const ep of tryEndpoints) {
          try {
            const tryRes = await fetch(ep, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` })
              }
            });
            const tryResult = await tryRes.json();
            // If endpoint returned a single user object
            if (tryResult && tryResult.success && tryResult.data) {
              const maybeUser = tryResult.data;
              // If array, take first matching user
              const userObj = Array.isArray(maybeUser) ? maybeUser[0] : maybeUser;
              if (userObj && (userObj._id || userObj.id)) {
                resolvedUserId = userObj._id || userObj.id;
                localStorage.setItem("userId", resolvedUserId);
                if (userObj.email) localStorage.setItem("userEmail", userObj.email);
                break;
              }
            }
          } catch (e) {
            // ignore and try next endpoint
          }
        }

        if (!resolvedUserId) {
          setError("User ID not found. Please login again.");
          setLoading(false);
          return;
        }
      }
      const finalUserId = resolvedUserId;

      if (!token) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/customer/user-list/${finalUserId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          }
        );

        const result = await res.json();
        
        if (result.success && result.data) {
          const userData = result.data;
          
          // Verify email matches logged-in user (if email is stored)
          if (loggedInEmail && userData.email) {
            const userEmailLower = userData.email.toLowerCase().trim();
            const loggedEmailLower = loggedInEmail.toLowerCase().trim();
            
            if (userEmailLower !== loggedEmailLower) {
              setError("User profile email mismatch. Please login again.");
              setLoading(false);
              return;
            }
          }
          
          // Store/update userId and email in localStorage for future use
          if (userData._id || userData.id) {
            localStorage.setItem("userId", userData._id || userData.id);
          }
          if (userData.email) {
            localStorage.setItem("userEmail", userData.email);
          }
          
          // Normalize experience data if present
          const normalizedUser = { ...userData };
          if (normalizedUser.experience && Array.isArray(normalizedUser.experience)) {
            normalizedUser.experience = normalizedUser.experience.map(normalizeExperience);
          }
          setUser(normalizedUser);
        } else {
          setError(result.message || "Failed to load user profile");
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
        setError("An error occurred while loading your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleSave = async (updatedUser) => {
    // Update local state immediately
    setUser(updatedUser);
    
    // Refresh from API to ensure consistency and verify email match
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const loggedInEmail = localStorage.getItem("userEmail");
    
    if (userId && token) {
      try {
        const res = await fetch(
          `${API_BASE}/customer/user-list/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          }
        );
        const result = await res.json();
        if (result.success && result.data) {
          const userData = result.data;
          
          // Verify email matches logged-in user (if email is stored)
          if (loggedInEmail && userData.email) {
            const userEmailLower = userData.email.toLowerCase().trim();
            const loggedEmailLower = loggedInEmail.toLowerCase().trim();
            
            if (userEmailLower !== loggedEmailLower) {
              console.warn("User profile email mismatch detected");
              // Still update the user but log warning
            }
          }
          
          // Update stored email if available
          if (userData.email) {
            localStorage.setItem("userEmail", userData.email);
          }
          
          // Normalize experience data if present
          const normalizedUser = { ...userData };
          if (normalizedUser.experience && Array.isArray(normalizedUser.experience)) {
            normalizedUser.experience = normalizedUser.experience.map(normalizeExperience);
          }
          setUser(normalizedUser);
        }
      } catch (err) {
        console.error("Error refreshing user profile:", err);
        // Keep the updatedUser state even if refresh fails
      }
    }
  };

  // no "Loading profile..." early return. Render safely using fallback.
  const u = user ?? {
    name: "",
    title: "",
    address: "",
    email: "",
    mobile: "",
    about: "",
    skillTag: [],
    experience: [],
    project: [],
    certification: [],
    education: [],
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.userBanner}>
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
          aria-label="Go back"
          title="Go back"
        >
          <AiOutlineArrowLeft size={20} />
          <span className={styles.backLabel}>Go back</span>
        </button>
      </div>
      <br />
      <br />
      <div className={styles.userProfileCard}>
        {loading && (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>Loading profile...</p>
          </div>
        )}
        
        {error && (
          <div style={{ padding: "20px", textAlign: "center", color: "#d32f2f" }}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: "10px", padding: "8px 16px" }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <ProfileHeader user={u} onEdit={() => setEditOpen(true)} hasValidationErrors={hasValidationErrors} />

            <SectionAbout about={u.about} />
            <SectionSkills skills={u.skillTag} />
            <SectionExperience experience={u.experience} />
            <SectionProjects projects={u.project} />
            <SectionCertifications certifications={u.certification} />
            <SectionEducation education={u.education} />
            <SectionResume resume={u.document} />
            <SectionApplicationDetails applications={appliedJobs}/>
          </>
        )}
      </div>

      {editOpen && (
        <EditProfileModal
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setHasValidationErrors(false);
          }}
          data={u}
          onSave={(updated) => {
            handleSave(updated);
            setEditOpen(false);
            setHasValidationErrors(false);
          }}
          onValidationChange={(hasErrors) => setHasValidationErrors(hasErrors)}
          type="user"
        />
      )}
    </div>
  );
}