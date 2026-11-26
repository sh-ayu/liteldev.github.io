# LeviLamina mod API: data, config and i18n

## The old `CompoundTag` getters such as `getInt`/`getString` no longer work in LeviLamina (they were marked deprecated). How do I read NBT values now?

Access values with the subscript operator or `at()` (`tag["key"]` or `tag.at("key")`) to get a `CompoundTagVariant`, then read the value from it. The maintainers prefer `operator[]`, which you can chain for nested access (such as `nbt["a"]["b"]["c"]`). To read a numeric type, use `tag["key"].get<int>()` or convert directly with `int{tag["key"]}`. Convert a string directly to `std::string const&` (or use `get_ref<std::string&>()`). To get a specific Tag type, use `tag["key"].get<IntTag>()`, `get<CompoundTag>()`, or `get<ListTag>()`. To check whether a key exists, use `tag.contains("key")` or `contains("key", Tag::Type)`. To write a value, assign to the key directly: `nbt["key"] = 1;`, `nbt["list"] = ListTag{1.0, 2.0};`. For more examples, see `src-test/server/TestNbt.cpp` in the LeviLamina repository.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## What does the configuration struct need to satisfy when using LeviLamina's config API (`ll::config::loadConfig` / `saveConfig`)?

The config struct must be reflectable (a plain aggregate struct is enough) and must contain an integer `version` field (such as `int version = 1;`); otherwise, it does not satisfy the `IsConfig` constraint and fails to compile. `loadConfig` compares the `version` in the file with the struct's default: if the version differs or is missing, it calls the updater (by default `defaultConfigUpdater`, which merges the old values from the file into the current struct) and returns `false`, so the caller can call `saveConfig` again to write back the upgraded config. If you do not want a `version` field, write your own read/write code on top of `ll::reflection::serialize`/`deserialize`.

*Applies to: LeviLamina 0.11 and later through current v26.60.8*

## Where are the old LL2 PlayerInfoAPI / namedb (the database mapping player names to xuid/uuid) in LeviLamina? Can I query offline players and iterate over all players?

The equivalent feature is `ll::service::PlayerInfo` in `ll/api/service/PlayerInfo.h`, which stores the UUID, XUID, and name of known players in leveldb. Call `PlayerInfo::getInstance()` to get the instance. Query a single player (including offline players) with `fromUuid`, `fromXuid`, or `fromName`, each of which returns `optional_ref<PlayerInfoEntry const>`. Iterate over all records with `entries()`, which returns a generator, and delete a record with `erase(uuid)`.

On the script side, LSE can get all player information with `data.getAllPlayerInfo()`.

*Applies to: LeviLamina 0.9 and later, up to the current version*

## My LeviLamina C++ mod needs to save player data. Is there a built-in database? Is the MySQL library (`session.h`) from the LiteLoaderBDS era still there? What if I want MySQL?

LeviLamina no longer includes the old LiteLoaderBDS MySQL/database wrapper (`session.h`). For simple local storage, use the built-in `ll::data::KeyValueDB` (`ll/api/data/KeyValueDB.h`, based on LevelDB). If you need a relational database, pull in a third-party library such as SQLite or a MySQL client library through xmake (`add_requires`), and distribute its dynamic library with your mod. You only need a server-side database such as MySQL when external programs (such as a website or a QQ bot) also need to access the data.

On the script side, LSE ships its own database API (`DBSession`, which supports SQLite and MySQL).

*Applies to: LeviLamina 0.x up to the current version*

## Is there a JSON read/write API in LeviLamina C++ plugin development, similar to the one in LLSE?

LeviLamina provides a config file API (`ll::config::loadConfig` / `saveConfig` in `ll/api/Config.h`), which serializes automatically through reflection; the config struct needs an integer `version` field. For general JSON reading, writing, or data storage, use the `nlohmann::json` library included with LeviLamina's dependencies (`Config.h` itself includes `nlohmann/json.hpp`).

## How do I get an item's NBT in LeviLamina, and how do I build an item from NBT?

To export an item's NBT, call `ItemStack::save`, which now requires a `SaveContext`:

```cpp
auto tag = item.save(*SaveContextFactory::createCloneSaveContext());
```

This returns a `std::unique_ptr<CompoundTag>`. The header is `mc/world/item/SaveContextFactory.h`.

To build an item from NBT, use the static function `ItemStack::fromTag(CompoundTag const&)` (or the overload that takes an `ILevel&`).

BDS already provides a complete NBT read/write interface, so LL2's layered NBT wrapper API is no longer needed. The above applies from the BDS version in which `save` requires a `SaveContext`.

## What is `src/ll/api/reflection/Dispatcher.h` in the LeviLamina source for?

`ll::reflection::Dispatcher<Storage, Listener, CallInit>` is a wrapper for the observer pattern, used mainly for config files. When a config field is wrapped in a `Dispatcher`, every assignment to it (including when a config is read through deserialization) calls `listener.call(storage)`, so logic runs automatically whenever the config changes. With `CallInit=true`, it is also called once on construction. Reflection serialization and deserialization have dedicated support for `Dispatcher`. LeviLamina's own config has an example:

```cpp
ll::reflection::Dispatcher<bool, ForceEnableCheatCommands> forceEnableCheatCommands = true;
```

*Applies to: LeviLamina 1.x and later*

## Which JSON library does the LeviLamina API use?

It uses nlohmann json (LL's config API `ll/api/Config.h` uses `nlohmann::ordered_json` by default). BDS also includes rapidjson and jsoncpp internally.

*Applies to: all versions*

## After `ll::config` read a JSON (jsonc) config file with comments, all the comments in the config were gone after restarting the server. Are comments unsupported?

`ll::config` is based on `nlohmann::ordered_json`: `loadConfig` ignores comments when parsing (so it can read files with comments) but does not preserve them. A common pattern is to call `saveConfig` to write the file back when `loadConfig` returns `false` (on a version mismatch or when an update is needed), or to save after every load; the file generated by nlohmann `dump` then contains no comments. To keep comments, switch to a JSON/jsonc library that preserves them, use another config format (such as TOML), or avoid writing the file back automatically.

*Applies to: all versions*

## In LeviLamina reflection/config serialization, a combinable flags enum (such as `A|B`) is serialized as an empty string. How do I fix it?

Current LeviLamina reflection has built-in support for flags enums. On serialization, if `magic_enum` recognizes the type as a flags enum, it writes `"A|B"` with `magic_enum::enum_flags_name`, falling back to the underlying integer if the name is empty. On deserialization, it tries both `enum_cast` and `enum_flags_cast`, so `"A|B|C"` strings are supported.

The key is to make `magic_enum` recognize the enum as flags: specialize `magic_enum::customize::enum_range<YourEnum>` as described in the `magic_enum` documentation and set `static constexpr bool is_flags = true`.

Older versions require you to write your own `format_as` that uses `enum_flags_name` and falls back to `enum_integer`.

*Applies to: LeviLamina 26.60.x; older versions need a custom `format_as`*

## Is it reliable to identify an item (such as a bundle) by its numeric item ID in a mod?

No. Loading Addons may change an item's numeric ID. Identify items by their type name instead—for example, `item.getTypeName() == "minecraft:bundle"`—even though a string comparison is slightly slower than a `short` comparison.

## I load a config struct containing `std::vector<int>` or `std::map` with `ll::config::loadConfig`, and after editing the json the values are still empty. Does reflection not support them?

Reflection supports containers such as `std::vector` (via the ArrayLike branch in `Deserialization.h`) as well as associative containers such as `std::map` (via the Associative branch). The key can be a string, an enum (serialized as a string), or a type that specializes `ll::reflection::Serializer<T>::to_string` / `from_string`.

The values are empty because the config is defined as a `static` global variable in a header. A `static` variable in a header gets its own copy in every translation unit that includes it, so the object `loadConfig` writes to is not the one other files read. Declare it with `extern` in the header and define it in a single `.cpp` file (or use an `inline` variable).

Remember to increment `version` after changing the config structure. To store custom key-value pairs, use a container such as `std::map<std::string, std::string>` instead of treating json as a map.

*Applies to: LeviLamina 0.10 and later*

## How can a native mod read an offline player's inventory, ender chest, position and so on from world data, and how do I get the player name?

1. Read the key `"player_<uuid>"` (`DBHelpers::Category::All`) through `ll::service::getDBStorage()` to get a `CompoundTag`, and extract its `"ServerId"` string.
2. Using that serverId as the key and `DBHelpers::Category::Player`, read the player NBT from the world database (`getCompoundTag`), then manually parse the inventory, ender chest, position, and other fields.

The player name is not in this NBT. Use `ll::service::PlayerInfo::getInstance().fromUuid(uuid)` to get the name/xuid. You can refer to the implementation of `getPlayerNbt` / `setPlayerNbt` in LSE.

*Applies to: LeviLamina current version*

## How do I get the `DBStorage` object in a LeviLamina C++ mod without hooking a function myself?

Get the `LevelStorage` through the Level: `ll::service::getLevel()->getLevelStorage()`. On a server, its actual type is `DBStorage` (`class DBStorage : public LevelStorage`), so you can cast it with `static_cast<DBStorage&>(level.getLevelStorage())`. Avoid relying on a third-party library (such as GMLIB) that hooks and caches a `DBStorage*`.

*Applies to: LeviLamina 1.x and later*

## In a LeviLamina C++ mod, I build an SNBT string with `std::format` (such as `{Findable:0b,Items:[],id:Chest,isMovable:1b,x:8,y:66,z:-41}`) and call `CompoundTag::fromSnbt`, but it returns empty. Why?

Braces in `std::format` and `fmt::format` act as placeholders, so you must escape literal `{` and `}` as `{{` and `}}`. Otherwise, the resulting SNBT is invalid, causing `fromSnbt` to fail and return empty (`fromSnbt` returns an optional/Expected, so check the result).

Instead of assembling SNBT with format, write it directly as a raw string literal `R"(...)"`, or build the NBT key by key using the `CompoundTag` API. For NBT usage examples, see `src-test/server/TestNbt.cpp` in the LeviLamina repository. `toSnbt` also supports several `SnbtFormat` output options, such as `PrettyFilePrint` and `Jsonify`.

*Applies to: all LeviLamina versions*

## In a LeviLamina C++ mod, how do I convert an `ItemStack` pointer to `ItemStackBase`? Do I need `dynamic_cast`?

`ItemStack` publicly inherits from `ItemStackBase`, so you do not need `dynamic_cast` to convert from the derived class to its base (and BDS has no RTTI anyway). Simply dereference the pointer and use it as `ItemStackBase&` directly (an implicit upcast), or cast it explicitly with `static_cast<ItemStackBase&>(*item)`. To copy an item, use `ItemStack::clone() const`.

*Applies to: all LeviLamina versions*

## How do I convert between NBT (`CompoundTag`) and JSON cleanly in LeviLamina C++?

You cannot convert between the two losslessly in both directions: JSON does not distinguish between numeric types such as byte, short, int, and float, and NBT strings can contain arbitrary binary data that JSON does not allow.

If that limitation is acceptable, use `toSnbt(SnbtFormat::Jsonify)` to output a JSON-compatible string (which quotes keys and keeps type information as comments), then parse it with a JSON library. Binary strings that JSON cannot represent are converted to base64 with a `/*BASE64*/` marker. To convert in the other direction, parse the string with `CompoundTag::fromSnbt`.

We recommend storing NBT directly and using SNBT when you need a human-readable format.

*Applies to: all LeviLamina versions*

## I want to write custom data (such as a digital watermark for a map) into the LevelDB of a BDS world without BDS cleaning it up. After writing with a generic Node.js leveldb library, the data disappears. What should I do?

BDS uses a Mojang-modified version of LevelDB with its own compression format. Because generic leveldb libraries do not support this format by default, external writes are unreliable—BDS itself does not actively delete data under unknown keys. In a mod, you can write a custom key through the `LevelStorage` interface (`mc/world/level/storage/LevelStorage.h`), using `saveData(std::string const& key, std::string&& data, DBHelpers::Category category)` or `saveData(key, CompoundTag const&, category)`, and read it back with `loadData` or `getCompoundTag`. The `DBHelpers::Category` parameter has little effect on actual storage; only the key matters. If you just need a watermark, a more reliable vanilla approach is to name a container block or a mob in a hidden location, which saves the name in NBT.

*Applies to: current LeviLamina version*
