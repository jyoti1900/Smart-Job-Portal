import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styles from './viewpostedjob.module.css';

const API_BASE = 'http://localhost:8080/api/v1/recruiter/jobs';

const formatDateForDisplay = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const computeStatusFromEndDate = (endDate, closed, status) => {
    // Backend "status" field has highest priority (enum: ["Active", "Closed"])
    if (status === 'Active' || status === 'Closed') {
        return status;
    }
    
    // Fallback: Backend "closed" flag has priority
    if (
        closed === true ||
        closed === 1 ||
        closed === '1' ||
        String(closed).toLowerCase() === 'true' ||
        String(closed).toLowerCase() === 'closed'
    ) {
        return 'Closed';
    }

    if (!endDate) return 'Active';
    const now = new Date();
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) return 'Active';
    return end >= now ? 'Active' : 'Closed';
};

// Map backend job -> UI job shape for this view page
const mapApiJobToViewJob = (apiJob) => {
    if (!apiJob) return null;

    const {
        _id,
        title,
        company,
        description,
        cat_name,
        experience,
        education,
        salary,
        jobType,
        location,
        skills,
        postDate,
        endDate,
        image,
        closed,
        status
    } = apiJob;

    const skillsArray = Array.isArray(skills)
        ? skills
        : String(skills || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

    // Normalize status: ensure it's either "Active" or "Closed"
    let normalizedStatus = computeStatusFromEndDate(endDate, closed, status);
    if (normalizedStatus === 'Expired' || (normalizedStatus !== 'Active' && normalizedStatus !== 'Closed')) {
        normalizedStatus = 'Closed';
    }

    return {
        id: _id || 'JOB001',
        jobName: title || '',
        companyName: company || '',
        jobDescription: description || '',
        category: cat_name || '',
        experience: experience || '',
        education: education || '',
        salary: salary || '',
        jobType: jobType || '',
        location: location || '',
        skills: skillsArray,
        status: normalizedStatus,
        postedDate: formatDateForDisplay(postDate),
        applicationDeadline: formatDateForDisplay(endDate),
        // Backend already returns full absolute URL for image, so use directly
        companyLogo: image || ''
    };
};

const ViewJob = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const fetchJobDetails = async () => {
            try {
                setLoading(true);

                const token =
                    localStorage.getItem('authToken') || localStorage.getItem('token');

                if (!token) {
                    alert('Authentication token not found. Please login again.');
                    setJob(null);
                    setLoading(false);
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };
                let rawData = null;

                try {
                    // Try direct job-by-id endpoint first (if backend supports it)
                    const url = jobId ? `${API_BASE}/${jobId}` : API_BASE;
                    const res = await axios.get(url, {
                        signal: controller.signal,
                        headers
                    });

                    if (Array.isArray(res.data?.data)) {
                        const list = res.data.data;
                        rawData =
                            (jobId &&
                                (list.find(
                                    (j) =>
                                        j?._id === jobId ||
                                        j?.id === jobId ||
                                        String(j?._id) === String(jobId)
                                ) ||
                                    null)) ||
                            list[0] ||
                            null;
                    } else {
                        rawData = res.data?.data || null;
                    }
                } catch (primaryError) {
                    console.warn('Primary job details request failed, trying fallback list:', primaryError);
                }

                // Fallback: fetch full list and pick matching job
                if (!rawData) {
                    const resList = await axios.get(API_BASE, {
                        signal: controller.signal,
                        headers
                    });
                    const list = Array.isArray(resList.data?.data)
                        ? resList.data.data
                        : [];
                    rawData =
                        (jobId &&
                            (list.find(
                                (j) =>
                                    j?._id === jobId ||
                                    j?.id === jobId ||
                                    String(j?._id) === String(jobId)
                            ) ||
                                null)) ||
                        list[0] ||
                        null;
                }

                const mapped = mapApiJobToViewJob(rawData);
                setJob(mapped);
            } catch (error) {
                console.error('Failed to fetch job details', error);
                setJob(null);
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetails();

        return () => controller.abort();
    }, [jobId]);

    const handleEditJob = () => {
        if (!job?.id) return;
        navigate(`/editjob/${job.id}`);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link to="/recruiterdashboard" className={styles.linkWrapper}>
                        <button className={styles.backButton}>
                            <span className={styles.backIcon}>←</span>
                            Go Back
                        </button>
                    </Link>
                    <h1 className={styles.title}>
                        <span className={styles.titleView}>View</span>
                        <span className={styles.titleDetails}> Job Details</span>
                    </h1>
                </div>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner} />
                    <p className={styles.loadingText}>Loading job details...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link to="/recruiterdashboard" className={styles.linkWrapper}>
                        <button className={styles.backButton}>
                            <span className={styles.backIcon}>←</span>
                            Go Back
                        </button>
                    </Link>
                    <h1 className={styles.title}>
                        <span className={styles.titleView}>View</span>
                        <span className={styles.titleDetails}> Job Details</span>
                    </h1>
                </div>
                <div className={styles.loadingContainer}>
                    <p className={styles.loadingText}>No job data found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link to="/recruiterdashboard" className={styles.linkWrapper}>
                    <button className={styles.backButton}>
                        <span className={styles.backIcon}>←</span>
                        Go Back
                    </button>
                </Link>
                <h1 className={styles.title}>
                    <span className={styles.titleView}>View</span>
                    <span className={styles.titleDetails}> Job Details</span>
                </h1>
            </div>

            {/* <p className={styles.subtitle}>
                Complete job information and requirements
            </p> */}

            <div className={styles.jobCardContainer}>
                <div className={styles.jobCard}>
                    {/* Job Header */}
                    <div className={styles.jobHeader}>
                        <div className={styles.headerContent}>
                            <div className={styles.companyLogoContainer}>
                                <img 
                                    src={job.companyLogo} 
                                    alt={`${job.companyName} logo`} 
                                    className={styles.companyLogo}
                                />
                            </div>
                            
                            <div className={styles.jobTitleSection}>
                                <div className={styles.jobId}>Job ID: {job.id}</div>
                                <h2 className={styles.jobTitle}>{job.jobName}</h2>
                                <h3 className={styles.companyName}>{job.companyName}</h3>
                                
                                <div className={styles.jobMeta}>
                                    <div className={styles.metaTag}>
                                        
                                        {job.location}
                                    </div>
                                    <div className={styles.metaTag}>
                                        
                                        {job.salary}
                                    </div>
                                    <div className={styles.metaTag}>
                                        
                                        {job.jobType}
                                    </div>
                                    <div className={`${styles.statusBadge} ${styles[job.status === 'Active' ? 'statusActive' : 'statusClosed']}`}>
                                        <span>{job.status === 'Active' ? '✅' : '❌'}</span>
                                        {job.status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Job Body */}
                    <div className={styles.jobBody}>
                        {/* Job Description */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                Job Description
                            </h3>
                            <div className={styles.description}>
                                {job.jobDescription.split('\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                Requirements
                            </h3>
                            <div className={styles.requirementsGrid}>
                                <div className={styles.requirementCard}>
                                    <div className={styles.requirementLabel}>Experience</div>
                                    <div className={styles.requirementValue}>{job.experience}</div>
                                </div>
                                <div className={styles.requirementCard}>
                                    <div className={styles.requirementLabel}>Education</div>
                                    <div className={styles.requirementValue}>{job.education}</div>
                                </div>
                                <div className={styles.requirementCard}>
                                    <div className={styles.requirementLabel}>Category</div>
                                    <div className={styles.requirementValue}>{job.category}</div>
                                </div>
                            </div>
                        </div>

                        {/* Job Details */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                Job Details
                            </h3>
                            <div className={styles.requirementsGrid}>
                                <div className={styles.requirementCard}>
                                    <div className={styles.requirementLabel}>Job Type</div>
                                    <div className={styles.requirementValue}>{job.jobType}</div>
                                </div>
                                <div className={styles.requirementCard}>
                                    <div className={styles.requirementLabel}>Location</div>
                                    <div className={styles.requirementValue}>{job.location}</div>
                                </div>
                                <div className={styles.requirementCard}>
                                    <div className={styles.requirementLabel}>Posted Date</div>
                                    <div className={styles.requirementValue}>{job.postedDate}</div>
                                </div>
                                <div className={styles.requirementCard}>
                                    <div className={styles.requirementLabel}>Deadline</div>
                                    <div className={styles.requirementValue}>{job.applicationDeadline}</div>
                                </div>
                            </div>
                        </div>

                        {/* Skills Required */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                Skills Required
                            </h3>
                            <div className={styles.skillsContainer}>
                                {job.skills.map((skill, index) => (
                                    <div key={index} className={styles.skillTag}>
                                        <span>✓</span>
                                        {skill}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        <Link to={job.id ? `/editjob/${job.id}` : '#'} className={styles.linkWrapper}>
                            <button onClick={handleEditJob} className={`${styles.actionButton} ${styles.editButton}`}>
                                Edit Job
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewJob;