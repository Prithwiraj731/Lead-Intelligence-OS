/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@leadintel/types", "@leadintel/database", "@leadintel/ai"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
