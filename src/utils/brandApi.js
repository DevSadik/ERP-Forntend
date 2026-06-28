import axios from 'axios';

const brandApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

brandApi.interceptors.request.use(config => {
  const token = localStorage.getItem('ss_brand_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

brandApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ss_brand_token');
      localStorage.removeItem('ss_brand');
      window.location.href = '/supplier/login';
    }
    return Promise.reject(err);
  }
);

export default brandApi;
