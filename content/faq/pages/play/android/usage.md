# LeviLauncher on Android: features and settings

## Does LeviLauncher on Android require a licensed copy of the game? Does a licensed copy bought on the Microsoft Store/PC (Java+Bedrock bundle) or iOS work? Do pirated copies or online "verification-free" launchers work?

Yes. LeviLauncher itself is free and open source, but the Android version verifies that the game is genuine: the device must have the official Minecraft installed from Google Play (package name `com.mojang.minecraftpe`, version 1.21.80 or later). At startup, it checks whether the installation source is Google Play. If not, it displays "非正版MC，请确保设备上MC来自于谷歌商店" (not genuine MC; make sure MC on the device comes from Google Play) and refuses to start. Bedrock is sold separately on each platform: purchases on the Microsoft Store/PC (including the Java+Bedrock PC bundle) and iOS do not include the Android version, so you must buy it separately on Google Play (for example, with a Google Play gift card). After buying it, install it from Google Play and preferably launch it once. Cracked or repackaged MC downloaded from forums, cloud drives, mcapks, and similar sources will fail verification. LiteLDev provides no way to skip the license check, and third-party "verification-free/cracked" launchers are not officially supported; issues with them will not be handled. Download the official version only from <https://github.com/LiteLDev/LeviLauncher-Android/releases>. In addition, the launcher supports only ARM64 devices (32-bit phones cannot use it). The PC version of LeviLauncher likewise requires a licensed copy from the Microsoft Store.

*Applies to: all current LeviLauncher-Android versions (latest v1.7.1)*

## Does LeviLauncher on Android depend on the Minecraft installed on the phone? What are the requirements for the game?

Yes. The device must have the official Minecraft Bedrock Edition (1.21.80 or later) installed from Google Play. The launcher checks that the installation source is Google Play; repackaged or cracked MC, or MC installed from other sources, cannot be launched through it. On top of that, the launcher can import official Minecraft APKs and run other game versions internally without installing each one into the system (imported versions usually require version isolation to be enabled), though the Google Play version must still remain on the device. Project page: <https://github.com/LiteLDev/LeviLauncher-Android>.

*Applies to: all current LeviLauncher-Android versions (latest v1.7.1)*

## After opening LeviLauncher on Android, my worlds and mods from MC are gone. How do I import worlds, addons, resource packs and `.so` mods into the launcher?

LeviLauncher on Android uses its own data directory, isolated from the data of the standalone Google Play version of Minecraft, so the launcher does not show your original worlds. To import content, package a world or change its extension to `.mcworld`, use `.mcaddon` for an addon, and use `.mcpack` for a resource pack or skin pack, then select LeviLauncher in "Open with". You can also import, export, and back up worlds and resource packs in the launcher's content management. Similarly, you can import `.so` native mods (and `.levipack` mod packages) by choosing LeviLauncher in "Open with" or by adding them on the "Mods" page. If version isolation is enabled, each version also keeps its own data, so make sure you select the right version when importing.

*Applies to: all current LeviLauncher-Android versions (latest v1.7.1)*

## What format are the "mods" imported into LeviLauncher on Android? How do they differ from LeviLamina mods? Is an apk on a cloud drive a mod?

Mods for LeviLauncher on Android are Android native mods: either a single `.so` library, or a packaged `.levipack` (a ZIP containing `manifest.json`, `lib<name>.so`, and `config`), `.mcmod`, or `.zip` mod package. Import them directly through the launcher to use them. They are loaded by the launcher's built-in Preloader (preloader-android) and use the separate `pl::` API. You do not need—and cannot use—LeviLamina, as LeviLamina mods are Windows `.dll` files that cannot run on Android. They are not addons either. An APK circulating online is generally a repackaged game installer with mods built in, not a standalone mod you can import, and repackaged MC will fail the launcher's Google Play license check; the launcher's "Import APK" feature is only for importing an official Minecraft APK as an extra version. If a cloud drive mixes in mods for other Android launchers, find a `.so` or `.levipack` built for LeviLauncher that matches your game version, then import it with the launcher.

*Applies to: all current LeviLauncher-Android versions (latest v1.7.1)*

## How different is the API of LeviLauncher on Android (formerly LeviLaunchroid) from LeviLamina? Can I develop with LeviLamina's headers?

They are completely different, and you cannot use LeviLamina's headers directly. Unlike LeviLamina, LeviLauncher on Android does not provide game class headers or a game API (such as events and commands). Instead, Android native mods build on the launcher's built-in Preloader SDK (LiteLDev/preloader-android) and use a separate `pl::` API (covering lifecycle, Hook, Signature lookup, Patch, Config, Input, Mod Menu, and more). You must locate game functions yourself using signatures or symbols and then hook them. However, the mod structure (`load`/`enable`/`disable`/`getSelf`, where `getSelf` returns `ll::mod::NativeMod`) is similar to a LeviLamina mod. See the API documentation at <https://levimc.org/LeviLamina/developer_guides/android/api/mod/>, the getting-started tutorial at <https://levimc.org/tutorials/develop/first-android-mod/>, and the source code at <https://github.com/LiteLDev/LeviLauncher-Android>.

*Applies to: LeviLauncher-Android current version (latest v1.7.1)*

## How do I load RenderDragon shaders (such as Newb) in LeviLauncher on Android? Do I need to repackage the game? Does the launcher include MBL? After upgrading to 1.26.x, textures turn into "logs"/all white, shaders have no effect, or the game crashes. What should I do?

You do not need to modify the APK. LeviLauncher on Android does not include a built-in shader loader, so you must add a MaterialBin loader mod (`.so`) yourself:

1. mtbinloader2 (MBL2): Download the latest `libmtbinloader2_aarch64-linux-android.so` from <https://github.com/mcbegamerxx954/mtbinloader2/releases> (currently v0.1.18, updated for 26.60) and import it under "Mods" in the launcher;
2. Alternatively, download MaterialBinLoader (`libmbl2.so`, for MC >=1.26.45.1) directly from the launcher's "External mods" page.

Next, import the shaders as a resource pack (you can also search for and download shaders like newb on the launcher's CurseForge page) and enable them in-game.

Note: Older loaders are incompatible with newer MC versions and will cause textures to turn into logs or all white, or crash the game. Always use the latest loader and update the launcher to the latest version. Because mtbinloader2 removed autofix in 26.10, shader authors must update their shaders for the matching MC version. If enabling a shader has no effect, it usually means the shader version does not match the game version or the loader is not enabled; updating the shader fixes this. You cannot use BetterRenderDragon to load shaders on Android, as it is for PC only. On PC, LeviLauncher has removed the "RenderDragon shaders" setting, so you should use BetterRenderDragon instead.

*Applies to: LeviLauncher-Android v1.7.1; MC 1.26.x (including 26.60)*

## How do I load 4D skins in LeviLauncher on Android without modifying the APK? Where do I download the 4DSkin mod?

You do not need to modify the APK. Download 4DSkin directly from the launcher's "External Mods" page (release page: <https://github.com/QYCottage/4DSkin-Release>, distributed as `4DSkin.levipack`), choosing a version compatible with your current MC version. Then, package your 4D skin as a skin pack and import it.

*Applies to: LeviLauncher-Android current version*

## Minecraft on my Android phone auto-updated / I want to play an older MC version. How do I use an older version in LeviLauncher? How do I install apk/apks files?

You do not need to uninstall the Google Play version of MC (in fact, the launcher requires the Play Store version to remain installed on your device). Simply add the older version in LeviLauncher:

1. On the "Download" page, sign in with a Google account that owns Minecraft and download the desired version directly from Google Play. Use "Download by version" to specify a version code (for example, the version code for 1.21.80.3 is `972108003`; you can only download builds that your account can still access);
2. Alternatively, obtain the official apk/apks package yourself and tap "Import APK" on the "Download" page. Both APK and APKS files are supported, and no extra installer is needed.

You must enable "Version isolation" in the instance settings before launching an imported version. If the import fails or crashes, update LeviLauncher to the latest version first. Note that the launcher does not support versions earlier than 1.21.80.

*Applies to: LeviLauncher-Android v1.7.0 and later (Google Play download); importing an APK works on the current version*

## How do I change the style, position and size of the levimap minimap? How do I open the big map?

Long-press the minimap to open the settings menu, where you can make it round, drag it to a new position, adjust the display scale with `Zoom`, and change the minimap size with `Size`. In recent versions of levimap, you can double-tap the minimap or tap `Big Map` in the menu to expand the big map. If double-tapping does nothing, your mod version is outdated—download the latest version from Discord (requires launcher version 1.5.4 or later).

*Applies to: Android LeviLauncher 1.5.4 and later; third-party mod levimap. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where do I find and enable the built-in mods in the new Android LeviLauncher?

In game, tap the floating button to open the "Mod Menu", then filter by "Built-in" or check the "Built-in features" group. These are the built-in mods (quick drop, quick perspective switch, hide UI, auto sprint, zoom, FPS/CPS display, gyroscope, Pojav controls, and more)—enable the ones you need. You can turn the mod menu on or off in the instance settings (it is on by default).

*Applies to: Recent Android LeviLauncher (versions with the mod menu, up to the latest v1.7.1)*

## Is there a mod for Android LeviLauncher that can force-switch resource packs in game?

Yes. The third-party mod BetterResourcePackManager does this. You can download it from the qycottage Discord channel (a 26.40 version already exists).

*Applies to: Android LeviLauncher; third-party mod BetterResourcePackManager (a version for MC 26.40 exists). Not confirmed against the source code or the documentation: treat it as a pointer.*

## What are the alternatives to libBetterResourcePackManager on Android?

BetterResourcePackManager has three main features: loading RenderDragon shaders, switching resource packs in game, and loading 4D skins. For alternatives, use the 4Dskin mod (available on the qycottage Discord) for 4D skins, and mtbinloader2 for shaders; there is no alternative for switching resource packs in game. On Windows, use BetterRenderDragon to load shaders. Note: as of 2026-08, BetterResourcePackManager already had a 26.40 version, so check the qycottage Discord for a new version that matches your game version.

*Applies to: Android LeviLauncher; third-party mod. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I export structures in LeviLauncher on Android? Why can't I find my old structures?

In the launcher's world list, open the world's action menu and tap "Extract structures". The launcher can only find structures that are already saved in the world. First, enter the world through this launcher, place a structure block and set it to save mode, name the structure and tap save, then leave the world, return to the launcher, and tap "Extract structures". You can then export the structures one by one or as a ZIP. Structures that were not saved to the world with a structure block cannot be found.

*Applies to: Android LeviLauncher current version*

## How do I get redstone display / chunk display (shader-style overlays) with LeviLauncher? Why doesn't the shader pack take effect?

These effects come from material (`material.bin`) shader packs, which only work after you install a material loader mod. On Android, load mtbinloader2 (<https://github.com/mcbegamerxx954/mtbinloader2>); on PC, install BetterRenderDragon (BRD, <https://github.com/QYCottage/BetterRenderDragon>); then add the redstone/chunk display material pack. Adding the material pack without a loader has no effect.

*Applies to: LeviLauncher (Android/PC); third-party material loader mod. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can I use features of other third-party clients (such as the Flarial Android client) in LeviLauncher on Android?

You can try: extract the arm64 `.so` file from the client's installation package (APK) and import it on the launcher's "Mods" page (the launcher supports importing `.so` files, a `.zip` containing `manifest.json` and a `.so`, and `.levipack`/`.mcmod` mod packs). It then loads as a native mod. Whether it works depends on the third-party client itself: users report that the `.so` extracted from Flarial 1.139.3 works, while newer versions may crash after import (because they check the package name) or when playing online. LeviLauncher does not officially support these third-party `.so` files; use only trusted sources and test in an isolated version first.

*Applies to: LeviLauncher-Android current version (v1.7.1); third-party client compatibility depends on its version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After launching the game with LeviLauncher on Android the frame rate is locked at 60 FPS although my phone supports 120Hz. What should I do?

The frame rate cap is a game setting, not a launcher setting. Raise the frame rate limit in the game under "Settings → Video" (on some models, it is also limited by the system or vendor refresh-rate policy). The launcher's built-in FPS display mod only shows the frame rate and does not limit it.

*Applies to: All current versions (depends on Minecraft's own settings and the device). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can the new LeviLauncher on Android no longer access files outside its own app directories? Can mod config files placed under `/storage/emulated/0/games/` still be read?

Yes. Starting in v1.5.27, the Android version reworked its storage access and permissions: it no longer requests "All files access" (`MANAGE_EXTERNAL_STORAGE`) or storage permissions such as `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` (the maintainers say this is required for listing on Google Play). The launcher can no longer directly access locations outside its own directories (`/storage/emulated/0/Android/media/org.levimc.launcher/`, `Android/data/org.levimc.launcher/`, and the app's private directories), and importing files is now authorized through the system file picker. Mods that used to store their config in public directories such as `/storage/emulated/0/games/` must switch to a directory the launcher can access, such as the game data directory of the relevant instance.

*Applies to: LeviLauncher-Android v1.5.27 and later*

## Does LeviLauncher on Android need the mod menu floating window? Built-in mods (perspective switch, CPS, etc.) disappear when I turn it off.

Yes. Built-in mods and mods that use the launcher's unified UI are now attached to the mod menu (previously, each mod drew its own interface with imgui). When you turn off "Mod menu" in the instance settings, the floating windows and HUD for the built-in mods are hidden as well. If you don't want the button covering the screen, turn on "Show only in pause menu" in the mod menu's general settings so it appears only on the pause screen, or adjust the floating button's size and opacity, or lock its position.

*Applies to: Android LeviLauncher versions with the mod menu (up to the latest v1.7.1)*

## I added a resource pack in LeviLauncher Android, but it does not show up in the game. What should I do?

The resource pack was usually placed in the wrong storage location. On the resource pack page in the launcher's content management, use "Select storage" to switch the location and import the pack again: if it was set to "External", switch to "Internal", and if it was "Internal", switch to "External". If the instance has version isolation enabled, choose "Version isolation (internal)" or "Version isolation (external)". If none of these work, try turning version isolation on or off.

*Applies to: Android LeviLauncher, current version*

## Is the "Keep running in background" option gone since LeviLauncher Android 1.6.1? What if the game has to reload when I switch back?

v1.6.1 removed the launcher's foreground service (the former "Keep running in background" option). The BedrockTools mod now provides this feature: update BedrockTools to v1.5.11 or later (the older 1.5.9 does not work on 26.60) and enable No Disconnect in BedrockTools. Minecraft will then keep running in the background and won't need to reload when you switch back.

*Applies to: LeviLauncher-Android v1.6.1 and later (currently v1.7.1); BedrockTools v1.5.11+*

## Which mod loader does LeviLauncher Android use? Is there Android mod development documentation or a template, and where do I start?

LeviLauncher for Android does not use a loader like LeviLamina. Instead, it includes the built-in Preloader SDK (<https://github.com/LiteLDev/preloader-android>), which provides the `pl::` API for mod lifecycle (`<pl/Mod.hpp>`, `PL_REGISTER_MOD`), Hook, Signature, Patch, Config, Input, Mod Menu, and more. The official API documentation is now part of the LeviLamina documentation under "Android Native Mods API": <https://levimc.org/LeviLamina/developer_guides/android/api/mod/> (covering Mod/Hook/Signature/Patch/Config/Input/Mod Menu and more). For a getting-started tutorial, see <https://levimc.org/tutorials/develop/first-android-mod/>. For a project template, use <https://github.com/QYCottage/levilauncher-android-mod-template> (create a repository with Use this template, then build a `.levipack` with CMake+Ninja or let GitHub Actions build it automatically). For a complete example, see `examples/full-cpp-mod` in the LiteLDev/LeviLauncher-Android repository.

*Applies to: LeviLauncher-Android current version (latest v1.7.1)*

## When I launch the game with LeviLauncher on Android, after playing for a while the frame rate is locked to around 10 FPS (launching the vanilla game does not do this). What causes this?

The launcher may not be on the phone vendor's game/performance whitelist, causing the system to throttle it and cap the frame rate (the launcher cannot fix this on its own for now). To work around this, try clearing background apps, manually adding LeviLauncher to the system's game assistant/performance mode, updating the game and launcher to the latest versions, or using scheduling tools; a low-end SoC also plays a part. If the issue persists, report it on GitHub Issues with your device model, Android version, and launch log.

*Applies to: All current versions (depends on the device vendor's system policy). Not confirmed against the source code or the documentation: treat it as a pointer.*

## For an instance created with "Import APK" in LeviLauncher on Android, launching hangs at 51% for a long time (slower after clearing background apps), and importing a world also fails. What should I do?

Instances created by importing an APK can launch slowly on lower-end devices, since the first launch has to extract native libraries and other files. First, update the launcher to the latest version (v1.6.0/v1.6.1 include many performance and content-management improvements). If the problem persists, try toggling "Version isolation" in the instance settings and retry, or use a version installed normally from Google Play instead. Note that according to the official documentation, imported versions usually need version isolation enabled to launch; if the game fails to launch after you turn it off, turn it back on.

*Applies to: LeviLauncher-Android, instances created by importing an APK. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Importing resource packs/mods in LeviLauncher on Android is very slow. What can I do?

Larger packs take longer to import. First, update to the latest version (v1.6.1 improved pack import speed). If it is still too slow, you can extract the pack manually into the launcher's data directory:

- Without version isolation: `/storage/emulated/0/Android/media/org.levimc.launcher/minecraft/_shared/external/games/com.mojang/resource_packs/`;
- With version isolation enabled: `/storage/emulated/0/Android/media/org.levimc.launcher/minecraft/<instance directory>/external/games/com.mojang/resource_packs/`.

Then launch the game directly. In most cases, importing through the launcher is enough (the resulting folder name is random).

*Applies to: LeviLauncher-Android current version (when using the new shared storage layout)*

## Playing MC with LeviLauncher on Android stutters from time to time, or on 26.40 loading resources and generating the world when joining a server is abnormally slow. What causes this?

Common causes:

1. Too many mods are installed at once, or Vibrant Visuals or chained effects are enabled, causing excessive load. Reduce the number of mods and turn off Vibrant Visuals. The game caps the frame rate at 60 FPS by default; mods such as BedrockTool can unlock it.
2. When 26.40 launched, packages from some third-party version libraries were faulty (issues with the APKS and APK contents), making loading and world generation very slow. The licensed Google Play version does not have this problem, so switch to a licensed package (starting in v1.7.0, you can download directly from Google Play on the launcher's "Download" page).

*Applies to: LeviLauncher-Android; point 2 applies to third-party packages from the MC 26.40 launch period. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What tools are generally used to analyze `libminecraftpe.so` when developing Android native mods?

Common reverse-engineering tools include IDA Pro, Ghidra, Binary Ninja, radare2/Cutter, and Reko. Because `libminecraftpe.so` contains millions of functions, opening it in IDA or similar tools is very slow, uses a lot of memory, and may even hang or crash. Once you locate the target function, Android native mods usually resolve its address at runtime using a signature, such as `pl::memory::resolveSignature("...", "libminecraftpe.so")` provided by PreLoader.

*Applies to: Android native mod development (independent of the launcher version). Not confirmed against the source code or the documentation: treat it as a pointer.*

## I installed a Minecraft package of over 300 MB in LeviLauncher on Android, but it takes over 700 MB. Why?

For an imported package, the launcher keeps a copy in that version's directory (`base.apk.levi`, and `*.apk.levi` for split packages) and must also extract the native libraries before running. As a result, it uses about twice the package size. This is normal.

*Applies to: versions imported or downloaded in LeviLauncher on Android*
