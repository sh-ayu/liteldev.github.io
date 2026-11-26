# Installing and updating LeviLauncher on Windows

## A new LeviLamina client version has been released, but it still does not appear in LeviLauncher after refreshing. What should I do?

After a new version is released, the CI build must finish and write the release to the `levilamina-client-version-db` version database before the launcher can see it. The launcher reads this database from GitHub (`raw.githubusercontent.com`), or through the `gh-proxy.org` / `gh.bibk.top` proxies first when "Use mirror source" is on. Because all of these sources are cached, a new version usually takes a few minutes to appear. Wait a moment, then restart the launcher or refresh. The `LeviLauncher.exe loader versions` / `loader install` CLI commands read the same database, so they cannot install the new version until the database updates either.

*Applies to: LeviLauncher 1.1.x (Windows)*

## Downloading a Minecraft version in the PC version of LeviLauncher is very slow. Do I need a proxy?

No. When downloading, choose a mainland China download source, xboxlive.cn (the launcher lists xboxlive.cn mirrors first, and can also test speeds to pick a source automatically). If the download is still slow, switch to another source. For users in mainland China, "Use mirror source" (on by default) also routes launcher updates, packages, and version lists through mainland China mirrors or a GitHub proxy.

*Applies to: LeviLauncher (Windows) 1.0.x and later*

## Microsoft Store Minecraft was forcibly/automatically updated to a new version and I want to keep using the old version (such as the one matching LeviLamina). What should I do?

First turn off automatic updates in the Microsoft Store. Then use LeviLauncher to download, install, and launch the specific Minecraft Bedrock version you want (both GDK and UWP work, and you can turn on version isolation). On the install page, the "Install LeviLamina" switch is on by default (for game versions supported by LeviLamina), so you can install the matching LeviLamina at the same time.

*Applies to: LeviLauncher (Windows) current version; requires licensed Minecraft Bedrock Edition*

## Older versions such as LeviLauncher 1.1.0-beta.3 cannot download the update package when updating automatically. Is it my computer or the launcher?

It is a launcher problem: the update address used by older launchers (the GoProxy module mirror) does not carry the new update package. Download and install the latest version manually from GitHub Releases. The new launcher updates itself from `LeviLauncher.zip` in the GitHub Release (trying the `gh-proxy.org` mirror first when the mirror source is on), and automatic updates work normally from then on.

*Applies to: LeviLauncher versions before v1.1.0-beta.4 must be updated manually; self-update works from the v1.1.0 stable release*

## The GitHub Release of LeviLauncher for PC has several files. What are the differences and which should I download?

Download `LeviLauncher-amd64-installer.exe` (the installer) and follow the prompts, choosing a separate directory with no Chinese characters in the path (do not install it inside the Minecraft game directory). `LeviLauncher.exe` is the portable version: place it by itself in a new folder with an English-only path and run it directly. `LeviLauncher.zip` is the update package used for self-updates and normally does not need to be downloaded manually.

*Applies to: LeviLauncher (Windows) v1.1.0*

## LeviLauncher (Windows) says "The current account has no license for this version" (`ERR_LICENSE_NOT_ENTITLED`) when downloading or installing a game version. What should I do?

LeviLauncher requires a licensed copy of Minecraft Bedrock Edition: the Microsoft account signed in to the launcher must own Bedrock Edition (if it does not, you can buy it at <https://www.xbox.com/en-US/games/store/minecraft/9nblggh537bl>). Simply signing in to Xbox in the game without buying PC Bedrock Edition is not enough. If the error continues after you buy the game, note that a Microsoft account can be signed in to the Microsoft Store on at most 10 devices, and the launcher counts as a separate device. Go to <https://account.microsoft.com/devices/content>, remove any devices you no longer need, confirm that the currently signed-in account is the one that owns the game, and try again. For other installation or launch problems, see the official troubleshooting guide: <https://levimc.org/LeviLauncher/guide/update-troubleshooting>.

*Applies to: LeviLauncher (Windows) 1.0.0 and later (Microsoft account sign-in in the launcher)*

## Downloading game versions or other content in LeviLauncher keeps failing (network error), and changing networks or using a proxy does not help. How do I troubleshoot? Where is the launcher log?

This is almost always a network problem. Retry a few times; on the "Download" page, switch mirrors, run a speed test, or import a local installation package instead; users in mainland China can turn on "Use mirror source" in the settings. If you use a proxy, note that the launcher reads the Windows system proxy (including PAC / auto-configuration scripts), so you must enable the system proxy in your proxy software. If it still fails, switch your proxy software to TUN (virtual network adapter) mode to route all traffic through it (a user resolved the issue this way). The launcher log is in `%LOCALAPPDATA%\LeviLauncher\Logs` (including `startup.log` from the startup phase), and the error dialog also has an "Open log folder" button. Attach the log when reporting a problem.

*Applies to: LeviLauncher (Windows) 1.1.0 and later (log path); the network advice applies to all current versions*

## Installing LeviLamina into an instance in LeviLauncher keeps failing or hangs on Resolving, with `ERR_LIP_INSTALL_FAILED` (`context deadline exceeded`, HTTP 404/500/504, connection to `127.0.0.1:443` failed, etc.). How do I fix it?

This is almost always a network problem reaching GitHub.

1. In the launcher settings under "Package management", turn on "Use mirror", then pick a preset under "GitHub proxy" (the default is <https://gh-proxy.org/https://github.com>; others include v4/v6/cdn/axisnow.gh-proxy.org, ghproxy.vip, and gh.bibk.top, all in the form `https://<host>/https://github.com`), or choose "Custom" and enter another mirror. When entering a custom mirror yourself, write the full prefix (for example, <https://v6.gh-proxy.org/https://github.com>); if you enter only the host name, the launcher appends `/https://github.com` automatically. Mirror speed varies widely between regions, so try several if one fails. Leave the field empty to restore the default.
2. After changing the mirror, use "Clear cache" to delete the downloaded package files and retry. Installation takes a while (about a minute)—it does not finish instantly.
3. Without a mirror, the launcher connects directly to GitHub through the system proxy. If the log shows a connection to `127.0.0.1:xxx` when you are not running a proxy, a stale system proxy setting is left over: search for "proxy" in Windows Settings and turn it off, or start your proxy software once and then turn it off again. Conversely, if you need a proxy, enable the system proxy in your proxy software.
4. You can also retry a few times or switch your DNS (for example, to Alibaba DoH).
5. If you only want to install the game first, turn off the "Install LeviLamina" switch on the install page and install it later.

*Applies to: LeviLauncher (Windows) 1.1.0 and later*

## LeviLauncher (Windows) reports missing components or cannot start when installing or launching a version. Is it an environment problem?

Mostly, yes. Both LeviLauncher and LeviLamina require a licensed Bedrock Edition, as well as:

- Microsoft Edge WebView2 Runtime;
- for the GDK edition, Microsoft Gaming Services and Microsoft GameInput;
- for the UWP edition, Windows Developer Mode;
- for LeviLamina or native mods, the Visual C++ runtime x64 (<https://aka.ms/vs/17/release/vc_redist.x64.exe>).

The launcher checks for missing components and prompts you to install them. You can also run `LeviLauncher.exe doctor` to check them and `LeviLauncher.exe doctor --fix` to repair them (`vcruntime`, `gameinput`, `developer-mode`, etc.).

*Applies to: LeviLauncher (Windows) 1.1.0 and later*

## How do I install a mod file in `.levipack` format? Can the PC LeviLauncher use the Android `.levipack`?

`.levipack` is the mod pack format for LeviLauncher-Android (the Android edition) and can only be imported there (open it with, or share it to, the Android launcher). PC and Android mods are not interchangeable: Android mods are arm64 `.so` files (their file names often contain `android-arm64`) and cannot be used on PC.

The PC (Windows) LeviLauncher uses `.mcmod` mod packs. It is also compatible with `.zip` packages that contain a `manifest.json`, and with standalone `.dll` files. On the instance's mods page, drag the file into the launcher window, or click import and choose "All files (*.*)" in the file dialog. On the command line, run `LeviLauncher.exe mod import <file>`.

*Applies to: LeviLauncher (Windows) 1.1.0; LeviLauncher-Android 1.7.x and current version*

## Is levilauncher.com the official website of LeviLauncher / LeviMC?

No. levilauncher.com is unrelated to LeviMC. It is an AI-generated phishing imitation, and the files it offers contain viruses. The only official LeviMC website is <https://levimc.org> (LeviLauncher documentation: <https://levimc.org/LeviLauncher/>).

Download LeviLauncher only from GitHub Releases (Windows: <https://github.com/LiteLDev/LeviLauncher/releases>, Android: <https://github.com/LiteLDev/LeviLauncher-Android/releases>).

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can LeviLauncher launch a Bedrock Edition that I installed earlier with the official Microsoft launcher or the Store?

Taking it over directly is not recommended. LeviLauncher manages its own installed "instances". Instead, reinstall the same version on LeviLauncher's "Download" page, or run `LeviLauncher.exe install <version or local installer file>`.

You can copy existing game data (worlds and settings) during installation, or merge the system's vanilla game data from the same channel (release/preview) into the instance later by running `LeviLauncher.exe instance copy-data <instance> --from system` (files with the same name are overwritten; no files are deleted). This applies to GDK edition instances with independent data (isolation) enabled. Back up all your worlds first.

*Applies to: LeviLauncher (Windows) 1.1.0*

## A Windows administrator (UAC) prompt appears when installing LeviLauncher. Should I allow it?

Yes, provided the installer came from an official source (GitHub Releases). By default, the LeviLauncher installer installs to `Program Files`, so it requires administrator rights and cannot continue without them.

The launcher may also request administrator rights during a self-update (if the install directory is not writable) and when `doctor --fix` installs components such as the VC runtime and GameInput. Allow the prompt once you have confirmed it is trustworthy.

*Applies to: LeviLauncher (Windows) 1.x*

## Where can I find historical versions of the Windows Bedrock Edition (for example 1.26.23)?

LeviLauncher includes a library of historical versions. On the "Download" page, you can select historical release or preview versions (both GDK msixvc and UWP appx are available). From the command line, search for a version with `LeviLauncher.exe installer search 1.26.2` (add `--channel preview` for previews), then install it with `LeviLauncher.exe install 1.26.23`.

The version list is fetched from GitHub (`LiteLDev/minecraft-windows-gdk-version-db`); users in mainland China can turn on "Use mirror". The third-party site mcappx.com also hosts historical Windows installers, which you can download and import as local packages.

*Applies to: LeviLauncher (Windows) 1.x*

## How do I install a Minecraft installer package (msixvc) downloaded with LeviLauncher?

Do not install the msixvc file manually (methods such as `Add-AppxPackage` do not work). Instead, install it directly through LeviLauncher: pick a version on the "Download" page and start the installation. LeviLauncher reuses packages that are already downloaded and resumes unfinished downloads.

You can also install from the command line: run `LeviLauncher.exe install <version>`, or pass a local file with `LeviLauncher.exe install D:\xxx.msixvc` (supports `.msixvc`/`.appx`/`.msix`/`.appxbundle`/`.msixbundle`). Run `LeviLauncher.exe installer list` to see the installer packages already downloaded. Fetching the version list requires access to GitHub; in mainland China, you can turn on "Use mirror".

*Applies to: LeviLauncher (Windows) 1.x*

## LeviLauncher fails to install the game, mod management clicks do nothing, or the game will not start after downloading, and a path or file name contains Chinese characters. How do I fix it?

Remove Chinese and other non-ASCII characters from the affected paths (the launcher data directory, instance directory, instance name, or file names) and try again. This has resolved the issue for some users.

Note that v1.1.0 fixed how the built-in package manager handles local paths containing `%`, `#`, or non-ASCII characters. However, when version isolation is enabled, issues still occur if the isolation directory contains characters outside the system code page, so an ASCII-only (English) path is safest.

*Applies to: LeviLauncher (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*
