import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_MOCK_USER_ID: process.env.NEXT_PUBLIC_MOCK_USER_ID ?? "",
    NEXT_PUBLIC_MOCK_USER_ROLE: process.env.NEXT_PUBLIC_MOCK_USER_ROLE ?? "",
    NEXT_PUBLIC_MOCK_ADMIN_ID: process.env.NEXT_PUBLIC_MOCK_ADMIN_ID ?? "",
    NEXT_PUBLIC_MOCK_ADMIN_ROLE: process.env.NEXT_PUBLIC_MOCK_ADMIN_ROLE ?? "",
  },
  async redirects() {
    return [
      {
        source: "/vehicles",
        destination: "/booking",
        permanent: true,
      },
      {
        source: "/vehicles/:id",
        destination: "/booking",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
