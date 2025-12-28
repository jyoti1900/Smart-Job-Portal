// src/SectionCertifications.jsx
import React from "react";
import styles from "./UserProfile.module.css";

/**
 * Renders certifications.
 * Priority for heading link:
 *  1) cert.link (external URL) if present
 *  2) cert.fileUrl (uploaded file preview URL) if cert.link not present
 *  3) plain text if neither present
 *
 * Supports cert being string (legacy) or an object.
 */
export default function SectionCertifications({ certifications = [] }) {
  return (
    <div className={styles.section}>
      <h3>Certifications</h3>

      {(!certifications || certifications.length === 0) ? (
        <p style={{ color: "#666" }}>No certifications added yet.</p>
      ) : (
        <div className={styles.cardsWrap}>
          {certifications.map((cert, i) => {
            // support string or object
            if (typeof cert === "string") {
              return (
                <div key={i} className={styles.certCard}>
                  <p>{cert}</p>
                </div>
              );
            }

            const name = cert.certificationName || cert.title || "Untitled Certificate";
            const learned = cert.learned || cert.description || "";
            const externalLink = cert.link && cert.link.trim() ? cert.link.trim() : null;
            const fileLink = cert.document && cert.document.trim() ? cert.document.trim() : null;

            // Decide preferred link: externalLink else fileLink else null
            const headingHref = externalLink || fileLink || null;

            return (
              <div key={cert.id || i} className={styles.certCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h4 className={styles.certHeading} style={{ margin: 0 }}>
                      {headingHref ? (
                        // open in new tab for external or file previews
                        <a href={headingHref} target="_blank" rel="noopener noreferrer">{name}</a>
                      ) : (
                        <strong>{name}</strong>
                      )}
                    </h4>
                  </div>
                </div>

                {learned ? <p style={{ marginTop: 8 }}>{learned}</p> : null}

                {((cert.skillTag && cert.skillTag.length > 0) || (cert.skillsLearned && cert.skillsLearned.length > 0)) && (
                  <div className={styles.projectSkills} style={{ marginTop: 8 }}>
                    {(cert.skillTag || cert.skillsLearned || []).map((sk, idx) => (
                      <span key={`${sk}-${idx}`} className={styles.skillTag}>{sk}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
