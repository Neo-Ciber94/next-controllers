# Troubleshooting

## Table of contents

1. [Error: Can not find "api/" folder](#cannot-find-api-folder)

## Error: Can not find "api/" folder

### Causes:

This error occurs when ``__dirname`` is not pointing to the correct directory which is used by the library to detect the current route.

### Solutions:

1. In `next.config/js` updates your webpack configuration to use the nodejs behaviour of ``__dirname`` changing the `resolve.fallback`.

    ```js
    module.exports = {
    reactStrictMode: true,
    webpack5: true,
    webpack: (config) => {
        config.resolve.fallback = { __dirname: false };
        return config;
    },
    };

    ```

2. In `next.config/js` updates your webpack configuration to use the nodejs behaviour of ``__dirname`` changing the `node` config.

    ```js
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
    ```

3. Pass the `__dirname` directly to the `withController` function.

    ```ts
    withController(MyController, { dirname: __dirname })
    ```
