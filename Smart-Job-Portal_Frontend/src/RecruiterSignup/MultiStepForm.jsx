import React, { useState } from "react";
import BasicDetails from "./BasicDetails";
import CompanyDetails from "./CompanyDetails";
import styles from "./form.module.css";
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";

export default function MultiStepForm() {
  const steps = ["Basic Details", "Company Details"];
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    empId: "",
    profile_image: null,
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    company: "",
    workCat: "",
    designation: "",
    mobile: "",
    pin: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    const newVal = type === "file" ? files[0] : value;
    setFormData((prev) => ({ ...prev, [name]: newVal }));
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = () => {
    console.log(" All Steps Completed!");
  };

  return (
    <>
      <Login_Signup_Navbar />

      <div className={styles["page-bg"]}>
        <div className={styles["form-container"]}>
          <div className={styles["progress-bar"]}>
            {steps.map((label, idx) => {
              const index = idx + 1;
              const className =
                step > index
                  ? styles["done"]
                  : step === index
                  ? styles["active"]
                  : "";

              return (
                <span key={label} className={className}>
                  {label}
                </span>
              );
            })}
          </div>

          {step === 1 && (
            <BasicDetails
              formData={formData}
              handleChange={handleChange}
              nextStep={nextStep}
            />
          )}

          {step === 2 && (
            <CompanyDetails
              formData={formData}
              handleChange={handleChange}
              prevStep={prevStep}
              handleSubmit={handleSubmit}
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
