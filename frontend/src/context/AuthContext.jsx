import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Register function
  const registerUser = async (name, email, password) => {
    setError(null);
    const toastId = toast.loading('Creating your account...');
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data.success) {
        if (response.data.requireOtp) {
          toast.success(response.data.message || 'Account created! Please check your email for the OTP code.', { id: toastId });
          return { success: true, requireOtp: true, email: response.data.email || email };
        }
        setUser(response.data.user);
        toast.success(response.data.message || 'Account created successfully!', { id: toastId });
        return { success: true, user: response.data.user };
      }
    } catch (err) {
      console.error('Registration API error:', err);
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(message);
      toast.error(message, { id: toastId });
      return { success: false, message };
    }
  };

  // Login function
  const loginUser = async (email, password) => {
    setError(null);
    const toastId = toast.loading('Signing in...');
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        if (response.data.requireOtp) {
          toast.success(response.data.message || 'Please verify your email address.', { id: toastId });
          return { success: true, requireOtp: true, email: response.data.email || email };
        }
        setUser(response.data.user);
        toast.success(`Welcome back, ${response.data.user.name}!`, { id: toastId });
        return { success: true, user: response.data.user };
      }
    } catch (err) {
      console.error('Login API error:', err);
      if (err.response?.data?.requireOtp) {
        const emailToVerify = err.response.data.email || email;
        toast.error(err.response.data.message || 'Account not verified. OTP code sent to your email.', { id: toastId });
        return { success: false, requireOtp: true, email: emailToVerify };
      }
      const message = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(message);
      toast.error(message, { id: toastId });
      return { success: false, message };
    }
  };

  // Google OAuth Login function
  const loginWithGoogle = async (googleData) => {
    setError(null);
    const toastId = toast.loading('Authenticating with Google...');
    try {
      const response = await api.post('/auth/google', googleData);
      if (response.data.success) {
        setUser(response.data.user);
        toast.success(`Signed in with Google as ${response.data.user.name}`, { id: toastId });
        return { success: true, user: response.data.user };
      }
    } catch (err) {
      console.error('Google OAuth API error:', err);
      const message = err.response?.data?.message || err.message || 'Google OAuth failed.';
      setError(message);
      toast.error(message, { id: toastId });
      return { success: false, message };
    }
  };

  // Send / Resend OTP function
  const sendOTP = async (email) => {
    const toastId = toast.loading('Sending verification code...');
    try {
      const response = await api.post('/auth/send-otp', { email });
      if (response.data.success) {
        toast.success(response.data.message || 'Verification code sent to your email!', { id: toastId });
        return { success: true };
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      const message = err.response?.data?.message || err.message || 'Failed to send OTP code.';
      toast.error(message, { id: toastId });
      return { success: false, message };
    }
  };

  // Verify OTP function
  const verifyOTP = async (email, otp) => {
    const toastId = toast.loading('Verifying code...');
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Email address verified successfully!', { id: toastId });
        return { success: true };
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      const message = err.response?.data?.message || err.message || 'Invalid or expired verification code.';
      toast.error(message, { id: toastId });
      return { success: false, message };
    }
  };

  // Logout function
  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  // Refresh user data from /auth/me
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        loading,
        error,
        setError,
        registerUser,
        loginUser,
        loginWithGoogle,
        sendOTP,
        verifyOTP,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
