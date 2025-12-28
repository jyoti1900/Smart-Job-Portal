import styles from "./recruiter_navbar.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

const RecruiterNavbar = () => {
    const profileRef = useRef(null);
    const notificationRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [profile, setProfile] = useState(null);

    const [notifications, setNotifications] = useState([
        { id: 1, text: "New application for Senior Developer", time: "2 mins ago", read: false },
        { id: 2, text: "Your job post was approved", time: "1 hour ago", read: false },
        { id: 3, text: "Candidate scheduled interview", time: "3 hours ago", read: true }
    ]);

    const getRecruiterIdFromToken = () => {
        const token = localStorage.getItem("authToken");
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload?.data?._id || null;
        } catch (error) {
            console.error("Invalid token");
            return null;
        }
    };

    /* ---------------- LOGOUT ---------------- */
    const handleLogout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userDetails");
        navigate("/recruiterlogin");
    };

    const handleEditProfile = () => {
        navigate("/recruiter/profile");
        setIsProfileOpen(false); // optional: close dropdown
    };

    /* ---------------- FETCH PROFILE ---------------- */
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const recruiterId = getRecruiterIdFromToken();

                if (!token || !recruiterId) {
                    console.warn("Recruiter ID or token missing");
                    return;
                }

                const res = await fetch(
                    `http://localhost:8080/api/v1/recruiter/recruiter_profile/${recruiterId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const result = await res.json();
                console.log("PROFILE API RESPONSE 👉", result);

                if (result.success && result.data) {
                    setProfile({
                        name: result.data.name,
                        email: result.data.email,
                        profile_image: result.data.profile_image
                    });
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
            }
        };

        fetchProfile();
    }, []);

    /* ---------------- ACTIVE TAB ---------------- */
    useEffect(() => {
        if (location.pathname.includes("/recruiterapplication")) {
            setActiveTab("application");
        } else if (location.pathname.includes("/recruiterdashboard")) {
            setActiveTab("overview");
        }
    }, [location.pathname]);

    /* ---------------- CLICK OUTSIDE ---------------- */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileOpen || isNotificationOpen) {
                if (profileRef.current && !profileRef.current.contains(event.target)) {
                    setIsProfileOpen(false);
                }
                if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                    setIsNotificationOpen(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isProfileOpen, isNotificationOpen]);

    const handleNotificationClick = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen) {
            setNotifications(notifications.map((n) => ({ ...n, read: true })));
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    /* ---------------- IMAGE URL ---------------- */
    const profileImage =
        profile?.profile_image && profile.profile_image.trim() !== ""
            ? profile.profile_image // ✅ already full URL
            : "/images/Default.png";
    return (
        <nav className={styles["recruiter-navbar"]}>
            <div className={styles["nav-left"]}>
                <div className={styles["logo-container"]}>
                    <img src="/images/LOGO1.svg" alt="Logo" className={styles["logo-image"]} />
                </div>
            </div>

            <div className={styles["nav-center"]}>
                <div className={styles["nav-tabs"]}>
                    <button
                        className={`${styles["nav-tab"]} ${
                            activeTab === "overview" ? styles["active"] : ""
                        }`}
                        onClick={() => {
                            setActiveTab("overview");
                            window.location.href = "/recruiterdashboard";
                        }}
                    >
                        <span className={styles["tab-text"]}>Overview</span>
                        <span className={styles["active-indicator"]}></span>
                    </button>

                    <button
                        className={`${styles["nav-tab"]} ${
                            activeTab === "application" ? styles["active"] : ""
                        }`}
                        onClick={() => {
                            setActiveTab("application");
                            window.location.href = "/recruiterapplication";
                        }}
                    >
                        <span className={styles["tab-text"]}>Applications</span>
                        <span className={styles["active-indicator"]}></span>
                    </button>
                </div>
            </div>

            <div className={styles["nav-right"]}>
                <div className={styles["Post-a-job"]}>
                    <Link to="/postajob" className={styles["post-job-link"]}>
                        <button className={styles["post-job-btn"]}>Post a Job</button>
                    </Link>
                </div>

                <div className={styles["notification-wrapper"]} ref={notificationRef}>
                    <button
                        className={styles["notification-btn"]}
                        onClick={handleNotificationClick}
                    >
                        <img src="/images/notification-bell.png" alt="Notifications" />
                        {unreadCount > 0 && (
                            <span className={styles["notification-badge"]}>{unreadCount}</span>
                        )}
                    </button>

                    {isNotificationOpen && (
                        <div className={styles["notification-dropdown"]}>
                            <div className={styles["notification-header"]}>
                                <h4>Notifications</h4>
                                <span className={styles["notification-count"]}>
                                    {unreadCount} new
                                </span>
                            </div>
                            <div className={styles["notification-list"]}>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`${styles["notification-item"]} ${
                                            notification.read ? styles["read"] : styles["unread"]
                                        }`}
                                    >
                                        <div className={styles["notification-dot"]}></div>
                                        <div className={styles["notification-content"]}>
                                            <div className={styles["notification-text"]}>
                                                {notification.text}
                                            </div>
                                            <div className={styles["notification-time"]}>
                                                {notification.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles["profile-wrapper"]} ref={profileRef}>
                    <button
                        className={styles["profile-btn"]}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className={styles["profile-avatar"]}>
                            <img src={profileImage} alt="Profile" />
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className={styles["profile-dropdown"]}>
                            <div className={styles["profile-header"]}>
                                <div className={styles["dropdown-avatar"]}>
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        style={{
                                            width: "52px",
                                            height: "52px",
                                            borderRadius: "50%"
                                        }}
                                    />
                                </div>
                                <div className={styles["profile-info"]}>
                                    <div className={styles["profile-name"]}>
                                        {profile?.name || "—"}
                                    </div>
                                    <div className={styles["profile-email"]}>
                                        {profile?.email || "—"}
                                    </div>
                                </div>
                            </div>

                            <div className={styles["dropdown-menu"]}>
                                <button
                                    className={styles["dropdown-item"]}
                                    onClick={handleEditProfile}
                                >
                                    <img
                                        src="/images/edit.png"
                                        alt="My Profile"
                                        className={styles["dropdown-item-img"]}
                                    />
                                    <span>Edit Profile</span>
                                </button>
                            </div>

                            <button className={styles["logout-btn"]} onClick={handleLogout}>
                                <img
                                    src="/images/logout.png"
                                    alt="Logout"
                                    className={styles["dropdown-item-img"]}
                                />
                                <span>Log Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default RecruiterNavbar;
