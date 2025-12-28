import React from "react";
import styles from "./UserProfile.module.css";

export default function SectionAbout({ about }) {
  return (
    <div className={styles.section}>
      <h3>About</h3>
      <p>{about}</p>
    </div>
  );
}
