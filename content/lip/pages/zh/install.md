# 安装 lip

`lip` 是一个独立的程序，不需要先装别的东西：不用 .NET，不用 Git，也不用 Wine。在下面选你的系统，然后确认它能运行。

## 需要什么

- x64 或 ARM64 上的 Windows 10、Windows 11 或 Windows Server 2019 及以上；Apple 芯片或 Intel 的 macOS；或 x64 的 Linux。没有 ARM64 Linux 版的 `lip`。每种系统上服务器能做什么，见 [lip 能在哪里运行](index.md#lip-能在哪里运行)。
- 一个终端：Windows 上的 Windows 终端或 PowerShell，macOS 上的“终端”，Linux 上桌面自带的终端。
- 能上网。

## 安装

选你的系统。页面已经按你正在用的系统选好了。

:::: tabs

== Windows

1. 打开 [lip 的最新发行版](https://github.com/LiteLDev/lip/releases/latest)，下载 `lip-<version>-win-x64.msi`；ARM 处理器的电脑下载 `lip-<version>-win-arm64.msi`。
2. 运行这个文件。它把 `lip` 装到 `%LOCALAPPDATA%\Programs\lip`，并把这个文件夹加进你的 `PATH`，不需要管理员权限。如果 `lip` 已经为所有用户安装过（早期版本装在 `C:\Program Files\lip`），它会更新那一份，这时需要管理员权限。

::: details 不用安装程序：压缩包
从同一个发行版下载 `lip-<version>-win-x64.zip`（或 `win-arm64`），把 `lip.exe` 解压到你选的文件夹，再把这个文件夹加进 `PATH`。安装程序不能用或失败时用这种方式。
:::

== macOS / Linux

在终端中运行：

```shell
curl -fsSL https://levimc.org/lip/install.sh | sh
```

这个脚本会：

1. 选出适合你的系统的 `lip`：Apple 芯片的 Mac 用 `osx-arm64`，Intel 的 Mac 用 `osx-x64`，x64 的 Linux 用 `linux-x64`。在其他系统上它会停止；
2. 从 GitHub 下载最新发行版中的这个文件，并用发行版的 `SHA256SUMS` 检查它。校验不一致的文件不会被安装；
3. 把 `lip` 放进 `~/.local/bin`，替换那里已有的 `lip`；
4. 如果这个文件夹不在 `PATH` 里，询问是否把它加进你的 shell 的配置文件。

它不需要 root，也不需要管理员密码，除了这个文件夹和配置文件，不会改动任何东西。

下面这些变量可以改变脚本的行为。把它们设置给 `|` 后面的 `sh`：

```shell
curl -fsSL https://levimc.org/lip/install.sh | LIP_VERSION=0.42.0 sh
```

| 变量 | 脚本怎样使用它 |
| --- | --- |
| `LIP_VERSION` | 安装这个版本（例如 `0.42.0`），而不是最新版。 |
| `LIP_INSTALL_DIR` | 把 `lip` 安装到这个文件夹（绝对路径），而不是 `~/.local/bin`。 |
| `LIP_GITHUB_PROXY` | 通过这个 GitHub 代理从 GitHub 下载，与 `lip` 的设置 [`github_proxy`](guides/configuration.md#github-proxy) 相同：代理的地址，然后是 `/`，然后是 GitHub 上的地址。 |
| `LIP_NO_MODIFY_PATH` | 为 `1` 时，从不修改 shell 的配置文件，而是输出需要加进去的那一行。 |

Apple 芯片的 Mac 通过 Rosetta 2 运行 `lip` 的 Wine。`lip` 第一次部署或启动服务器时会询问是否安装它：见 [Linux 与 macOS](guides/linux_macos.md#apple-芯片的-macos)。

::: details 不用脚本：压缩包
从[最新发行版](https://github.com/LiteLDev/lip/releases/latest)下载你的系统对应的压缩包：`lip-<version>-osx-arm64.zip`（Apple 芯片的 Mac）、`lip-<version>-osx-x64.zip`（Intel 的 Mac）或 `lip-<version>-linux-x64.tar.xz`（Linux）。把它解压到 `PATH` 里的某个文件夹：

```shell
mkdir -p ~/.local/bin
unzip lip-<version>-osx-arm64.zip -d ~/.local/bin        # macOS（或 osx-x64）
xattr -d com.apple.quarantine ~/.local/bin/lip           # macOS
tar -xJf lip-<version>-linux-x64.tar.xz -C ~/.local/bin  # Linux
```

在 macOS 上，`xattr` 那一行去掉 macOS 给浏览器下载的文件加上的隔离标记；不去掉的话，macOS 会拒绝运行 `lip`。如果 `~/.local/bin` 不在 `PATH` 里，把 `export PATH="$HOME/.local/bin:$PATH"` 加进 `~/.zshrc`（macOS）或 `~/.profile`（Linux）。
:::

::::

## 确认装好了

打开一个**新的**终端窗口：之前就开着的终端还不知道新的 `PATH`。然后查看 `lip` 的版本：

```shell
lip -v
```

你应该看到一个版本号，例如 `0.44.0`。如果终端说不认识 `lip`，关掉它再开一个新的。

## 更新

```shell
lip self-update
```

`lip` 按它当初的安装方式安装最新发行版：Windows 上用安装程序，其他情况原地替换。`lip self-update --check` 只告诉你有没有新版本。见 [`lip self-update`](reference/commands/self_update.md)。

## 其他版本

所有发行版和每个系统的文件都在[发行版列表](https://github.com/LiteLDev/lip/releases)。想装其中某一个，在那里下载它的文件，或者给安装脚本传 `LIP_VERSION`。`lip` 目前没有 beta 通道；如果那里有标着“Pre-release”的版本，`lip self-update` 只会把它提供给本身就是预发布版的 `lip`。

## 下一步

- [开你的第一个服务器](https://levimc.org/zh-Hans/tutorials/server/first-server/)：在 `lip` 的界面里，从一个空文件夹到一个带 LeviLamina 的运行中的服务器。
- [用命令行开服](https://levimc.org/zh-Hans/tutorials/server/command-line/)：用 `lip setup`、`lip install` 和 `lip run` 做同样的事。
- [界面导览](interface/tour.md)和[管理包](guides/managing_packages.md)。
