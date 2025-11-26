/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this images block to fix the error
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  
  // Your existing config
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // async redirects() {
  //   return [
  //     {
  //       source: "/dashboard",
  //       destination: "/dashboard/default",
  //       permanent: false,
  //     },
  //   ];
  // },
}

export default nextConfig