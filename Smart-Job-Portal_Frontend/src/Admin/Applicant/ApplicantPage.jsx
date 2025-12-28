import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ApplicantPage.css";

export default function ApplicantPage() {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [perPage] = useState(5); // show 5 applicants per page
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();

    // ✅ Fetch Applicants from API
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `http://localhost:8080/api/v1/admin/list-applicants?page=${page}&perPage=${perPage}`,
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
                    setApplicants(data.data || []);
                    setTotal(data.count || 0); // total applicants count from API
                } else {
                    setError(data.message || "Failed to fetch applicants");
                }
            } catch (err) {
                console.error("Error fetching applicants:", err);
                setError("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [page, perPage]);

    // ✅ Delete Applicant
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this application?")) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/v1/admin/delete-applicant/${id}`,
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
                setApplicants(applicants.filter((applicant) => applicant._id !== id));
                setTotal(total - 1);
                alert("Applicant deleted successfully");
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

            {/* Applicants Table */}
            <main className="applicants-container">
                <div className="applicants-table-container">
                    <h2 className="applicants-title">Application Management</h2>

                    {loading ? (
                        <p>Loading applicants...</p>
                    ) : error ? (
                        <p style={{ color: "red" }}>{error}</p>
                    ) : (
                        <>
                            <table className="applicants-table">
                                <thead>
                                    <tr>
                                        <th>Sl_No.</th>
                                        <th>User Name</th>
                                        <th>Job Title</th>
                                        <th>Job Catagory</th>
                                        <th>Company Name</th>
                                        <th>Apply Date</th>
                                        <th>Recruiter Name</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applicants.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center" }}>
                                                No applicants found
                                            </td>
                                        </tr>
                                    ) : (
                                        applicants.map((applicant, index) => (
                                            <tr key={applicant._id}>
                                                <td>{(page - 1) * perPage + index + 1}</td>
                                                <td>{applicant.userName}</td>
                                                <td>{applicant.jobTitle}</td>
                                                <td>{applicant.jobCategory}</td>
                                                <td>{applicant.companyName}</td>
                                                <td>{applicant.applyDate}</td>
                                                <td>{applicant.recruiterName}</td>
                                                <td>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => handleDelete(applicant._id)}
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
                                    onClick={() =>
                                        setPage((prev) => Math.min(prev + 1, totalPages))
                                    }
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
