import axios from 'axios';
const client = axios.create({ baseURL: '/api', timeout: 30000 });
client.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
client.interceptors.response.use((r) => r.data, (e) => {
  if (e.response?.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; }
  return Promise.reject(e);
});
export default client;
