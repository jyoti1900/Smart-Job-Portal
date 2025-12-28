import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './editjob.module.css';
import { Link } from 'react-router-dom';

// API base for recruiter jobs
const API_BASE = 'http://localhost:8080/api/v1/recruiter/jobs';
// Default job id from backend docs for edit API
const DEFAULT_EDIT_JOB_ID = '6940441545770640c0ac47c7';
// Use the public folder image path for the default logo (no import)
const defaultLogoPath = process.env.PUBLIC_URL + '/images/defult.png';

const formatDateInput = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD for <input type="date">
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

// Map backend job -> edit form shape
const mapApiJobToEditForm = (apiJob) => {
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
    if (normalizedStatus === 'Expired' || normalizedStatus !== 'Active' && normalizedStatus !== 'Closed') {
        normalizedStatus = 'Closed';
    }

    return {
        id: _id || '',
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
        postedDate: formatDateInput(postDate),
        endDate: formatDateInput(endDate),
        // Backend already returns full absolute URL for image
        companyLogo: image || null
    };
};

const EMPTY_JOB_DATA = {
    id: '',
    jobName: '',
    companyName: '',
    jobDescription: '',
    category: '',
    experience: '',
    education: '',
    salary: '',
    jobType: '',
    location: '',
    skills: [],
    status: 'Active',
    postedDate: '',
    endDate: '',
    companyLogo: null
};

const EditJob = () => {
    // Get job ID from URL params
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState(EMPTY_JOB_DATA);
    const [originalFormData, setOriginalFormData] = useState(null);
    const [currentSkill, setCurrentSkill] = useState('');
    const [companyLogo, setCompanyLogo] = useState(null);
    const [preview, setPreview] = useState(defaultLogoPath);

    // Fetch job data from API for editing
    useEffect(() => {
        const controller = new AbortController();

        const fetchJobForEdit = async () => {
            try {
                const token =
                    localStorage.getItem('authToken') || localStorage.getItem('token');

                if (!token) {
                    alert('Authentication token not found. Please login again.');
                    setFormData(EMPTY_JOB_DATA);
                    setOriginalFormData(EMPTY_JOB_DATA);
                    setPreview(defaultLogoPath);
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                const targetId = jobId || DEFAULT_EDIT_JOB_ID;
                let rawData = null;

                try {
                    // Try direct job-by-id endpoint first
                    const res = await axios.get(`${API_BASE}/${targetId}`, {
                        signal: controller.signal,
                        headers
                    });

                    if (Array.isArray(res.data?.data)) {
                        const list = res.data.data;
                        rawData =
                            (list.find(
                                (j) =>
                                    j?._id === targetId ||
                                    j?.id === targetId ||
                                    String(j?._id) === String(targetId)
                            ) ||
                                list[0] ||
                                null);
                    } else {
                        rawData = res.data?.data || null;
                    }
                } catch (primaryError) {
                    console.warn('Primary edit job request failed, trying fallback list:', primaryError);
                }

                // Fallback: fetch full list of jobs and pick matching one
                if (!rawData) {
                    const resList = await axios.get(API_BASE, {
                        signal: controller.signal,
                        headers
                    });
                    const list = Array.isArray(resList.data?.data)
                        ? resList.data.data
                        : [];
                    rawData =
                        list.find(
                            (j) =>
                                j?._id === targetId ||
                                j?.id === targetId ||
                                String(j?._id) === String(targetId)
                        ) || list[0] || null;
                }

                const mapped = mapApiJobToEditForm(rawData);
                if (mapped) {
                    setFormData(mapped);
                    setOriginalFormData(mapped);
                    setPreview(mapped.companyLogo || defaultLogoPath);
                } else {
                    setFormData(EMPTY_JOB_DATA);
                    setOriginalFormData(EMPTY_JOB_DATA);
                    setPreview(defaultLogoPath);
                }
            } catch (error) {
                console.error('Failed to load job for editing', error);
                setFormData(EMPTY_JOB_DATA);
                setOriginalFormData(EMPTY_JOB_DATA);
                setPreview(defaultLogoPath);
            }
        };

        fetchJobForEdit();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId]);

    // Go back function
    const handleGoBack = () => {
        navigate(-1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSkillAdd = () => {
        if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, currentSkill.trim()]
            }));
            setCurrentSkill('');
        }
    };

    const handleSkillRemove = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                alert('Only JPG and PNG files are allowed!');
                return;
            }
            
            setCompanyLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoRemove = () => {
        setCompanyLogo(null);
        setPreview(defaultLogoPath);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token =
                localStorage.getItem('authToken') || localStorage.getItem('token');

            if (!token) {
                alert('Authentication required. Please login as recruiter again.');
                return;
            }

            const payload = new FormData();
            // Map frontend fields -> backend keys (same as post job)
            payload.append('title', formData.jobName);
            payload.append('company', formData.companyName);
            payload.append('description', formData.jobDescription);
            payload.append('cat_name', formData.category);
            payload.append('experience', formData.experience);
            payload.append('education', formData.education);
            payload.append('salary', formData.salary);
            payload.append('jobType', formData.jobType);
            payload.append('location', formData.location);
            if (formData.endDate) {
                payload.append('endDate', formData.endDate);
            }
            if (formData.skills?.length) {
                payload.append('skills', formData.skills.join(', '));
            }
            if (companyLogo) {
                payload.append('image', companyLogo);
            }
            // Map UI status -> backend "status" field (enum: ["Active", "Closed"])
            const backendStatus = formData.status === 'Closed' ? 'Closed' : 'Active';
            payload.append('status', backendStatus);

            const targetId = jobId || DEFAULT_EDIT_JOB_ID;
            const res = await axios.put(`${API_BASE}/${targetId}`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            alert(res.data?.message || 'Job updated successfully!');
            navigate('/recruiterdashboard');
        } catch (error) {
            console.error('Failed to update job', error);
            const message =
                error.response?.data?.message ||
                'Failed to update job. Please try again.';
            alert(message);
        }
    };

    const handleReset = () => {
        if (originalFormData) {
            setFormData(originalFormData);
            setCurrentSkill('');
            setPreview(originalFormData.companyLogo || defaultLogoPath);
            setCompanyLogo(null);
        } else {
            setFormData(EMPTY_JOB_DATA);
            setCurrentSkill('');
            setPreview(defaultLogoPath);
            setCompanyLogo(null);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? All changes will be lost.')) {
            navigate('/recruiterdashboard');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.target.name === 'currentSkill') {
            e.preventDefault();
            handleSkillAdd();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                {/* <div className={styles.backButtonContainer}>
                    <button 
                        onClick={handleGoBack}
                        className={styles.backButton}
                    >
                        <span className={styles.backIcon}>←</span>
                        Go Back
                    </button>
                </div> */}
                
                {/* <h1 className={styles.title}>
                  <span className='{style.titleedit}'> Edit Job
                 </span> Posting</h1> */}
                <h1 className={styles.title}>
                    <span className={styles.titleEdit}>Edit Job</span>
                    <span className={styles.titlePosting}> Posting</span>
                </h1>
            </div>
            
            <p className={styles.subtitle}>
                Update the job details below. All changes will be reflected immediately.
            </p>
            
            {/* Job Information Banner */}
            <div className={styles.jobInfoBanner}>
                <div className={styles.jobInfoContent}>
                    <div className={styles.jobId}>Job ID: {formData.id}</div>
                    <div className={styles.jobMainInfo}>
                        <div>
                            <h2 className={styles.jobTitle}>{formData.jobName}</h2>
                            <div className={styles.jobCompany}>{formData.companyName}</div>
                        </div>
                        <div className={styles.jobDate}>
                            Posted: {formData.postedDate} | Status: <strong>{formData.status}</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className={styles.formContainer}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Job Information Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Job Information
                        </h2>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>JOB NAME *</label>
                                <input
                                    type="text"
                                    name="jobName"
                                    value={formData.jobName}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="e.g., Senior React Developer"
                                    required
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.label}>COMPANY NAME *</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="e.g., Tech Solutions Inc."
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>JOB DESCRIPTION *</label>
                            <textarea
                                name="jobDescription"
                                value={formData.jobDescription}
                                onChange={handleInputChange}
                                className={styles.textarea}
                                placeholder="Describe the job responsibilities, requirements, and benefits..."
                                required
                            />
                        </div>
                    </div>

                    {/* Requirements Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Requirements
                        </h2>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>CATEGORY</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="e.g., IT, Marketing, Finance"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.label}>EXPERIENCE</label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="e.g., 2-3 years"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.label}>EDUCATION</label>
                                <input
                                    type="text"
                                    name="education"
                                    value={formData.education}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="e.g., Bachelor's Degree"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.label}>SALARY</label>
                                <div className={styles.salaryGroup}>
                                    <span className={styles.currency}>₹</span>
                                    <input
                                        type="text"
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleInputChange}
                                        className={`${styles.input} ${styles.salaryInput}`}
                                        placeholder="e.g., 500,000"
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>APPLICATION DEADLINE (END DATE)</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job Type Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Job Type
                        </h2>
                        <div className={styles.jobTypeGrid}>
                            {['Full Time', 'Part Time', 'Hybrid', 'Remote'].map(type => (
                                <div key={type} className={styles.jobTypeOption}>
                                    <input
                                        type="radio"
                                        id={`jobType-${type}`}
                                        name="jobType"
                                        value={type}
                                        checked={formData.jobType === type}
                                        onChange={handleInputChange}
                                        className={styles.jobTypeRadio}
                                    />
                                    <label 
                                        htmlFor={`jobType-${type}`} 
                                        className={styles.jobTypeLabel}
                                    >
                                        {type}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Section - NEW */}
                    <div className={`${styles.section} ${styles.statusSection}`}>
                        <h2 className={styles.sectionTitle}>
                        Job Status
                        </h2>
                        <div className={styles.statusGrid}>
                            {['Active', 'Closed'].map(status => (
                                <div key={status} className={styles.statusOption}>
                                    <input
                                        type="radio"
                                        id={`status-${status}`}
                                        name="status"
                                        value={status}
                                        checked={formData.status === status}
                                        onChange={handleInputChange}
                                        className={styles.statusRadio}
                                    />
                                    <label 
                                        htmlFor={`status-${status}`} 
                                        className={`${styles.statusLabel} ${styles[status.toLowerCase()]}`}
                                    >
                                        {status}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                            <strong>Active:</strong> Job is accepting applications | 
                            <strong> Closed:</strong> Job is closed for applications
                        </p>
                    </div>

                    {/* Location Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                        Location
                        </h2>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>LOCATION *</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="e.g., Mumbai, Remote, Hybrid"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                        Skills Required
                        </h2>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>SKILLS</label>
                            <input
                                type="text"
                                name="currentSkill"
                                value={currentSkill}
                                onChange={(e) => setCurrentSkill(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className={styles.input}
                                placeholder="Type a skill and press Enter"
                            />
                            <button 
                                type="button" 
                                onClick={handleSkillAdd}
                                className={styles.addSkill}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#43A046',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginTop: '0.5rem'
                                }}
                            >
                                + Add Skill
                            </button>
                        </div>
                        
                        <div className={styles.skillsContainer}>
                            {formData.skills.map((skill, index) => (
                                <div key={index} className={styles.skillTag}>
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => handleSkillRemove(skill)}
                                        className={styles.removeSkill}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Company Logo Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Company Logo
                        </h2>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>COMPANY LOGO (PNG/JPG only)</label>

                            {preview ? (
                                <div className={styles.logoContainer}>
                                    <div className={styles.previewContainer}>
                                        <img
                                            src={preview}
                                            alt="Company Logo Preview"
                                            className={styles.previewImage}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleLogoRemove}
                                            className={styles.removeImage}
                                            title="Remove logo"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* Edit Logo Button */}
                                    <div className={styles.editLogoContainer}>
                                        <label
                                            htmlFor="logo-upload-edit"
                                            className={styles.editLogoButton}
                                        >              Edit Logo
                                        </label>
                                        <input
                                            id="logo-upload-edit"
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            className={styles.fileInputHidden}
                                        />
                                    </div>

                                    <div className={styles.logoNote}>
                                        Recommended size: 200×200 pixels (max 2MB)
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.uploadContainer}>
                                    <label htmlFor="logo-upload" className={styles.fileUpload}>
                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            className={styles.fileInput}
                                        />
                                        <div className={styles.uploadContent}>
                                            <div className={styles.uploadIcon}>📁</div>
                                            <div className={styles.uploadText}>Upload Company Logo</div>
                                            <div className={styles.uploadSubtext}>
                                                PNG or JPG only (max 2MB)
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>            
                    {/* Submit Buttons */}
                    <div className={styles.buttons}>
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            className={styles.cancelButton}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={handleReset}
                            className={styles.resetButton}
                        >
                            Reset Changes
                        </button>
                        
                        <button 
                            type="submit" 
                            className={styles.submitButton}
                        >
                            Update Job
                        </button>
                        
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditJob;