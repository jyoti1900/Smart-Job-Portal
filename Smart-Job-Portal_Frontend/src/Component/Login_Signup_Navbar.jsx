import React, { useEffect, useState } from "react";
import styles from "./Login_Signup_Navbar.module.css";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.getElementById("header");
      if (window.scrollY >= 80) {
        header.classList.add(styles["scroll-header"]);
      } else {
        header.classList.remove(styles["scroll-header"]);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={styles.header} id="header">
      <nav className={`${styles.nav} container`}>
        
        {/* Logo */}
        <Link to="/">
          <img
            src="/Images/LOGO1.svg"
            className={styles.nav__logo}
            alt="Logo"
          />
        </Link>

        {/* Hamburger (MOBILE ONLY) */}
        <div
          className={`${styles.nav__toggle} ${menuOpen ? styles.hide__toggle : ""
            }`}
          onClick={() => setMenuOpen(true)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Nav Menu */}
        <div
          className={`${styles.nav__menu} ${
            menuOpen ? styles.show__menu : ""
          }`}
        >
          {/* Close Button */}
          <div
            className={styles.nav__close}
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </div>

          <ul className={styles.nav__list}>
            <li><a href="/" className={styles.nav__link}>Home</a></li>
            <li><a href="/aboutus" className={styles.nav__link}>About Us</a></li>
            <li><a href="/contactus" className={styles.nav__link}>Contact Us</a></li>
            <li><a href="/privacypolicy" className={styles.nav__link}>Privacy Policy</a></li>
            <li><a href="/termsofuse" className={styles.nav__link}>Terms & Conditions</a></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}