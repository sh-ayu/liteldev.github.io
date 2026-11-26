# Building LeviLamina mods: toolchain

## How do I set up a development environment for native LeviLamina mods in C++? Where do the LL/BDS headers and libraries come from? Can I create a Visual Studio project and configure it by hand? How do I run the result on a server?

Creating a Visual Studio project and configuring headers and libraries by hand is not recommended. The recommended workflow is: install Git, Visual Studio (select "Desktop development with C++", which provides the Windows SDK and C++ libraries), LLVM (add it to PATH during installation; the current template compiles with clang-cl via `set_toolchains("clang-cl")`), and xmake. Create a repository from `LiteLDev/levilamina-mod-template` on GitHub using "Use this template", change the target name in `xmake.lua`, and pin the LeviLamina version with `add_requires("levilamina 26.60.*", ...)`, matching the first two segments of your server's version. In the project directory, run `xmake f -y -p windows -a x64 -m release` and `xmake`; xmake automatically fetches the headers and libraries and builds the project. If fetching dependencies fails, it is usually a network problem; configure a GitHub mirror proxy or an HTTP proxy for xmake. If the specified LeviLamina version cannot be found, run `xmake repo -u`. You can use any editor; VS Code with the C/C++, XMake, and clangd extensions is recommended, and you can also generate a Visual Studio project with `xmake project -k vsxmake`. Include headers like `#include "ll/api/command/CommandRegistrar.h"` and `#include "mc/world/actor/player/Player.h"`; do not reuse LSE's API naming. The build output is placed in `bin\<mod name>\` (which contains the DLL and `manifest.json`). Copy the entire folder into the server's `mods` directory, and LeviLamina will load it after the server restarts. See <https://levimc.org/tutorials/develop/first-levilamina-mod/> for details.

*Applies to: LeviLamina 1.x and later*

## Can a LeviLamina server mod be used directly on the client (LeviLamina client)? Can one DLL work for both? What adaptations does porting to the client need?

No, a single DLL cannot serve both: you must build separate server and client DLLs. When a mod that depends on LeviLamina loads, all the MC API symbols it uses are resolved, and any missing symbol causes loading to fail. The client's symbols differ greatly from BDS (much of the code is inlined, and the client has extra client-specific content), and classes such as `Actor` have different members and vtables on each side. Adaptation steps:

1. Follow the latest levilamina-mod-template to update `xmake.lua`, `manifest.json`, and the GitHub Actions workflows. Configure the client build with `xmake f --target_type=client` and then build (the default is server); side-specific code can go in `src-server` and `src-client`, respectively.
2. The package description file is now `lip.toml` (format 4): under the default variant, declare two entries with `side = "server"` and `side = "client"` (replacing the old `tooth.json` client label), and specify the dependency uniformly as `github.com/LiteLDev/LeviLamina`.
3. Register commands with `CommandRegistrar::getServerInstance()` (that is, `getInstance(false)`) or `getClientInstance()`.
4. Update code that relies on server-only features (for example, `PropertiesSettings` has full members and functions in `src-server`, but is only an empty shell struct in `src-client`); hooks and similar code require actual testing.

Also, each time the client enters a world, it effectively starts a server, so the mod must implement disable and unload logic properly.

*Applies to: LeviLamina 1.8 and later (lip.toml part: 26.60.8 and later)*

## How do I specify, update or roll back the LeviLamina version a C++ mod project depends on? What if the build still fails after changing the version?

In the mod project's `xmake.lua`, add the version after the levilamina package name, for example `add_requires("levilamina 26.60.8", {configs = {target_type = get_config("target_type")}})`. Without a version, xmake uses the latest version in the package repository's `versions.txt`. You can also specify a full 40-character commit hash or a branch name such as `levilamina main` to use the in-development version, in which case you must handle dependencies such as bdslibrary yourself. (Note that `levilamina develop`, mentioned in the template comments, no longer works: the LeviLamina repository no longer has a develop branch, and the development branch is now main.) After changing the version, run the following commands in order: `xmake repo -u` (updates package repositories such as levimc-repo so your local copy recognizes the new version), `xmake c -a` (clears all build caches), `xmake f -c` to reconfigure if necessary, and then `xmake` to build. If you use VSCode/clangd code completion, also run `xmake project -k compile_commands` to regenerate the compile commands. Note: if you specify a version that is not listed in the package repository, xmake treats it as a Git branch and tries to fetch it, producing errors such as `Remote branch ... not found`.

## When building a mod with xmake and specifying a levilamina version, I get `Remote branch x.y.z not found in upstream origin` or the warning `Unknown version: x_y_z, will use main branch dependencies`. What should I do?

This happens because `versions.txt` in your local xmake package repository (LiteLDev/xmake-repo, named levimc-repo in the project) does not list that version. When xmake cannot find the version in the list, it treats the version string as a git branch name and tries to fetch it from the LeviLamina repository, producing `Remote branch x.y.z not found`. The levilamina package script prints the `Unknown version: x_y_z, will use main branch dependencies` warning when it cannot find `versions/<x_y_z>.lua` (this also happens when you specify a commit or branch; it is normal and falls back to the main branch's dependency configuration). Your local repository may be out of date, or xmake-repo may not (yet) include the version after a LeviLamina release (for example, xmake-repo currently does not include v26.20.2 or v1.6.2). To fix it:

1. Run `xmake repo -u` to update the package repository. If necessary, also run `xmake c -a` (or delete the project's `.xmake` directory) and retry.
2. If xmake-repo still lacks the version, specify the full 40-character commit hash of the corresponding LeviLamina tag in `add_requires` (a short hash is treated as a branch name and fails the same way), or switch to an adjacent version that is included.

The version matches with or without the `v` prefix. If the download fails, also check your network and proxy settings.

## When building a LeviLamina mod with xmake, downloading dependency packages (levilamina, entt, expected-lite, libhat, etc.) or fetching the package repository keeps failing or is very slow. What should I do?

This is almost always a network issue when connecting to GitHub. Because xmake and git do not necessarily use the system proxy, configure them as follows:

1. Set a proxy for xmake with `xmake g --proxy=http://127.0.0.1:port`, or set environment variables in the same terminal before building (in cmd: `set HTTP_PROXY=http://127.0.0.1:port` and `set HTTPS_PROXY=http://127.0.0.1:port`). Also set a proxy for git: `git config --global http.proxy http://127.0.0.1:port`. Alternatively, run your proxy software in TUN (system-level transparent proxy) mode. Do not use the hosts acceleration mode in tools such as Steam++.
2. Use a mirror: write a pac file (for example, at `%LOCALAPPDATA%\.xmake\pac.lua` or any absolute path) that defines `function mirror(url) ... end` to rewrite github.com URLs to a working mirror, then run `xmake g --proxy_pac=<file>`. Note: older tutorials (including the LeviLamina build documentation) suggest `xmake g --proxy_pac=github_mirror.lua`, which relied on xmake's built-in `scripts/pac/github_mirror.lua`. This file was removed in xmake v2.9.8 (2025-01), so that command no longer works in newer versions. See "Network optimization" in the xmake documentation: <https://xmake.io/zh/guide/package-management/network-optimization.html>
3. If your project or global configuration sets a proxy or mirror that does not suit your network (for example, you are outside mainland China or already using a proxy, but have a mainland China mirror configured), remove it or switch back to the direct GitHub source.
4. As a fallback, get the already-downloaded packages from someone else and place them in the xmake package cache directory at `%LOCALAPPDATA%\.xmake\packages\<first letter>\<package name>` (for example, levilamina goes in `packages\l\levilamina`); or download the source package manually and run `xmake g --pkg_searchdirs=<absolute path>` to point xmake to the local directory.
5. If fetching a git repository cache hangs, go to the repository cache directory reported in the xmake error, run `git fetch` manually, and retry. You can also run `xmake repo -u` and `xmake c -a` to clean the cache first, and then rebuild.

## When building a LeviLamina mod with xmake (levilamina-mod-template), fetching a repository or downloading dependencies fails with an SSL certificate error, for example `fatal: unable to access 'https://github.com/LiteLDev/xmake-repo.git/': SSL certificate problem: unable to get local issuer certificate` (or xmake-mirror/build-artifacts.git). What should I do?

This is a local network or certificate issue when your machine connects to GitHub—not a problem with xmake or LeviLamina. GitHub's certificate chain is missing or untrusted on your machine, usually because a proxy or accelerator is intercepting HTTPS. LeviLamina's package repository, levimc-repo (<https://github.com/LiteLDev/xmake-repo.git>), and most dependencies are hosted on GitHub. To fix it:

1. Check your network and proxy settings, and use a stable, reliable proxy to reach GitHub (accelerators such as Watt Toolkit replace certificates and are unreliable).
2. If the certificate chain really is missing locally, open GitHub in a browser, export the site certificate, and install it into "Trusted Root Certification Authorities".
3. If certificate verification fails while xmake downloads packages through curl, run `xmake g --insecure-ssl=y` to disable SSL verification globally (see the xmake FAQ entry "What to do when downloading a package reports a certificate verification failure").

To build the project: in the project directory, run `xmake repo -u`, then `xmake f -y -p windows -a x64 -m release` (or `-m debug`), and finally `xmake`. The build output is placed in `bin/`. If you use Visual Studio, generate a vsxmake project as described in the xmake documentation before building. Make sure git is installed beforehand; the current template also uses the clang-cl toolchain, so you need LLVM installed (the template CI uses LLVM 22).

## Running `xmake f -m debug` or similar reports `note: the following packages were not found in any repository (check if they are spelled correctly): -> levilamina -> levibuildscript`, or the specified levilamina version cannot be found. How do I fix it?

1. Make sure `xmake.lua` includes LiteLDev's package repository: `add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")`. Delete any outdated configuration left over from older templates and follow the `xmake.lua` from the latest levilamina-mod-template.
2. Run `xmake repo -u` to update the package repositories.
3. If the packages still cannot be found, clear the cache: delete the `.xmake` folder in the project directory (or run `xmake c -a`), run `xmake repo -u` again, and then rerun `xmake f -m debug` (or release) and build.
4. If `xmake.lua` hard-codes a version in `add_requires("levilamina x.x.x")`, make sure that version exists in xmake-repo. You can update it to the latest version, omit the version number to use the latest automatically, or use `add_requires("levilamina develop")` (if you use develop, you must add bdslibrary yourself).

## When compiling levilamina-mod-template, xmake hangs for hours installing the levilamina dependency package (installing levilamina), or fails with `error: unable to parse semver`. How do I fix it?

The levilamina package is compiled locally from source during installation and has to fetch xmake-repo and its dependencies from GitHub, so installation is naturally slow. However, a multi-hour hang or an `unable to parse semver` error is usually a network problem: xmake could not fetch xmake-repo and therefore cannot find the specified version. To fix it:

1. Enable your proxy's TUN (virtual network adapter) mode, set a proxy environment variable for xmake in PowerShell (for example, `$env:all_proxy="http://127.0.0.1:port"`), or configure a global proxy in xmake with `xmake g --proxy="http://127.0.0.1:port"`.
2. Delete the `.xmake` folder in the current project directory and try again.
3. Follow the standard build steps: after cloning the template, run `xmake repo -u`, `xmake f -m debug` (or `xmake f -y -p windows -a x64 -m release`), and `xmake`.
4. You can also specify a commit hash or branch instead of a version number, or manually download the package that is getting stuck if needed.

Note that the current template uses the clang-cl toolchain, so you must install LLVM first (CI uses LLVM 22).

## When developing a LeviLamina C++ mod (levilamina-mod-template) in VSCode, xmake compiles fine but the editor cannot find headers, shows red squiggles everywhere, and has no completion for LL/BDS classes and functions. How do I fix it?

Do not download headers manually, copy them into `src`, or add paths to `includePath` by hand. xmake's package manager downloads LeviLamina and its dependencies automatically; the editor is simply missing the `compile_commands.json` compilation database.

1. In VSCode, open the project root containing `xmake.lua`, then run `xmake f -y -p windows -a x64 -m release` and `xmake` once to finish downloading the dependencies.
2. Generate the compilation database: run `xmake project -k compile_commands` in the project root (which outputs the file to the root), or install the VSCode XMake extension and run "XMake: Update Intellisense" with Ctrl+Shift+P. Note that the XMake extension outputs `compile_commands.json` to the `.vscode` directory by default, whereas clangd only searches the project root and its parent directories by default. Either change the XMake extension's output directory, pass `--compile-commands-dir=.vscode` to clangd, or generate the file into the root from the command line.
3. We recommend using clangd (it requires LLVM; the template ships with a `.clangd` configuration). After generating the database, restart clangd or reload the window and wait for indexing to finish. Because clangd conflicts with Microsoft C/C++ (cpptools) IntelliSense, disable cpptools IntelliSense when using clangd. If you prefer to use cpptools, set `C_Cpp.default.compileCommands` to point to the generated `compile_commands.json`.
4. Whenever headers or dependency versions change, regenerate `compile_commands.json`. If the configuration becomes corrupted, delete the generated files under `.vscode` and start over. As long as xmake compiles, false errors in the editor do not affect the build.

Other IDEs: For Visual Studio, generate a sln with `xmake project -k vsxmake`. CLion can import the root `compile_commands.json` directly; if the standard library is marked red, switch the toolchain to Visual Studio. The build itself requires Visual Studio (with the "Desktop development with C++" workload, which provides the Windows SDK) and LLVM (the template compiles with clang-cl). MinGW is not supported.

## When developing a LeviLamina C++ mod in Visual Studio, after simply using "Open Folder" there is no completion, `#include` reports errors or "Go to Definition" cannot find headers, and the generated project does not show the headers either. What should I do?

Do not open an xmake project with Visual Studio's "Open Folder". Because headers are downloaded by xmake's package manager, first run `xmake f -y -p windows -a x64 -m release` and `xmake` once in the project directory to download the dependencies and build the project, and then generate a Visual Studio project with xmake:

```powershell
xmake project -k vsxmake -m "debug,release"
```

Open the `.sln` file in the generated `vsxmake` directory, and indexing and completion will work as expected.

Notes:

- vsxmake only includes headers declared with `add_headerfiles` in the project; it does not scan `add_includedirs`. The current template's `xmake.lua` already has `add_headerfiles("src/**.h")`; if you use `.hpp` or other directories, add them yourself, for example `add_headerfiles("src/**.h", "src/**.hpp")`.
- When you create a new file in the sln generated by vsxmake, Visual Studio may place it in the generated directory instead of under `src`. Move the file to `src` manually and regenerate the project.
- You can also generate a CMake project with xmake (`xmake project -k cmakelists`) and open it using Visual Studio's CMake support, or use Visual Studio's xmake extension. For VSCode, configure the project using compile_commands.

## How do I debug a LeviLamina C++ mod with breakpoints? Why does "launching" `bedrock_server_mod.exe` directly from VS/VSCode for debugging not work?

Start the server first and then attach the debugger; do not launch BDS directly from the debugger. Since LeviLamina 1.2.0, PreLoader's runtime protection makes any launch with a debugger attached before Runtime Data loads fail with "`Failed to load Runtime Data ... please attach it after Runtime Data is loaded`".

- Visual Studio: run `bedrock_server_mod.exe` normally, then choose "Debug → Attach to Process" and select `bedrock_server_mod.exe`.
- VSCode: use a configuration with `"type": "cppvsdbg", "request": "attach"` in `.vscode/launch.json` and select the process to attach to. The current levilamina-mod-template already ships a `.vscode/launch.json` with "BDS attach" and "GDK attach" configurations: install the Tasks Shell Input VSCode extension, set the `MC_BDS_DEBUG_PATH` environment variable (the full path to the BDS executable, or `MC_GDK_DEBUG_PATH` for the client), and optionally `MC_SYMBOLS_PATH` (the symbols directory), and it will launch and attach in one click.
- To debug early startup (such as `load()`/`enable()`): run `set PL_DEBUG=1` on the command line first, then run `bedrock_server_mod.exe`. PreLoader pauses after loading Runtime Data, waits for a debugger to attach, and continues once it is attached.
- Seeing source code requires a PDB that matches the mod DLL. Setting `set_symbols("debug")` in the template's `xmake.lua` generates a PDB, which is required to view source code and set breakpoints; without one, you only get disassembly. For lower-level debugging, use x64dbg or WinDbg.
- Script plugins such as LSE's JS cannot be debugged this way.
- If LeviLamina detects an existing debugger when initializing CrashLogger (for example, one attached early with `PL_DEBUG=1`), it prints "`Debugger detected, CrashLogger will not be enabled`" and skips enabling CrashLogger. If you attach after the server has started, CrashLogger is already enabled, but the debugger still catches exceptions first.

*Applies to: LeviLamina 1.2.0 and later*

## BDS has switched from MSVC to clang. Must LeviLamina C++ mods switch compilers too? Can I still compile with MSVC?

Yes, you must switch. The new BDS is compiled with clang, so LeviLamina had to follow by switching to clang-cl. MSVC and clang differ in many features, and the same code can have a completely different ABI under the two compilers. Continuing to compile mods with MSVC causes event listener errors, broken features, or even an immediate crash when the server starts. Use the configuration from the latest levilamina-mod-template: set `set_toolchains("clang-cl")` in `xmake.lua` (keeping the template's cxflags for clang_cl) and install LLVM locally (the template CI uses LLVM 22).

*Applies to: LeviLamina 26.20.0 and later*

## Can LeviLamina and its C++ mods be built with CMake (like Endstone plugins)?

Only xmake is officially supported (`levilamina-mod-template`). If you really need CMake, you can have xmake generate a CMake project with `xmake project -k cmakelists`, though the generated dependency paths all point into the xrepo directory. In addition, before linking, a mod requires the prelink step from the `levibuildscript` linkrule, which processes the object files with `prelink.exe` and `bedrock_runtime_data` and adds `/DELAYLOAD:bedrock_runtime.dll`. In CMake, you must add this step yourself to link correctly. To drop xmake completely, you have to write your own `CMakeLists.txt` and supply all the dependencies yourself.

## Can I build LeviLamina C++ mods without a Windows environment (macOS, WSL/Linux, GitHub Codespaces)?

Building mods is officially supported only on Windows: the template uses the `clang-cl` toolchain, which requires the Windows SDK and the MSVC STL headers and libraries. macOS and Linux are not officially supported, and BDS cannot run on macOS either. Without a Windows environment, push the source to a GitHub repository, build it with the `windows-latest` runner on GitHub Actions (the mod template ships with `.github/workflows/build.yml`), and download the output from Artifacts on the Actions run page (you must be logged in to GitHub to download it). If you insist on working on Linux, you can try msvc-wine (<https://github.com/mstorsjo/msvc-wine>) to provide the Windows SDK and MSVC environment, though this is not officially supported.

## When building with `levilamina-mod-template`, the version in `manifest.json` is always `0.0.0`, or I get `Failed to parse version tag, using 0.0.0`. Where do I set the version?

The version is not taken from `tooth.json`. At build time, the `levibuildscript` modpacker reads the git tag with `git describe --tags --abbrev=0` and parses it in `vX.Y.Z` format; if there is no tag, or the tag is in the wrong format, it falls back to `0.0.0`. To fix this:

1. Clone the repository with `git clone` (a downloaded zip does not contain `.git`).
2. Create a tag with a `v` prefix, such as `git tag v0.1.0`, and then build.

You can also set the version manually in `xmake.lua`: `add_rules("@levibuildscript/modpacker", {modVersion = "1.0.0"})`.

*Applies to: mod templates using the levibuildscript modpacker (current version)*

## What is `MemoryOperators.cpp` in the mod template for? Can I delete it? What if the mod fails to load after I delete it?

This file contains `#define LL_MEMORY_OPERATORS` and `#include "ll/api/memory/MemoryOperators.h"`, which make the mod use LeviLamina's unified global `operator new/delete` (BDS customizes memory allocation and LL uses mimalloc, so all mods must use the same allocator). Current versions of LeviLamina check whether a mod exports `ll_memory_operator_overrided`; if not, LeviLamina refuses to load it and reports `<mod> will not be loaded because it isn't using the unified memory allocation operator`. Do not delete this file—if you already have, restore it. If you prefer not to keep a separate file, you can place those two lines in one (and only one) of the mod's other source files instead. If the build fails with an error related to MemoryOperators, run `xmake repo -u` to update xmake-repo, then rebuild.

*Applies to: LeviLamina 1.0 and later*

## My mod builds locally but fails on GitHub Actions (or in a freshly cloned repository) with header-related errors. What should I do?

LeviLamina now uses `clang-cl`, and the LLVM preinstalled on the Actions Windows runner may be too old. Install a newer LLVM in your workflow (as in the latest template):

```yaml
- name: Setup LLVM
  uses: ZhongRuoyu/setup-llvm@v0
  with:
    llvm-version: 22
```

Also run `xmake repo -u` before building to update xmake-repo. The easiest approach is to sync your workflow directly with `.github/workflows/build.yml` from the latest `levilamina-mod-template`. If the build fails because the dependencies for a new LeviLamina release are not ready yet, pin the version in `xmake.lua`, for example: `add_requires("levilamina x.x.x")`.

*Applies to: LeviLamina 26.20.0 and later*

## A third-party DLL that my C++ mod depends on (a library in the mod directory, or an external DLL such as `jvm.dll` that is not on PATH) is not found and the mod fails to load (even `onLoad` never runs). What should I do?

When Windows loads a mod DLL, it resolves the import table and loads all dependent DLLs; if any of them cannot be found, loading fails (error code 126/127, with dependency diagnostics from LeviLamina). Windows has no rpath, so before loading a native mod, LeviLamina appends that mod's directory to `PATH`. Any dependent DLL placed in the mod directory (or the BDS root directory) will therefore be found automatically. For an external DLL whose location varies (such as `jvm.dll`), either add its directory to the system `PATH`, or avoid linking its imports statically and load it at runtime with `LoadLibrary`/`GetProcAddress` (or LeviLamina's `ll::sys_utils::DynamicLibrary` wrapper). Loading it at runtime lets you locate `JAVA_HOME` in the order "config file → environment variable → registry". You can also pass the `/DELAYLOAD` linker option to delay-load the DLL (the `levibuildscript` linkrule itself uses this to delay-load `bedrock_runtime.dll`).

## How do I add a third-party library (such as soci) to a LeviLamina C++ mod (xmake template)? What if soci reports at runtime that the backend is not found?

If the library is in the official xmake repository (xmake-repo), add it with `add_requires` in `xmake.lua` and `add_packages` in the target. soci is in xmake-repo, and you can enable a backend through its package configs—for example, `add_requires("soci", {configs = {mysql = true}})` (other backends work the same way). If a library is not in the official repository, you can pull it from vcpkg through xmake, such as `add_requires("vcpkg::soci")` (see "Add vcpkg dependency packages" in the xmake documentation); otherwise, you must build the DLL or static library yourself and link it manually. At runtime, soci loads each backend DLL dynamically with `LoadLibrary`, so the backend DLL must be either in a searchable location (the current working directory, `PATH`, or the mod directory, since LeviLamina adds the mod directory to `PATH`) or specified through the backend search path; otherwise, soci reports that the backend cannot be found. Note that the soci package in xmake-repo builds as a static library by default (`shared=false`). In that case, the backend is linked statically and no DLL is looked up at runtime, so you must register the backend explicitly before use—either by calling `soci::register_factory_mysql()`, or by creating the session directly with the `soci::mysql` factory object. Finally, because mods are now compiled with `clang-cl`, third-party C++ libraries should preferably be built by xmake using the same toolchain.

## Can the LeviLamina (LL3) mod template be used to write LiteLoaderBDS (LL2) plugins? Where is the LL2 C++ plugin template?

No. `levilamina-mod-template` only works with LeviLamina. The LL2 C++ plugin template is at <https://github.com/LiteLDev/liteloaderbds-plugin-template>. Both that repository and LiteLoaderBDS itself are archived and no longer maintained, so you should migrate to LeviLamina.

*Applies to: current version (LiteLoaderBDS is archived)*

## After creating a C++ mod project from `levilamina-mod-template` there is no `include` (header) folder. Where are the LeviLamina headers?

Nothing is missing: the template has no separate `include` directory (older tutorial screenshots are outdated). Use <https://github.com/LiteLDev/levilamina-mod-template> directly and run `xmake` (build) or `xmake f` (configure) once; xmake automatically pulls LeviLamina and other dependencies from levimc-repo. The headers are stored in xmake's package cache directory—on Windows, `C:/Users/<username>/AppData/Local/.xmake/packages/l/levilamina/<version>/<hash>/include`.

## Now that BDS no longer ships a PDB, how do LeviLamina mods link symbols, and can they still hook?

Bedrock runtime data (the "magic blob", provided by the xmake package `bedrockdata`) replaces the PDB. The blob contains no plain-text symbols, only a "symbol hash -> RVA" mapping. When you build a mod, the prelink tool runs before linking: it hashes the external symbols the mod uses, looks them up in the blob, and generates a fake lib for linking. At runtime, symbols are resolved the same way. xmake automatically downloads `bedrockdata` and the matching prelink version as dependencies, so no manual setup is needed. Hook syntax is unchanged; see `src-test/client/jsonUITest.cpp` in the LeviLamina repository. PeEditor now only injects PreLoader into `bedrock_server.exe` to produce `bedrock_server_mod.exe` and no longer uses the PDB.

*Applies to: BDS 1.21.20+ / LeviLamina 0.13+ to current*

## After a C++ mod subscribes to `ServerCommandRegisterEvent`, the event listener produces no output. What is wrong?

You are most likely using the wrong compiler. Recent BDS and LeviLamina builds are compiled with `clang-cl`, so your mod must also be compiled with `clang-cl` (update to the latest `levilamina-mod-template`, whose `xmake.lua` already includes `set_toolchains("clang-cl")`, and install LLVM). A mod compiled with MSVC will still build and load, but its type names do not match those of BDS/LL, so event listeners will not fire.

*Applies to: LeviLamina 26.x (after BDS switched to clang-cl)*

## When a C++ mod includes the RemoteCall header, clangd shows errors everywhere and `compile_commands.json` has no information about the package. What should I do? Should a prerequisite mod meant for other C++ mods use RemoteCall?

First, make sure `xmake.lua` has `add_requires` for the package and `add_packages` in the target (the xmake package name for RemoteCall is now `legacyremotecall`). Then, in VS Code, press Ctrl+Shift+P and run `UpdateIntellisense` from the xmake extension (or run `xmake project -k compile_commands`) to regenerate `compile_commands.json`, and restart clangd. Also, a prerequisite mod meant for other C++ mods should not use RemoteCall; instead, export functions directly with `__declspec(dllexport)` (see the interface export guide in the official documentation).

## A mod build fails on GitHub Actions and the log has warnings related to cmake. How do I troubleshoot?

Check the errors earlier in the log rather than the warnings. In one case, the runner environment lacked Python (which is needed when building certain dependency packages with cmake), and adding `actions/setup-python` to the workflow fixed the issue. Base your workflow on the one in the latest `levilamina-mod-template`, which includes required steps such as `setup-xmake`, `setup-llvm`, and `xmake repo -u`.

*Applies to: when building mods with GitHub Actions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How does a LeviLamina mod adapt to a new game version (such as 26.20) and handle versioning? Is the matching SDK downloaded automatically at build time?

Set the target LeviLamina/game version in `xmake.lua` using `add_requires("levilamina x.x.x", ...)` (if you omit the version, xmake uses the latest), and xmake will fetch the matching LeviLamina package at build time. Package metadata for publishing is now stored in `lip.toml` (older templates use `tooth.json`). Specify the matching LeviLamina version range under `deps`—for example, `"github.com/LiteLDev/LeviLamina" = "26.60.*"` for the server variant (the client variant in the template's `lip.toml` uses `">26.60.6 <26.61.0"` because 26.60.6 is the last version to use `tooth.json`). In addition, `xmake.lua` no longer needs `add_requires` for nlohmann_json, as the LeviLamina package already exposes it as a public dependency.

*Applies to: current levilamina-mod-template (lip.toml format)*

## Where should I run the xmake command that generates the VS Code configuration mentioned in the LeviLamina mod development docs?

You can run it in any terminal, as long as the current directory is the project root (the folder containing `xmake.lua`). This is a built-in xmake feature (for example, `xmake project -k compile_commands` generates `compile_commands.json`); see the xmake documentation for details. The xmake extension for VS Code can also generate and update these configurations automatically.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## When a LeviLamina mod uses events (such as `ServerStartedEvent`), linking reports unresolved symbols. How do I fix it?

xmake may have cached an old LeviLamina package, causing a mismatch between the headers and the library. Run `xmake repo -u`, delete `%LocalAppData%\.xmake` along with the `.xmake` and `build` folders in the project directory, then run `xmake f` and `xmake` again. Also make sure you compile with the `clang-cl` toolchain.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Building a LeviLamina mod with xmake keeps failing. How do I troubleshoot?

1. Make sure the toolchain is up to date: the Visual Studio/MSVC build tools (which provide the Windows SDK and the STL) and LLVM (mods are compiled with `clang-cl`);
2. Run `xmake repo -u`;
3. Delete `%LocalAppData%\.xmake`, then delete caches such as `.xmake` and `build` in the project directory;
4. Run `xmake f -y -p windows -a x64 -m release` again, check for errors during the configure stage, and then build with `xmake`.

## Are the MC headers shipped with each Minecraft version update of LeviLamina (the headers under `src/mc`) written by hand or generated automatically?

They are now generated automatically by tools (only very early versions were written by hand). That is why the MC headers have almost no comments and contain markers such as `// auto generated inclusion list` and `// auto generated forward declare list`.

## Can a LeviLamina mod act as a dependency library for other mods, like a Java library mod? Will it create multiple copies of the data?

Yes. In the prerequisite mod, export functions and classes with `__declspec(dllexport)` (follow LeviLamina's LLAPI macro, as shown below, and add `add_defines("MOD_EXPORT")` to the prerequisite mod's `xmake.lua`):

```cpp
#ifdef MOD_EXPORT
#define MODAPI __declspec(dllexport)
#else
#define MODAPI __declspec(dllimport)
#endif
```

The consuming mod uses `dllimport`, links the import library, and declares the dependency in its `manifest.json`—for example, `"dependencies": [{ "name": "RequiredMod", "version": "^1.2.3" }]` (`optionalDependencies` and `loadBefore` are also available). LeviLamina sorts mods by dependency and loads dependencies first, so the consuming mod does not need to load the prerequisite DLL itself. Because Windows reference-counts DLLs, each DLL is loaded only once and keeps a single copy of its global variables, so no duplicate copies are created.

*Applies to: LeviLamina current version (Windows native mod)*

## In VSCode clangd, some code regions wrapped in macros (`#if`/`#ifdef` blocks) are greyed out with no completion. How do I get completion there?

The macro must be active in the compile arguments: add it with `add_defines` in `xmake.lua`, then in VSCode press Ctrl+Shift+P and run `XMake: UpdateIntellisense` to regenerate `compile_commands.json`, and finally run `clangd: Restart language server`. Adding `-D` arguments directly in `.clangd` is unreliable, and clangd provides no completion in disabled macro branches.

*Applies to: mod development with xmake + VSCode clangd. Not confirmed against the source code or the documentation: treat it as a pointer.*

## When my Windows user name is in Chinese, xmake fails with garbled paths when building an LL mod or installing dependency packages. What should I do?

Non-ASCII characters break the paths to xmake's global cache and package directory. Either switch to a new account with an English user name, or move the xmake global directory to an ASCII-only path by setting the `XMAKE_GLOBALDIR` environment variable to an English directory and rebuilding.

*Applies to: building mods with xmake on Windows when the user directory contains non-ASCII characters. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In an xmake package description (for example when submitting a package to xmake-repo or writing a custom package), what is the hash in `add_versions` and how do I get it?

If the package uses a source archive download URL (`set_urls`/`add_urls` pointing to a zip or tar.gz), the hash is the SHA-256 of that version's archive, which xmake uses to verify the download. If the package uses a Git repository URL (such as `https://github.com/xxx/yyy.git`), use the Git commit hash for the corresponding version.

*Applies to: current xmake / LiteLDev xmake-repo*

## Every xmake build of a LeviLamina mod takes ten to twenty minutes and recompiles LeviLamina. Why?

The `levilamina` xmake package is compiled and installed from source. Usually a prerequisite dependency (such as gmlib or bsci) requires a different LeviLamina version or configuration (such as `target_type`) than the mod's own `add_requires`, forcing xmake to build two separate versions of LeviLamina. To avoid duplicate builds, make sure all dependencies use the same LeviLamina version and configuration.

*Applies to: building mods that depend on the levilamina package with xmake*

## xmake builds of a mod show cache problems related to prelink/bedrockdata, and deleting the project files is undesirable. How do I clean up?

Delete the `prelink`, `bedrockdata`, and `levilamina` packages under `packages` in the xmake global directory (on Windows, this defaults to `C:\Users\<username>\AppData\Local\.xmake`, or `%LOCALAPPDATA%\.xmake`, not the project directory), then reconfigure with `xmake f` and rebuild. You can also run `xmake c -a`, or delete the `.xmake` and `build` directories in the mod project directory. If nothing else works, reinstall xmake.

*Applies to: LeviLamina current version (Windows, xmake build)*

## When building a LeviLamina mod, xmake reports that the header `#include "pl/Config.h"` is not found (or the LL SDK headers have strange content), and clearing caches does not help. How do I fix it?

This is usually caused by a network issue that left the LeviLamina, preloader, or other dependency packages downloaded by xmake incomplete (for example, an earlier download was interrupted and xmake later used the corrupted package). `pl/Config.h` comes from the preloader package. To fix this, delete the package cache under `C:\Users\<username>\AppData\Local\.xmake` (or the entire directory) and download the packages again, or copy the xmake `packages` folder from a machine where the build succeeds. If your connection is unreliable, you can configure a GitHub mirror for xmake by creating `github_mirror.lua`:

```lua
function mirror(url)
    url = url:gsub("github.com", "<mirror-domain>")
    return url
end

function main(url, host)
    return true
end
```

Then run `xmake g --proxy_pac=<absolute-path-of-the-file>` (do not delete the file afterward).

*Applies to: building mods with xmake in environments with unreliable access to GitHub. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why does adding the LeviLamina dependency (`add_requires("levilamina")`) to an xmake project also pull in PreLoader?

This is normal. Installing the `levilamina` xmake package builds LeviLamina from source. Because LeviLamina is loaded by PreLoader and depends on it at runtime, LeviLamina's own `xmake.lua` includes `add_requires("preloader ...")`. As a result, installing the `levilamina` package also pulls in the `preloader` package.

## Building a mod with a new LeviLamina version (such as 26.51.x and later) fails with `ll/api/reflection/Reflection.h: error: no member named 'to_underlying' in namespace 'std'`. What should I do?

Enable the C++23 library features of the MSVC STL by adding the `_HAS_CXX23` macro to the target in the mod's `xmake.lua`, as shown in the latest `levilamina-mod-template`:

```lua
add_defines("NOMINMAX", "UNICODE", "_HAS_CXX23=1")
```

The template still uses `set_languages("c++20")` and `set_toolchains("clang-cl")`, relying on `_HAS_CXX23=1` to enable C++23 library functions such as `std::to_underlying`.

*Applies to: LeviLamina 26.51 and later, mods using the levilamina-mod-template structure*

## When using `levilamina-mod-template`, how do I rename `MyMod` (the class name) and `my_mod` (the namespace) in the template?

Rename the `my_mod` namespace to match your mod; you can change the `MyMod` class name to whatever you like (such as `Entry` or your mod's name). Make sure to update all of the following together, or the build will fail: the class name and namespace in `src/mod/MyMod.h` and `MyMod.cpp`, and `LL_REGISTER_MOD(my_mod::MyMod, my_mod::MyMod::getInstance());` at the end of `MyMod.cpp`. Also update `target("my-mod")` in `xmake.lua` to your mod's name (the build script uses the target name to populate `name` in `manifest.json` automatically).

*Applies to: current levilamina-mod-template*

## Building `levilamina-mod-template` (native mod) with xmake fails, or reports that the cxx program cannot be found (no C++ compiler). What should I do?

Usually, the build environment is incomplete. On Windows, the current template uses the `clang-cl` toolchain, which requires the following:

1. Install Visual Studio 2022 or later with the "Desktop development with C++" workload (including MSVC and the latest Windows SDK, since `clang-cl` depends on its standard library and SDK).
2. Install LLVM (the official CI currently uses LLVM 22) and make sure `clang-cl` is in your `PATH`.
3. Install or update xmake to version 3.0.0 or later.

After installing these components, clear the cache with `xmake c -a`, then reconfigure and build with `xmake f -c -y -p windows -a x64 -m release`.

*Applies to: current levilamina-mod-template / LeviLamina 26.x*

## With the latest LeviLamina version, my mod project's CI build keeps failing. Which toolchain should I use?

Recent LeviLamina versions must be compiled with `clang-cl` (LLVM). Update your CI to match the latest `levilamina-mod-template`: add the following to your workflow

```yaml
- name: Setup LLVM
  uses: ZhongRuoyu/setup-llvm@v0
  with:
    llvm-version: 22
```

then run `xmake repo -u`, `xmake f -a x64 -m release -p windows -v --target_type=${{ matrix.target_type }} -y`, and `xmake -v -y` in that order. You must also sync `xmake.lua` with the template (`set_toolchains("clang-cl")`, `_HAS_CXX23=1`, and so on).

*Applies to: LeviLamina 26.x (the official CI has used LLVM since 2026-08)*

## All dependencies are set to the latest versions, but building a mod gives LeviLamina header errors about the platform macros `LL_PLAT_S` / `LL_PLAT_C`. How do I fix it?

This happens because no platform macro is defined. The `levilamina` xmake package in levimc-repo now defines `LL_PLAT_S` (server) or `LL_PLAT_C` (client) automatically based on `target_type`, so the template no longer defines them manually. To fix this:

1. Run `xmake repo -u` to update the package repository to the latest version.
2. Declare `option("target_type")` and write `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})`, as in the latest template.
3. If you are using an older package repository that does not define them automatically, add them manually in the target:

```lua
if is_config("target_type", "server") then
    add_defines("LL_PLAT_S")
else
    add_defines("LL_PLAT_C")
end
```

*Applies to: LeviLamina 26.x and later*

## When writing a LeviLamina C++ mod, the IDE (clangd) reports errors for constructs such as `overloaded` + `std::visit`. How do I make clangd use the right C++ standard and include paths?

These errors occur because clangd does not have the project's compile arguments (language standard, include paths, and macros). Run this in the project directory:

```shell
xmake project -k compile_commands
```

This generates `compile_commands.json`, from which clangd reads the compile arguments automatically (the template uses `set_languages("c++20")` and defines `_HAS_CXX23=1`). Regenerate this file whenever you change `xmake.lua` or the dependencies.

## After upgrading LeviLamina or updating Visual Studio, building a mod with xmake gives inexplicable compile errors. What should I do?

First, run `xmake c -a` to clear all build caches, then rebuild. If that does not help, delete the `.xmake` and `build` folders in the project, then reconfigure and build with `xmake f -c -y`. Also update the package repository with `xmake repo -u`, and make sure `xmake.lua` and your CI match the latest `levilamina-mod-template` (`clang-cl` toolchain, LLVM 22, `_HAS_CXX23=1`). For a period, neither VS2026 nor VS2022 could compile mods; that was a bug in the Microsoft compiler that has since been fixed, so updating Visual Studio is enough.

## After upgrading LeviLamina (such as 1.9.2 and later), my own mod fails to build both locally and on GitHub Actions. How do I fix it?

Update the mod's `xmake.lua` to match the latest `levilamina-mod-template`: add the `target_type` option (`option("target_type")` defaults to `server`, with `server` and `client` as choices) and declare the dependency with `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})`. At the end of the target, separate server and client sources with `is_config("target_type", "server")`. Sync the GitHub Actions `build.yml` with the template as well (use a matrix to build both server and client with `xmake f ... --target_type=${{ matrix.target_type }}`).

*Applies to: LeviLamina 1.9.x and later (including 26.x)*

## After upgrading to a new LeviLamina version (from 26.20), clang crashes when building a mod. What should I do?

Sync the mod's `xmake.lua` and GitHub Actions workflow with the latest `levilamina-mod-template` (the template uses `set_toolchains("clang-cl")` with the matching `cxflags`, and CI installs LLVM 22 using `ZhongRuoyu/setup-llvm`). Use the same LLVM version locally, clear the xmake cache (`xmake f -c`), and rebuild.

*Applies to: LeviLamina 26.20 and later*

## The same mod code compiles against LeviLamina 26.40.1 but fails with compile errors inside LL headers (which the code does not include itself) on 26.40.4/26.40.5. What should I do?

Starting with LeviLamina 26.20, you must compile with `clang-cl`; MSVC (`cl.exe`) is no longer supported. In `xmake.lua`, set `set_toolchains("clang-cl")` as in `levilamina-mod-template`, and in GitHub Actions, install LLVM 22 as the template does. After switching the toolchain or version, clear the xmake cache: delete the `.xmake` directory, or run `xmake clean -a` and `xmake f -c` to reconfigure.

*Applies to: LeviLamina 26.20 and later*

## Using a vcpkg library in a LeviLamina mod's xmake project gives link errors (missing symbols from dependency libraries). How do I fix it?

When xmake pulls in a vcpkg package, it may not resolve transitive dependencies correctly, so you have to supply them yourself. The recommended fix is to switch to xmake's own packages: use `add_requires` to install the library and its dependencies (such as `zlib` and `libuv`), then `add_packages`. Alternatively, add the missing libraries manually with `add_links` in the target.

*Applies to: LeviLamina mods built with xmake. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I build and enable LeviLamina's own tests (such as EventTest)?

Enable the tests option when building LeviLamina: `xmake f --tests=y` (optionally with `--target_type=server/client`), then run `xmake`. This pulls in gtest and builds the `src-test` directory (the server event test is in `src-test/server/EventTest.cpp`). Because xmake configuration is sticky, if behavior is odd after switching configurations, delete the project's `.xmake` directory or reconfigure with `xmake f -c`.

*Applies to: LeviLamina 26.x*

## How do I build LeviLamina itself?

You need XMake 3.0.0+, LLVM/Clang (`clang-cl` must be in PATH), Visual Studio 2022 or its Build Tools (with the C++ desktop development workload, which provides the Windows SDK and standard library that `clang-cl` depends on), and Git. Run `xmake` in the repository root to build the server (the default). To build the client, run `xmake f --target_type=client` and then `xmake`; add `--tests=y` to enable tests. The server can also be built for Linux x86_64 with `-p linux` (clang toolchain), whereas the client can only be built on Windows. If the cache misbehaves, run `xmake c -a` and `xmake f -c`.

*Applies to: LeviLamina 26.20 and later*

## Which IDE should I use to develop LeviLamina C++ mods? Is VSCode fine?

Yes. VS Code with xmake (plus the xmake and clangd extensions) is the common choice, and the official mod template ships with a `.clangd` file and a `.vscode/launch.json` debug configuration. Visual Studio is bulky and less convenient for writing LL mods directly, though you can generate a project with `xmake project -k vsxmake` if you prefer it. Whatever editor you choose, you must install the toolchain: the current template and LeviLamina use the `clang-cl` toolchain on Windows (`set_toolchains("clang-cl")`), so install LLVM (with `clang-cl` in PATH) along with Visual Studio 2022 ("Desktop development with C++") or the VS 2022 Build Tools, which provide the MSVC standard library and the Windows SDK.

*Applies to: current version (LeviLamina 26.x, official levilamina-mod-template)*

## Compiling a LeviLamina C++ mod fails (member function declaration does not match definition, or a non-static member function is called incorrectly). How do I fix it?

There are two common causes:

1. The `const` qualifier differs between the header declaration and the `.cpp` definition. Either put `const` on both or on neither.
2. A non-static member function cannot be called through the class name; get an instance first, for example `MyMod::getInstance().getSelf()` in the template. (Inside a member function of the class itself, you can call `getSelf()` directly without `getInstance()`.)

These are general C++ rules; the examples are based on the official mod template.

## Compiling a LeviLamina mod with `/Wall` produces a lot of warnings. Should I enable `/Wall`?

Enabling `/Wall` is not recommended. It warns about details like struct alignment padding (for example, a `bool` after a `void*` in a struct, reporting 7 bytes of unused padding) and is extremely noisy—with the `clang-cl` currently in use, `/Wall` is equivalent to `-Weverything`, which is even noisier. LeviLamina itself uses `/W4` (plus a few individual promotions such as `/w44265`, `/w44289`, `/w44296`, `/w45263`, and `/w44738`), and the official mod template also defaults to `/W4`, so `/W4` is enough for a mod.

## When developing a LeviLamina mod, is there an easy way to browse the `ll` namespace hierarchy and the available functions/headers?

Use the official `levilamina-mod-template`, which brings in all LeviLamina headers through xmake's `add_packages("levilamina")`. In VS Code with clangd (the template ships a `.clangd`, and either the xmake extension or `xmake project -k compile_commands` generates `compile_commands.json`), typing `ll::` lists all namespaces and functions via autocomplete, and hovering over an item shows the header it lives in. You can also browse the `src/ll/api` directory of the LeviLamina repository or the official API documentation (docs.levimc.org).

*Applies to: current version (LeviLamina, official mod template)*

## Can the xmake used for LeviLamina mods build with one click like Visual Studio? Which editor is recommended?

VS Code is recommended, along with the xmake and clangd extensions for development and building (the xmake extension provides one-click build and debug). From the command line, run `xmake f -y -p windows -a x64 -m release` in the project root and then `xmake` to build; the output goes to `bin/`.

*Applies to: current version (LeviLamina, official mod template)*

## A LeviLamina client mod crashes as soon as the game starts, before I can attach a debugger. How do I debug it?

In the mod's `DllMain` (or its load entry point), add a delay of about 10 seconds, or loop until a debugger is attached (for example, `while (!IsDebuggerPresent()) Sleep(100);`). This gives you time to attach the debugger to the game process. You can also launch the Minecraft process directly under the debugger. The official mod template's `.vscode/launch.json` also provides "GDK attach" and "BDS attach" configurations (install the Tasks Shell Input extension and set `MC_GDK_DEBUG_PATH` / `MC_BDS_DEBUG_PATH`). These start the process and attach the debugger automatically, but only after the process has been stable for about 3 seconds, so a crash that happens earlier still requires waiting in code as described above.

*Applies to: current version (Windows)*

## I want to build a native Android mod. After cloning LeviLamina on Termux/arm64 Linux, `xmake f -p linux -a arm64` fails with `` `arm64` is not a valid complation arch for this project, please use one of x86_64 ``. What should I do?

LeviLamina supports only x86_64: the client targets `windows|x64` only, and the server targets `windows|x64` and `linux|x86_64`, so you cannot use it to build Android mods. Native mods on Android use a separate system: the Android version of LeviLauncher loads them through the Preloader SDK (`LiteLDev/preloader-android`, the `pl::` API). Instead of using LeviLamina, follow the tutorial "Write Your First Android Native Mod" (<https://levimc.org/tutorials/develop/first-android-mod/>) and the API pages under `developer_guides/android` in the LeviLamina documentation.

## I want to set up a `vcxproj` by hand in Visual Studio to develop a LeviLamina plugin. Where do I find the lib exported by LL?

We officially recommend developing with `levilamina-mod-template` (xmake). LeviLamina no longer provides a prebuilt SDK lib to link against: xmake's `levilamina` package compiles LeviLamina and all its dependencies from source with `clang-cl`. Writing a `vcxproj` by hand means building LeviLamina yourself and configuring every dependency library, which is very cumbersome. If you want to use Visual Studio, run `xmake project -k vsxmake` in the template project to generate a VS project, and let xmake handle the dependencies and linking.

*Applies to: LeviLamina 26.x*

## When packaging a LeviLamina mod, what happens if I do not change the LeviLamina version that the package description file depends on? Is it the latest version by default?

No, it does not pick the latest version automatically; you must update the dependency to the target version yourself. The current template uses `lip.toml` instead of `tooth.json`: under `[variants."".deps]`, set the version range for `"github.com/LiteLDev/LeviLamina"` (the template uses `"26.60.*"` for the server and `">26.60.6 <26.61.0"` for the client; the client dependency uses the bare ID, not `"#client"`). Also update `add_requires("levilamina x.x.x")` in `xmake.lua` to the target version; otherwise, your mod will depend on the wrong LL version.

*Applies to: lip.toml format (templates after LeviLamina 26.60.6); the old tooth.json works the same way*

## Building a client mod, xmake reports `error: Invalid option: --target_type=client`. What causes this?

`--target_type` is a configuration option declared in the project's `xmake.lua` with `option("target_type")` (values `server`/`client`, default `server`); you can pass it only if `xmake.lua` declares the option. This error means your `xmake.lua` is from an older version or has been modified and lacks the `target_type` option. Use the `xmake.lua` from the latest `levilamina-mod-template` (which declares `option("target_type")` and passes it to the `levilamina` package via `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})`), make sure xmake is up to date (`xmake --version`), and then run `xmake f -a x64 -m release -p windows --target_type=client -y` followed by `xmake -v -y` to build.

*Applies to: LeviLamina 26.x, current levilamina-mod-template*

## Building LeviLamina itself with xmake fails locally (no LLVM version works) but CI is fine. How do I troubleshoot?

1. Run `xmake -v` to see which LLVM/`clang-cl` is actually being invoked. If you have Visual Studio's LLVM (Clang) component installed, xmake may prefer the LLVM bundled with VS over the one you installed separately; uninstall or bypass the VS component.
2. Run `xmake repo -u` to update the package repository, then rebuild with `xmake -v -y`. Issues in a dependency's version definition (such as `parallel-hashmap`) are fixed in the package repository, so the build will keep failing until you update your local copy.

You can follow the same steps as CI: install LLVM 22, run `xmake repo -u`, and then run `xmake f` / `xmake`.

*Applies to: LeviLamina 26.x*

## Building a mod fails while installing the levilamina package; the log shows `error STL1000: Unexpected compiler version, expected Clang 20 or newer` for dependencies such as glm (VS2026 / new MSVC STL). How do I fix it?

This means xmake detected and used a separately installed LLVM Clang older than version 20, which is incompatible with the new MSVC STL. Uninstall the old Clang, then either select the "C++ Clang tools for Windows" (`clang-cl`) component in the Visual Studio Installer or install a recent LLVM separately (the official template CI uses LLVM 22). Without one of these, you will get `toolchain("clang-cl"): not found`. Run `xmake -v` to confirm which Clang version is actually in use. The detailed failure log is at `%LOCALAPPDATA%\.xmake\cache\packages\...\levilamina\<version>\installdir.failed\logs\install.txt`.

*Applies to: LeviLamina 26.x*

## The author of an open-source native LeviLamina mod has stopped updating it. How can I update it to a new LeviLamina version myself?

Fork the repository and replace its `xmake.lua` with the latest one from `levilamina-mod-template`. Update the mod name and LeviLamina version, and sync `lip.toml` and `manifest.json` if necessary. Then update the include paths and APIs to match the new headers—if Mojang has removed or changed functions, you will need to rewrite that code. Once the mod compiles, open a PR to the original repository.

## When developing a mod with LeviLamina, do I still need to put BDS lib files into the project directory by hand, as with LL2?

No. xmake downloads the dependencies automatically at build time: the `levilamina` package and its dependencies are all in LiteLDev's xmake-repo (added as `levimc-repo` in the template). For the current version, the BDS/client link data comes from the `bedrockdata` package (`bedrock-runtime-data`, which distinguishes server and client by `target_type`); the old `bdslibrary` package is used only for versions up to 1.21.3. If you use an unregistered version such as `levilamina develop`, xmake loads the package with the dependencies of the main branch (a comment in the template notes that a development version may require you to add BDS library dependencies yourself).

*Applies to: LeviLamina 0.x and later*

## In a project created from levilamina-mod-template, Visual Studio keeps auto-formatting my code in a strange way as I type. How do I turn it off?

The mod template includes a `.clang-format` file in the project root, which Visual Studio reads first when formatting code. Edit or delete `.clang-format` in the project root to suit your preferences, or turn off format-on-type in Visual Studio.

*Applies to: current levilamina-mod-template*

## After levilamina-mod-template is updated, how do I sync the changes into a project created from it?

There is no automatic sync. You have to compare your project against the template and apply the changes by hand (mainly to `xmake.lua`, `.github/workflows`, `lip.toml`, and similar files). Because a repository created with "Use this template" shares no git history with the template, any merge requires resolving conflicts yourself.

## When developing a mod with levilamina-mod-template (xmake), CLion has no code completion. What can I do?

Run `xmake project -k cmakelists` in the project root to generate `CMakeLists.txt`, then open the generated CMake project in CLion. Alternatively, run `xmake project -k compile_commands` to generate `compile_commands.json` for clangd/CLion; the template already includes a `.clangd` configuration.

## With levilamina-mod-template, after pinning LeviLamina in `add_requires` to an older version (such as 1.4.4), running `xmake project -k compile_commands -v -y` fails with "cannot open include file" (the latest version works). What should I do?

This is usually caused by a network issue while downloading the preloader package, which leaves the package xmake fetched incomplete or corrupted. Delete the preloader package directory for that version along with the xmake cache, then run the command again. For example:

1. Delete `%LOCALAPPDATA%\.xmake\packages\p\preloader\<version>` (such as `v1.15.3`).
2. Delete `%LOCALAPPDATA%\.xmake\cache`.
3. Run `xmake project -k compile_commands -v -y` again (or `xmake -y`).

*Applies to: all LeviLamina versions built with xmake + levimc-repo*

## When developing a LeviLamina C++ mod, Chinese/UTF-8 text in the console output is garbled. How do I set UTF-8 output?

We recommend outputting text through the mod's own Logger (such as `getSelf().getLogger()`). On a Windows console, LeviLamina writes through `WriteConsoleW`, so Chinese text is not garbled. If you must print directly with `printf` or `std::cout`, include `Windows.h` and run the following at startup:

```cpp
SetConsoleCP(CP_UTF8);
SetConsoleOutputCP(CP_UTF8);
DWORD mode;
GetConsoleMode(GetStdHandle(STD_OUTPUT_HANDLE), &mode);
SetConsoleMode(GetStdHandle(STD_OUTPUT_HANDLE), mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
```

Also make sure your source files are compiled as UTF-8 (the template already sets `/utf-8`). You can alternatively enable the Windows setting "Beta: Use Unicode UTF-8 for worldwide language support", though that may garble text in other programs.

*Applies to: LeviLamina mods / ordinary console programs on Windows*

## Building a LeviLamina mod with xmake fails with `error: package(bedrockdata): version(xxx) not found!` (for example 1.21.60.10-server). What should I do?

Your local xmake package repository (`levimc-repo`) cache is out of date. Run `xmake repo -u` to update the repository, then rebuild. In general, if a package version has already been published but xmake reports that it cannot be found, update the repository cache.

*Applies to: all LeviLamina versions built with xmake + levimc-repo*

## Compiling a LeviLamina mod with xmake (for example a LegacyRemoteCall-related project) runs out of memory (OOM), reports insufficient compiler heap space, or even crashes VSCode. What should I do?

This happens when a build includes too many headers (such as `include_all` and heavy `magic_enum` macro expansions), causing each compiler process to consume a large amount of memory. Limit the number of parallel compile jobs with `xmake -j <num>` (for example, `xmake -j 2`) and close other memory-intensive programs. You can also remove unnecessary includes of large headers.

*Applies to: current version (depends on machine memory)*

## A project created from the latest levilamina-mod-template does not compile. What should I do?

Add the `_HAS_CXX23` define. The template added it in commit <https://github.com/LiteLDev/levilamina-mod-template/commit/2d01125a7b8982d04019d1a006c0276d0006f5d6>:

```lua
add_defines("NOMINMAX", "UNICODE", "_HAS_CXX23=1")
```

Update the template or manually add this define to the target in `xmake.lua`.

*Applies to: LeviLamina (26.x) and levilamina-mod-template after 2026-10*

## Building a mod for an older LeviLamina (such as 1.4.1) with the latest levilamina-mod-template, the GitHub Actions client build fails (the old version has no client build). How do I make the action build only the server?

LeviLamina officially supports the client only starting from 1.9.0. When targeting an older version, remove the `client` entry from `matrix.target_type` in `build.yml` and `release.yml` under `.github/workflows/` so that only the `server` target is built. Also remove the variant with `side = "client"` in `lip.toml`, and set the LeviLamina dependency version to the one you actually use.

*Applies to: projects using the new template that target LeviLamina before 1.9.0*

## Compiling a LeviLamina C++ plugin fails with C4819: the file contains a character that cannot be represented in the current code page (936). How do I fix it?

Add the UTF-8 compile flag `/utf-8` to the compiler (`add_cxflags("/utf-8")` in `xmake.lua`). The `xmake.lua` in the official mod template already includes this flag by default. If the error still occurs, it may be caused by a stray character in your code (such as Chinese punctuation) or an incorrect header, so check your source code and make sure the source files are saved as UTF-8.

## Compiling a LeviLamina mod, xmake reports an error related to the preloader package. How do I fix it?

Delete the xmake cache and the preloader package for that version, then rebuild:

1. Delete `C:\Users\%USERNAME%\AppData\Local\.xmake\cache`.
2. Delete `C:\Users\%USERNAME%\AppData\Local\.xmake\packages\p\preloader\<version>` (such as `v1.15.5`).
3. Run `xmake` again to build.

*Applies to: all LeviLamina versions built with xmake + levimc-repo*

## Compiling a LeviLamina mod fails with errors such as `"clear": 不是 "CompoundTag" 的成员` ("clear" is not a member of "CompoundTag"). How do I fix it?

`CompoundTag` currently has no `clear()` member function, but its internal `TagMap` member `mTags` is public, so you can clear it directly with `nbt.mTags.clear()`. Also, LeviLamina requires xmake 3.0.0 or later (`set_xmakever("3.0.0")` in `xmake.lua`); if your xmake version is older (such as 2.9.x), run `xmake update` before building. The `levilamina` package automatically pulls in dependencies such as `bedrockdata` matching its own version, so you do not need to manually specify an old version with `add_requires`.

*Applies to: LeviLamina 1.x and later (currently v26.60.8)*

## Compiling a mod fails because a LeviLamina header is missing other headers it depends on (some types are undefined). How do I fix it?

LeviLamina's mc headers are generated by a tool, and some of them may be missing required includes (containing only forward declarations). To fix this, manually `#include` the header that defines the missing type in your mod's source file that uses the header. If the missing header is hard to locate, you can also open a PR to LeviLamina to add the missing include to that header.

*Applies to: LeviLamina current version*

## Building LeviLamina myself (or building a mod with the template) fails, while older versions compiled fine. What should I do?

Check your LLVM/clang version. LeviLamina and the mod template use the `clang-cl` toolchain on Windows, and the clang/LLVM bundled with Visual Studio is often too old. Install or update to a recent LLVM (official CI uses LLVM 22), make sure xmake is >= 3.0.0, and rebuild.

*Applies to: LeviLamina 26.x*

## When debugging a LeviLamina plugin crash, CrashLogger always grabs the exception before the VS debugger. How do I debug conveniently?

During development, you can use the debug build of LeviLamina for more complete stack traces (releases include debug build packages for both server and client). CrashLogger disables itself if it detects a debugger (`IsDebuggerPresent`) at startup, so launching BDS directly under the debugger keeps CrashLogger from intercepting exceptions. If you want to attach a debugger after startup, disable CrashLogger by setting `modules.crashLogger.enabled` to `false` in the LeviLamina configuration file (`mods/LeviLamina/config/Config.json`).

*Applies to: LeviLamina 1.x and later*
