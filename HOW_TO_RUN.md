# How to Run CloudDocs AI Project

This file contains step-by-step instructions on how to run, test, and verify the project after every completed feature/milestone.

---

## 📌 Active Status: Milestone 3 — Google OAuth Integration & MongoDB Verification

### 🚀 Option A: Running via Docker Compose (Recommended)

1. **Ensure Docker Desktop is running on your machine.**
2. **Open Terminal in the project root:**
   ```powershell
   cd d:\AI-project\project_2
   ```
3. **Rebuild & Start all services with Docker Compose:**
   ```powershell
   docker-compose up --build
   ```

---

### 💻 Option B: Running Locally (Without Docker)

1. **Ensure MongoDB & Redis are running:**
   ```powershell
   docker run -d -p 27017:27017 --name mongo mongo:7
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

2. **Start Backend:**
   ```powershell
   cd d:\AI-project\project_2\backend
   npm install
   npm run dev
   ```

3. **Start Frontend:**
   ```powershell
   cd d:\AI-project\project_2\frontend
   npm install
   npm run dev
   ```

---

## 🧪 Verification & Manual Testing Steps

### 1. Verification of Registration & MongoDB Data Saving
- Open [http://localhost:5173/register](http://localhost:5173/register).
- Fill in Name (e.g., `John Doe`), Email (e.g., `john.doe@example.com`), Password (`Secret123!`), and Confirm Password.
- Submit the form -> confirm registration succeeds instantly without CORS or Network Errors.
- Confirm automatic redirect to [http://localhost:5173/dashboard](http://localhost:5173/dashboard).
- User record is persisted in MongoDB `clouddocs` database under `users` collection.

### 2. Testing Google OAuth Authentication
- Navigate to [http://localhost:5173/login](http://localhost:5173/login) or [http://localhost:5173/register](http://localhost:5173/register).
- If `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` are set in `.env`, Google's official GSI button renders and verifies your account via Google's OAuth popup.
- If Google credentials are not set in `.env`, click the **"Continue with Google"** button to trigger the instant developer demo authentication flow (`google.demo.user@gmail.com`).
- Confirm registration/login succeeds, HTTP-only JWT cookie is issued, and profile is saved to MongoDB.

---

*This guide is updated after every completed milestone.*
