# LeviLamina in Docker

## After deploying with the official LeviLamina docker image, how do I view the logs, enter the server console to type commands (can I use `docker exec`?), and find the server data? Is it normal that nothing is printed after `attach`?

Run `docker ps` (or `podman ps`) to find the container name or ID. Use `docker logs -f <container name>` to view the logs, and `docker attach <container name>` to connect to the server console and type commands (without a leading `/`). Press `Ctrl+P` then `Ctrl+Q` to detach without stopping the server. The container must be started with `-d -it` (or `stdin_open: true` and `tty: true` in Compose). Because `attach` does not replay earlier logs, seeing no output at first is normal—type a command such as `list` to see the output. `docker exec` opens a new shell inside the container and cannot display or send input to the BDS console (though you can use `docker exec` to run container commands such as `lip`). Server data is stored in the volume (`/data` inside the container); run `docker volume inspect levilamina-server-data` to see its path on the host. Do not also run `bedrock_server_mod.exe` from the volume directly on the host. By default, commands registered by LeviLamina work without enabling cheats.

*Applies to: docker-levilamina-server 0.9.x (wine and windows images)*

## The LeviLamina docker image I pulled or installed is a very old version (the image itself is old, or `VERSION=LATEST` still installs an old LL). What should I do?

1. If the pulled image itself is very old (such as a very early version), you likely used a Docker mirror (accelerator) in mainland China that cached an outdated image. Pull directly from the official source `ghcr.io/liteldev/levilamina-server:latest-wine` (or `latest-windows`), or switch to a properly synced mirror, and run `docker pull` first to update the image if needed.
2. The `VERSION` environment variable (default `LATEST`; accepts values such as `26.60.7`, without a `v` prefix) takes effect only on the first start, when the volume does not yet contain `bedrock_server_mod.exe`. Once a server is installed in the volume, changing `VERSION` or switching to a newer image will not reinstall LL. To upgrade LeviLamina in an existing server, run `lip setup` inside the container and specify both the game version and the LL version—for example, `docker exec -it <container name> lip setup --game <game version supported by that LL version> --loader levilamina@<LL version> --accept-eula` (pass `--dry-run` first to preview the changes)—then restart the container (`docker stop -t 60`, then `docker start`). Note that `lip update` cannot update the game or LeviLamina; it will refuse and tell you to use `lip setup`. Alternatively, create a new volume and deploy again.
3. LeviLamina itself is located in `mods/LeviLamina`. When migrating an old server, do not copy the old LeviLamina directory over the new one; copy only your data (such as `worlds`, `allowlist.json`, and `server.properties`) and your other mods.

Tutorial: <https://levimc.org/tutorials/server/docker/>

*Applies to: docker-levilamina-server 0.9.x (lip v0.41+)*

## Is there a docker deployment for LeviLamina servers? Can I mount data? What if the image has no Python runtime?

Official images are available at `ghcr.io/liteldev/levilamina-server:latest-wine` (Linux container) and `:latest-windows` (Windows container). The server, worlds, and settings are all stored in `/data` (`C:\data` on Windows), which you can mount using a named volume or a bind mount. The official LeviLamina image does not include Python. To run LeviStone/Endstone Python plugins, use the official `ghcr.io/liteldev/levistone-server` image instead, which has Python and LeviStone built in. For other use cases, you can build a custom image on top of the official one with `docker build`: on the Windows image, install Python directly in servercore; on the Linux (Wine) image, BDS runs inside a Wine environment installed by lip, so you must install Python into that Wine prefix (`/data/.lip/wine`) rather than with `apt install python3`. See docker-levistone-server for a reference implementation.

*Applies to: docker-levilamina-server 0.9.x; docker-levistone-server 0.3.x*

## Can I use nanoserver as the base image when running LeviLamina/BDS in a Windows container? What if the VC runtime cannot be installed on nanoserver?

nanoserver lacks many required components, so the VC runtime cannot be installed and BDS/LeviLamina cannot run on it. Use the servercore base image instead (the official Windows image uses `mcr.microsoft.com/windows/servercore:ltsc2022`). In servercore, you can install the VC runtime silently with `vc_redist.x64.exe /install /quiet /norestart`. The only way to reduce the image size is to strip components from servercore one by one.

*Applies to: Windows containers, all current versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## When deploying LeviLamina with docker, where are the server files and config files (`server.properties` and so on)?

They are all in the container's `/data` directory (`C:\data` on the Windows image), including `bedrock_server_mod.exe`, `server.properties`, `worlds`, and `mods`. This directory maps to the mounted volume (`levilamina-server-data` by default). On the host, run `docker volume inspect levilamina-server-data` to find the volume's actual path, or use a bind mount (`-v /host/directory:/data`) to access the files directly.

*Applies to: docker-levilamina-server, all current versions*

## How do I install LeviLamina on a Linux panel host (such as the Pterodactyl panel)?

The panel (or hosting provider) must support running the Windows build of BDS under Wine. You can model your setup on the official Docker image at <https://github.com/LiteLDev/docker-levilamina-server>: on Linux, the native lip binary installs LeviLamina with `lip install --accept-eula github.com/LiteLDev/LeviLamina` and starts the server with `lip run`, using its own bundled Wine.

*Applies to: all current versions, x64 Linux*

## On Linux, with the LeviLamina docker image, `pip install levistone --target ...` fails with `No matching distribution found for levistone`. How do I use LeviStone in docker?

The official LeviLamina image (`levilamina-server`) does not include Python, and running the Linux pip on the host or inside the container will not work because LeviStone must be installed into the Windows build of Python inside the Wine environment that runs the server. Use the official LeviStone image instead:

```shell
docker run -d -it --name levistone -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levistone-server-data:/data ghcr.io/liteldev/levistone-server:latest-wine
```

This image installs Python into the Wine prefix and uses pip to install LeviStone into `mods/EndstoneRuntime`. Place Endstone plugins in the volume's `plugins/` directory. You can specify the version with `LEVISTONE_VERSION` (which must match the LeviLamina version) and configure a PyPI mirror with `PYPI_MIRROR_URL`.

*Applies to: docker-levistone-server 0.3.x and later*

## LeviStone cannot be installed on a panel host or in a Wine environment. Is there another way to run LeviStone on Linux?

Use the official LeviStone Docker image, `ghcr.io/liteldev/levistone-server:latest-wine` (<https://github.com/LiteLDev/docker-levistone-server>). On first start, it automatically installs Wine, the VC runtime, the game, LeviLamina, Python, and LeviStone. In mainland China, you can speed up downloads with `GITHUB_MIRROR_URL`, `PYPI_MIRROR_URL`, and `ghcr.nju.edu.cn`.

*Applies to: docker-levistone-server, current version*

## I run a LeviLamina server on Linux (for example with MCSManager), and the mods (plugins) are not loaded after startup. What should I do?

LeviLamina is only available for Windows. On Linux, you must run the Windows server (`bedrock_server_mod.exe`) under Wine; running the Linux build of BDS directly will not load LeviLamina or any mods. The simplest approach is to run the official Docker image, `ghcr.io/liteldev/levilamina-server:latest-wine` (<https://github.com/LiteLDev/docker-levilamina-server>):

```shell
docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
```

On the container's first start, lip automatically installs Wine, the VC++ runtime, the game, and LeviLamina, so the host does not need Wine installed. Alternatively, on x64 Linux you can skip Docker and run the server directly with the Linux build of lip, which uses its own bundled Wine to run the Windows server. In mainland China, GitHub downloads may be slow or time out; pass `-e GITHUB_MIRROR_URL=<GitHub mirror address>` to use a mirror, and use a proxy or mirror if needed when pulling the ghcr.io image.

*Applies to: all current versions (docker-levilamina-server 0.9.x / lip v0.41+)*

## How do I install mods such as LSE in the official LeviLamina docker container? Why does LeviLamina show English in the container?

The official image includes lip. To install a mod on an existing server, use `docker exec` to run lip inside the running container:

```shell
docker exec -it levilamina lip install github.com/LiteLDev/LegacyScriptEngine#quickjs
```

The available variants are `#lua`, `#quickjs`, `#nodejs`, and `#python`. After installation, restart the container (`docker stop -t 60 levilamina && docker start levilamina`) to load the mod. When setting up a new server, you can also install packages on first start using the `PACKAGES` environment variable.

LeviLamina displays in English because `"language"` in `mods/LeviLamina/config/Config.json` defaults to `"system"`, which follows the container's system locale, and the container is not set to Chinese by default. On the Wine image, either pass `-e LANG=zh_CN.UTF-8` to the container (and set `LC_ALL` if needed), or set `language` in `Config.json` to `"zh_CN"` (`"zh-CN"` also works) and restart.

*Applies to: docker-levilamina-server 0.9.x; LeviLamina current version; LSE current version*

## Is Docker a good way to deploy a LeviLamina server? Can it run in a Windows container?

There are two official images: `ghcr.io/liteldev/levilamina-server:latest-wine` (a Linux container where lip runs natively and uses its bundled Wine to run the Windows server) and `ghcr.io/liteldev/levilamina-server:latest-windows` (a Windows container). The Windows image is based on `mcr.microsoft.com/windows/servercore:ltsc2022` and can run LeviLamina. If you build your own Windows image, use servercore as the base image as well; nanoserver is generally not suitable for running a full server. For the Windows image, mount the volume at `C:\data`. Whether to use Docker is a matter of preference: on a Windows host, running the server directly (with a panel and auto-start on boot) is usually simpler; on a Linux host, the official wine image is recommended. Note that you use `docker attach` to access the console, and the container must be run with `-it`.

*Applies to: docker-levilamina-server 0.9.x*

## How should I configure the start command and the container when building a LeviLamina server with the MCSManager panel (Docker image mode)?

Set the image to `ghcr.io/liteldev/levilamina-server:latest-wine`, leave the start command empty (so the image's own entrypoint is used), and set the container mount directory to `/data`. Map port `19132:19132/udp` (the official example also maps `19132:19132/tcp`), and enable an interactive console (`-it`). Environment variables:

- `EULA=TRUE` (must be uppercase `TRUE`; the entrypoint is case-sensitive, and `true` causes it to exit immediately)
- `LANG=zh_CN.UTF-8` (optional, Chinese locale)
- `WINEDEBUG=-all` (if unset, lip defaults this to `-all` when running the server, so you can omit it)
- Optional: `VERSION`, `PACKAGES`, `GITHUB_MIRROR_URL`, `TZ`

If crash-log errors appear at startup, set `modules.crashLogger.enabled` to `false` in `mods/LeviLamina/config/Config.json` to troubleshoot.

*Applies to: docker-levilamina-server 0.9.x; LeviLamina current version*

## After running `ghcr.io/liteldev/levilamina-server:latest-wine` with docker, the client reports a version mismatch and cannot join. Which MC version do I need?

The game (BDS) version in the image is determined by the installed LeviLamina version (set via the `VERSION` environment variable, where the default `LATEST` installs the newest LeviLamina). Because it takes time for LeviLamina to support a new MC release, the server version often lags behind the latest client. Either use a client version that matches the BDS version supported by your LeviLamina version (check the LeviLamina release notes for the corresponding game version), or wait until LeviLamina supports the new version and redeploy. Some third-party mods also allow newer clients to join, though they are not officially supported by LiteLDev.

## When running the server with the official LeviLamina docker image, Chinese text in the console (such as in the MCSManager panel) is garbled. How do I fix it?

First, pass the `LANG=zh_CN.UTF-8` locale environment variable to the container (and set `LC_ALL=zh_CN.UTF-8` as well if needed). The wine image already includes all locales (`locales-all`), and Wine converts the output encoding to match that locale. Next, verify that the terminal/output encoding of the panel (MCSM) instance is set to UTF-8. If the text is still garbled, you can work around the issue by temporarily setting LeviLamina's `language` to English, though mods that output only Chinese may still appear garbled.

*Applies to: docker-levilamina-server wine image (includes locales-all since 0.7.1). Not confirmed against the source code or the documentation: treat it as a pointer.*

## With the `ghcr.io/liteldev/levilamina-server` image, how do I specify the LeviLamina version, use a mirror for faster downloads, and preinstall mods?

Set the following environment variables:

- `EULA=TRUE` (required, uppercase)
- `VERSION`: the LeviLamina version to install, such as `26.60.7`; defaults to `LATEST` (the newest version) and determines the game version
- `GITHUB_MIRROR_URL`: the GitHub mirror for downloads (lip's `github_proxy`), such as `https://v4.gh-proxy.org/https://github.com/`
- `PACKAGES`: space-separated list of packages for lip to install on first start
- Also available: `TZ`, `LANG`/`LC_ALL`, and `WINEDEBUG` (wine image only, defaults to `-all`)

Example:

```shell
docker run -d -it --name levilamina -e EULA=TRUE -e VERSION=26.60.7 -e PACKAGES="github.com/LiteLDev/LeviOptimize" -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
```

Note that `VERSION` and `PACKAGES` take effect only on the initial installation (when the volume does not yet contain `bedrock_server_mod.exe`). To install additional mods later, run `docker exec -it levilamina lip install <package>`.

*Applies to: docker-levilamina-server 0.8.8 and later (currently 0.9.1)*
