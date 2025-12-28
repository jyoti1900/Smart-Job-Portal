import React, { useState, useEffect } from 'react';
import styles from './Privacypolicy.module.css';
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [lastUpdated] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  const policyData = {
    introduction: {
      title: "1. Introduction",
      content: "Welcome to KaajKhojo. We are committed to protecting the privacy of our users, including both job seekers and recruiters. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.\n\nPlease read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site."
    },
    informationWeCollect: {
      title: "2. Information We Collect",
      content: "We may collect information about you in a variety of ways. The information we may collect on the Site includes:\n\nA. Personal Data You Provide to Us\nWe collect personal information that you voluntarily provide to us when you register on the Site or use our services. This information may include:\n\nFor all users:\n• Full Name\n• Email Address\n• Password (in a hashed format)\n\nFor Job Seekers (additional):\n• Profile Photo\n• Contact Information (phone number, address)\n• Resume/CV (which may contain education history, work experience, skills, and other details)\n\nFor Recruiters (additional):\n• Company Name\n• Company Details\n• Business Email Address\n• Job Posting Details\n\nB. Data Collected Automatically\nWhen you use our Site, we may automatically collect certain information, including:\n• Cookies and Tracking: We may use cookies and similar tracking technologies to help customize the Site and improve your experience."
    },
    howWeUse: {
      title: "3. How We Use Your Information",
      content: "We use the information we collect for the following purposes:\n\nTo Provide Our Services:\n• To create and manage your account.\n• To allow Job Seekers and Recruiters to connect on the platform.\n• To display Job Seeker profiles (including name, photo, and resume) to Recruiters.\n• To display Recruiter profiles and job postings to Job Seekers.\n\nTo Improve Our Platform:\n• To analyze website usage and trends to improve the user experience.\n• To monitor and prevent fraudulent or unauthorized activity."
    },
    howWeShare: {
      title: "4. How We Share Your Information",
      content: "We may share your information with third parties in the following situations:\n\nBetween Job Seekers and Recruiters: This is the core function of our service.\n• Job Seekers: Your profile information (name, photo, resume, skills) will be made available to Recruiters when you apply for a job or if your profile is set to \"public\" (if this feature is available).\n• Recruiters: Your company information and job postings will be public and visible to all Job Seekers.\n\nWith Third-Party Service Providers: We may share your data with vendors who perform services for us, such as website hosting, data analysis, and email delivery.\n\nFor Legal Reasons: We may disclose your information if required by law, subpoena, or other legal process."
    },
    dataSecurity: {
      title: "5. Data Security",
      content: "We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception."
    },
    yourChoices: {
      title: "6. Your Choices and Rights",
      content: "You have rights regarding your personal information. Depending on your location, you may have the right to:\n\n• Access: Request a copy of the personal information we hold about you.\n• Correction: Request that we correct any inaccurate or incomplete information.\n• Deletion: Request that we delete your account and personal information, subject to certain legal obligations.\n\nYou can typically update your profile information, including your name, email, and photo, directly through your account settings."
    },
    // childrenPrivacy: {
    //   title: "7. Children's Privacy",
    //   content: "Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18."
    // },
    changesToPolicy: {
      title: "7. Changes to This Privacy Policy",
      content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the \"Last Updated\" date."
    },
    contactUs: {
      title: "8. Contact Us",
      content: "If you have questions or comments about this Privacy Policy, please contact us at:\n\n• Email: support@kaajkhojo.com\n• Company: KaajKhojo\n• Address: Kestopur,Newtown,Kolkata,700002"
    }
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Format content with paragraphs and lists
  const formatContent = (content) => {
    return content.split('\n\n').map((paragraph, index) => {
      if (paragraph.includes('•')) {
        const lines = paragraph.split('\n');
        return (
          <div key={index} className={styles.listContainer}>
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className={styles.listItem}>
                {line.startsWith('•') ? (
                  <div className={styles.bulletItem}>
                    <span className={styles.bullet}>•</span>
                    <span>{line.substring(1)}</span>
                  </div>
                ) : (
                  <p className={styles.subHeading}>{line}</p>
                )}
              </div>
            ))}
          </div>
        );
      }
      return <p key={index} className={styles.paragraph}>{paragraph}</p>;
    });
  };

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
    <Login_Signup_Navbar/>
      <div className={styles.container}>
      <div className={styles.headerAnimation}>
        <div className={styles.floatingCircle}></div>
        <div className={styles.floatingCircle}></div>
        <div className={styles.floatingCircle}></div>
      </div>
      
      <header className={styles.header}>
        <div className={styles.logoContainer}>

        </div>
        <div className={styles.headerContent}>
            <h1 className={styles.mainTitle}>Privacy <span className={styles.highlight}>Policy</span>
            </h1>
            <p className={styles.subtitle}>Last Updated: {lastUpdated}</p>
          <p className={styles.introText}>
            Your privacy is important to us. This policy explains how we collect, use, 
            and protect your information when you use our services.
          </p>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Table of Contents for Desktop */}
          <aside className={styles.sidebar}>
            <div className={styles.tocContainer}>
              <h3 className={styles.tocTitle}>Table of Contents</h3>
              <nav className={styles.tocNav}>
                {Object.keys(policyData).map((key) => (
                  <a 
                    key={key}
                    href={`#${key}`}
                    className={`${styles.tocLink} ${activeSection === key ? styles.activeTocLink : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSection(key);
                      document.getElementById(key)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {policyData[key].title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Policy Sections */}
          <div className={styles.policySections}>
            {Object.keys(policyData).map((key) => (
              <section 
                key={key}
                id={key}
                className={`${styles.policySection} ${activeSection === key ? styles.active : ''}`}
                onClick={() => toggleSection(key)}
              >
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <span className={styles.titleNumber}>
                      {policyData[key].title.split('.')[0]}.
                    </span>
                    <span className={styles.titleText}>
                      {policyData[key].title.split('. ')[1]}
                    </span>
                    <span className={styles.accordionIcon}>
                      {activeSection === key ? '−' : '+'}
                    </span>
                  </h2>
                </div>
                
                <div className={`${styles.sectionContent} ${activeSection === key ? styles.contentVisible : ''}`}>
                  <div className={styles.contentInner}>
                    {formatContent(policyData[key].content)}
                  </div>
                  
                  {/* Animated separator between sections */}
                  {key !== 'contactUs' && (
                    <div className={styles.sectionSeparator}>
                      <div className={styles.separatorLine}></div>
                      <div className={styles.separatorDot}></div>
                      <div className={styles.separatorLine}></div>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
    <Footer/>
    </>
  );
};

export default PrivacyPolicy;