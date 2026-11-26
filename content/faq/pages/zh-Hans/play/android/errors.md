# Android 版 LeviLauncher 的报错与崩溃

## 安卓 LeviLauncher 提示未安装/找不到 Minecraft（或换成改包 APK 后找不到主程序），怎么解决？

启动器本身不包含游戏，而是加载手机上已安装的官方 Minecraft（包名 `com.mojang.minecraftpe`）。若提示“未安装 Minecraft…请先从 Google Play 商店安装”或“非正版MC”，请按以下步骤排查：

1. 确认已从 Google Play 安装官方 Minecraft 并更新至 1.21.80 或更高版本，然后重新打开 LeviLauncher。
2. 切勿用注入了光影、MBL2 等的改包 APK 替换游戏本体。改包或非 Google Play 渠道安装的 MC 均无法通过验证，需卸载后从 Google Play 重新安装原版并启动一次，同时将启动器更新至最新版。所需功能直接用启动器导入原生模组（`.so` / `.levipack`）即可，无需改包。
3. 若已安装 Google Play 正版却仍检测不到，请检查系统是否限制了 LeviLauncher 读取已安装应用列表（部分国产 ROM 设有“获取应用列表”类权限开关），开启该权限后重试。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## Flarial 客户端从 Google Play 下架又上架后，把它的 .so 导入 LeviLauncher 安卓版，启用某些模块就闪退，为什么？

新版 Flarial 加入了包名校验，在 LeviLauncher 中运行会触发校验而闪退。必须修改或移除包名校验，或者改用从旧版 Flarial 提取的 `.so`。这属于第三方客户端行为，LeviLauncher 官方不提供支持。

*适用版本：Flarial 重新上架后的版本；LeviLauncher-Android 当前版本。未能从源码或文档中直接证实，仅供参考。*

## 安卓 LeviLauncher 中使用 BedrockTools mod 后，放置或打开潜影盒、铁砧、工作台、箱子等带 UI 的功能方块时闪退怎么办？

这是该 mod 签名不匹配所致（出现于 MC 26.50），mod 作者已发布修复版，更新 BedrockTools 即可解决。更新前也可临时将触控方式改为“摇杆 + 准星”模式来规避。

*适用版本：MC 26.50 时期的旧版 BedrockTools。未能从源码或文档中直接证实，仅供参考。*

## 安卓 LeviLauncher（原 LeviLaunchroid）下载游戏时进度卡住不动（如卡在 15%），怎么办？

这通常是网络问题，开启代理即可正常下载。同时请确认启动器是从官方 GitHub（<https://github.com/LiteLDev/LeviLauncher-Android/releases>）下载的最新版。自 v1.7.0 起，游戏改为通过 Google Play 下载（需登录已购买 Minecraft 的 Google 账号），无法直连 Google 的网络环境必须使用代理。下载支持断点续传，中断后点击“重试”即可继续。

*适用版本：LeviLauncher-Android；v1.7.0 起下载来源为 Google Play。未能从源码或文档中直接证实，仅供参考。*

## 安卓版 LeviLauncher 游戏崩溃后，崩溃日志（tombstone xcrash 文件）在哪里？

崩溃日志位于 `/storage/emulated/0/Android/media/org.levimc.launcher/crash_logs/` 目录下，文件名形如 `tombstone_xxx__org.levimc.launcher.native.xcrash`。若该目录不可写，启动器则会保存到 `Android/data/org.levimc.launcher/files/crash_logs/`。可用 MT 管理器等文件管理器前往该路径导出文件（或直接使用崩溃界面的分享功能），发送给开发者或附在 <https://github.com/LiteLDev/LeviLauncher-Android/issues> 中协助排查。

*适用版本：LeviLauncher-Android 当前版本（v1.7.1）*
