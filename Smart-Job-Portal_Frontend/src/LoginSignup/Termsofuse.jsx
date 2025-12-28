import React, { useState, useEffect } from 'react';
import styles from './Termsofuse.module.css';
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";

const Termsofuse = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [lastUpdated] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  const policyData = {
    introduction: {
      title: "1. Agreement to Terms",
      content: "Welcome to KaajKhojo. These Terms and Conditions (\"Terms\") govern your use of our website and the services we provide.\n\nBy accessing or using the Site, you agree to be bound by these Terms and our Privacy Policy. If you do not agree with all of these Terms, you are prohibited from using the Site and must discontinue use immediately."
    },
    informationWeCollect: {
      title: "2. Our Services",
      content: "KaajKhojo provides an online platform that connects Job Seekers (individuals seeking employment) with Recruiters (employers or organizations seeking candidates).\n\nPlease Note: We are not an employment agency. We are not a party to any contract or agreement entered into between Job Seekers and Recruiters. We do not guarantee employment, job interviews, or the accuracy of job postings or user-submitted resumes."
    },
    howWeUse: {
      title: "3. User Registration and Accounts",
      content: "Eligibility: To use our services, you must be at least 18 years old and legally capable of entering into a binding contract.\n\nAccurate Information: You agree to provide true, accurate, current, and complete information during the registration process and to update such information as necessary.\n\nAccount Security: You are responsible for safeguarding your password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.\n\nAccount Types: Your obligations may differ depending on whether you register as a Job Seeker or a Recruiter."
    },
    howWeShare: {
      title: "4. User Responsibilities (All Users)",
      content: "As a user of the Site, you agree not to:\n\n• Provide any false, misleading, or inaccurate information in your profile, resume, or job postings.\n• Post any content that is unlawful, defamatory, hateful, discriminatory, or obscene.\n• Use the Site for any purpose other than its intended use (i.e., professional job seeking and recruiting).\n• Harass, stalk, or harm another user.\n• Distribute spam, chain letters, or other unsolicited communications.\n• Use any automated system (like \"bots\" or \"scrapers\") to access or scrape data from the Site.\n• Attempt to reverse-engineer or compromise the security of the Site."
    },
    dataSecurity: {
      title: "5. Terms for Job Seekers",
      content: "• You are solely responsible for the content of your profile, resume (CV), and any application materials you submit.\n• We do not guarantee the validity or accuracy of any job posting or offer from a Recruiter. You are responsible for vetting potential employers and job offers.\n• You understand that when you submit an application, your profile information, resume, and profile photo will be shared with the Recruiter for that job posting."

    },
    yourChoices: {
      title: "6. Terms for Recruiters",
      content: "• You represent that you are an authorized representative of the company you claim to represent.\n• All job postings must be for legitimate, existing, and verifiable job openings.\n• You agree not to post any job that:\n  - Is discriminatory in any way.\n  - Requires payment from the Job Seeker.\n  - Promotes illegal activities or pyramid schemes.\n• You agree to use the personal information of Job Seekers (e.g., resumes, photos, contact info) only for the purpose of fulfilling the job opening you posted. You must comply with all applicable privacy and data protection laws."
    },
    childrenPrivacy: {
      title: "7. Content and Intellectual Property",
      content: "Our Content: The Site and its original content, features, and functionality (including our logo, design, and software) are and will remain the exclusive property of KaajKhojo.\n\nUser Content: You own the content you post (like your resume, profile photo, or job description). However, by posting it, you grant us a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute your content on and through our platform as necessary to provide our services."
    },
    changesToPolicy: {
      title: "8. Termination",
      content: "By You: You may terminate your account at any time by going to your account settings.\n\nBy Us: We reserve the right to suspend or terminate your account and access to the Site, without notice, if we believe you have violated these Terms."
    },
    contactUs: {
title: "9. Disclaimers and Limitation of Liability",
      content: "\"AS IS\" Basis: The Site and our services are provided \"AS IS\" and \"AS AVAILABLE\" without any warranties, express or implied.\n\nNo Guarantees: We do not warrant that the site will be error-free, secure, or uninterrupted. We do not guarantee the accuracy of any user-submitted content.\n\nLimitation of Liability: To the fullest extent permitted by law, KaajKhojo (and its owners, employees, and agents) will not be liable for any indirect, incidental, or consequential damages, or any loss of profits or revenues, arising from your use of the Site or your interactions with other users (Job Seekers or Recruiters)."

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
            <h1 className={styles.mainTitle}>Terms &<span className={styles.highlight}> Condition</span>
            </h1>
            <p className={styles.subtitle}>Last Updated: {lastUpdated}</p>
          <p className={styles.introText}>
            These terms govern your use of KaajKhojo. Please read them carefully before using our services. 
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

export default Termsofuse;