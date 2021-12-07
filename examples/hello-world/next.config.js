/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack5: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = { __dirname: false };

      // config.target = 'node';
      // config.node = {
      //   __dirname: true,
      // };
    }

    return config;
  },
};
