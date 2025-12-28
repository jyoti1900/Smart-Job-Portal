import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./JobsPage.css";

export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [perPage] = useState(5); // show 5 jobs per page
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();

    // ✅ Fetch Jobs from API
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `http://localhost:8080/api/v1/admin/list-job?page=${page}&perPage=${perPage}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("authToken")}`
                        }
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setJobs(data.data);
                    setTotal(data.count); // total jobs count from API
                } else {
                    setError(data.message || "Failed to fetch jobs");
                }
            } catch (err) {
                console.error("Error fetching jobs:", err);
                setError("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [page, perPage]);

    // ✅ Delete Job
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/v1/admin/delete-job/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setJobs(jobs.filter((job) => job._id !== id));
                setTotal(total - 1);
                alert("Job deleted successfully");
            } else {
                alert(`Delete failed: ${data.message || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Something went wrong while deleting.");
        }
    };

    const totalPages = Math.ceil(total / perPage);

    return (
        <div className="admin-container">
            {/* Navbar */}
            <header className="dashboard-header">
                <h2 className="navbar-logo">Admin Panel</h2>
                <nav className="navbar-links">
                    <Link to="/admin/dashboard">Overview</Link>
                    <Link to="/admin/users">Users</Link>
                    <Link to="/admin/applicant">Applicant</Link>
                    <Link to="/admin/jobs">Jobs</Link>
                    <Link to="/admin/recruiters">Recruiter</Link>
                </nav>
                <Link to="/login">
                    <button
                        className="logout-btn"
                        onClick={() => {
                            localStorage.clear();
                            navigate("/login");
                        }}
                    >
                        Logout
                    </button>
                </Link>
            </header>

            {/* Jobs Table */}
            <main className="jobs-container">
                <div className="jobs-table-container">
                    <h2 className="jobs-title">Job Management</h2>

                    {loading ? (
                        <p>Loading jobs...</p>
                    ) : error ? (
                        <p style={{ color: "red" }}>{error}</p>
                    ) : (
                        <>
                            <table className="jobs-table">
                                <thead>
                                    <tr>
                                        <th>Sl_No.</th>
                                        <th>Job Title</th>
                                        <th>Job Catagory</th>
                                        <th>Company Name</th>
                                        <th>Post Date</th>
                                        <th>End Date</th>
                                        <th>Recruiter Name</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center" }}>
                                                No jobs found
                                            </td>
                                        </tr>
                                    ) : (
                                        jobs.map((job, index) => (
                                            <tr key={job._id}>
                                                <td>{(page - 1) * perPage + index + 1}</td>
                                                <td>{job.title}</td>
                                                <td>{job.cat_name}</td>
                                                <td>{job.company}</td>
                                                <td>{job.postDate}</td>
                                                <td>{job.endDate}</td>
                                                <td>{job.recruiterId?.name || "N/A"}</td>
                                                <td>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => handleDelete(job._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* ✅ Pagination Controls */}
                            <div className="pagination">
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                >
                                    Prev
                                </button>
                                <span>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
