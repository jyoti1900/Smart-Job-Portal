import React from "react";
import styles from "./UserProfile.module.css";

export default function SectionExperience({ experience = [] }) {
    if (!experience || experience.length === 0) {
        return (
            <div className={styles.section}>
                <h3>Experience</h3>
                <p style={{ color: "#666" }}>No experience listed yet.</p>
            </div>
        );
    }

    const getMonth = (monthVal) => {
        if (!monthVal) return "";
        if (typeof monthVal === "string") return monthVal;
        if (typeof monthVal === "object") return monthVal.month || monthVal.name || "";
        return String(monthVal);
    };

    const getYear = (yearVal) => {
        if (!yearVal) return "";
        if (typeof yearVal === "string" || typeof yearVal === "number") return String(yearVal);
        if (typeof yearVal === "object") return String(yearVal.year || yearVal.name || "");
        return "";
    };

    return (
        <div className={styles.section}>
            <h3>Experience</h3>
            <div className={styles.cardsWrap}>
                {experience.map((exp, i) => {
                    const startMonth = getMonth(exp.start_date?.month);
                    const startYear = getYear(exp.start_date?.year);
                    const start = `${startMonth} ${startYear}`.trim();

                    // ✅ Correct Present handling
                    const isPresent =
                        (!exp.end_date?.month && !exp.end_date?.year) ||
                        exp.end_date === null ||
                        exp.end_date?.present === true;

                    const end = isPresent
                        ? "Present"
                        : (() => {
                              const endMonth = getMonth(exp.end_date?.month);
                              const endYear = getYear(exp.end_date?.year);
                              return `${endMonth} ${endYear}`.trim();
                          })();

                    return (
                        <div
                            key={exp._id || exp.id || i}
                            className={styles.expCard}
                        >
                            <div className={styles.cardHeader}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{exp.role}</h4>
                                    <p className={styles.company} style={{ margin: "6px 0 0" }}>
                                        {exp.company}
                                    </p>
                                    <p className={styles.duration} style={{ margin: "6px 0 0" }}>
                                        {start && end ? `${start} — ${end}` : start || end || ""}
                                    </p>
                                </div>
                            </div>

                            {exp.description ? (
                                <p style={{ marginTop: 10 }}>{exp.description}</p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
