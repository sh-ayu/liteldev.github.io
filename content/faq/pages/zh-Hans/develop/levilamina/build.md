# 构建 LeviLamina 模组：工具链

## 想用 C++ 开发 LeviLamina 原生 mod，开发环境怎么搭？LL/BDS 头文件和库从哪里来？能否自己建 VS 工程手动配置？写好后怎么放到服务器上运行？

不建议自己建 VS 工程手动配置头文件和库。推荐流程如下：

首先安装 Git、Visual Studio（勾选“使用 C++ 的桌面开发”，以提供 Windows SDK 和 C++ 库）、LLVM（安装时加入 PATH；当前模板通过 `set_toolchains("clang-cl")` 使用 clang-cl 编译）和 xmake。在 GitHub 的 `LiteLDev/levilamina-mod-template` 仓库页面点击“Use this template”新建仓库，修改 `xmake.lua` 中的 target 名，并用 `add_requires("levilamina 26.60.*", ...)` 固定 LeviLamina 版本（前两段版本号需与服务器一致）。随后在项目目录依次执行 `xmake f -y -p windows -a x64 -m release` 和 `xmake`，xmake 会自动拉取头文件与库并完成构建。拉取依赖失败多半是网络问题，可为 xmake 配置 GitHub 镜像代理或 HTTP 代理；若找不到指定的 LeviLamina 版本，可执行 `xmake repo -u`。编辑器可任选，推荐使用 VS Code 并安装 C/C++、XMake 和 clangd 扩展；也可执行 `xmake project -k vsxmake` 生成 VS 工程。引入头文件时应写为 `#include "ll/api/command/CommandRegistrar.h"`、`#include "mc/world/actor/player/Player.h"` 等，不要套用 LSE 的 API 命名。构建产物位于 `bin\<mod名>\` 下（包含 dll 和 `manifest.json`），将整个文件夹复制到服务器的 `mods` 目录并重启服务器，即可由 LeviLamina 加载。详见 <https://levimc.org/zh-Hans/tutorials/develop/first-levilamina-mod/>

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 服务端 mod 能直接给客户端（LeviLamina client）用吗？能否一个 DLL 双端通用？移植到客户端要做哪些适配？

不能通用，必须分别编译服务端版和客户端版两个 DLL。依赖 LeviLamina 的 mod 在加载时会解析所有用到的 MC API 符号，一旦缺失就会加载失败；而客户端与 BDS 的符号差异很大（存在大量内联，且客户端多了 client 相关内容），`Actor` 等类在两端的成员和虚表也各不相同。适配步骤如下：

1. 参考最新的 levilamina-mod-template 更新 `xmake.lua`、`manifest.json` 和 GitHub Actions workflows。编译客户端版时先执行 `xmake f --target_type=client` 再构建（默认为 server），两端特有的代码可分别放在 `src-server` 和 `src-client` 目录下。
2. 包描述文件现已改为 `lip.toml`（format 4），需在默认 variant 下分别声明 `side = "server"` 和 `side = "client"` 两个条目（旧的 `tooth.json` client label 已被取代），依赖统一写为 `github.com/LiteLDev/LeviLamina`。
3. 注册命令时，使用 `CommandRegistrar::getServerInstance()`（即 `getInstance(false)`）或 `getClientInstance()`。
4. 修改服务端特有的内容（例如 `PropertiesSettings` 在 `src-server` 下有完整的成员与函数，而在 `src-client` 下只是空壳结构体）；hook 等代码也需要实际测试。

此外，客户端每进入一次世界就相当于开启一次服务端，因此 mod 必须正确实现 disable/卸载逻辑。

*适用版本：LeviLamina 1.8 及以上（lip.toml 部分 26.60.8 及以上）*

## C++ mod 项目如何指定/更新/回退所依赖的 LeviLamina 版本？改了版本后构建仍报错怎么办？

在 mod 项目的 `xmake.lua` 中，在 levilamina 包名后加上版本号即可，例如 `add_requires("levilamina 26.60.8", {configs = {target_type = get_config("target_type")}})`。不写版本号则会选用包仓库 `versions.txt` 中的最新版本；也可以写完整的 40 位 commit hash 或分支名（如 `levilamina main`）来使用开发中的版本，但此时需要自行处理 bdslibrary 等依赖（注意：模板注释里的 `levilamina develop` 已不可用，LeviLamina 仓库现在没有 develop 分支，开发分支为 main）。修改版本后，依次执行 `xmake repo -u`（更新 levimc-repo 等包仓库，使本地获取新版本信息）和 `xmake c -a`（清理全部构建缓存），必要时执行 `xmake f -c` 重新配置，最后执行 `xmake` 构建；如果使用 VSCode/clangd 补全，还需执行 `xmake project -k compile_commands` 重新生成编译数据库。注意：如果填写了包仓库未收录的版本号，xmake 会将其当作 git 分支去拉取，从而报出 `Remote branch ... not found` 之类的错误。

## xmake 构建 mod 时指定 levilamina 某版本报 `Remote branch x.y.z not found in upstream origin`，或警告 `Unknown version: x_y_z, will use main branch dependencies`，怎么办？

这是因为本地 xmake 包仓库（LiteLDev/xmake-repo，在项目中名为 levimc-repo）的 `versions.txt` 里没有该版本。xmake 在版本列表中匹配不到时，会把所写的版本号当作 git 分支名去拉取 LeviLamina 仓库，从而报 `Remote branch x.y.z not found`；而 `Unknown version: x_y_z, will use main branch dependencies` 则是 levilamina 包脚本在找不到 `versions/<x_y_z>.lua` 时打印的警告（使用 commit 或分支指定版本时也会出现，属于正常现象，此时会回退使用 main 分支的依赖配置）。出现这种情况，可能是本地仓库未更新，也可能是 LeviLamina 发版后 xmake-repo 尚未（或没有）收录该版本（例如目前 xmake-repo 就没有收录 v26.20.2、v1.6.2）。处理办法如下：

1. 执行 `xmake repo -u` 更新包仓库，必要时执行 `xmake c -a`（或删除项目下的 `.xmake` 目录）后重试。
2. 若 xmake-repo 中仍没有该版本，可在 `add_requires` 里改用 LeviLamina 对应 tag 的完整 40 位 commit hash（短 hash 会被当作分支名而同样失败），或换用已收录的相邻版本。

版本号带不带 `v` 前缀均可匹配。若下载失败，还需检查网络或代理设置。

## 用 xmake 构建 LeviLamina mod 时下载依赖包（levilamina、entt、expected-lite、libhat 等）或拉取包仓库一直失败/很慢，怎么办？

绝大多数情况都是访问 GitHub 的网络问题所致。xmake 和 git 不一定走系统代理，可按以下方式处理：

1. 为 xmake 和 git 设置代理：执行 `xmake g --proxy=http://127.0.0.1:端口`，或在同一终端设置环境变量后再构建（cmd 下执行 `set HTTP_PROXY=http://127.0.0.1:端口` 与 `set HTTPS_PROXY=http://127.0.0.1:端口`）；同时执行 `git config --global http.proxy http://127.0.0.1:端口` 为 git 设置代理。也可以将代理软件开启为 TUN（系统级透明代理）模式。使用 Steam++ 等工具时，不要使用 hosts 加速模式。
2. 使用镜像：自行编写一个 pac 文件（如 `%LOCALAPPDATA%\.xmake\pac.lua` 或任意绝对路径），在其中定义 `function mirror(url) ... end` 将 github.com 地址改写为可用的镜像地址，然后执行 `xmake g --proxy_pac=<该文件>`。注意：旧教程（包括 LeviLamina 构建文档）中的 `xmake g --proxy_pac=github_mirror.lua` 依赖 xmake 内置的 `scripts/pac/github_mirror.lua`，但该文件自 xmake v2.9.8（2025-01）起已被移除，在新版 xmake 中直接这样写无效。详见 xmake 文档“网络优化”：<https://xmake.io/zh/guide/package-management/network-optimization.html>
3. 如果项目或全局配置里设置了不适合当前网络的代理或镜像（例如身处海外或已开启代理，却使用了国内镜像），请将其删除或改回 GitHub 源。
4. 应急办法：从他人处获取已下载好的包，放入 xmake 包缓存目录 `%LOCALAPPDATA%\.xmake\packages\<首字母>\<包名>`（如 levilamina 位于 `packages\l\levilamina`）；或者手动下载源码包后，用 `xmake g --pkg_searchdirs=<绝对路径>` 指定本地搜索目录。
5. 若某个 git 仓库缓存拉取卡住，可进入 xmake 报错的那个仓库缓存目录，手动执行 `git fetch` 后重试；也可先执行 `xmake repo -u` 和 `xmake c -a` 清理后再重新构建。

## 用 xmake 构建 LeviLamina mod（levilamina-mod-template）时拉取仓库/下载依赖报 SSL 证书错误，例如 `fatal: unable to access 'https://github.com/LiteLDev/xmake-repo.git/': SSL certificate problem: unable to get local issuer certificate`（或 xmake-mirror/build-artifacts.git），怎么办？

这是本机访问 GitHub 时的网络或证书问题（本地缺少或不信任 GitHub 的证书链，常见于代理或加速器劫持 HTTPS），与 xmake 或 LeviLamina 无关。LeviLamina 的包仓库 levimc-repo（<https://github.com/LiteLDev/xmake-repo.git>）和大部分依赖都托管在 GitHub 上。处理方法如下：

1. 检查网络和代理环境，使用稳定可靠的代理访问 GitHub（Watt Toolkit 这类加速器会替换证书，效果不稳定）。
2. 如果确实是本机缺少证书链，可在浏览器中访问 GitHub 并导出站点证书，将其安装到“受信任的根证书颁发机构”。
3. 如果是 xmake 通过 curl 下载包时证书校验失败，可执行全局配置 `xmake g --insecure-ssl=y` 跳过 SSL 校验（详见 xmake FAQ“下载包提示证书校验失败怎么办”）。

构建流程本身：需事先安装 git，且由于当前模板使用 clang-cl 工具链，还需安装 LLVM（模板 CI 使用 LLVM 22）。在项目目录下依次执行 `xmake repo -u`、`xmake f -y -p windows -a x64 -m release`（或 `-m debug`）和 `xmake`，构建产物位于 `bin/`。若使用 Visual Studio，需先按 xmake 文档生成 vsxmake 工程再构建。

## 执行 `xmake f -m debug` 等命令时提示 `note: the following packages were not found in any repository (check if they are spelled correctly): -> levilamina -> levibuildscript`，或找不到指定版本的 levilamina，怎么解决？

1. 确认 `xmake.lua` 中已添加 LiteLDev 的包仓库：`add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")`（旧模板遗留的过时配置可以删掉，以最新 levilamina-mod-template 的 `xmake.lua` 为准）。
2. 执行 `xmake repo -u` 更新包仓库。
3. 若仍找不到，清理缓存：删除项目目录下的 `.xmake` 文件夹（或执行 `xmake c -a`），再执行 `xmake repo -u`，然后重新运行 `xmake f -m debug`（或 release）并构建。
4. 如果 `xmake.lua` 中通过 `add_requires("levilamina x.x.x")` 固定了版本，请确认该版本存在于 xmake-repo 中。你可以将其改为最新版本、去掉版本号以默认使用最新版，或改用 `add_requires("levilamina develop")`（使用 develop 时需自行添加 bdslibrary）。

## 编译 levilamina-mod-template 时 xmake 安装 levilamina 依赖包（installing levilamina）卡几个小时，或报错 `error: unable to parse semver`，怎么解决？

安装 levilamina 包时需从 GitHub 拉取 xmake-repo 及各项依赖，并在本地从源码编译，耗时本来就较长。如果长时间卡住或报错 `unable to parse semver`，通常是网络问题导致未能成功拉取 xmake-repo，进而找不到指定版本。解决方法如下：

1. 开启代理的 TUN（虚拟网卡）模式，或在 PowerShell 中设置代理环境变量（如 `$env:all_proxy="http://127.0.0.1:端口"`），或执行 `xmake g --proxy="http://127.0.0.1:端口"` 为 xmake 配置全局代理。
2. 删除当前项目目录下的 `.xmake` 文件夹后重试。
3. 按标准流程操作：克隆模板后依次执行 `xmake repo -u`、`xmake f -m debug`（或 `xmake f -y -p windows -a x64 -m release`）、`xmake`。
4. 版本号处也可以填写 commit hash 或 branch；必要时可手动下载卡住的包。

注意：当前模板使用 clang-cl 工具链，需预先安装 LLVM（CI 使用 LLVM 22）。

## 用 VSCode 开发 LeviLamina C++ mod（levilamina-mod-template）时，xmake 能编译通过，但编辑器里头文件找不到、满屏红线、LL/BDS 的类和函数没有补全，怎么解决？

LeviLamina 及其依赖均由 xmake 包管理器自动下载，无需手动下载头文件或将其拷入 `src` 目录，也不要在 `includePath` 中手动填写路径。编辑器报错是因为缺少编译数据库 `compile_commands.json`。

1. 用 VSCode 打开包含 `xmake.lua` 的项目根目录，先执行一次 `xmake f -y -p windows -a x64 -m release` 和 `xmake`，完成依赖下载。
2. 生成编译数据库：在项目根目录下执行 `xmake project -k compile_commands`（默认生成到根目录）；或安装 VSCode 的 XMake 扩展，按 Ctrl+Shift+P 执行“XMake: Update Intellisense”。注意：XMake 扩展默认将 `compile_commands.json` 生成到 `.vscode` 目录，而 clangd 默认只在项目根目录（及其父目录）中查找。因此，你可以修改 XMake 扩展的输出目录，或为 clangd 添加参数 `--compile-commands-dir=.vscode`，或直接用命令行将其生成到根目录。
3. 推荐使用 clangd（需安装 LLVM，模板已自带 `.clangd` 配置）。生成编译数据库后，重启 clangd 或执行 Reload Window，并等待索引完成。由于 clangd 与微软 C/C++ 扩展（cpptools）的 IntelliSense 冲突，使用 clangd 时应关闭 cpptools 的 IntelliSense；若坚持使用 cpptools，请将 `C_Cpp.default.compileCommands` 指向生成的 `compile_commands.json`。
4. 更新头文件或依赖版本后，需重新生成 `compile_commands.json`；若配置混乱，可删掉 `.vscode` 下生成的配置后重来。只要 xmake 能编译通过，编辑器的误报就不会影响实际构建。

其他 IDE：Visual Studio 可执行 `xmake project -k vsxmake` 生成 sln；CLion 可直接导入根目录下的 `compile_commands.json`，若标准库标红，将工具链改为 Visual Studio 即可。构建本身需要安装 Visual Studio（勾选“使用 C++ 的桌面开发”工作负载，以提供 Windows SDK）和 LLVM（模板使用 clang-cl 编译），不支持 MinGW。

## 用 Visual Studio 开发 LeviLamina C++ mod，直接“打开文件夹”后没有补全、`#include` 报错或“转到定义”找不到头文件，生成的工程里也看不到头文件，怎么办？

不要用 VS 的“打开文件夹”功能直接打开 xmake 项目。由于头文件由 xmake 包管理器下载，请先在项目目录下执行一次 `xmake f -y -p windows -a x64 -m release` 和 `xmake` 以完成依赖下载与编译，再用 xmake 生成 VS 工程：

```powershell
xmake project -k vsxmake -m "debug,release"
```

随后打开生成的 `vsxmake` 目录下的 `.sln`，即可正常索引和补全代码。

注意：

- vsxmake 只会将 `add_headerfiles` 声明的头文件加入工程，不会扫描 `add_includedirs`。当前模板的 `xmake.lua` 已有 `add_headerfiles("src/**.h")`；如果你用 `.hpp` 或其他目录，需要自己补上，例如 `add_headerfiles("src/**.h", "src/**.hpp")`。
- 在 vsxmake 生成的 sln 中新建文件时，文件可能会被放进生成目录而非 `src` 目录，此时需手动将其移至 `src` 并重新生成工程。
- 你也可以用 xmake 生成 CMake 工程（`xmake project -k cmakelists`），再通过 VS 的 CMake 功能打开，或使用 VS 的 xmake 扩展；若使用 VSCode，则按 compile_commands 方式配置。

## 开发 LeviLamina C++ mod 时怎么断点调试？为什么用 VS/VSCode 直接“启动”`bedrock_server_mod.exe` 调试不行？

请使用“先启动服务器、再附加调试器”的方式，不要用调试器直接启动 BDS。自 LeviLamina 1.2.0 起，PreLoader 的运行时保护会拦截在加载 Runtime Data 前就挂载了调试器的进程，导致启动失败并报错“`Failed to load Runtime Data ... please attach it after Runtime Data is loaded`”。

- Visual Studio：正常运行 `bedrock_server_mod.exe`，然后选择“调试 → 附加到进程”，选中 `bedrock_server_mod.exe`。
- VSCode：在 `.vscode/launch.json` 中配置 `"type": "cppvsdbg", "request": "attach"`，然后选择进程附加。当前的 levilamina-mod-template 已自带 `.vscode/launch.json`，内置了“BDS attach”和“GDK attach”配置：安装 VSCode 扩展 Tasks Shell Input，设置环境变量 `MC_BDS_DEBUG_PATH`（BDS 可执行文件的完整路径；调试客户端则用 `MC_GDK_DEBUG_PATH`）以及可选的 `MC_SYMBOLS_PATH`（符号目录），即可一键启动并自动附加。
- 调试启动早期阶段（如 `load()`/`enable()`）：先在命令行执行 `set PL_DEBUG=1`，再运行 `bedrock_server_mod.exe`。PreLoader 会在加载完 Runtime Data 后暂停并等待调试器附加，附加后即可继续运行。
- 源码与断点：能否看到源码取决于是否有与 mod dll 匹配的 pdb 文件。模板 `xmake.lua` 中的 `set_symbols("debug")` 会生成 pdb；有了 pdb 才能查看源码和下断点，否则只能看反汇编。如需进行更底层的调试，可以使用 x64dbg 或 WinDbg。
- LSE 的 JS 等脚本插件不支持这种调试方式。
- LeviLamina 初始化 CrashLogger 时，如果检测到已挂载调试器（例如通过 `PL_DEBUG=1` 在早期附加），会提示“`Debugger detected, CrashLogger will not be enabled`”并跳过启用 CrashLogger。如果在服务器启动后再附加调试器，虽然 CrashLogger 已经启用，但异常仍会由调试器优先捕获。

*适用版本：LeviLamina 1.2.0 及以上*

## BDS 已从 MSVC 换成 clang 编译，LeviLamina 的 C++ mod 也必须跟着换编译器吗？还能用 MSVC 编译吗？

必须更换。新版 BDS 改用了 clang 编译，LeviLamina 也随之改用 clang-cl。MSVC 和 clang 的许多特性不同，同一份代码在两种编译器下的 ABI 可能完全不一致。继续用 MSVC 编译 mod 会导致事件监听异常、功能失效，甚至在开服时直接崩溃。请同步最新 levilamina-mod-template 的配置：在 `xmake.lua` 中设置 `set_toolchains("clang-cl")`（并保留模板中针对 clang_cl 的 cxflags），同时在本地安装 LLVM（模板 CI 使用的是 LLVM 22）。

*适用版本：LeviLamina 26.20.0 及以上*

## LeviLamina 及其 C++ mod 能用 CMake 构建吗（像 Endstone 插件那样）？

官方仅支持 xmake（`levilamina-mod-template`）。如果确实需要用 CMake，可以通过 `xmake project -k cmakelists` 生成 CMake 工程，但生成的依赖库路径都会指向 xrepo 目录。此外，mod 在链接前需要通过 `levibuildscript` 的 linkrule 执行 prelink（即使用 `prelink.exe` 和 `bedrock_runtime_data` 处理目标文件，并添加 `/DELAYLOAD:bedrock_runtime.dll`）；使用 CMake 时必须自行补上这一步才能正常链接。如果想彻底脱离 xmake，则需要手写 `CMakeLists.txt` 并自行处理所有依赖。

## 没有 Windows 环境（macOS、WSL/Linux、GitHub Codespaces）能编译 LeviLamina C++ mod 吗？

官方仅支持在 Windows 上编译 mod。模板使用的 `clang-cl` 工具链依赖 Windows SDK 与 MSVC STL 的头文件和库，macOS 与 Linux 下没有官方支持，且 BDS 本身也无法在 mac 上运行。如果没有 Windows 环境，推荐将源码推送到 GitHub 仓库，利用 GitHub Actions 的 `windows-latest` runner 进行构建（mod 模板已自带 `.github/workflows/build.yml`），构建完成后在 Actions 运行页面的 Artifacts 中下载产物（需登录 GitHub）。如果坚持在 Linux 下尝试，可以用 msvc-wine（<https://github.com/mstorsjo/msvc-wine>）来配置 Windows SDK/MSVC 环境，但官方对此不做保证。

## 用 `levilamina-mod-template` 构建时 `manifest.json` 中版本号总是 `0.0.0`，或提示 `Failed to parse version tag, using 0.0.0`，版本号在哪里设置？

版本号并非取自 `tooth.json`。构建时，`levibuildscript` 的 modpacker 会执行 `git describe --tags --abbrev=0` 读取 git tag，并按 `vX.Y.Z` 格式解析；如果没有 tag 或格式不符，就会回退到 `0.0.0`。因此需要：

1. 使用 `git clone` 获取仓库（直接下载的 zip 压缩包不含 `.git` 目录）；
2. 打一个带 `v` 前缀的标签（如 `git tag v0.1.0`），然后再构建。

你也可以在 `xmake.lua` 中手动指定版本号：`add_rules("@levibuildscript/modpacker", {modVersion = "1.0.0"})`。

*适用版本：使用 levibuildscript modpacker 的 mod 模板（当前版本）*

## mod 模板里的 `MemoryOperators.cpp` 有什么用？可以删掉吗？删掉后 mod 加载报错怎么办？

该文件包含 `#define LL_MEMORY_OPERATORS` 和 `#include "ll/api/memory/MemoryOperators.h"` 两行代码，作用是让 mod 使用 LeviLamina 统一的全局 `operator new/delete`（BDS 自定义了内存分配器，LeviLamina 使用 mimalloc，所有 mod 必须保持统一）。当前版本的 LeviLamina 会检查 mod 是否导出了 `ll_memory_operator_overrided` 符号；如果未导出，会直接拒绝加载并报错 `<mod> will not be loaded because it isn't using the unified memory allocation operator`。因此请勿删除该文件，如已删除请将其恢复。如果想调整位置，也可以删掉该文件，改在 mod 的任意一个（且只能是一个）源文件中写入上述两行代码。如果编译时遇到与 MemoryOperators 相关的报错，请先执行 `xmake repo -u` 更新 xmake-repo，然后再重新构建。

*适用版本：LeviLamina 1.0 及以上*

## mod 本地能编译，但在 GitHub Actions（或新克隆的仓库）上编译失败（头文件相关错误），怎么办？

LeviLamina 已改用 `clang-cl`，而 GitHub Actions 的 windows runner 自带的 LLVM 版本可能过旧。你需要在 workflow 中安装新版 LLVM（与最新模板保持一致）：

```yaml
- name: Setup LLVM
  uses: ZhongRuoyu/setup-llvm@v0
  with:
    llvm-version: 22
```

同时，在构建前执行 `xmake repo -u` 更新 xmake-repo。建议直接对照最新的 `levilamina-mod-template` 同步 `.github/workflows/build.yml`。如果是因为 LeviLamina 新版本的依赖尚未就绪而导致编译失败，可以在 `xmake.lua` 中固定版本号，例如 `add_requires("levilamina x.x.x")`。

*适用版本：LeviLamina 26.20.0 及以上*

## C++ mod 依赖的第三方 DLL（如放在 mod 目录下的库，或 `jvm.dll` 等不在 PATH 中的外部 DLL）找不到，mod 加载失败（连 `onLoad` 都没执行），怎么办？

系统在加载 mod DLL 时会解析其导入表并加载所依赖的 DLL；一旦找不到对应文件，就会直接加载失败（错误码 126/127，LeviLamina 会同时输出依赖诊断信息）。Windows 没有 rpath 机制，但 LeviLamina 在加载 native mod 前会将该 mod 所在的目录追加到 `PATH` 中，因此放在 mod 目录（或 BDS 根目录）下的依赖 DLL 可以被正常找到。对于路径不固定的外部 DLL（如 `jvm.dll`），有以下几种处理方式：将其所在目录加入系统 `PATH`；放弃静态链接导入，改在运行时通过 `LoadLibrary`/`GetProcAddress`（或 LeviLamina 封装的 `ll::sys_utils::DynamicLibrary`）动态加载，这样就能按“配置文件 → 环境变量 → 注册表”的顺序灵活查找 `JAVA_HOME`；或者使用链接器的 `/DELAYLOAD` 选项进行延迟加载（`levibuildscript` 的 linkrule 本身就是用它来延迟加载 `bedrock_runtime.dll` 的）。

## LeviLamina C++ mod（xmake 模板）如何引入第三方库（如 soci）？soci 运行时报 backend 找不到怎么办？

如果第三方库已收录在 xmake 官方仓库（xmake-repo）中，直接在 `xmake.lua` 里调用 `add_requires` 并在 target 中添加 `add_packages` 即可。例如 soci 就在官方仓库中，可以通过包配置开启所需的后端：`add_requires("soci", {configs = {mysql = true}})`（其他后端同理）。如果官方仓库没有收录，可以通过 xmake 引入 vcpkg 包，如 `add_requires("vcpkg::soci")`（详见 xmake 文档“添加 vcpkg 的依赖包”）；否则只能自行编译出 DLL 或静态库后再手动链接。需要注意，soci 在运行时会调用 `LoadLibrary` 动态加载各个 backend DLL，因此必须将 backend DLL 放在可被搜索到的位置（当前工作目录、`PATH`，或 mod 目录——LeviLamina 会将 mod 目录加入 `PATH`），或者显式指定 backend 搜索路径，否则就会报错找不到 backend。另外，xmake-repo 中的 soci 默认构建为静态库（`shared=false`），此时 backend 会被静态链接到产物中，运行时不会去查找外部 DLL，但必须在使用前显式注册，例如调用 `soci::register_factory_mysql()`，或直接传入 `soci::mysql` 工厂对象来创建 session。最后请注意，当前 mod 使用 `clang-cl` 编译，第三方 C++ 库最好也由 xmake 使用同一套工具链构建。

## LeviLamina（LL3）的 mod 模板能用来写 LiteLoaderBDS（LL2）的插件吗？LL2 的 C++ 插件模板在哪？

不能。`levilamina-mod-template` 只适用于 LeviLamina。LL2 的 C++ 插件模板位于 <https://github.com/LiteLDev/liteloaderbds-plugin-template>，但该仓库与 LiteLoaderBDS 本体均已归档且不再维护，建议迁移到 LeviLamina。

*适用版本：当前版本（LiteLoaderBDS 已归档）*

## 用 `levilamina-mod-template` 创建 C++ mod 项目后没有 `include`（头文件）文件夹，LeviLamina 的头文件在哪里？

这不是缺文件，模板本身就没有单独的 `include` 目录（旧教程里的截图已过时）。直接使用 <https://github.com/LiteLDev/levilamina-mod-template>，先执行一次 `xmake`（构建）或 `xmake f`（配置），xmake 就会通过 levimc-repo 自动拉取 LeviLamina 等依赖。头文件存放在 xmake 的包缓存目录中，Windows 下的路径为 `C:/Users/<用户名>/AppData/Local/.xmake/packages/l/levilamina/<版本>/<哈希>/include`。

## BDS 不再提供 PDB 之后，LeviLamina 的 mod 怎么链接符号、还能不能 hook？

现在由 bedrock runtime data（即“magic blob”，对应 xmake 包 `bedrockdata`）取代 PDB。blob 不含明文符号，而是“符号 hash -> RVA”的映射。构建 mod 时，链接前会调用 prelink 工具对用到的外部符号求 hash，再去 blob 中查找并生成用于链接的 fake lib；运行时也按同样的方式解析。`bedrockdata` 和对应版本的 prelink 会作为 xmake 依赖自动下载，无需手动处理。hook 写法保持不变，可参考 LeviLamina 仓库中的 `src-test/client/jsonUITest.cpp`。此外，PeEditor 目前只负责向 `bedrock_server.exe` 注入 PreLoader 以生成 `bedrock_server_mod.exe`，不再涉及 PDB。

*适用版本：BDS 1.21.20+ / LeviLamina 0.13+ 至当前*

## C++ mod 订阅 `ServerCommandRegisterEvent` 后，事件监听器没有任何输出，怎么回事？

多半是因为编译器不对。新版 BDS 和 LeviLamina 使用 `clang-cl` 编译，因此 mod 也必须用 `clang-cl` 编译（请更新到最新的 `levilamina-mod-template`，其 `xmake.lua` 已包含 `set_toolchains("clang-cl")`，同时需安装 LLVM）。用 MSVC 编译的 mod 虽然能通过编译并正常加载，但生成的类型名称与 BDS/LL 不一致，会导致事件监听失效。

*适用版本：LeviLamina 26.x（BDS 改用 clang-cl 编译之后）*

## C++ mod 中引用 RemoteCall 头文件时 clangd 全红、`compile_commands.json` 里没有对应包的信息，怎么办？写给其他 C++ mod 用的前置应该用 RemoteCall 吗？

首先确认 `xmake.lua` 中已通过 `add_requires` 声明并在 target 中通过 `add_packages` 引入了对应的包（RemoteCall 现在的 xmake 包名为 `legacyremotecall`）。接着在 VS Code 中按 Ctrl+Shift+P，执行 xmake 插件的 `UpdateIntellisense`（或运行 `xmake project -k compile_commands`）以重新生成 `compile_commands.json`，最后重启 clangd（restart clangd）。另外，写给其他 C++ mod 调用的前置不建议使用 RemoteCall，直接用 `__declspec(dllexport)` 导出函数即可（参见官方文档的接口导出指南）。

## GitHub Actions 上构建 mod 失败，日志里有与 cmake 相关的警告，如何排查？

请往上翻看日志中的 error，而不是关注 warning。曾有案例是因为 runner 环境缺少 Python（某些依赖包用 cmake 构建时需要用到），在 workflow 中加入 `actions/setup-python` 后即得以解决。建议以最新 `levilamina-mod-template` 的 workflow 为基础进行配置（需包含 `setup-xmake`、`setup-llvm`、`xmake repo -u` 等步骤）。

*适用版本：使用 GitHub Actions 构建 mod 时。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina mod 如何适配新的游戏版本（如 26.20）并做版本控制？构建时会自动下载对应 SDK 吗？

目标 LeviLamina/游戏版本在 `xmake.lua` 中通过 `add_requires("levilamina x.x.x", ...)` 指定（不写版本号则默认使用最新版），构建时 xmake 会自动拉取对应版本的 LeviLamina 包。用于发布的包元数据现在写在 `lip.toml` 中（旧版模板为 `tooth.json`），需在其 `deps` 字段中填写对应的 LeviLamina 版本范围，例如服务端变体填 `"github.com/LiteLDev/LeviLamina" = "26.60.*"`（模板 `lip.toml` 中客户端变体填的是 `">26.60.6 <26.61.0"`，因为 26.60.6 是最后一个使用 `tooth.json` 的版本）。另外，`xmake.lua` 中不必再手动 `add_requires` nlohmann_json，LeviLamina 包已将其作为公开依赖传递。

*适用版本：当前 levilamina-mod-template（lip.toml 格式）*

## LeviLamina mod 开发文档里生成 VS Code 配置的 xmake 命令应该在哪里执行？

只要当前工作目录是项目根目录（即包含 `xmake.lua` 的目录），在任意终端中执行都可以。这是 xmake 自带的功能（例如用 `xmake project -k compile_commands` 生成 `compile_commands.json`），详细说明可查阅 xmake 文档；VS Code 的 xmake 插件也能自动生成或更新这些配置。

*未能从源码或文档中直接证实，仅供参考。*

## LeviLamina mod 使用事件（如 `ServerStartedEvent`）时链接报找不到符号，怎么解决？

这可能是因为 xmake 缓存了旧版 LeviLamina 包，导致头文件与库文件不匹配。请先执行 `xmake repo -u`，然后删除 `%LocalAppData%\.xmake` 以及项目目录下的 `.xmake` 和 `build` 文件夹，再重新执行 `xmake f` 和 `xmake` 进行构建。同时，请确认使用的是 `clang-cl` 工具链。

*未能从源码或文档中直接证实，仅供参考。*

## LeviLamina mod 用 xmake 编译一直失败，怎么排查？

1. 确保工具链为最新：安装好 Visual Studio/MSVC 生成工具（提供 Windows SDK 与 STL）以及 LLVM（mod 需用 `clang-cl` 编译）；
2. 执行 `xmake repo -u`；
3. 删除 `%LocalAppData%\.xmake`，再删除项目目录中的 `.xmake`、`build` 等缓存文件夹；
4. 重新执行 `xmake f -y -p windows -a x64 -m release`，留意 configure 阶段是否有报错，最后运行 `xmake` 构建。

## LeviLamina 每次 MC 版本更新附带的 MC 头文件（`src/mc` 下的 header）是人工编写的还是自动生成的？

现在都是由工具自动生成的（只有很早期的版本是人工编写的）。因此 MC 头文件里基本没有注释，且能看到 `// auto generated inclusion list`、`// auto generated forward declare list` 之类的标记。

## LeviLamina 能否像 Java 的 library 前置 mod 那样，让一个 mod 作为依赖库给其他 mod 调用？会不会产生多份数据副本？

可以。在前置 mod 中用 `__declspec(dllexport)` 导出函数或类即可（可参考 LeviLamina 的 LLAPI 宏，例如采用下面的写法，并在前置 mod 的 `xmake.lua` 中添加 `add_defines("MOD_EXPORT")`）：

```cpp
#ifdef MOD_EXPORT
#define MODAPI __declspec(dllexport)
#else
#define MODAPI __declspec(dllimport)
#endif
```

使用方 mod 只需 `dllimport` 并链接该前置的导入库，同时在自身的 `manifest.json` 中声明依赖，例如 `"dependencies": [{ "name": "RequiredMod", "version": "^1.2.3" }]`（此外还支持 `optionalDependencies` 和 `loadBefore`）。LeviLamina 会按依赖关系排序并先加载前置 mod，使用方无需自行加载前置的 dll。由于 Windows 对 dll 采用引用计数机制，同一个 dll 在内存中只会加载一次，其全局变量也只有一份，不会产生多个副本。

*适用版本：LeviLamina 当前版本（Windows native mod）*

## VSCode clangd 中某些被宏包裹的代码区域（`#if`/`#ifdef` 块）变灰没有补全，怎么让它显示补全？

clangd 不会为未启用的宏分支提供代码补全，因此需要让该宏在编译参数中生效：先在 `xmake.lua` 中用 `add_defines` 添加该宏，然后在 VSCode 中按 Ctrl+Shift+P 执行 `XMake: UpdateIntellisense` 重新生成 `compile_commands.json`，最后执行 `clangd: Restart language server`。直接在 `.clangd` 配置文件里添加 `-D` 参数的效果并不稳定。

*适用版本：使用 xmake + VSCode clangd 开发 mod 的环境。未能从源码或文档中直接证实，仅供参考。*

## Windows 用户名为中文时，xmake 编译 LL mod / 安装依赖包出现乱码路径失败，怎么办？

非 ASCII 路径会导致 xmake 的全局缓存和包目录路径出错。你可以换用英文用户名的新系统账户，或者设置环境变量 `XMAKE_GLOBALDIR` 指向一个纯英文目录，将 xmake 全局目录改到英文路径下后再重新构建。

*适用版本：Windows 下使用 xmake 构建 mod，且用户目录含非 ASCII 字符。未能从源码或文档中直接证实，仅供参考。*

## xmake 包描述（如给 xmake-repo 提交包或写自定义包）里 `add_versions` 的哈希值是什么，怎么得到？

如果包使用的是源码压缩包下载地址（即 `set_urls`/`add_urls` 指向 zip 或 tar.gz 文件），该哈希值就是对应版本压缩包的 SHA-256，用于校验下载内容；如果包使用的是 git 仓库地址（如 `https://github.com/xxx/yyy.git`），则填写对应版本的 git commit hash。

*适用版本：当前 xmake / LiteLDev xmake-repo*

## xmake 构建 LeviLamina mod 每次要编译十几到二十分钟，且会把 LeviLamina 重新编译，是什么原因？

xmake 的 `levilamina` 包需要从源码编译安装。这通常是因为前置依赖（如 gmlib、bsci 等）要求的 LeviLamina 版本或配置（如 `target_type`）与 mod 自身 `add_requires` 指定的不一致，导致 xmake 把两个不同版本的 LeviLamina 都编译了一遍。让所有依赖统一使用相同的 LeviLamina 版本和配置即可避免重复编译。

*适用版本：使用 xmake 构建依赖 levilamina 包的 mod*

## xmake 构建 mod 出现 prelink/bedrockdata 相关的缓存异常，删除项目文件也不好，如何清理？

进入 xmake 全局目录（Windows 默认为 `C:\Users\<用户名>\AppData\Local\.xmake`，即 `%LOCALAPPDATA%\.xmake`，注意不是项目目录），删除 `packages` 下的 `prelink`、`bedrockdata`、`levilamina` 包，然后重新执行 `xmake f` 配置并构建。也可以执行 `xmake c -a`，或删除 mod 项目目录下的 `.xmake` 和 `build` 目录。如果问题依旧，请重装 xmake。

*适用版本：LeviLamina 当前版本（Windows，xmake 构建）*

## xmake 编译 LeviLamina mod 时报错找不到头文件 `#include "pl/Config.h"`（或 LL SDK 头文件内容异常），清缓存也没用，怎么解决？

`pl/Config.h` 来自 preloader 包。报错通常是因为网络问题导致 xmake 下载的 LeviLamina 或 preloader 等依赖包不完整（例如此前下载中断，后续直接复用了残缺的包）。要解决此问题，请删除 `C:\Users\<用户名>\AppData\Local\.xmake` 下的包缓存（或整个目录）后重新下载，或从能正常编译的电脑复制 xmake 的 `packages` 文件夹。网络不稳定时，可以为 xmake 配置 GitHub 镜像，例如新建 `github_mirror.lua`：

```lua
function mirror(url)
    url = url:gsub("github.com", "<镜像域名>")
    return url
end

function main(url, host)
    return true
end
```

然后执行 `xmake g --proxy_pac=<该文件绝对路径>`（注意后续不能删除该文件）。

*适用版本：使用 xmake 构建 mod、网络访问 GitHub 不稳定的环境。未能从源码或文档中直接证实，仅供参考。*

## 为什么在 xmake 项目里添加 LeviLamina 依赖（`add_requires("levilamina")`）时会连带拉取 PreLoader？

这是正常现象。xmake 安装 `levilamina` 包时会从源码构建 LeviLamina，而 LeviLamina 由 PreLoader 负责加载，运行时也依赖 PreLoader，其自身的 `xmake.lua` 中声明了 `add_requires("preloader ...")`，因此安装 `levilamina` 包时会一并拉取 `preloader` 包。

## 用新版 LeviLamina（如 26.51.x 及以后）编译 mod 时报错 `ll/api/reflection/Reflection.h: error: no member named 'to_underlying' in namespace 'std'`，怎么办？

需要开启 MSVC STL 的 C++23 库特性。参照最新 `levilamina-mod-template` 的写法，在 mod 的 `xmake.lua` target 中添加 `_HAS_CXX23` 宏：

```lua
add_defines("NOMINMAX", "UNICODE", "_HAS_CXX23=1")
```

模板本身仍使用 `set_languages("c++20")` 和 `set_toolchains("clang-cl")`，通过定义 `_HAS_CXX23=1` 来启用 `std::to_underlying` 等 C++23 库函数。

*适用版本：LeviLamina 26.51 及以上，使用 levilamina-mod-template 结构的 mod*

## 使用 `levilamina-mod-template` 时，模板里的 `MyMod`（类名）和 `my_mod`（命名空间）应该怎么改？

将命名空间 `my_mod` 改为你自己的 mod 名，类名 `MyMod` 则可按需修改（例如改为 `Entry` 或你的 mod 名）。注意必须同步修改 `src/mod/MyMod.h` 与 `MyMod.cpp` 中的类名和命名空间，以及 `MyMod.cpp` 末尾的 `LL_REGISTER_MOD(my_mod::MyMod, my_mod::MyMod::getInstance());`，否则会编译报错。此外，还需将 `xmake.lua` 中的 `target("my-mod")` 改为你的 mod 名（构建脚本会根据 target 名称自动填充 `manifest.json` 中的 `name` 字段）。

*适用版本：当前 levilamina-mod-template*

## 用 xmake 构建 `levilamina-mod-template`（native mod）时报错，或提示无法获取 cxx 程序（找不到 C++ 编译器），怎么办？

这通常是因为编译环境未安装完整。当前模板在 Windows 上使用 `clang-cl` 工具链，需要完成以下配置：

1. 安装 Visual Studio 2022 及以上版本，勾选“使用 C++ 的桌面开发”工作负载（包含 MSVC 与最新 Windows SDK，`clang-cl` 依赖其标准库与 SDK）；
2. 安装 LLVM（官方 CI 当前使用 LLVM 22），并确保 `clang-cl` 已加入 `PATH`；
3. 安装 xmake 或将其更新至 3.0.0 以上版本。

安装完成后，执行 `xmake c -a` 清理缓存，再执行 `xmake f -c -y -p windows -a x64 -m release` 重新配置并构建。

*适用版本：当前 levilamina-mod-template / LeviLamina 26.x*

## 使用最新 LeviLamina 版本时，mod 项目的 CI 构建一直失败，应该用什么工具链？

新版 LeviLamina 需要使用 `clang-cl`（LLVM）编译。请参照最新的 `levilamina-mod-template` 更新 CI，在 workflow 中加入：

```yaml
- name: Setup LLVM
  uses: ZhongRuoyu/setup-llvm@v0
  with:
    llvm-version: 22
```

然后依次执行 `xmake repo -u`、`xmake f -a x64 -m release -p windows -v --target_type=${{ matrix.target_type }} -y` 和 `xmake -v -y`。同时，`xmake.lua` 也需要与模板保持一致（包含 `set_toolchains("clang-cl")`、`_HAS_CXX23=1` 等配置）。

*适用版本：LeviLamina 26.x（2026-08 起官方 CI 改用 LLVM）*

## 依赖都填了最新版本，但编译 mod 时 LeviLamina 头文件报错（提示平台宏 `LL_PLAT_S` / `LL_PLAT_C` 相关问题），怎么解决？

这是因为缺少平台宏定义。目前 levimc-repo 中的 `levilamina` xmake 包会根据 `target_type` 自动为 mod 定义 `LL_PLAT_S`（server）或 `LL_PLAT_C`（client），模板中已无需手动编写。请按以下步骤解决：

1. 执行 `xmake repo -u` 将包仓库更新至最新；
2. 参照最新模板声明 `option("target_type")`，并配置 `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})`；
3. 如果使用的旧版包仓库不会自动定义该宏，可在 target 中手动添加：

```lua
if is_config("target_type", "server") then
    add_defines("LL_PLAT_S")
else
    add_defines("LL_PLAT_C")
end
```

*适用版本：LeviLamina 26.x 及以上*

## 写 LeviLamina C++ mod 时，`overloaded` + `std::visit` 等写法 IDE（clangd）报错，如何让 clangd 使用正确的 C++ 标准和 include 路径？

报错是因为 clangd 未获取到项目的编译参数（语言标准、include 路径和宏定义）。在项目目录下执行以下命令生成 `compile_commands.json`：

```shell
xmake project -k compile_commands
```

clangd 会自动读取其中的编译参数（模板默认配置为 `set_languages("c++20")` 并定义 `_HAS_CXX23=1`）。每次修改 `xmake.lua` 或项目依赖后，都需要重新生成该文件。

## 升级 LeviLamina 版本或更新 Visual Studio 后，用 xmake 编译 mod 出现莫名其妙的编译错误，该怎么处理？

先执行 `xmake c -a` 清理全部构建缓存，再重新编译；若仍未解决，请删除项目下的 `.xmake` 和 `build` 文件夹，然后执行 `xmake f -c -y` 重新配置并编译。同时，执行 `xmake repo -u` 更新包仓库，并确认 `xmake.lua` 和 CI 配置与最新的 `levilamina-mod-template` 一致（使用 `clang-cl` 工具链、LLVM 22 以及 `_HAS_CXX23=1`）。此外，此前曾出现过因微软编译器问题导致 VS2026/2022 均无法编译的情况，该问题现已修复，更新 VS 即可解决。

## 升级 LeviLamina（如 1.9.2 及以后）后自己的 mod 本地和 GitHub Actions 构建都出错，怎么解决？

请参照最新的 `levilamina-mod-template` 更新 mod 的 `xmake.lua`：添加 `target_type` 选项（`option("target_type")` 默认设为 `server`，可选 `server`/`client`），通过 `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})` 引入依赖，并在 target 末尾根据 `is_config("target_type", "server")` 区分服务端与客户端源码。同时，将 GitHub Actions 配置与模板的 `build.yml` 同步（使用 matrix 构建 server 和 client，并传入 `xmake f ... --target_type=${{ matrix.target_type }}`）。

*适用版本：LeviLamina 1.9.x 及以后（含 26.x）*

## 升级到新版 LeviLamina（26.20 起）后编译 mod 时 clang 崩溃，怎么办？

将 mod 的 `xmake.lua` 和 GitHub Actions workflow 同步至最新版本的 `levilamina-mod-template`（模板配置了 `set_toolchains("clang-cl")` 及配套的 `cxflags`，CI 则通过 `ZhongRuoyu/setup-llvm` 安装 LLVM 22）。本地环境也需安装对应版本的 LLVM，然后执行 `xmake f -c` 清理 xmake 缓存并重新构建。

*适用版本：LeviLamina 26.20 及以后*

## 同一份 mod 代码，依赖 LeviLamina 26.40.1 能编译通过，换到 26.40.4/26.40.5 后报 LL 头文件里的编译错误（代码本身没引用这些头文件），怎么办？

从 LeviLamina 26.20 起必须使用 `clang-cl` 编译，不能再用 MSVC（`cl.exe`）。请参照 `levilamina-mod-template` 在 `xmake.lua` 中设置 `set_toolchains("clang-cl")`，并在 GitHub Actions 中安装 LLVM 22。切换工具链或版本后，需清理 xmake 缓存：删除 `.xmake` 目录，或执行 `xmake clean -a` 和 `xmake f -c` 后重新配置。

*适用版本：LeviLamina 26.20 及以后*

## 在 LeviLamina mod 的 xmake 工程中使用 vcpkg 提供的库时出现链接错误（缺少依赖库的符号），怎么解决？

xmake 引入 vcpkg 包时可能无法正确处理传递依赖，需要手动补齐。推荐直接改用 xmake 官方源中的包：通过 `add_requires` 安装所需库及其依赖（如 `zlib`、`libuv`），再调用 `add_packages`。或者，也可以在 target 中通过 `add_links` 手动添加缺失的依赖库。

*适用版本：使用 xmake 构建的 LeviLamina mod。未能从源码或文档中直接证实，仅供参考。*

## 如何编译并启用 LeviLamina 自带的测试（如 EventTest）？

构建 LeviLamina 时开启 tests 选项：先执行 `xmake f --tests=y`（可附加 `--target_type=server/client`），再执行 `xmake`。这会引入 gtest 并编译 `src-test` 目录（服务端事件测试位于 `src-test/server/EventTest.cpp`）。由于 xmake 会保留上次的配置，切换配置后若出现异常，请删除项目下的 `.xmake` 目录，或执行 `xmake f -c` 重新配置。

*适用版本：LeviLamina 26.x 当前版本*

## 如何自己编译 LeviLamina 本体？

请先安装以下工具：XMake 3.0.0+、LLVM/Clang（需将 `clang-cl` 加入 PATH）、Visual Studio 2022 或其生成工具（勾选“使用 C++ 的桌面开发”工作负载，为 `clang-cl` 提供 Windows SDK 与标准库）以及 Git。在仓库根目录直接执行 `xmake` 即可构建服务端（默认目标）；如需构建客户端，先执行 `xmake f --target_type=client` 再运行 `xmake`；附加 `--tests=y` 可启用测试。服务端还支持通过 `-p linux`（使用 clang 工具链）构建 Linux x86_64 版本，客户端则仅支持在 Windows 下构建。若遇到缓存问题，请执行 `xmake c -a` 和 `xmake f -c`。

*适用版本：LeviLamina 26.20 及以后*

## 开发 LeviLamina C++ mod 用什么 IDE 合适？用 VSCode 可以吗？

可以。常用的方案是 VS Code 搭配 xmake（安装 xmake 和 clangd 扩展），官方 mod 模板已内置 `.clangd` 和 `.vscode/launch.json` 调试配置。Visual Studio 体积较大，直接用来开发 LL mod 不够轻便；如果习惯使用 VS，可以执行 `xmake project -k vsxmake` 生成工程。无论选择哪种编辑器，都必须配置好编译工具链：当前模板与 LeviLamina 在 Windows 下均采用 `clang-cl` 工具链（`set_toolchains("clang-cl")`），因此需要安装 LLVM（将 `clang-cl` 加入 PATH），并安装 Visual Studio 2022（勾选"使用 C++ 的桌面开发"）或 VS 2022 生成工具，以提供 MSVC 标准库和 Windows SDK。

*适用版本：当前版本（LeviLamina 26.x，官方 levilamina-mod-template）*

## 开发 LeviLamina C++ mod 时编译报错（成员函数声明与定义不匹配、非静态成员函数调用错误），如何解决？

通常有以下两个原因：

1. 头文件中的声明与 `.cpp` 中的定义在 `const` 修饰上不一致——头文件和源文件需要同时加上或同时去掉 `const`。
2. 非静态成员函数不能直接通过类名调用，必须先获取实例，例如使用模板中的 `MyMod::getInstance().getSelf()`（若在类自身的成员函数内部，则可直接调用 `getSelf()`，无需 `getInstance()`）。

以上属于通用 C++ 语法规则，示例基于官方 mod 模板。

## 开发 LeviLamina mod 时用 `/Wall` 编译会出现大量警告，应该开 `/Wall` 吗？

不建议开启 `/Wall`。`/Wall` 会对结构体对齐填充等正常现象发出警告（例如 struct 中 `void*` 后面跟着 `bool` 时，会提示有 7 字节填充未使用），干扰信息极多；而在当前使用的 `clang-cl` 下，`/Wall` 等同于 `-Weverything`，输出的无关警告会更多。LeviLamina 自身采用 `/W4`（仅额外将 `/w44265`、`/w44289`、`/w44296`、`/w45263`、`/w44738` 等少数警告升级），官方 mod 模板也默认使用 `/W4`，开发 mod 保持 `/W4` 即可。

## 开发 LeviLamina mod 时，有没有方便查看 `ll` 命名空间层级和可用函数/头文件的方法？

建议使用官方的 `levilamina-mod-template`。该模板通过 xmake 的 `add_packages("levilamina")` 引入了 LeviLamina 的全部头文件。在 VS Code 中配置好 clangd 后（模板自带 `.clangd`，可通过 xmake 扩展或运行 `xmake project -k compile_commands` 生成 `compile_commands.json`），输入 `ll::` 即可借助代码补全浏览所有命名空间和函数，鼠标悬停还能查看对应的头文件。此外，也可以直接查阅 LeviLamina 仓库的 `src/ll/api` 目录或官方 API 文档（docs.levimc.org）。

*适用版本：当前版本（LeviLamina，官方 mod 模板）*

## 开发 LeviLamina mod 用的 xmake 能像 Visual Studio 一样一键构建吗？推荐用什么编辑器？

推荐使用 VS Code，并安装 xmake 和 clangd 扩展进行开发（xmake 扩展支持一键构建与调试）。如果使用命令行，在项目根目录先执行 `xmake f -y -p windows -a x64 -m release`，再运行 `xmake` 即可完成构建，编译产物位于 `bin/` 目录下。

*适用版本：当前版本（LeviLamina，官方 mod 模板）*

## 开发 LeviLamina 客户端 mod 时游戏一启动就闪退，来不及挂调试器，怎么调试？

可以在 mod 的 `DllMain`（或 mod 加载入口）处先延时约 10 秒，或通过循环等待调试器附加（例如 `while (!IsDebuggerPresent()) Sleep(100);`），为手动附加调试器留出时间；也可以直接用调试器启动 Minecraft 进程。此外，官方 mod 模板的 `.vscode/launch.json` 提供了 "GDK attach" 和 "BDS attach" 配置（需安装 Tasks Shell Input 扩展并配置 `MC_GDK_DEBUG_PATH` / `MC_BDS_DEBUG_PATH`），可以自动启动进程并附加调试器。不过该方式会在进程稳定运行约 3 秒后才开始附加，若在启动极早期崩溃，仍需配合上述等待代码。

*适用版本：当前版本（Windows）*

## 想做安卓原生 mod，在 Termux/arm64 Linux 上克隆 LeviLamina 后执行 `xmake f -p linux -a arm64` 报错 `` `arm64` is not a valid complation arch for this project, please use one of x86_64 ``，怎么办？

LeviLamina 仅支持 x86_64 架构（客户端仅支持 `windows|x64`，服务端支持 `windows|x64` 和 `linux|x86_64`），无法用于编译安卓 mod。安卓端原生 mod 采用另一套独立体系，由 Android 版 LeviLauncher 通过 Preloader SDK（`LiteLDev/preloader-android`，提供 `pl::` API）加载。请参考教程“写你的第一个 Android 原生模组”（<https://levimc.org/zh-Hans/tutorials/develop/first-android-mod/>）以及 LeviLamina 文档 `developer_guides/android` 目录下的 API 说明，不要使用 LeviLamina 本体。

## 想用 Visual Studio 手动配置 `vcxproj` 开发 LeviLamina 插件，LL 导出的 lib 去哪找？

官方推荐使用 `levilamina-mod-template`（基于 xmake）进行开发。LeviLamina 已不再单独提供可直接链接的 SDK lib：xmake 的 `levilamina` 包会使用 `clang-cl` 从源码编译 LeviLamina 及其全部依赖；如果手动编写 `vcxproj`，则需要自行编译 LeviLamina 并逐一配置所有依赖库，过程十分繁琐。若倾向于使用 Visual Studio，可以在模板项目中执行 `xmake project -k vsxmake` 生成 VS 工程，将依赖管理与链接交给 xmake 处理。

*适用版本：LeviLamina 26.x*

## 打包 LeviLamina mod 时，包描述文件里依赖的 LeviLamina 版本不改会怎样？是否默认为最新版？

不会默认使用最新版，必须手动将依赖修改为目标版本。当前模板已用 `lip.toml` 替代 `tooth.json`：需要在 `[variants."".deps]` 下设置 `"github.com/LiteLDev/LeviLamina"` 的版本范围（模板中服务端为 `"26.60.*"`，客户端为 `">26.60.6 <26.61.0"`，注意客户端依赖使用裸 id 而非 `"#client"`），同时将 `xmake.lua` 中的 `add_requires("levilamina x.x.x")` 改为对应的目标版本，否则拉取的 LL 版本将不匹配。

*适用版本：lip.toml 格式（LeviLamina 26.60.6 之后的模板）；旧 tooth.json 同理*

## 构建客户端 mod 时 xmake 报错 `error: Invalid option: --target_type=client`，是什么原因？

`--target_type` 是项目 `xmake.lua` 中通过 `option("target_type")` 声明的配置项（取值为 `server` 或 `client`，默认 `server`），必须在 `xmake.lua` 中声明后才能传入。出现此错误，说明你的 `xmake.lua` 版本过旧或经过修改，缺少 `target_type` 选项。请改用最新 `levilamina-mod-template` 中的 `xmake.lua`（其中定义了 `option("target_type")`，并通过 `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})` 将其传给 `levilamina` 包），通过 `xmake --version` 确认 xmake 已更新至最新版本，然后依次执行 `xmake f -a x64 -m release -p windows --target_type=client -y` 和 `xmake -v -y` 进行构建。

*适用版本：LeviLamina 26.x，当前 levilamina-mod-template*

## 本地用 xmake 构建 LeviLamina 本体失败（换了多个 LLVM 版本都不行），但 CI 正常，怎么排查？

1. 执行 `xmake -v` 查看实际调用的 LLVM/`clang-cl` 路径：如果安装过 Visual Studio 的 LLVM（Clang）组件，xmake 可能会优先使用 VS 自带的 LLVM，而非你单独安装的版本，此时需要将该组件卸载或避开。
2. 先执行 `xmake repo -u` 更新包仓库，再执行 `xmake -v -y` 重新构建——`parallel-hashmap` 等依赖包的版本描述问题会在仓库端修复，如果不更新本地仓库就会一直构建失败。

建议直接参照 CI 的流程：安装 LLVM 22 后先执行 `xmake repo -u`，再执行 `xmake f` 和 `xmake`。

*适用版本：LeviLamina 26.x*

## 构建 mod 时安装 levilamina 包失败，日志中 glm 等依赖报 `error STL1000: Unexpected compiler version, expected Clang 20 or newer`（VS2026 / 新版 MSVC STL），怎么解决？

这说明 xmake 检测并使用了系统中另行安装的旧版 LLVM Clang（低于 20），与新版 MSVC STL 不兼容。卸载旧版 Clang 后，可以在 Visual Studio Installer 中勾选“适用于 Windows 的 C++ Clang 工具”（`clang-cl`）组件，或者单独安装新版 LLVM（官方模板 CI 使用的是 LLVM 22），否则会报 `toolchain("clang-cl"): not found`。你可以用 `xmake -v` 确认实际调用的 clang 版本。详细的失败日志位于 `%LOCALAPPDATA%\.xmake\cache\packages\...\levilamina\<版本>\installdir.failed\logs\install.txt`。

*适用版本：LeviLamina 26.x*

## 某个开源的 LeviLamina 原生 mod 作者已停更，如何自行更新到新版 LeviLamina？

Fork 该仓库，将 `xmake.lua` 替换为 `levilamina-mod-template` 中的最新版本（注意修改 mod 名称和 LeviLamina 版本，必要时同步更新 `lip.toml` 和 `manifest.json`），然后根据新版头文件调整 include 路径与 API（Mojang 可能删除或改动了部分函数，需要相应改写），编译通过后即可向原仓库提交 PR。

## 用 LeviLamina 开发 mod 时，还需要像 LL2 那样手动把 BDS 的 lib 文件放到项目目录吗？

不需要。所有依赖均由 xmake 自动下载：`levilamina` 包及其依赖都托管在 LiteLDev 的 xmake-repo（在模板中以 `levimc-repo` 引入）中，构建时会自动拉取。当前版本的 BDS 和客户端链接数据由 `bedrockdata` 包（即 `bedrock-runtime-data`，按 `target_type` 区分 server 与 client）提供，旧的 `bdslibrary` 包仅用于 1.21.3 之前的版本。如果使用 `levilamina develop` 等未登记的版本，xmake 会按 main 分支加载依赖（正如模板注释所提示的，使用开发版时可能需要自行补充 BDS 库依赖）。

*适用版本：LeviLamina 0.x 及以上*

## 用 levilamina-mod-template 创建的项目在 Visual Studio 里输入代码时总被自动格式化成奇怪的样子，怎么关掉？

mod 模板根目录自带 `.clang-format` 配置文件，Visual Studio 会优先按该文件格式化代码。根据个人习惯修改或删除项目根目录下的 `.clang-format` 即可，也可以直接在 VS 设置中关闭键入时自动格式化。

*适用版本：当前 levilamina-mod-template*

## 用 levilamina-mod-template 创建的项目，模板更新后如何同步到自己的项目？

无法自动同步，只能对照最新模板手动修改（主要涉及 `xmake.lua`，以及 `.github/workflows`、`lip.toml` 等文件）。通过 "Use this template" 创建的仓库与原模板没有 git 历史关联，即使强行 merge 也需要手动解决冲突。

## 用 levilamina-mod-template（xmake）开发 mod 时 CLion 无法代码补全，怎么办？

在项目根目录下执行 `xmake project -k cmakelists` 生成 `CMakeLists.txt`，然后用 CLion 打开生成的 CMake 工程即可。（也可以执行 `xmake project -k compile_commands` 生成 `compile_commands.json` 供 clangd/CLion 使用，模板已自带 `.clangd` 配置。）

## 用 levilamina-mod-template，把 `add_requires` 里的 LeviLamina 指定为旧版本（如 1.4.4）后，执行 `xmake project -k compile_commands -v -y` 报“无法打开包括文件”，编译失败（用最新版就正常），怎么办？

这通常是因为下载 preloader 包时网络异常，导致 xmake 拉取的包内容不完整或有误。删除对应版本的 preloader 包目录及 xmake 缓存后重新执行即可：

1. 删除 `%LOCALAPPDATA%\.xmake\packages\p\preloader\<版本号>`（如 `v1.15.3`）；
2. 删除 `%LOCALAPPDATA%\.xmake\cache`；
3. 重新执行 `xmake project -k compile_commands -v -y`（或 `xmake -y`）。

*适用版本：使用 xmake + levimc-repo 构建 LeviLamina mod 的所有版本*

## 开发 LeviLamina C++ mod 时，控制台输出中文/UTF-8 乱码，怎么设置 UTF-8 编码输出？

推荐使用 mod 自带的 Logger（如 `getSelf().getLogger()`）进行输出。LeviLamina 在 Windows 控制台下会调用 `WriteConsoleW`，因此中文不会乱码。如果必须使用 `printf` 或 `std::cout` 直接输出，可以在启动时引入 `Windows.h` 并执行：

```cpp
SetConsoleCP(CP_UTF8);
SetConsoleOutputCP(CP_UTF8);
DWORD mode;
GetConsoleMode(GetStdHandle(STD_OUTPUT_HANDLE), &mode);
SetConsoleMode(GetStdHandle(STD_OUTPUT_HANDLE), mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
```

同时请确保源码以 UTF-8 编码编译（模板默认已带 `/utf-8` 选项）。此外，也可以在 Windows 设置中开启“Beta: 使用 Unicode UTF-8 提供全球语言支持”，但这可能会导致其他程序出现乱码。

*适用版本：Windows 下的 LeviLamina mod / 普通控制台程序*

## 用 xmake 构建 LeviLamina mod 时报错 `error: package(bedrockdata): version(xxx) not found!`（例如 1.21.60.10-server），该怎么处理？

这是因为本地的 xmake 包仓库（`levimc-repo`）缓存过旧。执行 `xmake repo -u` 更新仓库后重新构建即可。一般来说，只要某个包版本已经发布，但 xmake 却提示找不到，就需要更新仓库缓存。

*适用版本：使用 xmake + levimc-repo 构建的所有 LeviLamina 版本*

## 用 xmake 编译 LeviLamina mod（如 LegacyRemoteCall 相关项目）时内存耗尽（OOM）、编译器堆空间不足甚至 VSCode 崩溃，怎么办？

这是因为包含的头文件过多（例如使用了 `include_all` 或存在大量 `magic_enum` 宏展开），导致单个编译进程占用了大量内存。可以通过 `xmake -j <num>`（如 `xmake -j 2`）降低并行编译任务数，同时关闭其他占用内存的软件；此外，也可以精简代码中不必要的大型头文件包含。

*适用版本：当前版本（取决于机器内存）*

## 用最新的 levilamina-mod-template 创建的项目无法编译，怎么办？

需要添加 `_HAS_CXX23` 宏定义（define）。官方模板已在 commit <https://github.com/LiteLDev/levilamina-mod-template/commit/2d01125a7b8982d04019d1a006c0276d0006f5d6> 中补充了该配置：

```lua
add_defines("NOMINMAX", "UNICODE", "_HAS_CXX23=1")
```

更新模板，或者手动在 `xmake.lua` 的 target 中加上该 define 即可。

*适用版本：2026-10 之后的 LeviLamina（26.x）与 levilamina-mod-template*

## 用最新的 levilamina-mod-template 编译面向旧版 LeviLamina（如 1.4.1）的 mod，GitHub Actions 构建 client 版本失败（旧版没有 client 版），如何让 action 只构建服务端？

LeviLamina 从 1.9.0 起才正式支持客户端。开发面向旧版本的 mod 时，请打开 `.github/workflows/` 下的 `build.yml` 和 `release.yml`，删除 `matrix.target_type` 中的 `client` 项，只保留 `server` 构建。同时，还应一并删除 `lip.toml` 中 `side = "client"` 对应的 variant，并将 LeviLamina 依赖版本修改为你实际使用的版本。

*适用版本：LeviLamina 1.9.0 之前版本，使用新版模板的项目*

## 编译 LeviLamina C++ 插件时报错 C4819：该文件包含不能在当前代码页(936)中表示的字符，如何解决？

为编译器添加 UTF-8 编译参数 `/utf-8`（在 `xmake.lua` 中配置 `add_cxflags("/utf-8")`）。官方 mod 模板的 `xmake.lua` 默认已包含此参数；如果仍然报错，可能是代码中误用了中文标点等符号，或者头文件引用有误，请检查源码并确保源文件以 UTF-8 编码保存。

## 编译 LeviLamina mod 时 xmake 报错（与 preloader 包有关），怎么修复？

删除 xmake 缓存和对应版本的 preloader 包后重新编译：

1. 删除 `C:\Users\%USERNAME%\AppData\Local\.xmake\cache`；
2. 删除 `C:\Users\%USERNAME%\AppData\Local\.xmake\packages\p\preloader\<版本号>`（如 `v1.15.5`）；
3. 重新执行 `xmake` 编译。

*适用版本：使用 xmake + levimc-repo 构建的所有 LeviLamina 版本*

## 编译 LeviLamina mod 时报 `"clear": 不是 "CompoundTag" 的成员` 等编译错误，怎么解决？

当前 `CompoundTag` 没有 `clear()` 成员函数，但其内部的 `TagMap` 成员 `mTags` 是 public 的，可直接用 `nbt.mTags.clear()` 清空。此外，LeviLamina 要求 xmake 3.0.0 及以上（`xmake.lua` 中设置了 `set_xmakever("3.0.0")`），若 xmake 版本过旧（如 2.9.x），请先执行 `xmake update` 升级再构建；`bedrockdata` 等依赖会由 `levilamina` 包按版本自动引入，无需手动 `add_requires` 旧版本号。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## 编译 mod 时报 LeviLamina 头文件缺少它所依赖的其他头文件（某些类型未定义），怎么解决？

LeviLamina 的 mc 头文件由工具自动生成，部分头文件只有前向声明，可能缺少所需的 include。遇到此问题时，在 mod 中用到该头文件的源文件里，手动 `#include` 缺失类型所在的头文件即可；如果难以定位，也可以向 LeviLamina 提 PR 补全该头文件的 include。

*适用版本：LeviLamina 当前版本*

## 自行编译 LeviLamina（或用模板编译 mod）编译不通过，而旧版本能正常编译，怎么办？

请检查 LLVM/clang 版本。LeviLamina 和 mod 模板在 Windows 上使用 `clang-cl` 工具链，而 Visual Studio 自带的 clang/LLVM 往往版本过旧；请安装或更新到较新的 LLVM（官方 CI 使用 LLVM 22），同时确保 xmake >= 3.0.0，再重新编译。

*适用版本：LeviLamina 26.x*

## 调试 LeviLamina 插件崩溃时，CrashLogger 总是比 VS 调试器先抢到异常，怎么方便地调试？

开发时可使用 debug 版的 LeviLamina（release 同时提供 server 和 client 的 debug 构建包），报错时能输出更完整的堆栈。CrashLogger 在启动时若检测到调试器（`IsDebuggerPresent`）会自动禁用，因此直接用调试器启动 BDS 即可避免被抢占异常；若要在启动后再附加调试器，可在 LeviLamina 配置文件（`mods/LeviLamina/config/Config.json`）中将 `modules.crashLogger.enabled` 设为 `false` 来关闭 CrashLogger。

*适用版本：LeviLamina 1.x 及以上*
