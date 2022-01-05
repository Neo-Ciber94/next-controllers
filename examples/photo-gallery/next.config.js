/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    FETCHER_BASE_URL: 'http://localhost:3000',
  },
};
