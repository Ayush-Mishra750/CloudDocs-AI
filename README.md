# ☁️ CloudDocs — storemystuff.cloud

A full-stack, enterprise-grade cloud storage application that allows users to upload, manage, and share their files securely. It includes a subscription-based storage system powered by Razorpay, enabling users to upgrade their storage plans smoothly.

The client is built with **React**, **Vite**, and **TailwindCSS**, while the server uses **Node.js**, **Express**, **MongoDB**, and **Redis**. The application stores files using **AWS S3** and also supports **Google Drive Import** for seamless file transfers.

---

## 📑 Table of Contents
- [Features](#-features)
  - [Authentication and Security](#authentication-and-security)
  - [File Management](#file-management)
  - [Cloud Storage and Import](#cloud-storage-and-import)
  - [Sharing and Permissions](#sharing-and-permissions)
  - [Settings and Customization](#settings-and-customization)
  - [Admin Dashboard](#admin-dashboard)
  - [Subscriptions and Billing](#subscriptions-and-billing)
- [Project Structure](#-project-structure)
  - [Frontend (React + Vite + Tailwind)](#frontend---react--vite--tailwind)
  - [Backend (Node + Express + MongoDB + Redis)](#backend---node--express--mongodb--redis)
- [Screenshot Overview](#-screenshot-overview)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Clone Repository](#1-clone-repository)
  - [Environment Setup](#2-environment-setup)
  - [Frontend Setup (Client)](#3-frontend-setup-client)
  - [Backend Setup (Server)](#4-backend-setup-server)
  - [Running via Docker Compose (Recommended)](#5-running-via-docker-compose-recommended)
- [Additional Setup Requirements](#-additional-setup-requirements)

---

## ✨ Features

### Authentication and Security
- **User Registration & Login**: Email and password authentication with validation.
- **OAuth 2.0 Integration**: One-click social authentication via Google & GitHub OAuth.
- **OTP Verification**: Secure 6-digit OTP verification powered by Resend API for account setup and identity verification.
- **Password Security**: Hashed passwords using `bcrypt` for secure storage.
- **Cookie Security**: Secure, signed HTTP-only JWT cookies to defend against XSS attacks.
- **API Guarding & Sanitization**: CORS configuration, Helmet security headers, rate limiting, and input sanitization.

### File Management
- **Universal File Upload**: Upload PDF, images, videos, documents, and zip archives with real-time upload progress tracking.
- **Grid & List Views**: Dynamic layout toggle for comfortable navigation.
- **File Metadata & Details**: View precise file sizes, MIME types, creation dates, and last modified timestamps.
- **Search & Filtering**: Instant client-side and server-side search by file name, category, or extension.
- **File Operations**: Rename files, soft-delete to Trash Bin, restore, and permanently purge items.
- **Quota Tracking**: Real-time visual progress bar tracking storage usage vs allocated plan quota.

### Cloud Storage and Import
- **AWS S3 Integration**: High-scalability file storage using AWS S3 with presigned upload/download URLs.
- **CloudFront CDN**: Fast worldwide file delivery and optimized CDN streaming.
- **Google Drive Import**: Directly import files from Google Drive to your cloud storage vault.
- **Batch Import**: Select and import multiple files simultaneously with background progress tracking.
- **Automatic Metadata Preservation**: Preserves original filenames, file types, and file structure during import.

### Sharing and Permissions
- **Flexible File Sharing**: Share files securely via user email (Registered Users) or shareable direct link (Guest Users).
- **Role-Based Permissions**: Granular view-only or editing access rights for shared files.
- **Share Management Dashboard**: Centralized view for "Shared by Me" and "Shared with Me" assets.
- **Activity & Access Logs**: Real-time permission tracking and access monitoring.

### Settings and Customization
- **Profile Management**: Update user profile information (Name, Email, Profile Avatar).
- **Storage Statistics**: Detailed visual breakdown of used vs remaining cloud storage capacity.
- **Security Settings**: Change account password and manage active sessions.
- **Account Actions**: Options to logout, temporarily disable, or permanently delete accounts.

### Admin Dashboard
- **System Overview**: High-level telemetry tracking total, active, online, and soft-deleted user accounts.
- **User Control Panel**: Filter, edit user roles, revoke sessions, adjust storage quotas, and manage users.
- **Soft & Hard Deletion**: Two-tiered deletion workflow with soft-delete recovery and permanent purge options.
- **Role Management**: Hierarchical role badges (User, Manager, Admin, SuperAdmin).
- **Directory Inspection**: View and navigate directories across any registered user's storage.

### Subscriptions and Billing
- **Subscription Plans**: Tiered monthly and annual storage subscription plans.
- **Razorpay Payment Gateway**: Seamless checkout experience using Razorpay SDK.
- **Instant Plan Upgrades**: Automated usage limit updates upon payment verification.
- **Webhook Verification**: Webhook listeners for automated payment status sync and subscription lifecycle management.
- **Billing History**: Access past transaction invoices and renewal dates inside the dashboard.

---

## 📁 Project Structure

```
CloudDocs-AI/
├── docker-compose.yml           # Multi-container orchestration (Backend, Frontend, Mongo, Redis)
├── README.md                    # Project documentation
├── .env.example                 # Root environment variables template
│
├── frontend/                    # Frontend (React + Vite + Tailwind CSS)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── src/
│       ├── App.jsx              # Root application component
│       ├── main.jsx             # Entry point
│       ├── api/                 # Axios client and API handler modules
│       │   ├── adminApi.js
│       │   ├── authApi.js
│       │   ├── axios.js
│       │   ├── fileApi.js
│       │   ├── shareApi.js
│       │   └── userApi.js
│       ├── context/             # Global React Context providers
│       │   └── AuthContext.jsx  # Authentication state & session manager
│       ├── pages/               # Page views (Dashboard, Admin, Settings, Share, Subscriptions)
│       ├── routes/              # Route protection layout components
│       │   ├── GuestRoute.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── AdminRoute.jsx
│       │   └── AppRoutes.jsx
│       ├── components/          # Reusable UI components (Modals, Forms, Shimmer)
│       └── index.css            # Global CSS, Tailwind directives, Glassmorphism styles
│
└── backend/                     # Server (Node.js + Express + MongoDB + Redis)
    ├── package.json
    ├── Dockerfile
    └── src/
        ├── app.js               # Express application initialization & middleware
        ├── server.js            # Server entrypoint listener
        ├── config/              # Infrastructure configurations (MongoDB, Redis, S3)
        ├── controllers/         # Request handlers (Auth, File, Dir, Admin, Subscription)
        ├── middlewares/         # Auth verification, role authorization, error handling
        ├── models/              # Mongoose schemas (User, Directory, File, OTP, Plan)
        ├── routes/              # Express API router definitions
        ├── services/            # Core business logic handlers
        ├── utils/               # Helper utilities (Tokens, Winston Logger, S3 client)
        └── validators/          # Request payload validators
```

---

## 🖼️ Screenshot Overview

- **Login & Register**: Standard Email/Password login, Google OAuth, and Resend OTP verification.
- **HomePage / Dashboard**: File grid & list view, storage quota bar, upload modal, search & filter bar.
- **Settings**: Profile update, storage usage breakdown, password update, and session controls.
- **Share**: Public link generator, email-based sharing modal, permission toggle, and shared files dashboard.
- **Admin Dashboard**: System telemetry, user management table, user inspection modal, soft/hard deletion.
- **Import from Drive**: Google Drive file selection picker and automated import status tracking.
- **Subscriptions (Razorpay)**: Plan selector modal, Razorpay payment popup, active plan status, invoice links.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, React Router v6, Lucide React, React Hot Toast
- **Backend**: Node.js, Express.js (ES Modules)
- **Databases**: MongoDB (Mongoose ODM), Redis (Caching & Sessions)
- **Cloud Storage & CDN**: AWS S3, AWS CloudFront
- **External APIs**: Google Drive API, Google OAuth 2.0, GitHub OAuth, Resend API
- **Authentication**: JWT (Signed HTTP-only Cookies), Bcrypt, Resend OTP
- **Payment Gateway**: Razorpay Subscriptions & Webhooks
- **Containerization**: Docker, Docker Compose

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/Ayush-Mishra750/CloudDocs-AI.git
cd CloudDocs-AI
```

---

### 2. Environment Setup

#### Client `.env` (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

#### Server `.env` (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database & Redis
MONGO_URI=mongodb://localhost:27017/clouddocs
REDIS_URL=redis://localhost:6379

# Authentication & JWT
JWT_SECRET=your_jwt_secret_key
COOKIE_SECRET=your_cookie_secret

# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Resend API Key (for Email OTP)
RESEND_API_KEY=re_123456789

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name

# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxx
```

---

### 3. Frontend Setup (Client)

Navigate to the frontend folder and start the dev server:
```bash
cd frontend
npm install
npm run dev
```
The client app will be accessible at: **`http://localhost:5173`**

---

### 4. Backend Setup (Server)

Navigate to the backend folder and start the server:
```bash
cd backend
npm install
npm run dev
```
The REST API server will be active at: **`http://localhost:5000/api/v1`**

---

### 5. Running via Docker Compose (Recommended)

To run the full stack (Frontend, Backend, MongoDB, Redis) in containerized mode with a single command:

1. Ensure **Docker Desktop** is open and running.
2. Run from the root directory:
```bash
docker compose up --build
```
3. Access the web app at **[http://localhost:5173](http://localhost:5173)**.

---

## 🔒 Additional Setup Requirements

### AWS S3 Configuration
1. Create an AWS S3 Bucket with CORS enabled for your client origin (`http://localhost:5173`).
2. Attach IAM user policies with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket` permissions.

### Google Drive API & OAuth Setup
1. In Google Cloud Console, enable **Google Drive API**.
2. Configure **OAuth 2.0 Client Credentials** and add `http://localhost:5173` to Authorized JavaScript Origins and Redirect URIs.

### Razorpay API Keys
1. Sign up on [Razorpay Dashboard](https://dashboard.razorpay.com/) and generate Key ID and Key Secret in Test Mode.
2. Configure webhooks targeting `http://your-domain.com/api/v1/subscription/webhook`.
