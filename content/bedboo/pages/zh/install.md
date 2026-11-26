# 安装 bedboo

bedboo 还没有发布到 npm。它用 pnpm 补丁修正了几个依赖，这些补丁只在它自己的工作区里生效，所以要从它的仓库检出来使用，你的机器人是这个工作区里的一个包。

## 需要什么

- [Node.js](https://nodejs.org/) **24** 或更新版本。用 `node -v` 检查。
- [Git](https://git-scm.com)。
- 默认的 RakNet 传输需要 **x64** 处理器上的 Windows、Linux 或 macOS，它没有 ARM 版本。NetherNet 传输是纯 JavaScript，在哪里都能运行（[连接服务器](guide/connecting.md#transports)）。
- 一个可以连接的 Bedrock Dedicated Server，版本在 bedboo 的支持范围内：见[支持的版本](reference/versions/index.md)。

## 安装

```shell
git clone https://github.com/LiteLDev/bedboo
cd bedboo
corepack enable
pnpm install
```

`corepack enable` 会提供仓库要求的那个版本的 pnpm。

::: details 找不到 `corepack`，或者没有权限
Node.js 25 及更新版本不再自带 corepack：用 `npm install -g corepack` 安装，然后再运行一次 `corepack enable`。在 Windows 上，如果 Node.js 装在 `C:\Program Files`，要在以管理员身份打开的终端里运行一次 `corepack enable`。
:::

之后，你的机器人放在 `packages/` 下的一个文件夹里，它的 `package.json` 的依赖里写上 `"bedboo": "workspace:*"`；加好之后再运行一次 `pnpm install`。[你的第一个 bedboo 机器人](https://levimc.org/zh-Hans/tutorials/automate/first-bedboo-bot/)一步步讲了这个过程。

## 确认装好了

`pnpm install` 结束时列出已安装的包，没有报错。在仓库根目录运行下面的命令，会输出 `function`：

```shell
node -e "console.log(typeof require('bedboo').createBot)"
```

## 更新

在检出的仓库里拉取最新代码，再安装一次：

```shell
git pull
pnpm install
```

## 其他版本

bedboo 还没有带版本号的发行版：[仓库](https://github.com/LiteLDev/bedboo)的 `main` 分支就是当前版本。想停留在某个确定的状态，检出一个提交（`git checkout <提交>`），再运行 `pnpm install`。

## 下一步

- [你的第一个 bedboo 机器人](https://levimc.org/zh-Hans/tutorials/automate/first-bedboo-bot/)：准备服务器，连接一个会走到你身边的机器人。
- [连接服务器](guide/connecting.md)：版本、传输方式和登录。
- [生态插件](guide/plugins.md)。
