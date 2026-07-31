import api from './axiosInstance';

/**
 * Fetch global system overview statistics
 */
export const getAdminStatsApi = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

/**
 * Fetch all registered users with search & pagination
 */
export const getAllUsersApi = async ({ search = '', page = 1, limit = 20 } = {}) => {
  const response = await api.get('/admin/users', {
    params: { search, page, limit },
  });
  return response.data;
};

/**
 * Update user role (user <-> admin)
 */
export const updateUserRoleApi = async (userId, role) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

/**
 * Update user storage quota limit in GB
 */
export const updateUserQuotaApi = async (userId, storageLimitGB) => {
  const response = await api.patch(`/admin/users/${userId}/quota`, { storageLimitGB });
  return response.data;
};

/**
 * Delete user account and purge all files
 */
export const deleteUserApi = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Fetch target user's uploaded files & directories for admin single user view
 */
export const getUserVaultFilesApi = async (userId, parentFolder = null) => {
  const response = await api.get(`/admin/users/${userId}/files`, {
    params: { parentFolder: parentFolder || undefined },
  });
  return response.data;
};
