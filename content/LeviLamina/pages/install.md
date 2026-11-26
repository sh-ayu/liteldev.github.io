# Install LeviLamina

LeviLamina is never installed by itself. The tool for the place you use it installs it together with the game version
it is built for: [lip](https://levimc.org/lip/) on a server, [LeviLauncher](https://levimc.org/LeviLauncher/) in the
game on Windows, and xmake in a mod project.

## What you need

- **On a server:** [lip](https://levimc.org/lip/install.html), on Windows, Linux on x64 or macOS. On Linux and macOS
  lip runs the Windows server through Wine, which it sets up itself.
- **In the game:** [LeviLauncher](https://levimc.org/LeviLauncher/install) on Windows 10 or 11, and a licensed copy
  of Minecraft Bedrock Edition. LeviLamina does not run on Android.
- **For a mod:** what [Your first LeviLamina mod](https://levimc.org/tutorials/develop/first-levilamina-mod/) lists:
  Windows, Visual Studio with the C++ tools, and xmake.

Each LeviLamina version works with one game version: see [Supported versions](versions.md).

## Install

### On a server

In an empty folder, run `lip` and set up the server on its **Server** page, which asks for the game version and the
loader, or use the command:

```shell
lip setup --game 1.26.60
```

lip installs the Bedrock Dedicated Server of that version, the newest LeviLamina that supports it, and what
LeviLamina needs. `lip install LeviLamina` does the same with the newest game version LeviLamina supports.

Installing with lip is the supported way. Unpacking a release archive into a server by hand is not: lip also
installs the packages LeviLamina depends on and prepares the server's executable.

### In the game on Windows

In LeviLauncher, open **Download**, pick a game version whose **Loader** column shows LeviLamina, and keep
**Install LeviLamina** on when you install it. From a terminal:

```shell
LeviLauncher.exe install latest --loader
```

### In a mod project

A mod names the LeviLamina it is built against in its `xmake.lua`, and xmake downloads it when you build. The
[mod template](https://github.com/LiteLDev/levilamina-mod-template) has the line already:

```lua
add_requires("levilamina 26.60.*", {configs = {target_type = get_config("target_type")}})
```

## Check that it works

- **Server:** `lip list` shows `github.com/LiteLDev/LeviLamina` with its version, and `lip run` starts the server.
- **Game:** in LeviLauncher, the **Loader** tab of the instance's **Instance Settings** says which LeviLamina is
  installed.

## Update

- **Server:** stop the server, then choose **Change versions…** on the Server page of lip, or run `lip setup` again
  with the game version you want
  ([Change the game or the loader version](https://levimc.org/lip/interface/server.html#change-the-game-or-the-loader-version)).
- **Game:** the **Loader** tab of the instance's **Instance Settings** installs, updates and removes LeviLamina.
  From a terminal: `LeviLauncher.exe loader install`, and `LeviLauncher.exe loader versions` for the list.
- **Mod project:** change the version in `add_requires` and build again.

## Other versions

Every release is on the [releases page](https://github.com/LiteLDev/LeviLamina/releases), and
[Supported versions](versions.md) says which game version each one is for. To get a particular one on a server, name
it: `lip setup --game 1.26.60 --loader levilamina@26.60.3`.

## Next steps

- [Your first server](https://levimc.org/tutorials/server/first-server/): a server with LeviLamina, step by step.
- [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/): LeviLamina and a client mod with
  LeviLauncher.
- [Your first LeviLamina mod](https://levimc.org/tutorials/develop/first-levilamina-mod/): create a mod from the
  template, build it and load it.
