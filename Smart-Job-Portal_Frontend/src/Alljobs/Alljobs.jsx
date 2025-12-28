import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";
import styles from "./Alljobs.module.css";
import { FaMapMarkerAlt } from "react-icons/fa";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import UserNavbar from "../Component/User_Navbar";
import FooterUser from "../Component/User_Footer";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080/api/v1/customer";
const CATEGORY_API = "http://localhost:8080/api/v1/customer/job-category-dropdown";
const COMPANY_API = "http://localhost:8080/api/v1/customer/jobs";

const STATUS_OPTIONS = ["Hybrid", "Part Time", "Full Time", "Remote"];
const EXPERIENCE_OPTIONS = [
  { key: "fresher", label: "Fresher" },
  { key: "lt1", label: "Less than 1 yr" },
  { key: "1to3", label: "1 - 3 yr" },
  { key: "gt3", label: "More than 3 yrs" }
];

/** Display pill + class for jobType text */
function normalizeJobType(raw) {
  const t = String(raw || "").trim().toLowerCase();
  if (/(full[\s-]?time|ft)/.test(t)) return { token: styles.fullTime, label: "Full Time" };
  if (/(part[\s-]?time|pt)/.test(t)) return { token: styles.partTime, label: "Part Time" };
  if (/(hybrid(ship)?|trainee)/.test(t)) return { token: styles.hybrid, label: "Hybrid" };
  if (/(remote|wfh|work[\s-]?from[\s-]?home)/.test(t)) return { token: styles.remote, label: "Remote" };
  return { token: styles.fullTime, label: "Full Time" };
}

/** Map UI status labels -> API tokens */
function mapStatusForAPI(label) {
  const t = String(label || "").toLowerCase();
  if (t.includes("full")) return "Full Time";
  if (t.includes("part")) return "Part Time";
  if (t.includes("hybrid")) return "Hybrid";
  if (t.includes("remote") || t.includes("wfh")) return "Remote";
  return "Full Time";
}

/** Better slider step */
function computeNiceStep(min, max) {
  const span = Math.max(1, max - min);
  const rough = span / 200;
  const candidates = [100, 250, 500, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  for (const c of candidates) if (rough <= c) return c;
  return candidates[candidates.length - 1];
}

/** Unique, case-insensitive (keeps original casing) */
function uniqueCaseInsensitive(list) {
  const seen = new Set();
  const out = [];
  for (const s of list) {
    const key = String(s || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(String(s).trim());
  }
  return out;
}

function FilterSidebar({ meta, appliedFilters, onFiltersChange, onReset, filteredJobs }) {
  const [openCategory, setOpenCategory] = useState(true);
  const [openCompany, setOpenCompany] = useState(true);

  // Local state for filter values
  const [categorySet, setCategorySet] = useState(new Set());
  const [companySet, setCompanySet] = useState(new Set());
  const [statusSet, setStatusSet] = useState(new Set());
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const minBound = 0; // Always start from 0
  
  // Calculate dynamic max salary from filtered jobs
  const calculateDynamicMaxSalary = useCallback((jobs) => {
    if (!jobs || jobs.length === 0) return meta?.maxSalary ?? 100000;
    
    const salaries = jobs
      .map(job => {
        const salaryStr = String(job?.salary || "0");
        // Extract numeric value from salary string
        const numericValue = parseFloat(salaryStr.replace(/[^0-9.]/g, '')) || 0;
        return numericValue;
      })
      .filter(s => s > 0);
    
    if (salaries.length === 0) return meta?.maxSalary ?? 100000;
    const maxSalary = Math.max(...salaries);
    // Round up to nearest 10000 for better UX
    return Math.ceil(maxSalary / 10000) * 10000;
  }, [meta?.maxSalary]);

  const [dynamicMaxBound, setDynamicMaxBound] = useState(() => 
    calculateDynamicMaxSalary(filteredJobs || [])
  );
  
  const [salaryMin, setSalaryMin] = useState(minBound);
  const [salaryMax, setSalaryMax] = useState(dynamicMaxBound);

  // Track if salary filter is manually set
  const [isSalaryManuallySet, setIsSalaryManuallySet] = useState(false);
  const prevDynamicMaxRef = useRef(dynamicMaxBound);

  // Update dynamic max bound when filtered jobs change
  useEffect(() => {
    const newMax = calculateDynamicMaxSalary(filteredJobs || []);
    const prevMax = prevDynamicMaxRef.current;
    prevDynamicMaxRef.current = newMax;
    setDynamicMaxBound(newMax);
    
    // If salary is not manually set, always update salaryMax to match new dynamic max
    if (!isSalaryManuallySet) {
      setSalaryMax(newMax);
    } else {
      // Salary was manually set - check if it needs adjustment
      // If salaryMax was at the previous dynamicMaxBound and filters changed, 
      // it means the user didn't actually set it manually, so reset it
      if (salaryMax === prevMax && prevMax !== newMax && salaryMin === minBound) {
        setSalaryMax(newMax);
        setIsSalaryManuallySet(false);
      } else if (salaryMax > newMax) {
        // Adjust current max if it exceeds new max (but keep it manually set)
        setSalaryMax(newMax);
      } else if (salaryMax === newMax && salaryMin === minBound) {
        // If both are at defaults after filter change, reset the flag
        setIsSalaryManuallySet(false);
      }
    }
  }, [filteredJobs, calculateDynamicMaxSalary, isSalaryManuallySet, salaryMax, salaryMin, minBound]);

  // Initialize local state only once when component mounts
  useEffect(() => {
    if (appliedFilters) {
      setCategorySet(new Set(appliedFilters.categories || []));
      setCompanySet(new Set(appliedFilters.company || []));
      setStatusSet(new Set(appliedFilters.statuses || []));
      setExperience(appliedFilters.experience || "");
      setSkills(appliedFilters.skills || []);
      const hasSalaryFilter = appliedFilters.salaryMin !== null && appliedFilters.salaryMin !== undefined && appliedFilters.salaryMin !== minBound;
      const hasSalaryMaxFilter = appliedFilters.salaryMax !== null && appliedFilters.salaryMax !== undefined;
      setIsSalaryManuallySet(hasSalaryFilter || hasSalaryMaxFilter);
      setSalaryMin(appliedFilters.salaryMin ?? minBound);
      setSalaryMax(appliedFilters.salaryMax ?? dynamicMaxBound);
    }
  }, []); // Empty dependency array - only run once on mount

  // Auto-apply filters when any filter changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Check if salary is actually being used as a filter (not at default values)
      const isSalaryFilterActive = isSalaryManuallySet && (salaryMin !== minBound || salaryMax !== dynamicMaxBound);
      
      const filters = {
        categories: Array.from(categorySet),
        company: Array.from(companySet),
        statuses: Array.from(statusSet),
        experience,
        skills,
        salaryMin: isSalaryFilterActive && salaryMin !== minBound ? salaryMin : null,
        salaryMax: isSalaryFilterActive && salaryMax !== dynamicMaxBound ? salaryMax : null
      };
      onFiltersChange(filters);
      
      // If salary is back to defaults, reset the manual flag
      if (!isSalaryFilterActive && isSalaryManuallySet) {
        setIsSalaryManuallySet(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [categorySet, companySet, statusSet, experience, skills, salaryMin, salaryMax, onFiltersChange, minBound, dynamicMaxBound, isSalaryManuallySet]);

  const toggleSet = (setFn, currentSet, value) => {
    const next = new Set(currentSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setFn(next);
  };

  // Extract all unique skills from jobs for autocomplete
  useEffect(() => {
    if (meta?.allSkills && meta.allSkills.length > 0) {
      setSkillSuggestions(meta.allSkills);
    }
  }, [meta?.allSkills]);

  const addSkill = () => {
    const clean = skillInput.trim();
    if (!clean) return;
    const existsCI = skills.some((s) => s.toLowerCase() === clean.toLowerCase());
    if (!existsCI) {
      const newSkills = [...skills, clean];
      setSkills(newSkills);
    }
    setSkillInput("");
    setShowSuggestions(false);
  };

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    setSkillInput(value);
    
    if (value.trim() && meta?.allSkills && meta.allSkills.length > 0) {
      // Filter suggestions based on input
      const filtered = meta.allSkills.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase())
      );
      setSkillSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSkillFromSuggestion = (skill) => {
    const existsCI = skills.some((s) => s.toLowerCase() === skill.toLowerCase());
    if (!existsCI) {
      setSkills([...skills, skill]);
    }
    setSkillInput("");
    setShowSuggestions(false);
  };

  const removeSkill = (s) => {
    const newSkills = skills.filter((x) => x !== s);
    setSkills(newSkills);
  };

  const handleReset = () => {
    setCategorySet(new Set());
    setCompanySet(new Set());
    setStatusSet(new Set());
    setExperience("");
    setSkills([]);
    setSalaryMin(minBound);
    setSalaryMax(dynamicMaxBound);
    setIsSalaryManuallySet(false);
    onReset?.();
  };

  const step = computeNiceStep(minBound, dynamicMaxBound);
  const minGap = step * 2; // Minimum gap between min and max (2 steps)
  const minPercent = ((Math.min(salaryMin, salaryMax) - minBound) / Math.max(1, dynamicMaxBound - minBound)) * 100;
  const maxPercent = ((Math.max(salaryMin, salaryMax) - minBound) / Math.max(1, dynamicMaxBound - minBound)) * 100;

  const handleSalaryMinChange = (value) => {
    const numValue = Math.max(minBound, Math.min(value, dynamicMaxBound));
    const currentMax = Math.max(salaryMin, salaryMax);
    const newMin = Math.min(numValue, currentMax - minGap);
    setSalaryMin(newMin);
    // Only set manual flag if value is different from default
    if (newMin !== minBound) {
      setIsSalaryManuallySet(true);
    } else if (salaryMax === dynamicMaxBound) {
      // If both are at defaults, reset the flag
      setIsSalaryManuallySet(false);
    }
    if (salaryMax < newMin + minGap) {
      setSalaryMax(Math.min(newMin + minGap, dynamicMaxBound));
    }
  };

  const handleSalaryMaxChange = (value) => {
    const numValue = Math.max(minBound, Math.min(value, dynamicMaxBound));
    const currentMin = Math.min(salaryMin, salaryMax);
    const newMax = Math.max(numValue, currentMin + minGap);
    setSalaryMax(newMax);
    // Only set manual flag if value is different from default
    if (newMax !== dynamicMaxBound) {
      setIsSalaryManuallySet(true);
    } else if (salaryMin === minBound) {
      // If both are at defaults, reset the flag
      setIsSalaryManuallySet(false);
    }
    if (salaryMin > newMax - minGap) {
      setSalaryMin(Math.max(newMax - minGap, minBound));
    }
  };

  return (
    <aside className={styles.filterSidebar}>
      <div className={styles.filterHeader}>
        <h3>Filter</h3>
        <button
          className={styles.resetLink}
          onClick={handleReset}
          aria-label="Reset filters"
        >
          Reset
        </button>
      </div>

      {/* Job Category */}
      <div className={styles.filterSection}>
        <button
          className={styles.sectionHeader}
          onClick={() => setOpenCategory((v) => !v)}
        >
          <span>Job Category</span>
          {openCategory ? <IoChevronUp /> : <IoChevronDown />}
        </button>

        {openCategory && (
          <div className={styles.checkboxList}>
            {meta?.categories?.length ? (
              meta.categories.map((catName) => {
                const clean = String(catName).trim();
                return (
                  <label key={clean} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={categorySet.has(clean)}
                      onChange={() =>
                        toggleSet(setCategorySet, categorySet, clean)
                      }
                    />
                    <span>{clean}</span>
                  </label>
                );
              })
            ) : (
              <div className={styles.emptyHint}>No categories found</div>
            )}
          </div>
        )}
      </div>

      {/* Job Status */}
      <div className={styles.filterSection}>
        <div className={`${styles.sectionHeader} ${styles.static}`}>
          <span>Job Status</span>
        </div>
        <div className={styles.statusGrid}>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              className={`${styles.statusCard} ${
                statusSet.has(st) ? styles.selected : ""
              }`}
              onClick={() => toggleSet(setStatusSet, statusSet, st)}
              type="button"
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Company */}
      <div className={styles.filterSection}>
        <button
          className={styles.sectionHeader}
          onClick={() => setOpenCompany((v) => !v)}
        >
          <span>Company</span>
          {openCompany ? <IoChevronUp /> : <IoChevronDown />}
        </button>

        {openCompany && (
          <div className={styles.checkboxList}>
            {meta?.company?.length ? (
              meta.company.map((companyName) => {
                const clean = String(companyName).trim();
                return (
                  <label key={clean} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={companySet.has(clean)}
                      onChange={() =>
                        toggleSet(setCompanySet, companySet, clean)
                      }
                    />
                    <span>{clean}</span>
                  </label>
                );
              })
            ) : (
              <div className={styles.emptyHint}>No companies found</div>
            )}
          </div>
        )}
      </div>

      {/* Salary */}
      <div className={styles.filterSection}>
        <div className={`${styles.sectionHeader} ${styles.static}`}>
          <span>Salary</span>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.rangeValues}>
            <input
              type="number"
              className={styles.salaryInput}
              value={Math.min(salaryMin, salaryMax)}
              min={minBound}
              max={dynamicMaxBound}
              onChange={(e) => {
                const value = Number(e.target.value) || minBound;
                handleSalaryMinChange(value);
              }}
              onBlur={(e) => {
                const value = Number(e.target.value) || minBound;
                handleSalaryMinChange(value);
              }}
            />
            <input
              type="number"
              className={styles.salaryInput}
              value={Math.max(salaryMin, salaryMax)}
              min={minBound}
              max={dynamicMaxBound}
              onChange={(e) => {
                const value = Number(e.target.value) || minBound;
                handleSalaryMaxChange(value);
              }}
              onBlur={(e) => {
                const value = Number(e.target.value) || minBound;
                handleSalaryMaxChange(value);
              }}
            />
          </div>

          <div className={styles.rangeSlider}>
            <div
              className={styles.rangeFill}
              style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
            />
            <input
              type="range"
              min={minBound}
              max={dynamicMaxBound}
              step={step}
              value={Math.min(salaryMin, salaryMax)}
              onChange={(e) => {
                handleSalaryMinChange(Number(e.target.value));
              }}
            />
            <input
              type="range"
              min={minBound}
              max={dynamicMaxBound}
              step={step}
              value={Math.max(salaryMin, salaryMax)}
              onChange={(e) => {
                handleSalaryMaxChange(Number(e.target.value));
              }}
            />
          </div>
        </div>
      </div>

      {/* Experience */}
      <div className={styles.filterSection}>
        <div className={`${styles.sectionHeader} ${styles.static}`}>
          <span>Experience</span>
        </div>
        <div className={styles.expGrid}>
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`${styles.expCard} ${
                experience === opt.key ? styles.selected : ""
              }`}
              onClick={() =>
                setExperience((prev) => (prev === opt.key ? "" : opt.key))
              }
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className={styles.filterSection}>
        <div className={`${styles.sectionHeader} ${styles.static}`}>
          <span>Skills</span>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.skillInputWrapper}>
            <div className={styles.skillInput}>
              <input
                type="text"
                value={skillInput}
                placeholder="Type skill and press Enter"
                onChange={handleSkillInputChange}
                onFocus={() => {
                  if (skillInput.trim() && meta?.allSkills && meta.allSkills.length > 0) {
                    const filtered = meta.allSkills.filter(skill =>
                      skill.toLowerCase().includes(skillInput.toLowerCase())
                    );
                    setSkillSuggestions(filtered);
                    setShowSuggestions(filtered.length > 0);
                  } else if (meta?.allSkills && meta.allSkills.length > 0) {
                    setSkillSuggestions(meta.allSkills.slice(0, 10));
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
              />
              <button onClick={addSkill} type="button">
                Add
              </button>
            </div>
            {showSuggestions && skillSuggestions.length > 0 && (
              <div className={styles.skillSuggestions}>
                {skillSuggestions.slice(0, 10).map((skill, idx) => (
                  <div
                    key={idx}
                    className={styles.skillSuggestionItem}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSkillFromSuggestion(skill);
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.skillChips}>
            {skills.map((s) => (
              <span className={styles.skillChip} key={s}>
                {s}
                <button
                  className={styles.chipClose}
                  onClick={() => removeSkill(s)}
                  type="button"
                  aria-label={`Remove ${s}`}
                  title={`Remove ${s}`}
                >
                  <span className={styles.cross} aria-hidden="true">X</span>
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AllJobs() {
  const [allJobs, setAllJobs] = useState([]); // Store all jobs from API
  const [page, setPage] = useState(1);
  const [perPage] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [searchText, setSearchText] = useState("");
  const [locationText, setLocationText] = useState("");

  const [meta, setMeta] = useState({
    categories: [],
    company: [],
    minSalary: 0,
    maxSalary: 10000000,
    allSkills: []
  });

  const [appliedFilters, setAppliedFilters] = useState({
    categories: [],
    company: [],
    statuses: [],
    experience: "",
    skills: [],
    salaryMin: null,
    salaryMax: null
  });

  const navigate = useNavigate();

  // === Fetch meta (categories, companies, salary bounds) ===
  useEffect(() => {
    const categoryController = new AbortController();
    const companyController = new AbortController();
    const boundsController = new AbortController();

    const fetchCategories = async () => {
      try {
        const res = await axios.get(CATEGORY_API, { signal: categoryController.signal });
        let raw =
          (Array.isArray(res.data) && res.data) ||
          (Array.isArray(res.data?.data) && res.data.data) ||
          (Array.isArray(res.data?.result) && res.data.result) ||
          (Array.isArray(res.data?.categories) && res.data.categories) ||
          [];
        const names = uniqueCaseInsensitive(
          raw.map((x) => x?.cat_name ?? x?.name ?? x?.title ?? String(x ?? "")).filter(Boolean)
        );
        setMeta((prev) => ({ ...prev, categories: names }));
      } catch (e) {
        console.error("Error fetching categories:", e);
      }
    };

    const fetchCompanies = async () => {
      try {
        const res = await axios.get(COMPANY_API, { signal: companyController.signal });
        const data = res?.data || {};
        const jobs = Array.isArray(data.data) ? data.data : [];
        const list = uniqueCaseInsensitive(
          jobs
            .map((j) => j?.company)
            .filter((s) => !!s && String(s).trim().toLowerCase() !== "undefined")
        );
        setMeta((prev) => ({ ...prev, company: list }));
      } catch (e) {
        console.error("Error fetching companies:", e);
      }
    };

    const fetchBounds = async () => {
      try {
        const res = await axios.get(`${API_BASE}/jobs/meta`, { signal: boundsController.signal });
        const data = res?.data || {};
        const minSalary =
          typeof data?.minSalary === "number" && isFinite(data.minSalary)
            ? data.minSalary
            : 0;
        const maxSalary =
          typeof data?.maxSalary === "number" && isFinite(data.maxSalary)
            ? data.maxSalary
            : 10000000;

        setMeta((prev) => ({
          ...prev,
          minSalary,
          maxSalary
        }));
      } catch (e) {
        console.error("Error fetching salary bounds:", e);
      }
    };

    fetchCategories();
    fetchCompanies();
    fetchBounds();

    return () => {
      categoryController.abort();
      companyController.abort();
      boundsController.abort();
    };
  }, []);

  // === Build request params from filters/search ===
  const queryParams = useMemo(() => {
    const f = appliedFilters || {};
    const statusTokens = (f.statuses || []).map(mapStatusForAPI);

    // Build params object - using exact parameter names your backend expects
    const params = {
      page: page,
      limit: perPage,
    };

    // Add search parameters
    if (searchText) params.search = searchText;
    if (locationText) params.location = locationText;

    // Add filter parameters - using exact backend parameter names
    if (f.categories?.length) params.cat_name = f.categories.join(",");
    if (f.company?.length) params.company = f.company.join(",");
    if (statusTokens.length) params.jobType = statusTokens.join(",");
    if (f.skills?.length) params.skills = f.skills.join(",");
    if (f.experience) params.experience = f.experience;
    
    // Only send salary filters if they are set and different from defaults
    if (f.salaryMin !== null && f.salaryMin !== undefined) params.minSalary = f.salaryMin;
    if (f.salaryMax !== null && f.salaryMax !== undefined) params.maxSalary = f.salaryMax;

    return params;
  }, [page, perPage, searchText, locationText, appliedFilters]);

  // === Fetch jobs from API ===
  useEffect(() => {
    const controller = new AbortController();
    const fetchJobs = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        const res = await axios.get(`${API_BASE}/jobs`, {
          params: queryParams,
          signal: controller.signal,
        });
        
        const data = res?.data || {};
        
        // Extract jobs from data.data array
        const list = Array.isArray(data.data) ? data.data : [];
        setAllJobs(list); // Store all jobs from API
        
        // Extract all unique skills from jobs
        const allSkillsList = [];
        list.forEach(job => {
          if (Array.isArray(job?.skills)) {
            allSkillsList.push(...job.skills.map(s => String(s || "").trim()).filter(Boolean));
          } else if (typeof job?.skills === 'string') {
            allSkillsList.push(...job.skills.split(/[,;|]/).map(s => s.trim()).filter(Boolean));
          } else if (Array.isArray(job?.skillTag)) {
            allSkillsList.push(...job.skillTag.map(s => String(s || "").trim()).filter(Boolean));
          }
        });
        const uniqueSkills = uniqueCaseInsensitive(allSkillsList);
        setMeta(prev => ({ ...prev, allSkills: uniqueSkills }));
        
        // Calculate total pages from count
        const totalCount = data.count || 0;
        const calculatedTotalPages = Math.max(1, Math.ceil(totalCount / perPage));
        setTotalPages(calculatedTotalPages);
        
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        console.error("Error fetching jobs:", err);
        setErrMsg(err.response?.data?.message || "Failed to load jobs. Please try again.");
        setAllJobs([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
    return () => controller.abort();
  }, [queryParams, perPage]);

  // === Filter jobs excluding salary filter (for dynamic salary range calculation) ===
  const filteredJobsForSalaryRange = useMemo(() => {
    if (!allJobs.length) return [];

    let filtered = [...allJobs];

    // Filter by job status
    if (appliedFilters.statuses && appliedFilters.statuses.length > 0) {
      const statusFilters = appliedFilters.statuses.map(mapStatusForAPI);
      filtered = filtered.filter(job => {
        const jobType = job?.jobType || "";
        return statusFilters.some(status => 
          jobType.toLowerCase().includes(status.toLowerCase())
        );
      });
    }

    // Filter by categories
    if (appliedFilters.categories && appliedFilters.categories.length > 0) {
      filtered = filtered.filter(job => 
        appliedFilters.categories.includes(job?.cat_name || "")
      );
    }

    // Filter by company
    if (appliedFilters.company && appliedFilters.company.length > 0) {
      filtered = filtered.filter(job => 
        appliedFilters.company.includes(job?.company || "")
      );
    }

    // Filter by experience
    if (appliedFilters.experience) {
      filtered = filtered.filter(job => {
        const expStr = String(job?.experience || "").toLowerCase().trim();
        const filterExp = appliedFilters.experience.toLowerCase();
        
        // Check if experience is in months
        const hasMonths = expStr.includes('month');
        const hasYears = expStr.includes('year') || expStr.includes('yr');
        
        // Extract numeric value
        const expNum = parseFloat(expStr.replace(/[^0-9.]/g, '')) || 0;
        
        // Convert months to years (divide by 12)
        let expInYears = expNum;
        if (hasMonths && !hasYears) {
          expInYears = expNum / 12;
        }
        
        if (filterExp === 'fresher') {
          return expInYears === 0 || expStr === '' || expStr.includes('fresher');
        }
        if (filterExp === 'lt1') {
          // Less than 1 year: > 0 and < 1 (includes months like 6 months = 0.5 years)
          return expInYears > 0 && expInYears < 1;
        }
        if (filterExp === '1to3') {
          // 1 to 3 years: >= 1 and <= 3
          return expInYears >= 1 && expInYears <= 3;
        }
        if (filterExp === 'gt3') {
          // More than 3 years: > 3
          return expInYears > 3;
        }
        return false;
      });
    }

    // Filter by skills - Show jobs with ANY selected skill or combinations (OR logic)
    if (appliedFilters.skills && appliedFilters.skills.length > 0) {
      filtered = filtered.filter(job => {
        let jobSkills = [];
        let jobSkillsRaw = []; // Keep original strings for checking combinations
        
        if (Array.isArray(job?.skills)) {
          jobSkills = job.skills.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
          jobSkillsRaw = job.skills.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
        } else if (typeof job?.skills === 'string') {
          const raw = job.skills.trim().toLowerCase();
          jobSkillsRaw = [raw];
          jobSkills = raw
            .split(/[,;|]/)
            .map(s => s.trim().toLowerCase())
            .filter(Boolean);
        } else if (job?.skillTag && Array.isArray(job.skillTag)) {
          jobSkills = job.skillTag.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
          jobSkillsRaw = job.skillTag.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
        }
        
        // Check if ANY selected skill is present in job skills (OR logic)
        return appliedFilters.skills.some(filterSkill => {
          const filterLower = filterSkill.toLowerCase().trim();
          
          // Check individual split skills
          const foundInSplit = jobSkills.some(jobSkill => {
            // Exact match (case-insensitive)
            if (jobSkill === filterLower) return true;
            
            // For single character searches, only allow exact match
            // This prevents "C" from matching "C++", "CSS", "C#", etc.
            if (filterLower.length === 1) {
              return jobSkill === filterLower;
            }
            
            // For longer strings, use word boundary match (skill as whole word)
            // This prevents "Java" from matching "JavaScript"
            const escapedFilter = filterLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordBoundaryRegex = new RegExp(`\\b${escapedFilter}\\b`, 'i');
            if (wordBoundaryRegex.test(jobSkill)) return true;
            
            return false;
          });
          
          if (foundInSplit) return true;
          
          // Also check in raw combined strings (e.g., "C,Java" or "Java,C")
          return jobSkillsRaw.some(rawSkill => {
            // For single character, check if it appears as a separate element
            if (filterLower.length === 1) {
              // Check if it's a standalone character (not part of a longer word like "C++")
              const regex = new RegExp(`(^|[^a-z0-9+])${filterLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9+]|$)`, 'i');
              return regex.test(rawSkill);
            }
            
            // For longer strings, use word boundary match
            const escapedFilter = filterLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordBoundaryRegex = new RegExp(`\\b${escapedFilter}\\b`, 'i');
            return wordBoundaryRegex.test(rawSkill);
          });
        });
      });
    }

    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(job => 
        (job?.title || "").toLowerCase().includes(searchLower) ||
        (job?.description || "").toLowerCase().includes(searchLower) ||
        (job?.company || "").toLowerCase().includes(searchLower)
      );
    }

    // Filter by location
    if (locationText) {
      const locationLower = locationText.toLowerCase();
      filtered = filtered.filter(job => 
        (job?.location || "").toLowerCase().includes(locationLower)
      );
    }

    // NOTE: Salary filter is EXCLUDED here for dynamic range calculation
    return filtered;
  }, [allJobs, appliedFilters, searchText, locationText]);

  // === CLIENT-SIDE FILTERING (as backup) ===
  const filteredJobs = useMemo(() => {
    if (!allJobs.length) return [];

    let filtered = [...allJobs];

    // Filter by job status
    if (appliedFilters.statuses && appliedFilters.statuses.length > 0) {
      const statusFilters = appliedFilters.statuses.map(mapStatusForAPI);
      filtered = filtered.filter(job => {
        const jobType = job?.jobType || "";
        return statusFilters.some(status => 
          jobType.toLowerCase().includes(status.toLowerCase())
        );
      });
    }

    // Filter by categories
    if (appliedFilters.categories && appliedFilters.categories.length > 0) {
      filtered = filtered.filter(job => 
        appliedFilters.categories.includes(job?.cat_name || "")
      );
    }

    // Filter by company
    if (appliedFilters.company && appliedFilters.company.length > 0) {
      filtered = filtered.filter(job => 
        appliedFilters.company.includes(job?.company || "")
      );
    }

    // Filter by experience
    if (appliedFilters.experience) {
      filtered = filtered.filter(job => {
        const expStr = String(job?.experience || "").toLowerCase().trim();
        const filterExp = appliedFilters.experience.toLowerCase();
        
        // Check if experience is in months
        const hasMonths = expStr.includes('month');
        const hasYears = expStr.includes('year') || expStr.includes('yr');
        
        // Extract numeric value
        const expNum = parseFloat(expStr.replace(/[^0-9.]/g, '')) || 0;
        
        // Convert months to years (divide by 12)
        let expInYears = expNum;
        if (hasMonths && !hasYears) {
          expInYears = expNum / 12;
        }
        
        if (filterExp === 'fresher') {
          return expInYears === 0 || expStr === '' || expStr.includes('fresher');
        }
        if (filterExp === 'lt1') {
          // Less than 1 year: > 0 and < 1 (includes months like 6 months = 0.5 years)
          return expInYears > 0 && expInYears < 1;
        }
        if (filterExp === '1to3') {
          // 1 to 3 years: >= 1 and <= 3
          return expInYears >= 1 && expInYears <= 3;
        }
        if (filterExp === 'gt3') {
          // More than 3 years: > 3
          return expInYears > 3;
        }
        return false;
      });
    }

    // Filter by skills - Show jobs with ANY selected skill or combinations (OR logic)
    if (appliedFilters.skills && appliedFilters.skills.length > 0) {
      filtered = filtered.filter(job => {
        // Handle different skill formats from backend
        let jobSkills = [];
        let jobSkillsRaw = []; // Keep original strings for checking combinations
        
        if (Array.isArray(job?.skills)) {
          jobSkills = job.skills.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
          jobSkillsRaw = job.skills.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
        } else if (typeof job?.skills === 'string') {
          const raw = job.skills.trim().toLowerCase();
          jobSkillsRaw = [raw];
          // Handle comma, semicolon, or pipe separated strings
          jobSkills = raw
            .split(/[,;|]/)
            .map(s => s.trim().toLowerCase())
            .filter(Boolean);
        } else if (job?.skillTag && Array.isArray(job.skillTag)) {
          // Some backends use skillTag field
          jobSkills = job.skillTag.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
          jobSkillsRaw = job.skillTag.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
        }
        
        // Check if ANY selected skill is present in job skills (OR logic)
        return appliedFilters.skills.some(filterSkill => {
          const filterLower = filterSkill.toLowerCase().trim();
          
          // Check individual split skills
          const foundInSplit = jobSkills.some(jobSkill => {
            // Exact match (case-insensitive)
            if (jobSkill === filterLower) return true;
            
            // For single character searches, only allow exact match
            // This prevents "C" from matching "C++", "CSS", "C#", etc.
            if (filterLower.length === 1) {
              return jobSkill === filterLower;
            }
            
            // For longer strings, use word boundary match (skill as whole word)
            // This prevents "Java" from matching "JavaScript"
            const escapedFilter = filterLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordBoundaryRegex = new RegExp(`\\b${escapedFilter}\\b`, 'i');
            if (wordBoundaryRegex.test(jobSkill)) return true;
            
            return false;
          });
          
          if (foundInSplit) return true;
          
          // Also check in raw combined strings (e.g., "C,Java" or "Java,C")
          return jobSkillsRaw.some(rawSkill => {
            // For single character, check if it appears as a separate element
            if (filterLower.length === 1) {
              // Check if it's a standalone character (not part of a longer word like "C++")
              const regex = new RegExp(`(^|[^a-z0-9+])${filterLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9+]|$)`, 'i');
              return regex.test(rawSkill);
            }
            
            // For longer strings, use word boundary match
            const escapedFilter = filterLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordBoundaryRegex = new RegExp(`\\b${escapedFilter}\\b`, 'i');
            return wordBoundaryRegex.test(rawSkill);
          });
        });
      });
    }

    // Filter by salary range
    if (appliedFilters.salaryMin !== null || appliedFilters.salaryMax !== null) {
      filtered = filtered.filter(job => {
        const salary = parseFloat((job?.salary || "0").replace(/[^0-9.]/g, '')) || 0;
        const minSalary = appliedFilters.salaryMin || 0;
        const maxSalary = appliedFilters.salaryMax || Infinity;
        
        return salary >= minSalary && salary <= maxSalary;
      });
    }

    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(job => 
        (job?.title || "").toLowerCase().includes(searchLower) ||
        (job?.description || "").toLowerCase().includes(searchLower) ||
        (job?.company || "").toLowerCase().includes(searchLower)
      );
    }

    // Filter by location
    if (locationText) {
      const locationLower = locationText.toLowerCase();
      filtered = filtered.filter(job => 
        (job?.location || "").toLowerCase().includes(locationLower)
      );
    }

    return filtered;
  }, [allJobs, appliedFilters, searchText, locationText]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setAppliedFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleResetFromSidebar = () => {
    setAppliedFilters({
      categories: [],
      company: [],
      statuses: [],
      experience: "",
      skills: [],
      salaryMin: null,
      salaryMax: null
    });
    setPage(1);
  };

  const applyTopSearch = () => {
    // Trigger a re-fetch by resetting to first page
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyTopSearch();
    }
  };

  const renderSkills = (value) => {
    if (!value) return "Not disclosed";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "string") {
      const parts = value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      return parts.length ? parts.join(", ") : value;
    }
    return String(value);
  };

  const handleCardClick = (job) => {
    const jobId = job?._id || job?.id;
    if (!jobId) return;
    navigate(`/detailjobs/${jobId}`, { state: { job } });
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(appliedFilters).some(key => {
      const value = appliedFilters[key];
      if (key === 'salaryMin' || key === 'salaryMax') {
        return value !== null && value !== undefined;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== "" && value !== null && value !== undefined;
    });
  }, [appliedFilters]);

  // Get current page jobs for pagination
  const currentPageJobs = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, page, perPage]);

  // Calculate total pages based on filtered jobs
  const filteredTotalPages = Math.max(1, Math.ceil(filteredJobs.length / perPage));

  return (
    <>
      <UserNavbar />
      <br />
      <div className={styles.alljobsContainer}>
        {/* Search */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by Job title, Position, Keyword..."
            className={styles.searchInput}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <input
            type="text"
            placeholder="City, state or zip code"
            className={styles.locationInput}
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {/* <button className={styles.findBtn} onClick={applyTopSearch} type="button">
            Find Job
          </button> */}
        </div>

        <div className={styles.alljobsLayout}>
          <FilterSidebar
            meta={meta}
            appliedFilters={appliedFilters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFromSidebar}
            filteredJobs={filteredJobsForSalaryRange}
          />

          <div className={styles.jobsContent}>
            {loading && <div className={styles.loading}>Loading jobs…</div>}
            {errMsg && <div className={styles.error}>{errMsg}</div>}

            {!loading && (
              <div className={styles.jobsInfo}>
                {/* <p>Showing {currentPageJobs.length} of {filteredJobs.length} jobs {hasActiveFilters && "with applied filters"}</p> */}
                {/* {hasActiveFilters && (
                  <div className={styles.activeFilters}>
                    <strong>Active Filters:</strong>
                    {appliedFilters.statuses?.length > 0 && (
                      <span> Status: {appliedFilters.statuses.join(", ")}</span>
                    )}
                    {appliedFilters.categories?.length > 0 && (
                      <span> Categories: {appliedFilters.categories.join(", ")}</span>
                    )}
                    {appliedFilters.company?.length > 0 && (
                      <span> Companies: {appliedFilters.company.join(", ")}</span>
                    )}
                    {appliedFilters.experience && (
                      <span> Experience: {appliedFilters.experience}</span>
                    )}
                  </div>
                )} */}
              </div>
            )}

            <div className={styles.jobsGrid}>
              {!loading && currentPageJobs.length > 0 ? (
                currentPageJobs.map((job) => {
                  const id = job?._id || job?.id || `${job?.company || "job"}-${job?.title || ""}`;
                  const { token, label } = normalizeJobType(job?.jobType);
                  const skillsText = renderSkills(job?.skills);
                  return (
                    <div
                      key={id}
                      className={styles.jobCard}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCardClick(job)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCardClick(job);
                        }
                      }}
                    >
                      <div className={styles.jobHeader}>
                        <h3 title={job?.title || "Untitled Job"}>
                          {job?.title || "Untitled Job"}
                        </h3>
                        <span className={`${styles.jobType} ${token}`}>
                          {label}
                        </span>
                      </div>
                      <p className={styles.salary}>
                        Job Categories: {job?.cat_name || "Not disclosed"}
                      </p>
                      <p className={styles.salary}>
                        Experience:{" "}
                        {job?.experience
                          ? String(job.experience).replace(/\s*yrs?\s*/gi, '').trim()
                          : "Not specified"}
                      </p>
                      <p className={styles.salary}>
                        Salary: ₹ {job?.salary ?? "Not disclosed"}
                      </p>
                      <p className={styles.salary}>Skills: {skillsText}</p>
                      <div className={styles.companyInfo}>
                        <img
                          src={job?.image || "/default-logo.png"}
                          alt="logo"
                          className={styles.companyLogo}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/default-logo.png";
                          }}
                        />
                        <div>
                          <p className={styles.companyName}>
                            {job?.company || "Unknown Company"}
                          </p>
                          <p className={styles.location}>
                            <FaMapMarkerAlt />{" "}
                            {job?.location || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                !loading && <p className={styles.noJobs}>No jobs available currently.</p>
              )}
            </div>

            {filteredTotalPages > 1 && (
              <div className={styles.pagination}>
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
                  {"<"}
                </button>
                {Array.from({ length: filteredTotalPages }, (_, i) => (
                  <button
                    key={i}
                    className={page === i + 1 ? styles.active : ""}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === filteredTotalPages}
                  aria-label="Next page"
                >
                  {">"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterUser />
    </>
  );
}