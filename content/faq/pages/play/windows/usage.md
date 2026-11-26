# LeviLauncher on Windows: features and settings

## How do I switch the Microsoft/Xbox account in the PC version of LeviLauncher? It keeps going back to the original account after I click "Switch account".

The PC launcher does not have a separate account page. Instead, click the user avatar in the top bar: if you are signed out, click "Sign in to Microsoft account"; if you are signed in, click the "Switch account" button at the bottom of the pop-up card. Under normal privileges, this opens the Windows account picker so you can choose a different Microsoft account. The command-line equivalents are `LeviLauncher.exe account login` (to sign in or switch) and `account logout`. If you run the launcher as administrator, sign-in goes straight through Windows authentication without showing the account picker, making it look as if it keeps reverting to your original account. To fix this, restart the launcher with normal privileges. You can also switch accounts in the Xbox App, or sign out and back in inside the game. The PC launcher supports only one active account at a time—it cannot keep several Xbox accounts online at once or switch between them with one click. (The Android version, by contrast, can manage multiple Xbox accounts inside the launcher.)

*Applies to: LeviLauncher 1.0.3 and later (Windows)*

## Can the worlds, resource packs and behavior packs of the original Microsoft Store (GDK) Minecraft be migrated or inherited into a LeviLauncher instance?

Yes, in three ways:

1. When creating or installing an instance, turn on "Instance isolation" and select "Inherit from shared game data" under "Inherit from". This copies the system's shared Minecraft data (worlds, resource packs, settings, and so on) into the new instance. You can also choose another isolated instance of the same type as the source. If you have a lot of data, copying may take a while—just wait for it to finish.
2. Leave isolation turned off. A non-isolated instance shares data directly with the system's Minecraft installation, so your original worlds appear automatically.
3. Migrate the files manually: copy the original `worlds`, `resource_packs`, `behavior_packs`, and other folders into the instance's game data directory (click "Open folder" in the launcher to find it), or drag `.mcworld`, `.mcpack`, and `.mcaddon` files onto the launcher's content page to import them.

Note that "Importing" an installed game imports only the game itself, not its worlds.

*Applies to: LeviLauncher 1.x (Windows, GDK and UWP instances that support isolation)*

## Can I run multiple copies of the GDK version of Minecraft?

Yes, GDK instances can run multiple copies at once. From the command line, run `LeviLauncher.exe launch <instance> --force` (or `play <instance> --force`) to start another copy of an already-running instance. UWP instances cannot do this because Windows allows only one running copy of a UWP game. Keep in mind that the game has no world lock: multiple copies can enter the same world at the same time, and whichever copy exits last will overwrite the world saved by the earlier ones. Running multiple copies is therefore mainly useful for developer testing.

*Applies to: LeviLauncher 1.x (Windows), GDK instances only*

## A new LeviLauncher version has been released on GitHub. Why does "Check for updates" in the launcher not find it?

Versions marked as Pre-release on GitHub (such as `1.1.0-beta.x`) are delivered only if you turn on "Receive beta updates" under "Settings → Software update" in the launcher. Stable releases (the latest is currently v1.1.0) are delivered by default. You can also download any release manually from <https://github.com/LiteLDev/LeviLauncher/releases>.

*Applies to: LeviLauncher 1.x (Windows)*

## How do I install LeviLamina client mods (such as minimap, replay, litematica) and other client mods?

In LeviLauncher for Windows, first install LeviLamina on a GDK game instance (either from the instance page or by running `LeviLauncher.exe loader install`), and then install your LeviLamina client mods on that instance. You can install mods directly from the launcher's "LeviMC Mods" page, which browses the levimc.org/mods catalog and installs packages through a built-in lip-compatible package manager (no separate lip installation needed); the command-line equivalents are `LeviLauncher.exe mod search` and `mod install`. You can also import mods downloaded elsewhere: `.mcmod` files are supported by default, and selecting "All files (*.*)" in the file picker lets you import `.zip` and standalone `.dll` files as well. DLL mods such as BetterRenderDragon and BetterRPM are imported the same way. UWP x64 instances can load preload-native DLL mods that match the current game version, whereas automatic LeviLamina installation is available only for supported GDK versions. Hot-injection clients are not supported, and older DLLs may not work with newer game versions. Test mods one by one in a clean, isolated instance.

*Applies to: LeviLauncher 1.x (Windows)*

## LeviLauncher shows no progress when downloading a game version and nothing happens for a long time. Is it stuck?

Download progress is shown under the cloud-shaped download icon in the top right of the "Download" page; click it to open the "Download manager" page, where you can view and manage active downloads. While a download is running, the icon is highlighted and shows a red dot. If no error appears, the download is usually still running, just slowly. If it is too slow or fails repeatedly, run a speed test and switch the mirror source when downloading, or enable "Use mirror source" in the settings. You can also try again later or import a local installation package instead.

*Applies to: LeviLauncher 1.x (Windows)*

## The old "Enable RenderDragon shader loading" switch (built-in BetterRenderDragon) is missing from the new LeviLauncher. How do I load RenderDragon shaders now?

This built-in feature was removed in LeviLauncher 1.0.0 because it had to be adapted for every game version, was costly to maintain, and had caused crashes. The Ctrl+R resource hot-reload setting was removed at the same time. Here is what to do instead:

- PC: download the BetterRenderDragon `.dll` matching your game version from <https://github.com/QYCottage/BetterRenderDragon/releases>, import it on the launcher's mods page (choose "All files (*.*)" in the file picker to select a standalone `.dll`), and enable it. This works the same as before; import the shader or texture pack itself on the resource packs page.
- Android: use a loader such as MaterialBinLoader2 (mbl2).

You can also replace the game's material files directly. Downgrading to the old 0.3.x launcher for this is not recommended.

*Applies to: LeviLauncher 1.0.0 and later (currently v1.1.0)*

## If I click "Delete instance / Delete version" in LeviLauncher on a version without version isolation, will it delete all game data such as worlds?

No. Deleting an instance removes only that instance's folder in the launcher's instance directory (`%LOCALAPPDATA%\LeviLauncher\Instances\<instance name>` by default in 1.1.0, or under your custom data directory if you set one; older versions use the `versions` directory). For a UWP instance, the package is unregistered first, and deletion is blocked while the game is running. Deleting an instance does not remove the default game data shared by non-isolated versions (worlds, resource packs, and so on). Note: if version isolation is enabled for an instance, its data is stored in the instance's own workspace and is deleted along with the instance, so back up important worlds first.

*Applies to: all current versions (since LeviLauncher 1.1.0, the instance directory is `%LOCALAPPDATA%\LeviLauncher\Instances`)*

## How do I delete a downloaded version installation package in LeviLauncher? I cannot find the delete button.

On the "Download" page, a downloaded version shows an "Install" button group on the right. Click the drop-down arrow next to it, choose "Delete installation package", and confirm. You do not need to open the directory and delete the file manually.

*Applies to: all current versions (verified on LeviLauncher 1.1.0)*

## Do I need a licensed Minecraft Bedrock Edition to use LeviLauncher? Can I use it offline or without buying the game?

You must own a licensed copy. LeviLauncher supports only licensed Minecraft Bedrock Edition, cannot bypass license verification, and has no Java-style "offline mode".

- Windows: when downloading or installing the game, the launcher must obtain the game license from Microsoft using a Microsoft account. Sign in through the launcher (click the avatar, or run `LeviLauncher.exe account login` from the command line) and select the account that purchased the game. If that account has not purchased the game, you will get `ERR_LICENSE_NOT_ENTITLED`; if it has only a trial license, you will get `ERR_LICENSE_FULL_REQUIRED` and the full version cannot be installed. Without a valid license, the game runs in trial mode. Xbox sign-in is still handled inside the game.
- Android: you must buy and install the licensed Bedrock Edition from Google Play.

One reason for this requirement is that LeviLamina updates depend on information provided by Mojang, so the project must enforce license verification. Launchers from unofficial channels and installation packages from unknown sources are not supported, and the official community does not assist with piracy-related issues. Official downloads: <https://github.com/LiteLDev/LeviLauncher/releases> or the documentation site <https://levimc.org/LeviLauncher/>.

*Applies to: all current versions (Windows v1.1.0, Android v1.7.1)*

## Can LeviLauncher start BDS (Bedrock Dedicated Server)?

No. LeviLauncher is a client launcher. It only installs, manages, and starts the Minecraft Bedrock Edition client (the GDK and UWP versions on Windows, and the Android version) and loads client mods; it cannot run a server. To run a BDS server, use the LeviLamina server setup (for example, install LeviLamina with lip, or use the docker-levilamina-server image).

## How do I import `.mcpack` / `.mcaddon` / `.mcworld` resource packs, texture packs, skin packs or maps in LeviLauncher for Windows?

- Method 1: On the "Launch" page, open "Content management" (or the matching resource pack, behavior pack, skin pack, or world page) and drag the `.mcpack` / `.mcaddon` / `.mcworld` file into the window to import it (the interface prompts "Drag in .mcworld/.mcpack/.mcaddon to import"). You will be asked to choose the target instance, and for worlds and per-player skin packs, you will also choose the player.
- Method 2: On the content page, click the "Import" button in the top right and select the file.
- Method 3: From the command line, run `LeviLauncher.exe pack import "D:\Downloads\xxx.mcpack"` (use `world import` for worlds); add `-i <instance>` to specify the instance.

A pack's `manifest.json` determines its type (resource, behavior, or skin). Common formats from mobile devices, such as `.mcpack`, work as well, provided the pack is compatible with the game version. You can also click "Open directory" on the content page and place the files into the matching folder manually. Note: Mods (`.mcmod` / `.dll`) must be imported under the instance's "Manage mods" page, not dragged into the resource area.

*Applies to: LeviLauncher (Windows), current version*

## Can a Minecraft instance installed by LeviLauncher be registered with the system so it appears in the Start menu and launches directly, or can I create a shortcut?

Yes.

1. Register with the system: On the launch page, click "Register with system" (or run `LeviLauncher.exe instance register <instance>` from the command line). Windows then treats the instance as the installed Minecraft for that channel (release or preview), and the Start menu, `minecraft://` links, and Xbox features will use it. After asking for confirmation, this replaces the Store version or whichever instance currently occupies that channel (existing data is kept). Registering a GDK or UWP instance requires Windows Developer Mode to be enabled; UWP instances are registered automatically at launch. Use `instance unregister` to remove the registration.
2. Desktop shortcut: Choose "Create desktop shortcut" from the menu next to the "Launch" button (or run `instance shortcut <instance>`). This creates `Minecraft - <instance name>.lnk`; double-clicking it launches that instance through the launcher.

*Applies to: LeviLauncher (Windows), current version (v1.x)*

## Does LeviLauncher support Linux (or macOS)?

No. LeviLauncher is available only for Windows (GDK / UWP) and Android. There is no macOS or Linux version, and none is planned (the maintainers once attempted a Wine-based GDK port but abandoned it). Linux users often rely on third-party solutions that run the Android version of the game (such as MCPelauncher, which requires purchasing the game on Google Play); these are not LiteLDev projects.

## How does LeviLauncher load mods? How does it coexist with the PreLoader / LeviLamina loading method?

LeviLauncher (Windows) includes its own native loader, `LeviLauncher.dll`. When installing or launching a version, it places this DLL into the game directory and adds it to the import table of the game executable (`Minecraft.Windows.exe`, or the executable specified in the manifest for UWP). The DLL then loads native DLL mods from the instance's `mods` directory (x64 only). If `preloader.dll` is present in the version directory (for example, when LeviLamina is installed), the external PreLoader takes over loading all mods, and `LeviLauncher.dll` skips native mod loading. The LeviLamina client is installed through the launcher's built-in lip-compatible package manager, so you do not need to install lip or .NET separately. Note that the PC PreLoader and the Android preloader only share a name; they are unrelated.

*Applies to: LeviLauncher (Windows) 1.0.0 and later; built-in package manager 1.1.0 and later*

## Is there a client mod for LeviLauncher that zooms the view with a key (Zoom)?

You can use the third-party mod <https://github.com/OpenMCBE/Zoom> (for PC; press C to zoom). Download `Zoom.dll` from its Releases page, add it under "Manage mods" in a LeviLauncher (GDK version) instance, and start the game through the launcher. Note that the mod's README states it supports only `1.26.20.04`; other game versions may be incompatible.

*Applies to: LeviLauncher (Windows) GDK instances; the mod's README states support for game version 1.26.20.04. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What is LeviLauncher good for compared with the official launcher?

Its main advantage is that you can install and manage multiple Bedrock versions side by side (release and preview, GDK and UWP) and use version isolation to keep each version's data separate, whereas the official launcher only lets you play the latest version. LeviLauncher can also load native mods, install LeviLamina and client mods, and manage content such as worlds and resource packs.

*Applies to: all current versions (Windows); UWP isolation requires x64 and 1.19.70.2 or later*

## Can LeviLauncher show the reason for a failed game launch, as the Java Edition PCL launcher does?

Not when the game process itself crashes: Bedrock Edition writes no error log, and crashes are usually silent. However, when a step handled by the launcher itself (launching, registering, installing or uninstalling mods, and so on) fails, the error dialog in 1.1.0 and later lists the most likely causes in plain language alongside technical details, with buttons to copy the text or open the launcher log directory. If the game does not start, follow these troubleshooting steps: start without mods, check the Windows components, and reproduce the problem with a clean isolated version.

*Applies to: LeviLauncher (Windows) current version; launcher-side error hints require 1.1.0 and later*

## Can LeviLauncher (Windows) bind a different account to each game instance for multiplayer testing?

Not at the moment. The Microsoft account signed in to the Windows launcher is used only to verify your license and download versions. In-game, the game uses whichever Xbox account is signed in to Windows. (Switching between multiple Xbox accounts inside the launcher is an Android-only feature.)

*Applies to: LeviLauncher (Windows) current version (1.1.0)*

## How do I show 4D skins in LeviLauncher? Importing a 4D skin pack does not work on newer versions (1.26.10+).

In newer versions, Mojang blocks ordinary resource packs from loading skins that have models. Instead, use the community-made 4DSkin mod: load it as a mod, then import the 4D skin mcpack directly (without depending on BetterResourcePackManager). Note that enabling it alongside BetterRenderDragon may crash the game. Also note that GitHub `QYCottage/4DSkin-Release` currently publishes only `4DSkin.levipack` (v2.0.0/v2.0.1). `.levipack` is the mod pack format for LeviLauncher on Android, whereas "Manage mods" in LeviLauncher for Windows accepts only `.mcmod` / `.zip` / `.dll`, so Windows users need to get the matching PC build from the official QQ group's files or from Discord. If you prefer not to use a mod, you can unpack the `.mcpack` and copy its files by type (`persona` / `custom` / `vanilla`) over the matching folders in the game's skin packs (a user got this working on 26.10/26.20, though ordinary marketplace skins may then become invisible).

*Applies to: LeviLauncher (Windows / Android); the 4DSkin v2.x release on GitHub is an Android `.levipack`; supported game versions follow the latest 4DSkin mod release. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why can some CurseForge content be found on the website but not in LeviLauncher's content download? Are there LeviLamina mods on CurseForge?

The launcher's CurseForge page searches Minecraft Bedrock content (`gameId` 78022) and can filter by game version and category (class/category). If an item appears on the website but not in the launcher, it usually does not support the selected game version or belong to the selected category; clear the game version filter or switch categories and search again. CurseForge currently hosts only Addons and similar content, with no LL mod category (the maintainers say they are applying to open one). Install LL mods from the launcher's LeviMC Mods page instead.

*Applies to: LeviLauncher (Windows) current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After I close the Minecraft window started through LeviLauncher, the process/console takes a long time to disappear. Is this normal?

Yes. After you close the GDK Minecraft window, the game's exe process continues running in the background for a while before exiting. This is normal GDK behavior and is unrelated to the launcher.

*Applies to: GDK Minecraft Bedrock Edition (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## When importing a map in LeviLauncher it asks me to choose a player, and the list shows old names. Where do these players come from?

The list shows the player profiles that have signed in to this GDK instance on this device—specifically, the player directories under the instance's `Users` folder. The names shown are Gamertags cached by the launcher (which is why they may be old names), not players who played online in the world. The world is imported under the selected player's profile.

*Applies to: LeviLauncher (Windows) GDK instances; UWP instances have no player profiles*

## How do I update the new LeviLauncher (v1, desktop) to a beta version or use automatic updates?

Turn on "Receive beta updates" in the launcher settings. From then on, the launcher checks for updates at startup, prompts you when it finds a new beta, and—once you confirm—updates in place without uninstalling the old version.

*Applies to: LeviLauncher (Windows) v1.0.x and later*

## Is there a mod that raises the size limit of structure blocks (structure files)?

Yes, there is a third-party mod called StructureLimitRemover: <https://github.com/fangkuaichaoge/StructureLimitRemover>. It supported MC 26.4x when this question was asked; before using it, check that the released version supports your game version.

*Applies to: depends on the mod's version support (MC 26.4x at the time). Not confirmed against the source code or the documentation: treat it as a pointer.*

## A CoralFans command installed in LeviLauncher has no completion in the game, as if it were not installed. How do I troubleshoot?

Enable the game debug console in the LeviLauncher instance settings (since v1.1.0, you can also run `LeviLauncher.exe instance set <instance name> --console`), start the game, and check the mod loading log. In this case, CoralFans failed to load because its dependency bsci was missing (disabled by mistake or not installed); installing or enabling bsci fixed the problem. A command conflict with another mod (such as Lamium) can also break commands; you can rename all CoralFans commands in its config.

*Applies to: LeviLauncher (Windows) + LeviLamina client mods. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Importing some `.mcpack` / `.mcaddon` resource or behavior packs into LeviLauncher fails (other packs work). What is the cause?

1. Wrong extension: a single resource, behavior, or skin pack should use `.mcpack`. `.mcaddon` bundles multiple packs; when importing a `.mcaddon`, the launcher looks only for `.mcpack` files inside it or `manifest.json` files in subfolders. If an archive containing a single pack with `manifest.json` at the root has a `.mcaddon` extension, the import fails; rename it to `.mcpack`.
2. Invalid JSON in `manifest.json` (a syntax error): the launcher cannot parse the file and the import fails. The launcher now supports JSON comments (which MC allows) and no longer ignores pure Script API behavior packs when importing a `.mcaddon` (it imports the script module into the behavior pack directory).
3. Duplicate UUID: you must choose to overwrite the existing pack; for skin packs, you must select the player first.

*Applies to: LeviLauncher (Windows), current version*

## Can I use BetterRTX with the GDK edition of Minecraft installed by LeviLauncher? What if the BetterRTX installer doesn't detect the launcher's instance directory?

Yes, if you install it manually. The bundled BetterRTX installer does not detect instances installed by LeviLauncher. Follow the setup guide at <https://bedrock.graphics/#setup> or pick a preset at <https://bedrock.graphics/presets>. On recent GDK versions, BetterRTX is distributed as a resource pack: if you have a `.mcpack` file, click "Import" on the launcher's "Content" page (or drag the file in), and then enable ray tracing in the game. The launcher's content importer accepts only `.mcworld` / `.mcpack` / `.mcaddon` files; for other formats (such as `.rtpack`), follow the official BetterRTX instructions. The older method was to manually replace the shader files in `renderer/materials` inside the instance directory. Note that BetterRTX is a set of shader files, not a DLL mod; BetterRenderDragon (BRD) is the DLL injected into the game to load Render Dragon shaders from resource packs. The two are separate tools.

*Applies to: GDK edition of Minecraft + LeviLauncher; follow the official BetterRTX instructions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## LeviLauncher fails to start, and `startup.log` or the debug output shows `config.Load failed: ERR_CONFIG_CORRUPTED: invalid character ... looking for beginning of value` (corrupted config file). What do I do?

The launcher's settings file, `config.json`, is corrupted (invalid JSON). Close the launcher and delete `%APPDATA%\LeviLauncher\config.json` (or `%APPDATA%\levilauncher.exe\config.json` in versions before v1.1.0); the launcher will generate a default configuration the next time it starts. To view the debug output, append ` /debug` to the shortcut's "Target" field (or run `LeviLauncher.exe --debug` from the command line); the startup log is at `%LOCALAPPDATA%\LeviLauncher\Logs\startup.log`. Deleting the file resets all launcher settings to their defaults. If you previously changed the data directory (`base_root`), set it again in the settings; otherwise, the instances stored there will not appear.

*Applies to: LeviLauncher current version (Windows); paths are the new layout used since v1.1.0*

## Where is the game data (`com.mojang`, worlds, resources, etc.) of the Windows GDK edition of Bedrock Edition stored?

Without instance isolation, the GDK data root is `%APPDATA%\Minecraft Bedrock` (`%APPDATA%\Minecraft Bedrock Preview` for the Preview). Shared content, such as resource packs, is stored in `Users\Shared\games\com.mojang`, and each account's worlds are in `Users\<account ID>\games\com.mojang\minecraftWorlds`. If "Instance isolation" is enabled for an instance in LeviLauncher, its data is stored in the `Minecraft Bedrock` folder inside the instance directory (`<instance directory>\Minecraft Bedrock\Users\...`).

*Applies to: Windows GDK edition of Bedrock Edition; LeviLauncher v1.1.0*

## I can't find the "Microsoft GDK" option from the tutorial video in the settings of the new LeviLauncher. Is something missing?

Nothing is missing. Older versions used that option to register the game, and newer versions no longer need it as long as the game starts normally. In the current version, if you want an instance to appear in the system app list, you can optionally use "Register to system" in the menu next to the launch button on the launch page.

*Applies to: LeviLauncher 0.3.11 and later*

## Does installing a game version with LeviLauncher overwrite or affect my existing worlds?

No, it doesn't overwrite them. If you don't select "Instance isolation" when installing an instance, that instance shares its game data (worlds, settings, and so on) with the Minecraft already on your system. If you select it, the data is stored separately in the instance directory, and you can choose to inherit a copy of the shared data. The launcher itself doesn't modify your worlds. If you want to uninstall the original game, back up the worlds under `%APPDATA%\Minecraft Bedrock\Users` first, then delete the game.

*Applies to: LeviLauncher v1.1.0 (GDK edition of the game)*

## A console window pops up every time I start the game with LeviLauncher (PC). Can I get rid of it?

Yes. Open "Instance settings" for that instance and turn off "Enable console" under the launch options; the console window will no longer appear when you start that instance. This option is stored per instance, so you have to set it for each instance separately.

*Applies to: LeviLauncher v1.1.0*

## Task Manager shows very high resource usage while LeviLauncher is running (even running on the discrete GPU and causing frame drops in the game). What can I do?

The launcher UI is rendered with WebView2, and effects such as background images and frosted materials increase resource usage. Once the game has started, you can quit the launcher without affecting the game. Note that if "Hide to tray on close" is on, closing the window only hides it; quit the launcher fully from the tray or turn that setting off. You can also lower resource usage under "Personalization -> Material and readability" by switching to the "Solid color" material or by not using a background image.

Since 0.3.11, WebView2 uses a safer software-rendering GPU setting.

*Applies to: LeviLauncher (Windows) 1.x. Not confirmed against the source code or the documentation: treat it as a pointer.*

## The LeviLauncher documentation site no longer opens. What is the new address?

All project documentation has moved to levimc.org, with the language at the start of the path. The LeviLauncher docs are at <https://levimc.org/zh-Hans/LeviLauncher/> for Simplified Chinese, <https://levimc.org/zh-Hant/LeviLauncher/> for Traditional Chinese, and <https://levimc.org/LeviLauncher/> for English. The LeviLamina docs are at <https://levimc.org/LeviLamina/>. Old docs.levimc.org addresses (such as `/LeviLauncher/zh-HK/` and `/LeviLauncher/zh-CN/`) redirect to the new addresses automatically.

*Applies to: current version (since 2026-11)*

## Windows Defender, Kaspersky, 360 and other antivirus programs flag LeviLauncher. Is it a virus?

It is a false positive. The LeviLauncher backend is written in Go (using the Wails framework) and is not code-signed. Antivirus heuristics often misjudge statically compiled Go programs: the same code may be flagged when built by GitHub Actions but not when built locally, and packing with UPX triggers even more detections. The bundled vcruntime-related DLL (used to load mods) has been included since early versions, and the launcher is still flagged even if you delete that DLL, so it is not the cause. The maintainers have reported the false positive to Microsoft several times and adjusted the build parameters to reduce detections. Download only from official channels (GitHub Releases). If your antivirus blocks the launcher, add the launcher directory to its exclusions.

*Applies to: all current versions (Windows)*

## Can I export a shader (RenderDragon resource pack) downloaded in LeviLauncher?

The launcher does not have a resource pack export feature, but you can export one manually. On the "Content → Resource packs" page, click the "Open" button (folder icon) in the top right to open the instance's resource pack directory, or click the folder icon next to a resource pack to open its folder. Compress the contents of the shader folder into a zip file and change the extension to `.mcpack` (a user reported that this works). If you only want to copy a resource pack to another isolated instance in the launcher, you do not need to pack it manually: use "Transfer content" on the content page, or run `LeviLauncher.exe pack copy <pack> --to <instance>` from the command line.

*Applies to: current version (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## When I start the UWP Bedrock Edition through LeviLauncher, the mouse leaves the window when I turn the camera in game (both windowed and fullscreen). Is this a LeviLamina problem?

This is not a problem with LeviLamina or the launcher. It is a mouse-locking issue in the Windows / UWP version of Minecraft itself. Search for "MCBE lock mouse" to find workarounds that adjust Windows settings. Solutions that require extra external tools are not recommended.

*Applies to: UWP Minecraft. Not confirmed against the source code or the documentation: treat it as a pointer.*
