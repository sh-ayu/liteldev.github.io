# LeviLauncher on Windows: errors and crashes

## After using BetterRenderDragon in LeviLauncher (PC), the game crashes, shows a white screen, has no effect, or looks wrong in a world. How do I troubleshoot?

BetterRenderDragon is a third-party preload mod (currently maintained in the QYCottage fork: <https://github.com/QYCottage/BetterRenderDragon/releases>). Because the launcher no longer bundles it, you must import it as a mod yourself. Troubleshoot in this order:

1. Make sure the BetterRenderDragon version matches your game version (the release notes list the supported game versions).
2. If the versions match and the game still crashes on startup, use the no-imgui build (which has no UI in the top-left corner); this fixes most crashes. AMD GPUs and some NVIDIA devices have compatibility issues.
3. Check for conflicts with other mods: minimap mods, 4dskin, BetterResourcePackManager, and others are known to crash or stop working alongside BetterRenderDragon. Disable other mods one by one to find the culprit, and check the launcher log.
4. For a white screen or broken visuals, turn off frame generation / AI frame generation in your GPU driver, along with driver overlays and any other program that modifies the game image.
5. Broken visuals in a world can also mean that the shader pack does not support your game version, or that you installed an Android shader pack by mistake. Switch to a Windows RenderDragon shader pack that supports your current game version.

*Applies to: LeviLauncher 1.0.0 and later (PC). Not confirmed against the source code or the documentation: treat it as a pointer.*

## What is "Register to system" in LeviLauncher for, and how do I fix a registration failure (cannot register appx)?

Registering sets the version installed by the launcher as the system's Minecraft app package, replacing the currently registered Microsoft Store version. A registered version is required to double-click and import `.mcpack` files, and to use clients without custom version detection (such as Onix).

Registration most often fails because Windows Developer Mode is turned off (reported as `ERR_DEV_MODE_REQUIRED` / `ERR_UWP_DEVELOPER_MODE`, `0x80073CFF`, etc.). Turn on "Developer Mode" in Windows Settings > System > For developers and try again, or run `LeviLauncher.exe doctor --fix developer-mode`.

If you get `ERR_UWP_PACKAGE_CONFLICT`, another Minecraft installation outside LeviLauncher (such as a version registered by another launcher) holds the registration. Uninstall it or remove its registration first.

In newer versions, the registration failure dialog lists possible causes and includes a button to open the log folder. You can unregister an already registered instance by running `LeviLauncher.exe instance unregister`. Newer versions no longer require the Microsoft GDK. Always start the game through the launcher—do not double-click the installed game files directly.

*Applies to: LeviLauncher (Windows) 1.1.0 and later*

## After installing the game with the Windows LeviLauncher (no mods installed), launching reports `ERR_LAUNCH_GAME` or cannot start, and other versions behave the same. What should I do, and which dependencies are needed?

This applies to the GDK edition of Bedrock Edition; the `doctor` and `self-update` commands are part of the 1.1.0 CLI. Troubleshoot in this order:

1. Make sure LeviLauncher is up to date (let the launcher update itself, or run `LeviLauncher.exe self-update`). You do not need to reinstall an outdated launcher; updating it is enough.
2. Run `LeviLauncher.exe doctor` to check dependencies such as the Visual C++ runtime, GameInput, and Gaming Services (required for the GDK edition). Running `LeviLauncher.exe doctor --fix` repairs the VC runtime and GameInput automatically (administrator confirmation required). Gaming Services must be installed from the Microsoft Store (<ms-windows-store://pdp/?ProductId=9MWPM2CQNLHN>).
3. Try the most common fix: install vanilla Bedrock Edition from the Microsoft Store or Xbox app and launch it once. The Store automatically pulls in required dependencies such as the Xbox app and Gaming Services, and you can uninstall the Store version afterward. Also update the Xbox app in the Microsoft Store. This issue is common after a fresh Windows installation.
4. LTSC or stripped-down Windows editions may lack the Microsoft Store and Gaming Services. Follow <https://www.mcappx.com/help/gdk-install/#windows> to install Gaming Services manually, then connect to the internet and restart your PC.
5. A proxy can cause the Microsoft Store to hang. Turn off your proxy, or set domains containing `microsoft` and `bing` to connect directly.
6. If the game still fails to start, delete the instance, download and install it again, and run `LeviLauncher.exe play -v` to view detailed logs. If the issue persists, open an issue on GitHub Issues and attach the log.

Installing only DirectX or .NET Framework will not fix this problem.

*Applies to: LeviLauncher (Windows) 1.x*

## LeviLauncher reports Gaming Services missing or detection failed when launching the GDK edition of Minecraft, and the Microsoft Store cannot install it or the system is LTSC without a Store. What should I do?

This applies to the GDK edition of Bedrock Edition.

1. Check whether it is installed: in PowerShell (not cmd), run `Get-AppxPackage -Name Microsoft.GamingServices`; any output means it is installed. You can also run `LeviLauncher.exe doctor` and check the `gaming-services` result. The GDK edition requires the VC runtime, GameInput, the Xbox app, and Gaming Services.
2. If it is not installed, follow the launcher's prompt, or install Gaming Services from the Microsoft Store (<ms-windows-store://pdp/?ProductId=9MWPM2CQNLHN>).
3. LTSC or stripped-down systems lack the Microsoft Store, App Installer, and Xbox components. Paste a Store app link into <https://store.rg-adguard.net/> to download the appx/msixbundle and install it in PowerShell with `Add-AppxPackage`; or download missing components such as Xbox Gaming Services from MCAPPX (<https://www.mcappx.com/download/xbox-gaming-services/>, tutorial: <https://www.mcappx.com/help/gdk-install/#windows>). On LTSC, Xbox-related services are disabled by default and must be set to automatic in "Services". Beginners are better off switching to a full edition of Windows.
4. If system components are corrupted, run `sfc /scannow`.
5. If Gaming Services is installed but the launcher still reports it missing, ignore the prompt and continue launching (this check no longer forces an exit). The launcher does not check for Gaming Services when you only use UWP instances.

*Applies to: LeviLauncher (Windows) 1.x*

## The PC LeviLauncher crashes or does nothing after a double-click (it exits before any window appears and there is no process in Task Manager). How do I troubleshoot?

The log path changed in v1.1.0. Troubleshooting steps:

1. Runtimes: at startup, the launcher checks for the Visual C++ 2015-2022 x64 runtime and the WebView2 Runtime, and prompts you to download and install whichever is missing. If it still crashes after the check passes, a runtime is usually corrupted or outdated: install the latest VC++ x64 (<https://aka.ms/vc14/vc_redist.x64.exe>), then download and reinstall the Microsoft Edge WebView2 Runtime (in one reported case, the WebView2 installer said "already installed" when only a leftover registry entry existed, and reinstalling fixed it). Do not delete Edge/WebView2.
2. Log: if startup fails before the window appears, the launcher writes a log to `%LOCALAPPDATA%\LeviLauncher\Logs\startup.log` (versions before v1.1.0 use `%APPDATA%\levilauncher.exe\logs\startup.log`). When asking for help or filing an issue, send this file instead of a screenshot.
3. Debug output: run `LeviLauncher.exe --debug` from the command line (`/debug` and `-debug` also work), or append ` /debug` to the shortcut's "Target" to view console output.
4. Command-line self-check independent of WebView2 (added in v1.1.0): run `LeviLauncher.exe doctor` to check the VC++ runtime, GameInput, Gaming Services, WebView2, and other components; run `LeviLauncher.exe doctor --fix vcruntime` to repair the runtime.
5. If none of that works, some users fixed the problem by running "Detect and repair" on the runtime with a DirectX repair tool, or by setting the EventLog and Task Scheduler (schedule) services to automatic from an administrator CMD and restarting (isolated cases, for reference only).

*Applies to: LeviLauncher (Windows) 1.1.0*

## After LeviLauncher finishes downloading Minecraft, clicking "Install" crashes the launcher (the version folder was created but is empty). How do I fix it?

The Visual C++ 2015-2022 x64 runtime is most likely missing or corrupted. Download and install the latest version from <https://aka.ms/vs/17/release/vc_redist.x64.exe> (or <https://aka.ms/vc14/vc_redist.x64.exe>) and try again.

Newer versions of the launcher check for the VC++ runtime at startup and prompt you to install it. Starting in v1.1.0, you can also check it with `LeviLauncher.exe doctor` and repair it with `LeviLauncher.exe doctor --fix vcruntime`. If other error dialogs point to a similar problem, check the VC++ runtime first.

## After not playing for a long time, every MC version in LeviLauncher crashes immediately on launch (no log, the console flashes by), but launching the official way works. What should I do?

Launch Minecraft once through the Microsoft Store or the official way (if the Store cannot download it, install an official appx package and launch it once). Then launch it with LeviLauncher again, and it will work.

Developer analysis: to prevent the GDK edition from automatically migrating (and deleting) UWP data, the launcher intercepts the game's reads from LocalAppData. MC stores login-token-like data in LocalAppData; after a long period without signing in, it needs to refresh that data, fails to find it, and crashes. This happens regardless of whether version isolation is enabled. The current version still intercepts LocalAppData.

If it still does not work, check whether Gaming Services is corrupted: uninstall or delete Gaming Services, restart the computer, and reinstall it from the Microsoft Store. You can check its status with `LeviLauncher.exe doctor`. When an issue like this leaves no log, you can attach a VS debugger to MC to investigate.

*Applies to: LeviLauncher (Windows) 0.3.x and later. Not confirmed against the source code or documentation; treat this as a pointer.*

## Where do I find the crash logs after the game crashes in LeviLauncher (PC)?

This applies to the current LeviLamina client. For a game with LeviLamina installed, crash logs are saved in `logs/crash` under that game version's (instance's) directory, named `trace_<time>.log` and `minidump_<time>.dmp`. The same `logs` directory also contains `latest.log`. This is not MC's own crash directory. When reporting an issue, send the latest trace and minidump.

The launcher's own logs are in `%LOCALAPPDATA%\LeviLauncher\Logs` (if the launcher exits before showing a window, check `startup.log` there). The error dialog also has a button to open the log folder.

*Applies to: LeviLauncher 1.1.0*

## The PC LeviLauncher reports an error when launching MC (it looks like it demands a licensed copy), or the game crashes right after launching. What should I do?

This applies to GDK instances and is not a forced license check. First, verify that system components such as Xbox Gaming Services, GameInput, and the Visual C++ runtime are intact: the GDK edition requires Gaming Services. If it is missing or corrupted, follow the launcher's prompts to install or repair it from the Microsoft Store. If necessary, install the official MC once from the Xbox app or Microsoft Store and launch it once.

You can also run `LeviLauncher.exe doctor` for a combined check; `doctor --fix` can repair the VC runtime, GameInput, and other components (Gaming Services must be installed from the Store page as prompted). If all components are intact but the game crashes immediately on startup, check your graphics driver as well; some users report that reinstalling the GPU driver fixed the issue.

*Applies to: LeviLauncher 1.x*

## LeviLauncher shows a missing dll / missing file error and still cannot start after updating vcredist. What should I do?

Usually, the system is missing the Visual C++ runtime. The current launcher checks for the VC runtime and prompts you if it is missing; once you confirm, it downloads and runs the installer from <https://aka.ms/vc14/vc_redist.x64.exe>. You can also install it manually or run `LeviLauncher.exe doctor --fix vcruntime`.

If that does not resolve the issue, install vanilla Minecraft from the Microsoft Store once, which installs the system libraries the game needs. If even the Store version cannot run, the operating system itself has missing libraries or corrupted files (for example, an unofficial stripped-down Windows image) and needs to be repaired or reinstalled.

*Applies to: LeviLauncher 1.x*

## After installing a mod in LeviLauncher (for example a mod that removes OreUI), the game crashes. What is going on?

This depends on the specific third-party mod. First, check your mod list: enabling multiple versions of the same mod at once causes crashes, so disable any older versions. Also make sure you downloaded the launcher from an official source (GitHub Releases or the official website) rather than using a modified build from an unknown source.

If the problem persists, attach the crash logs (`logs/crash` under the instance directory) and a video reproducing the issue when you report it.

*Not confirmed against the source code or documentation; treat this as a pointer.*

## After installing the game with LeviLauncher it reports insufficient storage, and worlds and mods are lost (version isolation is on). BedrockBoot was installed before. What is the cause?

This happens when you also use a third-party tool, such as BedrockBoot, that creates symbolic links. Check the Minecraft Bedrock directory under `%APPDATA%`. In this case, BedrockBoot turned that directory into a symbolic link, which conflicts with LeviLauncher's version isolation.

Turn off version isolation in BedrockBoot's settings, or uninstall BedrockBoot and delete the symbolic link, then try again. Back up your worlds before making any changes.

*Not confirmed against the source code or documentation; treat this as a pointer.*

## The Bedrock Edition (GDK) installed through LeviLauncher cannot be started from the Start menu, a shortcut or the launcher, and the process hangs in Task Manager. What should I do?

This applies to GDK instances. The GDK edition of Bedrock Edition depends on Microsoft Gaming Services (Xbox gaming services) working properly, and cannot start if Gaming Services is missing or damaged. Update or reinstall Gaming Services from the Microsoft Store to fix the issue.

You can use the launcher's guided check, or run `LeviLauncher.exe doctor` from the command line to check Gaming Services, GameInput, the VC runtime, and more (Gaming Services must be installed from the Store page when prompted).

*Applies to: all LeviLauncher versions*
