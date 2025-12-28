import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RecruiterPage.css";

export default function RecruiterPage() {
    const [recruiters, setRecruiters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [perPage] = useState(5); // show 5 per page
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();

    //  Fetch recruiters from API
    useEffect(() => {
        const fetchRecruiters = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `http://localhost:8080/api/v1/admin/list-recruiter?page=${page}&perPage=${perPage}`,
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
                    setRecruiters(data.data);
                    setTotal(data.count); // total recruiters count from API
                } else {
                    setError(data.message || "Failed to fetch recruiters");
                }
            } catch (err) {
                console.error("Error fetching recruiters:", err);
                setError("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecruiters();
    }, [page, perPage]);

    //  Soft Delete Recruiter
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this recruiter?")) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/v1/admin/delete-recruiter/${id}`,
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
                setRecruiters(recruiters.filter((rec) => rec._id !== id));
                setTotal(total - 1); // decrease count
                alert("Recruiter deleted successfully");
            } else {
                alert(`Delete failed: ${data.message || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Something went wrong while deleting.");
        }
    };

    //  Pagination controls
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

            {/* Recruiter Table */}
            <main className="recruiter-container">
                <div className="recruiter-table-container">
                    <h2 className="recruiter-title">Recruiter Management</h2>

                    {loading ? (
                        <p>Loading recruiters...</p>
                    ) : error ? (
                        <p style={{ color: "red" }}>{error}</p>
                    ) : (
                        <>
                            <table className="recruiter-table">
                                <thead>
                                    <tr>
                                        <th>Sl_No.</th>
                                        <th>Recruiter ID</th>
                                        <th>Recruiter Name</th>
                                        <th>Email</th>
                                        <th>Phone No</th>
                                        <th>Company</th>
                                        <th>Role</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recruiters.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center" }}>
                                                No recruiters found
                                            </td>
                                        </tr>
                                    ) : (
                                        recruiters.map((rec, index) => (
                                            <tr key={rec._id}>
                                                <td>{(page - 1) * perPage + index + 1}</td>
                                                {/* <td>{rec._id}</td> */}
                                                <td>{rec.empId}</td>
                                                <td>{rec.name}</td>
                                                <td>{rec.email}</td>
                                                <td>{rec.mobile}</td>
                                                <td>{rec.company}</td>
                                                <td>{rec.user_type}</td>
                                                <td>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => handleDelete(rec._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
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
