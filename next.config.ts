import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      // Links antigos do portal IAM apontavam para /signin
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/signin/:path*", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
