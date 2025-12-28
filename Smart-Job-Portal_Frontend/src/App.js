import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./LoginSignup/Login";
import Signup from "./LoginSignup/Signup";
import ForgotPassword from "./LoginSignup/Forgotpassword";
import TermsOfUse from "./LoginSignup/Termsofuse";
import PrivatePolicy from "./LoginSignup/Privacypolicy";
import ResetPassword from "./LoginSignup/Resetpassword";
import Recruiterlogin from "./RecuriterLogin/Login-Recruiter";
import Homepage from "./Homepage/homepage";
import Pagenotfound from "./LoginSignup/Pagenotfound";
import ProtectedRoute from "./LoginSignup/Protectedroute";
import PublicRoute from "./LoginSignup/Publicroute";
import Admin_Dashboard from "./Admin/Admin_Dashboard";
import JobsPage from "./Admin/job/JobsPage";
import UsersPage from "./Admin/Users/UsersPage";
import UserProfile from "./UserProfile/UserProfile";
import RecruiterPage from "./Admin/Recruiters/RecruiterPage";
import ApplicantPage from "./Admin/Applicant/ApplicantPage";
import RecruiterSignup from "./RecruiterSignup/MultiStepForm";
import Login_Signup_Navbar from "./Component/Login_Signup_Navbar";
import Recruiter_ForgotPassword from "./RecuriterLogin/Recruiter_ForgotPassword";
import Footer from "./Component/Footer";
import ChooseRoleLogin from "./Homepage/ChooseRole_Login";
import ChooseRoleSignup from "./Homepage/ChooseRole_Signup";
import AllJobs from "./Alljobs/Alljobs";
import DetailJobs from "./DetailJobs/DetailJobs";
import UserNavbar from "./Component/User_Navbar";
import AboutUs from "./LoginSignup/aboutus";
import ContactUs from "./LoginSignup/contactus";
import FooterUser from "./Component/User_Footer";
import Userchat from "./UserProfile/userChat";
import VideoCallUser from "./UserProfile/userVideoCall";
import Dashboard from "./Recruiter/RecruiterDashboard/recruiter_dashboard";
import Jobpost from "./Recruiter/RecruiterDashboard/postjob";
import Editjob from "./Recruiter/RecruiterDashboard/editjob";
import Viewpostedjob from "./Recruiter/RecruiterDashboard/viewpostedjob";
import Applictions from "./Recruiter/RecruiterDashboard/RecruiterApplications";
import Viewapplication from "./Recruiter/RecruiterDashboard/viewapplication";
import Chat from "./Recruiter/RecruiterDashboard/chat";
import Videocall from "./Recruiter/RecruiterDashboard/videocall";
import RecruiterProfile from "./Recruiter/RecruiterProfile/RecruiterProfile";

export default function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>

        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/privacypolicy" element={<PrivatePolicy />} />
          <Route path="/termsofuse" element={<TermsOfUse />} />
          <Route path="/recruitersignup" element={<RecruiterSignup />} />
          <Route path="/recruiterlogin" element={<Recruiterlogin />} />
          <Route path="/recruiterforgotpassword" element={<Recruiter_ForgotPassword />} /> {/* fixed typo */}
          <Route path="/chooserolelogin" element={<ChooseRoleLogin />} />
          <Route path="/chooserolesignup" element={<ChooseRoleSignup />} />
          <Route path="/usernavbar" element={<UserNavbar />} />
          <Route path="/loginsignupnavbar" element={<Login_Signup_Navbar />} />
          <Route path="/footer" element={<Footer />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/contactus" element={<ContactUs />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>

        {/* Admin Section */}
          <Route path="/admin/dashboard" element={<Admin_Dashboard />} />
          <Route path="/admin/jobs" element={<JobsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/recruiters" element={<RecruiterPage />} />
          <Route path="/admin/applicant" element={<ApplicantPage />} />

          {/*User Setion */}
          <Route path="/userprofile" element={<UserProfile />} />
          <Route path="/chat" element={<Userchat />} />
          <Route path="/videocall" element={<VideoCallUser />} />
          <Route path="/alljobs" element={<AllJobs />} />
          <Route path="/detailjobs/:id" element={<DetailJobs />} />
          <Route path="/useraboutus" element={<AboutUs />} />
          <Route path="/usercontactus" element={<ContactUs />} />
          <Route path="/userprivacypolicy" element={<PrivatePolicy />} />
          <Route path="/usertermsofuse" element={<TermsOfUse />} />
          <Route path="/userfooter" element={<FooterUser />} />

          <Route path="/recruiterjobpost" element={<Jobpost />} />
          <Route path="/recruiterdashboard" element={<Dashboard />} />
          <Route path="/editjob/:jobId" element={<Editjob />} />
          <Route path="/viewpostedjob/:jobId" element={<Viewpostedjob />} />
          <Route path="/recruiterapplication" element={<Applictions />} />
          <Route path="/postajob" element={<Jobpost />} />
          <Route path="/viewapplication" element={<Viewapplication />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/videocall" element={<Videocall />} />
          <Route path="/recruiter/profile" element={<RecruiterProfile />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Pagenotfound />} />

      </Routes>
    </BrowserRouter>
  );
}