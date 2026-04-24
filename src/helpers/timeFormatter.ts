/**
 * تبدیل دقیقه به فرمت HH:MM
 * @param {number} totalMinutes - مدت زمان کل به دقیقه
 */
export const formatDurationHHMM = (totalMinutes) => {
  // اگر مقدار ورودی نامعتبر بود
  if (totalMinutes === undefined || totalMinutes === null || totalMinutes < 0) {
    return "00:00";
  }

  // نیازی به تقسیم بر 60 برای رند کردن نیست، چون ورودی خودش دقیقه است
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  // فرمت‌دهی دو رقمی
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');

  return `${hh}:${mm}`;
};