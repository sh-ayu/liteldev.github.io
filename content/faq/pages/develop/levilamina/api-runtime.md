# LeviLamina mod API: threads, scheduling and lifecycle

## How should I write `unload` in a C++ mod? Should I uncomment the commented-out `unload` with a TODO in levilamina-mod-template?

`unload()` is commented out in the template by default, and the TODO simply means you should implement it only if you need to support unloading. If you are unsure, leave it commented out (do not implement `unload`). LeviLamina will then refuse to unload the mod (printing `The mod does not register an unload function`), which does not affect normal operation. Alternatively, you can implement it and simply `return false` to refuse unloading. If you do support unloading, note that the DLL is released on unload, `atexit` handlers may not run, and threads may be terminated forcibly. To prevent server crashes, manage all threads with a thread pool and join them in destructors, avoid global variables that require cleanup, store all state in the mod object, and manually release every resource in `unload`. On disable or unload, LeviLamina automatically removes event listeners and disables commands.

*Applies to: LeviLamina 0.9 and later (all current versions)*

## Does LeviLamina have an API to get the server TPS/MSPT directly? To show MSPT/TPS permanently from a mod, do I need to hook the tick myself? How is it calculated?

LeviLamina has no direct TPS/MSPT API, nor do you need to hook the tick yourself. The old `ll::schedule` (`GameTickScheduler` / `ServerScheduler`) has been removed; use coroutines instead. Run a loop on the server thread executor `ll::thread::ServerThreadExecutor::getDefault()` and record the time after each `co_await 1_tick` (`ll::chrono::ticks`). The difference between two consecutive times is the MSPT, and TPS = 1000 / MSPT (capped at 20). Alternatively, increment a global tick counter and run a second coroutine once per second to calculate ticks per second from the difference.

For coroutine examples, see `src-test/common/ExecTest.cpp` in the repository. BDS also maintains its own timing data; see `ProfilerLite` in `src/mc/profile/ProfilerLite.h`. You can also use the TPS API provided by a third-party dependency mod, such as GMLIB.

*Applies to: LeviLamina 1.x up to the current version (26.60.x)*

## When a LeviLamina C++ mod uses coroutines, unloading/disabling the mod freezes or crashes the server. How do I stop coroutines correctly and interrupt a long sleep inside a coroutine? What if a coroutine written as a lambda crashes when the lambda is destroyed?

Make sure all coroutines finish before the mod is unloaded:

1. Create a dedicated executor for the mod (such as `ll::thread::ThreadPoolExecutor`), attach all of your coroutines to it, and destroy it on disable.
2. In the coroutine loop, check a stop flag (such as a class member `bool` / `std::atomic<bool>`) and `ll::getGamingStatus()` after every `co_await` returns, and `co_return` when the coroutine must stop.
3. For long sleeps, use an interruptible wait. The old `ll::coro::InterruptableSleep` has been removed; use `ll::coro::ConditionVariable` (`ll/api/coro/ConditionVariable.h`) instead. Store it as a class member, call `co_await cv.waitFor(duration, [&]{ return stop; })` in the coroutine, and on disable, set the stop flag and call `cv.notifyAll()` (if you are sure you are interrupting a server-thread coroutine from the server thread, you can pass `inplace=true`).

Note that `this` may be destroyed before the coroutine finishes; you can manage the implementation object with a `shared_ptr` and have the coroutine hold a copy. When you write a coroutine as a lambda, it will crash if the lambda is destroyed first; use `ll::coro::keepThis` to copy the lambda into the coroutine. Additionally, `ll::coro::CallbackTransformer` can convert a callback into a coroutine wait.

Reference implementation: <https://github.com/GroupMountain/GMSidebar/blob/develop/src/Sidebar.cpp>

*Applies to: LeviLamina 26.60.0 and later (`ConditionVariable`); the `keepThis`, executor, and status-check approaches work in all versions since 1.x*

## How can a C++ mod have an "optional dependency" on another mod (such as GMLIB): not link it directly, and call its exported functions only if it is present? Why does `GetProcAddress` never find the function by name? Can LSE scripts call it?

The exporting mod exports the function with `__declspec(dllexport)`. At runtime, the calling mod gets the other module's handle with `GetModuleHandleA` (if that fails, treat the mod as not installed and skip the related features) and then gets the function pointer with `GetProcAddress`.

C++ applies name mangling (clang-cl and MSVC use the same mangling rules), so the export table contains mangled names such as `?xxx@@...`. Run `dumpbin /exports` (or `llvm-objdump`) to find the full mangled name and pass that to `GetProcAddress`. If you control the exporting mod, export the function with `extern "C"` to avoid mangling. Hard-coding a base address + RVA is not recommended. For normal development, it is better to depend on the other mod's package directly and call its functions normally.

For an LSE script plugin to call a C++ interface, it needs to add a dependency through RemoteCall (LegacyRemoteCall) or a similar mechanism. If you do not want to add a dependency, the only option is to have the other side execute a command (`mc.runcmd`).

*Applies to: all versions*

## In a C++ mod I call `ll::service::getLevel()` during the load phase, then `static_cast<ServerLevel&>` and call `getNewUniqueID()`, and get a `0xC0000005` null-pointer crash. How do I get the `Level` correctly?

The `Level` exists only after BDS has read the world. A mod's `load()` runs before the world is opened, so `ll::service::getLevel()` returns an empty `optional_ref` at that point. Always check whether `getLevel()` has a value first, and move this logic into the `enable()` phase (or a later event): LeviLamina calls `enableAllMods` only after the server thread has started (`ServerScriptManager::onServerThreadStarted`), when the `Level` is ready.

*Applies to: current version (server)*

## In a C++ mod, some exceptions (such as access violations) cannot even be stopped by `try/catch`. How do I catch them?

An access violation is a Windows SEH structured exception, which a typed catch block such as `catch (std::exception&)` cannot catch. The reliable way to catch it is `__try/__except` (supported by both MSVC and clang-cl). A function that uses `__try` cannot hold C++ objects that require destructor unwinding, and `__try` cannot be mixed with C++ `try` in the same function, so wrap the risky call in a small helper function.

Note: the official mod template's `xmake.lua` adds `/EHa`, but it uses the clang-cl toolchain and then appends `/EHs` for `clang_cl`, so do not rely on `catch (...)` to catch SEH exceptions. For catchable C++ exceptions, you can log them with `ll::error_utils::printCurrentException(logger)` (`ll/api/utils/ErrorUtils.h`). That said, an access violation usually points to a bug in your code—fix the root cause rather than catching it and continuing.

*Applies to: LeviLamina mods on Windows (MSVC)*

## How do I use `ll::memory::dAccess` in a LeviLamina C++ mod? How do I read a class member by offset (for example `mSimTimer` from the `Minecraft` object)?

With `dAccess`, the template parameter is the member type, the first argument is the object address, and the second argument is the byte offset: `ll::memory::dAccess<T>(ptr, offset)`, which returns `T&`. If IDA shows an offset such as `this+27` in QWORD units (8 bytes), multiply it by 8 to get the byte offset (27*8 = `0xD8`). If that location stores a pointer, pass a pointer type as the template type and then dereference the result. Apply the offset only once—adding it more than once causes a `0xC0000005` access violation. Offsets depend on the game version and cannot be reused across versions.

In current LeviLamina headers, `Minecraft` already declares `mSimTimer` (`Timer&`) as a `TypedStorage` member, so you can access it directly via `minecraft.mSimTimer` without calculating the offset yourself. To change the tick rate, call `Minecraft::setSimTimeScale` or modify the `Timer`'s `mTimeScale` directly.

*Applies to: current version (offsets change with the game version)*

## How do I write logs in a LeviLamina C++ mod? `std::cout` seems to print nothing.

On the server, `std::cout`, `print`, and `fmt::print` all produce output, but using the mod's own `ll::io::Logger` is recommended:

```cpp
ll::io::Logger& logger = MyMod::getInstance().getSelf().getLogger();
logger.info("...");
```

Here `MyMod` is your main mod class (in the template, `getSelf()` returns `ll::mod::NativeMod&`). On the client, you need to open the console (terminal) window to see the output.

## Can a LeviLamina C++ mod change the server TPS (speed up, slow down or pause game ticks)?

Yes. The `Minecraft` object has an internal simulation timer (`mSimTimer`, of type `Timer&`, where `Timer` contains `mTimeScale`) and provides the virtual functions `setSimTimeScale(float scale)` and `setSimTimePause(bool pause)` to speed up, slow down, or pause game ticks—for example, `ll::service::getMinecraft()->setSimTimeScale(2.0f);` (`getMinecraft()` returns `optional_ref<Minecraft>`, so check that it is valid before use).

Users report that vanilla limits the scale to about 0.1x to 10x; to go beyond this range, you must modify the `Timer` logic yourself. You can also call `ll::service::getLevel()->tick()` in a loop to force extra ticks, though this is not recommended.

*Applies to: current version (server)*

## How does a LeviLamina C++ plugin support hot unload/reload? How do I remove a hook from outside the hook function?

For a native mod to support hot unload or reload (such as `ll unload` / `ll reload`), you must implement unloading yourself. When using `LL_REGISTER_MOD`, define `bool unload()` in the mod class and it will be registered automatically. Otherwise, LeviLamina reports `The mod does not register an unload function` and the mod can only be unloaded when the server shuts down.

A hook macro such as `LL_AUTO_TYPE_INSTANCE_HOOK` defines a hook class name. Call that class's `unhook()` method (for example, `MyHook::unhook()`) in unload (or disable) to remove the hook from outside the hook function. Macros without `AUTO` require you to call `MyHook::hook()` and `MyHook::unhook()` manually. You must also clean up smart pointers, memory allocated with `new`, `std::function` instances, threads, event listeners, and any other resources in unload, or unloading will crash. If you cannot manage their lifetimes safely, do not implement unload.

## Must a LeviLamina C++ plugin define `load`/`enable`/`disable`/`unload`? Can `DllMain` still be used?

When you register a mod with `LL_REGISTER_MOD(class, instance)` in the current version, only `bool load()` is required (enforced by a `static_assert`); `enable`, `disable`, and `unload` are optional and are registered only if you define them. Without `disable`, disabling succeeds immediately. Without `unload`, the mod cannot be hot-unloaded (`ll unload` / `reload` reports `The mod does not register an unload function`) and is unloaded only when the server shuts down. Unless you are very familiar with C++ lifetime management, do not implement `unload`.

`DllMain` is still called, but using it is not recommended because it runs too early: in `DllMain`, the LL API is not guaranteed to be available; in `load`, the game API is not guaranteed to be available; only in `enable` are both available. An LL mod should use `load` as its entry point; otherwise, it is effectively a PreLoader plugin.

## How do I create a logger in a LeviLamina mod without using `getSelf().getLogger()`?

In the current version, the constructor of `ll::io::Logger` is private (`PrivateTag`), so you can no longer construct one directly with `ll::Logger logger("MyMod");`. Instead, get or create one through the logger registry:

```cpp
auto logger = ll::io::LoggerRegistry::getInstance().getOrCreate("MyMod");
```

This returns a `std::shared_ptr<ll::io::Logger>`, which you can use to log with `logger->info("...")`. You can also continue to use `getSelf().getLogger()`, which returns `ll::io::Logger&`.

*Applies to: LeviLamina 1.x and later*

## In a LeviLamina mod, I have a global object that does file operations and must not be copied. Do I need `std::ref` when using it in the lambdas passed to `cmd.overload().execute(lambda)` and `eventBus.emplaceListener<Event>(lambda)`?

No. A global object (with static storage duration) can be used directly inside a lambda without being captured, and a local object can be captured by reference with `[&obj]`. Neither copies the object, and `std::ref` is not meant for lambda captures. You only need to ensure that the object outlives the callback (that is, for as long as the command or listener exists). You can verify that no copy occurs by marking the copy constructor `delete` or `private`. This is a standard C++ rule and does not depend on the LeviLamina version.

*Applies to: all versions*

## What is the call order of the `load`, `enable`, `disable` and `unload` lifecycle functions in a LeviLamina native mod, and how do they differ?

The call order is `load` -> `enable` -> `disable` -> `unload`. For a mod class registered with `LL_REGISTER_MOD`, only `load()` is required (`bool load()`); `enable`/`disable`/`unload` are optional and are bound only if implemented. When a mod is loaded while the server is already running, `enable` is called immediately after `load` succeeds. On a hot unload (`unload`), `disable` is called first, followed by `unload`. The current version is v26.60.8.

*Applies to: LeviLamina 1.x and later*

## How do I include arguments when logging with a logger in a LeviLamina mod?

The LeviLamina logger (`ll::io::Logger`) supports fmt-style formatting in methods such as `info`, `warn`, `error`, and `debug`. You can write `getSelf().getLogger().info("检查到玩家 {} 加入服务器!", ev.self().getRealName());` (meaning "Detected player {} joining the server!") without concatenating strings manually. You can also let `auto` deduce variable types, for example `auto& player = ev.self();`.

*Applies to: LeviLamina 1.x and later*

## When `logger.info` in LeviLamina prints multi-line text containing newlines, the following lines have no time prefix. How do I handle this?

Each `Logger` call formats a single message and prepends the time, level, and title prefix once to the entire message according to the pattern; newlines inside the string do not receive a prefix. If every line needs a prefix, split the text into lines first (for example, using `std::istringstream` with `std::getline`, or `ll::string_utils::splitByPattern`) and call `logger.info` for each line. This applies to `ll::io::Logger`.

*Applies to: all versions*

## Can LeviLamina coroutines use multiple CPU cores?

Yes. A coroutine does not decide which thread it runs on; the Executor that launches or resumes it does. LeviLamina provides `ll::thread::ThreadPoolExecutor`, which extends `ll::coro::Executor`, lets you set the thread count, and offers `ThreadPoolExecutor::getDefault()`. To use multiple cores, run an `ll::coro::CoroTask` on the thread pool with `task.launch(executor)`. When you need to return to the main thread to access game objects, use `ll::thread::ServerThreadExecutor`. Note that most BDS game APIs are not thread-safe.

*Applies to: LeviLamina 1.x and later*

## When one mod DLL is used on both the client and the server, how do I tell whether it is loaded on the client or the server?

Use `ll::isClient()` from `ll/api/Versions.h` to determine whether the mod is loaded on a client or a server.

On the client, if you also need to distinguish a local world (where you are the host and the built-in server is running) from a normal player joining a remote server, do not rely on `Level::isClientSide`. Instead, call `ll::service::getMinecraft()` (which returns the server instance by default, with `isClientSide=false`) or `ll::service::getServerInstance()`. If it returns an instance, a local server is running; otherwise, the client is connected to a remote server.

*Applies to: LeviLamina 1.9 and later (including versions with client support)*

## When using LeviLamina coroutines (`ll::coro`), `co_await 1s` blocks the main thread for a second. What is going on, and how do I start a coroutine correctly?

This happens when you use `syncLaunch` (often copied from test code). `syncLaunch` blocks the current thread until the coroutine finishes and returns its result.

To start a coroutine asynchronously, use `CoroTask::launch(executor)`. `launch` also has an overload that takes a callback, `launch(executor, callback)`, to receive the return value (the overload without a callback defaults to `[](auto&&){}`). Use `syncLaunch` only when you truly need to wait for the result synchronously.

*Applies to: LeviLamina 1.0 and later*

## When using delayed tasks (timed/delayed execution) in a C++ mod, the callback lambda does not run or behaves strangely. What could be the cause?

Check the lambda's capture list. Because a delayed task runs later, local variables captured by reference with `[&]` are already destroyed by the time the task runs, leaving dangling references and causing undefined behavior. Capture by value instead (`[=]` or explicit by-value captures), and use `shared_ptr` or `weak_ptr` where needed to keep objects alive or check whether they still exist.

Current versions of LeviLamina recommend implementing delayed tasks with coroutines, for example:

```cpp
ll::coro::keepThis([player = ...]() -> ll::coro::CoroTask<> {
    co_await 20_tick; // or co_await 1s;
    // ...
}).launch(ll::thread::ServerThreadExecutor::getDefault());
```

Also verify that any objects captured by the lambda are still valid after `co_await` (for example, a player may have gone offline).

*Applies to: all current LeviLamina versions (the old schedule/DelayTask API has been replaced by `ll::coro`)*

## After starting an HTTP service with cpp-httplib (`listen 0.0.0.0`) in a native LeviLamina C++ mod, players cannot connect to the server and even the MOTD is gone. Why?

Because `listen` was called on the main thread. `httplib::Server::listen` is a blocking call that stalls the BDS main thread, preventing the server from responding. Run `server.listen` on a separate thread (such as a `std::thread`), and when the mod is disabled or unloaded, call `server.stop()` and `join` the thread. Never call `listen` on the main thread.

## I copied the example code from the LeviLamina website guide to write a mod, and using `self` gives a compile error. How do I fix it?

The `self` usage in the old guide is outdated. In the current template, the `MyMod` class stores the instance returned by `ll::mod::NativeMod::current()` in its `mSelf` member on construction and exposes it via `getSelf()`—for example, `MyMod::getInstance().getSelf().getLogger().info("...")`. The easiest approach is to create a new project directly from `levilamina-mod-template`.

*Applies to: LeviLamina 1.x and later*

## A (possibly closed-source) mod on my server keeps spamming the console with logs. Can I block or filter them without changing its source code? Will LeviLamina build in such a feature?

LeviLamina will not build in log filtering officially because of the performance cost, so you need to write a mod for it. With the current logging system, retrieve the target mod with `ll::mod::ModManagerRegistry::getInstance().getMod("mod name")` and call `getLogger()` to get its logger. If the mod created its own logger, get it with `ll::io::LoggerRegistry::getInstance().tryGet("logger title")`. Once you have the `ll::io::Logger`, you can raise the output level with `setLevel(...)`, or replace or remove its sinks with `setSink`, `removeSink`, or `clearSinks` (for example, to swap in a custom filtering sink). Hooking `ll::OutputStream::print` from the old logging system no longer works.

*Applies to: LeviLamina 1.x and later (new logging system `ll::io::Logger`)*

## Mods registered by a third-party mod loader I wrote (such as a .NET loader) cannot be found with LeviLamina's query API. What should I do?

They can be found as long as you register them the standard way. Implement a manager that inherits from `ll::mod::ModManager` and register it with `ModManagerRegistry::addManager`. Call `addMod(name, mod)` on load to add the Mod object to the manager, and call `eraseMod(name)` on unload. The `ModManager` owns the Mod objects; LeviLamina does not manage them for you. You can use LeviLamina's own `NativeModManager` as a reference. Once registered, the mods can be found with `ModManagerRegistry::getManagerForMod`, `ModManager::getMod`, and similar methods.

*Applies to: LeviLamina 1.x and later (Plugin was renamed to Mod)*
