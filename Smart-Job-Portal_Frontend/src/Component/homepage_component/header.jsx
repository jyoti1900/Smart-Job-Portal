// src/Components/Header.jsx
import React from "react";
import styles from "./header.module.css";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className={styles["kk-header"]}>
      <div className={`${styles["kk-container"]} ${styles["kk-header-inner"]}`}>
        <div className={styles["kk-brand"]}>
          <span className={styles["kk-brand-main"]}>Kaaj</span>
          <span className={styles["kk-brand-sub"]}>Khojo</span>
        </div>

        <nav className={styles["kk-nav"]}>
          <a href="#jobs">Jobs</a>
          <a href="#companies">Companies</a>
          <a href="#testimonials">Testimonial</a>
        </nav>

        <div className={styles["kk-auth"]}>
           <Link to="/chooserolelogin">
            <button className={`${styles["kk-btn"]} ${styles["kk-btn-login"]}`}>
              Log in
            </button>
          </Link>
          <Link to="/chooserolesignup">
            <button className={`${styles["kk-btn"]} ${styles["kk-btn-signup"]}`}>
              Sign Up
            </button>
          </Link>
        </div>
        {/* Hamburger Button (MOBILE ONLY) */}
        <button
          className={styles["kk-hamburger"]}
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Right Drawer */}
      <div className={`${styles["kk-drawer"]} ${menuOpen ? styles["open"] : ""}`}>
        <button
          className={styles["kk-close"]}
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>

        <a href="#jobs" onClick={() => setMenuOpen(false)}>Jobs</a>
        <a href="#companies" onClick={() => setMenuOpen(false)}>Companies</a>
        <a href="#testimonials" onClick={() => setMenuOpen(false)}>Testimonial</a>

        <Link to="/chooserolelogin" onClick={() => setMenuOpen(false)}>
          Log in
        </Link>
        <Link to="/chooserolesignup" onClick={() => setMenuOpen(false)}>
          Sign Up
        </Link>

      </div>
    </header>
  );
}