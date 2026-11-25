# 安装链接

本页说明 `lip://` 链接：链接里有什么，打开链接时 `lip` 做什么，以及 Windows 怎样知道由 `lip` 打开它们。读完后，你可以使用 [LeviMC 模组](https://levimc.org/zh-Hans/mods/)上的**用 lip 安装**按钮，也可以在自己的页面上放这样的链接。

规范性定义见协议的 [lip-uri(7)](https://github.com/LiteLDev/lip/blob/main/protocol/lip-uri.md) 页。

## 链接

```
lip://install/<module path>[?version=<version>][&variant=<variant>]
lip --uri <link>
```

例如，下面的链接安装 PLand 的变体 `headless` 的 0.26.1 版本：

```
lip://install/github.com/IceBlcokMC/PLand?version=0.26.1&variant=headless
```

| 部分 | 含义 |
| --- | --- |
| `install` | 唯一的操作。大小写不区分。 |
| `<module path>` | 包的仓库，保留大小写，例如 `github.com/LiteLDev/LegacyMoney`。它不能是 URL、本地路径或简称：`lip://install/LeviLamina` 不是有效的链接。主机 `github.com` 为小写。 |
| `version` | 版本，不带前导 `v` 的 SemVer 版本，例如 `0.26.1`。省略时为最新版本。不允许分支、标签或提交。 |
| `variant` | 变体。省略时为默认变体。 |

百分号编码的字符（`%2F`）会被解码；`+` 仍是 `+`。片段（`#…`）和其他参数会被忽略。链接超过 2048 个字符、含有 URI 不允许的字符、使用其他操作、`version` 或 `variant` 出现两次，或者其中的模块路径、版本或变体是 `lip install` 不接受的，链接就无效。

链接代表 [`lip install`](commands/install.md) 的包参数 `<module path>[#<variant>][@<version>]`：上面的链接就是 `lip install github.com/IceBlcokMC/PLand#headless@0.26.1`。

LeviLauncher 读取同样形式的 `levilauncher://` 链接；对于在客户端运行的模组，LeviMC 模组显示的是**用 LeviLauncher 安装**按钮。

## 打开链接

链接只会打开界面。在你确认之前它不会安装任何东西，也不会替你决定安装到哪里：由你决定。

`lip --uri <link>` 打开[界面](interface.md)，与单独运行 `lip` 有以下不同：

1. 链接无效，或者标准输入或标准输出不是终端时，`lip` 把消息写到标准错误并以非零代码退出。在 Windows 上，控制台只属于它自己时，它会先等你按一个键，好让你看清消息。
2. 启动 `lip` 时所在的文件夹不会加入工作区列表。选中的是列表中的最后一个工作区；列表为空时，不选中任何工作区。
3. 在其他一切之前，**从链接安装**对话框会询问是否安装这个包。它显示包、[LeviMC 模组目录](../interface/get_mods.md)对它的说明（**名称**、**作者**、**版本**、**变体**、**依赖**），以及它将**安装到**的工作区，你可以在那里更换工作区。
4. 模组目录没有收录这个模组或无法读取时，对话框会警告你，一开始高亮的选项是什么都不安装。目录中没有链接指定的版本时，它也会警告。你仍然可以安装这个包，就像 `lip install` 一样。
5. **安装…**在当前工作区执行该包的 `lip install`：你阅读计划，然后选择**应用**或**取消**，与界面中的每个操作一样（[先预览再应用](../interface/tour.md#先预览再应用)）。工作区还没有游戏时，界面会改为提议设置它的服务器。没有选中工作区时，**选择文件夹…**让你选一个。
6. 你拒绝时，什么都不会安装，界面继续运行。

`--uri` 只有作为恰好两个参数中的第一个时才是选项。`lip --uri` 的退出方式与界面相同，在第 1 步的情况下以非零代码退出。

## 在 Windows 上注册

`lip` 的 Windows Installer 包（`.msi`，见[安装 lip](../index.md#安装-lip)）在安装 `lip` 时注册 `lip` 协议，按它安装 `lip` 本身的方式，为你自己或为所有用户注册。它在 `HKEY_CURRENT_USER` 或 `HKEY_LOCAL_MACHINE` 的 `Software\Classes\lip` 下写入这些键：

| 键 | 值 | 数据 |
| --- | --- | --- |
| `Software\Classes\lip` | （默认） | `URL:lip` |
| `Software\Classes\lip` | `URL Protocol` | 空字符串 |
| `Software\Classes\lip\DefaultIcon` | （默认） | `"<directory>lip.exe",0` |
| `Software\Classes\lip\shell\open\command` | （默认） | `"<directory>lip.exe" --uri "%1"` |

`<directory>` 是安装目录，末尾带分隔符。你打开链接时，Windows 会在 `lip` 自己的控制台中启动它。卸载 `lip` 会删除这些键。

在 Linux 和 macOS 上安装 `lip` 的 `install.sh` 不注册任何协议：在那里，请在终端中运行 `lip --uri '<link>'`，或者用包参数运行 `lip install`。

## 什么都没有发生时

浏览器对**用 lip 安装**按钮没有反应时，说明 `lip` 没有安装、不是用 `.msi` 安装的，或者是不认识链接的旧版本。用 `.msi` [安装 lip](../index.md#安装-lip)，或者复制模组页面显示的 `lip install` 命令，在服务器文件夹中运行。

## 另请参阅

- [界面](interface.md)
- [命令行](cli.md)
- [lip install](commands/install.md)
- [市场](../interface/get_mods.md)
