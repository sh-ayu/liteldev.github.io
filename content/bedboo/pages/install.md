# Install bedboo

bedboo is not published to npm yet. It fixes a few of its dependencies with pnpm patches that apply only inside its own workspace, so you use it from a checkout of its repository, and your bot is a package of that workspace.

## What you need

- [Node.js](https://nodejs.org/) **24** or newer. Check with `node -v`.
- [Git](https://git-scm.com).
- Windows, Linux or macOS on an **x64** processor for the default RakNet transport, which has no ARM builds. The NetherNet transport is pure JavaScript and runs anywhere ([Connecting to a server](guide/connecting.md#transports)).
- A Bedrock Dedicated Server to connect to, in a version bedboo supports: see [Supported versions](reference/versions/index.md).

## Install

```shell
git clone https://github.com/LiteLDev/bedboo
cd bedboo
corepack enable
pnpm install
```

`corepack enable` provides pnpm in the version the repository asks for.

::: details `corepack` is not found, or not allowed
Node.js 25 and newer no longer include corepack: install it with `npm install -g corepack`, then run `corepack enable` again. On Windows, if Node.js is installed in `C:\Program Files`, run `corepack enable` once in a terminal opened as administrator.
:::

Your bot then lives in a folder under `packages/`, with `"bedboo": "workspace:*"` among the dependencies of its `package.json`; run `pnpm install` again after you add it. [Your first bedboo bot](https://levimc.org/tutorials/automate/first-bedboo-bot/#_2-make-a-package-for-your-bot) goes through it.

## Check that it works

`pnpm install` ends with the list of installed packages and no error. In the root of the repository, this prints `function`:

```shell
node -e "console.log(typeof require('bedboo').createBot)"
```

## Update

In the checkout, get the newest code and install again:

```shell
git pull
pnpm install
```

## Other versions

bedboo has no numbered releases yet: the `main` branch of the [repository](https://github.com/LiteLDev/bedboo) is the current version. To stay on a known state, check out a commit (`git checkout <commit>`) and run `pnpm install`.

## Next steps

- [Your first bedboo bot](https://levimc.org/tutorials/automate/first-bedboo-bot/): prepare a server and connect a bot that walks to you.
- [Connecting to a server](guide/connecting.md): versions, transports and sign-in.
- [Using mineflayer plugins](guide/plugins.md).
