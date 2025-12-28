// EditProfileRecruiter.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "./EditProfileRecruiter.module.css";

// API Constants
const BASE_URL = "http://localhost:8080/api/v1/recruiter";
const RECRUITER_API = {
  // ----------- PROFILE ----------
  UPDATE_PROFILE: (id) => `${BASE_URL}/recruiter-update/${id}`,
  GET_PROFILE: (id) => `${BASE_URL}/recruiter_profile/${id}`,

  // ----------- EXPERIENCE ----------
  ADD_EXPERIENCE: (recruiterId) =>
    `${BASE_URL}/recruiter/${recruiterId}/experience/add`,

  UPDATE_EXPERIENCE: (recruiterId, experienceId) =>
    `${BASE_URL}/recruiter/${recruiterId}/experience/${experienceId}/update`,

  DELETE_EXPERIENCE: (recruiterId, experienceId) =>
    `${BASE_URL}/recruiter/${recruiterId}/experience/${experienceId}/delete`,

  // ----------- EDUCATION ----------
  ADD_EDUCATION: (recruiterId) =>
    `${BASE_URL}/recruiter/${recruiterId}/education/add`,

  UPDATE_EDUCATION: (recruiterId, educationId) =>
    `${BASE_URL}/recruiter/${recruiterId}/education/${educationId}/update`,

  DELETE_EDUCATION: (recruiterId, educationId) =>
    `${BASE_URL}/recruiter/${recruiterId}/education/${educationId}/delete`,

  // Experience & Education dropdown APIs removed - using free-text inputs instead
};

export default function EditProfileModal({
  isOpen,
  onClose,
  data = {},
  onSave,
}) {
  const DEFAULT_AVATAR = (process.env.PUBLIC_URL || "") + "/Images/Default.png";

  // local form state
  const [local, setLocal] = useState({
    name: "",
    profile_image: "",
    email: "",
    mobile: "",
    address: "",
    pin: "",
    empId: "",
    workCat: "",
    designation: "",
    skillTag: [],
    bio: "",
    company: "",
    experience: [],
    education: [],
  });

  // image preview
  const [imagePreview, setImagePreview] = useState(DEFAULT_AVATAR);
  const fileRef = useRef(null);

  // small UI pieces
  const [tab, setTab] = useState("basic"); // "basic" | "experience" | "education"

  // Experience/education temporary forms + index for editing
  const emptyExp = () => ({
    role: "",
    company: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    present: false,
    description: "",
  });
  const emptyEdu = () => ({ degree: "", institution: "", passoutyear: "" });

  const [expForm, setExpForm] = useState(emptyExp());
  const [expEditIndex, setExpEditIndex] = useState(null);
  const [eduForm, setEduForm] = useState(emptyEdu());
  const [eduEditIndex, setEduEditIndex] = useState(null);
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);

  // errors
  const [errors, setErrors] = useState({});

  // Dropdown lists removed - using free-text inputs instead
  // Keep local state so existing logic that expects these variables still works.
  // They will remain empty unless the dropdown APIs are re-enabled.
  const [expMonths, setExpMonths] = useState([]);
  const [expYears, setExpYears] = useState([]);
  const [passoutYears, setPassoutYears] = useState([]);
  

  // Get recruiter ID and token
  const recruiterId = localStorage.getItem("userId") || localStorage.getItem("recruiterId") || data?._id || data?.id;
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");

  // initialize local state from data when opened / data changes
  useEffect(() => {
    if (!data) return;
    
    // Handle workCat: preserve the object if it exists, or store the ID
    let workCatValue = "";
    if (data.workCat) {
      if (typeof data.workCat === "object" && data.workCat !== null) {
        // Store the full object to preserve cat_name
        workCatValue = data.workCat;
      } else {
        // It's already a string/ID
        workCatValue = data.workCat;
      }
    }
    
    setLocal({
      name: data.name || "",
      profile_image: data.profile_image || data.logo || "",
      email: data.email || "",
      mobile: data.mobile || "",
      address: data.address || "",
      pin: data.pin || "",
      empId: data.empId || "",
      workCat: workCatValue,
      designation: data.designation || "",
      skillTag: Array.isArray(data.skillTag) ? data.skillTag : (data.skillTag ? [data.skillTag] : []),
      bio: data.bio || "",
      company: data.company || "",
      experience: Array.isArray(data.experience)
        ? data.experience.map(normalizeExp)
        : [],
      education: Array.isArray(data.education)
        ? data.education.map(normalizeEdu)
        : [],
    });

    const img = data.profile_image
      ? data.profile_image.startsWith("http")
        ? data.profile_image
        : `http://localhost:8080/public/${data.profile_image}`
      : DEFAULT_AVATAR;

    setImagePreview(img);
    // reset editing forms
    setExpForm(emptyExp());
    setEduForm(emptyEdu());
    setExpEditIndex(null);
    setEduEditIndex(null);
    setShowExpForm(false);
    setShowEduForm(false);
    setErrors({});
    setTab("basic");
  }, [data, isOpen]);

  // lock background scroll while modal open (match reference UX)
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // close on Escape for better UX
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Dropdown fetching removed: using free-text inputs instead; arrays remain empty unless re-enabled.

  // normalizers to ensure consistent UI fields
  function normalizeExp(e = {}) {
    // Handle ObjectId refs - month/year might be objects with _id, name, etc.
    const getMonthValue = (monthVal) => {
      if (!monthVal) return "";
      if (typeof monthVal === "string") return monthVal;
      if (typeof monthVal === "object") {
        return monthVal._id || monthVal.name || monthVal.month || monthVal.value || "";
      }
      return String(monthVal);
    };
    const getYearValue = (yearVal) => {
      if (!yearVal) return "";
      if (typeof yearVal === "string" || typeof yearVal === "number") return String(yearVal);
      if (typeof yearVal === "object") {
        return String(yearVal._id || yearVal.year || yearVal.name || yearVal.value || "");
      }
      return "";
    };

    const startMonth = getMonthValue(e.start_date?.month);
    const startYear = getYearValue(e.start_date?.year);
    const endMonth = getMonthValue(e.end_date?.month);
    const endYear = getYearValue(e.end_date?.year);
    const present =
      e.present === true ||
      e.end_date === null ||
      (!endMonth && !endYear);
    
    return {
      id: e.id || e._id || Math.random().toString(36).slice(2, 9),
      _id: e._id,
      role: e.role || "",
      company: e.company || "",
      startMonth: startMonth || "",
      startYear: startYear || "",
      endMonth: endMonth || "",
      endYear: endYear || "",
      present: !!present,
      description: e.description || "",
    };
  }
  function normalizeEdu(ed = {}) {
    // Handle ObjectId ref - year might be object with _id, name, passoutyear, etc.
    // We need to extract the actual year value, not the _id
    const getYearValue = (yearVal) => {
      if (!yearVal) return "";
      if (typeof yearVal === "string" || typeof yearVal === "number") {
        // If it's already a string/number, return it
        return String(yearVal);
      }
      if (typeof yearVal === "object") {
        // For objects, we want the actual year value, not the _id
        // Try to get the year value first, then fall back to _id if needed
        // But prefer passoutyear, year, name, value over _id
        const yearStr = yearVal.passoutyear || yearVal.year || yearVal.name || yearVal.value;
        if (yearStr) return String(yearStr);
        // If we only have an _id, try to resolve it using loaded `passoutYears` list
        const id = String(yearVal._id || yearVal.id || "");
        if (id && Array.isArray(passoutYears) && passoutYears.length > 0) {
          const found = passoutYears.find(y => {
            if (!y) return false;
            if (typeof y === 'object') return String(y._id || y.id || '') === id || String(y.passoutyear || y.year || y.name || y.value || '') === id;
            return String(y) === id;
          });
          if (found) {
            return String(found.passoutyear || found.year || found.name || found.value || id);
          }
        }
        // Only use _id as last resort (for matching with dropdown)
        return id;
      }
      return "";
    };

    // Handle both ed.year and ed.passoutyear (in case it's already normalized)
    // Priority: ed.year (from API) > ed.passoutyear (already normalized)
    const yearValue = ed.year ? getYearValue(ed.year) : (ed.passoutyear ? getYearValue(ed.passoutyear) : "");

    return {
      id: ed.id || ed._id || Math.random().toString(36).slice(2, 9),
      _id: ed._id,
      degree: ed.degree || "",
      institution: ed.institution || "",
      passoutyear: yearValue,
    };
  }

  /* ---------- Basic handlers ---------- */
  function handleBasicChange(e) {
    const { name, value } = e.target;
    setLocal((s) => ({ ...s, [name]: value }));
  }

function handleImageChange(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;

  // Create preview URL
  const previewUrl = URL.createObjectURL(file);
  setImagePreview(previewUrl);

  // Store the actual File object
  setLocal((s) => ({
    ...s,
    profile_image: file
  }));
}

  /* ---------- Experience handlers ---------- */
  function handleExpInput(e) {
    const { name, value, type, checked } = e.target;
    setExpForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startAddExp() {
    setExpForm(emptyExp());
    setExpEditIndex(null);
    setShowExpForm(true);
  }
  function editExp(i) {
    setExpForm(local.experience[i]);
    setExpEditIndex(i);
    setShowExpForm(true);
  }
  async function saveExp() {
    // basic validation - require start month/year and ensure end date when not present
    if (!expForm.role || !expForm.company) {
      setErrors({ exp: "Role and Company are required." });
      return;
    }

    // ensure start month & year selected
    if (!expForm.startMonth || !expForm.startYear) {
      setErrors({ exp: "Start month and start year are required." });
      return;
    }

    // if not currently marked as present, end month & year are required
    if (!expForm.present && (!expForm.endMonth || !expForm.endYear)) {
      setErrors({ exp: "End month and end year are required unless " +
        "'Present' is checked." });
      return;
    }

    setErrors((e) => ({ ...e, exp: null }));

    // Helper: resolve month for API - prefer human readable month (name/month/value)
    const resolveMonthForApi = (selected) => {
      if (!selected) return selected;
      if (!Array.isArray(expMonths) || expMonths.length === 0) return selected;

      let found = expMonths.find(m => {
        if (typeof m === 'object' && m !== null) {
          return String(m._id || m.id || m.month || m.name || m.value || '') === String(selected);
        }
        return String(m) === String(selected);
      });
      if (found && typeof found === 'object') {
        // Prefer sending the ObjectId (_id/id) when available (backend expects IDs),
        // otherwise fall back to the human-readable month value for compatibility.
        return found._id || found.id || found.month || found.name || found.value || found.label || String(found);
      }
      return selected;
    };

    // Helper: resolve year for API - prefer ObjectId (_id) when available, otherwise numeric year/value
    const resolveYearForApi = (selected) => {
      if (!selected) return selected;
      if (!Array.isArray(expYears) || expYears.length === 0) return selected;

      let found = expYears.find(y => {
        if (typeof y === 'object' && y !== null) {
          return String(y._id || y.id || y.year || y.name || y.value || '') === String(selected);
        }
        return String(y) === String(selected);
      });
      if (found && typeof found === 'object') {
        // Prefer _id (ObjectId) if present; otherwise use year/passoutyear/name/value
        return found._id || found.id || found.year || found.value || found.name || String(found);
      }
      return selected;
    };

    if (!recruiterId || !token) {
      setErrors({ exp: "Authentication required. Please login again." });
      return;
    }

    try {
      // Map selected values to the dropdown canonical values (prefer _id when available)
      const startMonth = resolveMonthForApi(expForm.startMonth);
      const startYear = resolveYearForApi(expForm.startYear);
      const endMonth = expForm.present ? null : resolveMonthForApi(expForm.endMonth);
      const endYear = expForm.present ? null : resolveYearForApi(expForm.endYear);

      const payload = {
        role: expForm.role,
        company: expForm.company,
        start_date: {
          month: startMonth,
          year: startYear,
        },
        end_date: expForm.present
          ? null
          : {
              month: endMonth,
              year: endYear,
            },
        present: expForm.present,
        description: expForm.description || "",
      };

      console.log("Saving experience payload:", payload);

      let savedExp;
      if (expEditIndex !== null && expEditIndex >= 0 && expEditIndex < local.experience.length) {
        // Update existing experience
        const existingExp = local.experience[expEditIndex];
        const experienceId = existingExp._id || existingExp.id;
        if (!experienceId) {
          setErrors({ exp: "Experience ID not found. Please refresh and try again." });
          return;
        }
        const response = await axios.put(
          RECRUITER_API.UPDATE_EXPERIENCE(recruiterId, experienceId),
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        savedExp = response?.data?.data || { ...payload, _id: experienceId, id: experienceId };
      } else {
        // Add new experience
        const response = await axios.post(
          RECRUITER_API.ADD_EXPERIENCE(recruiterId),
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        savedExp = response?.data?.data || { ...payload, _id: response?.data?._id, id: response?.data?._id || response?.data?.id };
      }

      // Update local state
      setLocal((s) => {
        const arr = [...s.experience];
        if (expEditIndex !== null && expEditIndex >= 0 && expEditIndex < arr.length) {
          arr[expEditIndex] = normalizeExp(savedExp);
        } else {
          arr.unshift(normalizeExp(savedExp));
        }
        return { ...s, experience: arr };
      });
      setExpForm(emptyExp());
      setExpEditIndex(null);
      setShowExpForm(false);
      // Try to fetch refreshed profile to ensure experience entries are populated
      try {
        const profileRes = await axios.get(RECRUITER_API.GET_PROFILE(recruiterId), {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
        if (profileRes && profileRes.data) {
          const fresh = profileRes.data.data || profileRes.data;
          if (fresh && Array.isArray(fresh.experience)) {
            setLocal((s) => ({ ...s, experience: fresh.experience.map(normalizeExp) }));
          }
        }
      } catch (fetchErr) {
        console.warn("Failed to fetch refreshed profile after saving experience:", fetchErr);
      }
    } catch (err) {
      console.error("Error saving experience:", err);
      // Provide clearer guidance for start/end date validation errors
      let msg = err?.response?.data?.message || err?.message || "Failed to save experience. Please try again.";
      const lower = String(msg).toLowerCase();
      if (lower.includes("start") && lower.includes("date")) {
        msg = "Invalid start date. Please re-enter start month and start year.";
      } else if (lower.includes("end") && lower.includes("date")) {
        msg = "Invalid end date. Please re-enter end month and end year, or check 'Present'.";
      }
      setErrors({ exp: msg });
    }
  }
  async function removeExp(i) {
    if (!recruiterId || !token) {
      alert("Authentication required. Please login again.");
      return;
    }

    const expToDelete = local.experience[i];
    const experienceId = expToDelete?._id || expToDelete?.id;

    if (!experienceId) {
      // If no ID, just remove from local state (might be unsaved)
      setLocal((s) => {
        const arr = s.experience.filter((_, idx) => idx !== i);
        return { ...s, experience: arr };
      });
      return;
    }

    try {
      await axios.delete(RECRUITER_API.DELETE_EXPERIENCE(recruiterId, experienceId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove from local state after successful deletion
      setLocal((s) => {
        const arr = s.experience.filter((_, idx) => idx !== i);
        return { ...s, experience: arr };
      });
    } catch (err) {
      console.error("Error deleting experience:", err);
      alert(err?.response?.data?.message || "Failed to delete experience. Please try again.");
    }
  }

  /* ---------- Education handlers ---------- */
  function handleEduInput(e) {
    const { name, value } = e.target;
    setEduForm((f) => ({ ...f, [name]: value }));
  }
  function startAddEdu() {
    setEduForm(emptyEdu());
    setEduEditIndex(null);
    setShowEduForm(true);
  }
  function editEdu(i) {
    const eduItem = local.education[i];
    // Ensure passoutyear is properly extracted and displayed when editing
    // Prefer human-readable year when available (passoutyear/year), otherwise fall back to id
    const rawYear = eduItem.passoutyear || eduItem.year || "";
    let passoutyearValue = "";
    let readableYear = "";
    let idYear = "";

    if (typeof rawYear === "object" && rawYear !== null) {
      readableYear = rawYear.passoutyear || rawYear.year || rawYear.name || rawYear.value || "";
      idYear = rawYear._id || rawYear.id || "";
      passoutyearValue = readableYear || idYear || "";
    } else if (typeof rawYear === "string" || typeof rawYear === "number") {
      passoutyearValue = String(rawYear);
    }

    // If dropdowns are available, prefer the human-readable value from the list
    if (passoutyearValue && Array.isArray(passoutYears) && passoutYears.length > 0) {
      // Try to find by _id first
      let yearObj = passoutYears.find(y => {
        if (typeof y === "object" && y !== null) return String(y._id || y.id || '') === String(passoutyearValue);
        return String(y) === String(passoutyearValue);
      });
      // Then try to find by value
      if (!yearObj) {
        yearObj = passoutYears.find(y => {
          if (typeof y === "object" && y !== null) {
            const yValue = y.passoutyear || y.year || y.name || y.value;
            return String(yValue) === String(passoutyearValue);
          }
          return String(y) === String(passoutyearValue);
        });
      }
      if (yearObj && typeof yearObj === "object") {
        passoutyearValue = String(yearObj.passoutyear || yearObj.year || yearObj.name || yearObj.value || yearObj._id || yearObj.id || passoutyearValue);
      }
    }

    // If we ended up with an unresolved ObjectId but a readable value exists, show readable
    if (/^[0-9a-fA-F]{24}$/.test(passoutyearValue) && readableYear) {
      passoutyearValue = readableYear;
    }
    
    setEduForm({
      ...eduItem,
      passoutyear: String(passoutyearValue),
    });
    setEduEditIndex(i);
    setShowEduForm(true);
  }
  async function saveEdu() {
    console.log("saveEdu called", eduForm);
    if (!eduForm.degree || !eduForm.institution) {
      setErrors({ edu: "Degree and Institution are required." });
      return;
    }
    
    // Validate passout year
    if (!eduForm.passoutyear || eduForm.passoutyear.trim() === "") {
      setErrors({ edu: "Passout year is required." });
      return;
    }
    
    setErrors((e) => ({ ...e, edu: null }));

    if (!recruiterId || !token) {
      setErrors({ edu: "Authentication required. Please login again." });
      return;
    }

    try {
      // New behavior: accept either a 24-char ObjectId, or a 4-digit year (e.g., "2024"), or a known dropdown value
      let inputVal = String(eduForm.passoutyear || "").trim();
      if (!inputVal) {
        setErrors({ edu: "Passout year is required." });
        return;
      }

      let payloadYear = null; // can be ObjectId string or a raw year string

      // If passout years are loaded, try resolving input to an _id first
      if (Array.isArray(passoutYears) && passoutYears.length > 0) {
        // Try matching by _id
        let yearObj = passoutYears.find(y => {
          if (typeof y === 'object' && y !== null) {
            return String(y._id || y.id || '') === inputVal;
          }
          return String(y) === inputVal;
        });

        // Try matching by value (e.g., "2024") if not matched by _id
        if (!yearObj) {
          yearObj = passoutYears.find(y => {
            if (typeof y === 'object' && y !== null) {
              const yValue = y.passoutyear || y.year || y.name || y.value;
              return String(yValue) === inputVal;
            }
            return String(y) === inputVal;
          });
        }

        if (yearObj && typeof yearObj === 'object') {
          if (yearObj._id || yearObj.id) {
            payloadYear = String(yearObj._id || yearObj.id);
          } else if (yearObj.passoutyear || yearObj.year) {
            payloadYear = String(yearObj.passoutyear || yearObj.year);
          }
        }
      }

      // If not resolved from dropdowns, accept either a valid ObjectId or a 4-digit year
      if (!payloadYear) {
        if (/^[0-9a-fA-F]{24}$/.test(inputVal)) {
          payloadYear = inputVal; // ObjectId
        } else if (/^\d{4}$/.test(inputVal)) {
          payloadYear = inputVal; // human readable year
        } else {
          // Allow specific textual values like 'Pursuing' as well
          if (/^[A-Za-z\s]{3,}$/.test(inputVal)) {
            payloadYear = inputVal;
          } else {
            setErrors({ edu: "Invalid passout year. Enter a 4-digit year (e.g., 2024), a valid year id, or a textual value like 'Pursuing'." });
            return;
          }
        }
      }

      const payload = {
        degree: eduForm.degree,
        institution: eduForm.institution,
        year: payloadYear,
      };
      
      console.log("Saving education year:", payloadYear, "payload:", payload);

      let savedEdu;
      if (eduEditIndex !== null && eduEditIndex >= 0 && eduEditIndex < local.education.length) {
        // Update existing education
        const existingEdu = local.education[eduEditIndex];
        const educationId = existingEdu._id || existingEdu.id;
        if (!educationId) {
          setErrors({ edu: "Education ID not found. Please refresh and try again." });
          return;
        }
        const response = await axios.put(
          RECRUITER_API.UPDATE_EDUCATION(recruiterId, educationId),
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        savedEdu = response?.data?.data || { ...payload, _id: educationId, id: educationId };
      } else {
        // Add new education
        const response = await axios.post(
          RECRUITER_API.ADD_EDUCATION(recruiterId),
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        savedEdu = response?.data?.data || { ...payload, _id: response?.data?._id, id: response?.data?._id || response?.data?.id };
      }

      // Update local state
      setLocal((s) => {
        const arr = [...s.education];
        if (eduEditIndex !== null && eduEditIndex >= 0 && eduEditIndex < arr.length) {
          arr[eduEditIndex] = normalizeEdu(savedEdu);
        } else {
            arr.unshift(normalizeEdu(savedEdu));
        }
        return { ...s, education: arr };
      });
      
        // Try to fetch refreshed profile to ensure education entries are populated
        try {
          const profileRes = await axios.get(RECRUITER_API.GET_PROFILE(recruiterId), {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null);
          if (profileRes && profileRes.data) {
            const fresh = profileRes.data.data || profileRes.data;
            if (fresh && Array.isArray(fresh.education)) {
              setLocal((s) => ({ ...s, education: fresh.education.map(normalizeEdu) }));
            }
          }
        } catch (fetchErr) {
          console.warn("Failed to fetch refreshed profile after saving education:", fetchErr);
        }
      setEduForm(emptyEdu());
      setEduEditIndex(null);
      setShowEduForm(false);
    } catch (err) {
      console.error("Error saving education:", err);
      
      // Extract error message from API response
      let errorMessage = "Failed to save education. Please try again.";
      
      if (err?.response?.data) {
        // Check for specific error messages
        errorMessage = err.response.data.message || 
                      err.response.data.error || 
                      err.response.data.errors?.year?.message ||
                      (typeof err.response.data === "string" ? err.response.data : errorMessage);
        
        // Handle "Invalid passout year" or similar validation errors
        if (errorMessage.toLowerCase().includes("invalid") || 
            errorMessage.toLowerCase().includes("passout") ||
            errorMessage.toLowerCase().includes("year")) {
          errorMessage = "Invalid passout year. Please enter a 4-digit year (e.g., 2024), a valid year id, or a textual value like 'Pursuing'.";
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setErrors({
        edu: errorMessage,
      });
    }
  }
  async function removeEdu(i) {
    if (!recruiterId || !token) {
      alert("Authentication required. Please login again.");
      return;
    }

    const eduToDelete = local.education[i];
    const educationId = eduToDelete?._id || eduToDelete?.id;

    if (!educationId) {
      // If no ID, just remove from local state (might be unsaved)
      setLocal((s) => {
        const arr = s.education.filter((_, idx) => idx !== i);
        return { ...s, education: arr };
      });
      return;
    }

    try {
      await axios.delete(RECRUITER_API.DELETE_EDUCATION(recruiterId, educationId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove from local state after successful deletion
      setLocal((s) => {
        const arr = s.education.filter((_, idx) => idx !== i);
        return { ...s, education: arr };
      });
    } catch (err) {
      console.error("Error deleting education:", err);
      alert(err?.response?.data?.message || "Failed to delete education. Please try again.");
    }
  }

  /* ---------- Save / Cancel ---------- */
  function validateBasic() {
    const errs = {};
    if (!local.name) errs.name = "Name is required.";
    if (!local.email) errs.email = "Email is required.";
    // minimal phone check
    if (local.mobile && !/^\d{7,15}$/.test(local.mobile))
      errs.mobile = "Phone should be digits (7-15).";
    return errs;
  }

  async function handleSave() {
  if (!recruiterId || !token) return;

  try {
    const formData = new FormData();

    formData.append("name", local.name);
    formData.append("email", local.email);
    formData.append("mobile", local.mobile);
    formData.append("address", local.address);
    formData.append("pin", local.pin);
    formData.append("empId", local.empId);
    formData.append("designation", local.designation);
    formData.append("company", local.company);
    formData.append("bio", local.bio);
    formData.append("workCat", local.workCat);

    // skills
    let skillsArray = [];
    if (typeof local.skillTag === 'string') {
      // Split by comma and clean up
      skillsArray = local.skillTag
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
    } else if (Array.isArray(local.skillTag)) {
      skillsArray = local.skillTag;
    }
    
    // Append skills as a JSON string or multiple form entries
    // Option 1: As JSON string (if backend expects it this way)
    formData.append("skillTag", JSON.stringify(skillsArray));

    //  IMAGE FILE (THIS FIXES EVERYTHING)
    if (local.profile_image instanceof File) {
      formData.append("profile_image", local.profile_image);
    }

    const response = await axios.put(
      RECRUITER_API.UPDATE_PROFILE(recruiterId),
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`
          // ❌ DO NOT set Content-Type
        }
      }
    );

    onSave?.(response.data.data);
    onClose?.();
  } catch (err) {
    console.error("Profile update error:", err);
  }
}
  function handleCancel() {
    if (typeof onClose === "function") onClose();
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Edit Recruiter Profile</h2>
          <nav className={styles.nav}>
            <button type="button"
              className={tab === "basic" ? styles.activeTab : ""}
              onClick={() => setTab("basic")}
            >
              Basic
            </button>
            <button type="button"
              className={tab === "experience" ? styles.activeTab : ""}
              onClick={() => setTab("experience")}
            >
              Experience
            </button>
            <button type="button"
              className={tab === "education" ? styles.activeTab : ""}
              onClick={() => setTab("education")}
            >
              Education
            </button>
          </nav>
        </header>

        <div className={styles.body}>
          <aside className={styles.side}>
            <div className={styles.avatarWrap}>
              <img
                src={imagePreview || DEFAULT_AVATAR}
                alt="avatar"
                className={styles.avatar}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
              <div className={styles.avatarActions}>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => fileRef.current && fileRef.current.click()}
                >
                  Change
                </button>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => {
                    setImagePreview(DEFAULT_AVATAR);
                    setLocal((s) => ({ ...s, profile_image: null }));
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
            <div className={styles.quickInfo}>
              <div>
                <strong>Employee ID</strong>
                <div className={styles.qval}>{local.empId}</div>
              </div>
              <div>
                <strong>Category</strong>
                <div className={styles.qval}>{
                  typeof local.workCat === "object" && local.workCat !== null
                    ? (local.workCat.cat_name || local.workCat.name || "")
                    : (local.workCat || "")
                }</div>
              </div>
              <div>
                <strong>Designation</strong>
                <div className={styles.qval}>{local.designation}</div>
              </div>
            </div>
          </aside>

          <main className={styles.content}>
            {errors.general && (
              <div style={{ padding: "10px", margin: "10px", background: "#fee", color: "#c00", borderRadius: "4px" }}>
                {errors.general}
              </div>
            )}
            {/* BASIC */}
            {tab === "basic" && (
              <section className={styles.section}>
                <h3>Basic</h3>
                <div className={styles.grid}>
                  <label>
                    Name
                    <input
                      name="name"
                      value={local.name}
                      onChange={handleBasicChange}
                    />
                    {errors.name && (
                      <small className={styles.err}>{errors.name}</small>
                    )}
                  </label>

                  <label>
                    Email
                    <input
                      name="email"
                      value={local.email}
                      onChange={handleBasicChange}
                    />
                    {errors.email && (
                      <small className={styles.err}>{errors.email}</small>
                    )}
                  </label>

                  <label>
                    Phone
                    <input
                      name="mobile"
                      value={local.mobile}
                      onChange={handleBasicChange}
                    />
                    {errors.mobile && (
                      <small className={styles.err}>{errors.mobile}</small>
                    )}
                  </label>

                  <label>
                    Address
                    <input
                      name="address"
                      value={local.address}
                      onChange={handleBasicChange}
                    />
                  </label>

                  <label>
                    Pin Code
                    <input
                      name="pin"
                      value={local.pin}
                      onChange={handleBasicChange}
                    />
                  </label>

                  <label>
                    Employee ID
                    <input
                      name="empId"
                      value={local.empId}
                      onChange={handleBasicChange}
                    />
                  </label>

                  <label>
                    Company
                    <input
                      name="company"
                      value={local.company}
                      onChange={handleBasicChange}
                    />
                  </label>

                  <label>
                    Work Category
                    <input
                      name="workCat"
                      value={
                        typeof local.workCat === "object" && local.workCat !== null
                          ? (local.workCat.cat_name || local.workCat.name || "")
                          : (local.workCat || "")
                      }
                      onChange={(e) => {
                        // When user types, store as string
                        setLocal((s) => ({ ...s, workCat: e.target.value }));
                      }}
                      readOnly
                      style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                      title="Work category cannot be changed here"
                    />
                  </label>

                  <label>
                    Designation
                    <input
                      name="designation"
                      value={local.designation}
                      onChange={handleBasicChange}
                    />
                  </label>

                  <label className={styles.fullWidth}>
                    Skills (comma separated)
                    <input
                      name="skillTag"
                      value={Array.isArray(local.skillTag) ? local.skillTag.join(", ") : local.skillTag}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLocal((s) => ({ ...s, skillTag: value }));
                      }}
                    />
                  </label>

                  <label className={styles.fullWidth}>
                    Bio
                    <textarea
                      name="bio"
                      value={local.bio}
                      onChange={handleBasicChange}
                      rows={4}
                    />
                  </label>
                </div>
              </section>
            )}

            {/* EXPERIENCE */}
            {tab === "experience" && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>Experience</h3>
                  <div>
                    <button type="button"
                      className={styles.smallPrimary}
                      onClick={startAddExp}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className={styles.list}>
                  {local.experience.length === 0 && (
                    <p className={styles.empty}>No experience added yet.</p>
                  )}
                  {local.experience.map((e, idx) => (
                    <div key={e.id} className={styles.listItem}>
                      <div>
                        <div className={styles.itemTitle}>
                          {e.role || "(no role)"}
                        </div>
                        <div className={styles.itemMeta}>
                          {e.company} • {e.startMonth} {e.startYear} —{" "}
                          {e.present ? "Present" : `${e.endMonth} ${e.endYear}`}
                        </div>
                        {e.description && (
                          <div className={styles.itemDesc}>{e.description}</div>
                        )}
                      </div>
                      
                      <div className={styles.itemActions}>
                        <button type="button"
                          onClick={() => editExp(idx)}
                          className={styles.iconBtn}
                        >
                          Edit
                        </button>
                        <button type="button"
                          onClick={() => removeExp(idx)}
                          className={styles.iconBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {showExpForm && (
                  <div
                    className={styles.overlayBackdrop}
                    onMouseDown={() => {
                      setShowExpForm(false);
                      setExpEditIndex(null);
                      setExpForm(emptyExp());
                      setErrors((e) => ({ ...e, exp: null }));
                    }}
                  >
                    <div
                      className={styles.overlayPanel}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className={styles.cardHeaderRow}>
                        <h4>
                          {expEditIndex === null
                            ? "Add experience"
                            : "Edit experience"}
                        </h4>
                        <button type="button"
                          className={styles.closeBtn}
                          onClick={() => {
                            setShowExpForm(false);
                            setExpEditIndex(null);
                            setExpForm(emptyExp());
                            setErrors((e) => ({ ...e, exp: null }));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      {errors.exp && (
                        <small className={styles.err}>{errors.exp}</small>
                      )}
                      <div className={styles.formRow}>
                        <label>
                          Role
                          <input
                            name="role"
                            value={expForm.role}
                            onChange={handleExpInput}
                          />
                        </label>
                        <label>
                          Company
                          <input
                            name="company"
                            value={expForm.company}
                            onChange={handleExpInput}
                          />
                        </label>
                      </div>
                      <div className={styles.formRow}>
                        <label>
                          Start Month
                          <input
                            name="startMonth"
                            placeholder="e.g., Feb"
                            value={expForm.startMonth}
                            onChange={handleExpInput}
                          />
                        </label>

                        <label>
                          Start Year
                          <input
                            name="startYear"
                            placeholder="e.g., 2025"
                            value={expForm.startYear}
                            onChange={handleExpInput}
                          />
                        </label>
                      </div>
                      <div>
                        <div className={styles.formRow}>
                          <label>
                            End Month
                            <input
                              name="endMonth"
                              placeholder="e.g., Feb"
                              value={expForm.endMonth}
                              onChange={handleExpInput}
                              disabled={expForm.present}
                            />
                          </label>

                        <label>
                          End Year
                          <input
                            name="endYear"
                            placeholder="e.g., 2025"
                            value={expForm.endYear}
                            onChange={handleExpInput}
                            disabled={expForm.present}
                          />
                        </label>
                        </div>

                        <div className={styles.checkboxformRow}>
                          {/* Checkbox wrapped with label (keeps same behaviour) */}
                          <label className={styles.checkboxInline}>
                            <input
                              id="exp-present"
                              className={styles.checkboxInput}
                              type="checkbox"
                              name="present"
                              checked={expForm.present}
                              onChange={handleExpInput}
                            />
                            <span className={styles.checkboxLabelText}>
                              Present
                            </span>
                          </label>
                        </div>
                      </div>
                      <br></br>
                      <div className={styles.formGroup}>
                        <label>
                          Description
                          <textarea
                            name="description"
                            value={expForm.description}
                            onChange={handleExpInput}
                            rows={3}
                          />
                        </label>
                      </div>
                      <div className={styles.cardActions}>
                        <button type="button"
                          onClick={() => {
                            setExpForm(emptyExp());
                            setExpEditIndex(null);
                            setShowExpForm(false);
                            setErrors((e) => ({ ...e, exp: null }));
                          }}
                          className={styles.secondary}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveExp(); }}
                          className={styles.primary}
                        >
                          {expEditIndex === null ? "Add Experience" : "Update"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* EDUCATION */}
            {tab === "education" && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>Education</h3>
                  <div>
                    <button type="button"
                      className={styles.smallPrimary}
                      onClick={startAddEdu}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className={styles.list}>
                  {local.education.length === 0 && (
                    <p className={styles.empty}>
                      No education records added yet.
                    </p>
                  )}
                  {local.education.map((ed, idx) => (
                    <div key={ed.id} className={styles.listItem}>
                      <div>
                        <div className={styles.itemTitle}>
                          {ed.degree || "(no degree)"}
                        </div>
                        <div className={styles.itemMeta}>
                          {ed.institution} • {(() => {
                            const yearVal = ed.passoutyear;
                            if (!yearVal) return "";
                            // If it's an object, extract the actual year value
                            if (typeof yearVal === "object" && yearVal !== null) {
                              return yearVal.passoutyear || yearVal.year || yearVal.name || yearVal.value || "";
                            }
                            // If it's a string/number, check if it's an ID and try to find the label
                            if (typeof yearVal === "string" && passoutYears.length > 0) {
                              const yearObj = passoutYears.find(y => {
                                if (typeof y === "object" && y !== null) {
                                  return String(y._id || y.id) === yearVal;
                                }
                                return String(y) === yearVal;
                              });
                              if (yearObj && typeof yearObj === "object") {
                                return yearObj.passoutyear || yearObj.year || yearObj.name || yearObj.value || yearVal;
                              }
                            }
                            return String(yearVal);
                          })()}
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        <button type="button"
                          onClick={() => editEdu(idx)}
                          className={styles.iconBtn}
                        >
                          Edit
                        </button>
                        <button type="button"
                          onClick={() => removeEdu(idx)}
                          className={styles.iconBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {showEduForm && (
                  <div
                    className={styles.overlayBackdrop}
                    onMouseDown={() => {
                      setShowEduForm(false);
                      setEduEditIndex(null);
                      setEduForm(emptyEdu());
                      setErrors((e) => ({ ...e, edu: null }));
                    }}
                  >
                    <div
                      className={styles.overlayPanel}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className={styles.cardHeaderRow}>
                        <h4>
                          {eduEditIndex === null
                            ? "Add education"
                            : "Edit education"}
                        </h4>
                        <button type="button"
                          className={styles.closeBtn}
                          onClick={() => {
                            setShowEduForm(false);
                            setEduEditIndex(null);
                            setEduForm(emptyEdu());
                            setErrors((e) => ({ ...e, edu: null }));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      {errors.edu && (
                        <small className={styles.err}>{errors.edu}</small>
                      )}
                      <div className={styles.formRow}>
                        <label>
                          Degree
                          <input
                            name="degree"
                            value={eduForm.degree}
                            onChange={handleEduInput}
                          />
                        </label>
                        <label>
                          Institution
                          <input
                            name="institution"
                            value={eduForm.institution}
                            onChange={handleEduInput}
                          />
                        </label>
                      </div>
                      <div className={styles.formRow}>
                        <label>
                          Passout Year
                          <input
                            name="passoutyear"
                            placeholder="e.g., 2025"
                            value={eduForm.passoutyear}
                            onChange={handleEduInput}
                          />
                        </label>
                      </div>

                      <div className={styles.cardActions}>
                        <button type="button"
                          onClick={() => {
                            setEduForm(emptyEdu());
                            setEduEditIndex(null);
                            setShowEduForm(false);
                            setErrors((e) => ({ ...e, edu: null }));
                          }}
                          className={styles.secondary}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            saveEdu();
                          }}
                          className={styles.primary}
                        >
                          {eduEditIndex === null ? "Add Education" : "Update"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </main>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <small>Tip: Fill basic information before saving.</small>
          </div>
          <div className={styles.footerRight}>
            <button type="button" className={styles.secondary} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancel(); }}>
              Close
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
            >
              Save All
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
