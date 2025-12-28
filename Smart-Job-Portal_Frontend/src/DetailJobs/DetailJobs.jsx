import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import UserNavbar from "../Component/User_Navbar";
import FooterUser from "../Component/User_Footer";
import "./DetailJobs.modules.css";

const API_BASE = "http://localhost:8080/api/v1/admin";
// Backend apply endpoint (matches provided controller)
const APPLY_JOB_API = "http://localhost:8080/api/v1/customer/apply-job";

export default function JobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialJob = location.state?.job;

  const [job, setJob] = useState(initialJob || null);
  const [loading, setLoading] = useState(!initialJob);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (initialJob) return;
    const controller = new AbortController();
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/list-job/${id}`, { signal: controller.signal });
        const payload = res?.data;
        const jobData = payload?.data || payload?.job || payload;
        if (!jobData) {
          setError("Job details not found.");
          return;
        }
        setJob(jobData);
        setError("");
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        setError(err.response?.data?.message || "Unable to load job details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    return () => controller.abort();
  }, [id, initialJob]);

  // Format date function to show only date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    
    try {
      // If it's already in YYYY-MM-DD format
      if (dateString.length === 10 && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "—";
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "—";
    }
  };

  const skills = useMemo(() => {
    if (!job) return [];
    if (Array.isArray(job.skills)) return job.skills.filter(Boolean);
    if (typeof job.skills === "string") {
      return job.skills
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (Array.isArray(job.skillTag)) return job.skillTag.filter(Boolean);
    return [];
  }, [job]);

  const descriptionParagraphs = useMemo(() => {
    const desc = job?.description || job?.jobDescription || "";
    if (!desc) return ["No description provided for this role."];
    return desc
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [job]);

  const handleApply = async () => {
    if (!job?._id && !job?.id) {
      alert("Job id missing. Please reload and try again.");
      return;
    }
    if (applied || applying) return;

    const jobId = job?._id || job?.id;

    // User must be logged in
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Please login to apply for this job.");
      navigate("/login");
      return;
    }

    try {
      setApplying(true);

      const res = await axios.post(
        APPLY_JOB_API,
        { jobId }, // only jobId, userId comes from token on backend
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If success
      setApplied(true);
      console.log("Apply job response:", res.data);
      alert(res?.data?.message || "Application submitted successfully.");
    } catch (err) {
      console.error("Apply job failed:", err);

      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "";

      // Token invalid / expired
      if (status === 401 || status === 403) {
        alert(message || "Please login again to apply for this job.");
        navigate("/login");
        return;
      }

      // Already applied
      if (message.toLowerCase().includes("already applied")) {
        setApplied(true);
        alert(message);
        return;
      }

      // Job or user not found
      if (status === 404) {
        alert(message || "Job or user not found for applying.");
        return;
      }

      // Route not found / wrong URL
      if (status === 404 && !message) {
        alert("Apply API not found. Please confirm the endpoint URL.");
        return;
      }

      // Generic fallback
      alert(message || "Unable to submit application right now. Please try again later.");
    } finally {
      setApplying(false);
    }
  };

  const handleCopy = async () => {
    try {
      const shareLink = `${window.location.origin}/detailjobs/${id}`;
      await navigator.clipboard.writeText(shareLink);
      alert("Link copied to clipboard");
    } catch (err) {
      alert("Unable to copy link right now.");
    }
  };

  const avatarLetter =
    (job?.company || job?.title || "?").toString().trim().charAt(0).toUpperCase() || "?";
  const logoSrc = job?.image || job?.logo || job?.companyLogo || "";

  const salaryDisplay = job?.salary ? `₹ ${job.salary}` : "Not disclosed";
  const locationDisplay = job?.location || "Not specified";
  
  // Format dates to show only date
  const postedOn = formatDate(job?.postDate || job?.createdAt);
  const deadline = formatDate(job?.endDate);
  
  const experience = job?.experience || "Not specified";
  const education = job?.education || job?.qualification || "Not specified";

  return (
    <>
      <UserNavbar />
      <div className="job-page">
        {loading && <div className="job-loading">Loading job details…</div>}
        {error && !loading && <div className="job-error">{error}</div>}

        {!loading && !error && job && (
          <>
            {/* Top header */}
            <header className="job-header">
              <div className="job-header-left">
                {logoSrc && (
                  <img
                    src={logoSrc}
                    alt="Company logo"
                    className="job-logo"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div>
                  <h1 className="job-title">{job?.title || "Job Details"}</h1>
                  <div className="job-company-row">
                    <span className="job-company">@ {job?.company || "Company not specified"}</span>
                    {job?.jobType && <span className="job-badge job-badge-green">{job.jobType}</span>}
                    {job?.cat_name && <span className="job-badge job-badge-orange">{job.cat_name}</span>}
                  </div>
                </div>
              </div>

              <div className="job-header-right">
                <button className="btn-secondary" onClick={() => navigate(-1)}>
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleApply}
                  disabled={applying || applied}
                >
                  {applied ? "Applied" : applying ? "Applying..." : "Apply Now"}
                </button>
              </div>
            </header>

            {/* Main content */}
            <main className="job-main">
              {/* LEFT: description */}
              <section className="job-main-left">
                <h2 className="section-title">Job Description</h2>

                {descriptionParagraphs.map((para, idx) => (
                  <p key={idx} className="job-text">
                    {para}
                  </p>
                ))}

                {skills.length > 0 && (
                  <>
                    <h3 className="section-subtitle">Skills we&apos;re looking for</h3>
                    <div className="skills-wrap">
                      {skills.map((skill) => (
                        <span key={skill} className="skill-pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* RIGHT: sidebar */}
              <aside className="job-main-right">
                {/* Salary + location card */}
                <div className="card salary-card">
                  <div>
                    <div className="card-label">Salary</div>
                    <div className="salary-range">{salaryDisplay}</div>
                    <div className="salary-type">{job?.salaryType || "Yearly salary"}</div>
                  </div>
                  <div className="salary-divider" />
                  <div>
                    <div className="card-label">Job Location</div>
                    <div className="location-text">{locationDisplay}</div>
                  </div>
                </div>

                {/* Overview */}
                <div className="card">
                  <h3 className="card-title">Job Overview</h3>
                  <div className="overview-row">
                    <div className="overview-item">
                      <div className="overview-label">POSTED</div>
                      <div className="overview-value">{postedOn}</div>
                    </div>
                    <div className="overview-item">
                      <div className="overview-label">DEADLINE</div>
                      <div className="overview-value">{deadline}</div>
                    </div>
                  </div>
                  <div className="overview-row">
                    <div className="overview-item">
                      <div className="overview-label">EXPERIENCE</div>
                      <div className="overview-value">{experience}</div>
                    </div>
                    <div className="overview-item">
                      <div className="overview-label">JOB TYPE</div>
                      <div className="overview-value">{job?.jobType || "—"}</div>
                    </div>
                  </div>
                  <div className="overview-row">
                    <div className="overview-item">
                      <div className="overview-label">CATEGORY</div>
                      <div className="overview-value">{job?.cat_name || "—"}</div>
                    </div>
                    <div className="overview-item">
                      <div className="overview-label">EDUCATION</div>
                      <div className="overview-value">{education}</div>
                    </div>
                  </div>
                </div>

                {/* Share */}
                {/* <div className="card">
                  <h3 className="card-title">Share this job:</h3>
                  <div className="share-row">
                    <button className="share-btn" onClick={handleCopy}>
                      Copy Link
                    </button>
                    <div className="social-icons">
                      <span className="social-circle">in</span>
                      <span className="social-circle">f</span>
                      <span className="social-circle">t</span>
                      <span className="social-circle">✉</span>
                    </div>
                  </div>
                </div> */}
              </aside>
            </main>
          </>
        )}
      </div>
      <FooterUser />
    </>
  );
}