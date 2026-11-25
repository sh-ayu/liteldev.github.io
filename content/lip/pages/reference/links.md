# Install links

This page explains the `lip://` links: what a link holds, what `lip` does when you open one, and how Windows knows that `lip` opens them. With it you can follow an **Install with lip** button on [LeviMC Mods](https://levimc.org/mods/), or put such a link on your own page.

The normative definition is the [lip-uri(7)](https://github.com/LiteLDev/lip/blob/main/protocol/lip-uri.md) page of the protocol.

## The link

```
lip://install/<module path>[?version=<version>][&variant=<variant>]
lip --uri <link>
```

For example, this link installs version 0.26.1 of the variant `headless` of PLand:

```
lip://install/github.com/IceBlcokMC/PLand?version=0.26.1&variant=headless
```

| Part | What it is |
| --- | --- |
| `install` | The only action. Upper and lower case are the same. |
| `<module path>` | The repository of the package, its case kept, such as `github.com/LiteLDev/LegacyMoney`. It is never a URL, a local path or a short name: `lip://install/LeviLamina` is not a link. The host, `github.com`, is in lower case. |
| `version` | The version, a SemVer version without a leading `v`, such as `0.26.1`. Without it, the newest version. A branch, a tag or a commit is not allowed. |
| `variant` | The variant. Without it, the default variant. |

Percent-encoded characters (`%2F`) are decoded; `+` stays `+`. A fragment (`#…`) and any other parameter are ignored. A link is invalid when it is longer than 2048 characters, has a character that a URI may not have, has another action, has `version` or `variant` twice, or has a module path, version or variant that `lip install` would not take.

A link stands for the package argument `<module path>[#<variant>][@<version>]` of [`lip install`](commands/install.md): the link above is `lip install github.com/IceBlcokMC/PLand#headless@0.26.1`.

LeviLauncher reads `levilauncher://` links of the same form; LeviMC Mods shows its **Install with LeviLauncher** button for the mods that run on a client.

## Opening a link

A link only opens the interface. It installs nothing until you confirm, and it does not choose where to install: you do.

`lip --uri <link>` opens the [interface](interface.md), with these differences from `lip` alone:

1. When the link is invalid, or standard input or standard output is not a terminal, `lip` writes a message to standard error and exits with a non-zero code. On Windows, when the console is its own, it waits for a key first, so that you can read the message.
2. The folder `lip` was started in is not added to the workspace list. The last workspace of the list is selected; when the list is empty, none is.
3. Before anything else, the dialog **Install from a link** asks whether to install the package. It shows the package, what the [LeviMC catalogue](../interface/get_mods.md) says of it (**Name**, **Author**, **Version**, **Variant**, **Needs**), and the workspace it would go **Into**, which you can change there.
4. When the catalogue does not list the mod, or cannot be read, the dialog warns you, and the choice that is highlighted at first installs nothing. It warns you too when the catalogue lists no such version. You can still install the package, as `lip install` could.
5. **Install…** carries out `lip install` of the package in the selected workspace: you read the plan and choose **Apply** or **Cancel**, as for every operation of the interface ([Preview, then Apply](../interface/tour.md#preview-then-apply)). When the workspace has no game yet, the interface offers to set up its server instead. When no workspace is selected, **Choose folder…** lets you pick one.
6. When you decline, nothing is installed and the interface goes on.

`--uri` is an option only as the first of exactly two arguments. `lip --uri` exits as the interface does, and with a non-zero code in the cases of step 1.

## Registration on Windows

The Windows Installer package of `lip` (the `.msi`, see [Install lip](../index.md#install-lip)) registers the scheme `lip` when it installs `lip`, for you or for every user, as it installed `lip` itself. It writes these keys below `Software\Classes\lip` of `HKEY_CURRENT_USER` or `HKEY_LOCAL_MACHINE`:

| Key | Value | Data |
| --- | --- | --- |
| `Software\Classes\lip` | (default) | `URL:lip` |
| `Software\Classes\lip` | `URL Protocol` | the empty string |
| `Software\Classes\lip\DefaultIcon` | (default) | `"<directory>lip.exe",0` |
| `Software\Classes\lip\shell\open\command` | (default) | `"<directory>lip.exe" --uri "%1"` |

`<directory>` is the installation directory, with a separator at its end. Windows starts `lip` in a console of its own when you open a link. Uninstalling `lip` removes the keys.

`install.sh`, which installs `lip` on Linux and macOS, registers no scheme: there, run `lip --uri '<link>'` in a terminal, or `lip install` with the package argument.

## When nothing happens

When a browser does nothing for an **Install with lip** button, `lip` is not installed, or was installed without the `.msi`, or is an older version that does not know links. [Install lip](../index.md#install-lip) with the `.msi`, or copy the `lip install` line that the mod's page shows and run it in your server's folder.

## See also

- [Interface](interface.md)
- [Command line](cli.md)
- [lip install](commands/install.md)
- [Marketplace](../interface/get_mods.md)
