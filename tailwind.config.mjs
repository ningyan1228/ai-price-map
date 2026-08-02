/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: { extend: { fontFamily: { sans: ['Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'] }, boxShadow: { panel: '0 10px 30px rgba(0,0,0,.18)' } } },
  plugins: []
};
