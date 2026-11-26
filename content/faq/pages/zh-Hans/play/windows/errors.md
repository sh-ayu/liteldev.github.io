# Windows 版 LeviLauncher 的报错与崩溃

## 在 LeviLauncher（PC）中使用 BetterRenderDragon（更好的渲染龙）后游戏闪退、白屏、不生效或进世界画面异常，怎么排查？

BetterRenderDragon 是第三方 preload 类模组（目前由 QYCottage 分支维护：<https://github.com/QYCottage/BetterRenderDragon/releases>）。启动器已不再内置该模组，需作为普通模组自行导入。请按以下顺序排查：

1. 确认 BetterRenderDragon 版本与游戏版本匹配（Release 说明中列有适配的游戏版本）。
2. 若版本匹配但一启动就闪退，请改用 no-imgui 版本（无左上角 UI），通常能解决多数闪退问题。AMD 显卡（A 卡）和部分 NVIDIA 显卡（N 卡）设备存在兼容性问题。
3. 排查模组冲突：已知该模组与小地图 mod、4dskin、BetterResourcePackManager 等同时使用可能导致崩溃或失效。请逐个禁用其他模组进行排查，同时查看启动器日志。
4. 解决白屏或画面异常：关闭显卡驱动中的帧生成、AI 帧生成、驱动叠加层，以及任何其他会修改游戏画面的程序。
5. 如果进入世界后画面异常，也可能是光影包未适配当前游戏版本，或误用了安卓版光影包。请换用适配当前游戏版本的 Windows 版渲染龙光影包。

*适用版本：LeviLauncher 1.0.0 及以上（PC）。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 的“注册到系统”有什么用？注册失败（无法注册 appx）怎么解决？

“注册”是指将启动器安装的游戏版本注册为系统的 Minecraft 应用包（会替换当前已注册的微软商店版本）。部分不支持自定义版本检测的客户端（如 Onix）必须在已注册的版本上运行，双击导入 `.mcpack` 等操作也依赖已注册的版本。

注册失败最常见的原因是未开启 Windows 开发者模式（报错 `ERR_DEV_MODE_REQUIRED`、`ERR_UWP_DEVELOPER_MODE` 或 `0x80073CFF` 等）。前往 Windows 设置 > 系统 > 开发者选项，打开「开发者模式」后重试，或直接运行 `LeviLauncher.exe doctor --fix developer-mode`。

若报错 `ERR_UWP_PACKAGE_CONFLICT`，说明存在启动器以外的 Minecraft 安装（例如其他启动器注册的版本）占用了注册名额，需先卸载该版本或取消其注册。

新版启动器的注册失败弹窗会列出可能的原因，并提供打开日志文件夹的按钮。对于已注册的实例，可运行 `LeviLauncher.exe instance unregister` 取消注册。新版已不再需要安装 Microsoft GDK 开发套件。注意：请通过启动器启动游戏，不要直接双击安装目录中的游戏文件。

*适用版本：LeviLauncher（Windows）1.1.0 及以上*

## Windows 版 LeviLauncher 安装游戏后（没装任何 mod）点启动就报 `ERR_LAUNCH_GAME` 或无法启动，换版本也一样，怎么办？需要哪些依赖？

以下方法适用于 GDK 版基岩版（其中 `doctor` 和 `self-update` 为 1.1.0 版本的现行 CLI 命令）。请按顺序排查：

1. 确认 LeviLauncher 已是最新版。启动器支持自动更新，也可运行 `LeviLauncher.exe self-update` 手动更新；旧版报错时直接更新即可，无需重装。
2. 运行 `LeviLauncher.exe doctor` 检查系统依赖，包括 Visual C++ 运行库、GameInput、Gaming Services（GDK 版必需）等。运行 `LeviLauncher.exe doctor --fix` 可自动修复 VC 运行库和 GameInput（需管理员权限确认）；Gaming Services 则需从微软商店安装（<ms-windows-store://pdp/?ProductId=9MWPM2CQNLHN>）。
3. 最有效的解决办法（尤其常见于重装系统后）：先在微软商店或 Xbox App 中安装一次原版基岩版并成功启动。商店会自动补全 Xbox App、Gaming Services 等依赖，完成后即可卸载商店版。同时请在微软商店中更新 Xbox App。
4. LTSC 或精简版系统可能缺失微软商店和 Gaming Services。请参考 <https://www.mcappx.com/help/gdk-install/#windows> 手动安装 Gaming Services，安装后保持联网并重启电脑。
5. 开启网络代理可能导致微软商店卡住，建议关闭代理，或将包含 `microsoft`、`bing` 的域名设为直连。
6. 若问题依旧，可删除该游戏实例并重新下载安装。如仍无法解决，请运行 `LeviLauncher.exe play -v` 获取详细日志，并附上日志前往 GitHub Issues 反馈。

注意：仅安装 DirectX 或 .NET Framework 无法解决此问题。

*适用版本：LeviLauncher（Windows）1.x*

## LeviLauncher 启动 GDK 版 Minecraft 时提示缺少 Gaming Services（游戏服务）或检测失败，微软商店装不上或系统是 LTSC 没有商店，怎么办？

适用于 GDK 版基岩版。

1. 确认安装状态：打开 PowerShell（不要用 cmd）运行 `Get-AppxPackage -Name Microsoft.GamingServices`，若有输出则代表已安装；也可运行 `LeviLauncher.exe doctor` 查看 `gaming-services` 的检查结果。运行 GDK 版必须具备 VC 运行库、GameInput、Xbox 应用和 Gaming Services。
2. 若未安装，请按启动器弹窗引导操作，或直接从微软商店安装 Gaming Services（<ms-windows-store://pdp/?ProductId=9MWPM2CQNLHN>）。
3. LTSC 或精简版系统通常缺少 Microsoft Store、App Installer 和 Xbox 组件。可将商店应用链接粘贴至 <https://store.rg-adguard.net/> 下载 appx/msixbundle 包，再用 PowerShell 的 `Add-AppxPackage` 命令安装；也可从 MCAPPX 下载 Xbox Gaming Services 等缺失组件（下载地址：<https://www.mcappx.com/download/xbox-gaming-services/>，安装教程：<https://www.mcappx.com/help/gdk-install/#windows>）。此外，LTSC 系统默认禁用 Xbox 相关服务，需在系统“服务”中将其设为自动启动。对于新手，更建议直接更换为完整版 Windows。
4. 若怀疑系统组件异常，可运行 `sfc /scannow` 进行修复。
5. 若确认已安装但启动器仍误报，可在提示弹窗中选择忽略并继续启动（该检测不再强制退出程序）。如果仅使用 UWP 实例，启动器不会检查 Gaming Services。

*适用版本：LeviLauncher（Windows）1.x*

## PC 版 LeviLauncher 双击后闪退或没反应（界面出现前就退出，任务管理器里也没有进程），怎么排查？

日志路径自 v1.1.0 起已变更。请按以下步骤排查：

1. 检查运行库：启动器在启动时会检测 Visual C++ 2015-2022 x64 运行库和 WebView2 Runtime，若缺失会弹窗提示下载。若检测通过仍闪退，通常是运行库损坏或版本过旧。请下载安装最新版 VC++ x64（<https://aka.ms/vc14/vc_redist.x64.exe>），并重新安装 Microsoft Edge WebView2 Runtime（实际案例中，有时存在注册表残留导致 WebView2 安装程序误报“已安装”，覆盖重装即可解决）。请勿卸载 Edge 或 WebView2。
2. 查看日志：若启动器在主界面出现前崩溃，会将日志写入 `%LOCALAPPDATA%\LeviLauncher\Logs\startup.log`（v1.1.0 之前的旧版本位于 `%APPDATA%\levilauncher.exe\logs\startup.log`）。求助或提交 Issue 时，请直接上传该日志文件，不要发截图。
3. 查看调试输出：在命令行中运行 `LeviLauncher.exe --debug`（也支持 `/debug` 或 `-debug`），或在快捷方式属性的“目标”末尾加上 ` /debug`，即可打开控制台查看实时输出。
4. 命令行自检（v1.1.0 起支持，不依赖 WebView2）：运行 `LeviLauncher.exe doctor` 检查 VC++ 运行库、GameInput、Gaming Services、WebView2 等组件状态；运行 `LeviLauncher.exe doctor --fix vcruntime` 可直接修复运行库。
5. 若以上方法均无效，曾有用户通过 DirectX 修复工具“检测并修复”运行库，或在管理员 CMD 中将 EventLog 和任务计划（schedule）服务设为自动启动并重启电脑后解决（个例，仅供参考）。

*适用版本：LeviLauncher（Windows）1.1.0*

## LeviLauncher 下载完 Minecraft 后点“安装”启动器就闪退（版本文件夹已创建但为空），怎么解决？

这大概率是因为系统缺少或损坏了 Visual C++ 2015-2022 x64 运行库。请下载并安装最新版运行库：<https://aka.ms/vs/17/release/vc_redist.x64.exe>（或 <https://aka.ms/vc14/vc_redist.x64.exe>），完成后重试即可。

新版启动器在启动时会自动检测 VC++ 运行库并提示安装。自 v1.1.0 起，也可运行 `LeviLauncher.exe doctor` 进行检查，并运行 `LeviLauncher.exe doctor --fix vcruntime` 自动修复。遇到其他类似报错弹窗时，也建议优先检查 VC++ 运行库。

## 很久没玩后，LeviLauncher 里的 MC 版本全部启动即闪退（没有日志、控制台一闪而过），但官方方式启动正常，怎么办？

先通过微软商店等官方渠道启动一次 Minecraft（若无法从商店下载，可手动安装一个官方 appx 包并启动一次），之后再用 LeviLauncher 启动即可恢复正常。

开发者分析：为防止 GDK 版自动迁移并删除 UWP 数据，启动器拦截了游戏对 LocalAppData 目录的读取。由于 Minecraft 会在 LocalAppData 中保存类似登录 token 的凭证，长时间未登录需要刷新凭证时，游戏因读取不到数据就会直接闪退。此现象与是否开启版本隔离无关，当前版本的启动器依然拦截 LocalAppData。

若仍无法解决，请检查 Gaming Services（游戏服务）是否损坏：卸载或删除 Gaming Services 后重启电脑，再从微软商店重新安装；也可运行 `LeviLauncher.exe doctor` 检查 Gaming Services 状态。此类问题不会生成日志，如需深入排查，可为 Minecraft 挂载 VS 调试器。

*适用版本：LeviLauncher（Windows）0.3.x 起。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher（PC）游戏崩溃后，崩溃日志在哪里找？

以下说明适用于当前版本的 LeviLamina 客户端。安装了 LeviLamina 的游戏，其崩溃日志保存在对应游戏版本（实例）目录下的 `logs/crash` 文件夹中，文件名为 `trace_<时间>.log` 和 `minidump_<时间>.dmp`；上层 `logs` 目录下还会有 `latest.log`。注意，这并非 Minecraft 原生的崩溃日志目录。反馈问题时，请提供最新的 trace 和 minidump 文件。

启动器自身的日志位于 `%LOCALAPPDATA%\LeviLauncher\Logs`（若启动器在显示界面前就退出，请查看其中的 `startup.log`）。此外，报错对话框中也提供了直接打开日志文件夹的按钮。

*适用版本：LeviLauncher 1.1.0*

## PC 版 LeviLauncher 启动 MC 时报错（看起来像要求正版），或启动后立即崩溃，怎么处理？

适用于 GDK 实例。这不是强制正版检测。请先检查 Xbox 游戏服务（Gaming Services）、GameInput、Visual C++ 运行库等系统组件是否正常：GDK 版本必须安装 Gaming Services，若缺失或损坏，请按启动器引导前往 Microsoft Store 安装或修复；必要时，可从 Xbox App 或微软商店安装一次官方 MC 并启动一次。

也可以运行 `LeviLauncher.exe doctor` 统一检查。其中，`doctor --fix` 可修复 VC 运行库、GameInput 等组件（Gaming Services 仍需按提示前往商店页面安装）。如果组件均正常，但游戏一启动就崩溃，还需检查显卡驱动——有用户反馈重装 GPU 驱动后恢复正常。

*适用版本：LeviLauncher 1.x*

## 使用 LeviLauncher 时弹出缺失 dll / 文件缺失的错误，更新 vcredist 后仍然进不去，怎么办？

这通常是因为系统缺少 Visual C++ 运行库。目前的启动器会检测 VC 运行库并在缺失时弹窗提示，确认后会从 <https://aka.ms/vc14/vc_redist.x64.exe> 下载并运行安装程序；你也可以手动安装，或运行 `LeviLauncher.exe doctor --fix vcruntime`。

如果仍无法解决，请从微软商店安装一次原版 Minecraft，商店会补全游戏所需的系统库。要是商店版也无法运行，则说明系统本身缺库或文件损坏（例如使用了非官方精简系统镜像），需要修复或重装系统。

*适用版本：LeviLauncher 1.x*

## 在 LeviLauncher 中装了某个 mod（如去除 OreUI 的 mod）后游戏闪退，怎么回事？

是否出现该问题取决于具体的第三方 mod。请先检查 mod 列表：同时启用同一个 mod 的新旧多个版本会导致闪退，关闭旧版本即可。此外，请确认启动器下载自官方渠道（GitHub Releases / 官网），而非来路不明的修改版。

如果问题依旧，请附上崩溃日志（实例目录下的 `logs/crash`）和复现视频进行反馈。

*未能从源码或文档中直接证实，仅供参考。*

## 用 LeviLauncher 安装游戏后提示存储不足，存档、模组丢失（开启了版本隔离），曾安装过 BedrockBoot，是什么原因？

适用于同时使用 BedrockBoot 等会创建软链接的第三方工具的情况。请检查 `%APPDATA%` 下的 Minecraft Bedrock 目录。在此案例中，该目录被 BedrockBoot 改为了软链接，与 LeviLauncher 的版本隔离冲突。

你可以在 BedrockBoot 设置中关闭其版本隔离，或者卸载 BedrockBoot 并删除该软链接后再试。修改前请先备份存档。

*未能从源码或文档中直接证实，仅供参考。*

## 通过 LeviLauncher 安装的基岩版（GDK 版）从开始菜单、快捷方式或启动器都无法启动，任务管理器里进程卡住，怎么办？

适用于 GDK 实例。GDK 版基岩版依赖 Microsoft Gaming Services（Xbox 游戏服务）才能正常运行，游戏服务缺失或损坏时便无法启动。前往 Microsoft Store 更新或重装 Gaming Services 后即可恢复。

可通过启动器的引导进行检查，或在命令行运行 `LeviLauncher.exe doctor` 检查 Gaming Services、GameInput、VC 运行库等组件（Gaming Services 需按提示前往 Store 页面安装）。

*适用版本：LeviLauncher 所有版本*
