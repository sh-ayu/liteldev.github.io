# 安装 LegacyScriptEngine

LegacyScriptEngine（LSE）是一个 LeviLamina 模组：在服务器上用 [lip](https://levimc.org/zh-Hans/lip/) 安装，在 Windows
的游戏里用 [LeviLauncher](https://levimc.org/zh-Hans/LeviLauncher/) 安装。每种脚本语言是一个单独的包，叫做**变体**。

## 需要什么

- 一个已经装好 LeviLamina 的服务器或游戏实例：见[安装 LeviLamina](https://levimc.org/zh-Hans/LeviLamina/install/)。
- 你的插件所用语言对应的变体：

    | 变体 | 语言 | 引擎 |
    |---|---|---|
    | `#lua` | Lua | CLua |
    | `#quickjs` | JavaScript | QuickJS，支持 ES 模块 |
    | `#nodejs` | JavaScript | Node.js，支持 npm 包 |
    | `#python` | Python | CPython，支持 pip 包 |

- 只有 `#python` 需要：在运行引擎的机器上装好 Python：

    | LSE 版本 | Python 版本 |
    |---|---|
    | >=0.16.2 | 3.12.10 |
    | >=0.9.0 <0.16.2 | 3.12.8 |
    | <0.9.0 | 3.10.11 |

## 安装

### 在服务器上

服务器在运行的话先停掉。在服务器的文件夹里安装你需要的变体：

```shell
lip install LegacyScriptEngine#quickjs
```

不写变体时，`lip install LegacyScriptEngine` 会同时安装 QuickJS 和 Lua 两个引擎。lip 会选出适合服务器上
LeviLamina 的最新 LSE，并装好它依赖的包。lip 界面的**市场**页面也能安装：搜索 LegacyScriptEngine。

### 在 Windows 的游戏里

在 LeviLauncher 里打开实例的 **LeviMC Mods** 页面，找到 LegacyScriptEngine 并安装。LeviLauncher 会选好适合客户端和
实例的 LeviLamina 的构建。

## 确认装好了

在服务器上运行 `lip list`：它会列出 `github.com/LiteLDev/LegacyScriptEngine`，带着变体（例如 `#quickjs`）和版本。

## 更新

```shell
lip update LegacyScriptEngine#quickjs
```

写上你安装的变体。不带名字的 `lip update` 会更新你要求安装的所有包。想换到某个指定版本或退回旧版本，写明它：
`lip update LegacyScriptEngine#quickjs@0.23.1`。

## 其他版本

所有发行版都在[发行版列表](https://github.com/LiteLDev/LegacyScriptEngine/releases)里。每个 LSE 版本对应一个
LeviLamina 版本，lip 只会给出适合服务器的那些。想装其中某一个，把它写在 `@` 后面：
`lip install LegacyScriptEngine#quickjs@0.23.1`。

## 下一步

- [给服务器安装模组](https://levimc.org/zh-Hans/tutorials/server/install-mods/)：在 lip 的界面里和用命令给服务器装 LSE
  和其他模组。
- [你的第一个脚本插件](https://levimc.org/zh-Hans/tutorials/develop/first-script-plugin/)：写一个插件，加载它，看它运行。
- 已经有 LLSE 插件？把它们放进 `plugins/` 再启动服务器：见[插件与引擎](concepts/plugins.md)。
