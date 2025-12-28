import React from "react";
import styles from "./UserProfile.module.css";

export default function SectionProjects({ projects = [] }) {
  return (
    <div className={styles.section}>
      <h3>Projects</h3>

      {(!projects || projects.length === 0) ? (
        <p style={{ color: "#666" }}>No projects added yet.</p>
      ) : (
        <div className={styles.cardsWrap}>
          {projects.map((p, i) => (
            <div key={p.id || i} className={styles.projectCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h4 style={{ margin: 0 }}>
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noreferrer">{p.projectName}</a>
                    ) : (
                      p.projectName
                    )}
                  </h4>
                </div>
              </div>

              {p.brief ? <p style={{ marginTop: 10 }}>{p.brief}</p> : null}

              {((p.skillTag && p.skillTag.length > 0) || (p.skillsLearned && p.skillsLearned.length > 0)) && (
                <div className={styles.projectSkills} style={{ marginTop: 10 }}>
                  {(p.skillTag || p.skillsLearned || []).map((sk, idx) => (
                    <span className={styles.skillTag} key={`${sk}-${idx}`}>{sk}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
