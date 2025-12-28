import React, { useState } from 'react';
import styles from './viewapplication.module.css';
import ChatApplication from './chat';
import VideoCall from './videocall';

const ApplicationManager = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatCandidate, setChatCandidate] = useState(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoCandidate, setVideoCandidate] = useState(null);

  const applications = [
    {
      id: 1,
      name: "Priya Patel",
      position: "Backend Developer at CodeWorks",
      email: "priya.patel@example.com",
      phone: "+91 91234 56789",
      experience: "3 Years",
      education: "MCA",
      appliedDate: "2024-10-21",
      status: "Applied",
      resumeUrl: "#"
    },
    {
      id: 2,
      name: "Suresh Nair",
      position: "Frontend Developer at TechCorp",
      email: "suresh.nair@example.com",
      phone: "+91 98765 43210",
      experience: "5 Years",
      education: "B.Tech Computer Science",
      appliedDate: "2024-10-20",
      status: "Under Review",
      resumeUrl: "#"
    },
    {
      id: 3,
      name: "Amit Sharma",
      position: "Full Stack Developer at InnovateTech",
      email: "amit.sharma@example.com",
      phone: "+91 87654 32109",
      experience: "4 Years",
      education: "M.Tech Software Engineering",
      appliedDate: "2024-10-19",
      status: "Shortlisted",
      resumeUrl: "#"
    }
  ];

  const handleViewResume = (application) => {
    setSelectedApplication(application);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
  };

  const handleOpenChat = (application) => {
    setChatCandidate(application);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const handleOpenVideo = (application) => {
    setVideoCandidate(application);
    setIsVideoOpen(true);
  };

  const closeVideo = () => {
    setIsVideoOpen(false);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Applied': styles.statusApplied,
      'Under Review': styles.statusUnderReview,
      'Shortlisted': styles.statusShortlisted,
      'Rejected': styles.statusRejected,
      'Hired': styles.statusHired
    };
    return statusMap[status] || styles.statusApplied;
  };

  return (
    <div className={styles.applicationManager}>
      <header className={styles.appHeader}>
        <h1>Manage Applications</h1>
      </header>

      <div className={styles.applicationsContainer}>
        {applications.map((app) => (
          <div key={app.id} className={styles.applicationCard}>
            <div className={styles.applicantInfo}>
              <h2 className={styles.applicantName}>{app.name}</h2>
              <p className={styles.applicantPosition}>{app.position}</p>
              
              <div className={styles.applicantDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{app.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>{app.phone}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Experience:</span>
                  <span className={styles.detailValue}>{app.experience}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Education:</span>
                  <span className={styles.detailValue}>{app.education}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Applied on:</span>
                  <span className={styles.detailValue}>{app.appliedDate}</span>
                </div>
              </div>
              
              <div className={styles.statusContainer}>
                <span className={styles.statusLabel}>Status:</span>
                <span className={`${styles.statusBadge} ${getStatusClass(app.status)}`}>
                  {app.status}
                </span>
              </div>
            </div>
            
            <div className={styles.actionButtons}>
              <button 
                className={styles.viewResumeBtn}
                onClick={() => handleViewResume(app)}
                aria-label={`View resume for ${app.name}`}
              >
                <span className={styles.btnText}>View Resume</span>
                <span className={styles.btnIcon}>📄</span>
                <span className={styles.btnEffect}></span>
              </button>
              
              <button 
                className={`${styles.actionBtn} ${styles.chatBtn}`}
                onClick={() => handleOpenChat(app)}
              >
                <span className={styles.actionIcon}>💬</span>
                <span className={styles.actionText}>Chat</span>
              </button>
              
              <button
                className={`${styles.actionBtn} ${styles.videoBtn}`}
                onClick={() => handleOpenVideo(app)}
              >
                <span className={styles.actionIcon}>📹</span>
                <span className={styles.actionText}>Video Call</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Popup Modal for Resume */}
      {isPopupOpen && selectedApplication && (
        <div className={`${styles.resumePopup} ${isPopupOpen ? styles.popupOpen : ''}`}>
          <div className={styles.popupOverlay} onClick={closePopup}></div>
          <div className={styles.popupContent}>
            <button 
              className={styles.popupCloseBtn} 
              onClick={closePopup} 
              aria-label="Close popup"
            >
              &times;
            </button>
            
            <div className={styles.popupHeader}>
              <h2>{selectedApplication.name}'s Resume</h2>
              <p className={styles.popupSubtitle}>{selectedApplication.position}</p>
            </div>
            
            <div className={styles.popupBody}>
              <div className={styles.resumePreview}>
                <div className={styles.resumeHeader}>
                  <h3>Professional Summary</h3>
                  <p>Experienced {selectedApplication.position.toLowerCase()} with {selectedApplication.experience} of industry experience. Strong technical skills and a proven track record of successful project delivery.</p>
                </div>
                
                <div className={styles.resumeSection}>
                  <h4>Contact Information</h4>
                  <ul>
                    <li><strong>Email:</strong> {selectedApplication.email}</li>
                    <li><strong>Phone:</strong> {selectedApplication.phone}</li>
                  </ul>
                </div>
                
                <div className={styles.resumeSection}>
                  <h4>Education</h4>
                  <p>{selectedApplication.education} - Graduated with honors</p>
                </div>
                
                <div className={styles.resumeSection}>
                  <h4>Work Experience</h4>
                  <p>{selectedApplication.experience} in software development with expertise in modern technologies and frameworks.</p>
                </div>
                
                <div className={styles.resumeSection}>
                  <h4>Skills</h4>
                  <div className={styles.skillsList}>
                    <span className={styles.skillTag}>JavaScript</span>
                    <span className={styles.skillTag}>React</span>
                    <span className={styles.skillTag}>Node.js</span>
                    <span className={styles.skillTag}>Python</span>
                    <span className={styles.skillTag}>Database Design</span>
                    <span className={styles.skillTag}>API Development</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.popupActions}>
                <button className={styles.popupDownloadBtn}>
                  <span className={styles.downloadIcon}>⬇️</span>
                  Download Resume
                </button>
                <button className={styles.popupPrintBtn}>
                  <span className={styles.printIcon}>🖨️</span>
                  Print Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1:1 Chat Popup */}
      {isChatOpen && chatCandidate && (
        <ChatApplication candidate={chatCandidate} onClose={closeChat} />
      )}

      {/* 1:1 Video Call Popup */}
      {isVideoOpen && videoCandidate && (
        <VideoCall candidate={videoCandidate} onClose={closeVideo} />
      )}
    </div>
  );
};

export default ApplicationManager;