// src/SectionApplicationDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "./UserProfile.module.css";
import ChatApplication from "./userChat";
import UserVideoCall from "./userVideoCall"; // Import UserVideoCall component

// 🔧 change if your route is different
const APPLICATIONS_API = "http://localhost:8080/api/v1/customer/applications";

export default function SectionApplicationDetails() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
    const [chatCandidate, setChatCandidate] = useState(null);
    const [videoCallRecruiter, setVideoCallRecruiter] = useState(null);
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [perPage] = useState(4);

    const total = applications.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    // =========================
    // Fetch applications from backend
    // =========================
    const closeChat = () => {
        setIsChatOpen(false);
        setChatCandidate(null);
    };

    const closeVideoCall = () => {
        setIsVideoCallOpen(false);
        setVideoCallRecruiter(null);
        setSelectedApplicationId(null);
    };

    const openChat = (job) => {
        const chatCandidate = {
            applicationId: job._id || job.id || job.applicationId,
            id: job._id || job.id || job.applicationId,
            name: job.company || "Recruiter",
            position: job.jobName || job.title || "Job Application",
            company: job.company || "",
            jobName: job.jobName || job.title || "",
            chatEnabled: job.chatEnabled || false
        };
        setChatCandidate(chatCandidate);
        setIsChatOpen(true);
    };

    const openVideoCall = (job) => {
        console.log("Opening video call for job:", job);
        
        // Prepare recruiter data
        const recruiterData = {
            id: job.recruiterId || job.companyId || `recruiter-${job._id}`,
            name: job.company || "Recruiter",
            company: job.company || "",
            position: job.jobName || job.title || "Job Application"
        };
        
        // Get application ID
        const applicationId = job._id || job.id || job.applicationId;
        
        setVideoCallRecruiter(recruiterData);
        setSelectedApplicationId(applicationId);
        setIsVideoCallOpen(true);
    };

    useEffect(() => {
        const controller = new AbortController();

        const fetchApplications = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("authToken") || localStorage.getItem("token");
                if (!token) {
                    setError("Please login to view your applications.");
                    setApplications([]);
                    return;
                }

                const res = await axios.get(APPLICATIONS_API, {
                    signal: controller.signal,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Expected backend response:
                // { success: true, data: [ ... ], total: number }
                const payload = res?.data;
                const list = payload?.data || [];

                setApplications(list);
            } catch (err) {
                if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;

                const msg =
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err.message ||
                    "Unable to load applications.";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();

        return () => controller.abort();
    }, []);

    // slice the data for the current page
    const paged = useMemo(() => {
        const start = (page - 1) * perPage;
        return applications.slice(start, start + perPage);
    }, [applications, page, perPage]);

    // map status -> CSS module class (camelCase names used in module)
    const statusClassMap = {
        Applied: styles.statusApplied,
        Rejected: styles.statusRejected,
        "In Progress": styles.statusInProgress,
        Selected: styles.statusSelected
    };

    // helper to merge css module classes safely
    const mergeClass = (...cls) => cls.filter(Boolean).join(" ");

    return (
        <div className={styles.applicationDetailsContainer}>
            <h2 className={styles.sectionHeading}>Application details</h2>

            <div className={styles.cardContainer}>
                <div className={styles.card}>
                    <div className={mergeClass(styles.cardTitle, styles.appCount)}>
                        Total Jobs Applied: {total}
                    </div>
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: "center", padding: 16 }}>Loading applications…</div>
            )}

            {error && !loading && (
                <div style={{ textAlign: "center", padding: 16, color: "red" }}>{error}</div>
            )}

            {!loading && !error && (
                <>
                    <table className={mergeClass(styles.applicationTable, styles.appTable)}>
                        <thead>
                            <tr>
                                <th>Sl no.</th>
                                <th>Job Name</th>
                                <th>Status</th>
                                <th>Company</th>
                                <th>Applied Date</th>
                                <th>Job Type</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: 16 }}>
                                        No applications found
                                    </td>
                                </tr>
                            ) : (
                                paged.map((job, idx) => {
                                    // Check if job is selected - enable buttons only when status is "Selected"
                                    const isSelected = job.status === "Selected";
                                    
                                    return (
                                        <tr key={job.id}>
                                            <td>{(page - 1) * perPage + idx + 1}</td>
                                            <td>{job.jobName}</td>
                                            <td>
                                                <span
                                                    className={mergeClass(
                                                        styles.statusTag || styles.statusBadge,
                                                        statusClassMap[job.status]
                                                    )}
                                                >
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td>{job.company}</td>
                                            <td>{job.appliedDate}</td>
                                            <td>{job.jobType}</td>
                                            <td>
                                                {/* Show action buttons only for non-rejected applications */}
                                                {job.status !== "Rejected" && (
                                                    <div className={styles.actionButtons}>
                                                        {/* Video Call Button - enabled only when selected */}
                                                        <button
                                                            className={mergeClass(
                                                                styles.videoCallButton,
                                                                styles.actionBtn,
                                                                styles.videoBtn
                                                            )}
                                                            disabled={!isSelected}
                                                            onClick={() => isSelected && openVideoCall(job)}
                                                            title={isSelected ? "Start Video Call" : "Available only for selected applications"}
                                                            style={{
                                                                opacity: isSelected ? 1 : 0.5,
                                                                cursor: isSelected ? "pointer" : "not-allowed"
                                                            }}
                                                        >
                                                            <span className={styles.buttonText}>Video</span>
                                                        </button>
                                                        
                                                        {/* Chat Button - enabled only when selected */}
                                                        <button
                                                            className={mergeClass(
                                                                styles.chatButton,
                                                                styles.actionBtn,
                                                                styles.chatBtn
                                                            )}
                                                            disabled={!isSelected}
                                                            onClick={() => isSelected && openChat(job)}
                                                            title={isSelected ? "Start Chat" : "Available only for selected applications"}
                                                            style={{
                                                                opacity: isSelected ? 1 : 0.5,
                                                                cursor: isSelected ? "pointer" : "not-allowed"
                                                            }}
                                                        >
                                                            <span className={styles.buttonText}>Chat</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* Pagination controls */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 12,
                            marginTop: 12
                        }}
                    >
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            style={{
                                padding: "8px 16px",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                                background: page === 1 ? "#f5f5f5" : "#fff",
                                cursor: page === 1 ? "not-allowed" : "pointer"
                            }}
                        >
                            Prev
                        </button>

                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span>
                                Page {page} of {totalPages}
                            </span>
                            {totalPages <= 7 && (
                                <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                                    {Array.from({ length: totalPages }).map((_, i) => {
                                        const pnum = i + 1;
                                        return (
                                            <button
                                                key={pnum}
                                                onClick={() => setPage(pnum)}
                                                style={{
                                                    padding: "4px 8px",
                                                    borderRadius: 6,
                                                    border:
                                                        pnum === page
                                                            ? "2px solid #4caf50"
                                                            : "1px solid #ddd",
                                                    background: pnum === page ? "#eaf8ef" : "#fff",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {pnum}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                            style={{
                                padding: "8px 16px",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                                background: page === totalPages ? "#f5f5f5" : "#fff",
                                cursor: page === totalPages ? "not-allowed" : "pointer"
                            }}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {/* User Chat Component */}
            {isChatOpen && chatCandidate && (
                <ChatApplication candidate={chatCandidate} onClose={closeChat} />
            )}

            {/* Video Call Component - Fixed props */}
            {isVideoCallOpen && videoCallRecruiter && selectedApplicationId && (
                <UserVideoCall 
                    recruiter={videoCallRecruiter} 
                    applicationId={selectedApplicationId}
                    onClose={closeVideoCall}
                />
            )}
        </div>
    );
}