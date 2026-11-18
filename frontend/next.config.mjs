/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_EXPORT === "true";

const nextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
