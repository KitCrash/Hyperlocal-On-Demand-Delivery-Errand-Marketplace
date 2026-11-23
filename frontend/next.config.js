/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  reactStrictMode: false,
  output: isGithubActions ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  basePath: isGithubActions ? '/Hyperlocal-On-Demand-Delivery-Errand-Marketplace' : '',
  assetPrefix: isGithubActions ? '/Hyperlocal-On-Demand-Delivery-Errand-Marketplace/' : '',
};

module.exports = nextConfig;
