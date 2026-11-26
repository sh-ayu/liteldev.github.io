# Hook Guide

## Introduction

Hooking is a technique for modifying the behavior of functions at runtime without changing the original source code.

See Wikipedia's article on hooking: [Hooking](https://en.wikipedia.org/wiki/Hooking)

LeviLamina provides well-packaged Hook APIs that let you quickly and conveniently modify the behavior of game functions in Minecraft Bedrock Edition.

## Defines of Hooks

[`ll/api/memory/Hook.h`](https://github.com/LiteLDev/LeviLamina/blob/a4e181914f7a4cc3a6a574fe9d4e9976a25a684a/src/ll/api/memory/Hook.h#L261) defines the following Hook macros:

```cpp
#define LL_TYPE_STATIC_HOOK(DEF_TYPE, PRIORITY, TYPE, IDENTIFIER, RET_TYPE, ...)

#define LL_STATIC_HOOK(DEF_TYPE, PRIORITY, IDENTIFIER, RET_TYPE, ...)

#define LL_TYPE_INSTANCE_HOOK(DEF_TYPE, PRIORITY, TYPE, IDENTIFIER, RET_TYPE, ...)

#define LL_INSTANCE_HOOK(DEF_TYPE, PRIORITY, IDENTIFIER, RET_TYPE, ...)

#define LL_AUTO_TYPE_STATIC_HOOK(DEF_TYPE, PRIORITY, TYPE, IDENTIFIER, RET_TYPE, ...)

#define LL_AUTO_STATIC_HOOK(DEF_TYPE, PRIORITY, IDENTIFIER, RET_TYPE, ...)

#define LL_AUTO_TYPE_INSTANCE_HOOK(DEF_TYPE, PRIORITY, TYPE, IDENTIFIER, RET_TYPE, ...)

#define LL_AUTO_INSTANCE_HOOK(DEF_TYPE, PRIORITY, IDENTIFIER, RET_TYPE, ...)
```

Hooks marked with `AUTO` register automatically by calling the `hook()` function at runtime.  
Hooks marked with `TYPE` make your `DEF_TYPE` inherit from the specified type.

### STATIC_HOOK

For hooking static functions.

### INSTANCE_HOOK

For hooking member functions.

## Explanation of Hook Parameters

`DEF_TYPE`: The type name you give to your Hook.

`PRIORITY`: [Hook priority](https://github.com/LiteLDev/LeviLamina/blob/a4e181914f7a4cc3a6a574fe9d4e9976a25a684a/src/ll/api/memory/Hook.h#L45), e.g., `ll::memory::HookPriority::Normal`

!!! note
    Unless you have a special need, we do not recommend using a very high priority; Normal is generally sufficient.

`TYPE`: The type from which `DEF_TYPE` inherits.

`IDENTIFIER`: The identifier used to look up the function to hook. This can be the [function's decorated name](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170), function bytecode, or the function definition.

`RET_TYPE`: The return type of the Hook function.

`...`: The parameter list of the Hook function.

## Using Hooks

You can refer to the [`Fake Header`](https://github.com/LiteLDev/LeviLamina/tree/main/src/mc) provided by LeviLamina to find the definitions of the functions you want to hook.

### A Simple Hook Example

```cpp
#include "ll/api/memory/Hook.h"
#include "ll/api/io/LoggerRegistry.h"
#include "mc/server/DedicatedServer.h"

auto dedicatedServerLogger = ll::io::LoggerRegistry::getInstance().getOrCreate("DedicatedServer");

LL_AUTO_TYPE_INSTANCE_HOOK(
    DedicatedServerCtorHook,
    ll::memory::HookPriority::Normal,
    DedicatedServer,
    &DedicatedServer::$ctor,
    void*
) {
    dedicatedServerLogger->info("DedicatedServer::DedicatedServer");
    return origin();
}
```

This code hooks the `DedicatedServer` constructor and prints a log message when the constructor is called.

#### Analysis:

From [`DedicatedServer.h`](https://github.com/LiteLDev/LeviLamina/blob/594d6897525f902c457428bbbc5bc9fe20305fb8/src/mc/server/DedicatedServer.h#L134) in LeviLamina, we can see that the `DedicatedServer` constructor has a thunk function.

Because the constructor is a member function of the class, we use an `INSTANCE_HOOK`, so we do not need to write the compiler-generated [`this pointer`](https://en.cppreference.com/w/cpp/language/this) as the first parameter.

We use an `AUTO` Hook so that it registers automatically when the mod loads.

Finally, for convenience, we use a `TYPE` Hook so that we can call member functions of `DedicatedServer` directly in the function body. Although this example does not use it, doing so is a good habit.

### Registering and Unloading Hooks

#### Registration

For Hooks that do not register automatically, call the `hook()` function when your mod needs to register the Hook.

#### Unloading

All Hooks unload automatically when Minecraft unloads. You can also call the `unhook()` function when your mod needs to unload the Hook.

## In Conclusion

Hooking is a powerful technique, but also a double-edged sword. Used improperly, it can crash the Minecraft core or mods, and in severe cases damage game saves.

Use Hooks with caution, and check your code carefully to avoid unnecessary errors.
