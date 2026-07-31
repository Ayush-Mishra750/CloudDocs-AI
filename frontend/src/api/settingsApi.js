import api from './axiosInstance';

export const updateProfileApi = async (name) => {
  const response = await api.put('/auth/profile', { name });
  return response.data;
};

export const uploadAvatarApi = async (formData) => {
  const response = await api.post('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const setPasswordApi = async (password, confirmPassword) => {
  const response = await api.post('/auth/set-password', { password, confirmPassword });
  return response.data;
};

export const logoutAllDevicesApi = async () => {
  const response = await api.post('/auth/logout-all');
  return response.data;
};

export const disableAccountApi = async () => {
  const response = await api.post('/auth/disable-account');
  return response.data;
};

export const deleteAccountApi = async () => {
  const response = await api.delete('/auth/delete-account');
  return response.data;
};
