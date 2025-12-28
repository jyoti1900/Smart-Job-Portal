// src/EditProfileModal.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./EditProfileModal.module.css";

/* ---------- constants ---------- */
const DEFAULT_AVATAR = (process.env.PUBLIC_URL || "") + "/Images/Default.png";
const API_BASE = "http://localhost:8080/api/v1";

/* ---------- PortalOverlay (used for sub-forms) ---------- */
function PortalOverlay({ children, onClose }) {
    if (typeof document === "undefined") return null;
    return createPortal(
        <div className={styles.overlayBackdrop} onMouseDown={onClose}>
            <div
                className={styles.overlayPanel}
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {children}
            </div>
        </div>,
        document.body
    );
}

/* ---------- ValidationTooltip Component ---------- */
function ValidationTooltip({ message, targetElement, show }) {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const tooltipRef = useRef(null);

    useEffect(() => {
        if (show && targetElement) {
            setShouldRender(true);
            const updatePosition = () => {
                if (!tooltipRef.current || !targetElement) return;

                const rect = targetElement.getBoundingClientRect();
                const tooltipRect = tooltipRef.current.getBoundingClientRect();

                let top = rect.top - tooltipRect.height - 8;
                let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

                // Ensure tooltip doesn't go off screen
                if (left < 10) left = 10;
                if (left + tooltipRect.width > window.innerWidth - 10) {
                    left = window.innerWidth - tooltipRect.width - 10;
                }
                if (top < 10) {
                    // Show below if no space above
                    top = rect.bottom + 8;
                }

                setPosition({ top, left });
            };

            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                updatePosition();
                setIsVisible(true);
            });

            // Re-position on scroll/resize
            window.addEventListener("scroll", updatePosition, true);
            window.addEventListener("resize", updatePosition);

            return () => {
                window.removeEventListener("scroll", updatePosition, true);
                window.removeEventListener("resize", updatePosition);
            };
        } else if (shouldRender) {
            // Fade out when show becomes false
            setIsVisible(false);
            // Remove from DOM after fade animation completes
            const timeoutId = setTimeout(() => {
                setShouldRender(false);
            }, 300); // Match CSS transition duration

            return () => clearTimeout(timeoutId);
        }
    }, [show, targetElement, shouldRender]);

    if (!shouldRender || !message || !targetElement) return null;

    return createPortal(
        <div
            ref={tooltipRef}
            className={`${styles.validationTooltip} ${isVisible ? styles.tooltipVisible : ""}`}
            style={{
                position: "fixed",
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 10000
            }}
        >
            <div className={styles.tooltipIcon}>!</div>
            <div className={styles.tooltipMessage}>{message}</div>
            <div className={styles.tooltipPointer} />
        </div>,
        document.body
    );
}

/* small constructors */
function emptyExp() {
    return {
        id: `exp-${Date.now()}`,
        role: "",
        company: "",
        startMonth: "Jan",
        startYear: `${new Date().getFullYear()}`,
        endMonth: "Dec",
        endYear: `${new Date().getFullYear()}`,
        present: false,
        description: ""
    };
}
function emptyProject() {
    return { id: `proj-${Date.now()}`, projectName: "", brief: "", link: "", skillTag: [] };
}
function emptyCert() {
    return {
        id: `cert-${Date.now()}`,
        certificationName: "",
        learned: "",
        link: "",
        skillTag: [],
        document: null,
        documentUrl: ""
    };
}
function emptyEdu() {
    return { id: `edu-${Date.now()}`, degree: "", institution: "", passoutyear: "", year: "" };
}

export default function EditProfileModal({
    isOpen,
    onClose,
    data = {},
    onSave,
    type = "user",
    onValidationChange
}) {
    const initial = data || {};
    const [local, setLocal] = useState(initial);

    // Tabs
    const [tab, setTab] = useState("basic");

    // Image handling
    const [imagePreviewUrl, setImagePreviewUrl] = useState(initial.profile_image || DEFAULT_AVATAR);
    const [imageFile, setImageFile] = useState(null);
    const imageInputRef = useRef(null);

    // Resume handling
    const [resumeFile, setResumeFile] = useState(null);
    const [resumePreview, setResumePreview] = useState(initial.document || "");

    // Skills main
    const [skillsInput, setSkillsInput] = useState("");

    // Experience / Projects / Cert / Edu states
    const [expFormOpen, setExpFormOpen] = useState(false);
    const [expForm, setExpForm] = useState(emptyExp());
    const [expEditingIndex, setExpEditingIndex] = useState(null);
    const [expMenuIndex, setExpMenuIndex] = useState(null);
    const [expFormErrors, setExpFormErrors] = useState({});

    const [projFormOpen, setProjFormOpen] = useState(false);
    const [projForm, setProjForm] = useState(emptyProject());
    const [projEditingIndex, setProjEditingIndex] = useState(null);
    const [projMenuIndex, setProjMenuIndex] = useState(null);
    const [projFormErrors, setProjFormErrors] = useState({});

    const [certFormOpen, setCertFormOpen] = useState(false);
    const [certForm, setCertForm] = useState(emptyCert());
    const [certEditingIndex, setCertEditingIndex] = useState(null);
    const [certMenuIndex, setCertMenuIndex] = useState(null);
    const [certFormErrors, setCertFormErrors] = useState({});

    const [eduFormOpen, setEduFormOpen] = useState(false);
    const [eduForm, setEduForm] = useState(emptyEdu());
    const [eduEditingIndex, setEduEditingIndex] = useState(null);
    const [eduMenuIndex, setEduMenuIndex] = useState(null);
    const [eduFormErrors, setEduFormErrors] = useState({});

    // Basic errors + skills & top-level errors (kept for validation logic, not displayed)
    const [basicErrors, setBasicErrors] = useState({});
    const [skillsError, setSkillsError] = useState("");
    const [topLevelError, setTopLevelError] = useState("");

    // Global Save All validation control
    const [isFormValid, setIsFormValid] = useState(true);
    const [saveAttempted, setSaveAttempted] = useState(false);

    // Section validation errors - tracks which sections have errors for red dots
    const [sectionErrors, setSectionErrors] = useState({
        basic: false,
        skills: false,
        experience: false,
        projects: false,
        certifications: false,
        education: false
    });

    // Save All button tooltip state
    const [saveButtonTooltip, setSaveButtonTooltip] = useState("");

    // Track when Save All or Add buttons are clicked to show field-level error dots
    const [fieldValidationTriggered, setFieldValidationTriggered] = useState(false);

    // Track fields that have been blurred with errors (for showing red dots)
    const [blurredFieldsWithErrors, setBlurredFieldsWithErrors] = useState(new Set());

    // Validation tooltip state - tracks active tooltip
    const [activeTooltip, setActiveTooltip] = useState({ field: null, message: "", element: null });

    const resumeInputRef = useRef(null);

    // Refs for basic form inputs to attach tooltips
    const nameInputRef = useRef(null);
    const titleInputRef = useRef(null);
    const locationInputRef = useRef(null);
    const phoneInputRef = useRef(null);

    // Dropdown data from APIs
    const [eduYears, setEduYears] = useState([]);
    const [expMonths, setExpMonths] = useState([]);
    const [expYears, setExpYears] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);

    // Get user ID from localStorage or data
    const userId = localStorage.getItem("userId") || data._id || data.id;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");

    // helper arrays (fallback if API fails)
    const monthMap = {
        Jan: "January",
        Feb: "February",
        Mar: "March",
        Apr: "April",
        May: "May",
        Jun: "June",
        Jul: "July",
        Aug: "August",
        Sep: "September",
        Oct: "October",
        Nov: "November",
        Dec: "December"
    };
    const months = Object.keys(monthMap); // Fallback months array
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1989 }, (_, i) => String(currentYear - i));

    // Helper function to extract string value from month/year object or string
    const extractMonthValue = (monthVal) => {
        if (!monthVal) return "";
        if (typeof monthVal === "string") return monthVal;
        if (typeof monthVal === "number") return String(monthVal);
        if (typeof monthVal === "object") {
            // Handle populated ObjectId objects: {_id: "...", month: "Jan"} or {_id: "...", name: "Jan"}
            return monthVal.month || monthVal.name || monthVal._id || "";
        }
        return String(monthVal);
    };

    const extractYearValue = (yearVal) => {
        if (!yearVal) return "";
        if (typeof yearVal === "string") return yearVal;
        if (typeof yearVal === "number") return String(yearVal);
        if (typeof yearVal === "object") {
            // Handle populated ObjectId objects: {_id: "...", year: "2023"} or {_id: "...", name: "2023"}
            return String(yearVal.year || yearVal.name || yearVal._id || "");
        }
        return String(yearVal);
    };

    // Helper function to find ObjectId from dropdown options based on string value
    const findObjectId = (value, options) => {
        if (!value || !options || !Array.isArray(options)) return value;
        // If value is already an ObjectId (string starting with specific pattern), return it
        if (typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value)) return value;

        // Find matching option in dropdown
        const option = options.find((opt) => {
            if (typeof opt === "string") return opt === value;
            if (typeof opt === "object") {
                return opt.month === value || opt.year === value || opt.name === value;
            }
            return String(opt) === String(value);
        });

        // Return ObjectId if found, otherwise return the value as-is
        if (option && typeof option === "object" && option._id) {
            return option._id;
        }
        return value;
    };

    // Helper function to normalize experience data from API format (start_date/end_date) to display format (startMonth/startYear)
    const normalizeExperience = (exp) => {
        if (!exp) return exp;
        const normalized = { ...exp };

        // Convert start_date from {month: {...}, year: {...}} to startMonth and startYear strings
        if (exp.start_date) {
            normalized.startMonth = extractMonthValue(exp.start_date.month);
            normalized.startYear = extractYearValue(exp.start_date.year);
        } else {
            // Fallback to existing normalized values if start_date doesn't exist
            normalized.startMonth = normalized.startMonth || extractMonthValue(exp.startMonth);
            normalized.startYear = normalized.startYear || extractYearValue(exp.startYear);
        }

        // Convert end_date from {month: {...}, year: {...}} to endMonth and endYear strings
        if (exp.end_date) {
            normalized.endMonth = extractMonthValue(exp.end_date.month);
            normalized.endYear = extractYearValue(exp.end_date.year);
        } else {
            // Fallback to existing normalized values if end_date doesn't exist
            normalized.endMonth = normalized.endMonth || extractMonthValue(exp.endMonth);
            normalized.endYear = normalized.endYear || extractYearValue(exp.endYear);
        }

        // Check if present (if end_date is null or missing, it's present)
        normalized.present = !exp.end_date || exp.present === true;

        return normalized;
    };

    useEffect(() => {
        // Normalize experience data from API format to display format
        const normalizedInitial = { ...initial };
        if (normalizedInitial.experience && Array.isArray(normalizedInitial.experience)) {
            normalizedInitial.experience = normalizedInitial.experience.map(normalizeExperience);
        }

        // Normalize field names: API uses 'project' and 'certification' (singular),
        // but we use 'projects' and 'certifications' (plural) internally for clarity
        // Always prefer plural form, but if only singular exists, copy it to plural
        if (
            !normalizedInitial.projects &&
            normalizedInitial.project &&
            Array.isArray(normalizedInitial.project)
        ) {
            normalizedInitial.projects = normalizedInitial.project;
        }
        if (
            !normalizedInitial.certifications &&
            normalizedInitial.certification &&
            Array.isArray(normalizedInitial.certification)
        ) {
            normalizedInitial.certifications = normalizedInitial.certification;
        }

        setLocal(normalizedInitial);
        setTab("basic");
        setImagePreviewUrl(normalizedInitial.profile_image || DEFAULT_AVATAR);
        setImageFile(null);
        setResumeFile(null);
        setResumePreview(normalizedInitial.document || "");
        setSkillsInput("");
        resetForms();
        setBasicErrors({});
        setSkillsError("");
        setTopLevelError("");
        setBlurredFieldsWithErrors(new Set());
    }, [initial, isOpen]);

    // lock body scroll while modal open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    // Fetch dropdown data when modal opens
    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchDropdowns = async () => {
            setLoadingDropdowns(true);

            try {
                // ✅ Fetch User List (not removed)
                const userRes = await fetch(`${API_BASE}/customer/user-list/${userId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                });

                const userData = await userRes.json();
                if (userData.success && Array.isArray(userData.data)) {
                    setEduYears(userData.data); // ✅ unchanged (your original)
                }

                // ✅ Fetch Education Passout Year
                const passoutRes = await fetch(`${API_BASE}/common/user-education-year-dropdown`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                });

                const passoutData = await passoutRes.json();
                if (passoutData.success && Array.isArray(passoutData.data)) {
                    setPassoutYearList(passoutData.data);
                }

                // ✅ Fetch Experience Months
                const monthRes = await fetch(`${API_BASE}/common/user-experience-month-dropdown`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                });

                const monthData = await monthRes.json();
                if (monthData.success && Array.isArray(monthData.data)) {
                    setExpMonths(monthData.data);
                }

                // ✅ Fetch Experience Years
                const yearRes = await fetch(`${API_BASE}/common/user-experience-year-dropdown`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                });

                const yearData = await yearRes.json();
                if (yearData.success && Array.isArray(yearData.data)) {
                    setExpYears(yearData.data);
                }
            } catch (error) {
                console.error("Error fetching dropdowns:", error);
            } finally {
                setLoadingDropdowns(false);
            }
        };

        fetchDropdowns();
    }, [isOpen, token, userId]); // ✅ added userId!

    // Handle tab change - clear active tooltip when switching tabs
    const handleTabChange = (newTab) => {
        // Clear tooltip immediately when switching tabs
        setActiveTooltip({ field: null, message: "", element: null });
        setTab(newTab);
    };

    /* ---------- Basic handlers ---------- */
    const handleBasicChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...local, [name]: value };
        setLocal(updatedData);
        // clear error as user types
        const newErrors = validateBasic(updatedData);
        setBasicErrors(newErrors);

        // If field becomes valid, remove from blurred fields with errors
        if (!newErrors[name]) {
            setBlurredFieldsWithErrors((prev) => {
                const next = new Set(prev);
                next.delete(name);
                return next;
            });
        }

        // hide tooltip if field becomes valid
        if (activeTooltip.field === name) {
            setActiveTooltip({ field: null, message: "", element: null });
        }
        // Clear field validation trigger when all basic fields are valid
        if (fieldValidationTriggered && Object.keys(newErrors).length === 0) {
            setFieldValidationTriggered(false);
        }
    };

    // Handle blur validation for basic fields
    const handleBasicBlur = (e) => {
        const { name } = e.target;
        const currentData = { ...local, [name]: e.target.value };
        const errors = validateBasic(currentData);

        // Update basicErrors state
        setBasicErrors(errors);

        if (errors[name]) {
            // Mark field as blurred with error for showing red dot
            setBlurredFieldsWithErrors((prev) => new Set(prev).add(name));

            // Show tooltip
            setActiveTooltip({
                field: name,
                message: errors[name],
                element: e.target
            });

            // Auto-hide after 5 seconds with fade-out
            setTimeout(() => {
                setActiveTooltip((prev) => {
                    if (prev.field === name) {
                        // Clear after fade animation
                        setTimeout(() => {
                            setActiveTooltip({ field: null, message: "", element: null });
                        }, 300);
                        return { ...prev, message: "" };
                    }
                    return prev;
                });
            }, 5000);
        } else {
            // Remove from blurred fields with errors if valid
            setBlurredFieldsWithErrors((prev) => {
                const next = new Set(prev);
                next.delete(name);
                return next;
            });

            // Hide tooltip if valid
            setActiveTooltip((prev) =>
                prev.field === name ? { field: null, message: "", element: null } : prev
            );
        }
    };

    const handlePickImage = () => {
        imageInputRef.current?.click();
    };

    const handleImageSelected = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(imagePreviewUrl);
            } catch (err) {}
        }
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
        setImageFile(file);
        setLocal((p) => ({ ...p, profile_image: url }));
    };

    const handleRemoveImage = (e) => {
        e?.preventDefault();
        if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(imagePreviewUrl);
            } catch (err) {}
        }
        setImageFile(null);
        setImagePreviewUrl(DEFAULT_AVATAR);
        setLocal((p) => {
            const copy = { ...p };
            copy.profile_image = "";
            return copy;
        });
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    // placeholder upload function to be replaced with real backend API
    const handleUploadToServer = async (file) => {
        // replace with actual upload when backend ready
        return URL.createObjectURL(file);
    };

    /* ---------- Resume handlers ---------- */
    const pickResume = () => resumeInputRef.current?.click();
    const handleResumeSelected = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        // simple validation by MIME or extension
        const allowed = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        const extOK = /\.(pdf|doc|docx)$/i.test(file.name);
        if (!(allowed.includes(file.type) || extOK)) {
            alert("Please upload a PDF or Word document (.pdf, .doc, .docx)");
            return;
        }
        if (resumePreview && resumePreview.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(resumePreview);
            } catch {}
        }
        const url = URL.createObjectURL(file);
        setResumeFile(file);
        setResumePreview(url);
        setLocal((p) => ({ ...p, resume: { document: file.document, fileUrl: url, file } }));
    };
    const removeResume = async (e) => {
        e?.preventDefault();
        if (resumePreview && resumePreview.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(resumePreview);
            } catch {}
        }
        setResumeFile(null);
        setResumePreview("");
        setLocal((p) => ({ ...p, document: "" }));
        if (resumeInputRef.current) resumeInputRef.current.value = "";

        // Attempt to delete resume from backend
        if (userId) {
            try {
                const response = await fetch(
                    `${API_BASE}/customer/user/${userId}/resume/delete`,
                    {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token && { Authorization: `Bearer ${token}` })
                        }
                    }
                );
                const result = await response.json();
                if (!response.ok || result.success === false) {
                    console.warn("Resume delete API responded with error:", result);
                }
            } catch (err) {
                console.warn("Resume delete API failed:", err);
            }
        }
    };

    /* ---------- Skills handlers (main) ---------- */
    const handleAddSkill = (ev) => {
        if (ev) ev.preventDefault?.();
        const s = (skillsInput || "").trim();
        if (!s) return;
        setLocal((p) => ({ ...p, skillTag: [...(p.skillTag || []), s] }));
        setSkillsInput("");
        setSkillsError("");
    };
    const handleRemoveSkill = (index) => {
        setLocal((p) => ({ ...p, skillTag: (p.skillTag || []).filter((_, i) => i !== index) }));
    };

    /* ---------- Experience handlers ---------- */
    const openAddExp = () => {
        setExpForm(emptyExp());
        setExpEditingIndex(null);
        setExpFormOpen(true);
        setExpFormErrors({});
        handleTabChange("experience");
    };
    const openEditExp = (index) => {
        const item = (local.experience || [])[index];
        if (!item) return;

        const normalized = {
            ...item,
            startMonth: item.start_date?.month?.month || item.startMonth || "",
            startYear: item.start_date?.year?.year || item.startYear || "",
            endMonth: item.end_date?.month?.month || item.endMonth || "",
            endYear: item.end_date?.year?.year || item.endYear || "",
            present: item.end_date ? false : true
        };

        setExpForm(normalized);
        setExpEditingIndex(index);
        setExpFormOpen(true);
        setExpMenuIndex(null);
        setExpFormErrors({});
        handleTabChange("experience");
    };

    const validateExpForm = (form) => {
        const errs = {};

        if (!form.role || form.role.trim() === "") errs.role = "Designation is required";

        if (!form.company || form.company.trim() === "") errs.company = "Company is required";

        const startMonthValid = !!form.startMonth;
        const startYearValid = !!form.startYear;

        if (!startMonthValid || !startYearValid) errs.start = "Start month & year required";

        if (!form.present) {
            const endMonthValid = !!form.endMonth;
            const endYearValid = !!form.endYear;

            if (!endMonthValid || !endYearValid) errs.end = "End date required or mark as Present";
            else {
                const sY = parseInt(form.startYear, 10);
                const eY = parseInt(form.endYear, 10);
                if (eY < sY) errs.end = "End year cannot be before start year";
            }
        }

        return errs;
    };

    const saveExp = async () => {
        const errs = validateExpForm(expForm);
        setExpFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            setFieldValidationTriggered(true);
            return;
        }
        setFieldValidationTriggered(false);

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        try {
            const isEditing = expEditingIndex !== null;
            const experienceId = isEditing ? expForm._id || expForm.id : null;

            // Prepare payload - convert to schema format
            // Find ObjectIds from dropdown options for month/year
            const startMonthId = findObjectId(
                expForm.startMonth,
                expMonths.length > 0 ? expMonths : months
            );
            const startYearId = findObjectId(
                expForm.startYear,
                expYears.length > 0 ? expYears : years
            );
            const endMonthId = expForm.present
                ? null
                : findObjectId(expForm.endMonth, expMonths.length > 0 ? expMonths : months);
            const endYearId = expForm.present
                ? null
                : findObjectId(expForm.endYear, expYears.length > 0 ? expYears : years);

            const payload = {
                role: expForm.role,
                company: expForm.company,
                start_date: {
                    month: expForm.startMonth, // ✅ ObjectId
                    year: expForm.startYear // ✅ ObjectId
                },
                end_date: expForm.present
                    ? null
                    : {
                          month: expForm.endMonth,
                          year: expForm.endYear
                      },
                present: expForm.present,
                description: expForm.description
            };

            const url = isEditing
                ? `${API_BASE}/customer/user/${userId}/experience/${experienceId}/update`
                : `${API_BASE}/customer/user/${userId}/experience/add`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Update local state with response data - normalize the API response
                const list = [...(local.experience || [])];
                const normalizedItem = normalizeExperience({
                    ...expForm,
                    ...result.data,
                    _id: result.data._id || experienceId
                });

                if (isEditing && expEditingIndex !== null) {
                    list[expEditingIndex] = normalizedItem;
                } else {
                    list.push(normalizedItem);
                }
                setLocal({ ...local, experience: list });
                setExpFormOpen(false);
                setExpEditingIndex(null);
                setExpForm(emptyExp());
            } else {
                alert(result.message || "Failed to save experience. Please try again.");
            }
        } catch (error) {
            console.error("Error saving experience:", error);
            alert("An error occurred while saving experience. Please try again.");
        }
    };

    const deleteExp = async (index) => {
        const item = (local.experience || [])[index];
        if (!item) return;

        if (!window.confirm("Are you sure you want to delete this experience?")) return;

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        const experienceId = item._id || item.id;
        if (!experienceId || experienceId.startsWith("exp-")) {
            // Local-only item, just remove from state
            const list = [...(local.experience || [])];
            list.splice(index, 1);
            setLocal({ ...local, experience: list });
            setExpMenuIndex(null);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/customer/user/${userId}/experience/${experienceId}/delete`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                const list = [...(local.experience || [])];
                list.splice(index, 1);
                setLocal({ ...local, experience: list });
                setExpMenuIndex(null);
            } else {
                alert(result.message || "Failed to delete experience. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting experience:", error);
            alert("An error occurred while deleting experience. Please try again.");
        }
    };
    const toggleExpMenu = (i) => setExpMenuIndex(expMenuIndex === i ? null : i);

    /* ---------- Projects handlers ---------- */
    const openAddProj = () => {
        setProjForm(emptyProject());
        setProjEditingIndex(null);
        setProjFormOpen(true);
        setProjFormErrors({});
        handleTabChange("projects");
    };
    const openEditProj = (index) => {
        const item = (local.projects || [])[index];
        if (!item) return;
        setProjForm(item);
        setProjEditingIndex(index);
        setProjFormOpen(true);
        setProjMenuIndex(null);
        setProjFormErrors({});
        handleTabChange("projects");
    };
    const validateProjForm = (form) => {
        const errs = {};
        if (!form.projectName || form.projectName.trim().length === 0)
            errs.projectName = "Heading is required";
        if (!form.brief || form.brief.trim().length === 0) errs.brief = "Brief is required";
        if (!form.skillTag || form.skillTag.length === 0)
            errs.skills = "At least one skill is required";
        if (form.link && form.link.trim()) {
            try {
                new URL(form.link);
            } catch {
                errs.link = "Link is not a valid URL";
            }
        }
        return errs;
    };
    const saveProj = async () => {
        const errs = validateProjForm(projForm);
        setProjFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            setFieldValidationTriggered(true);
            return;
        }
        setFieldValidationTriggered(false);

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        try {
            const isEditing = projEditingIndex !== null;
            const projectId = isEditing ? projForm._id || projForm.id : null;

            // Prepare payload - convert to schema format
            const payload = {
                projectName: projForm.projectName,
                brief: projForm.brief,
                link: projForm.link || "",
                skillTag: projForm.skillTag || []
            };

            const url = isEditing
                ? `${API_BASE}/customer/user/${userId}/project/${projectId}/update`
                : `${API_BASE}/customer/user/${userId}/project/add`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Update local state with response data
                const list = [...(local.projects || [])];
                const updatedItem = {
                    ...projForm,
                    ...result.data,
                    id: result.data.id || projectId
                };

                if (isEditing && projEditingIndex !== null) {
                    list[projEditingIndex] = updatedItem;
                } else {
                    list.push(updatedItem);
                }
                setLocal({ ...local, projects: list });
                setProjFormOpen(false);
                setProjEditingIndex(null);
                setProjForm(emptyProject());
            } else {
                alert(result.message || "Failed to save project. Please try again.");
            }
        } catch (error) {
            console.error("Error saving project:", error);
            alert("An error occurred while saving project. Please try again.");
        }
    };

    const deleteProj = async (index) => {
        const item = (local.projects || [])[index];
        if (!item) return;

        if (!window.confirm("Are you sure you want to delete this project?")) return;

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        const projectId = item._id || item.id;
        if (!projectId || projectId.startsWith("proj-")) {
            // Local-only item, just remove it
            const list = [...(local.projects || [])];
            list.splice(index, 1);
            setLocal({ ...local, projects: list });
            setProjMenuIndex(null);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/customer/user/${userId}/project/${projectId}/delete`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                const list = [...(local.projects || [])];
                list.splice(index, 1);
                setLocal({ ...local, projects: list });
                setProjMenuIndex(null);
            } else {
                alert(result.message || "Failed to delete project. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("An error occurred while deleting project. Please try again.");
        }
    };

    const toggleProjMenu = (i) => setProjMenuIndex(projMenuIndex === i ? null : i);
    const addProjSkill = (skill) => {
        if (!skill) return;
        setProjForm((p) => ({ ...p, skillTag: [...(p.skillTag || []), skill], _skillInput: "" }));
        setProjFormErrors((prev) => ({ ...prev, skills: "" }));
    };
    const removeProjSkill = (index) =>
        setProjForm((p) => ({ ...p, skillTag: (p.skillTag || []).filter((_, i) => i !== index) }));

    /* ---------- Certifications handlers ---------- */
    const openAddCert = () => {
        setCertForm(emptyCert());
        setCertEditingIndex(null);
        setCertFormOpen(true);
        setCertFormErrors({});
        handleTabChange("certifications");
    };
    const openEditCert = (index) => {
        const item = (local.certifications || [])[index];
        if (!item) return;
        setCertForm(item);
        setCertEditingIndex(index);
        setCertFormOpen(true);
        setCertMenuIndex(null);
        setCertFormErrors({});
        handleTabChange("certifications");
    };
    const validateCertForm = (form) => {
        const errs = {};
        if (!form.certificationName || form.certificationName.trim().length === 0)
            errs.certificationName = "Certificate name required";
        if (!form.skillTag || form.skillTag.length === 0)
            errs.skills = "At least one skill required";
        // File required for certification
        if (!form.document || !(form.document instanceof File || form.document))
            errs.file = "Upload certificate (pdf/doc/docx) is required";
        if (form.link && form.link.trim()) {
            try {
                new URL(form.link);
            } catch {
                errs.link = "Link is not a valid URL";
            }
        }
        return errs;
    };
    const saveCert = async () => {
        const errs = validateCertForm(certForm);
        setCertFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            setFieldValidationTriggered(true);
            return;
        }
        setFieldValidationTriggered(false);

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        try {
            const isEditing = certEditingIndex !== null;
            const certificationId = isEditing ? certForm._id || certForm.id : null;

            // Prepare FormData for file upload - convert to schema format
            const formData = new FormData();
            formData.append("certificationName", certForm.certificationName);
            formData.append("learned", certForm.learned || "");
            formData.append("link", certForm.link || "");
            formData.append("skillTag", JSON.stringify(certForm.skillTag || []));

            if (certForm.document && certForm.document instanceof File) {
                formData.append("document", certForm.document);
            }

            const url = isEditing
                ? `${API_BASE}/customer/user/${userId}/certification/${certificationId}/update`
                : `${API_BASE}/customer/user/${userId}/certification/add`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` })
                    // Don't set Content-Type for FormData, browser will set it with boundary
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Update local state with response data
                const list = [...(local.certifications || [])];
                const updatedItem = {
                    ...certForm,
                    ...result.data,
                    _id: result.data._id || certificationId
                };

                if (isEditing && certEditingIndex !== null) {
                    list[certEditingIndex] = updatedItem;
                } else {
                    list.push(updatedItem);
                }
                setLocal({ ...local, certifications: list });
                setCertFormOpen(false);
                setCertEditingIndex(null);
                setCertForm(emptyCert());
            } else {
                alert(result.message || "Failed to save certification. Please try again.");
            }
        } catch (error) {
            console.error("Error saving certification:", error);
            alert("An error occurred while saving certification. Please try again.");
        }
    };

    const deleteCert = async (index) => {
        const item = (local.certifications || [])[index];
        if (!item) return;

        if (!window.confirm("Are you sure you want to delete this certification?")) return;

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        const certificationId = item._id || item.id;
        if (!certificationId || certificationId.startsWith("cert-")) {
            // Local-only item, just remove from state
            const list = [...(local.certifications || [])];
            list.splice(index, 1);
            setLocal({ ...local, certifications: list });
            setCertMenuIndex(null);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/customer/user/${userId}/certification/${certificationId}/delete`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                const list = [...(local.certifications || [])];
                list.splice(index, 1);
                setLocal({ ...local, certifications: list });
                setCertMenuIndex(null);
            } else {
                alert(result.message || "Failed to delete certification. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting certification:", error);
            alert("An error occurred while deleting certification. Please try again.");
        }
    };
    const toggleCertMenu = (i) => setCertMenuIndex(certMenuIndex === i ? null : i);

    // cert file handling
    const handleCertFileSelected = (file) => {
        if (!file) return;
        if (certForm.documentUrl && certForm.documentUrl.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(certForm.documentUrl);
            } catch {}
        }
        const url = URL.createObjectURL(file);
        setCertForm((p) => ({ ...p, document: file, documentUrl: url }));
        setCertFormErrors((prev) => ({ ...prev, file: "" }));
    };
    const removeCertFile = (e) => {
        e?.preventDefault();
        if (certForm.documentUrl && certForm.documentUrl.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(certForm.documentUrl);
            } catch {}
        }
        setCertForm((p) => ({ ...p, document: null, documentUrl: "" }));
    };
    const addCertSkill = (skill) => {
        if (!skill) return;
        setCertForm((p) => ({ ...p, skillTag: [...(p.skillTag || []), skill], _skillInput: "" }));
        setCertFormErrors((prev) => ({ ...prev, skills: "" }));
    };
    const removeCertSkill = (index) =>
        setCertForm((p) => ({ ...p, skillTag: (p.skillTag || []).filter((_, i) => i !== index) }));

    /* ---------- Education handlers ---------- */
    const [passoutYearList, setPassoutYearList] = useState([]);
    const [selectedPassoutYear, setSelectedPassoutYear] = useState("");

    const openAddEdu = () => {
        setEduForm(emptyEdu());
        setEduEditingIndex(null);
        setEduFormOpen(true);
        setEduFormErrors({});
        handleTabChange("education");
    };
    const openEditEdu = (index) => {
        const item = local.education[index];

        const yearValue = typeof item.year === "string" ? item.year : item.year?.passoutyear || "";

        setEduForm({
            _id: item._id,
            degree: item.degree || "",
            institution: item.institution || "",
            year: yearValue, // ✅ bind correct value to dropdown
            passoutyear: yearValue
        });

        setEduEditingIndex(index);
        setEduFormOpen(true);
    };

    const validateEduForm = (form) => {
        const errs = {};
        if (!form.degree || form.degree.trim().length === 0) errs.degree = "Degree is required";
        if (!form.institution || form.institution.trim().length === 0)
            errs.institution = "College / Institution is required";

        // passoutyear could be an ObjectId string, raw number (2024), "Pursuing", or a nested year object
        const yearValue = form.year ?? form.passoutyear;
        if (!String(yearValue?._id ?? yearValue ?? "").trim()) {
            errs.passoutyear = "Pass out year is required";
        }
        return errs;
    };

    const saveEdu = async () => {
        const errs = validateEduForm(eduForm);
        setEduFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            setFieldValidationTriggered(true);
            return;
        }
        setFieldValidationTriggered(false);

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        try {
            const isEditing = eduEditingIndex !== null;
            const educationId = isEditing ? eduForm._id || eduForm.id : null;

            const payload = {
                degree: eduForm.degree,
                institution: eduForm.institution,
                year: eduForm.passoutyear // year id goes here
            };

            const url = isEditing
                ? `${API_BASE}/customer/user/${userId}/education/${educationId}/update`
                : `${API_BASE}/customer/user/${userId}/education/add`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const list = [...(local.education || [])];
                const updatedItem = {
                    ...eduForm,
                    ...result.data,
                    _id: result.data._id || educationId
                };

                if (isEditing && eduEditingIndex !== null) {
                    list[eduEditingIndex] = updatedItem;
                } else {
                    list.push(updatedItem);
                }
                setLocal((prev) => ({ ...prev, education: result.data }));
                setEduFormOpen(false);
                setEduEditingIndex(null);
                setEduForm(emptyEdu());
            } else {
                alert(result.message || "Failed to save education. Please try again.");
            }
        } catch (error) {
            console.error("Error saving education:", error);
            alert("An error occurred while saving education. Please try again.");
        }
    };

    const deleteEdu = async (index) => {
        const item = (local.education || [])[index];
        if (!item) return;

        if (!window.confirm("Are you sure you want to delete this education?")) return;

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        const educationId = item._id || item.id;
        if (!educationId || educationId.startsWith("edu-")) {
            const list = [...(local.education || [])];
            list.splice(index, 1);
            setLocal({ ...local, education: list });
            setEduMenuIndex(null);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/customer/user/${userId}/education/${educationId}/delete`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                const list = [...(local.education || [])];
                list.splice(index, 1);
                setLocal({ ...local, education: list });
                setEduMenuIndex(null);
            } else {
                alert(result.message || "Failed to delete education. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting education:", error);
            alert("An error occurred while deleting education. Please try again.");
        }
    };

    const toggleEduMenu = (i) => setEduMenuIndex(eduMenuIndex === i ? null : i);

    /* ---------- Save all logic (must setLocal, don't mutate) ---------- */
    const handleSaveAll = async () => {
        // Mark that user has clicked Save All once
        setSaveAttempted(true);
        setFieldValidationTriggered(true);

        // Run full validation
        const { valid, message } = validateAll();

        // Update validation states
        setIsFormValid(valid);
        setTopLevelError(message || "");

        if (!valid) {
            // Tooltip is generated dynamically via getSaveAllTooltip
            // Don't jump to sections, just mark them with red dots
            // Stop execution — prevent saving when invalid
            return;
        }

        if (!userId) {
            alert("User ID not found. Please refresh and try again.");
            return;
        }

        // Clear field validation trigger on successful validation
        setFieldValidationTriggered(false);

        try {
            // Prepare FormData for user update (to support file uploads)
            const formData = new FormData();

            // Add basic fields - convert to schema format
            formData.append("name", local.name || "");
            formData.append("title", local.title || "");
            formData.append("address", local.address || "");
            formData.append("mobile", local.mobile || "");
            formData.append("about", local.about || "");

            // Add skills array (skillTag in schema)
            if (local.skillTag && Array.isArray(local.skillTag)) {
                formData.append("skillTag", JSON.stringify(local.skillTag));
            }

            // Add image if present (profile_image in schema)
            if (imageFile) {
                formData.append("profile_image", imageFile);
            }

            // Add resume if present (document in schema)
            if (resumeFile) {
                formData.append("document", resumeFile);
            }

            // Call user-update API
            const response = await fetch(`${API_BASE}/customer/user-update/${userId}`, {
                method: "PUT",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` })
                    // Don't set Content-Type for FormData, browser will set it with boundary
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Update local state with response data
                const updatedLocal = { ...local, ...result.data };

                // Normalize field names: API uses 'project' and 'certification' (singular),
                // but we use 'projects' and 'certifications' (plural) internally
                // Always prefer plural form, but if only singular exists, copy it to plural
                if (
                    !updatedLocal.projects &&
                    updatedLocal.project &&
                    Array.isArray(updatedLocal.project)
                ) {
                    updatedLocal.projects = updatedLocal.project;
                }
                if (
                    !updatedLocal.certifications &&
                    updatedLocal.certification &&
                    Array.isArray(updatedLocal.certification)
                ) {
                    updatedLocal.certifications = updatedLocal.certification;
                }

                // Handle image URL from response or keep preview
                if (result.data.profile_image) {
                    updatedLocal.profile_image = result.data.profile_image;
                } else if (imageFile) {
                    // If image was uploaded but no URL in response, keep preview
                    updatedLocal.profile_image = imagePreviewUrl;
                }

                // Handle resume from response (document in schema)
                if (result.data.document) {
                    updatedLocal.document = result.data.document;
                } else if (resumeFile) {
                    updatedLocal.document = resumePreview || "";
                }

                setLocal(updatedLocal);
                onSave && onSave(updatedLocal);

                alert("Profile updated successfully!");
            } else {
                alert(result.message || "Failed to update profile. Please try again.");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("An error occurred while updating profile. Please try again.");
        }
    };

    /* ---------- Validation helpers ---------- */

    // name rules: min 7 chars and must contain a space (so last name exists)
    const validateBasic = (obj = local) => {
        const errs = {};
        const name = (obj.name || "").trim();
        if (!name) errs.name = "Name is required";
        else {
            if (name.length < 7) errs.name = "Name must be at least 7 characters";
            if (!/\s+/.test(name))
                errs.name =
                    (errs.name ? errs.name + " — " : "") + "Provide last name separated by a space";
        }
        if (!obj.title || !obj.title.trim()) errs.title = "Title is required";
        if (!obj.address || !obj.address.trim()) errs.address = "Location is required";
        // phone format: +CC + 10 digits (we expect + followed by 2 digits country code then 10 digits)
        const mobile = (obj.mobile || "").trim();
        if (!mobile) errs.mobile = "Phone is required";
        else {
            const phoneRegex = /^\+\d{2}\s?\d{10}$/; // e.g. +91 9876543210 or +919876543210
            if (!phoneRegex.test(mobile))
                errs.mobile =
                    "Phone must be in format +CC followed by 10 digits (e.g. +91 9876543210)";
        }
        return errs;
    };

    // Validate all cards & top-level requirements
    const validateAll = () => {
        const errors = {
            basic: false,
            skills: false,
            experience: false,
            projects: false,
            certifications: false,
            education: false
        };

        // basic
        const basicErr = validateBasic();
        if (Object.keys(basicErr).length > 0) {
            setBasicErrors(basicErr);
            errors.basic = true;
        } else {
            setBasicErrors({});
        }

        // skills at least 1
        const skillTag = local.skillTag || [];
        if (!Array.isArray(skillTag) || skillTag.length === 0) {
            setSkillsError("Add at least one skill");
            errors.skills = true;
        } else {
            setSkillsError("");
        }

        // education at least 1
        const education = local.education || [];
        if (!Array.isArray(education) || education.length === 0) {
            errors.education = true;
        } else {
            // validate each education card
            for (let i = 0; i < education.length; i++) {
                const errs = validateEduForm(education[i]);
                if (Object.keys(errs).length > 0) {
                    errors.education = true;
                    break;
                }
            }
        }

        // validate each existing experience card (if any)
        const experience = local.experience || [];
        if (experience.length === 0) {
            errors.experience = false; // no experience is valid
        } else {
            for (let i = 0; i < experience.length; i++) {
                // Normalize experience item before validation
                const normalizedExp = normalizeExperience(experience[i]);
                const errs = validateExpForm(normalizedExp);
                if (Object.keys(errs).length > 0) {
                    errors.experience = true;
                    break;
                }
            }
        }

        // projects: any existing project must be valid
        const projects = local.projects || [];
        if (projects.length === 0) {
            errors.projects = false; // no projects is valid
        } else {
            for (let i = 0; i < projects.length; i++) {
                const errs = validateProjForm(projects[i]);
                if (Object.keys(errs).length > 0) {
                    errors.projects = true;
                    break;
                }
            }
        }

        // certifications: any existing cert must be valid
        const certs = local.certifications || [];
        if (certs.length === 0) {
            errors.certifications = false; // no certs is valid
        } else {
            for (let i = 0; i < certs.length; i++) {
                const errs = validateCertForm(certs[i]);
                if (Object.keys(errs).length > 0) {
                    errors.certifications = true;
                    break;
                }
            }
        }

        // Update section errors state
        setSectionErrors(errors);

        // Check if all valid
        const allValid = !Object.values(errors).some((err) => err === true);

        return {
            valid: allValid,
            message: allValid ? "" : "Please complete all required sections"
        };
    };

    // helper to quickly check if whole modal is valid (used to style Save All button)
    const isAllValid = useMemo(() => {
        const res = validateAll();
        return res.valid;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local]); // recompute when local changes

    // Notify parent component about validation state changes (only when modal is open)
    useEffect(() => {
        if (onValidationChange && isOpen) {
            onValidationChange(!isAllValid); // Pass true if there are validation errors
        }
    }, [isAllValid, onValidationChange, isOpen]);

    // Generate dynamic tooltip message for Save All button
    const getSaveAllTooltip = useMemo(() => {
        if (isAllValid) return "";

        const messages = [];

        // Basic fields
        const basicErr = validateBasic();
        if (Object.keys(basicErr).length > 0) {
            const field = Object.keys(basicErr)[0];
            const fieldName =
                field === "name"
                    ? "Name"
                    : field === "title"
                    ? "Title"
                    : field === "address"
                    ? "Location"
                    : field === "mobile"
                    ? "Phone"
                    : field;
            if (!local[field] || !local[field].trim()) {
                messages.push(`Basic - ${fieldName} empty`);
            } else {
                messages.push(`Invalid Input - Basic`);
            }
        }

        // Skills
        if (sectionErrors.skills) {
            if (!local.skillTag || local.skillTag.length === 0) {
                messages.push(`Skills - Skills empty`);
            } else {
                messages.push(`Invalid Input - Skills`);
            }
        }

        // Experience
        if (sectionErrors.experience) {
            const experience = local.experience || [];
            for (let i = 0; i < experience.length; i++) {
                // Normalize experience item before validation
                const normalizedExp = normalizeExperience(experience[i]);
                const errs = validateExpForm(normalizedExp);
                const firstError = Object.keys(errs)[0];
                if (firstError) {
                    const fieldName =
                        firstError === "role"
                            ? "Designation"
                            : firstError === "company"
                            ? "Company"
                            : firstError === "start"
                            ? "Start Date"
                            : firstError === "end"
                            ? "End Date"
                            : firstError;
                    if (
                        !normalizedExp[firstError] ||
                        (typeof normalizedExp[firstError] === "string" &&
                            !normalizedExp[firstError].trim())
                    ) {
                        messages.push(`Experience - ${fieldName} empty`);
                    } else {
                        messages.push(`Invalid Input - Experience`);
                    }
                    break;
                }
            }
        }

        // Projects
        if (sectionErrors.projects) {
            const projects = local.projects || [];
            for (let i = 0; i < projects.length; i++) {
                const errs = validateProjForm(projects[i]);
                const firstError = Object.keys(errs)[0];
                if (firstError) {
                    const fieldName =
                        firstError === "projectName"
                            ? "Heading"
                            : firstError === "brief"
                            ? "Brief"
                            : firstError === "skills"
                            ? "Skills"
                            : firstError === "link"
                            ? "Link"
                            : firstError;
                    if (
                        (firstError === "projectName" || firstError === "brief") &&
                        (!projects[i][firstError] || !projects[i][firstError].trim())
                    ) {
                        messages.push(`Projects - ${fieldName} empty`);
                    } else if (
                        firstError === "skills" &&
                        (!projects[i].skillTag || projects[i].skillTag.length === 0)
                    ) {
                        messages.push(`Projects - Skills empty`);
                    } else {
                        messages.push(`Invalid Input - Projects`);
                    }
                    break;
                }
            }
        }

        // Certifications
        if (sectionErrors.certifications) {
            const certs = local.certifications || [];
            for (let i = 0; i < certs.length; i++) {
                const errs = validateCertForm(certs[i]);
                const firstError = Object.keys(errs)[0];
                if (firstError) {
                    const fieldName =
                        firstError === "certificationName"
                            ? "Certificate Name"
                            : firstError === "skills"
                            ? "Skills"
                            : firstError === "file"
                            ? "Certificate File"
                            : firstError === "link"
                            ? "Link"
                            : firstError;
                    if (
                        (firstError === "certificationName" &&
                            (!certs[i].certificationName || !certs[i].certificationName.trim())) ||
                        (firstError === "file" && !certs[i].document)
                    ) {
                        messages.push(`Certifications - ${fieldName} empty`);
                    } else if (
                        firstError === "skills" &&
                        (!certs[i].skillTag || certs[i].skillTag.length === 0)
                    ) {
                        messages.push(`Certifications - Skills empty`);
                    } else {
                        messages.push(`Invalid Input - Certifications`);
                    }
                    break;
                }
            }
        }

        // Education
        if (sectionErrors.education) {
            const education = local.education || [];
            if (education.length === 0) {
                messages.push(`Education - Education empty`);
            } else {
                for (let i = 0; i < education.length; i++) {
                    const errs = validateEduForm(education[i]);
                    const firstError = Object.keys(errs)[0];
                    if (firstError) {
                        const fieldName =
                            firstError === "degree"
                                ? "Degree"
                                : firstError === "institution"
                                ? "Institution"
                                : firstError === "passoutyear"
                                ? "passoutyear"
                                : firstError;
                        if (!education[i][firstError] || !education[i][firstError].trim()) {
                            messages.push(`Education - ${fieldName} empty`);
                        } else {
                            messages.push(`Invalid Input - Education`);
                        }
                        break;
                    }
                }
            }
        }

        return messages.length > 0 ? messages[0] : "";
    }, [local, isAllValid, sectionErrors]);

    // Update section errors in real-time for form sections (Experience, Projects, Certifications, Education)
    useEffect(() => {
        const errors = {
            basic: false,
            skills: false,
            experience: false,
            projects: false,
            certifications: false,
            education: false
        };

        // Basic validation - update errors state for field dots
        const basicErr = validateBasic();
        if (Object.keys(basicErr).length > 0) {
            errors.basic = true;
            setBasicErrors(basicErr);
        } else {
            setBasicErrors({});
        }

        // Skills validation
        const skillTag = local.skillTag || [];
        if (!Array.isArray(skillTag) || skillTag.length === 0) {
            errors.skills = true;
        }

        // Real-time validation for form sections (always check, not just after save attempt)
        const experience = local.experience || [];
        for (let i = 0; i < experience.length; i++) {
            // Normalize experience item before validation
            const normalizedExp = normalizeExperience(experience[i]);
            const errs = validateExpForm(normalizedExp);
            if (Object.keys(errs).length > 0) {
                errors.experience = true;
                break;
            }
        }

        const projects = local.projects || [];
        for (let i = 0; i < projects.length; i++) {
            const errs = validateProjForm(projects[i]);
            if (Object.keys(errs).length > 0) {
                errors.projects = true;
                break;
            }
        }

        const certs = local.certifications || [];
        for (let i = 0; i < certs.length; i++) {
            const errs = validateCertForm(certs[i]);
            if (Object.keys(errs).length > 0) {
                errors.certifications = true;
                break;
            }
        }

        const education = local.education || [];
        if (education.length === 0) {
            errors.education = true;
        } else {
            for (let i = 0; i < education.length; i++) {
                const errs = validateEduForm(education[i]);
                if (Object.keys(errs).length > 0) {
                    errors.education = true;
                    break;
                }
            }
        }

        setSectionErrors(errors);
    }, [local]);

    /* ---------- reset helper ---------- */
    function resetForms() {
        setExpForm(emptyExp());
        setProjForm(emptyProject());
        setCertForm(emptyCert());
        setEduForm(emptyEdu());
        setExpFormOpen(false);
        setProjFormOpen(false);
        setCertFormOpen(false);
        setEduFormOpen(false);
        setExpEditingIndex(null);
        setProjEditingIndex(null);
        setCertEditingIndex(null);
        setEduEditingIndex(null);
        setExpMenuIndex(null);
        setProjMenuIndex(null);
        setCertMenuIndex(null);
        setEduMenuIndex(null);
    }

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} role="dialog" aria-modal="true">
                <div className={styles.modalHeader}>
                    <h2>Edit Profile</h2>
                    <div className={styles.tabs}>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${
                                tab === "basic" ? styles.activeTab : ""
                            } ${sectionErrors.basic ? styles.tabError : ""}`}
                            onClick={() => handleTabChange("basic")}
                        >
                            Basic
                            {sectionErrors.basic && <span className={styles.errorDot} />}
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${
                                tab === "skills" ? styles.activeTab : ""
                            } ${sectionErrors.skills ? styles.tabError : ""}`}
                            onClick={() => handleTabChange("skills")}
                        >
                            Skills
                            {sectionErrors.skills && <span className={styles.errorDot} />}
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${
                                tab === "experience" ? styles.activeTab : ""
                            } ${sectionErrors.experience ? styles.tabError : ""}`}
                            onClick={() => handleTabChange("experience")}
                        >
                            Experience
                            {sectionErrors.experience && <span className={styles.errorDot} />}
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${
                                tab === "projects" ? styles.activeTab : ""
                            } ${sectionErrors.projects ? styles.tabError : ""}`}
                            onClick={() => handleTabChange("projects")}
                        >
                            Projects
                            {sectionErrors.projects && <span className={styles.errorDot} />}
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${
                                tab === "certifications" ? styles.activeTab : ""
                            } ${sectionErrors.certifications ? styles.tabError : ""}`}
                            onClick={() => handleTabChange("certifications")}
                        >
                            Certifications
                            {sectionErrors.certifications && <span className={styles.errorDot} />}
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${
                                tab === "education" ? styles.activeTab : ""
                            } ${sectionErrors.education ? styles.tabError : ""}`}
                            onClick={() => handleTabChange("education")}
                        >
                            Education
                            {sectionErrors.education && <span className={styles.errorDot} />}
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${
                                tab === "document" ? styles.activeTab : ""
                            }`}
                            onClick={() => handleTabChange("document")}
                        >
                            Resume
                        </button>
                    </div>
                </div>

                <div className={styles.modalBody}>
                    {/* BASIC */}
                    {tab === "basic" && (
                        <div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Profile Image</label>
                                <div className={styles.imageRow}>
                                    <div className={styles.imagePreviewWrap}>
                                        <img
                                            src={imagePreviewUrl || DEFAULT_AVATAR}
                                            alt="Profile preview"
                                            className={styles.imagePreview}
                                            onError={() => {
                                                setImagePreviewUrl(DEFAULT_AVATAR);
                                                setLocal((p) => ({ ...p, profile_image: "" }));
                                            }}
                                        />
                                    </div>

                                    <div
                                        style={{ display: "flex", flexDirection: "column", gap: 8 }}
                                    >
                                        <input
                                            ref={imageInputRef}
                                            className={styles.imageInput}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelected}
                                        />
                                        <button
                                            type="button"
                                            className={styles.addBtn}
                                            onClick={handlePickImage}
                                        >
                                            Change Image
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.btn}
                                            onClick={handleRemoveImage}
                                        >
                                            Remove Image
                                        </button>
                                        <small className={styles.hint}>JPG/PNG recommended.</small>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label
                                    className={styles.formLabel}
                                    style={{ position: "relative" }}
                                >
                                    Name
                                    {(fieldValidationTriggered ||
                                        blurredFieldsWithErrors.has("name")) &&
                                        basicErrors.name && (
                                            <span className={styles.fieldErrorDot} />
                                        )}
                                </label>
                                <input
                                    ref={nameInputRef}
                                    className={styles.formInput}
                                    name="name"
                                    value={local.name || ""}
                                    onChange={handleBasicChange}
                                    onBlur={handleBasicBlur}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label
                                    className={styles.formLabel}
                                    style={{ position: "relative" }}
                                >
                                    Title
                                    {(fieldValidationTriggered ||
                                        blurredFieldsWithErrors.has("title")) &&
                                        basicErrors.title && (
                                            <span className={styles.fieldErrorDot} />
                                        )}
                                </label>
                                <input
                                    ref={titleInputRef}
                                    className={styles.formInput}
                                    name="title"
                                    value={local.title || ""}
                                    onChange={handleBasicChange}
                                    onBlur={handleBasicBlur}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label
                                    className={styles.formLabel}
                                    style={{ position: "relative" }}
                                >
                                    Location
                                    {(fieldValidationTriggered ||
                                        blurredFieldsWithErrors.has("address")) &&
                                        basicErrors.address && (
                                            <span className={styles.fieldErrorDot} />
                                        )}
                                </label>
                                <input
                                    ref={locationInputRef}
                                    className={styles.formInput}
                                    name="address"
                                    value={local.address || ""}
                                    onChange={handleBasicChange}
                                    onBlur={handleBasicBlur}
                                />
                            </div>

                            <div className={styles.rowTwo}>
                                <div className={styles.formGroupSmall}>
                                    <label
                                        className={styles.formLabel}
                                        style={{ position: "relative" }}
                                    >
                                        Phone{" "}
                                        <small style={{ color: "#666", fontWeight: 600 }}>
                                            {" "}
                                            (format +CC XXXXXXXXXX)
                                        </small>
                                        {(fieldValidationTriggered ||
                                            blurredFieldsWithErrors.has("mobile")) &&
                                            basicErrors.mobile && (
                                                <span className={styles.fieldErrorDot} />
                                            )}
                                    </label>
                                    <input
                                        ref={phoneInputRef}
                                        className={styles.formInput}
                                        name="mobile"
                                        value={local.mobile || ""}
                                        onChange={handleBasicChange}
                                        onBlur={handleBasicBlur}
                                    />
                                </div>
                                {/* Email edit removed as requested */}
                                <div style={{ flex: 1 }} />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>About</label>
                                <textarea
                                    className={styles.formInput}
                                    name="about"
                                    value={local.about || ""}
                                    onChange={handleBasicChange}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* SKILLS */}
                    {tab === "skills" && (
                        <>
                            <div className={styles.formGroupInline}>
                                <input
                                    className={styles.formInput}
                                    placeholder="Add a skill and press Add"
                                    value={skillsInput}
                                    onChange={(e) => setSkillsInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddSkill();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className={styles.addBtn}
                                    onClick={handleAddSkill}
                                >
                                    Add
                                </button>
                            </div>
                            <div className={styles.skillsList} title={skillsError || ""}>
                                {(local.skillTag || []).map((s, i) => (
                                    <span className={styles.skillTag} key={`${s}-${i}`}>
                                        {s}
                                        <button
                                            type="button"
                                            className={styles.removeSkillBtn}
                                            onClick={() => handleRemoveSkill(i)}
                                            aria-label={`Remove ${s}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </>
                    )}

                    {/* EXPERIENCE */}
                    {tab === "experience" && (
                        <>
                            <div className={styles.sectionHeader}>
                                <h3>Experience</h3>
                                <button
                                    type="button"
                                    className={`${styles.addSmallBtn} ${
                                        expFormOpen &&
                                        Object.keys(validateExpForm(expForm)).length > 0
                                            ? styles.addBtnDisabled
                                            : ""
                                    }`}
                                    onClick={openAddExp}
                                    title={
                                        expFormOpen &&
                                        Object.keys(validateExpForm(expForm)).length > 0
                                            ? "Complete current form before adding new"
                                            : ""
                                    }
                                >
                                    + Add
                                </button>
                            </div>

                            <div className={styles.cardsWrap}>
                                {(local.experience || []).map((exp, idx) => (
                                    <div className={styles.expCard} key={exp.id || idx}>
                                        <div className={styles.cardHeader}>
                                            <div>
                                                <h4>{exp.role}</h4>
                                                <p className={styles.company}>{exp.company}</p>
                                                <p className={styles.duration}>
                                                    {(() => {
                                                        // Safely extract month and year values (handle both string and object formats)
                                                        const getMonth = (monthVal) => {
                                                            if (!monthVal) return "";
                                                            if (typeof monthVal === "string")
                                                                return monthVal;
                                                            if (typeof monthVal === "object")
                                                                return (
                                                                    monthVal.month ||
                                                                    monthVal.name ||
                                                                    ""
                                                                );
                                                            return String(monthVal);
                                                        };
                                                        const getYear = (yearVal) => {
                                                            if (!yearVal) return "";
                                                            if (
                                                                typeof yearVal === "string" ||
                                                                typeof yearVal === "number"
                                                            )
                                                                return String(yearVal);
                                                            if (typeof yearVal === "object")
                                                                return String(
                                                                    yearVal.year ||
                                                                        yearVal.name ||
                                                                        ""
                                                                );
                                                            return "";
                                                        };
                                                        const startM = getMonth(
                                                            exp.startMonth ||
                                                                (exp.start_date &&
                                                                    exp.start_date.month)
                                                        );
                                                        const startY = getYear(
                                                            exp.startYear ||
                                                                (exp.start_date &&
                                                                    exp.start_date.year)
                                                        );
                                                        const startStr =
                                                            `${startM} ${startY}`.trim();
                                                        const endStr =
                                                            exp.present || !exp.end_date
                                                                ? "Present"
                                                                : (() => {
                                                                      const endM = getMonth(
                                                                          exp.endMonth ||
                                                                              (exp.end_date &&
                                                                                  exp.end_date
                                                                                      .month)
                                                                      );
                                                                      const endY = getYear(
                                                                          exp.endYear ||
                                                                              (exp.end_date &&
                                                                                  exp.end_date.year)
                                                                      );
                                                                      return `${endM} ${endY}`.trim();
                                                                  })();
                                                        return startStr && endStr
                                                            ? `${startStr} — ${endStr}`
                                                            : startStr || endStr || "";
                                                    })()}
                                                </p>
                                            </div>
                                            <div className={styles.cardMenuWrap}>
                                                <button
                                                    type="button"
                                                    className={styles.cardMenuBtn}
                                                    onClick={() => toggleExpMenu(idx)}
                                                >
                                                    ⋯
                                                </button>
                                                {expMenuIndex === idx && (
                                                    <div className={styles.cardMenu}>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditExp(idx)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteExp(idx)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p>{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* PROJECTS */}
                    {tab === "projects" && (
                        <>
                            <div className={styles.sectionHeader}>
                                <h3>Projects</h3>
                                <button
                                    type="button"
                                    className={`${styles.addSmallBtn} ${
                                        projFormOpen &&
                                        Object.keys(validateProjForm(projForm)).length > 0
                                            ? styles.addBtnDisabled
                                            : ""
                                    }`}
                                    onClick={openAddProj}
                                    title={
                                        projFormOpen &&
                                        Object.keys(validateProjForm(projForm)).length > 0
                                            ? "Complete current form before adding new"
                                            : ""
                                    }
                                >
                                    + Add
                                </button>
                            </div>

                            <div className={styles.cardsWrap}>
                                {(local.projects || []).map((p, idx) => (
                                    <div className={styles.projectCard} key={p.id || idx}>
                                        <div className={styles.cardHeader}>
                                            <div>
                                                <h4>
                                                    {p.link ? (
                                                        <a
                                                            href={p.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {p.projectName}
                                                        </a>
                                                    ) : (
                                                        p.projectName
                                                    )}
                                                </h4>
                                            </div>
                                            <div className={styles.cardMenuWrap}>
                                                <button
                                                    type="button"
                                                    className={styles.cardMenuBtn}
                                                    onClick={() => toggleProjMenu(idx)}
                                                >
                                                    ⋯
                                                </button>
                                                {projMenuIndex === idx && (
                                                    <div className={styles.cardMenu}>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditProj(idx)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteProj(idx)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p>{p.brief}</p>
                                        <div className={styles.projectSkills}>
                                            {(p.skillTag || []).map((sk, i) => (
                                                <span
                                                    className={styles.skillTag}
                                                    key={`${sk}-${i}`}
                                                >
                                                    {sk}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* CERTIFICATIONS */}
                    {tab === "certifications" && (
                        <>
                            <div className={styles.sectionHeader}>
                                <h3>Certifications</h3>
                                <button
                                    type="button"
                                    className={`${styles.addSmallBtn} ${
                                        certFormOpen &&
                                        Object.keys(validateCertForm(certForm)).length > 0
                                            ? styles.addBtnDisabled
                                            : ""
                                    }`}
                                    onClick={openAddCert}
                                    title={
                                        certFormOpen &&
                                        Object.keys(validateCertForm(certForm)).length > 0
                                            ? "Complete current form before adding new"
                                            : ""
                                    }
                                >
                                    + Add
                                </button>
                            </div>

                            <div className={styles.cardsWrap}>
                                {(local.certifications || []).map((c, idx) => (
                                    <div className={styles.certCard} key={c.id || idx}>
                                        <div className={styles.cardHeader}>
                                            <div>
                                                <h4 className={styles.certHeading}>
                                                    {c.link ? (
                                                        <a
                                                            href={c.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {c.certificationName}
                                                        </a>
                                                    ) : (
                                                        <strong>{c.certificationName}</strong>
                                                    )}
                                                </h4>
                                            </div>
                                            <div className={styles.cardMenuWrap}>
                                                <button
                                                    type="button"
                                                    className={styles.cardMenuBtn}
                                                    onClick={() => toggleCertMenu(idx)}
                                                >
                                                    ⋯
                                                </button>
                                                {certMenuIndex === idx && (
                                                    <div className={styles.cardMenu}>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditCert(idx)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteCert(idx)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p>{c.learned}</p>
                                        <div className={styles.projectSkills}>
                                            {(c.skillTag || []).map((sk, i) => (
                                                <span
                                                    className={styles.skillTag}
                                                    key={`${sk}-${i}`}
                                                >
                                                    {sk}
                                                </span>
                                            ))}
                                        </div>
                                        {c.document ? (
                                            <div className={styles.certFile}>
                                                <a
                                                    href={c.document || "#"}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    View Certificate
                                                </a>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* EDUCATION */}
                    {tab === "education" && (
                        <>
                            <div className={styles.sectionHeader}>
                                <h3>Education</h3>
                                <button
                                    type="button"
                                    className={`${styles.addSmallBtn} ${
                                        eduFormOpen &&
                                        Object.keys(validateEduForm(eduForm)).length > 0
                                            ? styles.addBtnDisabled
                                            : ""
                                    }`}
                                    onClick={openAddEdu}
                                    title={
                                        eduFormOpen &&
                                        Object.keys(validateEduForm(eduForm)).length > 0
                                            ? "Complete current form before adding new"
                                            : ""
                                    }
                                >
                                    + Add
                                </button>
                            </div>

                            <div className={styles.cardsWrap}>
                                {(local.education || []).map((e, idx) => (
                                    <div className={styles.eduCard} key={e.id || idx}>
                                        <div className={styles.cardHeader}>
                                            <div>
                                                <h4>{e.degree}</h4>
                                                <p>{e.institution}</p>
                                                <p className={styles.duration}>
                                                    {e?.year?.passoutyear}
                                                </p>
                                            </div>
                                            <div className={styles.cardMenuWrap}>
                                                <button
                                                    type="button"
                                                    className={styles.cardMenuBtn}
                                                    onClick={() => toggleEduMenu(idx)}
                                                >
                                                    ⋯
                                                </button>
                                                {eduMenuIndex === idx && (
                                                    <div className={styles.cardMenu}>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditEdu(idx)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteEdu(idx)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* RESUME */}
                    {tab === "document" && (
                        <div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    Upload Resume (pdf / doc / docx)
                                </label>
                                <div className={styles.resumeRow}>
                                    <input
                                        ref={resumeInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        style={{ display: "none" }}
                                        onChange={handleResumeSelected}
                                    />
                                    <button
                                        type="button"
                                        className={styles.addBtn}
                                        onClick={pickResume}
                                    >
                                        Choose file
                                    </button>

                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                alignItems: "center"
                                            }}
                                        >
                                            {/* 👇 Corrected filename display */}
                                            <div style={{ fontWeight: 700 }}>
                                                {local.document &&
                                                typeof local.document === "string"
                                                    ? "Resume uploaded"
                                                    : resumeFile
                                                    ? resumeFile.name
                                                    : "No file chosen"}
                                            </div>

                                            {(local.document || resumeFile) && (
                                                <button
                                                    type="button"
                                                    className={styles.btn}
                                                    onClick={removeResume}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <small className={styles.hint}>
                                            Supported: .pdf, .doc, .docx — upload applied on Save
                                            All.
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ------ Overlays for section forms (Project/Cert/Exp/Edu) ------ */}
                {expFormOpen && (
                    <PortalOverlay onClose={() => setExpFormOpen(false)}>
                        <h4>{expEditingIndex !== null ? "Edit Experience" : "Add Experience"}</h4>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Designation
                                {fieldValidationTriggered && expFormErrors.role && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                className={styles.formInput}
                                value={expForm.role}
                                onChange={(e) => {
                                    const updated = { ...expForm, role: e.target.value };
                                    setExpForm(updated);
                                    const newErrors = validateExpForm(updated);
                                    setExpFormErrors(newErrors);
                                    if (
                                        fieldValidationTriggered &&
                                        Object.keys(newErrors).length === 0
                                    ) {
                                        setFieldValidationTriggered(false);
                                    }
                                }}
                                title={expFormErrors.role || ""}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Company
                                {fieldValidationTriggered && expFormErrors.company && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                className={styles.formInput}
                                value={expForm.company}
                                onChange={(e) => {
                                    const updated = { ...expForm, company: e.target.value };
                                    setExpForm(updated);
                                    const newErrors = validateExpForm(updated);
                                    setExpFormErrors(newErrors);
                                    if (
                                        fieldValidationTriggered &&
                                        Object.keys(newErrors).length === 0
                                    ) {
                                        setFieldValidationTriggered(false);
                                    }
                                }}
                                title={expFormErrors.company || ""}
                            />
                        </div>

                        <div className={styles.rowTwo} title={expFormErrors.start || ""}>
                            <div className={styles.formGroupSmall}>
                                <label
                                    className={styles.formLabel}
                                    style={{ position: "relative" }}
                                >
                                    Start Month
                                    {fieldValidationTriggered && expFormErrors.start && (
                                        <span className={styles.fieldErrorDot} />
                                    )}
                                </label>
                                <select
                                    className={styles.formInput}
                                    value={expForm.startMonth}
                                    onChange={(e) => {
                                        const updated = { ...expForm, startMonth: e.target.value };
                                        setExpForm(updated);
                                        const newErrors = validateExpForm(updated);
                                        setExpFormErrors(newErrors);
                                        if (
                                            fieldValidationTriggered &&
                                            Object.keys(newErrors).length === 0
                                        ) {
                                            setFieldValidationTriggered(false);
                                        }
                                    }}
                                >
                                    {(expMonths.length > 0 ? expMonths : months).map((m) => {
                                        const monthValue =
                                            typeof m === "object" ? m.month || m.name || m._id : m;
                                        const monthLabel =
                                            typeof m === "object" ? m.month || m.name || m._id : m;
                                        return (
                                            <option key={monthValue || m} value={monthValue || m}>
                                                {monthLabel || m}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className={styles.formGroupSmall}>
                                <label
                                    className={styles.formLabel}
                                    style={{ position: "relative" }}
                                >
                                    Start Year
                                    {fieldValidationTriggered && expFormErrors.start && (
                                        <span className={styles.fieldErrorDot} />
                                    )}
                                </label>
                                <select
                                    className={styles.formInput}
                                    value={expForm.startYear}
                                    onChange={(e) => {
                                        const updated = { ...expForm, startYear: e.target.value };
                                        setExpForm(updated);
                                        const newErrors = validateExpForm(updated);
                                        setExpFormErrors(newErrors);
                                        if (
                                            fieldValidationTriggered &&
                                            Object.keys(newErrors).length === 0
                                        ) {
                                            setFieldValidationTriggered(false);
                                        }
                                    }}
                                >
                                    {(expYears.length > 0 ? expYears : years).map((y) => {
                                        const yearValue =
                                            typeof y === "object" ? y.year || y.name || y._id : y;
                                        const yearLabel =
                                            typeof y === "object" ? y.year || y.name || y._id : y;
                                        return (
                                            <option key={yearValue || y} value={yearValue || y}>
                                                {yearLabel || y}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className={styles.rowTwo} title={expFormErrors.end || ""}>
                            <div className={styles.formGroupSmall}>
                                <label
                                    className={styles.formLabel}
                                    style={{ position: "relative" }}
                                >
                                    End Month
                                    {fieldValidationTriggered && expFormErrors.end && (
                                        <span className={styles.fieldErrorDot} />
                                    )}
                                </label>
                                <select
                                    className={styles.formInput}
                                    value={expForm.endMonth}
                                    onChange={(e) => {
                                        const updated = { ...expForm, endMonth: e.target.value };
                                        setExpForm(updated);
                                        const newErrors = validateExpForm(updated);
                                        setExpFormErrors(newErrors);
                                        if (
                                            fieldValidationTriggered &&
                                            Object.keys(newErrors).length === 0
                                        ) {
                                            setFieldValidationTriggered(false);
                                        }
                                    }}
                                    disabled={expForm.present}
                                >
                                    {(expMonths.length > 0 ? expMonths : months).map((m) => {
                                        const monthValue =
                                            typeof m === "object" ? m.month || m.name || m._id : m;
                                        const monthLabel =
                                            typeof m === "object" ? m.month || m.name || m._id : m;
                                        return (
                                            <option key={monthValue || m} value={monthValue || m}>
                                                {monthLabel || m}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className={styles.formGroupSmall}>
                                <label
                                    className={styles.formLabel}
                                    style={{ position: "relative" }}
                                >
                                    End Year / Present
                                    {fieldValidationTriggered && expFormErrors.end && (
                                        <span className={styles.fieldErrorDot} />
                                    )}
                                </label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <select
                                        className={styles.formInput}
                                        value={expForm.endYear}
                                        onChange={(e) => {
                                            const updated = { ...expForm, endYear: e.target.value };
                                            setExpForm(updated);
                                            const newErrors = validateExpForm(updated);
                                            setExpFormErrors(newErrors);
                                            if (
                                                fieldValidationTriggered &&
                                                Object.keys(newErrors).length === 0
                                            ) {
                                                setFieldValidationTriggered(false);
                                            }
                                        }}
                                        disabled={expForm.present}
                                    >
                                        {(expYears.length > 0 ? expYears : years).map((y) => {
                                            const yearValue =
                                                typeof y === "object"
                                                    ? y.year || y.name || y._id
                                                    : y;
                                            const yearLabel =
                                                typeof y === "object"
                                                    ? y.year || y.name || y._id
                                                    : y;
                                            return (
                                                <option key={yearValue || y} value={yearValue || y}>
                                                    {yearLabel || y}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <button
                                        type="button"
                                        className={styles.smallToggle}
                                        onClick={() => {
                                            const updated = {
                                                ...expForm,
                                                present: !expForm.present
                                            };
                                            setExpForm(updated);
                                            const newErrors = validateExpForm(updated);
                                            setExpFormErrors(newErrors);
                                            if (
                                                fieldValidationTriggered &&
                                                Object.keys(newErrors).length === 0
                                            ) {
                                                setFieldValidationTriggered(false);
                                            }
                                        }}
                                    >
                                        {expForm.present ? "Present" : "Set Present"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Services / Experience Gained</label>
                            <textarea
                                className={styles.formInput}
                                rows={4}
                                value={expForm.description}
                                onChange={(e) =>
                                    setExpForm({ ...expForm, description: e.target.value })
                                }
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button
                                type="button"
                                className={styles.btn}
                                onClick={() => {
                                    setExpFormOpen(false);
                                    setExpEditingIndex(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.saveBtn} ${
                                    Object.keys(validateExpForm(expForm)).length > 0
                                        ? styles.saveBtnDisabled
                                        : ""
                                }`}
                                onClick={saveExp}
                                title={
                                    Object.keys(validateExpForm(expForm)).length > 0
                                        ? (() => {
                                              const errs = validateExpForm(expForm);
                                              const firstError = Object.keys(errs)[0];
                                              const fieldName =
                                                  firstError === "role"
                                                      ? "Designation"
                                                      : firstError === "company"
                                                      ? "Company"
                                                      : firstError === "start"
                                                      ? "Start Date"
                                                      : firstError === "end"
                                                      ? "End Date"
                                                      : firstError;
                                              return !expForm[firstError] ||
                                                  (typeof expForm[firstError] === "string" &&
                                                      !expForm[firstError].trim())
                                                  ? `Experience - ${fieldName} empty`
                                                  : `Invalid Input - Experience`;
                                          })()
                                        : ""
                                }
                            >
                                {expEditingIndex !== null ? "Update" : "Add"}
                            </button>
                        </div>
                    </PortalOverlay>
                )}

                {projFormOpen && (
                    <PortalOverlay onClose={() => setProjFormOpen(false)}>
                        <h4>{projEditingIndex !== null ? "Edit Project" : "Add Project"}</h4>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Heading
                                {fieldValidationTriggered && projFormErrors.projectName && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                className={styles.formInput}
                                value={projForm.projectName}
                                onChange={(e) => {
                                    setProjForm({ ...projForm, projectName: e.target.value });
                                    setProjFormErrors((p) => ({ ...p, projectName: "" }));
                                }}
                                title={projFormErrors.projectName || ""}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Brief
                                {fieldValidationTriggered && projFormErrors.brief && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <textarea
                                className={styles.formInput}
                                rows={3}
                                value={projForm.brief}
                                onChange={(e) => {
                                    setProjForm({ ...projForm, brief: e.target.value });
                                    setProjFormErrors((p) => ({ ...p, brief: "" }));
                                }}
                                title={projFormErrors.brief || ""}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Link (optional)
                                {fieldValidationTriggered && projFormErrors.link && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                className={styles.formInput}
                                value={projForm.link}
                                onChange={(e) => {
                                    setProjForm({ ...projForm, link: e.target.value });
                                    setProjFormErrors((p) => ({ ...p, link: "" }));
                                }}
                                title={projFormErrors.link || ""}
                            />
                        </div>

                        <div
                            className={styles.formGroupInline}
                            title={projFormErrors.skills || ""}
                            style={{ position: "relative" }}
                        >
                            {fieldValidationTriggered && projFormErrors.skills && (
                                <span
                                    className={styles.fieldErrorDot}
                                    style={{ position: "absolute", top: "-8px", right: "8px" }}
                                />
                            )}
                            <input
                                className={styles.formInput}
                                placeholder="Add a skill learned"
                                value={projForm._skillInput || ""}
                                onChange={(e) =>
                                    setProjForm({ ...projForm, _skillInput: e.target.value })
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (projForm._skillInput?.trim())
                                            addProjSkill(projForm._skillInput.trim());
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className={styles.addBtn}
                                onClick={() => {
                                    if (projForm._skillInput?.trim())
                                        addProjSkill(projForm._skillInput.trim());
                                }}
                            >
                                Add
                            </button>
                        </div>

                        <div className={styles.skillsList}>
                            {(projForm.skillTag || []).map((sk, i) => (
                                <span className={styles.skillTag} key={`${sk}-${i}`}>
                                    {sk}{" "}
                                    <button
                                        type="button"
                                        className={styles.removeSkillBtn}
                                        onClick={() => removeProjSkill(i)}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button
                                type="button"
                                className={styles.btn}
                                onClick={() => setProjFormOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.saveBtn} ${
                                    Object.keys(validateProjForm(projForm)).length > 0
                                        ? styles.saveBtnDisabled
                                        : ""
                                }`}
                                onClick={saveProj}
                                title={
                                    Object.keys(validateProjForm(projForm)).length > 0
                                        ? (() => {
                                              const errs = validateProjForm(projForm);
                                              const firstError = Object.keys(errs)[0];
                                              const fieldName =
                                                  firstError === "projectName"
                                                      ? "Heading"
                                                      : firstError === "brief"
                                                      ? "Brief"
                                                      : firstError === "skills"
                                                      ? "Skills"
                                                      : firstError === "link"
                                                      ? "Link"
                                                      : firstError;
                                              if (
                                                  firstError === "skills" &&
                                                  (!projForm.skillTag ||
                                                      projForm.skillTag.length === 0)
                                              ) {
                                                  return `Projects - Skills empty`;
                                              } else if (
                                                  (firstError === "projectName" ||
                                                      firstError === "brief") &&
                                                  (!projForm[firstError] ||
                                                      !projForm[firstError].trim())
                                              ) {
                                                  return `Projects - ${fieldName} empty`;
                                              } else {
                                                  return `Invalid Input - Projects`;
                                              }
                                          })()
                                        : ""
                                }
                            >
                                {projEditingIndex !== null ? "Update" : "Add"}
                            </button>
                        </div>
                    </PortalOverlay>
                )}

                {certFormOpen && (
                    <PortalOverlay onClose={() => setCertFormOpen(false)}>
                        <h4>
                            {certEditingIndex !== null ? "Edit Certification" : "Add Certification"}
                        </h4>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Certificate Name
                                {fieldValidationTriggered && certFormErrors.certificationName && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                className={styles.formInput}
                                value={certForm.certificationName}
                                onChange={(e) => {
                                    setCertForm({ ...certForm, certificationName: e.target.value });
                                    setCertFormErrors((p) => ({ ...p, certificationName: "" }));
                                }}
                                title={certFormErrors.certificationName || ""}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>What learned</label>
                            <textarea
                                className={styles.formInput}
                                rows={3}
                                value={certForm.learned}
                                onChange={(e) =>
                                    setCertForm({ ...certForm, learned: e.target.value })
                                }
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Link (optional)
                                {fieldValidationTriggered && certFormErrors.link && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                className={styles.formInput}
                                value={certForm.link}
                                onChange={(e) => {
                                    setCertForm({ ...certForm, link: e.target.value });
                                    setCertFormErrors((p) => ({ ...p, link: "" }));
                                }}
                                title={certFormErrors.link || ""}
                            />
                        </div>

                        <div
                            className={styles.formGroupInline}
                            title={certFormErrors.skills || ""}
                            style={{ position: "relative" }}
                        >
                            {fieldValidationTriggered && certFormErrors.skills && (
                                <span
                                    className={styles.fieldErrorDot}
                                    style={{ position: "absolute", top: "-8px", right: "8px" }}
                                />
                            )}
                            <input
                                className={styles.formInput}
                                placeholder="Add skill learned"
                                value={certForm._skillInput || ""}
                                onChange={(e) =>
                                    setCertForm({ ...certForm, _skillInput: e.target.value })
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (certForm._skillInput?.trim())
                                            addCertSkill(certForm._skillInput.trim());
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className={styles.addBtn}
                                onClick={() => {
                                    if (certForm._skillInput?.trim())
                                        addCertSkill(certForm._skillInput.trim());
                                }}
                            >
                                Add
                            </button>
                        </div>

                        <div className={styles.skillsList}>
                            {(certForm.skillTag || []).map((sk, i) => (
                                <span className={styles.skillTag} key={`${sk}-${i}`}>
                                    {sk}{" "}
                                    <button
                                        type="button"
                                        className={styles.removeSkillBtn}
                                        onClick={() => removeCertSkill(i)}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Upload Certificate (pdf/doc/docx) — required
                                {fieldValidationTriggered && certFormErrors.file && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) =>
                                    handleCertFileSelected(e.target.files && e.target.files[0])
                                }
                                title={certFormErrors.file || ""}
                            />
                            {certForm.document ? (
                                <div style={{ marginTop: 8 }}>
                                    <strong>Uploaded:</strong>{" "}
                                    {certForm.document instanceof File
                                        ? certForm.document.name
                                        : "Certificate"}{" "}
                                    <button
                                        type="button"
                                        className={styles.btn}
                                        onClick={removeCertFile}
                                        style={{ marginLeft: 8 }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button
                                type="button"
                                className={styles.btn}
                                onClick={() => setCertFormOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.saveBtn} ${
                                    Object.keys(validateCertForm(certForm)).length > 0
                                        ? styles.saveBtnDisabled
                                        : ""
                                }`}
                                onClick={saveCert}
                                title={
                                    Object.keys(validateCertForm(certForm)).length > 0
                                        ? (() => {
                                              const errs = validateCertForm(certForm);
                                              const firstError = Object.keys(errs)[0];
                                              const fieldName =
                                                  firstError === "certificationName"
                                                      ? "Certificate Name"
                                                      : firstError === "skills"
                                                      ? "Skills"
                                                      : firstError === "file"
                                                      ? "Certificate File"
                                                      : firstError === "link"
                                                      ? "Link"
                                                      : firstError;
                                              if (
                                                  (firstError === "certificationName" &&
                                                      (!certForm.certificationName ||
                                                          !certForm.certificationName.trim())) ||
                                                  (firstError === "file" && !certForm.document)
                                              ) {
                                                  return `Certifications - ${fieldName} empty`;
                                              } else if (
                                                  firstError === "skills" &&
                                                  (!certForm.skillTag ||
                                                      certForm.skillTag.length === 0)
                                              ) {
                                                  return `Certifications - Skills empty`;
                                              } else {
                                                  return `Invalid Input - Certifications`;
                                              }
                                          })()
                                        : ""
                                }
                            >
                                {certEditingIndex !== null ? "Update" : "Add"}
                            </button>
                        </div>
                    </PortalOverlay>
                )}

                {eduFormOpen && (
                    <PortalOverlay onClose={() => setEduFormOpen(false)}>
                        <h4>{eduEditingIndex !== null ? "Edit Education" : "Add Education"}</h4>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Degree
                                {fieldValidationTriggered && eduFormErrors.degree && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                className={styles.formInput}
                                value={eduForm.degree}
                                onChange={(e) => {
                                    setEduForm({ ...eduForm, degree: e.target.value });
                                    setEduFormErrors((p) => ({ ...p, degree: "" }));
                                }}
                                title={eduFormErrors.degree || ""}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                College / Institution
                                {fieldValidationTriggered && eduFormErrors.institution && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>
                            <input
                                className={styles.formInput}
                                value={eduForm.institution}
                                onChange={(e) => {
                                    setEduForm({ ...eduForm, institution: e.target.value });
                                    setEduFormErrors((p) => ({ ...p, institution: "" }));
                                }}
                                title={eduFormErrors.institution || ""}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel} style={{ position: "relative" }}>
                                Pass out Year
                                {fieldValidationTriggered && eduFormErrors.passoutyear && (
                                    <span className={styles.fieldErrorDot} />
                                )}
                            </label>

                            <select
                                className="form-control"
                                value={eduForm.passoutyear || eduForm.year || ""}
                                onChange={(e) => {
                                    setEduForm({
                                        ...eduForm,
                                        passoutyear: e.target.value,
                                        year: e.target.value
                                    });
                                    setEduFormErrors((p) => ({ ...p, passoutyear: "" }));
                                }}
                            >
                                <option value="">Select Passout Year</option>

                                {passoutYearList.map((y) => (
                                    <option key={y._id} value={y.passoutyear}>
                                        {y.passoutyear}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button
                                type="button"
                                className={styles.btn}
                                onClick={() => setEduFormOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.saveBtn} ${
                                    Object.keys(validateEduForm(eduForm)).length > 0
                                        ? styles.saveBtnDisabled
                                        : ""
                                }`}
                                onClick={saveEdu}
                                title={
                                    Object.keys(validateEduForm(eduForm)).length > 0
                                        ? (() => {
                                              const errs = validateEduForm(eduForm);
                                              const firstError = Object.keys(errs)[0];
                                              const fieldName =
                                                  firstError === "degree"
                                                      ? "Degree"
                                                      : firstError === "institution"
                                                      ? "Institution"
                                                      : firstError === "passoutyear"
                                                      ? "Year"
                                                      : firstError;
                                              return !eduForm[firstError] ||
                                                  !eduForm[firstError].trim()
                                                  ? `Education - ${fieldName} empty`
                                                  : `Invalid Input - Education`;
                                          })()
                                        : ""
                                }
                            >
                                {eduEditingIndex !== null ? "Update" : "Add"}
                            </button>
                        </div>
                    </PortalOverlay>
                )}

                <div className={styles.modalFooter}>
                    <button type="button" className={styles.btn} onClick={() => onClose()}>
                        Close
                    </button>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.saveBtn} ${
                            !isAllValid ? styles.saveBtnDisabled : ""
                        }`}
                        onClick={handleSaveAll}
                        title={getSaveAllTooltip || ""}
                    >
                        Save All
                    </button>
                </div>
            </div>

            {/* Validation Tooltip */}
            <ValidationTooltip
                message={activeTooltip.message}
                targetElement={activeTooltip.element}
                show={!!activeTooltip.message && !!activeTooltip.element}
            />
        </div>
    );
}
