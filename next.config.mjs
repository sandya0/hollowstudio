/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // A stray package-lock.json in the user folder confuses root detection
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
