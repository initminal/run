/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  basePath: '/run',
  trailingSlash: true, // if this is not set, /docs/ will be rewritten to /docs, and the files such as CSS will not be found
  rewrites: async () => {
    return [
      {
        source: '/docs/',
        destination: '/docs/index.html',
      },
    ]
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/run',
        basePath: false,
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
