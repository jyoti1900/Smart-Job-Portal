# 🚀 Smart Job Portal – Kaajkhojo

A **full-stack Smart Job Portal web application** built using the **MERN stack**, designed to connect **job seekers** and **recruiters** with modern hiring features such as **real-time chat**, **video interviews**, and **role-based dashboards**.

---

## 📌 Project Motivation

Traditional job portals lack real-time communication, transparency, and smart filtering.  
**Kaajkhojo** aims to simplify and modernize recruitment by enabling:

- Faster candidate–recruiter interaction  
- Secure authentication and role-based access  
- Real-time chat and video interviews  
- Centralized job and application management  

---

## 🎯 Objectives

- Provide a **single platform** for job seekers and recruiters  
- Enable **real-time communication** using modern web technologies  
- Ensure **secure, scalable, and responsive** system architecture  
- Improve hiring efficiency and user experience  

---

## 🧩 Key Features

### 👤 Job Seeker
- User registration & login
- Profile management (education, skills, experience)
- Browse & apply for jobs
- Resume upload
- Real-time chat with recruiters
- Video interview support

### 🏢 Recruiter
- Recruiter registration & login
- Company profile management
- Post, update & delete job listings
- View applicants
- Chat & video interview with candidates

### 🛠 Admin
- Manage users & recruiters
- Monitor job posts and applications
- Platform moderation

---

## 💬 Real-Time Communication

- **Live Chat** using Socket.IO  
- **Video Calling** using WebRTC  
- Secure peer-to-peer communication  
- Chat enabled only after job application approval  

---

## 🏗️ System Architecture

- **Frontend:** React.js  
- **Backend:** Node.js + Express.js  
- **Database:** MongoDB (Mongoose ODM)  
- **Authentication:** JWT (JSON Web Token)  
- **Real-Time:** Socket.IO & WebRTC  

---

## 🛠️ Technology Stack

| Technology | Purpose |
|----------|--------|
| React.js | Frontend UI |
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MongoDB | NoSQL Database |
| Mongoose | ODM |
| JWT | Authentication |
| Socket.IO | Real-time chat |
| WebRTC | Video calling |
| Multer | File uploads |
| Git & GitHub | Version control |

---

## 📂 Project Structure
```bash
Smart-Job-Portal/
│
├── backend/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ └── server.js
│
├── frontend/
│ ├── src/
│ ├── components/
│ ├── pages/
│ └── App.js
│
├── .env
├── package.json
└── README.md
```

---

## 🔐 Authentication & Security

- JWT-based authentication
- Role-based authorization (Admin / Recruiter / Job Seeker)
- Protected API routes
- Secure password hashing

---

## 📊 Experimental Results

- Improved hiring response time through real-time chat
- Reduced dependency on external meeting platforms
- Better candidate engagement and recruiter efficiency
- Scalable and maintainable architecture

---

## 🚧 Challenges Faced

- Implementing WebRTC video calling  
- Managing real-time socket connections  
- Role-based route protection  
- Handling large file uploads securely  
- Syncing chat with job applications  

---

## 🧪 Future Enhancements

- AI-based job recommendations
- Resume parsing using AI
- Email & push notifications
- Analytics dashboard
- Mobile application (React Native)

---

## ▶️ Installation & Setup

### Prerequisites
- Node.js
- MongoDB
- Git
  
### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
npm install
npm start
```

## 📜 Conclusion
Kaajkhojo – Smart Job Portal provides a modern, secure, and efficient recruitment solution by integrating real-time communication, video interviews, and smart job management into a single platform.

## 👨‍💻 Developed By
- Jyotipriya Das
- Sayan Pal
- Indrajit Sahu
- Hasanoor Zaman
