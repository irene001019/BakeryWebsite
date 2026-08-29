/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabase Storage serves menu photos from a *.supabase.co URL.
  // Add your project's storage host here once you create the Supabase project
  // (Settings -> API -> Project URL, swap https:// for the hostname below).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
