# Install LegacyScriptEngine

LegacyScriptEngine (LSE) is a LeviLamina mod: you install it into a server with
[lip](https://levimc.org/lip/), or into the game on Windows with
[LeviLauncher](https://levimc.org/LeviLauncher/). It comes as one package per script language, called a **variant**.

## What you need

- A server or a game instance that already has LeviLamina: see
  [Install LeviLamina](https://levimc.org/LeviLamina/install/).
- The variant for the language of your plugins:

    | Variant | Language | Engine |
    |---|---|---|
    | `#lua` | Lua | CLua |
    | `#quickjs` | JavaScript | QuickJS, with ES modules |
    | `#nodejs` | JavaScript | Node.js, with npm packages |
    | `#python` | Python | CPython, with pip packages |

- For `#python` only, Python on the machine the engine runs on:

    | LSE version | Python version |
    |---|---|
    | >=0.16.2 | 3.12.10 |
    | >=0.9.0 <0.16.2 | 3.12.8 |
    | <0.9.0 | 3.10.11 |

## Install

### On a server

Stop the server if it runs. In the server's folder, install the variant you need:

```shell
lip install LegacyScriptEngine#quickjs
```

Without a variant, `lip install LegacyScriptEngine` installs the QuickJS and Lua engines together. lip picks the
newest LSE that fits the server's LeviLamina and installs what it depends on. The **Marketplace** page of the
interface of lip installs it too: search for LegacyScriptEngine.

### In the game on Windows

In LeviLauncher, open the **LeviMC Mods** page for the instance, find LegacyScriptEngine and install it. LeviLauncher
picks the build for the client and the instance's LeviLamina.

## Check that it works

On a server, run `lip list`: it shows `github.com/LiteLDev/LegacyScriptEngine` with the variant, such as `#quickjs`,
and its version.

## Update

```shell
lip update LegacyScriptEngine#quickjs
```

Name the variant you installed. `lip update` without a name updates every package you asked for. To change to a
particular version, or back to an older one, name it: `lip update LegacyScriptEngine#quickjs@0.23.1`.

## Other versions

Every release is on the [releases page](https://github.com/LiteLDev/LegacyScriptEngine/releases). Each LSE version
is built for one LeviLamina version; lip offers only those that fit the server. To install one of them, put it after
`@`: `lip install LegacyScriptEngine#quickjs@0.23.1`.

## Next steps

- [Install mods on your server](https://levimc.org/tutorials/server/install-mods/): LSE and other mods on a server,
  in the interface of lip and with commands.
- [Your first script plugin](https://levimc.org/tutorials/develop/first-script-plugin/): write a plugin, load it and
  see it run.
- Already have LLSE plugins? Put them in `plugins/` and start the server: see
  [Plugins and engines](concepts/plugins.md).
