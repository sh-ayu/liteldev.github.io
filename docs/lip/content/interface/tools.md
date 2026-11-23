# Develop Tools

After this page you can use the two tools of the interface for people who make packages: create and edit a `lip.toml` in a form that checks it as you type, and migrate an old `tooth.json`.

If you only run a server, you do not need this page. To learn what a package is and how to publish one, read [Publish your mod with lip](https://levimc.org/tutorials/develop/publish-a-package/).

## The page

The tools work in the selected workspace. To work on a mod of yours, start `lip` in the folder of the mod, or choose that folder in the [workspace picker](workspaces.md), which opens from the top line.

Open the page: in the sidebar, move to **Develop Tools** and press `Enter`.

![The Develop Tools page in the folder D:\projects\WelcomeMod: two actions, of which "Migrate tooth.json" is dimmed, one sentence about the selected one, and below it the workspace and whether it has a lip.toml and a tooth.json, both "None".](/screenshots/en/tools-05-status.svg)

1. What the selected action does. Move with `↑` and `↓`; `Enter` carries the action out.
2. The selected workspace: the folder that the actions work in.
3. Whether that folder has a `lip.toml` and a `tooth.json`: **Found** or **None**. lip looks again every two seconds, so the lines follow what you do outside lip.
4. A dimmed action: one that cannot work in this folder as it is. See [Dimmed actions](#dimmed-actions).

| Action | Does | On the command line |
| --- | --- | --- |
| **Create lip.toml** | Opens a form that writes the package file of a new package. When the folder has a `lip.toml`, the action is **Edit lip.toml**, and the form edits that file. | [`lip pkg init`](../reference/commands/pkg_init.md) creates one, without the form |
| **Migrate tooth.json** | Converts the package file of lip 0.x to a `lip.toml`. | [`lip pkg migrate`](../reference/commands/pkg_migrate.md) |

## Dimmed actions

The two files of the status lines decide whether **Migrate tooth.json** can work. When they rule it out, it is dimmed. When you select it, a line below its sentence says why, and the bottom line of the screen no longer offers `Enter`.

![The action "Migrate tooth.json" is selected and dimmed. Below its sentence the page says "There is no tooth.json here."](/screenshots/en/tools-06-migrate-disabled.svg)

1. The reason.

| Dimmed when | The page says |
| --- | --- |
| The folder has a `lip.toml`. lip does not replace one. | **lip.toml already exists here.** |
| The folder has no `tooth.json`. | **There is no tooth.json here.** |

The first action is never dimmed: it creates a `lip.toml` or edits the one there is. Whether a server runs makes no difference to this page: neither action changes a server.

The action comes back as soon as the files allow it, within two seconds of a change that you make outside lip.

## Create lip.toml

1. Move to **Create lip.toml** and press `Enter`. The form takes the place of the list. Its title is **Create lip.toml**, followed by the path of the file that it writes. It has a row for every key of a `lip.toml`, already filled in for a server on Windows x64, with the version `0.1.0`. Only the package id is missing: the line below the title says **1 value needs fixing.** until you type one.

2. Type the package id: the address of the repository of the package, such as `github.com/owner/repo`.

   ![The form "Create lip.toml" with the path D:\projects\WelcomeMod\lip.toml. At the top: "✓ Every value is valid." The section Package holds "Package id" github.com/steve/WelcomeMod and Version 0.1.0, each marked ✓; the section Information holds Name, Description, "Logo URL" and Tags; the section "Default variant" starts below. At the bottom: the buttons Save and Cancel.](/screenshots/en/tools-07-init-form.svg)

   1. Each value is checked as you type, and marked at its right: `✓` valid, `✗` not valid, `⋯` being checked online. Below the selected row, a line says what the value is; below a value marked `✗`, why it is not valid.
   2. Whether the whole file is valid: **Every value is valid.**, or how many values need fixing, are being checked online, or could not be confirmed.

   Move between the rows with `↑`, `↓` and `Tab`, and type into the selected one. On a row with more to it, such as an entry of a variant or a list, `Enter` opens a menu: add or remove an entry, an asset, a variant. The section of each variant goes on below the first screen; `PgDn` moves ten rows at a time.

3. Press `Ctrl+S`, or `Enter` on **Save** at the bottom. lip asks before it writes anything. While a value is marked `✗`, it writes nothing: it says **Fix the values marked ✗ first.** and moves to the first such value.

   ![The dialog "Save lip.toml". Under Changes, "A new lip.toml is written:" and five lines that start with +: format = 4, the id, the version 0.1.0, side "server" and platform "win-x64". Under "Expected installation": "As the Marketplace tells, for a server with these versions. lip install decides.", BDS ‹ 1.26.60 ›, LeviLamina ‹ 26.60.3 ›, and "✓ github.com/steve/WelcomeMod  Has an entry for server on win-x64." At the bottom: Save and Cancel.](/screenshots/en/tools-08-init-save.svg)

   - **Changes**: the keys that are written, `+` before a key that is added, `~` before one that changes (with its old and its new value), `-` before one that is removed.
   - **Expected installation**: what would happen if the package were installed on a server with the **BDS** and the **LeviLamina** of the two rows, as the Marketplace tells. Move up to a row with `↑`, and change it with `←` and `→`; a package with more than one variant has a third row, **Variant**. The package and each of its dependencies get a line: `✓` when it would be installed, `✗` and why when it would not. This is a forecast: [`lip install`](../reference/commands/install.md) decides.

   The dialog opens on **Save**: press `Enter` to write the file. `Esc` or **Cancel** goes back to the form.

4. lip writes `lip.toml`, closes the form, and says **Saved lip.toml.** at the bottom of the screen.

The `lip.toml` of this example:

```toml
format = 4
id = "github.com/steve/WelcomeMod"
version = "0.1.0"

[[variants.""]]
side = "server"
platform = "win-x64"
```

`Esc` in the form closes it. When you changed something, lip asks first, in the dialog **Unsaved changes**: **Discard** closes the form without writing, **Cancel** goes back to it. Going to another page asks the same.

[lip.toml](../concepts/lip_toml.md) describes every key.

### Edit lip.toml

Once the folder has a `lip.toml`, the first action is **Edit lip.toml**:

![The Develop Tools page: the first action reads "Edit lip.toml", its sentence says that it "Edits the lip.toml of the workspace in a form that checks every value as you type.", and the status line of lip.toml reads Found. At the bottom right: "Saved lip.toml."](/screenshots/en/tools-09-edit.svg)

1. The folder has a `lip.toml` now: the same form edits it.

`Enter` opens the form on the file, titled **Edit lip.toml**. Saving keeps the keys of the file that the form has no row for. The dialog **Save lip.toml** says whether the comments and the layout of the file are kept too: **Comments and other keys of lip.toml are kept.**, or **lip.toml is rewritten: its other keys are kept, but its comments and layout are not.** When the file changed on the disk after the form opened, lip asks once more before it writes over it: **Overwrite** or **Cancel**.

lip opens no form on a `lip.toml` that is not a TOML file, or in which a key has a value of the wrong type. It says **lip.toml cannot be edited here. Fix it by hand first:** and what is wrong. Fix the file in a text editor, and choose the action again.

### Dependencies

Each entry of a variant has the row **Dependencies**, with **+ Add…** at its end. `Enter` on it offers:

- **Find in Marketplace…**: type a name, an id or a tag to search the mods of the [Marketplace](get_mods.md), and press `Enter` on one;
- **Type a package id…**: any package id, with `#` and a variant for a variant other than the default one.

lip then lists the versions of the package, newest first; when the package has variants, choose one with `←` and `→` above them. Press `Enter` on a version, or on the last row **Without a version: type a range**. lip then offers ranges:

| Range | Allows |
| --- | --- |
| **Patch updates (recommended)** | Every patch version not lower than the chosen one. |
| **Minor updates** | Every version up to the next major version. |
| **This version or newer** | The chosen version and every newer one. |
| **Exactly this version** | Only the chosen version. |
| **Any version** | Whatever version is newest. |
| **Custom** | The range that you type, such as `>=1.2.0 <2.0.0`, `^1.2.0`, `~1.2.0` or `1.*`. |

Below them lip says how many known versions the selected range allows, and the newest of them. `Enter` takes the range.

`Enter` on a dependency of the list offers **Choose version…**, **Version range…**, **Change package id…** and **Remove**. Each dependency is checked online: `✓` with **Found; newest in range:** and a version, `✗` when the package, its variant, or a version in its range cannot be found, and `?` when lip could not check. What the check online finds never keeps you from saving.

## Migrate tooth.json

Packages of lip 0.x describe themselves in a `tooth.json`. This action writes the `lip.toml` that says the same, and deletes the `tooth.json`.

1. Move to **Migrate tooth.json**. It can be chosen when the status lines read `lip.toml` **None** and `tooth.json` **Found**.

   ![The action "Migrate tooth.json" is selected. The status lines read lip.toml None and tooth.json Found.](/screenshots/en/tools-10-migrate.svg)

   1. The status lines that make the action possible.

2. Press `Enter`. When the `tooth.json` lacks something that a `lip.toml` needs, lip asks for it, once for each such value. Here the old file did not say which platform it is for:

   ![A dialog titled "lip asks" asks for "the platforms (RIDs, comma-separated, e.g. win-x64) the variants without a platform apply to", and the field holds win-x64.](/screenshots/en/tools-11-migrate-question.svg)

   Type the answer and press `Enter`. An answer that is not valid is asked for again.

3. lip shows the result. Press `Enter`.

   ![The dialog "Migrate tooth.json" shows a line that starts with a warning sign about preserve_files, and ends with "Migrated tooth.json to lip.toml." and the button OK.](/screenshots/en/tools-12-migrate-result.svg)

   1. A note, marked `⚠`: something that the new file says in another way than the old one, or that it has no place for. Read each note and check that part of `lip.toml`. The notes are in English.
   2. The result: `lip.toml` is written, and `tooth.json` is deleted.

4. The status lines now read the other way round, and the action is dimmed: there is nothing left to migrate. The first action is now **Edit lip.toml**: open the new file in the form to check it.

   ![The first action reads "Edit lip.toml". "Migrate tooth.json" is selected, and the page says "lip.toml already exists here." The status lines read lip.toml Found and tooth.json None.](/screenshots/en/tools-13-migrated.svg)

[Migrating packages](../authors/migrating_packages.md) explains what changes between the two formats.

## When an action fails

The page dims an action only for what the two status lines tell. An action can still fail for another reason, such as a `tooth.json` that is broken, or a folder that was deleted a moment ago. lip then shows a dialog titled with the name of the action and **Failed**, and changes nothing.

![The dialog "Migrate tooth.json · Failed" starts with "error: Cannot read tooth.json", goes on with three lines that start with "caused by:", and names a report file.](/screenshots/en/tools-23-failed.svg)

1. **error:** what went wrong, and often what to do about it. Each line **caused by:** goes one step deeper into the reason; the last one is usually the most exact. Here the `tooth.json` has no `version`. This text comes from the command and is in English.
2. **Full report:** a file with the details, below `.lip/logs` of the workspace. Attach it when you ask for help; see [Troubleshooting](../guides/troubleshooting.md).

Press `Enter` or `Esc` to close the dialog.
