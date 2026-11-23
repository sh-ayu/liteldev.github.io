# Server

The Server page is where you set up the server of the selected workspace, and its console. After this page you can set up a server, change its game or loader version, start and stop it, read what it writes, send it commands, have it started again after a crash, and you know what happens to it when you quit lip.

If the keys or the parts of the screen are new to you, read [A tour of the interface](./tour.md) first.

## The parts of the page

![The Server page while the server runs. Numbers mark the state line, the output and the input line.](/screenshots/en/server-02-running.svg)

1. **The state line** says whether the server runs. Below it are the **Start** or **Stop** button, the option **Auto restart**, and the button **Change versions…**.
2. **The output** is what the server writes.
3. **The input line** is where you type commands for the server. It is there only while the server runs.

`Tab` goes from one part to the next: the buttons and the option, the output, the input line. `←` and `→` move between the buttons and the option.

## Every state of the server

The state line always shows one of the following.

### No server here yet

A folder without the game has nothing to run. The page offers one button.

![The Server page of an empty folder. It says "No server here yet." and has a button "Set up server…", with the line "Installs a game version and a loader in this workspace." below it.](/screenshots/en/server-03-no-server.svg)

Press `Enter` to set up a server in this workspace. [Set up the server](#set-up-the-server) describes every step.

### Stopped

`○ Stopped` means that the server does not run and has not run since lip started. The output is empty.

![The Server page of a stopped server. The Start button is highlighted, and the output says "No output yet."](/screenshots/en/server-01-stopped.svg)

Press `Enter` on **Start** to start it.

### Running

When you press Start, the state is `● Starting` until the program of the server runs. That is usually a moment. It takes longer when lip first has to prepare the system for the server, such as the Visual C++ runtime on Windows or Wine on Linux and macOS. When that fails, lip shows the failure, and the state is `○ Stopped` again.

Then the state is `● Running`. The server counts as running from the moment its program runs, while it still loads its world and its mods.

![The Server page right after Start. The state says "Running · 00:00:00", the button is now Stop, the output has one gray line, and the input line has appeared.](/screenshots/en/server-05-just-started.svg)

1. `● Running`, followed by how long the server has been running, as hours, minutes and seconds.
2. The button is now **Stop**.
3. Gray lines between dashes are written by lip itself, not by the server.
4. The input line appears, and the focus moves into it.

The top line of lip shows `● Running` too, and the Server entry of the sidebar gets a `●`. You can go to other pages; the server keeps running.

The server is ready for players when it writes `Server started.` in its output.

::: info
If the server cannot be started at all, for example because a file of the game is missing, lip shows a failure dialog and the state stays "Stopped". See [When something fails](./tour.md#when-something-fails).
:::

### Stopping

After you ask the server to stop, the state is `● Stopping` until the server has ended. A server usually needs a few seconds to save its world.

![The Server page after Ctrl+C. The state says "Stopping", and the output has the gray line "asking the server to stop".](/screenshots/en/server-08-stopping.svg)

1. lip has asked the server to stop, and waits for it.
2. lip sent the server the command `stop`.

The Stop button is gray meanwhile: asking twice does nothing more.

### Exited with a code

When the server has ended, the state is `○ Exited with code` and a number. The code `0` means that the server ended normally. Any other code means that something went wrong.

![The Server page of a server that has ended. The state says "Exited with code 0", the button is Start again, and the output is still there.](/screenshots/en/server-09-exited.svg)

1. The server is not running.
2. **Start** starts it again.
3. The output stays, so you can read why the server ended.

### Restarting

When the server ends with a code other than `0`, you did not ask it to stop, and **Auto restart** is on, lip starts it again after 5 seconds. Meanwhile the state is `● Restarting`, followed by the code that the server ended with.

![The Server page after a crash. The state says "Restarting · Exited with code -1073741819", Auto restart is checked, and a yellow line of lip says that it restarts the server in 5 seconds.](/screenshots/en/server-11-restarting.svg)

1. lip waits, then starts the server again.
2. How the server ended.
3. Auto restart is on.

Press `Ctrl+C` or **Stop** while lip waits, and the server is not started again.

### Running outside this interface

A server can also be started with the plain command `lip run` in another terminal. lip then knows that the server runs, and no more.

![The Server page says "Running outside this interface". Below the button, a line says "Another `lip run` started it. Stop it there."](/screenshots/en/server-10-elsewhere.svg)

1. The server runs, but this interface did not start it.
2. **Start** does nothing here, and there is no Stop.
3. Stop the server where it was started.

There is no output and no input line, because they belong to the terminal that started the server. Everything else that depends on a running server still holds: mods cannot be changed until it has stopped.

## Set up the server

**Set up server…** installs a server in the selected workspace: the game and, for a server with mods, LeviLamina. It asks a few questions, one dialog after the other, and then installs. `Esc` goes back one step; in the first step it closes the dialogs, and nothing has changed.

Step 2 of the [Home](home.md) page starts the same. [Your first server](https://levimc.org/tutorials/server/first-server/) walks through it once from start to end; this section describes every choice.

### Where the server goes

The server goes into the selected workspace, the folder that the top line names.

![The Server page of a folder without a server. The button "Set up server…" is marked, and the line below it says "Installs a game version and a loader in this workspace."](/screenshots/en/new-server-01-where.svg)

1. The server goes into the selected workspace, which the top line names.

To set up a server in another folder, select that folder first in the [workspace picker](workspaces.md): an existing one, or a new one that **Add folder…** creates. Then come back to this page and press `Enter` on **Set up server…**.

### Step 1: the game version

lip reads the versions of the game that can be downloaded, which takes a moment, and lists them: the releases, newest first, then the previews, marked **preview**.

![The dialog "Game version" lists 1.26.60 down to 1.21.130. Most rows show "LeviLamina ✓"; the first is marked "newest".](/screenshots/en/new-server-04-game-version.svg)

The column after the version says whether mods can work on it:

![The same list with the row 1.26.30 selected, which shows "No LeviLamina". The line below says "Mods need LeviLamina, which this version lacks."](/screenshots/en/new-server-12-no-levilamina.svg)

1. **LeviLamina ✓**: a LeviLamina supports this version. Choose such a version for a server with mods.
2. **No LeviLamina**: no LeviLamina was made for this version. Such a version can only be a plain server.
3. The same in words, for the selected row.

::: info Why the column matters
Mods do not run on the game itself. They need **LeviLamina**, the loader, and each LeviLamina is made for one game version. The newest game is not always supported yet.
:::

lip reads this column from the mod catalogue of levimc.org. When the catalogue does not answer within a few seconds, the list is shown without the column; the loader step still tells you what fits.

Choose a version with `↑` and `↓`, and press `Enter`.

### Step 2: the build (Linux on x64 only)

The game comes in two **builds**: the Windows server and the Linux server. LeviLamina and its mods need the Windows server.

lip asks for the build only where both can run: on Linux on an x64 processor, and for a version that has both. Everywhere else the build is `windows`, and you do not see this step. On Linux, a version that has only one of the two says so in the list of versions:

![The list of game versions on Linux. The row 1.26.30 shows "windows only" after "No LeviLamina".](/screenshots/en/new-server-16-linux-games.svg)

1. A version that has no Linux server: for it, lip does not ask for the build.

![The dialog "Build" with the rows windows and linux. linux is selected, and the line below says "No loader; for Linux on x64 only."](/screenshots/en/new-server-17-build.svg)

1. **windows**: the Windows server, which lip runs through Wine. It is the one that supports LeviLamina and its mods.
2. **linux**: the Linux server. It runs without Wine, has no loader, and cannot run mods. lip skips the loader step.

[Linux and macOS](../guides/linux_macos.md) says more about Wine and the Linux server.

### Step 3: the loader

lip looks for the LeviLamina versions that fit the game version you chose, which may take a moment, and lists them, newest first, followed by **No loader**.

![The dialog "Loader" lists LeviLamina 26.60.3, marked "newest", down to 26.60.0, then "No loader". The line below says "Lets the server run mods."](/screenshots/en/new-server-05-loader.svg)

For a server with mods, press `Enter` on the first row, the newest LeviLamina.

**No loader** installs the game alone: a plain server that cannot run mods.

![The same dialog with "No loader" selected. The line below says "A plain server, without mods."](/screenshots/en/new-server-14-no-loader.svg)

When no LeviLamina fits the game version, the step says so. It is no dead end:

![The dialog "Loader" starts with "No LeviLamina version supports this game version." and has two rows, "No loader" and "Back".](/screenshots/en/new-server-13-no-loader-fits.svg)

1. **No loader** goes on with a plain server.
2. **Back** returns to the game versions, where you can choose one with **LeviLamina ✓**. `Esc` does the same.

### Step 4: the plan

lip shows what it would install, without installing anything yet.

![The dialog "Set up server" lists three lines that start with "Dry run:" and has the buttons Apply and Cancel.](/screenshots/en/new-server-06-plan.svg)

The lines are what the command says, in English: here the game, LeviLamina, and that lip will ask you to accept the license.

- **Apply** installs.
- **Cancel** installs nothing. The page still offers **Set up server…**.

### Step 5: the license

The game is Microsoft's. Before lip downloads it, you must accept the Minecraft End User License Agreement and the Microsoft Privacy Policy. Read them at the two addresses shown.

![The dialog "Minecraft EULA" names the two documents, gives their addresses, and has the buttons Accept and Decline.](/screenshots/en/new-server-07-eula.svg)

**Accept** goes on. **Decline** installs nothing:

![The same dialog with the button Decline marked.](/screenshots/en/new-server-15-eula-decline.svg)

The workspace then stays as it was, and the page offers **Set up server…** again.

![The Server page after Decline: "No server here yet." and the button "Set up server…", which is marked.](/screenshots/en/new-server-18-not-set-up.svg)

### Step 6: download and result

lip downloads the game and LeviLamina and installs them. `Esc` cancels; what was done so far is undone.

![The dialog "Set up server" shows two downloads, one at 100% and one at 62%.](/screenshots/en/new-server-08-progress.svg)

When it is done, the dialog lists what was installed and ends with **✓ Done.** Press `Enter`.

![The dialog "Set up server" lists the two packages that were installed and ends with "Done." and the button OK.](/screenshots/en/new-server-09-result.svg)

The page now shows the server, stopped, ready to start.

![The Server page with the state "Stopped", the buttons "Start" and "Change versions…", and the option "Auto restart". Start is marked.](/screenshots/en/new-server-10-workspace.svg)

1. **Change versions…** sets the server up again with other versions.

Press `Enter` on **Start** to start it, or go to the [Marketplace](get_mods.md) first.

::: details The same with a command
The setup carries out [`lip setup`](../reference/commands/setup.md) in the selected workspace with your choices, for example:

```shell
lip setup --game 1.26.60 --loader levilamina@26.60.3
```

With **No loader** it is `--no-loader`, and with the Linux server `--build linux`.
:::

## Change the game or the loader version

To move a server to another game version or another LeviLamina, set it up again with **Change versions…**. The steps are those of [Set up the server](#set-up-the-server), and each starts on what the server has now.

1. Press `→` twice to go from **Start** to **Change versions…**. The line says **Another game or loader.** Press `Enter`.

   ![The Server page of a stopped server. The button "Change versions…" is marked, and the sentence after it says "Another game or loader."](/screenshots/en/workspaces-14-change-button.svg)

2. Choose the game version. The one that the server has is marked **installed**, and selected.

   ![The dialog "Game version" with 1.26.60 selected, which is marked "newest" and "installed".](/screenshots/en/workspaces-14-change-game-version.svg)

3. Choose the loader. The dialog starts on the LeviLamina that the server has, or on **No loader** when it has none.

   ![The dialog "Loader" with LeviLamina 26.60.2 selected, one row below the newest.](/screenshots/en/workspaces-15-change-loader.svg)

4. Read the plan, and choose **Apply**.

   ![The dialog "Set up server" says that lip would uninstall LeviLamina 26.60.3 and install LeviLamina 26.60.2, with the buttons Apply and Cancel.](/screenshots/en/workspaces-16-change-plan.svg)

   1. What lip would remove and install, in the words of the command.
   2. Nothing changes before you choose **Apply**.

While the server runs, **Change versions…** is gray, and moving to it says **Stop the server first.** lip does not change the game under a running server.

::: warning Mods that do not fit the new version
A mod is made for certain LeviLamina versions. When an installed mod has no version for the game or the LeviLamina you chose, the plan names it and says that the setup would uninstall it. Choosing **Apply** then uninstalls those mods. Choose **Cancel** to keep everything as it is.
:::

When you choose the versions that the server has already, there is nothing to do, and the plan has only **Close**:

![The dialog "Set up server" says "Nothing would change." and has one button, Close.](/screenshots/en/plan-02-no-changes.svg)

A change of the game keeps `server.properties`, `allowlist.json`, `permissions.json` and your worlds. It deletes the other files of the old game, and with them the packs that you copied into `behavior_packs/` or `resource_packs/`; [What survives a game change](../reference/files.md#what-survives-a-game-change) has the whole list. Make a copy of the folder first: an older game may not open a world that a newer game saved.

### A server with the Linux build on another system

A workspace that was set up with the Linux server runs only on Linux on x64. On any other system, lip cannot offer that build. It says so before you choose anything, and goes on with the Windows server:

![The dialog "Game version" starts with two lines: "This workspace has the linux build, which does not run on this system. The setup replaces it with the windows build."](/screenshots/en/workspaces-17-linux-build.svg)

1. The notice, shown before you choose anything.

The plan then names the build in its title, **Switch to windows**, and lists the Linux server among what is uninstalled:

![The dialog "Switch to windows" lists that lip would uninstall the Linux game and install the Windows game and LeviLamina.](/screenshots/en/workspaces-18-switch-to-windows.svg)

## Starting and stopping

To start the server, press `Enter` on **Start**. Step 4 of the [Home](./home.md) page does the same.

To stop the server, either:

- press `Ctrl+C` anywhere on the Server page, or
- press `Tab` until **Stop** is highlighted, then `Enter`.

Both send the server the command `stop`, so that it saves the world and ends by itself. lip never kills the server.

::: warning
On every other page, `Ctrl+C` asks whether to quit lip. Only on the Server page, and only while the server runs, does it stop the server.
:::

## Reading the output

While the focus is in the input line, the output follows the server: new lines appear at the bottom.

To read back, press `Esc` in the input line. The focus moves to the output, and its title becomes bright.

![The output has the focus and is scrolled back. Marks at its right edge show that there is more above and below.](/screenshots/en/server-06-output-scrolled.svg)

1. The output has the focus.
2. `▲` and `▼` mean that there are more lines above and below.
3. The keys that scroll.

| Key | Does |
| --- | --- |
| `↑` `↓` | Scroll one line. |
| `PgUp` `PgDn` | Scroll one screenful. |
| `Home` | Goes to the first line. |
| `End` | Goes back to the last line. |

While you read back, the lines stay where they are, even when the server writes more.

To go back to the input line, press `End` and then `↓`, or press `Tab`.

## Sending commands to the server

Type a command of the server in the input line and press `Enter`. The gray `list` in the empty line is an example, not something that is sent.

![The input line holds the text "say Welcome to Survival".](/screenshots/en/server-02-running.svg)

The answer of the server appears in the output.

lip remembers the lines you sent. Press `↑` in the input line to bring back the one before, and `↓` to go forward again. What you were typing is kept and comes back when you press `↓` past the last line.

![The input line shows "list", brought back with the up arrow. The bottom line names the keys "↑↓ History".](/screenshots/en/server-07-history.svg)

These are commands of the Minecraft server, such as `list` or `say`. They are not commands of lip.

### Leaving the input line

While the input line has the focus, the letters you type go to the server, so `Esc` is the way out:

1. `Esc` goes from the input line to the output.
2. `Esc` again goes to the sidebar.

`Tab` also leaves the input line, for the sidebar.

## Auto restart

**Auto restart** says whether lip starts the server again after a crash. Press `→` to move from the button to the option. A sentence at its right says what it does. Press `Space` to switch it.

![The option "Auto restart" is checked and highlighted. At its right is the sentence "Restarts after a crash."](/screenshots/en/server-04-auto-restart.svg)

With the option on:

- A server that ends with a code other than `0` is started again after 5 seconds.
- A server that you stopped, or that ended with the code `0`, is not started again.
- After 5 restarts within 10 minutes, lip gives up and says so in the output. Read the output above that line to find out why the server keeps failing.

The option belongs to the workspace, so each server has its own. The [Settings](./settings.md) page shows the same option.

## Quitting lip while the server runs

When you quit lip while a server runs, the question says what happens to it.

![The question "Quit lip?" with a second line: "Running servers keep running."](/screenshots/en/server-12-quit-keeps-running.svg)

Normally the server **keeps running**. lip runs servers in a background program of its own, the daemon, which stays when the interface closes. You can close the terminal. To come back, open a terminal in the same folder and run `lip`: the Server page shows the server, with its recent output, and you can type commands and stop it as before.

In one rare case, when lip cannot use its daemon and runs everything itself, the question says something else:

![The question "Quit lip?" with a second line: "Running servers stop first."](/screenshots/en/server-13-quit-stops.svg)

If you choose **Quit** then, lip asks each running server to stop, shows the Server page while they end, and quits once they have all ended.

## Managed servers

A server that is started on this page is a managed server: the daemon of lip runs it, and no terminal owns it. That is why it keeps running when you quit, why several terminals can show the same server at once, and why each workspace can have its own server running at the same time. The command `lip run --managed` starts and shows the same servers. [A server from the command line](https://levimc.org/tutorials/server/command-line/) explains them, and how to stop one without the interface.
