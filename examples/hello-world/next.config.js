/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack5: true,
  webpack: (config) => {
    config.target = 'node';
    config.node = {
      ...config.node,
      __dirname: true,
    };
    return config;
  },
};
