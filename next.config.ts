import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  register: false,
  cacheOnNavigation: false,
  reloadOnOnline: false,
});

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  experimental: {
    useTypeScriptCli: false,
  },
};

export default withSerwist(nextConfig);
