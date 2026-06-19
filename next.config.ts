import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output pre produkčné nasadenie (Vercel, Docker, Node server).
  // Generuje .next/standalone/server.js + .next/standalone/ adresár.
  output: "standalone",
  // NEpoužívať ignoreBuildErrors - chyby treba opraviť, nie obísť.
  // (Predtým tu bolo typescript.ignoreBuildErrors: true, ale to bolo v rozpore
  // s bezpečnostnými pravidlami projektu.)
  reactStrictMode: false,
};

export default nextConfig;
