// import { Navigate, Outlet } from "react-router-dom";

// function RecruiterProtectedRoute() {
//   // Support both auth token keys used in the app
//   const token = localStorage.getItem("authToken") || localStorage.getItem("token");
//   const userType = localStorage.getItem("user_type"); // "job_provider"

//   // ❌ Not logged in → block and ensure any recruiter-related state is cleared
//   if (!token) {
//     localStorage.removeItem("userId");
//     localStorage.removeItem("recruiterId");
//     localStorage.removeItem("user_type");
//     return <Navigate to="/" replace />;
//   }

//   // ❌ Logged in but NOT recruiter → block
//   if (userType !== "job_provider") {
//     return <Navigate to="/" replace />;
//   }

//   // ✅ Recruiter allowed
//   return <Outlet />;
// }

// export default RecruiterProtectedRoute;
