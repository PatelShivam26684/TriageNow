// config.js
const isLocalhost = window.location.hostname === 'localhost';
const BASE_URL = isLocalhost
  ? 'http://127.0.0.1:5000'
  : 'https://triagenow.onrender.com';

export default BASE_URL;