# Workspaces

After this page you can keep several servers side by side: switch between them, add a folder that holds a server or a new folder for one, and take a folder off the list. The workspaces are chosen in the **workspace picker**, which opens from the top line of the interface.

## What a workspace is

A **workspace** is a folder that holds one server: the game, LeviLamina, the mods, the worlds, and lip's own records in `.lip/`. Every page of the interface works on one workspace at a time, the **selected workspace**. The top line names it.

lip keeps a list of the workspaces that you used. When you start `lip`, the folder you started it in is added to the list, if it is not there yet, and selected. The list is kept between runs.

Choosing a workspace installs nothing in it. The [Server](server.md) page sets up the server of the selected workspace, and changes its game or loader version later.

## Open the workspace picker

The workspace in the top line can take the focus, like a page of the sidebar:

1. Press `Esc` until the focus is in the sidebar.
2. On **Home**, the first page, press `↑`. The workspace in the top line is highlighted. (`↓` on **Settings**, the last page, gets there too.)
3. Press `Enter`.

Step 1, **Choose a workspace**, of the [Home](home.md) page opens the picker too. `Esc` or `Tab` in the top line goes back to the sidebar.

![The workspace picker above the Home page: the row "Add folder…", then three folders. The first has a dot, and the last is marked "missing".](/screenshots/en/workspaces-01-list.svg)

1. **Add folder…** adds a folder to the list: one that exists, or a new one that it creates.
2. The selected workspace, marked with `●`. Every page works on it.
3. A workspace whose folder no longer exists, marked **missing**.

The picker opens with the selected workspace highlighted. Move with `↑` and `↓`; `↑` on the first workspace goes to **Add folder…**, and `Tab` goes between the two. The area below the list shows the whole path of the row that has the focus, and one sentence about it. `Esc` closes the picker.

![The picker with the focus on the selected workspace. The second folder is marked "server running" and the third "missing". Below the list are the path of the first folder and "The selected workspace."](/screenshots/en/workspaces-03-marks.svg)

1. `●`: the selected workspace.
2. **server running**: the server of this workspace runs, whoever started it.
3. **missing**: the folder was deleted, moved or renamed. lip can only take it off the list.
4. The whole path, which the list cuts at its start when it is too long, and what the row is.

`Enter` on another workspace opens its actions. Which ones there are depends on the workspace:

| Action | Offered for | Does |
| --- | --- | --- |
| **Switch** | Every workspace but missing ones. | [Selects the workspace](#switch-to-another-workspace). |
| **Remove from list** | Every workspace. | [Takes it off the list](#remove-a-workspace-from-the-list); no file changes. |

`Enter` on the selected workspace closes the picker: there is nothing to do with it here.

## Switch to another workspace

1. Move to the workspace and press `Enter`.

   ![The menu of the folder creative with two rows: "Switch" and "Remove from list".](/screenshots/en/workspaces-02-menu.svg)

2. Press `Enter` on **Switch**. The picker closes.

   ![After switching: the top line names D:\servers\creative, and so does a message at the right of the bottom line. The Home page shows the server of creative.](/screenshots/en/workspaces-09-switched.svg)

   1. The top line names the new workspace. Every page now shows it: its server, its mods, its configuration.
   2. The message goes away after a few seconds.

Switching stops nothing. A server that runs in the workspace you left keeps running, and the picker marks it **server running**.

When the [Game Config](game_config.md) or the [Mod Config](mod_config.md) page has unsaved changes, lip asks what to do with them before it switches.

## Add a folder

Use this for a server that lip does not list yet, one that you set up with the commands or copied from another computer, or for a new folder in which to set up a server. lip takes any folder, with or without a server in it.

1. Move to **Add folder…** and press `Enter`.

   ![The row "Add folder…" is highlighted. The line below the list says "Adds a folder to the list, or a new one that it creates. The Server page sets it up."](/screenshots/en/workspaces-10-add-row.svg)

2. The folder browser opens in the selected workspace. Go to the folder of the server: `←` goes up one level, `↑` and `↓` move, and `Enter` or `→` opens a folder.

   ![The folder browser, titled "Add folder", shows D:\servers with the folders creative, lobby, skyblock and survival; lobby is selected.](/screenshots/en/workspaces-11-browse.svg)

   1. The folder that the list shows. You can also type or paste a path here.
   2. A folder inside it: `Enter` or `→` opens it.

   For a new server, go to the place where it should be, choose **New folder…** and type a name: lip creates that folder in the one shown, and opens it.

3. When the browser shows the folder you want, press `Tab` to reach the buttons, and `Enter` on **Select this folder**.

   ![The browser shows D:\servers\lobby with its folders behavior_packs, mods, resource_packs and worlds. The button "Select this folder" is marked.](/screenshots/en/workspaces-12-select-folder.svg)

4. lip adds the folder to the end of the list, selects it, and closes the picker.

   ![The Home page of D:\servers\lobby, which the top line names, with the message "Workspace: D:\servers\lobby" at the right of the bottom line.](/screenshots/en/workspaces-13-added.svg)

lip does not look into the folder: any folder that exists can be added. A folder that is on the list already is not added twice; it is selected. [The folder and file browser](tour.md#the-folder-and-file-browser) describes the browser in full.

A folder without a server is now the selected workspace. To install a server in it, go to the [Server](server.md#set-up-the-server) page and choose **Set up server…**.

## Remove a workspace from the list

Removing takes the workspace off the list and nothing more. **No file is deleted**: the server stays on your disk, and you can add its folder again later.

1. Move to the workspace and press `Enter`. For a missing folder, **Remove from list** is the only action.

   ![The menu of the missing folder skyblock with one row, "Remove from list".](/screenshots/en/workspaces-06-menu-missing.svg)

2. Press `Enter` on **Remove from list**. lip asks first.

   ![The dialog of skyblock asks "Remove it from the list? No file is deleted." with the buttons "Remove from list" and "Cancel".](/screenshots/en/workspaces-07-remove.svg)

3. Press `Enter` on **Remove from list** again.

   ![The picker without skyblock. The bottom line ends with "Removed from the list."](/screenshots/en/workspaces-08-removed.svg)

The selected workspace cannot be removed: `Enter` on it only closes the picker. Switch to another workspace first.

## While a server runs

A running server does not keep you from using the picker:

- The picker marks the workspace **server running**, and the details say **Its server is running.**
- **Switch** and **Remove from list** work as usual. Neither stops the server.

![The menu of the folder creative, whose server runs: "Switch" and "Remove from list". The line below the list says "Its server is running."](/screenshots/en/workspaces-05-menu-running.svg)

To stop a server, switch to its workspace and use the [Server](server.md) page. [The interface reference](../reference/interface.md#while-the-server-runs) lists what every page does meanwhile.

## Several interfaces at once

You can open `lip` in several terminals. They share one list, the file `workspaces.json` (see [Files](../reference/files.md)):

- Each interface has its own selected workspace, so two terminals can show two servers.
- A workspace that one interface adds or removes shows up in the others within a few seconds, while their workspace picker is open.
- Changes that several interfaces make at the same time are all kept.
