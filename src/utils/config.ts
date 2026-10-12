// src/config.ts

// می‌توانید اینجا تشخیص دهید که در حالت Development هستید یا Production
const DEV_SERVER_IP = '172.20.10.12'; // آی‌پی صحیح سرور شما
const PORT = '8000';

export const API_BASE_URL = `http://${DEV_SERVER_IP}:${PORT}`;