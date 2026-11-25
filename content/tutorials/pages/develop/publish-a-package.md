# Publish your mod with lip

At the end of this tutorial your mod has its first release on GitHub, and anyone can install it on their server with one command, `lip install github.com/<you>/my-mod`. You describe the mod in `lip.toml`, let GitHub Actions build the release, check that `lip` sees it, install it on your own server, and get it listed on [LeviMC Mods](https://levimc.org/mods/).

It takes about half an hour, most of it waiting for the release build.

## What you need

- A mod in a public GitHub repository created from the mod template, which builds: [Your first LeviLamina mod](first-levilamina-mod.md). This tutorial calls the repository `github.com/<you>/my-mod`.
- `lip` and a server to test on: [Your first server](../server/first-server.md). This tutorial uses `D:\servers\survival`.
- Git, signed in to GitHub so that you can push.

::: warning The latest lip needed
The **Edit lip.toml** form of the **Develop Tools** page, which this tutorial uses, comes with the first release of lip after 0.41.1. Check with `lip -v`, and install the [latest release of lip](https://github.com/LiteLDev/lip/releases/latest) if needed.
:::

A **package** is anything `lip` can install. Its **package id** is the address of its repository without `https://`: `github.com/<you>/my-mod`. A **version** is a Git tag `v` + the version, such as `v0.1.0`, at which `lip.toml` says the same version. There is no upload step: publishing is pushing that tag.

## 1. Fill in lip.toml

The template comes with a `lip.toml`, the file that tells `lip` what to install. Open it and change these fields. Leave the rest as it is.

```toml
format = 4
id = "github.com/<you>/my-mod"          # the package id: your repository
version = "0.1.0"                       # the version you are about to release, without "v"

[info]                                  # shown on LeviMC Mods and in LeviLauncher; lip ignores it
name = "My Mod"
description = "Says hello."
tags = ["utility"]
logo = "https://avatars.githubusercontent.com/u/<your user id>"
```

Then, in both `[[variants.""]]` entries (one with `side = "server"`, one with `side = "client"`):

- In `deps`, set the range of LeviLamina versions the mod works with. The server entry takes a range such as `"26.60.*"`, matching the version you pinned in `xmake.lua`. Keep the comment and the form of the client range.
- In `urls`, replace `levilamina-mod-template` with the name of **your repository**: the release workflow uploads `<repository>-server-windows-x64.zip` and `<repository>-client-windows-x64.zip`.
- In `place`, replace `my-mod` with the **target name** of `xmake.lua`, in `src` and in `dest`: each ZIP file holds the folder `<target>/`, which goes to `mods/<target>/`.

If your mod is for the server only, delete the whole client entry: the `[[variants.""]]` with `side = "client"` and the `deps` and `assets` below it.

::: tip `{{id}}` and `{{version}}`
Every string in `lip.toml` is a template. `{{version}}` becomes the `version` above, so a new release only needs a new `version`. `{{id}}` becomes the package id.
:::

::: details A repository without lip.toml, or with tooth.json
For a repository that is not from the template, run `lip pkg init` in its root: it asks for the package id and writes a minimal `lip.toml` to fill in as above. Or start `lip` in its root and choose **Create lip.toml** on the **Develop Tools** page: the same form as in step 2, which writes the file when you save it. A `tooth.json` from lip v0.x is converted with `lip pkg migrate`; see [Migrating packages](https://levimc.org/lip/authors/migrating_packages.html).
:::

## 2. Check that lip reads it

1. Start `lip` in the repository folder. The folder becomes the workspace of `lip`, which the top bar names.
2. In the sidebar, open **Develop Tools**, and press `Enter` on **Edit lip.toml**.
3. `lip` shows `lip.toml` in a form that checks every value as you type, and the whole file as `lip` reads it, with the templates filled in. It also looks up your dependencies, such as LeviLamina, online. You should see **✓ Every value is valid.** at the top. A value marked **✗** says what is wrong with it: fix it in the form and save with `Ctrl+S`, or fix it in the file. If the file is not TOML, or a key holds a value of the wrong type, `lip` says **lip.toml cannot be edited here. Fix it by hand first:** and what is wrong.
4. Check that the names in each **URL** match your repository and the ZIP files that the release workflow uploads (step 1).
5. Press `Esc` to close the form.

## 3. Write the changelog

The release workflow copies the newest section of `CHANGELOG.md` into the release notes. Add a section for the version, in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format:

```md
## [0.1.0] - 2026-11-16

### Added

- The `/hello` command.
```

Commit and push everything:

```shell
git add -A
git commit -m "Release 0.1.0"
git push
```

## 4. Create the release

1. On the page of your repository on GitHub, open **Releases** → **Draft a new release**.
2. Under **Choose a tag**, type `v0.1.0` and choose **Create new tag: v0.1.0 on publish**. The target is your default branch, with the commit you just pushed.
3. Give the release a title, such as `0.1.0`, and press **Publish release**.
4. Open the **Actions** tab. A workflow run has started for the release: it builds the server and the client mod, then uploads them. Wait until it has a green tick (a few minutes).
5. Open the release again. You should see two files under **Assets**: `my-mod-server-windows-x64.zip` and `my-mod-client-windows-x64.zip`, and your changelog as the notes.

::: warning The tag must match `version`
The tag is `v` followed by a full [semantic version](https://semver.org/): `v0.1.0`, not `0.1.0` or `v0.1`. At the tag `v0.1.0`, `lip.toml` must say `version = "0.1.0"`, or `lip`, LeviMC Mods and LeviLauncher skip the tag.
:::

## 5. Check that lip sees the version

1. Stop your server. If the mod is still in `mods\my-mod` from the previous tutorial, delete that folder, so that what you test is only what `lip` installs.
2. In the server folder, ask `lip` what it would install, without changing anything:

   ```shell
   cd D:\servers\survival
   lip install github.com/<you>/my-mod --dry-run
   ```

   You should see lines that start with `Dry run:`, one of which would install your mod at version `0.1.0`. If `lip` finds no version, check that the tag and `version` match (step 4).

## 6. Install it like your users will

1. In the server folder, install your package:

   ```shell
   lip install github.com/<you>/my-mod
   lip list
   ```

   `lip list` should show `github.com/<you>/my-mod@0.1.0`.

2. Start the server. You should see `Hello from my first mod!` again, now from the files `lip` downloaded.

Players install the client build of the same package with LeviLauncher, once the mod is listed (step 7): see [Play with mods on Windows](../play/play-with-mods.md).

## 7. Get listed on LeviMC Mods

[LeviMC Mods](https://levimc.org/mods/) is the catalog that `lip`'s **Marketplace** page and LeviLauncher show. It is built from a list of repositories, [`mods/repos.txt`](https://github.com/LiteLDev/liteldev.github.io/blob/main/mods/repos.txt) in the levimc.org repository.

You usually do not need to do anything: every two hours a bot searches GitHub for repositories with a `lip.toml` and a version tag that `lip` can read, and opens a pull request that adds them to the list. Once a maintainer merges it, the mod appears at the next hourly build.

To be listed sooner, open that pull request yourself: edit [`mods/repos.txt`](https://github.com/LiteLDev/liteldev.github.io/blob/main/mods/repos.txt) on GitHub and add a line `<you>/my-mod`.

The catalog lists a package when:

- its latest version depends on LeviLamina, directly or through other packages;
- it places files in `mods/` (or `plugins/`, or where the game loads add-ons from);
- the repository is not a GitHub template and its name does not end in `-template`, `-example`, `-demo`, `-sample` or `-test`.

You should then find your mod at `https://levimc.org/mods/github.com/<you>/my-mod/`, with its name, description, logo, tags and the command to install it.

## Releasing the next version

1. Raise `version` in `lip.toml`, such as `0.2.0`, and add its section to `CHANGELOG.md`. Commit and push.
2. Create the release `v0.2.0` as in step 4.
3. On a server, `lip update github.com/<you>/my-mod` installs it.

## What you have now

- A release of your mod on GitHub, built by GitHub Actions.
- A package that installs with `lip install github.com/<you>/my-mod`, with its dependency on LeviLamina.
- Your mod on LeviMC Mods, once the list includes it.

## Next steps

- Every field of `lip.toml`: dependencies, variants, files to keep or delete, hooks: [lip.toml](https://levimc.org/lip/concepts/lip_toml.html).
- The commands for package authors: [`lip pkg init`](https://levimc.org/lip/reference/commands/pkg_init.html), [`lip pkg migrate`](https://levimc.org/lip/reference/commands/pkg_migrate.html).
- Install a branch or a commit before you release it: [Managing packages](https://levimc.org/lip/guides/managing_packages.html).
- Create and edit `lip.toml`, and migrate a `tooth.json`, in the interface of `lip`: [Develop Tools](https://levimc.org/lip/interface/tools.html).
- How servers install your package: [Install mods on your server](../server/install-mods.md).
