# Linux 与 macOS

读完本页，你就知道 lip 在你的系统上能运行哪些服务器、怎样在那里安装 lip、为了运行它们会下载什么并放在哪里，以及会遇到哪些限制。命令在每种系统上都一样：见[用命令行开服](https://levimc.org/zh-Hans/tutorials/server/command-line/)。

## 什么系统能运行什么

Minecraft 发布了两种服务器：Windows 版和 Linux 版。模组需要的加载器 LeviLamina 只能加载进 Windows 服务器。所以带模组的服务器一定是 Windows 服务器；在非 Windows 的系统上，lip 通过 [Wine](https://www.winehq.org/) 运行它。

| 系统 | Windows 服务器，带或不带 LeviLamina | Linux 服务器，不带加载器 |
| --- | --- | --- |
| x64 的 Windows | 可以 | 不可以 |
| arm64 的 Windows | 可以。由 Windows 模拟 x64。 | 不可以 |
| x64 的 Linux | 可以，通过 lip 的 Wine | 可以 |
| x64 的 macOS | 可以，通过 lip 的 Wine | 不可以 |
| arm64 的 macOS（Apple 芯片） | 可以，通过 lip 的 Wine 和 Rosetta 2 | 不可以 |
| arm64 的 Linux，以及其他任何系统 | 不可以 | 不可以 |

lip 为前五种系统发布。没有 arm64 Linux 版的 lip：见[限制和已知问题](#限制和已知问题)。

无论 lip 运行在什么系统上，它安装的都是同一批包，也就是为 x64 的 Windows 制作的那些。在一种系统上安装好的服务器文件夹，可以搬到另一种系统上。

## 安装 lip

在 macOS 和 x64 的 Linux 上，用安装脚本安装 lip，在终端中运行：

```sh
curl -fsSL https://levimc.org/lip/install.sh | sh
```

这个脚本会：

1. 选出适合你的系统的 lip 版本：Apple 芯片的 Mac 用 `osx-arm64`，Intel 的 Mac 用 `osx-x64`，x64 的 Linux 用 `linux-x64`。在其他系统上它会停止；
2. 从 GitHub 下载最新发行版中的这个版本，并用发行版的 `SHA256SUMS` 检查它。校验不一致的文件不会被安装；
3. 把 `lip` 放进 `~/.local/bin`，替换那里已有的 lip；
4. 如果这个文件夹不在 `PATH` 里，询问是否把它加进你的 shell 的配置文件；配置文件已经加过的，就不再加。

它不需要 root，也不需要管理员密码，除了这个文件夹和配置文件，不会改动任何东西。装好后打开一个新终端，确认 `lip -v` 能输出版本号。以后用 `lip self-update` 更新 lip。

下面这些变量可以改变脚本的行为。把它们设置给 `|` 后面的 `sh`：

```sh
curl -fsSL https://levimc.org/lip/install.sh | LIP_VERSION=0.42.0 sh
```

| 变量 | 脚本怎样使用它 |
| --- | --- |
| `LIP_VERSION` | 安装这个版本（例如 `0.42.0`），而不是最新版。 |
| `LIP_INSTALL_DIR` | 把 lip 安装到这个文件夹（绝对路径），而不是 `~/.local/bin`。 |
| `LIP_GITHUB_PROXY` | 通过这个 GitHub 代理从 GitHub 下载，与 lip 的设置 [`github_proxy`](configuration.md#github-proxy) 相同：代理的地址，然后是 `/`，然后是 GitHub 上的地址。 |
| `LIP_NO_MODIFY_PATH` | 为 `1` 时，从不修改 shell 的配置文件，而是输出需要加进去的那一行。 |

如果想手动安装，从[最新发行版](https://github.com/LiteLDev/lip/releases/latest)下载你的系统对应的压缩包（`lip-<version>-osx-arm64.zip`、`lip-<version>-osx-x64.zip` 或 `lip-<version>-linux-x64.tar.xz`），把其中的 `lip` 文件解压到 `PATH` 里的某个文件夹。在 macOS 上，还要去掉浏览器给它加上的隔离标记，否则 macOS 会拒绝运行它：`xattr -d com.apple.quarantine <文件夹>/lip`。用脚本安装不需要这一步，因为 `curl` 不会加这个标记。[开你的第一个服务器](https://levimc.org/zh-Hans/tutorials/server/first-server/#_1-安装-lip)一步步讲解了这两种方式。

## 通过 Wine 运行 Windows 服务器

安装和运行服务器的方法与 Windows 上完全一样：

```sh
mkdir -p ~/servers/survival
cd ~/servers/survival
lip setup --game 1.26.50
lip run
```

你不需要安装 Wine。lip 自带一份，并且从不运行别的 Wine，例如 `PATH` 里的 `wine`。

### lip 下载什么放在哪里

lip 第一次需要运行 Windows 程序时，会先准备好系统。这发生在 `lip setup` 安装 Windows 服务器时、某个包在安装过程中要运行自己的程序时，以及 `lip run` 启动 Windows 服务器之前。

| 内容 | 放在哪里 | 是否共用 |
| --- | --- | --- |
| **Wine**：适合你系统的一个构建，Linux 上来自 [Kron4ek/Wine-Builds](https://github.com/Kron4ek/Wine-Builds)，macOS 上来自 [Gcenx/macOS_Wine_builds](https://github.com/Gcenx/macOS_Wine_builds) | lip 数据目录下的 `wine/`：Linux 和 macOS 上都是 `$XDG_DATA_HOME/lip`，默认 `~/.local/share/lip` | 所有工作区共用。只下载一次。 |

服务器还需要 Microsoft Visual C++ 运行库。Wine 自带一份，所以 lip 不再额外安装。

安装 Wine 时，lip 会告诉你：

```text
lip runs the server with Wine <version>, which it installs once for every workspace, into <directory>.
```

下载会经过校验。每个版本的 lip 都通过 SHA-256 确切地知道它要的是哪个文件。不一致的下载会被删除、不会被使用，命令在更改工作区之前就失败。下载下来的压缩包解压后即删。

这一步不需要 root 权限。

想腾出空间，可以在没有 lip 运行时删除数据目录。不会丢失任何东西：lip 下次需要时会重新安装 Wine。

### Wine 前缀

Wine 把它的“Windows”（注册表和 `C:` 盘）放在一个叫作前缀的文件夹里。lip 给每个工作区单独一个：服务器文件夹里的 `.lip/wine`。Wine 第一次在那里运行时会创建它，所以第一次运行会慢一些。

前缀会随服务器文件夹一起移动。在服务器停止时删除 `.lip/wine` 是安全的：Wine 会重新创建它。

想使用别的前缀，请自己设置 `WINEPREFIX`，并且对该工作区的每条 lip 命令都这样设置：

```sh
export WINEPREFIX="$HOME/.wine-bedrock"
lip setup --game 1.26.50
lip run
```

### Apple 芯片的 macOS

lip 的 Wine 是 x64 程序，Apple 芯片的 Mac 通过 Rosetta 2 运行它。缺少 Rosetta 2 时，lip 会在准备系统时、Wine 第一次运行之前安装它。安装 Rosetta 2 即表示接受 Apple 为它制定的软件许可协议，所以 lip 会先询问：

- 在终端里，lip 会说明它要安装 Rosetta 2、这表示接受该许可协议，并询问是否继续。界面会在对话框里问同样的问题。
- 加上 `--accept-rosetta-license` 时，lip 不会询问：给出这个选项就表示你接受了许可协议。`lip setup`、`lip install`、`lip update`、`lip uninstall` 和 `lip run` 都接受它，用于脚本和无人应答的终端：

  ```sh
  lip setup --game 1.26.50 --accept-eula --accept-rosetta-license
  ```

- 如果 lip 无法询问（它的输入或错误输出不是终端），又没有给出这个选项，命令就会失败。没有这个选项、由 `lip run --managed` 启动的[托管服务器](../reference/commands/run.md#托管服务器)也是如此，因为它不提问；在界面中启动的服务器由界面询问。

lip 以运行 lip 的用户身份执行 `softwareupdate --install-rosetta --agree-to-license` 来安装 Rosetta 2。安装失败或你回答“否”时，命令会失败并给出这条命令，方便你自己运行。较新的 macOS 安装 Rosetta 2 不需要管理员权限；某些版本需要。之后重新运行 lip 命令。

## Linux 服务器

在 x64 的 Linux 上，lip 还能运行 Minecraft 的 Linux 服务器。它不需要 Wine，也不需要系统里的其他东西。它没有加载器，所以不能在它旁边安装需要 LeviLamina 的模组。

```sh
lip setup --game 1.26.50 --build linux
lip run
```

- `lip setup` 放置服务器的文件，并把 `bedrock_server` 设为可执行。
- `lip run` 在工作区里启动 `bedrock_server`。`LD_LIBRARY_PATH` 未设置或为空时，lip 会把它设为 `.`，让服务器能找到旁边的库。
- 在 x64 的 Linux 以外的系统上，对这样安装的工作区运行 `lip run` 会失败，并提示你到那种系统上运行，或者改装 Windows 服务器。

一个工作区只有一个游戏。在已有 Windows 服务器的文件夹里安装 Linux 服务器会替换掉它，反过来也一样。见 [`lip setup`](../reference/commands/setup.md)。

## 环境变量

lip 从你运行它的终端里读取这些变量。

| 变量 | lip 怎么用它 |
| --- | --- |
| `WINEPREFIX` | Wine 前缀。未设置或为空时，lip 使用工作区里的 `.lip/wine`。 |
| `WINEDEBUG` | 传给 Wine。未设置时，lip 把它设为 `-all`，隐藏 Wine 的调试信息。想看这些信息，可以设成例如 `err+all`。 |
| `WINEDLLOVERRIDES` | 传给 Wine。未设置时，lip 把它设为 `mscoree,mshtml=;winemac.drv,winex11.drv=d`，关闭 Wine Mono、Wine Gecko 和 Wine 的图形驱动，使服务器无需桌面也能运行，例如通过 SSH。 |
| `LD_LIBRARY_PATH` | 用于 Linux 服务器。未设置或为空时，lip 把它设为 `.`。 |
| `XDG_CONFIG_HOME` | 用户设置所在位置：`$XDG_CONFIG_HOME/lip`。默认 `~/.config`。 |
| `XDG_CACHE_HOME` | 下载缓存所在位置：`$XDG_CACHE_HOME/lip`。默认 `~/.cache`。 |
| `XDG_DATA_HOME` | Wine 的安装位置：`$XDG_DATA_HOME/lip`。默认 `~/.local/share`。 |
| `XDG_STATE_HOME` | 界面的工作区列表所在位置：`$XDG_STATE_HOME/lip`。默认 `~/.local/state`。 |
| `XDG_RUNTIME_DIR` | 守护进程的套接字所在位置：`$XDG_RUNTIME_DIR/lip/daemon.sock`。未设置时，套接字在状态目录里。 |
| `HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`NO_PROXY` | 你的网络代理。见[系统代理](configuration.md#系统代理)。 |
| `LC_ALL`、`LC_MESSAGES`、`LANG` | 界面的语言，除非 `language` 设置已经指定了语言。 |

未设置、为空或不是绝对路径的 `XDG_` 变量会取默认值。macOS 使用与 Linux 相同的目录。

其他变量都会原样传给服务器和包的程序。

::: info
lip 的工作是在后台进程（守护进程）里完成的。这不影响哪些变量起作用：每条命令使用的都是输入它的那个终端里的变量。[托管服务器](../reference/commands/run.md#托管服务器)保留的是启动它的那个终端的变量。
:::

## 限制和已知问题

- **不支持 arm64 的 Linux。** 试过的办法都不能在那里可靠地运行 LeviLamina 服务器：[Hangover](https://github.com/AndreRH/hangover) 能运行原版服务器，但运行不了被 LeviLamina 修改过的；[box64](https://github.com/ptitSeb/box64) 下的 x64 Wine 会丢失 Windows 程序的退出码；[FEX](https://fex-emu.com/) 下的 x64 Wine 只在部分尝试中启动了 LeviLamina 服务器。
- **其他系统没有 Wine。** 在没有 lip 的 Wine 的系统上，凡是需要 Windows 程序的操作都会失败，并提示 `lip runs the server with Wine on systems other than Windows, but has no Wine for <system>. Run the server on Windows, on Linux on x64 or on macOS.`
- **第一次启动很慢。** 要下载并解压 Wine、创建前缀。之后的启动会跳过这两步。
- **文件名不区分大小写。** 在 Windows 服务器的工作区里，lip 把 `Plugins/a.dll` 和 `plugins/a.dll` 当作同一个文件，和 Wine 下的程序一样。如果文件夹里有两个只差大小写的名字，而 lip 需要的是其中唯一的一个，命令会失败。请给其中一个改名。
- **包命令里的引号。** Wine 会把 `"` 以 `\"` 的形式传给 Windows 命令行。安装命令里含有 `"` 的包，通过 Wine 可能无法正常工作。请向包的作者反馈。
- **退出码是 Wine 的。** `lip run` 以 `wine` 的退出码退出，或者以 128 加上结束它的信号编号退出。
- **会改动下载内容的代理会让校验失败。** Wine 的 SHA-256 与预期不符时，lip 会拒绝这个文件。请稍后再试，或换一个网络。
- **损坏的 Wine。** 如果连 `wine` 本身都运行不了，请删除数据目录里的 `wine/`，让 lip 重新安装。
- **旧版 lip 的文件夹。** 早期 lip 为 `linux-x64` 平台创建的工作区，如果里面只有服务器，仍然可以使用：lip 会把它读作 Linux 服务器。如果里面还有别的包，lip 会停下并说明它只为 `win-x64` 安装包。请新建一个文件夹重新安装。

这些限制背后的原因见[内部机制](../concepts/internals.md#系统依赖)。
