import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import "./Admin_Dashboard.css";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // ✅ API data states
    const [stats, setStats] = useState({
        users: 0,
        recruiters: 0,
        applications: 0,
        jobs: 0
    });
    const [userGrowthData, setUserGrowthData] = useState([]);
    const [jobCategoryData, setJobCategoryData] = useState([]);

    const COLORS = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336"];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("authToken");

                const [statsRes, growthRes, categoryRes] = await Promise.all([
                    fetch("http://localhost:8080/api/v1/admin/overview", {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch("http://localhost:8080/api/v1/admin/user-growth", {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch("http://localhost:8080/api/v1/admin/job-category", {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                const statsJson = await statsRes.json();
                const growthJson = await growthRes.json();
                const categoryJson = await categoryRes.json();

                if (statsJson.success) setStats(statsJson.data);
                if (growthJson.success) setUserGrowthData(growthJson.data);
                if (categoryJson.success) setJobCategoryData(categoryJson.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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

            {/* Main Dashboard */}
            <main className="dashboard">
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* ✅ Stats Cards */}
                        <div className="stats-cards">
                            <div className="card">
                                <h3>Total Users</h3>
                                <p>{stats.users}</p>
                            </div>
                            <div className="card">
                                <h3>Total Recruiters</h3>
                                <p>{stats.recruiters}</p>
                            </div>
                            <div className="card">
                                <h3>Total Applications</h3>
                                <p>{stats.applications}</p>
                            </div>
                            <div className="card">
                                <h3>Total Job Post</h3>
                                <p>{stats.jobs}</p>
                            </div>
                        </div>

                        {/* ✅ Charts */}
                        <div className="charts">
                            {/* User Growth Chart */}
                            <div className="chart-card">
                                <h3>User Growth</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={userGrowthData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="users"
                                            stroke="#4caf50"
                                            strokeWidth={2}
                                            activeDot={{ r: 6 }}
                                            animationDuration={1200}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Jobs by Category Chart */}
                            <div className="chart-card">
                                <h3>Jobs Apply by Category</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={jobCategoryData.filter(
                                                (item) => item.value > 0 && item.name
                                            )} // ✅ filter out empty/null categories
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            fill="#4caf50"
                                            dataKey="value"
                                            label
                                            animationDuration={1200}
                                        >
                                            {jobCategoryData
                                                .filter((item) => item.value > 0 && item.name)
                                                .map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
