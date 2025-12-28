import React from "react";
import styles from "./jobcards.module.css";

function resolveImage(raw, fallback) {
  if (!raw) return fallback;
  const src = String(raw).trim();
  if (src.startsWith("http")) return src;
  return `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}/${src.replace(
    /^\/+/,
    ""
  )}`;
}

function truncateWords(text, limit = 10) {
  if (!text) return "No description available.";
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text;
  return `${words.slice(0, limit).join(" ")}...`;
}

export default function JobCard({ job = {} }) {
  const publicBase = process.env.PUBLIC_URL || "";
  const fallbackLogo = `${publicBase}/Images/Default.png`;

  const {
    title = "Untitled role",
    jobType = "N/A",
    cat_name: category,
    catName,
    location,
    city,
    description,
    image,
    logo,
    companyLogo
  } = job;

  const resolvedLogo = resolveImage(image || logo || companyLogo, fallbackLogo);
  const resolvedLocation = location || city || "Location not provided";
  const resolvedCategory = category || catName || "General";

  return (
    <article className={styles["job-card"]} role="listitem" aria-label={title}>
      <div className={styles["job-card__avatar"]} aria-hidden="true">
        <img src={resolvedLogo} alt="" loading="lazy" />
      </div>

      <span className={styles["job-card__badge"]}>{jobType || "—"}</span>

      <h3 className={styles["job-card__title"]}>{title}</h3>

      <p className={styles["job-card__meta"]}>
        <span>{resolvedCategory}</span>
        <span>{resolvedLocation}</span>
      </p>

      <p className={styles["job-card__desc"]}>{truncateWords(description, 10)}</p>

      <div className={styles["job-card__tags"]}>
        {/* <span className={`${styles["job-tag"]} ${styles["job-tag--marketing"]}`}>
          {jobType || "Job type"}
        </span> */}

        <span className={`${styles["job-tag"]} ${styles["job-tag--design"]}`}>
          {resolvedCategory}
        </span>
      </div>
    </article>
  );
}
