# Install LeviLauncher

LeviLauncher comes in a Windows version and an Android version, and a macOS version that is in beta. The tab for your device is selected for you.

## What you need

=== "Windows"

    - Windows 10 or 11.
    - A licensed copy of Minecraft Bedrock Edition (GDK / UWP) from Microsoft Store.

=== "Android"

    - Android 9.0 or later on an ARM64 device.
    - Minecraft Bedrock Edition 1.21.80 or later, bought and installed from Google Play on this device.

=== "macOS"

    - macOS 14.6 or later on a Mac with Apple silicon.
    - A licensed copy of Minecraft Bedrock Edition. LeviLauncher runs the Windows (GDK) game through Wine.

::: info iOS
There is no iOS version of LeviLauncher, and we have no plans to make one.
:::

## Install

=== "Windows"

    1. Open the [latest release of LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases/latest) and download `LeviLauncher-amd64-installer.exe`.
    2. Run it and finish the setup wizard. It asks for administrator rights, because it installs into `Program Files` by default. If it asks to install WebView2 or another component, let it continue.

    The release has two more files, which you normally do not need:

    | File | What it is |
    | --- | --- |
    | `LeviLauncher.exe` | The portable version: put it alone in a new folder whose path has only English letters, and run it from there. |
    | `LeviLauncher.zip` | The package the launcher downloads when it updates itself. |

=== "Android"

    1. On the device, open the [latest release of LeviLauncher for Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) and download the file whose name ends in `-release.apk`.
    2. Open the downloaded file. If Android says that your browser is not allowed to install apps, tap **Settings**, turn on **Allow from this source**, go back and tap **Install**.

=== "macOS"

    The macOS version is in beta: it is in the releases marked **Pre-release**, not in the latest stable one.

    1. Open the [releases of LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases) and find the newest release that has `LeviLauncher-macos-arm64-installer.dmg`.
    2. Download that file, open it, and drag **LeviLauncher** into **Applications**.

    UWP instances are for Windows only.

## Check that it works

Start LeviLauncher. Its window opens; the first time, it shows its first-launch setup (Windows, macOS) or its licence agreement (Android).

## Update

=== "Windows"

    LeviLauncher looks for a newer version when it starts and offers to install it; it updates in place. To look yourself, open **Settings** and press **Check Update**, or run `LeviLauncher.exe self-update`.

=== "Android"

    LeviLauncher offers a newer version when it finds one, downloads its APK and hands it to Android to install. If your network cannot reach GitHub, download the new APK from the releases and install it over the app.

=== "macOS"

    LeviLauncher looks for a newer version when it starts and offers to install it.

## Beta and older versions

Every version, with its files and its changes, is on the releases pages:

- Windows and macOS: [LiteLDev/LeviLauncher releases](https://github.com/LiteLDev/LeviLauncher/releases)
- Android: [LiteLDev/LeviLauncher-Android releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

A **beta** is a release marked **Pre-release** there, such as `v1.2.0-beta.1`. It has what the next version brings before it is finished, and may break. To try one, download its files from its release as above. On Windows, an installed LeviLauncher can also follow the betas: turn on **Receive Beta Updates** in **Settings**, and it offers each new beta as an update. Turn it off to stay on stable versions.

## Next steps

=== "Windows"

    - [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/): from a fresh LeviLauncher to your first game with a mod.
    - [Version Management](/guide/version-management?platform=windows)

=== "Android"

    - [Play with mods on Android](https://levimc.org/tutorials/play/play-with-mods-android/): from a fresh LeviLauncher to your first game with a mod.
    - [Version Management](/guide/version-management?platform=android)

=== "macOS"

    - [Version Management](/guide/version-management)
    - [Update & Troubleshooting](/guide/update-troubleshooting)
