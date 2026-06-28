import axios from 'axios';

const shopApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
});

shopApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ss_shop_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

shopApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ss_shop_token');
      localStorage.removeItem('ss_shop');
      window.location.href = '/shop/login';
    }
    return Promise.reject(err);
  }
);

export default shopApi;
