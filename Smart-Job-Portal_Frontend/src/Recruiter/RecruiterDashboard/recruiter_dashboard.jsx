import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import styles from './recruiter_dashboard.module.css';
import Navbar from './recruiter_navbar';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8080/api/v1/recruiter/jobs';

// Map backend job -> UI job shape
const mapApiJobToUiJob = (apiJob) => {
  if (!apiJob) return null;

  const {
    _id,
    title,
    company,
    description,
    cat_name,
    experience,
    salary,
    jobType,
    location,
    postDate,
    endDate,
    jobAppliedCount,
    closed,
    status
  } = apiJob;

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const computeStatus = () => {
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

  // Normalize status: ensure it's either "Active" or "Closed"
  let normalizedStatus = computeStatus();
  if (normalizedStatus === 'Expired' || (normalizedStatus !== 'Active' && normalizedStatus !== 'Closed')) {
    normalizedStatus = 'Closed';
  }

  return {
    id: _id,
    jobName: title || '',
    company: company || '',
    description: description || cat_name || '',
    experience: experience || '',
    salary: salary || '',
    location: location || '',
    applications: typeof jobAppliedCount === 'number' ? jobAppliedCount : 0,
    status: normalizedStatus,
    startDate: formatDate(postDate),
    endDate: formatDate(endDate),
    jobType: jobType || ''
  };
};

const JobManagement = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    location: '',
    experience: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  // Fetch jobs from backend on mount
  useEffect(() => {
    const controller = new AbortController();

    const fetchJobs = async () => {
      try {
        const token =
          localStorage.getItem('authToken') || localStorage.getItem('token');

        const res = await axios.get(API_BASE, {
          signal: controller.signal,
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        const apiJobs = Array.isArray(res.data?.data) ? res.data.data : [];
        if (apiJobs.length) {
          const mapped = apiJobs
            .map(mapApiJobToUiJob)
            .filter(Boolean);
          setJobs(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch recruiter jobs', error);
        // Keep initial mocked jobs as graceful fallback
      }
    };

    fetchJobs();

    return () => controller.abort();
  }, []);

  // Get unique values for filter dropdowns based on current jobs
  const statusOptions = useMemo(
    () => ['All', ...new Set(jobs.map(job => job.status).filter(Boolean))],
    [jobs]
  );
  const locationOptions = useMemo(
    () => ['All', ...new Set(jobs.map(job => job.location).filter(Boolean))],
    [jobs]
  );
  const experienceOptions = useMemo(
    () => ['All', ...new Set(jobs.map(job => job.experience).filter(Boolean))],
    [jobs]
  );

  // Filter jobs based on criteria
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || filters.status === 'All' || job.status === filters.status;
      const matchesLocation = !filters.location || filters.location === 'All' || job.location === filters.location;
      const matchesExperience = !filters.experience || filters.experience === 'All' || job.experience === filters.experience;

      return matchesSearch && matchesStatus && matchesLocation && matchesExperience;
    });
  }, [jobs, searchTerm, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      location: '',
      experience: ''
    });
    setSearchTerm('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#43A046';
      case 'Closed': return '#E53935';
      default: return '#263238';
    }
  };

  const getActions = (status) => {
    switch (status) {
      case 'Active': return ['View', 'Edit', 'Delete'];
      default: return ['View', 'Edit', 'Delete'];
    }
  };

  const handleViewJob = (jobId) => {
    if (!jobId) return;
    navigate(`/viewpostedjob/${jobId}`);
  };

  const handleDeleteClick = (jobId, jobName) => {
    setJobToDelete({ id: jobId, name: jobName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      // Delete the job on the backend using its id
      const token =
        localStorage.getItem('authToken') || localStorage.getItem('token');

      await axios.delete(`${API_BASE}/${jobToDelete.id}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
    } catch (error) {
      console.error('Failed to delete job on server', error);
      // Even if backend fails, still optimistically remove from UI
    }

    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobToDelete.id));
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  return (
    <>
      <Navbar/>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Job Management</h1>
          <p className={styles.subtitle}>Manage and track all job listings</p>
        </header>

        {/* Filters Section */}
        <div className={styles.filtersSection}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search jobs or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              list="jobSuggestions"
            />
            
            
            {/* Data list for suggestions */}
            <datalist id="jobSuggestions">
              {jobs.map(job => (
                <option key={job.id} value={job.jobName}>
                  {job.description}
                </option>
              ))}
            </datalist>
          </div>

          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label>Status</label>
              {/* <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Status</option>
                {statusOptions.filter(opt => opt !== 'All').map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select> */}
              <input
                type="text"
                placeholder="Type status (Active, Closed)"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className={styles.filterInput}
                list="statusSuggestions"
              />
              <datalist id="statusSuggestions">
                {statusOptions.filter(s => s !== 'All').map(status => (
                  <option key={status} value={status} />
                ))}
              </datalist>
            </div>

            <div className={styles.filterGroup}>
              <label>Location</label>
              {/* <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Locations</option>
                {locationOptions.filter(opt => opt !== 'All').map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select> */}
              <input
                type="text"
                placeholder="Type location (Bangalore, Remote)"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className={styles.filterInput}
                list="locationSuggestions"
              />
              <datalist id="locationSuggestions">
                {locationOptions.filter(l => l !== 'All').map(location => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>

            <div className={styles.filterGroup}>
              <label>Experience</label>
              {/* <select
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Experience</option>
                {experienceOptions.filter(opt => opt !== 'All').map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select> */}
              <input
                type="text"
                placeholder="Type experience (2-4 years)"
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
                className={styles.filterInput}
                list="experienceSuggestions"
              />
              <datalist id="experienceSuggestions">
                {experienceOptions.filter(e => e !== 'All').map(exp => (
                  <option key={exp} value={exp} />
                ))}
              </datalist>
            </div>

            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>

          <div className={styles.resultsInfo}>
            <span>Showing {filteredJobs.length} of {jobs.length} jobs</span>
            {Object.values(filters).some(f => f) && (
              <span className={styles.activeFilters}>
                Active filters: {Object.entries(filters)
                  .filter(([_, value]) => value)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Jobs Table */}
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.jobsTable}>
              <thead>
                <tr>
                  <th>Job Name</th>
                  {/* <th>Description</th> */}
                  <th>Experience</th>
                  <th>Salary</th>
                  <th>Location</th>
                  <th>Applications</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, index) => (
                  <tr 
                    key={job.id} 
                    className={styles.jobRow}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className={styles.jobName}>
                      <strong>{job.jobName}</strong>
                    </td>
                    {/* <td className={styles.description}>
                      {job.description}
                    </td> */}
                    <td className={styles.experience}>
                      {job.experience}
                    </td>
                    <td className={styles.salary}>
                      <span className={styles.salaryBadge}>{job.salary}</span>
                    </td>
                    <td className={styles.location}>
                      <span className={styles.locationBadge}>{job.location}</span>
                    </td>
                    <td className={styles.applications}>
                      <span className={styles.appCount}>{job.applications}</span>
                    </td>
                    <td>
                      <span 
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(job.status) }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className={styles.date}>{job.startDate}</td>
                    <td className={styles.date}>{job.endDate}</td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          onClick={() => handleViewJob(job.id)}
                          className={`${styles.actionButton} ${styles.viewButton}`}
                        >
                          View
                        </button>
                        <Link to={`/editjob/${job.id}`}>
                          <button className={`${styles.actionButton} ${styles.editButton}`}>
                            Edit
                          </button>
                        </Link>
                        
                        <button 
                          onClick={() => handleDeleteClick(job.id, job.jobName)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredJobs.length === 0 && (
              <div className={styles.noResults}>
                <p>No jobs found matching your filters.</p>
                <button onClick={clearFilters} className={styles.clearButton}>
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button className={styles.paginationButton} disabled>
            ← Previous
          </button>
          <span className={styles.pageInfo}>
            Page <strong>1</strong> of <strong>1</strong>
          </span>
          <button className={styles.paginationButton} disabled>
            Next →
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>✓</div>
            <h3 className={styles.modalTitle}>Successfully Deleted!</h3>
            <p className={styles.modalMessage}>
              The job "<strong>{jobToDelete?.name}</strong>" has been successfully deleted.
            </p>
            <div className={styles.modalActions}>
              <button 
                onClick={confirmDelete}
                className={`${styles.modalButton} ${styles.modalConfirm}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobManagement;