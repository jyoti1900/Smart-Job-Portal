import React from "react";
import styles from "./UserProfile.module.css";

export default function SectionEducation({ education = [] }) {
    return (
        <div className={styles.section}>
            <h3>Education</h3>

            {!education || education.length === 0 ? (
                <p style={{ color: "#666" }}>No education records added yet.</p>
            ) : (
                <div className={styles.cardsWrap}>
                    {education.map((e, i) => (
                        <div key={e._id || i} className={styles.eduCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{e.degree}</h4>
                                    <p style={{ margin: "6px 0 0" }}>{e.institution}</p>

                                    <p className={styles.duration} style={{ marginTop: 6 }}>
                                        {e?.year?.passoutyear || ""}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
