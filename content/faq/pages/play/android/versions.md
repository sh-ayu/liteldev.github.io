# LeviLauncher on Android: versions and compatibility

## Can I use LeviLauncher on Android with HarmonyOS? Is there a way when the launcher cannot detect MC because there is no GMS/Google Play?

LeviLauncher on Android requires Minecraft to be installed from the Google Play Store (the launcher checks that MC's installation source is `com.android.vending`). Your device must therefore be able to run the Google Play Store and install a licensed copy of MC from it. Users report that HarmonyOS devices that support Android apps and Google Play work (for example, HarmonyOS 6). If your device cannot use GMS or Google Play, MC cannot be installed with Google Play as its source and will fail the launcher's license check. There is currently no official workaround.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1); compatibility of specific HarmonyOS versions depends on the device environment. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why can't I import a Windows .dll mod (LeviLamina mod) into LeviLauncher on Android?

A `.dll` file is a Windows mod (used by LeviLamina on PC and the Windows version of LeviLauncher) and does not work on Android. LeviLauncher on Android only accepts native mods compiled for Android: `.so` files, or `.levipack` / `.mcmod` / `.zip` mod packs, which are loaded by the built-in Preloader (`preloader-android`) rather than by LeviLamina. To use a `.dll` mod, run the PC version of LeviLauncher with LeviLamina on a computer. On Android, you need mods built specifically for Android.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## On Android LeviLauncher, MC 1.26.60.x runs but shaders will not load. What is the cause?

Check the following, in order: the MC version; whether the latest RenderDragon loader is installed (mtbinloader2, or MaterialBinLoader from the launcher's "External Mods"); whether the shader pack version matches the MC version; and whether the MC package comes from an official licensed channel. The usual causes are a game version that is incompatible with the shader or loader, or a package from an unofficial channel. We recommend signing in on the launcher's "Download" page with a Google account that owns Minecraft, downloading the matching version directly from Google Play, and then loading a shader that supports that version.

*Applies to: LeviLauncher-Android v1.7.0 and later (Google Play download feature), MC 26.60*

## After installing the old libfusembl2.so shader loader mod in LeviLauncher on Android, the game (26.5x) will not start. What should I use instead?

Stop using the old `libfusembl2.so` and switch to the latest mtbinloader2: <https://github.com/mcbegamerxx954/mtbinloader2/releases> (0.1.17 was recommended for 26.51; the latest v0.1.18 now supports 26.60), or download MaterialBinLoader (`libmbl2.so`) directly from the launcher's "External Mods" page. Other mods are available on the launcher's External Mods page or on the LeviLauncher Discord.

*Applies to: LeviLauncher-Android current version, MC 26.5x to 26.60*

## Can LeviLauncher on Android run old MC versions, such as 1.18.203?

No. The earliest MC version supported by LeviLauncher on Android is 1.21.80. Earlier versions show the message "This launcher does not support Minecraft versions earlier than 1.21.80" at launch and do not appear in the Google Play download list.

*Applies to: LeviLauncher-Android current version (v1.7.1)*

## After importing an MC version (such as 26.10) into LeviLauncher on Android, it crashes or says 64-bit is required. What is the cause?

LeviLauncher on Android supports only ARM64 (`arm64-v8a` / armv8, 64-bit) devices and 64-bit Minecraft. An imported armv7 (32-bit) package will not work; switch to a 64-bit package. We recommend the licensed Google Play version (since v1.7.0, you can also sign in with a Google account in the launcher and download it directly). Also, imported versions usually need version isolation enabled before they can launch.

*Applies to: LeviLauncher-Android all current versions*

## When downloading a Minecraft package or mod for LeviLauncher on Android there are several architecture builds such as aarch64 / armv7 / x86. Which should I choose?

Choose arm64 (`aarch64` / armv8 / `arm64-v8a`). LeviLauncher on Android is built only for `arm64-v8a` and supports only 64-bit Minecraft on ARM64 devices; MC packages for other architectures will not launch. Likewise, choose the arm64 build for `.so` mods, and make sure the mod version matches your MC version. The launcher's built-in mod catalog already filters for the `android-arm64` platform, so mods listed there can be installed directly.

*Applies to: LeviLauncher-Android all current versions*

## After upgrading Minecraft to a new version in LeviLauncher on Android (for example 26.40), the game crashes at launch (`tombstone ... org.levimc.launcher...xcrash`), or the old .so mods (minimap, shader/rendering mods, mtbinloader and so on) stop working. Why, and what should I do?

Native `.so` mods depend on function signatures and symbols inside the game. Because these usually change after a major MC update, the mod author must adapt the mod for the new version; until then, it may stop working or crash the game on load. A few mods rely on symbols that did not change and continue to work. To fix this, first use the launcher to disable any mods you added recently or that have not been adapted to the new version, confirm that the game launches normally without mods, and then re-enable them one by one to find the culprit. Wait for the author to release a matching new version before using the mod again. If you need to keep using older mods, keep an isolated instance of an older MC version.

*Applies to: LeviLauncher-Android all current versions; applies after any MC version update*

## What game and launcher versions does the Android minimap mod levimap require? Where do I download it? Is there a PC version? Is it open source?

levimap requires MC 26.30 or later and Android LeviLauncher 1.5.4 or later (an outdated launcher causes issues such as being unable to type). Versions 26.10 and 26.20 are not supported, and there are no plans to support older versions. You can download it from the levimap sub-channel of the LeviLauncher Discord server (the download link includes ads that earn the author revenue, so please do not forward the file directly). It is available only for Android; there is no PC version, and it is not open source.

*Applies to: MC 26.30+; Android LeviLauncher 1.5.4+. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Mods on GitHub such as Stipuleroo fail to import into LeviLauncher on Android. Why?

These are Windows LeviLamina client mods (the file name includes Windows and the content is a `.dll`). They are not adapted for Android and cannot be used in the Android launcher. On Android, you can import only arm64 native mods: a `.so` file, a `.zip` containing `manifest.json` and a `.so`, or a `.levipack`/`.mcmod` mod pack.

*Applies to: LeviLauncher-Android all current versions*

## MC 26.30 and 26.33 differ only by a minor version. Will a mod made for 26.30 necessarily work on 26.33? Can they play together online?

Minor versions (such as 26.30 and 26.33) usually share the same network protocol, so they can generally play together online. However, sharing a protocol does not mean a mod is compatible: the hook points and symbols a mod relies on may change between minor versions, so whether it works depends on whether the mod author has adapted it to that version (for example, some mods declare support only for 26.30). Check the supported game versions listed by the mod before installing.

*Applies to: Native mods running on LeviLauncher-Android, all current versions (compatibility depends on each mod). Not confirmed against the source code or the documentation: treat it as a pointer.*

## What Android version does Minecraft Bedrock 1.26.40.22 require?

Starting with 1.26.40.22 (a 26.40 series beta), Minecraft Bedrock on Android requires at least Android 12. Older Android versions cannot run this or later game versions (this is a requirement of the game itself, not the launcher).

*Applies to: Minecraft Bedrock 26.40 (1.26.40.22) and later. Not confirmed against the source code or the documentation: treat it as a pointer.*
