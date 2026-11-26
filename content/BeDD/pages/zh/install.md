# 安装 Be.D.D.

Be.D.D. 是一个 Windows 程序 `BeDD.exe`，加上它放进自己那些游戏副本里的模组。只有跑测试的电脑需要装它。它不是 lip 包，也不在 LeviMC Mods 上。

## 需要什么

- Windows 10 或 11，x64。
- [LeviLauncher](https://levimc.org/zh-Hans/LeviLauncher/install) **1.1+**，装有 Minecraft 基岩版 **1.26.60**（GDK 正式版）实例，实例里有 LeviLamina **26.60.x**（[用哪个实例](/zh/guide/installs#用哪个实例)）。Be.D.D. 复制这个实例，从不修改或启动它。

不需要 PowerShell、lip 或 .NET 运行时。

## 安装

从[最新发行版](https://github.com/LiteLDev/BeDD/releases/latest)下载 `bedd-windows-x64-setup.exe` 并运行。它不需要管理员权限：为当前用户安装到 `%LOCALAPPDATA%\Programs\BeDD`，在开始菜单里加一个 **BeDD** 项，并把这个文件夹加进 `PATH`。

发行版里还有两个文件：

| 文件 | 什么时候用 |
|---|---|
| `bedd-windows-x64.zip` | 解压到任何地方都能用：在它的文件夹里运行 `BeDD.exe`。适合让测试框架自己下载 Be.D.D.（[让测试框架自己下载](/zh/guide/installs#让测试框架自己下载)）。 |
| `bedd-windows-x64.msi` | 用 `msiexec /i bedd-windows-x64.msi /qn` 静默安装，适合受管理的电脑和 CI。 |

## 确认装好了

打开一个**新的**终端，运行：

```powershell
BeDD.exe version
```

你应该看到 `Be.D.D. 0.4.0`（或更新），以及它驱动的游戏版本和 LeviLamina 版本。

## 更新

运行新版安装程序；它会关掉开着的管理窗口及其游戏。下一次 `launch` 会替换每个克隆里的模组：见[升级](/zh/guide/installs#升级)。

## 其他版本

所有发行版都在[发行版列表](https://github.com/LiteLDev/BeDD/releases)里。每个版本驱动一个游戏版本，写在它的说明里。在 CI 里，把版本固定在下载地址里：`https://github.com/LiteLDev/BeDD/releases/download/v0.4.0/bedd-windows-x64.zip`。

## 卸载

设置 > 应用 > 已安装的应用 > **BeDD**。想连克隆、存档和日志一起删，见[卸载](/zh/guide/installs#卸载)。

## 下一步

- [用 Be.D.D. 驱动游戏客户端](https://levimc.org/zh-Hans/tutorials/automate/bedd/)：装好基础游戏，在后台启动一个游戏，跑第一个脚本。
- [驱动游戏](/zh/guide/usage)和[多开](/zh/guide/several-games)。
