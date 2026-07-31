import api from './axiosInstance';

/**
 * Fetch File Sharing Dashboard metrics & activity
 */
export const getSharingDashboardApi = async () => {
  const response = await api.get('/files/sharing/dashboard');
  return response.data;
};

/**
 * Fetch Files Shared By Me
 */
export const getFilesSharedByMeApi = async () => {
  const response = await api.get('/files/sharing/shared-by-me');
  return response.data;
};

/**
 * Fetch Files Shared With Me
 */
export const getFilesSharedWithMeApi = async () => {
  const response = await api.get('/files/sharing/shared-with-me');
  return response.data;
};

/**
 * Fetch registered platform users for invite dropdown
 */
export const getRegisteredUsersApi = async () => {
  const response = await api.get('/files/users/collaborators');
  return response.data;
};

/**
 * Toggle or update public share link for file
 */
export const toggleShareLinkApi = async (fileId, payload) => {
  const response = await api.post(`/files/${fileId}/share`, payload);
  return response.data;
};

/**
 * Invite collaborator by email or user ID
 */
export const inviteCollaboratorApi = async (fileId, payload) => {
  const response = await api.post(`/files/${fileId}/invite`, payload);
  return response.data;
};

/**
 * Revoke collaborator access
 */
export const removeCollaboratorApi = async (fileId, targetUserId) => {
  const response = await api.delete(`/files/${fileId}/collaborator/${targetUserId}`);
  return response.data;
};

/**
 * Update collaborator role ('viewer' / 'editor')
 */
export const updateCollaboratorRoleApi = async (fileId, targetUserId, role) => {
  const response = await api.patch(`/files/${fileId}/collaborator/${targetUserId}`, { role });
  return response.data;
};
