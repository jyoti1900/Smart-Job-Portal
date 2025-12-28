import React, { useRef } from "react";
import { Link } from "react-router-dom";

export default function BasicDetails({ formData, handleChange, nextStep }) {
    const formRef = useRef();
    const confirmPasswordRef = useRef();

    const handleSubmit = (e) => {
        e.preventDefault();

        // Password validation
        if (formData.password !== formData.confirmPassword) {
            confirmPasswordRef.current.setCustomValidity("Passwords do not match");
            confirmPasswordRef.current.reportValidity();
            return;
        } else {
            confirmPasswordRef.current.setCustomValidity("");
        }

        if (formRef.current.checkValidity()) {
            nextStep();
        } else {
            formRef.current.reportValidity();
        }
    };

    const handleConfirmPasswordChange = (e) => {
        handleChange(e);
        if (formData.password === e.target.value) {
            confirmPasswordRef.current.setCustomValidity("");
        }
    };

    return (
        <form className="form-box" ref={formRef} onSubmit={handleSubmit}>
            <h2>Basic Details</h2>

            <label className="field-label">Full name</label>
            <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
            />

            <label className="field-label">Employee ID</label>
            <input
                type="text"
                name="empId"
                placeholder="Enter Employee ID"
                value={formData.empId}
                onChange={handleChange}
                required
            />

            <label className="field-label">Profile Image</label>
            <input
                type="file"
                name="profile_image"
                accept="image/*"
                onChange={handleChange}
                required
            />

            <label className="field-label">Email</label>
            <input
                type="email"
                name="email"
                placeholder="Enter Email ID"
                value={formData.email}
                onChange={handleChange}
                required
            />

            <label className="field-label">Password</label>
            <input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                pattern="(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
                title="Password must be at least 8 characters long and include letters, numbers, and symbols."
                required
            />

            <label className="field-label">Confirm Password</label>
            <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                ref={confirmPasswordRef}
                required
            />

            <label className="field-label">Bio</label>
            <textarea
                name="bio"
                placeholder="Enter Bio"
                value={formData.bio}
                onChange={handleChange}
            />

            <div className="btn-group">
                <button type="submit" className="next-btn">
                    Next
                </button>
            </div>
            <br/>
            <p className="login-text">
                Already have an account? <Link to="/recruiterlogin">Log in</Link>
            </p>
        </form>
    );
}
