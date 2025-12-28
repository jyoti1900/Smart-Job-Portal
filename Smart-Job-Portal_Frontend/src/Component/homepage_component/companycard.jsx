import React from "react";
import styles from "./companycard.module.css";

function resolveImage(raw, fallback) {
  if (!raw) return fallback;
  const src = String(raw).trim();
  if (src.startsWith("http")) return src;
  return `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}/${src.replace(
    /^\/+/,
    ""
  )}`;
}

export default function CompanyCard({
  company = "Company",
  location = "Location not provided",
  featured = true,
  logoSrc
}) {
  const publicBase = process.env.PUBLIC_URL || "";
  const fallbackLogo = `${publicBase}/Images/Default.png`;
  const resolvedLogo = resolveImage(logoSrc, fallbackLogo);

  return (
    <article className={styles["jc-card"]}>
      {featured && <span className={styles["jc-badge"]}>Featured</span>}
      <div className={styles["jc-top"]}>
        <div className={styles["jc-logo-wrapper"]}>
          <div className={styles["jc-logo"]} aria-hidden="true">
            <img src={resolvedLogo} alt={`${company} logo`} loading="lazy" />
          </div>
        </div>

        <div className={styles["jc-meta"]}>
          <div className={styles["jc-title-row"]}>
            <h4 className={styles["jc-title"]}>{company}</h4>
          </div>

          <div className={styles["jc-location"]}>
            <img src="./Assets/MapPin.svg" alt="" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
