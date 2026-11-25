# 开你的第一个服务器

学完这篇教程，你的电脑上会有一个装好 LeviLamina（运行模组所需的加载器）的 Minecraft 基岩版专用服务器（BDS），它有自己单独的文件夹。安装、启动、发命令、停止，全部在 LeviMC 的包管理器 `lip` 的界面里完成，除了 `lip` 本身不用输入任何命令。

整个过程大约十分钟，大部分时间在等下载。

## 你需要准备

- 一台装有以下系统之一的电脑：
  - Windows 10、Windows 11 或 Windows Server 2019 及更高版本，x64 或 arm64。
  - macOS，Apple 芯片或 Intel。
  - x64 的 Linux。

  在 macOS 和 Linux 上，`lip` 通过 Wine 运行 Windows 服务器，Wine 由它自己安装。
- 一个终端：Windows 上用 Windows 终端或 PowerShell，macOS 上用“终端”，Linux 上用桌面自带的终端。宽度最好不少于 80 个字符。
- 网络连接。`lip` 从 minecraft.net 下载游戏，从 GitHub 下载 LeviLamina。

不需要事先安装别的东西：不用装 .NET、Git、Visual C++ 运行库，也不用装 Wine。服务器需要的组件由 `lip` 安装。

## 1. 安装 lip

选择你的系统。页面已经选好了你正在用的那个。


:::: tabs

== Windows

1. 打开 [lip 的最新发行版](https://github.com/LiteLDev/lip/releases/latest)，下载 `lip-<version>-win-x64.msi`；ARM 处理器的电脑下载 `lip-<version>-win-arm64.msi`。
2. 运行这个文件。安装程序会询问把 `lip` 装到哪个文件夹（默认是 `C:\Program Files\lip`），点击 **Install** 并允许 Windows 进行更改后开始安装，并把这个文件夹加入 `PATH`。
3. 打开一个**新的**终端窗口。安装前就开着的终端还不知道新的 `PATH`。
4. 查看 `lip` 的版本：

   ```shell
   lip -v
   ```

   你应该看到一个版本号，例如 `0.42.0`。如果终端说不认识 `lip`，关掉它，重新打开一个。

== macOS / Linux

1. 打开终端（Mac 上是“应用程序” › “实用工具”里的“终端”），运行：

   ```shell
   curl -fsSL https://levimc.org/lip/install.sh | sh
   ```

   这个脚本从最新发行版下载适合你的系统的 `lip`，用发行版的 SHA-256 校验和检查它，然后放进 `~/.local/bin`。不需要管理员密码，也不需要 root。如果 `~/.local/bin` 还不在 `PATH` 里，它会询问是否加进去。
2. 打开一个**新的**终端窗口。安装前就开着的终端还不知道新的 `PATH`。
3. 查看 `lip` 的版本：

   ```shell
   lip -v
   ```

   你应该看到一个版本号，例如 `0.42.0`。如果终端说不认识 `lip`，关掉它，重新打开一个。

Apple 芯片的 Mac 通过 Rosetta 2 运行 `lip` 的 Wine。如果还没有安装 Rosetta 2，`lip` 会在第一次安装或启动服务器时询问是否安装它。安装即表示接受 Apple 的 Rosetta 2 许可协议。如果安装失败，`lip` 会给出手动安装 Rosetta 2 的命令：`softwareupdate --install-rosetta --agree-to-license`。

::: details 不用脚本：压缩包
从[最新发行版](https://github.com/LiteLDev/lip/releases/latest)下载适合你的系统的压缩包：`lip-<version>-osx-arm64.zip`（Apple 芯片的 Mac）、`lip-<version>-osx-x64.zip`（Intel 的 Mac）或 `lip-<version>-linux-x64.tar.xz`（Linux），解压到 `PATH` 里的某个文件夹：

```shell
mkdir -p ~/.local/bin
unzip lip-<version>-osx-arm64.zip -d ~/.local/bin        # macOS（或 osx-x64）
xattr -d com.apple.quarantine ~/.local/bin/lip           # macOS
tar -xJf lip-<version>-linux-x64.tar.xz -C ~/.local/bin  # Linux
```

在 macOS 上，`xattr` 那一行去掉 macOS 给浏览器下载的文件加上的隔离标记；不去掉的话，macOS 会拒绝运行 `lip`。如果 `~/.local/bin` 不在 `PATH` 里，把 `export PATH="$HOME/.local/bin:$PATH"` 这一行加进 `~/.zshrc`（macOS）或 `~/.profile`（Linux），然后打开一个新终端。之后同样用 `lip -v` 检查。
:::

::::

## 2. 启动 lip

1. 建一个文件夹用来放你的服务器，进入它，然后启动 `lip`。本教程用的是 `D:\servers`：

   ::: code-group

   ```powershell [Windows]
   mkdir D:\servers
   cd D:\servers
   lip
   ```

   ```shell [Linux 和 macOS]
   mkdir -p ~/servers
   cd ~/servers
   lip
   ```

   :::

2. 你应该看到 `lip` 的「主页」。顶栏显示 `lip` 所在的文件夹 `D:\servers`。左边是列出 `lip` 各个页面的侧边栏；右边是概览，说这个文件夹里还没有游戏，下面是四个**下一步**。第 1 步**选择工作区**已经打上了勾：`lip` 就在你启动它的文件夹里工作。

   ![lip 在空文件夹 D:\servers 里的主页。侧边栏列出八个页面，概览显示尚未安装游戏，第 1 步“选择工作区”已打勾。](https://levimc.org/lip/screenshots/zh-Hans/first-server-01-home.svg)

   你只需要几个键：`↑` 和 `↓` 移动，`Enter` 打开或确认，`Esc` 返回。最下面一行始终列出此刻可用的按键。

::: details lip 提示“无法连接 GitHub”
LeviLamina 来自 GitHub。`lip` 连不上时会问你怎么办：有 GitHub 代理的网址就选**使用代理**；网络其实连得上 GitHub 就选**直接连接**；选**以后再说**则下次启动时再问。连不上 GitHub，`lip` 就下载不了 LeviLamina。这个回答可以随时在「设置」页面修改。
:::

## 3. 创建服务器

1. 每个服务器都应该有自己的文件夹，所以先建一个。按 `↑` 选中**选择工作区**，按 `Enter`。「工作区」列表打开，里面有 `D:\servers`，前面的 **●** 表示它是 `lip` 现在所在的文件夹。
2. 按 `Tab` 移到**添加文件夹…**，按 `Enter`。

   ![主页上方的“工作区”列表：“添加文件夹…”一行，下面是带圆点的 D:\servers。](https://levimc.org/lip/screenshots/zh-Hans/first-server-02-where.svg)

3. 文件夹浏览器在 `D:\servers` 打开。按 `Tab` 移到按钮上，按 `→` 移到**新建文件夹…**，按 `Enter`。输入 `survival`，按 `Enter`。`lip` 会创建 `D:\servers\survival` 并打开它。

   ![“添加文件夹”浏览器停在 D:\servers，里面只有“..”。下面是“选择此文件夹”“新建文件夹…”和“取消”三个按钮。](https://levimc.org/lip/screenshots/zh-Hans/first-server-03-folder.svg)

4. 按 `←` 移到**选择此文件夹**，按 `Enter`。`lip` 把这个文件夹加入列表，从此就在它里面工作：你回到了「主页」，顶栏显示 `D:\servers\survival`，**安装服务器**已被选中。

   ![D:\servers\survival 里的主页：顶栏显示这个文件夹，概览显示尚未安装游戏，第 2 步“安装服务器”已被选中。](https://levimc.org/lip/screenshots/zh-Hans/first-server-04-home-folder.svg)

5. 按 `Enter`。「服务器」页面打开，并询问**游戏版本**。最新的版本在最上面。选中标有 **LeviLamina ✓** 的最新版本（标有**无 LeviLamina** 的版本不能运行模组），按 `Enter`。

   ![服务器页面上的“游戏版本”对话框列出八个版本，大多数标有“LeviLamina ✓”。第一个 1.26.60 已被选中。](https://levimc.org/lip/screenshots/zh-Hans/first-server-05-game-version.svg)

   在 Linux 上，如果这个版本也有 Linux 服务器，`lip` 接下来会问**构建**：选 **windows**，能运行 LeviLamina 的是它。

6. 选择**加载器**：保持选中最新的 LeviLamina，按 `Enter`。
7. 动手之前，`lip` 先给出计划：以 `Dry run:` 开头的几行说明它将安装游戏（`bds`）和 LeviLamina。在**应用**上按 `Enter`。

   ![“安装服务器”对话框，有三行以“Dry run:”开头的文字，以及“应用”和“取消”两个按钮。](https://levimc.org/lip/screenshots/zh-Hans/first-server-07-plan.svg)

8. 到图中的网址阅读《Minecraft 最终用户许可协议》和《Microsoft 隐私政策》。要接受它们，在**接受**上按 `Enter`。如果拒绝，就什么都不会安装。
9. 等 `lip` 下载并安装。第一次使用时，它可能还会安装 Microsoft Visual C++ 可再发行程序包（Windows 会请你允许），在 Linux 和 macOS 上则是 Wine。
10. 你应该看到 **✓ 完成。** 在**确定**上按 `Enter`。「服务器」页面现在显示 **○ 未运行**：服务器已经装好，**启动**按钮可以启动它。

    ![安装之后的服务器页面：“○ 未运行”，“启动”按钮、“自动重启”复选框、“更改版本…”按钮，还没有输出。顶栏显示 D:\servers\survival。](https://levimc.org/lip/screenshots/zh-Hans/first-server-11-workspace.svg)

## 4. 启动服务器

1. 回到「主页」：按 `Esc` 移到侧边栏，按 `↑` 移到**主页**，再按 `Enter`。概览里已经有了游戏和 LeviLamina，**安装服务器**打上了勾。

   ![D:\servers\survival 里的主页：已安装游戏 1.26.60 和 LeviLamina 26.60.3；第 1、2 步已打勾，第 3 步“安装模组”已被选中。](https://levimc.org/lip/screenshots/zh-Hans/first-server-12-home-server.svg)

2. 现在选中的是**安装模组**。这一步先跳过：按 `↓` 选中**启动服务器**，再按 `Enter`。
3. `lip` 启动服务器，并显示「服务器」页面。等输出里出现 `Server started.` 这一行。带 `[LeviLamina]` 的几行说明加载器在工作。

   ![服务器运行时的服务器页面。输出显示 LeviLamina 正在加载、端口 19132 和 19133，以及“Server started.”，下面是输入行。](https://levimc.org/lip/screenshots/zh-Hans/first-server-21-running.svg)

   在 Windows 上，防火墙可能会问是否允许服务器访问网络。想让其他设备连进来，就允许它访问专用网络，见[让朋友连上你的服务器](let-friends-join.md)。

4. 给服务器发一条命令：在最下面的输入行里输入 `list`，按 `Enter`。你应该看到回答 `There are 0/10 players online:`。在这里输入服务器命令不用加开头的 `/`。

想在同一台电脑上用 Minecraft 进去玩，就添加一个服务器，地址填 `127.0.0.1`，端口填 `19132`。

## 5. 停止服务器

1. 在「服务器」页面按 `Ctrl+C`。`lip` 向服务器发送 `stop` 命令，等它保存好世界。
2. 你应该看到第一行变成**已退出，退出码 0**：服务器正常结束了。**启动**按钮可以再次启动它。
3. 要离开 `lip`，按 `Esc` 直到回到侧边栏，再按一次 `Esc`，然后选**退出**。

下次在 `D:\servers\survival` 里启动 `lip` 即可。在别的文件夹里启动时，`lip` 也记得你的服务器：在「主页」的**选择工作区**上按 `Enter`，再在列表里的 `D:\servers\survival` 上按 `Enter`，然后选**切换**。

## 你现在有了什么

- 文件夹 `D:\servers\survival`，里面有游戏和 LeviLamina。它就是个普通文件夹：可以备份，也可以挪走。
- 一个在 `lip` 的「服务器」页面上启动和停止的服务器。

::: warning 改动之前先停止服务器
服务器运行期间，`lip` 不会在它的文件夹里安装、更新或移除任何东西，也不会保存 `server.properties`、白名单和权限。
:::

## 下一步

- 给服务器装模组：[给服务器安装模组](install-mods.md)。
- 让其他玩家连进来：[让朋友连上你的服务器](let-friends-join.md)。
- 用命令做同样的事，适合脚本和远程机器：[用命令行开服](command-line.md)。
- 修改服务器名称、游戏模式或玩家人数：[游戏配置](https://levimc.org/zh-Hans/lip/interface/game_config.html)。
- 让服务器崩溃后自动重启：[服务器](https://levimc.org/zh-Hans/lip/interface/server.html)。
- 再开一个服务器：[工作区](https://levimc.org/zh-Hans/lip/interface/workspaces.html)。更换游戏或 LeviLamina 版本：[服务器](https://levimc.org/zh-Hans/lip/interface/server.html)页面上的**更改版本…**。
- 系统地了解界面的每个页面：[界面导览](https://levimc.org/zh-Hans/lip/interface/tour.html)。
- `lip` 怎样在 Linux 和 macOS 上运行 Windows 服务器：[Linux 与 macOS](https://levimc.org/zh-Hans/lip/guides/linux_macos.html)。
- 出了问题：[lip 故障排查](https://levimc.org/zh-Hans/lip/guides/troubleshooting.html)和 [LeviLamina 问题排除](https://levimc.org/zh-Hans/faq/server/levilamina/errors/)。
