import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  serverExternalPackages: [],
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;