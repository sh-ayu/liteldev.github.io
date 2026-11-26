# LeviLamina mod API: other apis

## How do I implement multi-language support (i18n) in a native LeviLamina C++ mod: where do language files go, how are they loaded, and how do I use `_tr`?

Follow the same approach LeviLamina itself uses: hard-code English strings in the code as translation keys, and ship a JSON translation file per language in `lang/` under the mod directory (for example, `lang/zh_CN.json` containing `{"hello {}": "你好 {}"}`). Load the translations in your mod's `load()` method with `ll::i18n::getInstance().load(getSelf().getLangDir())`. If you pass a directory path, LeviLamina reads every `.json` file inside it and uses the file name as the language code; you can also pass a single JSON file, in which case the top-level keys are the language codes. Usage:

```cpp
#include "ll/api/i18n/I18n.h"
using namespace ll::i18n_literals;
int a = 114514;
"hello {}"_tr(a);
```

When the default language (configured via `language` in LeviLamina's config, which defaults to `"system"` to follow the OS) is `zh_CN` and the `zh_CN` translation is loaded, this outputs "你好 114514". If no translation is found, it outputs "hello 114514" unchanged. You can also specify the language explicitly with `"hello {}"_trl("zh_CN", a)`. `I18n.h` provides the `LL_I18N_COLLECT_STRINGS` macro to collect all `_tr` strings in your code, which helps generate translation templates. When packaging, make sure the `lang` directory is copied into the output: the current template uses levibuildscript's `modpacker` rule (the old template's `after_build.lua` has been removed), and `modpacker` copies only the DLL, PDB, and `manifest.json` to `bin/<modName>/`, omitting the `lang` directory. Either add an `after_build` hook in `xmake.lua` to copy it with `os.cp`, or copy it into the mod directory manually when releasing.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## Some `enum`s in the LeviLamina headers are empty, and some structs (for example `ResolvedItemIconInfo`, returned by `getIconInfo`) have only a constructor and no members. Is that normal? Do I need to fill them in myself?

Yes, that is normal. The mc headers are automatically generated from reverse engineering. Most classes and structs now include their generated member layouts: members of known types are declared with `::ll::TypedStorage<alignment, size, type>` (for example, `ResolvedItemIconInfo` now has complete members such as `mIconName`, `mIconFrame`, and `mIconType`), while members of unknown types use `::ll::UntypedStorage<alignment, size>`, which you can access as their actual type using `.as<T>()`. However, some `enum`s still lack enumerators and some classes remain empty (`{}`).

In those cases, you must complete the definitions yourself by referencing other implementations (such as Nukkit-based projects or protocol documentation) or by reverse engineering them.

*Applies to: all current LeviLamina versions*

## What are LeviLamina's API conventions for raw pointers? Can I still use `Player*` and the like? What should I use for nullable parameters and return values?

LeviLamina's own APIs do not use raw pointers for parameters or return values; types like the former `Player*` are now references such as `Player&`. For a non-owning reference that may be empty, use `optional_ref<T>` (defined in `mc/deps/core/utility/optional_ref.h`, which is already included by `mc/_HeaderOutputPredefine.h`; for example, `ll::service::getLevel()` returns `optional_ref<Level>`, and `PlayerInfo::fromXuid` returns `optional_ref<PlayerInfoEntry const>`). Objects whose ownership is managed by LL use smart pointers such as `std::shared_ptr` and `std::unique_ptr`.

Note that reverse-engineered vanilla function signatures under mc may still use raw pointers.

*Applies to: LeviLamina 0.6 and later, up to the current version*

## How do I construct an `ActorUniqueID` myself in a C++ mod?

`ActorUniqueID` is an aggregate struct with a single `int64 rawID` member, so you can use aggregate initialization: `auto id = ActorUniqueID{123};`. `ActorUniqueID{}` initializes `rawID` to 0, whereas `ActorUniqueID id;` leaves `rawID` uninitialized. When you need an invalid ID, use `ActorUniqueID::INVALID_ID()`.

## In C++ mod development, how do I get an `Actor` from an `ItemActor`? Can I use `dynamic_cast`?

`ItemActor` publicly inherits from `Actor`, so you can use an `ItemActor*` directly as an `Actor*` (an implicit upcast) without any conversion. Because BDS is compiled without RTTI, you cannot use `dynamic_cast`. Similarly, `ItemStack` inherits from `ItemStackBase`, so you can pass an `ItemStack` directly wherever an `ItemStackBase` API is expected.

## C++ `switch` cannot branch directly on `std::string`. How do I avoid a pile of `if-else` when developing a LeviLamina mod?

Hash the string into an integer first, then `switch` on the hash. LeviLamina provides `#include "ll/api/utils/HashUtils.h"`, where `ll::hash_utils::doHash(std::string_view)` is `constexpr`, and the `"xxx"_h` literal operator (in the `ll::literals::hash_literals` namespace) is `consteval` so you can use it directly in `case` labels:

```cpp
using namespace ll::literals;
switch (ll::hash_utils::doHash(str)) {
case "foo"_h: ...; break;
case "bar"_h: ...; break;
}
```

The standard library's `std::hash<std::string>{}(str)` is not `constexpr` and cannot be used in `case` labels.

*Applies to: LeviLamina 0.8 and later*

## Does LL2 (LiteLoaderBDS)'s LLAPI (such as the `Block` interfaces, the various events, NBT) still exist in LeviLamina? How do I find the corresponding interfaces?

LeviLamina does not keep LL2's API one-to-one; it rewrote it or replaced it with direct use of BDS native classes (LSE was ported on top of LeviLamina), and the naming differs from LL2. See the API documentation at <https://levimc.org/LeviLamina/api/> (for example, the `Block` class); you can obtain blocks from BDS's own block registry. LeviLamina provides only basic events (see `src/ll/api/event`); if you need all the events LL2 had, refer to the hook implementations collected in LegacyScriptEngine (`src/lse/events/*Hooks.cpp`). Avoid copying LL2 code; follow the LSE implementation instead.

## Why do some functions in the LeviLamina headers have unnamed parameters (the IDE shows nothing, or only some of the parameter names)?

These are usually functions added in a new BDS version whose parameters have not been analyzed yet; because the headers are auto-generated, they have no parameter names. If you verify what the parameters do, you can report it to LeviLamina by opening an issue; once accepted, it is added to the generated data, and headers in later versions will include the parameter names.

*Applies to: all versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What does a function marked `LLNDAPI` in the LeviLamina headers mean? What is the returned `ll::Expected<>` for?

`LLNDAPI` expands to `[[nodiscard]] LLAPI`, meaning you must not discard the return value. For functions such as `ll::i18n::load` that return `ll::Expected<>` (`Expected<void>`), check the return value; on error, you can print the error message with `.error().log(logger)`, for example:

```cpp
if (auto res = ll::i18n::load(path); !res) res.error().log(getSelf().getLogger());
```

## What should I do when a function, symbol or vtable I need is missing from the LeviLamina headers, or when I do not know the type of a `mUnk` member?

You can only guess or reverse-engineer the type of a `mUnk` member with tools such as IDA. Functions marked `MCNAPI` are not yet exported and cannot be called. When a function or symbol is missing, or you need a member's type, submit a request (with the missing symbol) at <https://github.com/LiteLDev/mcapi-requests/issues/new>. Before submitting, check the online documentation or the latest headers to see whether it has already been restored as `MCAPI`.

## Does LeviLamina have a ready-made function for getting the system time?

Yes. `ll::sys_utils::getLocalTime()` in the header `ll/api/utils/SystemUtils.h` (namespace `ll::inline utils::sys_utils`, so you can write `ll::sys_utils::` directly) returns `ll::data::TmWithMs` (`std::tm` plus milliseconds); you do not need to write your own wrapper. This function still exists in the current version.

*Applies to: LeviLamina 0.13 and later*

## What is the format syntax of LeviLamina's i18n translation strings?

It uses `fmt::format` syntax (`{}` placeholders, `{0}` positional arguments, named arguments, format specifiers, and so on)—for example, `"key"_tr(arg1, arg2)`. In the translation text, refer to arguments with `{}` / `{0}`.

*Applies to: all versions*

## How do I compute the similarity of two colors in a native LeviLamina mod (for example to match block colors for map art/pixel art)?

`mce::Color` in the LeviLamina headers (now at `src/mc/deps/core/math/Color.h`) provides `deltaE76` / `deltaE94` / `deltaE00` and `distanceTo` (equivalent to `deltaE00`). They convert sRGB to linear, XYZ, and then Lab color space before computing the color difference. You can call them directly, or port the implementation to another language.

For map art, use the block's map color rather than the block's own color: `BlockType` has a `getMapColor(BlockSource&, BlockPos const&, Block const&)` virtual function and an `mMapColor` member, and you can iterate over all registered blocks to get them. In the resulting 8-digit hexadecimal color, the last two digits are the alpha (`ff`); drop them when converting to RGB.

*Applies to: LeviLamina current version*

## Which class represents the axe item in the LeviLamina headers?

The axe is `HatchetItem` (`mc/world/item/HatchetItem.h`). It inherits from `DiggerItem`; search for `DiggerItem` to find all digging-tool items.

*Applies to: LeviLamina current version*

## In newer LeviLamina headers `mc/deps/json/JsonHelpers.h` is gone. Which path should I include for `JsonHelpers` now?

Use `#include "mc/util/JsonHelpers.h"`. When a header moves, search the LeviLamina headers for the class name.

*Applies to: LeviLamina 1.0.0 and later*

## How can I read the Windows registry conveniently in a LeviLamina C++ mod?

Pull in the third-party library WinReg (<https://github.com/GiovanniDicanio/WinReg>) with xmake: add `add_requires("winreg")` in `xmake.lua`, add `add_packages("winreg")` in the target, and in your code use `#include <WinReg/WinReg.hpp>` and `winreg::RegKey`. This is simpler than calling the Win32 API directly.

*Applies to: All current versions (Windows only)*
