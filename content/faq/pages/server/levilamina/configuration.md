# Configuring LeviLamina

## After BDS 26.x switched to the NetherNet protocol, players cannot connect when I use frp (such as Sakura frp) or other tunneling/port forwarding (only TCP 19132 is visible, the UDP port is random, or only 7551 shows up). How do I configure a server with LeviLamina?

Bedrock servers still use UDP; the new default transport is simply NetherNet (similar to WebRTC underneath). In the current version (BDS 26.60.6 and later / LeviLamina 26.60.x), NetherNet by default uses only the single UDP port given by `server-udp-ports` in `server.properties`, so LeviLamina's `singlePort` option is no longer needed and has been removed. Key points:

1. In `server.properties`, `server-port` (TCP+UDP, default 19132) and `server-udp-ports` (UDP, default 19132) control which ports to open. When tunneling or mapping ports, forward both TCP and UDP, and keep the internal and external ports the same.
2. When using frp or another tunnel, write the public address directly into `server-udp-ports` in the format `<public IP>:<external port>:<local port>`, for example:

   ```text
   server-port=11451
   server-udp-ports=203.0.113.4:11451:11451
   ```

3. Also set `"enable"` to `false` under `targeted.netherNetPatch` in `mods/LeviLamina/config/Config.json` to turn off LL's STUN patch. If STUN fails to get the public IP, the client reports the error code `Door`.
4. Port 7551 is for LAN discovery and has nothing to do with internet connections.

You can also switch `transport` in `server.properties` back to RakNet. It then uses only `server-port`, though Mojang may remove RakNet in the future. Official tutorial: <https://levimc.org/tutorials/server/let-friends-join/>

*Applies to: BDS 26.60.6+; LeviLamina 26.60.1 and later*

## With NetherNet, TCP and UDP ports are open and the console shows no errors, but players still cannot join, and opening IP:port in a browser shows a filing (ICP) block page. Can the HTTP service NetherNet uses for signaling run on a different machine from the game UDP, using an overseas node or a tunneling reverse proxy to avoid the unfiled-site block?

A filing block page means the cloud provider is blocking HTTP traffic for an unfiled site. NetherNet uses the TCP (HTTP) part of `server-port` only to broadcast the MOTD and tell clients the server's IP and port, while game data runs over UDP, so the two do not need to be on the same machine. You can either complete ICP filing for the server or domain, or reverse-proxy the HTTP part through an overseas server, an overseas HTTP/HTTPS tunnel, or a networking tool such as easytier, while game UDP traffic still connects directly to the server in mainland China. Be sure to set the server's external address with `server-udp-ports=<public IP>:<external port>:<local port>` in `server.properties` (using a numeric IP). This issue depends on your cloud provider's policy.

*Applies to: BDS 26.51 and later (NetherNet transport). Not confirmed against the source code or the documentation: treat it as a pointer.*

## How is the load order of mods/plugins decided in LeviLamina? A prerequisite plugin always loads after the plugin that depends on it, so loading fails. How do I adjust this?

LeviLamina has no manual load-order setting. Load order is determined by the dependencies declared in each mod's `manifest.json` (using topological sort; mods without dependencies on each other are sorted by name, though you should not rely on that). The proper fix is for the plugin author to declare the dependencies in the manifest. To fix it yourself, add the prerequisite to `dependencies` in the `manifest.json` of the mod that needs to load later:

```json
"dependencies": [ { "name": "prerequisite-mod-name" } ]
```

The field name is lowercase `dependencies`, and you can optionally specify a version requirement such as `"version": "^1.2.3"`.

- The order within the `dependencies` list does not matter; dependencies always load before the mods that require them. If a dependency is missing, has a mismatched version, or fails to load, the dependent mod will not load.
- Current versions of LeviLamina also support `optionalDependencies` (if present and the version matches, the dependency loads first; if missing, this mod still loads) and `loadBefore` (declares that this mod must load before another mod without creating a dependency).
- Plugins written for other loaders (such as the .NET loader or LSE) must declare that loader as a dependency; otherwise they load before it and fail or crash.
- Loader and library mods usually set `"passive": true`, so they load only when another mod depends on them.

Do not work around this by running `ll load <mod>` manually in the console every time, and do not relax the permissions of the `ll` command (which requires Admin permission by default).

*Applies to: LeviLamina 0.x to 26.60.x (`optionalDependencies`/`loadBefore` only in newer versions)*

## Prerequisite library mods such as GMLIB, LRCA (GMLIB-LegacyRemoteCallApi) and iListenAttentively are installed but not loaded and there is no log, or some mod no longer loads automatically. Why? What does `"passive": true` in the manifest mean?

`"passive": true` in `manifest.json` enables passive loading: the mod loads only when another mod declares a dependency on it in its manifest. Library and prerequisite mods usually set this, so it is normal for one not to load when installed on its own with nothing depending on it; this is not an incompatibility.

- Once you install a mod that declares a dependency on it in its manifest, it loads automatically.
- If the plugin that actually uses it (such as some LSE script plugins, or a library that forgot to declare the dependency) does not declare the dependency in its manifest, it does not load, or the load order happens to be wrong and the dependent mod fails (it may work again after you install another plugin that does declare the dependency, but that is just luck). The proper fix is for the user of the library to declare the prerequisite under `dependencies` in its `manifest.json`.
- Temporary workaround: in the prerequisite mod's `manifest.json`, set `passive` to `false` or remove the field so that it loads on its own.
- Note that `passive` has nothing to do with load errors in the plugin itself (such as not being updated for a new BDS version); removing `passive` does not fix those, and you need to wait for the author to update it.

*Applies to: LeviLamina 0.x to 26.60.x*

## After installing LeviLamina, the server console does not show player chat or the commands players run. Do I need a plugin? How do I turn it on?

You do not need an extra plugin. LeviLamina has a built-in `simpleServerLogger` feature, which is off by default (vanilla BDS does not log player chat to the console). Open `mods/LeviLamina/config/Config.json` (older versions use `plugins/LeviLamina/config/Config.json`; the file does not exist right after the first install, so start the server once to generate it), find `simpleServerLogger` under `targeted`, set `"enabled"` to `true`, and keep the sub-items you want set to `true`:

- `"playerChat"`: player chat, output like `[PlayerChat] <player> message`
- `"playerCommand"`: commands run by players, `[PlayerCmd]`
- `"playerPermission"`: player permission changes

Save the file and restart the server for the changes to take effect. In the current v26.60.8, the config path is `mods/LeviLamina/config/Config.json`, and the key is `targeted.simpleServerLogger`.

*Applies to: LeviLamina 0.11 and later*

## On a LeviLamina server, players remain on the server after being kicked or leaving ("ghost players": others see them standing still and shown as online, kick cannot remove them, and the player cannot rejoin). How do I fix this?

This is a side effect of the "force-close the connection on disconnect" item (`DisconnectClientHook`) in LeviLamina's vulnerability fixes. You can turn this item off in LeviLamina's `Config.json`:

```json
"targeted": {
  "vulnerabilityFixes": {
    "enable": true,
    "disconnectClient": false
  }
}
```

The config file is at `<server mod directory>/LeviLamina/config/Config.json` (`mods/LeviLamina/config/Config.json` for installs made with the new lip; `plugins/LeviLamina/config/Config.json` if the server has a `plugins/` directory). Turning off `disconnectClient` alone is enough; you do not need to turn off the whole `vulnerabilityFixes.enable` (which would also disable the other vulnerability fixes). LeviLamina 1.9.5 and earlier have no separate `disconnectClient` switch (it was added in 1.9.6 when the `vulnerabilityFixes` config was split), so upgrade first. Players who are already stuck can only be cleared by restarting the server.

*Applies to: LeviLamina 1.9.6 and later (including 26.60.x)*

## How do I stop a mod from loading when the server starts in LeviLamina without deleting its files? (For example, a mod does not match the current version and crashes the server on every start.)

Add `"passive": true` to `manifest.json` in the mod's directory (`mods/<mod name>/`); it is then not loaded actively and loads only when another mod depends on it. You can also rename the mod's `manifest.json` or the whole mod folder so that LeviLamina does not recognize it (a message may appear at startup). If a mod (such as a dll shown in the trace log) crashes the server because its version does not match the current LeviLamina, delete it or replace it with a matching version.

## What does LeviLamina's STUN feature do? When I turn it off or use frp or other tunneling, the player IP that plugins get becomes 127.0.0.1. Is that related?

LeviLamina's NetherNet patch (config entry `targeted.netherNetPatch`, containing `enable` and `stunServers`, which defaults to `["stun:stun.l.google.com:19302", "stun:stun.miwifi.com:3478"]`) uses STUN to help the server obtain its own public address. If there are several public IPs, it listens on all of them. This has nothing to do with getting player IPs. The player IP becomes 127.0.0.1 because a forwarding or tunneling tool such as frp is in use: the server sees only the address of the forwarding end and cannot get the player's real IP.

*Applies to: LeviLamina 26.60.x (with `netherNetPatch`)*

## I run two LeviLamina servers on the same machine. After I start server A and then server B, B crashes right after loading. How do I fix it?

This is a port conflict. Stop both servers, then edit `server.properties` for each one: set `enable-lan-visibility` to `false` (under `transport=raknet`, this setting makes the server bind the default ports 19132/19133 even if you change the ports), and set `server-port`, `server-portv6`, and `server-udp-ports` (used when `transport=nethernet`) to distinct values that do not overlap between the two servers. With these changes (for example, in two separate server folders deployed with lip), both servers can run at the same time.

## I set `transport=nethernet` in `server.properties`, but the LeviLamina server still reports at startup that it is using raknet. Why?

This is caused by the Glacie plugin: the version of Glacie at the time forced raknet on. To use NetherNet, uninstall Glacie, or wait for and update to a version of Glacie that supports both raknet and nethernet.

*Applies to: BDS 26.51 and later; depends on the Glacie version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## LeviLamina's config has no `resourcePackEncryptionMap` (resource pack encryption) option. How do I encrypt a resource pack?

LeviLamina itself does not support resource pack encryption (the `resourcePackEncryptionMap` entry in early configs was a leftover copied from LL2 and was never implemented). Instead, use the separate ResourcePackEncryption plugin (<https://github.com/ShrBox/ResourcePackEncryption>), which you can install with `lip install github.com/ShrBox/ResourcePackEncryption`. Encrypt the resource pack with a tool such as PackCrypt, then add the key under `"ResourcePacks"` in the plugin config as `"uuid": "contentkey"`. The plugin also supports `"ResourcePacksCDN"` for configuring a CDN download URL.

*Applies to: LeviLamina 0.8 to the current version*

## Does LeviLamina print garbled color symbols in a console that does not support color output?

No. LL's log formatter checks whether colored logging (`ColorLog`, a switch provided by PreLoader) is enabled. When colored logging is off, LL automatically strips all color and escape sequences from messages and titles before printing them.

## How do I switch LeviLamina to Chinese (install the Chinese language pack)?

When you install LeviLamina with lip, the `levilamina-loc` language pack is installed automatically as a dependency into `mods/LeviLamina/lang/` (including `zh_CN.json`, `zh_TW.json`, and others), so you do not need to delete the language directory manually. In `mods/LeviLamina/config/Config.json`, `"language": "system"` follows the system language; change it to `"zh_CN"` to force Chinese. If the language pack is missing, install it separately:

```shell
lip install github.com/LiteLDev/levilamina-loc
```

Translations are maintained on Crowdin (<https://crowdin.com/project/levilamina>), and contributions are welcome. Note that some text printed by mods is hard-coded in the mods themselves and is not covered by the language pack.

*Applies to: LeviLamina 26.x; levilamina-loc 1.7.x*

## Clients cannot connect to a LeviLamina server (no tunneling, direct IP and port). What should I do?

The server may be unable to reach the STUN servers. Newer BDS versions use NetherNet, and LL's NetherNetPatch uses STUN servers so that a server behind NAT can discover and advertise its public address to clients. In `plugins/LeviLamina/config/Config.json`, clear `targeted.netherNetPatch.stunServers` (the defaults are `"stun:stun.l.google.com:19302"` and `"stun:stun.miwifi.com:3478"`; only URIs starting with `stun:`/`stuns:` are supported). Then set the server's public address manually in `server.properties` using `server-udp-ports=<public IP>:<public port>:<local port>` (for example, `server-udp-ports=203.0.113.4:19489:19489`).

In versions 26.51 to 26.60.0, set the public address with `netherNetPatch.serverIP` in the LL config instead.

*Applies to: LeviLamina 26.60.1 and later*

## LeviLamina's console log timestamps are precise to the millisecond. Can I change them to show only seconds through configuration?

There is no built-in config option for this. LeviLamina hard-codes the console format as `"{3:.3%T.} {2} {1} {0}"` (with 3 millisecond digits). To change it, you must either write a mod that replaces the format through the logging API (`setFormatter` on `Logger`/`Sink`, together with `PatternFormatter`) or modify the LeviLamina source code and recompile.

## How do I turn off LeviLamina's vulnerability fixes when they cause false positives such as players being disconnected?

In `plugins/LeviLamina/config/Config.json`, set the relevant option under `targeted.vulnerabilityFixes` to `false`—for example, `disconnectClient` for disconnect-related issues. The options you can disable individually are `subChunkRequest`, `itemReadUserData`, `disconnectClient`, `limitIPFrequency`, and `simulatedPlayerChunkLoading`. To disable all of them at once, set `targeted.vulnerabilityFixes.enable` to `false`. Restart the server for the change to take effect. Earlier versions only allow disabling `vulnerabilityFixes` as a whole.

*Applies to: LeviLamina after 2026-02 (after the config split) to 26.60.x*

## What does the `crashCommand` option under `commands` in LeviLamina's config do?

Enabling `modules.command.crashCommand` (`enabled: true`) registers a `crash` command (`clicrash` on the client). Running it forces the server to throw an exception and crash intentionally, which is useful for testing crash handling and CrashLogger. The optional `exceptionCode` parameter sets the exception code. `enabled` defaults to `false` and is not needed on a normal server; the `permission` field controls who can run the command (default: `GameDirectors`).

*Applies to: LeviLamina 0.11 to 26.60.x*

## When I run LeviLamina/BDS on Windows, Chinese text in the console is garbled. How do I fix it?

Go to Settings → Time & language → Language → Administrative language settings → Change system locale, check "Beta: Use Unicode UTF-8 for worldwide language support", and restart the computer.

*Applies to: current version (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where do I set the plugin information (author, version) that `ll show` displays? Writing `Author` and `Version` in the manifest json has no effect.

Set these fields in the mod's `manifest.json`. Key names must be lowercase—for example, `"author"`, `"version"`, and `"description"`; capitalized keys are not recognized. Once set, run `ll show <mod name>` to view the information.

*Applies to: LeviLamina 0.9 to 26.60.x*

## What should I do when changes to a mod/plugin config file do not take effect?

Save the config file after editing (use an editor such as VS Code rather than Notepad to avoid encoding or formatting issues), then either restart the server or run `ll reload <mod name>` in the console to reload the mod. Because reloading can cause issues with some mods, you can instead run `ll disable <mod name>` followed by `ll enable <mod name>`, or `ll reactivate <mod name>`. If the changes still do not take effect, restart the server.

*Applies to: LeviLamina 1.x and later (current 26.60.x)*

## How do I let non-OP players use LeviLamina built-in commands such as `tpdim`?

In `plugins/LeviLamina/config/Config.json`, change the `permission` field for the command under `modules.command`—for example, change `"permission": "GameDirectors"` under `tpdimCommand` to `"Any"`—and then restart the server.

*Applies to: LeviLamina 1.x to 26.60.x*

## After installing a MOTD fix plugin, I changed the server name (MOTD) in `server.properties`, but clients always show something else. What is going on?

This is usually not caused by the MOTD fix plugin. Run `ll list` in the console to check your installed mods; typically, another plugin with a dynamic MOTD feature is overriding `server-name` in `server.properties`. Edit or disable the dynamic MOTD in that plugin's config.

*Applies to: all LeviLamina versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## I cannot attach a debugger (such as Visual Studio / .NET managed debugging) after the server has started. What should I do?

The external CrashLogger attaches to the BDS process as a debugger, and because a process can have only one debugger at a time, other debuggers cannot attach. You do not need to delete CrashLogger. Instead, in `mods/LeviLamina/config/Config.json`, set `modules.crashLogger.enabled` to `false` (or set `builtin` to `true` to use the in-process built-in mode), restart the server, and then attach your debugger. Alternatively, start the server directly under the debugger, in which case CrashLogger disables itself automatically. In this case, .NET managed debugging also depended on the build path: the assembly must be loaded from the debug build output directory for attaching to work.

*Applies to: LeviLamina, current version, when using the external CrashLogger*

## When a LeviLamina server crashes, the crash log is uploaded to Sentry. How do I turn the upload off?

In the LeviLamina config file `mods/LeviLamina/config/Config.json` (`plugins/LeviLamina/config/Config.json` on older installs), set `modules.crashLogger.uploadToSentry` to `false`:

```json
"modules": {
  "crashLogger": {
    "uploadToSentry": false
  }
}
```

This option controls both the built-in and the external CrashLogger (with the external one, `--enablesentry` is no longer passed). Also note: if the server is set to restart automatically when the port is occupied or the server is started twice, it will crash repeatedly and keep uploading logs. Fix the port conflict or duplicate start first.

*Applies to: LeviLamina, current version*

## The LeviLamina console log has no colors (all white), and I can't find `colorLog` in the LeviLamina configuration. How do I enable colored logs?

The color log switch is in PreLoader's configuration file, not LeviLamina's. Open `PreLoaderConfig.json` in the server root directory, set `"colorLog"` to `true`, and restart the server to restore colored output.

*Applies to: LeviLamina 0.13.4 and later, up to the current version*

## When running LeviLamina with the MCSManager panel, I see no normal BDS output after the PreLoader output, and commands typed in the panel have no effect. What should I do?

A virtual TTY is required: enable the "emulated terminal" option in the MCSManager instance settings.

*Applies to: LeviLamina 1.x and later, when using the MCSManager panel. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How should a non-LeviLamina plugin (for example, a DLL to be loaded at the PreLoader stage) write its manifest? Can I use a LeviLamina plugin's manifest directly?

Do not use `"type": "native"`, which is for ordinary C++ mods loaded by LeviLamina's native mod manager. For a DLL that PreLoader must load before the game starts, set `"type": "preload-native"` in the manifest. PreLoader loads it before the game starts and before LeviLamina's mods (LeviLamina itself uses this type). LeviLamina's mod registry skips these manifests and does not count them as LeviLamina mods.

*Applies to: LeviLamina 1.x and later (currently 26.60.x)*
