import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EditProfileModal from "./EditProfileRecruiter";
import styles from "./RecruiterProfile.module.css";
import { AiOutlineArrowLeft } from "react-icons/ai";

// API Constants
const BASE_URL = "http://localhost:8080/api/v1/recruiter";
const RECRUITER_API = {
  // ----------- PROFILE ----------
  UPDATE_PROFILE: (id) => `${BASE_URL}/recruiter-update/${id}`,
  GET_PROFILE: (id) => `${BASE_URL}/recruiter_profile/${id}`,
  
  // Add work category API endpoint
  GET_WORK_CATEGORY: (id) => `${BASE_URL}/work-category/${id}`,

  // ----------- EXPERIENCE ----------
  ADD_EXPERIENCE: (recruiterId) =>
    `${BASE_URL}/recruiter/${recruiterId}/experience/add`,

  UPDATE_EXPERIENCE: (recruiterId, experienceId) =>
    `${BASE_URL}/recruiter/${recruiterId}/experience/${experienceId}/update`,

  DELETE_EXPERIENCE: (recruiterId, experienceId) =>
    `${BASE_URL}/recruiter/${recruiterId}/experience/${experienceId}/delete`,

  // ----------- EDUCATION ----------
  ADD_EDUCATION: (recruiterId) =>
    `${BASE_URL}/recruiter/${recruiterId}/education/add`,

  UPDATE_EDUCATION: (recruiterId, educationId) =>
    `${BASE_URL}/recruiter/${recruiterId}/education/${educationId}/update`,

  DELETE_EDUCATION: (recruiterId, educationId) =>
    `${BASE_URL}/recruiter/${recruiterId}/education/${educationId}/delete`,

};

/* ================= Experience Section ================= */

function SectionExperience({ experience = [] }) {
  if (!experience || experience.length === 0) {
    return (
      <p className={styles.experienceEmpty}>
        No experience listed yet.
      </p>
    );
  }

  const getMonth = (monthVal) => {
    if (!monthVal) return "";
    if (typeof monthVal === "string") return monthVal;
    if (typeof monthVal === "object")
      return monthVal.month || monthVal.name || "";
    return String(monthVal);
  };

  const getYear = (yearVal) => {
    if (!yearVal) return "";
    if (typeof yearVal === "string" || typeof yearVal === "number")
      return String(yearVal);
    if (typeof yearVal === "object")
      return String(yearVal.year || yearVal.name || "");
    return "";
  };

  return (
    <div className={styles.experienceCardsWrap}>
      {experience.map((exp, i) => {
        const startMonth = getMonth(exp.start_date?.month);
        const startYear = getYear(exp.start_date?.year);
        const start = `${startMonth} ${startYear}`.trim();

        const isPresent =
          exp.present === true ||
          (!exp.end_date?.month && !exp.end_date?.year) ||
          exp.end_date === null;

        const end = isPresent
          ? "Present"
          : (() => {
              const endMonth = getMonth(exp.end_date?.month);
              const endYear = getYear(exp.end_date?.year);
              return `${endMonth} ${endYear}`.trim();
            })();

        return (
          <div
            key={exp._id || exp.id || i}
            className={styles.experienceCard}
          >
            <div className={styles.experienceCardHeader}>
              <div>
                <h4 className={styles.experienceRole}>{exp.role}</h4>
                <p className={styles.experienceCompany}>{exp.company}</p>
                <p className={styles.experienceDuration}>
                  {start && end ? `${start} — ${end}` : start || end || ""}
                </p>
              </div>
            </div>

            {exp.description ? (
              <p className={styles.experienceDescription}>
                {exp.description}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ================= Education Section ================= */

function SectionEducation({ education = [] }) {
  if (!education || education.length === 0) {
    return (
      <p className={styles.educationEmpty}>
        No education records added yet.
      </p>
    );
  }

  return (
    <div className={styles.educationCardsWrap}>
      {education.map((e, i) => (
        <div
          key={e._id || e.id || i}
          className={styles.educationCard}
        >
          <div className={styles.educationCardHeader}>
            <div>
              <h4 className={styles.educationDegree}>{e.degree}</h4>
              <p className={styles.educationInstitution}>
                {e.institution}
              </p>
              <p className={styles.educationDuration}>
                {(() => {
                  // Handle year object with various properties
                  const yearVal = e?.year || e?.passoutyear;
                  if (!yearVal) return "";
                  // If it's a plain string/number, avoid rendering raw ObjectId-like values
                  if (typeof yearVal === "string" || typeof yearVal === "number") {
                    const str = String(yearVal);
                    // Hide raw 24-char hex ObjectId strings (they are not human-readable years)
                    if (/^[0-9a-fA-F]{24}$/.test(str)) return "";
                    return str;
                  }
                  if (typeof yearVal === "object" && yearVal !== null) {
                    return String(yearVal.passoutyear || yearVal.year || yearVal.name || yearVal.value || "");
                  }
                  return String(yearVal);
                })()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= Main Profile ================= */

export default function RecruiterProfile(user) {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to fetch work category details if only ID is provided
  const fetchWorkCategoryDetails = async (workCatId, token) => {
    if (!workCatId || typeof workCatId !== 'string') return workCatId;
    
    try {
      // If it's already an object, return it
      if (typeof workCatId === 'object') return workCatId;
      
      // If it's a string ID, try to fetch the category details
      const response = await axios.get(RECRUITER_API.GET_WORK_CATEGORY(workCatId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const categoryData = response?.data?.data || response?.data;
      if (categoryData) {
        return {
          _id: workCatId,
          ...categoryData
        };
      }
      
      // If fetching fails, return object with ID
      return { _id: workCatId };
    } catch (err) {
      console.warn("Could not fetch work category details:", err);
      return { _id: workCatId };
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        let recruiterId = localStorage.getItem("userId") || localStorage.getItem("recruiterId");
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        if (!token) {
          setError("Authentication token not found. Please login again.");
          setLoading(false);
          return;
        }

        // If recruiter ID is not in localStorage, try to extract it from JWT token
        if (!recruiterId) {
          try {
            // Decode JWT token to extract recruiter ID
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              recruiterId = payload.id || payload._id || payload.userId || payload.recruiterId;
            }
          } catch (tokenError) {
            console.warn("Could not decode token:", tokenError);
          }
        }

        // If still no recruiter ID, try to get it from the API response
        if (!recruiterId) {
          const userEmail = localStorage.getItem("userEmail");
          if (userEmail) {
            setError("Recruiter ID not found. Please login again.");
            setLoading(false);
            return;
          } else {
            setError("Recruiter ID not found. Please login again.");
            setLoading(false);
            return;
          }
        }

        const response = await axios.get(RECRUITER_API.GET_PROFILE(recruiterId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.data && response.data.success) {
          let profileData = response.data.data || response.data;
          
          // Extract and store recruiter ID from profile response if not already stored
          const profileId = profileData._id || profileData.id;
          if (profileId && !localStorage.getItem("userId") && !localStorage.getItem("recruiterId")) {
            localStorage.setItem("userId", profileId);
            localStorage.setItem("recruiterId", profileId);
          }
          
          // Store email if available
          if (profileData.email && !localStorage.getItem("userEmail")) {
            localStorage.setItem("userEmail", profileData.email);
          }
          
          // Fetch work category details if workCat is a string ID
          if (profileData.workCat && typeof profileData.workCat === 'string' && profileData.workCat.trim() !== '') {
            profileData.workCat = await fetchWorkCategoryDetails(profileData.workCat, token);
          }
          
          setCompany(profileData);
        } else {
          setError(response.data?.message || "Failed to load recruiter profile");
        }
      } catch (err) {
        console.error("Error fetching recruiter profile:", err);
        
        // If 401/403, it might be token issue, try to extract ID from error response
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setError("Authentication failed. Please login again.");
        } else if (err?.response?.status === 404) {
          setError("Recruiter profile not found. Please check your account.");
        } else {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load recruiter profile. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Refresh profile when modal is closed after editing
  useEffect(() => {
    if (!editOpen) {
      // Refetch profile data when edit modal closes
      const refetchProfile = async () => {
        try {
          const recruiterId = localStorage.getItem("userId") || localStorage.getItem("recruiterId");
          const token = localStorage.getItem("authToken") || localStorage.getItem("token");
          
          if (recruiterId && token) {
            const response = await axios.get(RECRUITER_API.GET_PROFILE(recruiterId), {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            
            if (response.data && response.data.success) {
              let profileData = response.data.data || response.data;
              
              // Fetch work category details if workCat is a string ID
              if (profileData.workCat && typeof profileData.workCat === 'string' && profileData.workCat.trim() !== '') {
                profileData.workCat = await fetchWorkCategoryDetails(profileData.workCat, token);
              }
              
              setCompany(profileData);
            }
          }
        } catch (err) {
          console.error("Error refetching profile:", err);
        }
      };
      
      refetchProfile();
    }
  }, [editOpen]);

  // Prevent back-button navigation while recruiter is logged in (keep them on profile)
  useEffect(() => {
    const isRecruiter =
      localStorage.getItem("user_type") === "job_provider" &&
      (localStorage.getItem("authToken") || localStorage.getItem("token"));
    if (!isRecruiter) return;

    window.history.pushState(null, "", window.location.href);
    const onPopState = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (loading)
    return <p style={{ textAlign: "center" }}>Loading recruiter profile...</p>;

  if (error)
    return (
      <p style={{ textAlign: "center", color: "red" }}>
        {error}
      </p>
    );

  if (!company)
    return <p style={{ textAlign: "center" }}>No profile data available.</p>;

  return (
    <div className={styles.recruiterPage}>
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

      {/* Company banner removed per design request */}
      <br></br>
      <br></br>
      <br></br>
      <br></br>

      <div className={styles.companyProfileCard}>
        <div className={styles.companyHeader}>
          <img
            src={
              company.profile_image
                ? company.profile_image.startsWith("http")
                  ? company.profile_image
                  : `http://localhost:8080/public/${company.profile_image}`
                : process.env.PUBLIC_URL + "/Images/Default.png"
            }
            alt="Profile"
            className={styles.userAvatar}
          />

          <div>
            <h2>{company.name}</h2>
            <p className={styles.tagline}>{company.company || ""}</p>
            <p className={styles.location}>{company.email}</p>
            <p className={styles.location}>{company.mobile}</p>
            <p className={styles.location}>
              {company.address}, {company.pin}
            </p>
          </div>

          <button
            className={styles.editBtn}
            onClick={() => setEditOpen(true)}
          >
            Edit Profile
          </button>
        </div>

        <div className={styles.section}>
          <h3>About</h3>
          <p>{company.bio || ""}</p>
        </div>

        <div className={`${styles.section} ${styles.detailsGrid}`}>
          <div><strong>Employee ID:</strong> {company.empId || ""}</div>
          <div><strong>Work Category:</strong> {
            typeof company.workCat === "object" && company.workCat !== null
              ? (company.workCat.cat_name || company.workCat.name || "")
              : (company.workCat || "")
          }</div>
          <div><strong>Designation:</strong> {company.designation || ""}</div>
          <div><strong>Skills:</strong> {
            Array.isArray(company.skillTag)
              ? company.skillTag.map(skill => typeof skill === "object" && skill !== null ? (skill.name || skill.skill || String(skill)) : String(skill)).join(", ")
              : (company.skillTag || "")
          }</div>
        </div>

        <div className={styles.section}>
          <h3>Experience</h3>
          <SectionExperience experience={company.experience} />
        </div>

        <div className={styles.section}>
          <h3>Education</h3>
          <SectionEducation education={company.education} />
        </div>
      </div>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        data={company}
        onSave={(updatedData) => {
          // Update company state with new data
          setCompany(updatedData);
        }}
        type="recruiter"
      />
      <br></br>
    </div>
  );
}