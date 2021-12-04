# Next-Controllers

A library for create api routes for `NextJS`.

## Installation

Install with `npm`

```codecopy
npm i next-controllers
```

Or `yarn`

```codecopy
yarn add next-controllers
```

## Setup

Enable decorators in your `typescript` project:

```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

Add a `.babelrc` file with the following content:

```json
{
  "presets": ["next/babel"],
  "plugins": [["@babel/plugin-proposal-decorators", { "legacy": true }], "@babel/plugin-proposal-class-properties"]
}
```

Install the `babel` dependencies
```
npm i -D @babel/plugin-proposal-class-properties
```

```
npm i @babel/plugin-proposal-decorators
```

## Usage

