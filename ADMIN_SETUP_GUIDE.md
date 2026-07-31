# CloudDocs AI — Admin Access & Role Management Guide

This guide explains how to grant **Admin Access** to any user account in CloudDocs AI, access the Admin Dashboard, and manage user storage quotas and system privileges.

---

## 🚀 4 Ways to Grant Admin Access

### Method 1: Using Docker Container Command (Recommended)

If your application is running via Docker Compose, execute the following command in your terminal:

```bash
docker exec -it clouddocs_backend npm run make-admin your-email@example.com
```

> **Example:**
> ```bash
> docker exec -it clouddocs_backend npm run make-admin test@example.com
> ```

---

### Method 2: Running Node Script directly in Backend Directory

If running the backend locally outside Docker:

```bash
cd backend
npm run make-admin your-email@example.com
```

---

### Method 3: Direct Update in MongoDB Atlas / Compass / Mongosh

If you prefer updating the database directly:

1. Open **MongoDB Compass** or log in to **MongoDB Atlas**.
2. Navigate to your database (`cloudDocs` or `clouddocs`) and select the `users` collection.
3. Find your user by email and edit the document:
   ```json
   {
     "role": "admin"
   }
   ```
4. Or run this query in **mongosh**:
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   );
   ```

---

### Method 4: Promoting Users via the Admin Dashboard UI

Once at least **one Admin account** exists:

1. Log into your account at `http://localhost:5173/login`.
2. Click the **"Admin Panel"** badge in the top navigation bar or go directly to `http://localhost:5173/admin`.
3. In the **User Management Table**, locate any registered user.
4. Click the **"Make Admin"** button next to their name.

---

## 🔒 Accessing the Admin Dashboard

1. **URL:** Navigate to [`http://localhost:5173/admin`](http://localhost:5173/admin).
2. **Features Available in Admin Dashboard:**
   - 📊 **System Overview Stats:** View total users, total files, aggregate vault storage used, and active share links.
   - 🔍 **Search & Filter Directory:** Real-time user search by name or email.
   - 👑 **Role Management:** Upgrade users to `admin` or demote to standard `user`.
   - 💾 **Storage Quota Adjustments:** Custom storage limits per user (e.g. 5 GB $\rightarrow$ 50 GB).
   - 🗑️ **Account & File Purge:** Permanently remove accounts and wipe all associated files from storage.

---

## ⚡ Quick Test Steps

1. Create a user account on `http://localhost:5173/register`.
2. Run:
   ```bash
   docker exec -it clouddocs_backend npm run make-admin your-email@example.com
   ```
3. Refresh `http://localhost:5173` and click **"Admin Panel"** in the top bar. You now have full administrator access!
