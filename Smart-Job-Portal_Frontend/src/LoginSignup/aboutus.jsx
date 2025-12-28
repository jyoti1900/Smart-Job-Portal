import React, { useState, useEffect } from "react";
import styles from "./aboutus.module.css";
import { Link } from "react-router-dom";
import team1 from "../teammember/teammember1.jpg";
import team2 from "../teammember/teammember2.png";
import team4 from "../teammember/teammember4.jpg";
import indra from "../teammember/Indrajit.jpg";
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";
import Design from "../teammember/Icon/logo-design.png";
import privacy from "../teammember/Icon/shield.png";
import chat from "../teammember/Icon/chating.png";
import job from "../teammember/Icon/job-search.png";
import tracker from "../teammember/Icon/daily-calendar.png";
import quality from "../teammember/Icon/qa.png";

const AboutUs = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger fade-in animation on component mount
        setIsVisible(true);

        // Scroll to top when component mounts
        window.scrollTo(0, 0);
    }, []);

    // Team member data
    const teamMembers = [
        {
            id: 1,
            name: "Jyotipriya Das",
            role: "Founder & Backend Developer",
            // bio: "Founded KaajKhojo to bridge the gap between talent and opportunity.",
            img: team1
        },
        {
            id: 2,
            name: "Sayan Pal",
            role: "Co-Founder & Frontend Developer",
            // bio: "Product specialist focused on creating intuitive job search and recruitment solutions.",
            img: team2
        },
        {
            id: 3,
            name: "Indrajit Sahu",
            role: "Frontend Designer",
            // bio: "Full-stack developer passionate about building scalable, efficient job platforms.",
            img: indra
        },
        {
            id: 4,
            name: "Hasanoor Zaman",
            role: "Frontend Developer",
            // bio: "Ensuring both job seekers and recruiters get maximum value from our platform.",
            img: team4
        }
    ];

    // Stats data
    {
        /* Stats Section */
    }
    const [stats, setStats] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("authToken");

        fetch("http://localhost:8080/api/v1/admin/overview", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((payload) => {
                console.log("ADMIN OVERVIEW RESPONSE 👉", payload);

                // Works for both: payload.data OR payload
                const data = payload?.data || payload;

                setStats([
                    {
                        value: `${data?.users ?? 0}+`,
                        label: "Active Job Seekers"
                    },
                    {
                        value: `${data?.recruiters ?? 0}+`,
                        label: "Recruiting Companies"
                    },
                    {
                        value: `${data?.jobs ?? 0}+`,
                        label: "Jobs Posted"
                    },
                    {
                        value: `${data?.applications ?? 0}+`,
                        label: "Applications Submitted"
                    }
                ]);
            })
            .catch((err) => {
                console.error("Stats API error:", err);
                setStats([]);
            });
    }, []);

    <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
            {stats.map((stat, index) => (
                <div key={index} className={styles.statItem}>
                    <h3 className={styles.statValue}>{stat.value}</h3>
                    <p className={styles.statLabel}>{stat.label}</p>
                </div>
            ))}
        </div>
    </section>

    // Why Choose Us features
    const whyChooseUs = [
        {
            title: "User-Centric Design",
            description:
                "Intuitive interface that makes job searching and recruitment effortless for everyone.",
            icon: Design
        },
        {
            title: "Quality Over Quantity",
            description:
                "We focus on meaningful connections between qualified candidates and genuine opportunities.",
            icon: quality
        },
        {
            title: "Privacy First",
            description:
                "Your data is secure. We give you full control over your profile visibility and information.",
            icon: privacy
        },
        {
            title: "Direct Communication",
            description:
                "Eliminate middlemen. Connect directly with potential employers or candidates.",
            icon: chat
        },
        {
            title: "Smart Job Discovery",
            description:
                "Find opportunities tailored to your skills and goals with intelligent recommendations that save you time and effort.",
            icon: job
        },
        {
            title: "Application Tracker",
            description:
                "Stay updated at every step of your job journey.Get real-time updates on your job applications with clear statuses like Pending, In Progress, and Completed.",
            icon: tracker
        }
    ];

    return (
        <>
            <Login_Signup_Navbar />
            <div className={`${styles.container} ${isVisible ? styles.visible : ""}`}>
                {/* Hero Section */}
                <section className={styles.heroSection}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            About <span className={styles.highlight}>Us</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Bridging the gap between talent and opportunity through innovative
                            technology and human connection.
                        </p>
                    </div>
                    <div className={styles.heroPattern}></div>
                </section>

                {/* What We Do Section */}
                <section className={styles.whatWeDoSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>What We Do</h2>
                        <div className={styles.titleUnderline}></div>
                        <p className={styles.sectionDescription}>
                            KaajKhojo is a dedicated job portal designed to serve two core groups:
                        </p>
                    </div>

                    <div className={styles.whatWeDoContainer}>
                        {/* For Job Seekers */}
                        <div className={styles.targetGroup}>
                            <div className={styles.groupHeader}>
                                <h3 className={styles.groupTitle}>For Job Seekers</h3>
                            </div>
                            <p className={styles.groupDescription}>
                                We empower you to build a professional identity online and find your
                                dream job.
                            </p>
                            <ul className={styles.featureList}>
                                <li className={styles.featureItem}>
                                    <span className={styles.checkIcon}>✓</span>
                                    Create a detailed profile and upload your resume
                                </li>
                                <li className={styles.featureItem}>
                                    <span className={styles.checkIcon}>✓</span>
                                    Add a profile photo and showcase your unique skills
                                </li>
                                <li className={styles.featureItem}>
                                    <span className={styles.checkIcon}>✓</span>
                                    Search for jobs that match your expertise
                                </li>
                                <li className={styles.featureItem}>
                                    <span className={styles.checkIcon}>✓</span>
                                    Apply directly to recruiters
                                </li>
                            </ul>
                        </div>

                        {/* For Recruiters */}
                        <div className={styles.targetGroup}>
                            <div className={styles.groupHeader}>
                                <h3 className={styles.groupTitle}>For Recruiters</h3>
                            </div>
                            <p className={styles.groupDescription}>
                                We provide a direct channel to a rich pool of qualified talent.
                            </p>
                            <ul className={styles.featureList}>
                                <li className={styles.featureItem}>
                                    <span className={styles.checkIcon}>✓</span>
                                    Post your job vacancies
                                </li>
                                <li className={styles.featureItem}>
                                    <span className={styles.checkIcon}>✓</span>
                                    Browse candidate profiles
                                </li>
                                <li className={styles.featureItem}>
                                    <span className={styles.checkIcon}>✓</span>
                                    Connect with potential hires
                                </li>
                                <li className={styles.featureItem}>
                                    <span className={styles.checkIcon}>✓</span>
                                    Find the right person for your team, faster
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className={styles.statsSection}>
                    <div className={styles.statsContainer}>
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={styles.statItem}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <h3 className={styles.statValue}>{stat.value}</h3>
                                <p className={styles.statLabel}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Why Choose KaajKhojo Section */}
                <section className={styles.whyChooseSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Why Choose KaajKhojo</h2>
                        <div className={styles.titleUnderline}></div>
                        <p className={styles.sectionDescription}>
                            We stand out from other job portals by focusing on what truly matters
                        </p>
                    </div>

                    <div className={styles.whyChooseGrid}>
                        {whyChooseUs.map((feature, index) => (
                            <div key={index} className={styles.whyChooseCard}>
                                {/* <div className={styles.whyChooseIcon}>
                                    <span className={styles.featureIcon}>{feature.icon}</span>
                                </div> */}
                                <div className={styles.whyChooseIcon}>
                                    {feature.icon &&
                                    typeof feature.icon === "string" &&
                                    feature.icon.match(/\.(png|jpe?g|svg|gif)$/i) ? (
                                        <img
                                            src={feature.icon}
                                            alt={feature.title}
                                            className={styles.featureImg}
                                        />
                                    ) : (
                                        <span className={styles.featureIcon}>{feature.icon}</span>
                                    )}
                                </div>

                                <h3 className={styles.whyChooseTitle}>{feature.title}</h3>
                                <p className={styles.whyChooseDescription}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Team Section */}
                <section className={styles.teamSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Meet Our Team</h2>
                        <div className={styles.titleUnderline}></div>
                        <p className={styles.sectionDescription}>
                            The passionate professionals behind KaajKhojo's success
                        </p>
                    </div>
                    <div className={styles.teamGrid}>
                        {teamMembers.map((member) => (
                            <div key={member.id} className={styles.teamCard}>
                                <div className={styles.teamImgContainer}>
                                    <div className={styles.teamImg}>
                                        {member.img ? (
                                            <img
                                                src={member.img}
                                                alt={member.name}
                                                className={styles.profileImage}
                                            />
                                        ) : (
                                            <div className={styles.imgPlaceholder}>
                                                <span className={styles.initials}>
                                                    {member.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.teamCardOverlay}></div>
                                </div>
                                <div className={styles.teamInfo}>
                                    <h3 className={styles.teamName}>{member.name}</h3>
                                    <p className={styles.teamRole}>{member.role}</p>
                                    <p className={styles.teamBio}>{member.bio}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section - Updated without trial option */}
                <section className={styles.ctaSection}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>Ready to Find Your Perfect Match?</h2>
                        <p className={styles.ctaText}>
                            Join thousands of job seekers and recruiters who have found success with
                            KaajKhojo.
                        </p>
                        <div className={styles.ctaButtons}>
                            <Link to="/login">
                                <button className={styles.primaryButton}>Explore Jobs</button>
                            </Link>

                            <Link to="/recruiterlogin">
                                <button className={styles.secondaryButton}>Post a Job</button>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </>
    );
};

export default AboutUs;
