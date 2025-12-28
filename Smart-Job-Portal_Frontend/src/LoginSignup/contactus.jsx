import React, { useState } from "react";
import styles from "./contactus.module.css";
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("http://localhost:8080/api/v1/common/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            //  SUCCESS
            setIsSubmitted(true);
            setFormData({
                name: "",
                email: "",
                subject: "",
                message: ""
            });

            // auto hide success message
            setTimeout(() => setIsSubmitted(false), 5000);
        } catch (error) {
            alert(error.message || "Failed to send message");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Login_Signup_Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    {/* Animated Header Section */}
                    <div className={styles.header}>
                        <h1 className={styles.title}>
                            Get In<span className={styles.title2}>Touch </span>
                        </h1>
                        <p className={styles.subtitle}>
                            We're here to help you find your dream job. Reach out to us with any
                            questions, feedback, or partnership inquiries.
                        </p>
                    </div>

                    <div className={styles.mainContent}>
                        {/* Contact Form Section */}
                        <div className={styles.formContainer}>
                            <div className={styles.formHeader}>
                                <h2>Send us a message</h2>
                                <p>
                                    Fill out the form below and we'll get back to you as soon as
                                    possible.
                                </p>
                            </div>

                            {isSubmitted ? (
                                <div className={styles.successMessage}>
                                    <div className={styles.successIcon}>✓</div>
                                    <h3>Thank you for your message!</h3>
                                    <p>
                                        We've received your inquiry and will get back to you within
                                        24 hours.
                                    </p>
                                </div>
                            ) : (
                                <form className={styles.contactForm} onSubmit={handleSubmit}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="name">Full Name *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="email">Email Address *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your email address"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="subject">Subject *</label>
                                        <input
                                            type="subject"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            placeholder="Briefly summarize your inquiry"
                                        ></input>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="message">Message *</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            placeholder="Please provide details about your inquiry"
                                            rows="5"
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className={`${styles.submitBtn} ${
                                            isSubmitting ? styles.submitting : ""
                                        }`}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className={styles.spinner}></span>
                                                Sending...
                                            </>
                                        ) : (
                                            "Send Message"
                                        )}
                                    </button>

                                    {/* Horizontal Contact Information Section */}
                                    <div className={styles.contactInfoSection}>
                                        <div className={styles.sectionHeader}>
                                            <h2>Contact Information</h2>
                                            <p>You can also reach us through these channels.</p>
                                        </div>

                                        <div className={styles.horizontalContactGrid}>
                                            <div className={styles.contactCard}>
                                                <div className={styles.cardIcon}>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                                                    </svg>
                                                </div>
                                                <h3>Email Us</h3>
                                                <p>support@kaajkhojo.com</p>
                                                {/* <p>partners@jobfinder.com</p> */}
                                            </div>

                                            <div className={styles.contactCard}>
                                                <div className={styles.cardIcon}>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                    </svg>
                                                </div>
                                                <h3>Call Us</h3>
                                                <p>+91 8001381696</p>
                                                <p>+91 8900246577</p>
                                            </div>

                                            <div className={styles.contactCard}>
                                                <div className={styles.cardIcon}>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                    </svg>
                                                </div>
                                                <h3>Visit Us</h3>
                                                <p>Kestopur</p>
                                                <p>Newtown,Kolkata,700002</p>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ContactPage;
