import React from "react";
import styles from "./UserProfile.module.css";

export default function ProfileHeader({ user, onEdit, hasValidationErrors }) {
  if (!user) return null;

  return (
    <div className={styles.userHeader}>
      <img
        src={user.profile_image || process.env.PUBLIC_URL + "/Images/Default.png"}
        alt="Profile"
        className={styles.userAvatar}
        width={120}
        height={120}
      />

      <div style={{ flex: 1 }}>
        <h2 style={{ margin: 0 }}>{user.name}</h2>
        <p className={styles.title} style={{ margin: "6px 0" }}>{user.title}</p>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
          {/* <span className={styles.location}>{user.location}</span> */}
          {user.email ? <span className={styles.location}>{user.email}</span> : null}
          {user.mobile ? <span className={styles.location}>{user.mobile}</span> : null}
        </div>
        <span className={styles.location}>{user.address}</span>
      </div>

      <button className={styles.editBtn} onClick={onEdit} style={{ position: "relative" }}>
        Edit Profile
        {hasValidationErrors && <span className={styles.errorDot} />}
      </button>
    </div>
  );
}
