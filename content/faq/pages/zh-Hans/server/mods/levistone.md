# LeviStone

## LeviLamina 和 Endstone 能同时使用吗？能在 LeviLamina 上运行 Endstone 插件，或在 Endstone 上运行 LL/LSE 插件吗？

不要直接同时安装这两个加载器，否则会冲突。请改用 LiteLDev 的 LeviStone（<https://github.com/LiteLDev/LeviStone>，中文说明见 `README.zh.md`）。它是一个名为 `EndstoneRuntime` 的 LeviLamina 模组，可将 Endstone 运行时作为 LL 模组运行，从而在 LeviLamina 上加载 Endstone 的 Python 插件，同时让 LL 模组和 LSE 插件照常运行。但反过来不行：Endstone 无法加载 LeviLamina 原生模组（因为 LL 依赖完整的 BDS 头文件与符号），也没有现成的兼容层来加载 LSE 插件。

*适用版本：LeviStone v0.11.15-post.1；LeviLamina `>=26.60.4 <26.70.0`*

## LeviStone（Endstone 运行时）能和 LSE 的 Python 引擎（`legacy-script-engine-python`）同时安装吗？两者有什么区别？

据维护者说明，两者的 Python 运行时不能共存。同时安装会导致 LSE Python 加载报错或崩溃，只能二选一；如果用不到 LSE Python 插件，直接卸载 LSE Python 引擎即可。两者的区别在于：LeviStone 运行的是 Endstone 插件（`.whl` 包，可方便地依赖第三方 Python 库），而 LSE Python 运行的是 LSE API 风格的插件。此外，加载的脚本引擎越多，服务器开销越大。当前版本未见修复说明。

*适用版本：LeviStone 0.10.x 起。未能从源码或文档中直接证实，仅供参考。*

## LeviStone 支持哪些 Endstone 插件？能运行 Endstone 的 C++（native）插件吗？Endstone 插件怎么装，能用 lip 装吗？

LeviStone 只支持用 Python 编写的 Endstone 插件，不支持原生（C++/native）插件。这是因为两者的内存分配器（memory operator）等底层实现不同，且原生插件常带有 hook，强行加载容易崩溃；如果确实需要，不如直接做成 LL 模组。LeviStone 本身通过 pip 安装（`pip install levistone --target mods/EndstoneRuntime`），不能用 lip 安装。安装 Endstone 插件时，把对应平台和 Python 版本的 `.whl` 文件放进服务端的 `plugins/` 文件夹即可（也可以用 pip 安装）。

*适用版本：LeviStone 0.11.x*

## LeviStone、Endstone、Endweave 分别是什么关系？装 LeviStone 能让 LeviLamina 支持更新版本的客户端吗？

Endstone 是另一个 BDS 插件加载器，提供 Bukkit 式的稳定封装 API。LeviStone 是 LeviLamina 模组（`EndstoneRuntime`），用于在 LL 上运行 Endstone 运行时，从而加载 Endstone 的 Python 插件（不支持 C++ 插件），同时不影响 LL 模组照常运行。Endweave 则是一个 Endstone 插件，通过在网络层改写数据包，让不同协议版本的客户端进入服务器（类似 ViaVersion/Glacie），而服务端本身的版本保持不变。因此，实现跨版本进服的组合是 LL + LeviStone + Endweave。Docker 用户可直接使用 <https://github.com/LiteLDev/docker-levistone-server>。注意，Endweave 只支持在其 README 表格所列的协议版本之间转换（当前为 26.40–26.60），且 LeviStone 版本必须与 LeviLamina 版本匹配。

*适用版本：LeviStone 0.11.15；LeviLamina 26.60.x；Endweave 0.5.0 及以上*

## 如何在 LeviLamina 上安装 LeviStone 来运行 Endstone 插件？Endstone 插件放在哪？有什么限制？

在已安装 LeviLamina 的 BDS 目录下执行：

```shell
pip install levistone --target mods/EndstoneRuntime
```

如需安装指定版本，可执行 `pip install levistone==0.11.15 --target mods/EndstoneRuntime`（版本列表见 PyPI）。0.11.15 之前的旧版本需安装到 `plugins/EndstoneRuntime`。LeviStone 版本必须与 LeviLamina 版本匹配（对应关系见 CHANGELOG）。安装后，将 Endstone 插件的 `.whl` 文件放进服务端的 `plugins/` 目录即可（从 0.11.15 起，LeviStone 加载时会自动创建从 `plugins` 指向 `mods` 的目录链接；若服务端目录下已有名为 `plugins` 的文件夹，则不会创建链接并在日志中报错，此时需先移走原有的 `plugins` 文件夹）。注意，LeviStone 只支持 Endstone 的 Python 插件，不支持 C++（native）插件。

*适用版本：LeviStone 0.11.15 及以上；LeviLamina `>=26.60.4 <26.70.0`；更早版本安装目录为 `plugins/EndstoneRuntime`*

## 想在 LeviLamina 上运行 Endstone 插件，装了 LeviStone 后还需要再装 Endstone 本体吗？装上后服务端一启动就闪退怎么办？

不需要另外安装 Endstone 本体。LeviStone 本身就是基于 Endstone 的运行时（以 LeviLamina 模组 `EndstoneRuntime` 的形式加载），装好即可运行 Endstone 的 Python 插件（不支持原生/C++ 插件）。

启动闪退多半是 Python 环境问题：LeviStone 的 wheel 是按 Python 版本分别构建的，运行时需要与安装时所用 pip 同版本的 `pythonXY.dll`。请确认安装 levistone 时所用的 Python 与系统 PATH 中的 Python 版本一致（当前支持 Python 3.11~3.15 正式版）。如果安装了多个 Python 版本，请用 `py -3.x -m pip install levistone --target mods/EndstoneRuntime` 明确指定版本，或卸载冲突的版本，并确保所用版本的安装目录已在 PATH 中。

*适用版本：LeviStone 0.11.15 及以上；更早版本安装目录为 `plugins/EndstoneRuntime`*

## 安装 LeviStone（EndstoneRuntime）后加载失败，报 `[0x0000007E:system] The specified module could not be found … module: endstone_runtime.dll missing module: python3XX.dll`（如 `python312.dll` / `python313.dll`），已经装了 C++ 运行库，怎么解决？

这是因为找不到与 LeviStone 对应版本的 Python 动态库（`pythonXY.dll`），通常是因为 Python 安装目录未加入 PATH，或者安装 levistone 时所用的 pip 与 PATH 中的 Python 版本不一致。解决方法如下：

1. 安装 Python（3.11~3.15 正式版），安装时勾选 “Add python.exe to PATH”；若未勾选，请手动将 Python 安装目录加入 PATH，或重新安装。可用 `where python313.dll`（替换为你的版本号）检查是否生效。
2. 在 BDS 根目录（即 `bedrock_server_mod.exe` 所在目录）下，使用同一个 Python 的 pip 安装：`pip install levistone --target mods/EndstoneRuntime`（0.11.15 之前的版本用 `--target plugins/EndstoneRuntime`）。
3. 作为临时办法，也可以直接把对应的 `pythonXY.dll` 复制到服务器根目录。
4. 在 Docker/Wine 环境下，用 Linux 版 Python 的 pip 安装时不会附带 Windows 版的 dll，而服务器运行时需要 Windows 版 Python 的 dll。建议直接使用官方镜像 `ghcr.io/liteldev/levistone-server:latest-wine`，该镜像会将 Python 装进 Wine 前缀并自动安装 LeviStone。

*适用版本：当前版本（Windows 原生 / Wine）*

## LeviStone 启动时 EndstoneRuntime 长时间卡住，之后突然开始下载，服务器启动很慢甚至起不来，怎么解决？

LeviStone 本身以及 Endstone 插件（`.whl`）的依赖都是通过 pip 从 PyPI 下载的（Endstone 加载插件时会调用 `python -m pip install <插件.whl>`）。未配置镜像时，直连 PyPI 会非常慢甚至失败。可以先配置国内镜像，再在 BDS 根目录下手动安装：

```shell
pip config set global.index-url https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple
pip install levistone --target mods/EndstoneRuntime
```

如需指定版本，可写成 `levistone==<版本>`，并确保与 LeviLamina 版本匹配；0.11.15 之前的版本需将 `mods` 改为 `plugins`。安装完成后再运行 `bedrock_server_mod.exe`。如果使用 Docker 镜像，可以通过环境变量 `PYPI_MIRROR_URL` 配置镜像。

*适用版本：LeviStone 0.11.15 及以上*

## 想在 LeviLamina 上运行 Endstone 的 Python 插件（如 endweave 的 `.whl`），是否需要先安装 LSE Python（`legacy-script-engine-python`）？安装 LSE Python 卡住怎么办？

不需要。LeviStone 本身不是 Python 插件，而是让 LeviLamina 能够运行 Endstone Python 插件的模组（`EndstoneRuntime`），不依赖 LSE Python。而且据维护者说明，LeviStone 与 LSE Python 冲突，只能二选一，因此需要删掉 LSE Python。安装 LeviStone 后，把 Endstone 插件（`.whl`）放到 `plugins` 目录即可（从 0.11.15 起，LeviStone 会自动将 `plugins` 创建为指向 `mods` 的目录链接）。注意，运行时的 Python 版本必须与安装 LeviStone 时所用的版本一致（当前支持 3.11~3.15）。

## 服务器同时安装 EndstoneRuntime（`endstone_runtime.dll`，LeviStone）和某个悬浮字 mod 后一直崩溃，崩溃堆栈里出现这两个 dll，是它们冲突吗？

不一定。从本例的崩溃日志看，实际是 ScriptAPI（使用了脚本 API 的 addon，简称 SAPI）发生了崩溃。Endstone 和该 mod 只是 hook 了 tick；任何 hook 了 tick 的 mod 都会出现在调用栈中，与崩溃本身无关。排查方法：查看崩溃 trace 中真正出错的模块，排查并移除使用了 SAPI 的 addon（本例中是某个农场类 addon），或向 Mojang 反馈。这是通用的崩溃排查经验，当前版本仍可参考。

*未能从源码或文档中直接证实，仅供参考。*

## Endweave 改成 C++ 实现后，还能在 LeviStone 上使用吗？

可以。Endweave 目前采用 Python+C++ 混合实现，以 Python 插件（`.whl`）的形式加载，因此能在 LeviStone 上运行。注意必须使用 LeviStone 0.11.15-post.1 及以上版本，该版本专门修复了 endweave 无法工作的问题。LeviStone 不支持纯 Endstone 原生（C++）插件。

*适用版本：LeviStone 0.11.15-post.1 及以上*

## 使用 LeviStone 时想关闭某个功能，找到的配置文件其实是 endweave 的配置，LeviStone（Endstone）的配置文件在哪里？

LeviStone 的 Endstone 配置文件是 `endstone.toml`，位于 BDS 根目录（服务端工作目录）下，由 LeviStone 首次加载时从 `mods/EndstoneRuntime/endstone/config/endstone.default.toml` 复制生成。在 `endstone.toml` 中修改对应的功能开关即可。endweave 的配置文件属于另一个组件，并非 endstone 的配置。

*适用版本：LeviStone v0.11.15-post.1*
