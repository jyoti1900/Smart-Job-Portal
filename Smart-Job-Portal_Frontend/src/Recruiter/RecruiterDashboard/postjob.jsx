import React, { useState } from 'react';
import axios from 'axios';
import styles from './postjob.module.css';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8080/api/v1/recruiter/jobs';

const JobPost = () => {
    const [formData, setFormData] = useState({
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
        endDate: ''
    });
    
    const [currentSkill, setCurrentSkill] = useState('');
    const [companyLogo, setCompanyLogo] = useState(null);
    const [preview, setPreview] = useState(null);

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
        setPreview(null);
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
            // Map frontend fields -> backend keys (Postman image)
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
            // Backend expects text for skills -> send comma-separated
            if (formData.skills.length) {
                payload.append('skills', formData.skills.join(', '));
            }
            if (companyLogo) {
                payload.append('image', companyLogo);
            }
            // New jobs are open (closed = false) by default
            payload.append('closed', 'false');

            const res = await axios.post(API_BASE, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            });

            alert(res.data?.message || 'Job posted successfully!');
        
            setFormData({
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
                endDate: ''
            });
            setCompanyLogo(null);
            setPreview(null);
            setCurrentSkill('');
        } catch (error) {
            console.error('Failed to post job', error);
            // Show backend error message if available
            const message =
                error.response?.data?.message ||
                'Failed to post job. Please try again.';
            alert(message);
        }
    };

    const handleReset = () => {
        setFormData({
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
            endDate: ''
        });
        setCompanyLogo(null);
        setPreview(null);
        setCurrentSkill('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.target.name === 'currentSkill') {
            e.preventDefault();
            handleSkillAdd();
        }
    };

    return (
        <div className={styles.container}>
            {/* Go Back Button */}
            <div className={styles.backButtonContainer}>
                <Link to="/recruiterdashboard" className={styles.backButton}>
                    ← Go Back
                </Link>
            </div>

            <div className={styles.titleContainer}>
                <h1 className={styles.title}>
                    <span className={styles.titlePart1}>Post a Job on</span>
                    <span className={styles.titlePart2}> KaajKhojo</span>
                </h1>
            </div>
            <p className={styles.subtitle}>
                Find the perfect candidate for your company. Fill in the details below to post your job opening.
            </p>
            
            <div className={styles.formContainer}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Job Information Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Job Information</h2>
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
                        <h2 className={styles.sectionTitle}>Requirements</h2>
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
                        <h2 className={styles.sectionTitle}>Job Type</h2>
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
                                    <label htmlFor={`jobType-${type}`} className={styles.jobTypeLabel}>
                                        {type}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Location</h2>
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
                        <h2 className={styles.sectionTitle}>Skills Required</h2>
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
                                className={styles.addSkillButton}
                            >
                                Add Skill
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
                        <h2 className={styles.sectionTitle}>Company Logo</h2>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>COMPANY LOGO (PNG/JPG only)</label>
                            
                            {preview ? (
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
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.fileUpload}>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className={styles.fileInput}
                                    />
                                    <div style={{ textAlign: 'center' }}>
                                        <div className={styles.uploadText}>Upload Logo</div>
                                        <div className={styles.fileTypeText}>PNG or JPG only</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className={styles.buttons}>
                        <button 
                            type="button" 
                            onClick={handleReset}
                            className={styles.resetButton}
                        >
                            Reset Form
                        </button>
                        <button 
                            type="submit" 
                            className={styles.submitButton}
                        >
                            Post Job Now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobPost;