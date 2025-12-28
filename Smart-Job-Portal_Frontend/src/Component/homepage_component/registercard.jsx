import styles from "./registercard.module.css";

const RegisterCards = () => {
  return (
    <div className={styles["register-section"]}>
      <div className={styles["register-card"]}>
        <div className={styles["register-content"]}>
          <h2>Become a Candidate 👩‍💻</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras cursus
            a dolor convallis efficitur.
          </p>
          <button className={styles["register-btn"]}>
            Register Now <span>→</span>
          </button>
        </div>

        <div className={styles["register-img"]}>
          <img src="./Assets/candidate.svg" alt="candidate img" />
        </div>
      </div>

      <div className={styles["register-card"]}>
        <div className={styles["register-content"]}>
          <h2>Become a Recruiter 👨‍💼</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras cursus
            a dolor convallis efficitur.
          </p>
          <button className={`${styles["register-btn"]} ${styles.green}`}>
            Register Now <span>→</span>
          </button>
        </div>

        <div className={styles["register-img"]}>
          <img src="./Assets/recruiter.svg" alt="candidate img" />
        </div>
      </div>
    </div>
  );
};

export default RegisterCards;
