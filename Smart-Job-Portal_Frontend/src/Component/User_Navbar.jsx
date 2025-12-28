import React, { useEffect, useState, useRef } from "react";
import styles from "./User_Navbar.module.css";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  const token = localStorage.getItem("authToken");
  const userId = localStorage.getItem("userId");

  /* ===== FETCH USER ===== */
  useEffect(() => {
    if (!token || !userId) return;

    fetch(`http://localhost:8080/api/v1/customer/user-list/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        const data = res.data || res.user || res;
        setUser(data);
      })
      .catch(err => console.error("User fetch error:", err));
  }, [token, userId]);

  /* ===== CLOSE DROPDOWN ===== */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>

        {/* LEFT LOGO */}
        <img
          src="/Images/LOGO1.svg"
          className={styles.logo}
          alt="Kaajkhojo"
          onClick={() => navigate("/")}
        />

        {/* RIGHT WELCOME + PROFILE */}
        <div className={styles.right}>

          {user?.name && (
            <div className={styles.welcome}>
              Welcome back, <span>{user.name}</span>
            </div>
          )}

          <div className={styles.profile} ref={dropdownRef}>
            <button
              className={styles.profileBtn}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(prev => !prev);
              }}
            >
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  className={styles.avatar}
                  alt="profile"
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span className={styles.caret}>▾</span>
            </button>

            {open && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.name}>{user.name}</div>
                  <div className={styles.email}>{user.email}</div>
                </div>

                <div
                  className={styles.item}
                  onClick={() => navigate("/userprofile")}
                >
                  View Profile
                </div>

                <div
                  className={`${styles.item} ${styles.logout}`}
                  onClick={logout}
                >
                  Sign Out
                </div>
              </div>
            )}
          </div>
        </div>

      </nav>
    </header>
  );
}
