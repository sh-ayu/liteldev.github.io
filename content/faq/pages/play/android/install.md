# Installing LeviLauncher on Android

## Does LeviLauncher have an Android version? The website only shows an exe; where do I download the Android APK? Where do I report problems?

Yes. The exe on the website and in the docs is the Windows version (repository `LiteLDev/LeviLauncher`). The Android version lives in a separate repository, `LiteLDev/LeviLauncher-Android` (formerly LeviLaunchroid; old links redirect automatically). Download the APK from GitHub Releases: <https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>. Both versions share the same documentation at <https://levimc.org/LeviLauncher/?platform=android> (select the Android tab on the download page). Report Android issues at <https://github.com/LiteLDev/LeviLauncher-Android/issues> and include your Android version, device model, and launch log. System requirements: an ARM64 device running Android 9.0+ with a licensed copy of Minecraft Bedrock Edition 1.21.80 or later installed from Google Play.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## The version list in Android LeviLauncher is empty / it says license verification is required / it cannot find any game version. What is going on?

LeviLauncher on Android requires license verification. You must buy and install Minecraft (1.21.80 or later) from Google Play; purchases from other platforms, such as the Microsoft Store, do not work. After installing the game, it is best to launch it once before opening the launcher. Cracked copies of MC and modified launchers from cloud drives are not supported; download the official launcher from <https://github.com/LiteLDev/LeviLauncher-Android/releases>.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## How do I import a .so mod in LeviLauncher Android?

There are two ways:

1. Locate the `.so` file (or a `.levipack` / `.mcmod` mod pack) in a file manager, choose "Open with", and select LeviLauncher to import it.
2. On the launcher's "Mods" page, tap "Add mod" and choose the file using the file picker (or place the file in your phone's `Download` folder, tap "Scan", and add it from there).

The file must be a native mod compiled for Android (`arm64-v8a`); you cannot simply rename a Windows `.dll` to `.so`.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## Can LeviLauncher on Android import apk/apks packages through the system "Share" function? When using MC from a third-party source, after I sign in and tap "Next" it goes straight back to the launcher's home page. What should I do?

LeviLauncher only supports a licensed copy of Minecraft installed from the Google Play Store. It checks the installation source of MC on your device; a non-Play source (such as a cracked or re-signed package) triggers a "Play Store version required" message, prevents you from signing in, or returns you to the home page after you tap Next. You cannot import APK or APKS files through the system share menu. Instead, go to the launcher's "Download" page and tap "Import APK" (both APK and APKS are supported), or sign in with a Google account that owns MC to download it directly from Google Play. Note that an APKS file is a split package; merging it into a single APK yourself changes the signature, so it will no longer pass license checks. Either way, the licensed version of MC from the Play Store must remain installed on your device.

*Applies to: LeviLauncher-Android current version (v1.7.x)*

## On Android, a LeviLauncher or MC package downloaded from an unofficial source (cloud drive / QQ group / forum / version library) gives a black screen, crashes on launch (for example producing `tombstone_xxx_org.levimc.launcher...xcrash`), or fails to import. What should I do?

1. Download the launcher only from the official GitHub Releases page: <https://github.com/LiteLDev/LeviLauncher-Android/releases/latest> (grab `LeviLauncher-vX.Y.Z-release.apk`; the repository was formerly named LeviLaunchroid, and old links redirect automatically; once installed, the app is named LeviLauncher with the package name `org.levimc.launcher`). Launchers from unofficial sources are not guaranteed to work and are not supported.
2. MC must be a licensed copy of Minecraft Bedrock Edition bought on Google Play (1.21.80 or later, `arm64-v8a` 64-bit), and the Google Play version of Minecraft must be installed on your device. Packages from forums, version libraries, or cloud drives—as well as cracked or verification-free builds—are not supported. You must buy the Google Play version separately; purchases from other platforms do not carry over.
3. Starting in v1.7.0, you can sign in on the launcher's "Download" page with a Google account that owns the game and download Minecraft directly from Google Play, without having to track down a package yourself.
4. Imported versions usually require you to enable "Version isolation" in the instance settings before they can launch.

*Applies to: LeviLauncher-Android current version (v1.7.x); the Google Play download feature requires v1.7.0+*

## Updating LeviLauncher on Android from inside the launcher fails, or it says "signature mismatch" and cannot install. What should I do?

The in-launcher update fetches the latest Release through the GitHub API, downloads the APK, and hands it to the system to install, so it fails if your network cannot reach GitHub. In that case, download the new APK yourself from GitHub Releases (<https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>) and install it over the existing app. If it says "signature mismatch", the installed app is not an official build (for example, someone else repackaged and re-signed it), so the system will not let the officially signed APK overwrite it. Back up your data first (export your worlds, and so on), uninstall the app, and then install the APK from the official Release.

*Applies to: LeviLauncher-Android all current versions*

## When I update LeviLauncher on Android, is old data (including in-game data) kept?

Yes. Install the new version over the old one without uninstalling—or use the in-launcher update—and your data is kept, as long as both versions are officially signed builds (otherwise you get a signature mismatch and must uninstall and reinstall, which erases the launcher's data). For important worlds, back them up outside the app's storage first using the launcher's export function.

*Applies to: LeviLauncher-Android all current versions*

## Where do I download .so client mods for LeviLauncher on Android?

Check inside the launcher first. The home page has two catalogs: "LeviMC Mods" (from the levimc.org mod catalog, listing only mods whose authors have uploaded an Android arm64 client build there) and "External Mods" (the community-maintained LeviModHub catalog, which downloads through a GitHub proxy, `gh-proxy.org` by default). For mods not in the launcher, use the Discord button on the "External Mods" page to join the community Discord and get them from the plugin section; some mods are also published on CurseForge as mcpack files containing a `.so`. Install mods only from trusted sources, and pick the arm64 build that matches your MC version.

*Applies to: LeviLauncher-Android v1.7.0 and later (built-in mod catalog)*

## After importing a mod pack in LeviLauncher on Android there are no mod features and the Download page shows no downloadable versions, although it used to work. What is going on?

First, update the launcher to the latest version at <https://github.com/LiteLDev/LeviLauncher-Android/releases> (the repository was renamed from LeviLaunchroid to LeviLauncher-Android). The root cause is that the launcher supports only licensed Minecraft: the official Minecraft from Google Play (`com.mojang.minecraftpe`) must be installed on the system, or the launcher refuses to start the game. Since v1.7.0, the "Download" page downloads directly from Google Play after you sign in with a Google account that owns Minecraft; if you are not signed in or the account has not bought the game, the list is empty (and the page explains why). If it worked before, it was usually because an unlicensed copy was being used. Do not use launchers or games from unknown sources.

*Applies to: LeviLauncher-Android v1.7.0 and later (Download page notice); license verification applies to all current versions*

## Can I delete the Minecraft installed on the phone's home screen and keep it only inside LeviLauncher on Android? What if launching fails after I delete it?

No. A licensed copy of Minecraft from Google Play (package name `com.mojang.minecraftpe`, 1.21.80 or later) must stay installed on the system, and the launcher checks its installation source at launch. Other imported version APKs can run inside the launcher without being installed to the system one by one, but they cannot replace that system installation. If you changed the package name to run versions side by side and things now misbehave, delete your current Minecraft, reinstall the version with the normal package name from Google Play, and launch from the launcher. After that, you can import packages for other versions in the launcher and delete versions from the instance's settings.

*Applies to: LeviLauncher-Android all current versions (v1.7.1)*
