# LeviLauncher on Android: errors and crashes

## LeviLauncher on Android says Minecraft is not installed / cannot be found (or the main program cannot be found after switching to a modified APK). How do I fix it?

The launcher only loads the official Minecraft already installed on the phone (package name `com.mojang.minecraftpe`). If you see a message such as "Minecraft is not installed... please install it from the Google Play Store first" or "Not licensed MC":

1. Install or update the official Minecraft to 1.21.80 or later from Google Play, then reopen LeviLauncher.
2. Do not replace the original app with a modified APK that has shaders, MBL2, or similar patches injected. A modified MC, or one installed from outside Google Play, will fail verification. Uninstall it, reinstall the original from Google Play, launch it once, and update the launcher to the latest version. To get those features, import native mods (`.so` / `.levipack`) through the launcher instead of modifying the package.
3. If the Google Play version is installed and still not detected, check whether the system is blocking LeviLauncher from reading the list of installed apps (some Chinese ROMs have a permission toggle such as "Get app list"). Enable that permission and try again.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## After the Flarial client was removed from and later re-listed on Google Play, importing its .so into LeviLauncher on Android crashes when I enable certain modules. Why?

Newer versions of Flarial check the package name. When run inside LeviLauncher, that check fails and crashes the game. You must modify or remove the package-name check, or use a `.so` extracted from an older version of Flarial. This is behavior of the third-party client and is not officially supported by LeviLauncher.

*Applies to: Flarial versions after it was re-listed; LeviLauncher-Android current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After using the BedrockTools mod in LeviLauncher on Android, the game crashes when I place or open functional blocks with a UI such as shulker boxes, anvils, crafting tables and chests. What should I do?

This happens because the mod's signature no longer matches (an issue introduced with MC 26.50). The mod author has released a fixed version, so update BedrockTools. As a temporary workaround before updating, change the touch control mode to "Joystick + crosshair".

*Applies to: Older BedrockTools from the MC 26.50 period. Not confirmed against the source code or the documentation: treat it as a pointer.*

## When LeviLauncher on Android (formerly LeviLaunchroid) downloads the game, the progress hangs (for example at 15%). What should I do?

This is usually a network problem and the download works normally over a proxy. Also make sure you have the latest launcher from the official GitHub (<https://github.com/LiteLDev/LeviLauncher-Android/releases>). Since v1.7.0, game downloads go through Google Play (you must sign in with a Google account that owns Minecraft), so you must use a proxy on networks that cannot reach Google directly. Downloads can be resumed: if one is interrupted, tap "Retry" to continue.

*Applies to: LeviLauncher-Android; since v1.7.0 the download source is Google Play. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where are the crash logs (tombstone xcrash files) after the game crashes in LeviLauncher on Android?

They are saved in `/storage/emulated/0/Android/media/org.levimc.launcher/crash_logs/` with file names like `tombstone_xxx__org.levimc.launcher.native.xcrash`. Open that folder in a file manager such as MT Manager to copy the file, then send it to the developers or attach it to an issue at <https://github.com/LiteLDev/LeviLauncher-Android/issues> for investigation (you can also share it directly from the crash screen). If that directory is not writable, the launcher falls back to `Android/data/org.levimc.launcher/files/crash_logs/`.

*Applies to: LeviLauncher-Android current version (v1.7.1)*
