# SOFA Project

## Understand this workspace

Run `nx graph` to see a diagram of the dependencies of the projects.

## Further help

Visit the [Nx Documentation](https://nx.dev) to learn more.

## Deps installation

Visit [pnpm install](https://pnpm.io/cli/install) to learn more

### Env

> pnpm@7
> node@16

Create an apps/dapp/.env.local file:

```bash
VITE_ENV=daily
VITE_BACKEND=https://demo-api.sofa.org
VITE_SOFA_LINK=/
VITE_RCH_LINK=/rch
VITE_EARN_LINK=/products?project=PROTECTED
VITE_SURGE_LINK=/products?project=RISKY
VITE_DUAL_LINK=/products?project=Dual
VITE_PORT=16488
VITE_RPC_URL_OF_1=[YOUR_RPC_URL_OF_1] # needed
VITE_RPC_URL_OF_42161=[YOUR_RPC_URL_OF_42161] # needed
```

### Install all deps

```bash
pnpm i
```

### Install root deps

```bash
cd ./ && pnpm i --filter=./
```

### Install workspace deps

> Method 1:

```bash
cd ./[workspace/package name] && pnpm i
```

> Method 2:

```bash
pnpm i --filter=[workspace/package name]
```

## Dev

```bash
pnpm nx run dapp:dev --verbose
pnpm nx run dapp:[other start command] --verbose
```

## Build

```bash
pnpm nx run dapp:build --[env] --verbose
pnpm nx run dapp:[other build command] --[env] --verbose
```

## Tests

Run the utils, services, and dapp tests from the repository root:

```bash
pnpm test
```

Each package has its own test script and Nx target. To run a package's tests individually:

```bash
pnpm nx run @sofa/utils:test
pnpm nx run @sofa/services:test
pnpm nx run dapp:test
```

Run the transaction regression tests and type checks directly without Nx:

```bash
pnpm --filter @sofa/services test
pnpm --filter dapp test
pnpm --filter dapp exec tsc --noEmit
```

## Deploy

Prepare:

1. Apply for SiteKey to ensure the stability of SOFA api request, please contract team of SOFA.org
2. Add the SiteKey to .env.daily / .env.demo / .env.pre / .env.prod with `VITE_SITE_KEY`
