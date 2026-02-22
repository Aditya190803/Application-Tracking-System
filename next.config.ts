import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/handler/signin',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
