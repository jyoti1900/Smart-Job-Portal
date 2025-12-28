import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UsersPage.css";

export default function UsersPage() {
    const navigate = useNavigate();

    // Manual users
    const [manualUsers, setManualUsers] = useState([]);
    const [manualPage, setManualPage] = useState(1);
    const [manualTotal, setManualTotal] = useState(0);

    // Google users
    const [googleUsers, setGoogleUsers] = useState([]);
    const [googlePage, setGooglePage] = useState(1);
    const [googleTotal, setGoogleTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const perPage = 5;

    // ✅ Fetch Manual Users
    const fetchManualUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `http://localhost:8080/api/v1/admin/list-users?page=${manualPage}&perPage=${perPage}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );
            const data = await res.json();
            if (res.ok) {
                setManualUsers(data.data);
                setManualTotal(data.count);
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error("Manual users fetch error:", err);
            setError("Failed to fetch manual users");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch Google Users
    const fetchGoogleUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `http://localhost:8080/api/v1/admin/list-google-users?page=${googlePage}&perPage=${perPage}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );
            const data = await res.json();
            if (res.ok) {
                setGoogleUsers(data.data);
                setGoogleTotal(data.count);
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error("Google users fetch error:", err);
            setError("Failed to fetch google users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManualUsers();
    }, [manualPage]);

    useEffect(() => {
        fetchGoogleUsers();
    }, [googlePage]);

    // ✅ Delete Manual User
    const handleDeleteManual = async (id) => {
        if (!window.confirm("Delete this manual user?")) return;
        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/delete-user/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`
                }
            });
            if (res.ok) {
                setManualUsers(manualUsers.filter((u) => u._id !== id));
                setManualTotal(manualTotal - 1);
            }
        } catch (err) {
            console.error("Manual delete error:", err);
        }
    };

    // ✅ Delete Google User
    const handleDeleteGoogle = async (id) => {
        if (!window.confirm("Delete this Google user?")) return;
        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/delete-google-user/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`
                }
            });
            if (res.ok) {
                setGoogleUsers(googleUsers.filter((u) => u._id !== id));
                setGoogleTotal(googleTotal - 1);
            }
        } catch (err) {
            console.error("Google delete error:", err);
        }
    };

    const manualTotalPages = Math.ceil(manualTotal / perPage);
    const googleTotalPages = Math.ceil(googleTotal / perPage);

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

            <main className="users-container">
                {/* 🔹 Stats Cards */}
                {/* <div className="stats-cards users-stats">
                    <div className="card">
                        <h3>Manual Users</h3>
                        <p>{manualTotal}</p>
                    </div>
                    {/* <div className="card">
                        <h3>Google Users</h3>
                        <p>{googleTotal}</p>
                    </div> }
                    <div className="card">
                        <h3>Total Users</h3>
                        <p>{manualTotal + googleTotal}</p>
                    </div>
                </div> */}

                {/* 🔹 Manual Users Table */}
                <div className="users-table-container">
                    <h2 className="users-title">User Management</h2>
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Sl_No.</th>
                                {/* <th>User ID</th> */}
                                <th>Name</th>
                                <th>Email</th>
                                <th>Mobile No</th>
                                <th>Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {manualUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center" }}>
                                        No manual users found
                                    </td>
                                </tr>
                            ) : (
                                manualUsers.map((user, idx) => (
                                    <tr key={user._id}>
                                        <td>{(manualPage - 1) * perPage + idx + 1}</td>
                                        {/* <td>{user._id}</td> */}
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.mobile}</td>
                                        <td>{user.user_type}</td>
                                        <td>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteManual(user._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {/* Pagination */}
                    <div className="pagination">
                        <button
                            onClick={() => setManualPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={manualPage === 1}
                        >
                            Prev
                        </button>
                        <span>
                            Page {manualPage} of {manualTotalPages}
                        </span>
                        <button
                            onClick={() =>
                                        setManualPage((prev) => Math.min(prev + 1, manualTotalPages))
                                    }
                                    disabled={manualPage === manualTotalPages}
                                >
                            Next
                        </button>
                    </div>
                </div>

                <br />

                {/* 🔹 Google Users Table */}
                {/* <div className="users-table-container">
                    <h2 className="users-title">Google User Management</h2>
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Sl_No.</th>
                                <th>Google ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {googleUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center" }}>
                                        No google users found
                                    </td>
                                </tr>
                            ) : (
                                googleUsers.map((user, idx) => (
                                    <tr key={user._id}>
                                        <td>{(googlePage - 1) * perPage + idx + 1}</td>
                                        <td>{user.googleId}</td>
                                        <td>{user.displayName}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteGoogle(user._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table> */}
                    {/* Pagination */}
                    {/* <div className="pagination">
                        <button
                           onClick={() => setGooglePage((prev) => Math.max(prev - 1, 1))}
                                    disabled={googlePage === 1}
                        >
                            Prev
                        </button>
                        <span>
                            Page {googlePage} of {googleTotalPages}
                        </span>
                        <button
                            onClick={() =>
                                        setGooglePage((prev) => Math.min(prev + 1, googleTotalPages))
                                    }
                                    disabled={googlePage === googleTotalPages}
                        >
                            Next
                        </button>
                    </div>
                </div> */}
            </main>
        </div>
    );
}
