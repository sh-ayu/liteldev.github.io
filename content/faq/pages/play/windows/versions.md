# LeviLauncher on Windows: versions and compatibility

## Does LeviLauncher (Windows) support the UWP edition and Minecraft versions older than 1.21.120? Can it import a local appx installer?

Yes. Early versions supported only the GDK edition (1.21.120+), but LeviLauncher v1.0.0 (2026-09-13) added UWP support, and the current version launches both GDK and UWP builds. The download page lists both GDK and UWP (appx) builds, and you can also import a local `.msixvc`, `.appx`, `.msix`, `.appxbundle`, or `.msixbundle` installer to create an instance (command line: `LeviLauncher.exe install <version|file>`).

Running a UWP instance requires Windows Developer Mode and the UWP framework dependencies specified in the package manifest. Launching a UWP instance automatically registers it with the system, taking the "installed Minecraft" slot for that channel. UWP x64 versions 1.19.70.2 and later support instance isolation. Unisolated UWP instances share the channel's original `LocalState` data, so back up your worlds before starting.

The native DLL mod loader supports only x64 packages. Automatic LeviLamina installation still applies only to supported GDK versions, as the LeviLamina client itself supports only the few versions for which Mojang provides the required data.

*Applies to: LeviLauncher (Windows) 1.0.0 and later*

## Can LeviLauncher be used together with third-party injection clients such as Onix, Flarial, Latite and Oderso? Why do Flarial and others not detect a game launched with LeviLauncher?

Generally no. A game process launched directly by LeviLauncher has no package identity. When third-party clients call WinRT interfaces, they receive `WinRT throwing: 0x80073D54 : The process has no package identity` and fail to detect the game.

As a workaround, select "Register to system" (next to the launch button) for that version, launch the game from the system entry point after registration, and then let the third-party client inject. Newer versions of Flarial include dedicated compatibility, so this is worth trying. However, users who tested Latite, Oderso, and Onix found that they do not work with LeviLauncher. Third-party client compatibility varies by version.

Do not place the DLL of a client like Onix into LeviLauncher's `mods` directory as a mod; they inject and operate differently, which causes crashes. Injecting a third-party client alongside the LeviLamina client also tends to cause conflicts.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## I own a licensed copy, but LeviLauncher says I need to "unlock the full game", turns into a trial, or the Microsoft Store only shows the education edition when downloading or launching the Preview. What should I do?

The Preview requires your account to own a separate Preview license. First, check the launcher's account info (or run `LeviLauncher.exe account status --refresh`) to confirm that the Preview entry shows "owned" rather than "trial/not owned". If it does not, obtain or download Minecraft Preview once through the Microsoft Store or the Xbox app.

The Preview was previously region-locked in mainland China by the Microsoft Store. In Windows Settings, go to "Time & language -> Language & region" and change "Country or region" to a location outside mainland China (such as Canada or the United States). You do not need to change your account's region, and the release version does not require a region change.

Additionally, a Microsoft account can sign in to the Store on at most 10 devices, and the launcher counts as one device. Exceeding this limit also causes an unauthorized state. Remove old devices at <https://account.microsoft.com/devices/content>.

*Applies to: LeviLauncher (Windows) 1.0.0 and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why is a mod, or the option to install LeviLamina, greyed out and unclickable in LeviLauncher?

The current instance's game version is outside the supported range for that mod or LeviLamina (the UI displays "This game version does not support LeviLamina" or "No package matches this version and platform"). Switch to a game version that the mod or LeviLamina supports (for example, some mods support only 26.60).

*Applies to: LeviLauncher 1.1.0*

## LeviLauncher says Windows needs an update, but the system (for example a rented cloud PC) does not allow updates. What should I do?

The maintainers recommend upgrading the launcher (the version at the time was v1.1.0-beta.5; use the latest stable release, v1.1.0 or later, now).

If you see "The current Windows version does not meet the minimum requirements of this UWP package" (`ERR_UWP_SYSTEM_VERSION`) while installing a UWP version, your only option is to choose a game version compatible with your system.

*Applies to: LeviLauncher 1.1.0-beta.5 and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Installing LeviLamina for a new game version (such as 26.51.3) with LeviLauncher says "unsupported version". Do I need to install it manually with lip?

This usually happens because the table mapping LeviLamina to game versions does not include the new version yet. The maintainers keep this table in the remote repository `LiteLDev/levilamina-client-version-db`. Once they update it, you can install LeviLamina without upgrading the launcher, so you can simply wait for the update. If you are in a hurry, you can manually install the matching LeviLamina version with lip as a temporary workaround.

*Applies to: LeviLauncher 1.1.0*

## After loading a shader pack in LeviLauncher the UI turns into "logs" (wood textures), text disappears, or the game even crashes. What should I do?

Compatibility depends on the shader pack itself. The shader version must match the game version (for example, MC 26.50 needs a shader built for 26.50). Open CurseForge from the content download entry on the launcher's home page, search for `newb`, and download the version labeled 26.50+ (matching your game version).

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## After loading the Glacie client with LeviLauncher the game crashes when joining a server. Can LeviLauncher use Glacie?

LeviLauncher can load Glacie, but Glacie is not a LeviLamina-based mod, and at the time it supported only up to 26.20 (supported versions are defined by Glacie's own releases). Loading non-LeviLamina dll mods into an instance with LeviLamina easily causes conflicts and crashes, so do not use them in the same instance. To use Glacie, choose an instance without LeviLamina and a game version that Glacie supports.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why does licensed-copy verification fail when I run an old UWP version of Bedrock Edition (such as 1.18.12) with the launcher, and how do I fix it?

Around 1.19.70, Microsoft changed the Xbox authentication public key. Old UWP builds still contain the old key, causing licensed-copy verification to fail. Since v1.0.2, LeviLauncher automatically replaces the old public key with the new one when installing an old UWP version and before launching an existing instance (builds containing both keys are left untouched), so no action is needed. If you use another launcher or install the game manually, you can patch the game executable yourself with KeyPatcher.

*Applies to: LeviLauncher v1.0.2 and later (UWP instances)*
