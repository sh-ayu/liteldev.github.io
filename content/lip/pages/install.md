# Install lip

`lip` is one program with no other requirement: no .NET, no Git, no Wine to install first. Pick your system below, then check that it runs.

## What you need

- Windows 10, Windows 11 or Windows Server 2019 or later, on x64 or ARM64; macOS on Apple silicon or Intel; or Linux on x64. There is no `lip` for Linux on ARM64. [Where lip runs](index.md#where-lip-runs) says what a server can do on each system.
- A terminal: Windows Terminal or PowerShell on Windows, Terminal on macOS, the terminal of your desktop on Linux.
- An internet connection.

## Install

Pick your system. The page has picked the one you are browsing from.

:::: tabs

== Windows

1. Open the [latest release of lip](https://github.com/LiteLDev/lip/releases/latest) and download `lip-<version>-win-x64.msi`, or `lip-<version>-win-arm64.msi` on a PC with an ARM processor.
2. Run the file. It installs `lip` for you in `%LOCALAPPDATA%\Programs\lip` and adds that folder to your `PATH`, without an administrator. Where `lip` is already installed for every user, as earlier versions installed it in `C:\Program Files\lip`, it updates that installation instead, which needs an administrator.

::: details Without the installer: the archive
Download `lip-<version>-win-x64.zip` (or `win-arm64`) from the same release, extract `lip.exe` into a folder of your choice and add that folder to your `PATH`. Use this where the installer is not allowed or fails.
:::

== macOS / Linux

In a terminal, run:

```shell
curl -fsSL https://levimc.org/lip/install.sh | sh
```

The script:

1. picks the build of `lip` for your system: `osx-arm64` on a Mac with Apple silicon, `osx-x64` on a Mac with Intel, `linux-x64` on Linux on x64. On any other system it stops;
2. downloads that build of the latest release from GitHub, and checks it against the release's `SHA256SUMS`. A file that differs is not installed;
3. puts `lip` in `~/.local/bin`, replacing a `lip` that is there;
4. when that folder is not on your `PATH`, asks whether to add it to the profile of your shell.

It needs no root and no administrator password, and touches nothing outside that folder and the profile.

These variables change what the script does. Set them for `sh`, after the `|`:

```shell
curl -fsSL https://levimc.org/lip/install.sh | LIP_VERSION=0.42.0 sh
```

| Variable | What the script does with it |
| --- | --- |
| `LIP_VERSION` | Installs this version, such as `0.42.0`, instead of the latest. |
| `LIP_INSTALL_DIR` | Installs `lip` in this folder, an absolute path, instead of `~/.local/bin`. |
| `LIP_GITHUB_PROXY` | Downloads from GitHub through this GitHub proxy, as the setting [`github_proxy`](guides/configuration.md#github-proxy) of `lip` does: the address of the proxy, then `/`, then the address on GitHub. |
| `LIP_NO_MODIFY_PATH` | When `1`, never changes the profile of your shell, and prints the line to add to it instead. |

A Mac with Apple silicon runs the Wine of `lip` through Rosetta 2. `lip` asks to install it the first time it sets up or starts a server: see [Linux and macOS](guides/linux_macos.md#macos-on-apple-silicon).

::: details Without the script: the archive
Download the archive for your system from the [latest release](https://github.com/LiteLDev/lip/releases/latest): `lip-<version>-osx-arm64.zip` (Mac with Apple silicon), `lip-<version>-osx-x64.zip` (Mac with Intel) or `lip-<version>-linux-x64.tar.xz` (Linux). Extract it into a folder on your `PATH`:

```shell
mkdir -p ~/.local/bin
unzip lip-<version>-osx-arm64.zip -d ~/.local/bin        # macOS (or osx-x64)
xattr -d com.apple.quarantine ~/.local/bin/lip           # macOS
tar -xJf lip-<version>-linux-x64.tar.xz -C ~/.local/bin  # Linux
```

On macOS, the `xattr` line removes the quarantine mark that macOS puts on files downloaded in a browser; without it, macOS refuses to run `lip`. If `~/.local/bin` is not on your `PATH`, add `export PATH="$HOME/.local/bin:$PATH"` to `~/.zshrc` (macOS) or `~/.profile` (Linux).
:::

::::

## Check that it works

Open a **new** terminal window: a terminal that was open before does not know the new `PATH` yet. Then ask `lip` for its version:

```shell
lip -v
```

You should see a version number, such as `0.44.0`. If the terminal says it does not know `lip`, close it and open a new one.

## Update

```shell
lip self-update
```

`lip` installs the latest release the way it was installed: with the installer on Windows, in place otherwise. `lip self-update --check` only says whether there is a newer release. See [`lip self-update`](reference/commands/self_update.md).

## Other versions

Every release, with the files of each system, is on the [releases page](https://github.com/LiteLDev/lip/releases). To install one of them, download its file there, or pass `LIP_VERSION` to the install script. `lip` has no beta channel at present; when a release is marked "Pre-release" there, `lip self-update` offers it only to a `lip` that is itself a pre-release.

## Next steps

- [Your first server](https://levimc.org/tutorials/server/first-server/): from an empty folder to a running server with LeviLamina, in the interface of `lip`.
- [A server from the command line](https://levimc.org/tutorials/server/command-line/): the same with `lip setup`, `lip install` and `lip run`.
- [A tour of the interface](interface/tour.md) and [managing packages](guides/managing_packages.md).
