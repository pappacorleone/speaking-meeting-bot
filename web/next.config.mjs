import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Experimental features for performance
  experimental: {
    // Optimize package imports for tree-shaking
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-switch",
      "@radix-ui/react-toggle",
      "zustand",
    ],
  },

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withBundleAnalyzer(nextConfig);
