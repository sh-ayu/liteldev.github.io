# 安装 LeviLauncher

LeviLauncher 有 Windows 版和 Android 版，另有一个处于测试阶段的 macOS 版。下方已自动选中适合你设备的标签页。

## 需要什么

=== "Windows"

    - Windows 10 或 11。
    - 从 Microsoft Store 获得的正版 Minecraft 基岩版（GDK / UWP）。

=== "Android"

    - ARM64 设备上的 Android 9.0 或更高版本。
    - 在这台设备上从 Google Play 购买并安装的 Minecraft 基岩版 1.21.80 或更高版本。

=== "macOS"

    - Apple 芯片的 Mac，macOS 14.6 或更高版本。
    - 正版 Minecraft 基岩版。LeviLauncher 通过 Wine 运行 Windows（GDK）版游戏。

::: info iOS
LeviLauncher 没有 iOS 版，我们也没有开发 iOS 版的计划。
:::

## 安装

=== "Windows"

    1. 打开 [LeviLauncher 的最新发行版](https://github.com/LiteLDev/LeviLauncher/releases/latest)，下载 `LeviLauncher-amd64-installer.exe`。
    2. 运行它并完成安装向导。它会请求管理员权限，因为默认安装到 `Program Files`。如果它要安装 WebView2 或其他组件，让它继续。

    发行版里还有两个文件，一般用不到：

    | 文件 | 用途 |
    | --- | --- |
    | `LeviLauncher.exe` | 便携版：把它单独放进一个新建的、路径里只有英文字母的文件夹，直接运行。 |
    | `LeviLauncher.zip` | 启动器自我更新时下载的更新包。 |

=== "Android"

    1. 在设备上打开 [LeviLauncher Android 版的最新发行版](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest)，下载文件名以 `-release.apk` 结尾的文件。
    2. 打开下载的文件。如果 Android 提示浏览器不允许安装应用，点击**设置**，打开**允许来自此来源的应用**，返回后点击**安装**。

=== "macOS"

    macOS 版还在测试阶段：它在标有 **Pre-release** 的发行版里，不在最新的稳定版里。

    1. 打开 [LeviLauncher 的发行版列表](https://github.com/LiteLDev/LeviLauncher/releases)，找到最新的、带有 `LeviLauncher-macos-arm64-installer.dmg` 的发行版。
    2. 下载这个文件并打开，把 **LeviLauncher** 拖进**应用程序**。

    UWP 实例仅支持 Windows。

## 确认装好了

启动 LeviLauncher，它的窗口会打开；第一次启动时显示首次启动设置（Windows、macOS）或许可协议（Android）。

## 更新

=== "Windows"

    LeviLauncher 启动时会检查新版本并提示安装，更新在原位进行。想自己检查，打开**设置**点击**检查更新**，或运行 `LeviLauncher.exe self-update`。

=== "Android"

    LeviLauncher 发现新版本时会提示，下载它的 APK 并交给 Android 安装。如果你的网络访问不了 GitHub，从发行版列表下载新的 APK，覆盖安装即可。

=== "macOS"

    LeviLauncher 启动时会检查新版本并提示安装。

## 测试版与历史版本

每个版本的文件和更新内容都在发行版列表里：

- Windows 与 macOS：[LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- Android：[LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

**测试版**（beta）是那里标有 **Pre-release** 的发行版，例如 `v1.2.0-beta.1`。它包含下一个版本尚未完成的新内容，可能出问题。想试用，按上面的方法从它的发行版下载文件。在 Windows 上，已安装的 LeviLauncher 也可以跟随测试版：在**设置**里打开**接收测试版更新**，之后每个新的测试版都会作为更新提示。关掉它就只接收稳定版。

## 下一步

=== "Windows"

    - [在 Windows 上玩模组](https://levimc.org/zh-Hans/tutorials/play/play-with-mods/)：从刚装好的 LeviLauncher 到第一次带模组进入游戏。
    - [版本管理](/zh-Hans/guide/version-management?platform=windows)

=== "Android"

    - [在 Android 上玩模组](https://levimc.org/zh-Hans/tutorials/play/play-with-mods-android/)：从刚装好的 LeviLauncher 到第一次带模组进入游戏。
    - [版本管理](/zh-Hans/guide/version-management?platform=android)

=== "macOS"

    - [版本管理](/zh-Hans/guide/version-management)
    - [更新与故障排查](/zh-Hans/guide/update-troubleshooting)
