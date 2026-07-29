import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Default 1 MB is too small for product photos even after the
      // client-side resize. 4 MB leaves headroom for any Server Action
      // payload, while still catching accidental multi-image sends.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;