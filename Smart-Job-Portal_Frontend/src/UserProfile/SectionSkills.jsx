import React from "react";
import styles from "./UserProfile.module.css";

export default function SectionSkills({ skills }) {
  return (
    <div className={styles.section}>
      <h3>Skills</h3>
      <div className={styles.skillsList}>
        {skills.map((skill, index) => (
          <span key={index} className={styles.skillTag}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
