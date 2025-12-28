// src/pages/KaajKhojoLanding.jsx
import React, { useEffect, useState } from "react";
import styles from "./homepage.module.css";
import Footer from "../Component/Footer";
import LogoLoop from "../Component/homepage_component/LogoLoop";
import Header from "../Component/homepage_component/header";
import JobCard from "../Component/homepage_component/jobcards";
import Companycard from "../Component/homepage_component/companycard";
import Testimonials from "../Component/homepage_component/Testimonial";

/**
 * KkStats - in-file component that fetches stats from
 * GET {REACT_APP_API_BASE_URL || "http://localhost:8080"}/api/v1/admin/overview
 * and renders your statcards (keeps your ICON paths & styles)
 */
function KkStats() {
    const [stats, setStats] = useState([
        { label: "Live Job", n: 0, icon: "briefcase" },
        { label: "Companies", n: 0, icon: "buildings" },
        { label: "Users", n: 0, icon: "users" },
        { label: "Applications", n: 0, icon: "newJobs" }
    ]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const baseApi = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
    const token = localStorage.getItem("authToken"); // change if your auth is elsewhere

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`${baseApi}/api/v1/admin/overview`, {
                    method: "GET",
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                });

                // parse JSON safely
                const raw = await res.json().catch(async () => {
                    const t = await res.text().catch(() => "");
                    throw new Error(`Invalid JSON response. Body: ${t}`);
                });

                if (!res.ok) {
                    throw new Error(
                        `Stats API ${res.status} ${res.statusText} — ${JSON.stringify(raw).slice(
                            0,
                            200
                        )}`
                    );
                }

                if (!mounted) return;

                const payload = raw?.data ?? raw?.result ?? raw?.payload ?? raw;

                // read exact keys your backend uses
                const jobsCount = payload?.jobs;
                const recruitersCount = payload?.recruiters;
                const usersCount = payload?.users;
                const applicationsCount = payload?.applications;

                if (
                    jobsCount !== undefined ||
                    recruitersCount !== undefined ||
                    usersCount !== undefined ||
                    applicationsCount !== undefined
                ) {
                    setStats([
                        { label: "Live Job", n: jobsCount ?? 0, icon: "briefcase" },
                        { label: "Companies", n: recruitersCount ?? 0, icon: "buildings" },
                        { label: "Users", n: usersCount ?? 0, icon: "users" },
                        {
                            label: "Applications",
                            n: applicationsCount ?? 0,
                            icon: "newJobs"
                        }
                    ]);
                } else {
                    console.warn("Stats keys not found in payload:", payload);
                }
            } catch (err) {
                console.error("Failed to fetch stats:", err);
                setError(err.message || "Failed to load stats");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [baseApi, token]);

    // keep your ICON logic & PUBLIC_URL base
    const base = process.env.PUBLIC_URL || "";
    const ICONS = {
        briefcase: `${base}../Images/Homepage/Assets/livejobs.svg`,
        buildings: `${base}../Images/Homepage/Assets/companies.svg`,
        users: `${base}../Images/Homepage/Assets/candidates.svg`,
        newJobs: `${base}../Images/Homepage/Assets/livejobs.svg`
    };

    const formatNumber = (val) => {
        if (val === null || val === undefined) return "0";
        if (typeof val === "string" && val.includes(",")) return val;
        const num = Number(val);
        if (!isNaN(num)) return num.toLocaleString("en-IN");
        return String(val);
    };

    return (
        <section className={styles["kk-stats"]}>
            <div className={styles["kk-container"]}>
                <div className={styles["kk-stats-grid"]}>
                    {loading && (
                        <div style={{ gridColumn: "1/-1", textAlign: "center" }}>
                            Loading stats…
                        </div>
                    )}

                    {error && (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#666" }}>
                            Couldn't load stats — showing fallback values.
                            <div style={{ fontSize: 12 }}>{error}</div>
                        </div>
                    )}

                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className={`${styles["kk-statcard"]} ${
                                s.active ? styles["is-active"] : ""
                            }`}
                        >
                            <div className={styles["kk-stat-ico"]} aria-hidden="true">
                                <img
                                    src={ICONS[s.icon] || ICONS["briefcase"]}
                                    alt=""
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = `${base}/Assets/icons/briefcase.png`;
                                    }}
                                />
                            </div>

                            <div className={styles["kk-stat-body"]}>
                                <div className={styles["kk-stat-n"]}>{formatNumber(s.n)}</div>
                                <div className={styles["kk-stat-l"]}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>    // logos (static)
    );
}

export default function KaajKhojoLanding() {  
    const fallbackLogos = [];

    const baseApi = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
    const publicBase = process.env.PUBLIC_URL || "";
    const token = localStorage.getItem("authToken");
    const fetchHeaders = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const buildImageUrl = (raw) => {
        if (!raw) return `${publicBase}/Images/Default.png`;
        const src = String(raw).trim();
        if (src.startsWith("http")) return src;
        return `${baseApi}/${src.replace(/^\/+/, "")}`;
    };

    const normalizeJobs = (list = []) =>
        list.map((job) => ({
            id: job?._id || job?.id,
            title: job?.title || job?.jobTitle || "Untitled role",
            jobType: job?.jobType || job?.status || "N/A",
            cat_name: job?.cat_name || job?.category || job?.categoryName || "General",
            location: job?.location || job?.city || job?.address || "Location not provided",
            description: job?.description || job?.job_description || "",
            company: job?.company || job?.companyName || job?.recruiter || "Unknown company",
            logo: buildImageUrl(job?.image || job?.logo || job?.companyLogo)
        }));

    const deriveCompanies = (list = []) => {
        const uniq = new Map();
        list.forEach((job) => {
            const name = job.company || "Unknown company";
            if (!uniq.has(name)) {
                uniq.set(name, {
                    company: name,
                    location: job.location || "Location not provided",
                    logo: job.logo
                });
            }
        });
        return Array.from(uniq.values());
    };

    // Jobs & companies states
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [jobsError, setJobsError] = useState(null);

    const [companies, setCompanies] = useState([]);
    const [companiesLoading, setCompaniesLoading] = useState(true);
    const [companiesError, setCompaniesError] = useState(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setJobsLoading(true);
            setCompaniesLoading(true);
            setJobsError(null);
            setCompaniesError(null);

            try {
                const res = await fetch(`${baseApi}/api/v1/admin/list-job`, {
                    method: "GET",
                    headers: fetchHeaders
                });

                const text = await res.text();
                let payload = null;
                try {
                    payload = text ? JSON.parse(text) : [];
                } catch (parseErr) {
                    throw new Error(
                        `Invalid JSON from jobs API (${res.status}) — ${text?.slice(0, 200) || ""}`
                    );
                }

                if (!res.ok) {
                    throw new Error(
                        `Jobs API ${res.status} ${res.statusText} — ${JSON.stringify(payload).slice(
                            0,
                            200
                        )}`
                    );
                }

                if (!mounted) return;

                const rawList = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.items)
                    ? payload.items
                    : [];

                const normalizedJobs = normalizeJobs(rawList);
                setJobs(normalizedJobs);
                setCompanies(deriveCompanies(normalizedJobs));
            } catch (err) {
                console.error("Jobs fetch failed:", err);
                if (mounted) {
                    const message = err.message || "Failed to load featured jobs";
                    setJobsError(message);
                    setCompaniesError(message);
                    setJobs([]);
                    setCompanies([]);
                }
            } finally {
                if (mounted) {
                    setJobsLoading(false);
                    setCompaniesLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [baseApi, token]); // re-run if baseApi or token changes

    // How it works static steps
    const howSteps = [
        {
            title: "Create account",
            desc: "Sign up in minutes and set your skills and preferences.",
            icon: "../Images/Homepage/Assets/howworks/createaccount.svg"
        },
        {
            title: "Find suitable job",
            desc: "Search smart filters to match roles that fit you best.",
            icon: "../Images/Homepage/Assets/howworks/findjob.svg"
        },
        {
            title: "Apply job",
            desc: "Submit your profile and track application status instantly.",
            icon: "../Images/Homepage/Assets/howworks/applyjob.svg"
        }
    ];

    const topCompanyLogos = companies
        .filter((c) => c?.logo)
        .slice(0, 12)
        .map((c) => ({
            src: c.logo,
            alt: c.company || "Company"
        }));

    const displayLogos = topCompanyLogos.length ? topCompanyLogos : fallbackLogos;

    return (
        <>
            <div className={styles["kk-root"]}>
                {/* Header */}
                <header>
                    <Header />
                </header>

                {/* Hero */}
                <section className={styles["kk-hero"]}>
                    <div className={`${styles["kk-container"]} ${styles["kk-hero-grid"]}`}>
                        <div className={styles["kk-hero-left"]}>
                            <h1 className={styles["kk-hero-title"]}>
                                Work Smarter. <br />
                                <span className={styles.accent}>Get Hired Faster.</span>
                            </h1>
                            <p className={styles["kk-hero-sub"]}>
                                Discover a wide range of job opportunities across various
                                industries. Browse through our extensive listings and take the first
                                step towards your next career move.
                            </p>
                        </div>

                        <div className={styles["kk-hero-right"]}>
                            <div className={styles["kk-illus"]}>
                                <img
                                    src="../Images/Homepage/Assets/Illustration.svg"
                                    alt="Creative workspace"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats (live) */}
                    <KkStats />
                </section>

                {/* Top Companies logos */}
                <section className={styles["kk-logos"]}>
                    <div className={styles["kk-container"]}>
                        <h3 className={styles["kk-section-title"]}>Top companies in our website</h3>
                        <div style={{ padding: "20px 0" }}>
                            <LogoLoop
                                logos={displayLogos}
                                speed={70}
                                direction="left"
                                gap={50}
                                logoHeight={48}
                                fadeOut
                                scaleOnHover
                            />
                        </div>
                    </div>
                </section>

                {/* Featured Jobs */}
                <section
                    id="jobs"
                    className={`${styles["kk-featured"]} ${styles["kk-featured-jobs"]}`}
                >
                    <div className={styles["kk-container"]}>
                        <h3 className={styles["kk-section-title_2"]}>
                            Featured <span className={styles.accent}>jobs</span>
                        </h3>
                        <a href="/login" className={styles["kk-show-all"]}>
                            Show all jobs →
                        </a>

                        <div className={styles["kk-card-grid"]}>
                            {jobsLoading && (
                                <div style={{ gridColumn: "1/-1", textAlign: "center" }}>
                                    Loading jobs…
                                </div>
                            )}

                            {jobsError && (
                                <div
                                    style={{
                                        gridColumn: "1/-1",
                                        textAlign: "center",
                                        color: "#666"
                                    }}
                                    role="status"
                                    aria-live="polite"
                                >
                                    {jobsError}
                                </div>
                            )}

                            {jobs.length > 0
                                ? jobs.map((job, i) => (
                                      <article
                                          className={`${styles["kk-card"]} ${styles["kk-job-card"]}`}
                                          key={job._id ?? job.id ?? i}
                                      >
                                          <JobCard job={job} />
                                      </article>
                                  ))
                                : /* show placeholders while empty (keeps layout stable) */
                                  Array.from({ length: 8 }).map((_, i) => (
                                      <article
                                          className={`${styles["kk-card"]} ${styles["kk-job-card"]}`}
                                          key={`fallback-job-${i}`}
                                          aria-hidden={jobsLoading ? "true" : "false"}
                                      >
                                          <JobCard />
                                      </article>
                                  ))}
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section className={styles["kk-how"]}>
                    <div className={styles["kk-container"]}>
                        <h3 className={styles["kk-section-title"]}>How KaajKhojo work</h3>

                        <div className={styles["arrowbetween-img"]}>
                            <img
                                className={styles["between-img-1-2"]}
                                src="../Images/Homepage/Assets/howworks/Arrowsd.svg"
                                alt=""
                            />
                            <img
                                className={styles["between-img-2-3"]}
                                src="../Images/Homepage/Assets/howworks/Arrowsu.svg"
                                alt=""
                            />
                        </div>

                        <div className={styles["kk-steps"]}>
                            {howSteps.map((s, i) => (
                                <div className={styles["kk-step"]} key={i}>
                                    <div className={styles["kk-step-ico"]}></div>
                                    <img src={s.icon} alt="" aria-hidden="true" />
                                    <h4>{s.title}</h4>
                                    <p>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Featured Companies */}
                <section
                    id="companies"
                    className={`${styles["kk-featured"]} ${styles["kk-featured-companies"]}`}
                >
                    <div className={styles["kk-container"]}>
                        <h3 className={styles["kk-featured-companies"]}>
                            Featured <span className={styles.accent}>companies</span>
                        </h3>
                        <a href="/login" className={styles["kk-show-all_companies"]}>
                            Show all Companies →
                        </a>

                        <div className={`${styles["kk-card-grid"]} ${styles["kk-company-grid"]}`}>
                            {companiesLoading && (
                                <div style={{ gridColumn: "1/-1", textAlign: "center" }}>
                                    Loading companies…
                                </div>
                            )}
                            {companiesError && (
                                <div
                                    style={{
                                        gridColumn: "1/-1",
                                        textAlign: "center",
                                        color: "#666"
                                    }}
                                >
                                    {companiesError}
                                </div>
                            )}

                            {companies.length > 0
                                ? companies.map((company, i) => (
                                      <article
                                          className={`${styles["kk-card"]} ${styles["kk-company-card"]}`}
                                          key={company.id ?? company.company ?? i}
                                      >
                                          <Companycard
                                              company={company.company}
                                              location={company.location}
                                              logoSrc={company.logo}
                                              featured
                                          />
                                      </article>
                                  ))
                                : Array.from({ length: 6 }).map((_, i) => (
                                      <article
                                          className={`${styles["kk-card"]} ${styles["kk-company-card"]}`}
                                          key={`fallback-company-${i}`}
                                      >
                                          <Companycard />
                                      </article>
                                  ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section id="testimonials" className={styles["kk-testimonials"]}>
                    <div className={styles["kk-container"]}>
                        <h3 className={styles["kk-section-title"]}>Clients Testimonial</h3>
                        <div className={styles["kk-testimonial-row"]}>
                            <Testimonials />
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </>
    );
}