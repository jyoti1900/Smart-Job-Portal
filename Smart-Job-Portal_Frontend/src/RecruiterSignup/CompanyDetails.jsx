import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PortalSelect from "./PortalSelect";

export default function CompanyDetails({
  formData,
  handleChange,
  prevStep,
  handleSubmit
}) {
  const formRef = useRef();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  /* ================= FETCH WORK CATEGORIES ================= */
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const res = await axios.get(
          "http://localhost:8080/api/v1/customer/job-category-dropdown"
        );

        if (Array.isArray(res.data?.data)) {
          setCategories(res.data.data);
        } else {
          setErrorMsg("Invalid response from server.");
        }
      } catch (err) {
        console.error("Category fetch error:", err);
        setErrorMsg("Failed to load work categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  /* ================= FINAL SUBMIT ================= */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      const res = await axios.post(
        "http://localhost:8080/api/v1/recruiter/recruiter_signup",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setSuccessMsg(
        "Registration successful! Redirecting to recruiter login…"
      );

      // optional parent handler
      handleSubmit && handleSubmit();

      setTimeout(() => {
        navigate("/recruiterlogin");
      }, 1500);
    } catch (err) {
      console.error("❌ Submission Error:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Something went wrong during registration."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form-box" ref={formRef} onSubmit={handleFormSubmit}>
      <h2>Company Details</h2>
      <p className="company-desc">
        Please provide your company information for verification.
      </p>

      {/* ✅ SUCCESS / ERROR MESSAGE */}
      {successMsg && <p className="success-msg">{successMsg}</p>}
      {errorMsg && <p className="error-msg">{errorMsg}</p>}

      <label className="field-label">Company</label>
      <input
        type="text"
        name="company"
        placeholder="Enter company name"
        value={formData.company}
        onChange={handleChange}
        required
      />

      <label className="field-label">Work Category</label>
      <PortalSelect
        name="workCat"
        value={formData.workCat}
        onChange={handleChange}
        options={categories.map((cat) => ({
          id: cat._id,
          name: cat.cat_name
        }))}
        placeholder={
          loading
            ? "Loading categories..."
            : errorMsg
            ? errorMsg
            : "Select work category"
        }
      />

      <label className="field-label">Designation</label>
      <input
        type="text"
        name="designation"
        placeholder="Enter your designation"
        value={formData.designation}
        onChange={handleChange}
        pattern="[A-Za-z0-9\s.,&()\-]+"
        required
      />

      <label className="field-label">Phone Number</label>
      <input
        type="text"
        name="mobile"
        placeholder="Enter phone number"
        value={formData.mobile}
        onChange={handleChange}
        pattern="[0-9]{10}"
        title="Phone number must be exactly 10 digits"
        required
      />

      <label className="field-label">Pin Code</label>
      <input
        type="text"
        name="pin"
        placeholder="Enter pin code"
        value={formData.pin}
        onChange={handleChange}
        pattern="[0-9]{6}"
        title="Pincode must be exactly 6 digits"
        required
      />

      <label className="field-label">Address</label>
      <textarea
        name="address"
        placeholder="Enter company address"
        value={formData.address}
        onChange={handleChange}
        required
      />

      <div className="btn-group">
        <button type="button" className="back-btn" onClick={prevStep}>
          Back
        </button>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
