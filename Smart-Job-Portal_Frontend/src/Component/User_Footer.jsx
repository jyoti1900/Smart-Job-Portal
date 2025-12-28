import React from "react";
import styles from "./User_Footer.module.css";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { AiOutlineX } from "react-icons/ai"; // for X (Twitter new logo)
import { useState } from "react";
import Logo from "../Component/LOGO2.svg";
import { Link } from "react-router-dom";

export default function Footer() {
    const year = new Date().getFullYear();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("http://localhost:8080/api/v1/common/subscribe-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    type: "newsletter" // optional (recommended)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Subscription failed");
            }

            setMessage("✅ Successfully subscribed to the newsletter!");
            setEmail("");
        } catch (error) {
            setMessage("❌ Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.footerInner}>
                {/* --- Left Column --- */}
                <div className={`${styles.col} ${styles.colBrand}`}>
                    <h2 className={styles.logo}>
                        <Link to="/">
                        <img src={Logo} alt="" />
                        </Link>
                    </h2>
                    <p className={styles.desc}>
                        Find your next career opportunity and connect with like-minded individuals.
                    </p>

                    <div className={styles.socials}>
                        <a href="#" className={styles.socialBtn}>
                            <FaFacebookF />
                        </a>
                        <span className={styles.divider} />
                        <a
                            href="https://chat.whatsapp.com/HSlV99gXBo4HcvjHp1AP8X"
                            className={styles.socialBtn}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FaWhatsapp />
                        </a>

                        <span className={styles.divider} />
                        <a href="#" className={styles.socialBtn}>
                            <AiOutlineX />
                        </a>
                    </div>
                </div>

                {/* --- Middle Column --- */}
                <div className={`${styles.col} ${styles.colLinks}`}>
                    <h3 className={styles.colTitle}>Help Links</h3>
                    <ul className={styles.linksList}>
                        <li>
                            <a href="/">Home</a>
                        </li>
                        <li>
                            <a href="/useraboutus">About Us</a>
                        </li>
                        <li>
                            <a href="/usercontactus">Contact Us</a>
                        </li>
                        <li>
                            <a href="/userprivacypolicy">Privacy Policy</a>
                        </li>
                        <li>
                            <a href="/usertermsofuse">Terms & Condition</a>
                        </li>
                    </ul>
                </div>

                {/* --- Right Column (Newsletter) --- */}
                <div className={`${styles.col} ${styles.colNews}`}>
                    <h3 className={styles.colTitle}>Subscribe Our Newsletter</h3>
                    <p className={styles.newsText}>
                        Get the freshest job news and articles delivered to your inbox every week.
                    </p>
                    <form className={styles.newsForm} onSubmit={handleSubmit}>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className={styles.btn} disabled={loading}>
                            {loading ? "Submitting..." : "Submit"}
                        </button>
                    </form>

                    {message && <p className={styles.success}>{message}</p>}
                </div>
            </div>

            <div className={styles.line}></div>

            <div className={styles.bottom}>
                <p className={styles.copyright}>© {year} All Right Reserved kaajkhojo.co</p>
            </div>
        </footer>
    );
}
