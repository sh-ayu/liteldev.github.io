# LeviStone

## Can LeviLamina and Endstone be used together? Can I run Endstone plugins on LeviLamina, or LL/LSE plugins on Endstone?

Do not install the two loaders side by side directly, as they conflict. Instead, use LiteLDev's LeviStone (<https://github.com/LiteLDev/LeviStone>, with Chinese documentation in `README.zh.md`). It is a LeviLamina mod (named `EndstoneRuntime`) that runs the Endstone runtime as an LL mod, letting you load Endstone's Python plugins on LeviLamina while LL mods and LSE plugins continue to work as usual. The reverse does not work: Endstone cannot load native LeviLamina mods (LL depends on the full BDS headers and symbols), and there is no ready-made compatibility layer for loading LSE plugins.

*Applies to: LeviStone v0.11.15-post.1; LeviLamina `>=26.60.4 <26.70.0`*

## Can LeviStone (the Endstone runtime) be installed together with LSE's Python engine (`legacy-script-engine-python`)? What is the difference between them?

According to the maintainers, the two Python runtimes cannot coexist. Installing both causes LSE Python to fail to load or crash, so you can only use one of them. If you do not use any LSE Python plugins, simply uninstall the LSE Python engine. The difference between the two is what they run: LeviStone runs Endstone plugins (`.whl` packages, which can easily depend on third-party Python libraries), whereas LSE Python runs plugins written for the LSE API. Also, loading more script engines increases server overhead. No fix has been reported for the current version.

*Applies to: LeviStone 0.10.x and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Which Endstone plugins does LeviStone support? Can it run Endstone's C++ (native) plugins? How do I install Endstone plugins, and can I use lip?

LeviStone only supports Endstone plugins written in Python. It does not support Endstone's native (C++) plugins: the two differ in areas such as the memory allocator (memory operator), and native plugins often contain hooks, so forcing them to load easily crashes the server. If you really need a native plugin, it is better to write it as an LL mod. Install LeviStone itself with pip (`pip install levistone --target mods/EndstoneRuntime`), not with lip. To install an Endstone plugin, place the `.whl` file for the matching platform and Python version into the server's `plugins/` folder (or install it with pip).

*Applies to: LeviStone 0.11.x*

## How are LeviStone, Endstone and Endweave related? Does installing LeviStone let LeviLamina support newer clients?

Endstone is another BDS plugin loader that provides a stable, Bukkit-style wrapper API. LeviStone is a LeviLamina mod (`EndstoneRuntime`) that runs the Endstone runtime on LL, allowing Endstone's Python plugins to run on LL (Endstone's C++ plugins are not supported) while LL mods continue to work as usual. Endweave is an Endstone plugin that rewrites packets at the network layer so clients on different protocol versions can join the server (similar to ViaVersion/Glacie), without changing the server version itself. To support newer clients, use LL + LeviStone + Endweave. Docker users can use <https://github.com/LiteLDev/docker-levistone-server>. Note that Endweave only translates between the protocols listed in the table in its README (currently 26.40–26.60), and the LeviStone version must match the LeviLamina version.

*Applies to: LeviStone 0.11.15; LeviLamina 26.60.x; Endweave 0.5.0 and later*

## How do I install LeviStone on LeviLamina to run Endstone plugins? Where do Endstone plugins go? What are the limitations?

In the BDS directory where LeviLamina is installed, run:

```shell
pip install levistone --target mods/EndstoneRuntime
```

To install a specific version, run `pip install levistone==0.11.15 --target mods/EndstoneRuntime` (see PyPI for available versions). Versions earlier than 0.11.15 must be installed to `plugins/EndstoneRuntime`. The LeviStone version must match the LeviLamina version (check the CHANGELOG for the LeviLamina version required by each release). Place the `.whl` files for Endstone plugins into the server's `plugins/` directory. (Starting in 0.11.15, LeviStone automatically creates a `plugins` directory link pointing to `mods` when it loads. If a `plugins` folder already exists in the server directory, LeviStone logs an error and does not create the link, so move any existing `plugins` folder out of the way first.) Only Endstone's Python plugins are supported, not C++ (native) plugins.

*Applies to: LeviStone 0.11.15 and later; LeviLamina `>=26.60.4 <26.70.0`; earlier versions install to `plugins/EndstoneRuntime`*

## To run Endstone plugins on LeviLamina, do I still need to install Endstone itself after installing LeviStone? The server crashes right at startup after installing it. What do I do?

You do not need to install Endstone separately. LeviStone is itself an Endstone-based runtime (loaded as the LeviLamina mod `EndstoneRuntime`), and once installed it can run Endstone's Python plugins (Endstone native/C++ plugins are not supported). Startup crashes are mostly Python environment problems: LeviStone's wheels are built separately for each Python version, and at runtime it needs the `pythonXY.dll` that matches the pip used to install it. Make sure the Python you used to install levistone is the same version as the Python on the system PATH (Python 3.11~3.15 stable releases are currently supported). If you have several Python versions installed, specify the version explicitly with `py -3.x -m pip install levistone --target mods/EndstoneRuntime` or remove the conflicting versions, and then make sure that version's installation directory is on PATH.

*Applies to: LeviStone 0.11.15 and later; earlier versions install to `plugins/EndstoneRuntime`*

## After installing LeviStone (EndstoneRuntime), loading fails with `[0x0000007E:system] The specified module could not be found … module: endstone_runtime.dll missing module: python3XX.dll` (such as `python312.dll` / `python313.dll`), even though the C++ runtime is installed. How do I fix it?

This happens because the Python DLL (`pythonXY.dll`) matching LeviStone cannot be found. Usually, the Python installation directory is not on PATH, or the pip used to install levistone and the Python on PATH are different versions. To fix it:

1. Install Python (3.11~3.15 stable releases) and check "Add python.exe to PATH" during installation. If you didn't, add the Python installation directory to PATH manually, or reinstall. You can verify this by running `where python313.dll` (replace the number with your version).
2. In the BDS root directory (the one containing `bedrock_server_mod.exe`), install LeviStone using the pip from that same Python installation: `pip install levistone --target mods/EndstoneRuntime` (for versions before 0.11.15, use `--target plugins/EndstoneRuntime`).
3. As a temporary workaround, you can also copy the matching `pythonXY.dll` into the server root directory.
4. Under Docker/Wine, installing with a Linux Python's pip does not provide the Windows DLL, which the server needs at runtime. Use the official image `ghcr.io/liteldev/levistone-server:latest-wine`, which installs Python into the Wine prefix and installs LeviStone automatically.

*Applies to: current version (native Windows / Wine)*

## When LeviStone starts, EndstoneRuntime hangs for a long time and then suddenly starts downloading, so the server starts very slowly or not at all. How do I fix it?

Both LeviStone itself and the dependencies of Endstone plugins (`.whl`) are downloaded from PyPI through pip (when Endstone loads a plugin, it calls `python -m pip install <plugin.whl>`). Without a configured mirror, connecting directly to PyPI is very slow and can even fail. Configure a mirror in mainland China first, then install LeviStone manually in the BDS root directory:

```shell
pip config set global.index-url https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple
pip install levistone --target mods/EndstoneRuntime
```

To install a specific version, write `levistone==<version>` and make sure it matches the LeviLamina version; for versions before 0.11.15, change `mods` to `plugins`. Then run `bedrock_server_mod.exe`. If you use the Docker image, you can set the `PYPI_MIRROR_URL` environment variable.

*Applies to: LeviStone 0.11.15 and later*

## To run Endstone Python plugins (such as the `.whl` of endweave) on LeviLamina, do I need to install LSE Python (`legacy-script-engine-python`) first? What if installing LSE Python hangs?

No. LeviStone is not a Python plugin; it is a mod (`EndstoneRuntime`) that lets LeviLamina run Endstone Python plugins, and it does not depend on LSE Python. According to the maintainers, LeviStone and LSE Python also conflict, so you can only use one of them and must remove LSE Python. After installing LeviStone, put the Endstone plugin (`.whl`) into the `plugins` directory (since 0.11.15, LeviStone automatically creates `plugins` as a directory link pointing to `mods`). Make sure your Python version matches the one used to install LeviStone (3.11~3.15 are currently supported).

## The server keeps crashing after installing both EndstoneRuntime (`endstone_runtime.dll`, LeviStone) and a floating-text mod, and both dlls appear in the crash stack. Do they conflict?

Not necessarily. In this case, the crash log shows that the actual crash occurred in ScriptAPI (an addon that uses the script API, SAPI). Endstone and the floating-text mod merely hook the tick, and any mod that hooks the tick appears in the call stack even if it had nothing to do with the crash. To troubleshoot, check the crash trace for the module that actually failed, then find and remove the addons that use SAPI (here, a farm-type addon), or report the issue to Mojang. This is general crash-troubleshooting advice and still applies to the current version.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can Endweave still be used on LeviStone after it was reimplemented in C++?

Yes. Endweave is currently a hybrid Python and C++ implementation that loads as a Python plugin (`.whl`) and runs on LeviStone. You need LeviStone 0.11.15-post.1 or later, which fixes an issue that prevented endweave from working. LeviStone does not support pure Endstone native (C++) plugins.

*Applies to: LeviStone 0.11.15-post.1 and later*

## I want to turn off a feature when using LeviStone, but the config file I found is actually endweave's. Where is LeviStone's (Endstone's) config file?

LeviStone's Endstone config file is `endstone.toml`, located in the BDS root directory (the server's working directory). On first load, LeviStone generates it by copying `mods/EndstoneRuntime/endstone/config/endstone.default.toml`. Change the corresponding feature switch in `endstone.toml`. The endweave config belongs to a separate component, not to endstone.

*Applies to: LeviStone v0.11.15-post.1*
