# Your first server

At the end of this tutorial you have a Minecraft Bedrock Dedicated Server (BDS) with LeviLamina, the loader that runs mods, in a folder of its own on your computer. You install it, start it, send it a command and stop it, all in the interface of `lip`, the LeviMC package installer. You type no command but `lip` itself.

It takes about ten minutes, most of it waiting for downloads.

## What you need

- A computer with one of these systems:
  - Windows 10, Windows 11 or Windows Server 2019 or later, on x64 or arm64.
  - macOS, on Apple silicon or Intel.
  - Linux on x64.

  On macOS and Linux, `lip` runs the Windows server through Wine, which it installs by itself.
- A terminal: Windows Terminal or PowerShell on Windows, Terminal on macOS, the terminal of your desktop on Linux. It should be at least 80 columns wide.
- An internet connection. `lip` downloads the game from minecraft.net, and LeviLamina from GitHub.

You do not need to install anything else first: no .NET, no Git, no Visual C++ runtime, no Wine. `lip` installs what the server needs.

## 1. Install lip

Pick your system. The page has picked the one you are browsing from.

::: tabs

== Windows

Open the [latest release of lip](https://github.com/LiteLDev/lip/releases/latest), download `lip-<version>-win-x64.msi` (`lip-<version>-win-arm64.msi` on a PC with an ARM processor) and run it. It installs `lip` for you and adds it to your `PATH`.

== macOS / Linux

Open a terminal (on a Mac: **Terminal**, in **Applications** › **Utilities**) and run:

```shell
curl -fsSL https://levimc.org/lip/install.sh | sh
```

The script puts `lip` in `~/.local/bin` without an administrator password or root. When that folder is not on your `PATH` yet, it asks whether to add it: answer yes.

On a Mac with Apple silicon, `lip` asks to install Rosetta 2 the first time it sets up or starts a server. Installing it accepts Apple's license for Rosetta 2.

:::

Then open a **new** terminal window (a terminal that was open before does not know the new `PATH` yet) and ask `lip` for its version:

```shell
lip -v
```

You should see a version number, such as `0.44.0`. If the terminal says it does not know `lip`, close it and open a new one.

Installing from the archive by hand, another version, or an installer that fails: see [Install lip](https://levimc.org/lip/install.html).

## 2. Start lip

1. Make a folder to keep your servers in, go into it, and start `lip`. This tutorial uses `D:\servers`:

   ::: code-group

   ```powershell [Windows]
   mkdir D:\servers
   cd D:\servers
   lip
   ```

   ```shell [Linux and macOS]
   mkdir -p ~/servers
   cd ~/servers
   lip
   ```

   :::

2. You should see the **Home** page of `lip`. The top bar names the folder that `lip` works in, `D:\servers`. At the left is the sidebar with the pages of `lip`; at the right, an overview that says the folder holds no game yet, and four **Next steps**. Step 1, **Choose a workspace**, already has a tick: `lip` works in the folder that you started it in.

   ![The Home page of lip in the empty folder D:\servers. The sidebar lists eight pages; the overview says that no game is installed; step 1, "Choose a workspace", has a tick.](https://levimc.org/lip/screenshots/en/first-server-01-home.svg)

   You need only a few keys: `↑` and `↓` move, `Enter` opens or confirms, `Esc` goes back. The bottom line always lists the keys that work right now.

::: details lip says "GitHub unreachable"
LeviLamina comes from GitHub. If `lip` cannot reach it, it asks what to do. Choose **Use a proxy** if you have the address of a GitHub proxy, **Connect directly** if your network does reach GitHub after all, or **Later** to be asked again next time. Without a way to GitHub, `lip` cannot download LeviLamina. You can change the answer on the **Settings** page.
:::

## 3. Create the server

1. Each server needs a folder of its own, so make one first. Press `↑` to select **Choose a workspace**, and `Enter`. The **Workspaces** list opens: it holds `D:\servers`, marked with a **●** as the folder that `lip` works in.
2. Press `Tab` to move to **Add folder…**, and `Enter`.

   ![The Workspaces list over the Home page: the row "Add folder…", then D:\servers with a dot.](https://levimc.org/lip/screenshots/en/first-server-02-where.svg)

3. The folder browser opens at `D:\servers`. Press `Tab` to reach the buttons, `→` to reach **New folder…**, and `Enter`. Type `survival` and press `Enter`. `lip` creates `D:\servers\survival` and opens it.

   ![The folder browser "Add folder" at D:\servers, which holds only "..". Below are the buttons "Select this folder", "New folder…" and "Cancel".](https://levimc.org/lip/screenshots/en/first-server-03-folder.svg)

4. Press `←` to reach **Select this folder**, and `Enter`. `lip` adds the folder to the list and works in it from now on: you are back on **Home**, the top bar names `D:\servers\survival`, and **Set up the server** is selected.

   ![The Home page in D:\servers\survival: the top bar names the folder, the overview says that no game is installed, and step 2, "Set up the server", is selected.](https://levimc.org/lip/screenshots/en/first-server-04-home-folder.svg)

5. Press `Enter`. The **Server** page opens and asks for the **Game version**. The newest version is at the top. Select the newest one marked **LeviLamina ✓** (versions marked **No LeviLamina** cannot run mods) and press `Enter`.

   ![The dialog "Game version" over the Server page lists eight versions; most are marked "LeviLamina ✓". The first, 1.26.60, is selected.](https://levimc.org/lip/screenshots/en/first-server-05-game-version.svg)

   On Linux, `lip` then asks for the **Build** of a version that also has a Linux server: choose **windows**, the one that runs LeviLamina.

6. Choose the **Loader**: keep the newest LeviLamina and press `Enter`.
7. `lip` shows its plan before it changes anything: lines starting with `Dry run:` say that it would install the game (`bds`) and LeviLamina. Press `Enter` on **Apply**.

   ![The dialog "Set up server" with three "Dry run:" lines and the buttons "Apply" and "Cancel".](https://levimc.org/lip/screenshots/en/first-server-07-plan.svg)

8. Read the Minecraft End User License Agreement and the Microsoft Privacy Policy at the addresses shown. To accept them, press `Enter` on **Accept**. If you decline, nothing is installed.
9. Wait while `lip` downloads and installs. The first time, it may also install the Microsoft Visual C++ Redistributable (Windows asks you to allow it), or Wine on Linux and macOS.
10. You should see **✓ Done.** Press `Enter` on **OK**. The **Server** page now says **○ Stopped**: the server is set up, and its **Start** button starts it.

    ![The Server page after the setup: "○ Stopped", the button "Start", the box "Auto restart", the button "Change versions…", and no output yet. The top bar names D:\servers\survival.](https://levimc.org/lip/screenshots/en/first-server-11-workspace.svg)

## 4. Start the server

1. Go back to **Home**: press `Esc` to move to the sidebar, `↑` to **Home**, and `Enter`. The overview now names the game and LeviLamina, and **Set up the server** has a tick.

   ![The Home page in D:\servers\survival: the game 1.26.60 and LeviLamina 26.60.3 are installed; steps 1 and 2 have a tick, and step 3, "Install mods", is selected.](https://levimc.org/lip/screenshots/en/first-server-12-home-server.svg)

2. **Install mods** is selected. Skip it for now: press `↓` to select **Start the server**, then `Enter`.
3. `lip` starts the server and shows the **Server** page. Wait for the line `Server started.` in the output. The lines marked `[LeviLamina]` show that the loader is running.

   ![The Server page while the server runs. The output shows LeviLamina loading, the ports 19132 and 19133, and "Server started.". Below it is the input line.](https://levimc.org/lip/screenshots/en/first-server-21-running.svg)

   On Windows, the firewall may ask whether to allow the server on your network. Allow it on private networks if you want other devices to join; see [Let friends join your server](let-friends-join.md).

4. Send the server a command: type `list` in the input line at the bottom and press `Enter`. You should see the answer `There are 0/10 players online:`. Server commands are typed here without the leading `/`.

To play on it from Minecraft on the same PC, add a server with the address `127.0.0.1` and the port `19132`.

## 5. Stop the server

1. Press `Ctrl+C` on the Server page. `lip` sends the server its `stop` command and waits until the world is saved.
2. You should see **Exited with code 0** in the first line: the server ended normally. The **Start** button starts it again.
3. To leave `lip`, press `Esc` until you are in the sidebar, `Esc` once more, and confirm **Quit**.

Next time, start `lip` in `D:\servers\survival`. Started in another folder, `lip` still knows your server: on **Home**, press `Enter` on **Choose a workspace**, then `Enter` on `D:\servers\survival` in the list, and choose **Switch**.

## What you have now

- The folder `D:\servers\survival`, which holds the game and LeviLamina. It is an ordinary folder: you can back it up or move it.
- A server you start and stop on the **Server** page of `lip`.

::: warning Stop the server before you change it
While the server runs, `lip` does not install, update or remove anything in its folder, and does not save `server.properties`, the allowlist or the permissions.
:::

## Next steps

- Add mods to the server: [Install mods on your server](install-mods.md).
- Let other players connect: [Let friends join your server](let-friends-join.md).
- Do the same with commands, for scripts and remote machines: [A server from the command line](command-line.md).
- Change the server name, game mode or number of players: [Game Config](https://levimc.org/lip/interface/game_config.html).
- Restart the server by itself after a crash: [Server](https://levimc.org/lip/interface/server.html).
- Add a second server: [Workspaces](https://levimc.org/lip/interface/workspaces.html). Change the game or LeviLamina version: **Change versions…** on the [Server](https://levimc.org/lip/interface/server.html) page.
- Learn every page of the interface: [A tour of the interface](https://levimc.org/lip/interface/tour.html).
- How `lip` runs the Windows server on Linux and macOS: [Linux and macOS](https://levimc.org/lip/guides/linux_macos.html).
- Something went wrong: [lip troubleshooting](https://levimc.org/lip/guides/troubleshooting.html) and [LeviLamina troubleshooting](https://levimc.org/faq/server/levilamina/errors/).
