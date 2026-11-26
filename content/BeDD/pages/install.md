# Install Be.D.D.

Be.D.D. is one Windows program, `BeDD.exe`, with the mods it puts into its own copies of the game. Only the PC that runs the tests needs it. It is not a lip package and not on LeviMC Mods.

## What you need

- Windows 10 or 11, x64.
- [LeviLauncher](https://levimc.org/LeviLauncher/install) **1.1+** with a Minecraft Bedrock **1.26.60** (GDK, release) instance that has LeviLamina **26.60.x** ([Which instance](/guide/installs#which-instance)). Be.D.D. copies that instance and never changes or starts it.

No PowerShell, lip or .NET runtime needed.

## Install

Download `bedd-windows-x64-setup.exe` from the [latest release](https://github.com/LiteLDev/BeDD/releases/latest) and run it. It needs no administrator rights: it installs for your user into `%LOCALAPPDATA%\Programs\BeDD`, adds a **BeDD** entry to the Start menu and puts the folder on your `PATH`.

The release has two more files:

| File | When to use it |
|---|---|
| `bedd-windows-x64.zip` | Works unzipped anywhere: run `BeDD.exe` from its folder. For a harness that fetches Be.D.D. itself ([Let the harness fetch it](/guide/installs#let-the-harness-fetch-it)). |
| `bedd-windows-x64.msi` | Installs silently with `msiexec /i bedd-windows-x64.msi /qn`, for managed PCs and CI. |

## Check that it works

Open a **new** terminal and run:

```powershell
BeDD.exe version
```

You should see `Be.D.D. 0.4.0` (or newer) and the game and LeviLamina versions it drives.

## Update

Run the newer installer; it closes an open manager window and its games. The next `launch` replaces the mod in each clone: see [Upgrading](/guide/installs#upgrading).

## Other versions

Every release is on the [releases page](https://github.com/LiteLDev/BeDD/releases). Each one drives one game version, named in its notes. In CI, pin a version in the download address: `https://github.com/LiteLDev/BeDD/releases/download/v0.4.0/bedd-windows-x64.zip`.

## Uninstall

Settings > Apps > Installed apps > **BeDD**. To remove the clones, worlds and logs too, see [Uninstalling](/guide/installs#uninstalling).

## Next steps

- [Drive the game client with Be.D.D.](https://levimc.org/tutorials/automate/bedd/): set up the base game, start a game in the background and run a first script.
- [Driving the game](/guide/usage) and [several games at once](/guide/several-games).
