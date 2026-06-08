import type { NextConfig } from "next";

// For GitHub Pages project sites the app is served from /<repo>, so the build
// needs a matching basePath. The deploy workflow sets NEXT_PUBLIC_BASE_PATH to
// "/<repo-name>"; locally it's empty so `npm run dev` serves from "/".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export", // emit a fully static site into ./out
  images: { unoptimized: true },
  basePath,
  trailingSlash: true,
};

export default nextConfig;
