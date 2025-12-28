// src/SectionResume.jsx
import React, { useState } from "react";
import styles from "./UserProfile.module.css";

export default function SectionResume({ resume = null }) {
  const [open, setOpen] = useState(false);

  const documentUrl =
    typeof resume === "string"
      ? resume
      : resume?.document || "";

  const hasResume = !!documentUrl;

  return (
    <div className={styles.section}>
      <h3>Resume</h3>

      <div className={styles.resumeRow}>
        <button
          className={styles.resumeViewBtn}
          onClick={() => setOpen(true)}
          disabled={!hasResume}
        >
          View
        </button>

        {!hasResume ? (
          <span className={styles.resumeWarning}>No Resume added</span>
        ) : (
          <span style={{ marginLeft: 8, color: "#444" }}>
            {/* {documentUrl.split("/").pop()} */}
          </span>
        )}
      </div>

      {open && hasResume && (
        <div className={styles.resumeOverlay} onClick={() => setOpen(false)}>
          <div
            className={styles.resumePanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.resumeHeader}>
              <div style={{ fontWeight: 700 }}>
                {documentUrl.split("/").pop()}
              </div>
              <button
                className={styles.btn}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <iframe
              src={documentUrl}
              title="Resume preview"
              className={styles.resumeFrame}
              style={{ width: "100%", height: "600px", border: "none" }}
              allow="fullscreen"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}

