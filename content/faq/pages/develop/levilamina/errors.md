# LeviLamina mods: errors and crashes

## Calling MC APIs or sending packets (such as `forEachPlayer`, `sendPacket`, `TextPacket`) from a child thread or thread pool (`ThreadPoolExecutor`, `std::thread`, a timer thread) in a LeviLamina mod crashes the server or makes the client report "the server sent a corrupted packet". What should I do?

BDS game logic and packet sending are not thread-safe: there are no internal locks, and writing to the send queue from several threads at once crashes the server. Every MC/BDS API call (including `sendPacket`, even for a `TextPacket`) must therefore run on the server main thread. This is a bug in the mod itself; LeviLamina will not "fix" it.

Offload time-consuming work to a thread pool, and switch back to the main thread before calling any MC API. For example:

```cpp
ll::thread::ServerThreadExecutor::getDefault().execute([]{ ... });
```

Or use a coroutine:

```cpp
ll::coro::keepThis([]() -> ll::coro::CoroTask<> { co_await 20_tick; ... }).launch(ll::thread::ServerThreadExecutor::getDefault());
```

Whether a coroutine runs on the main thread depends on the Executor passed to `launch`: only `ServerThreadExecutor` runs on the main thread; `ThreadPoolExecutor` does not.

Run timed and periodic tasks per tick (1 tick = 50 ms), and do not send packets at high frequency (such as every 1 ms): the client does not process them any faster, RakNet is unstable under high-frequency sending, and the packets are easily treated as corrupted. For high-precision music playback, use the ogg files built into a resource pack, or convert the audio to a format played per tick (such as nbs). Also, addons cannot send packets, so if corrupted packets appear, check your native mods.

The multithreaded packet-sending optimization once provided by LeviOptimize (PacketSenderOpt) has been removed, so you can no longer rely on it to send packets from non-main threads. If you must send from another thread, the only option is to serialize the packet into a binary stream with `Packet::write` off the main thread and then send it through a third-party interface that does its own locking (such as GMLIB's binary-stream packet sending). This is a third-party solution.

*Applies to: LeviLamina 1.0 and later (currently v26.60.8); the main-thread restriction applies to all versions*

## My own LeviLamina C++ mod builds successfully but crashes BDS at runtime (sometimes a memory access error, sometimes a division by zero), and the console shows no useful error. How do I locate the failing position in my code?

Use a debugger instead of scattering log statements to guess where it fails:

1. Start `bedrock_server_mod.exe` normally, then attach a debugger using Visual Studio "Debug → Attach to Process" (or VSCode cppvsdbg attach, or WinDbg). To catch a crash early in startup, run `set PL_DEBUG=1` before starting the server so that PreLoader waits for a debugger to attach. Do not launch `bedrock_server_mod.exe` directly from the debugger; this fails on recent versions of LeviLamina.
2. When an exception occurs, the debugger breaks at the failing instruction. If it does not point directly at your code, walk up the call stack to your mod's frame and inspect the variables. You can also set breakpoints on suspicious code and step through it.
3. To see source lines, you need the mod's pdb file (the template's default `set_symbols("debug")` generates it).
4. If no debugger is attached, LeviLamina's built-in CrashLogger prints a stack trace on a crash. For your own mod, the function names in the trace usually map directly to locations in your code. (If a debugger was already attached when CrashLogger initialized, as with `PL_DEBUG=1`, CrashLogger is not enabled.)

*Applies to: LeviLamina 1.2.0 and later (including the current 26.x); the approach applies to all versions*

## Does a "failed to disable" message for a plugin (for example one that depends on GMLIB) at server shutdown cause a crash?

No. At shutdown, LeviLamina disables mods one by one in reverse load order. If a mod is being disabled while another still-enabled mod depends on it, LeviLamina returns the error `{0} still depends on {1}`; if a mod's `disable()` returns `false`, it returns `The mod cannot be disabled`. In `disableAllMods`, these errors are only logged at Warn level and do not prevent a normal shutdown. If the server actually crashes, something else is responsible (such as a mod's shutdown code); install CrashLogger to find the cause.

*Applies to: LeviLamina 1.x and later*

## When a LeviLamina C++ mod delays logic in an event such as block break, the block position jumps randomly and the block fetched at that position is air. What is the cause?

The delayed callback or coroutine holds a reference to data from the event object (for example, it captures a reference to `ev.pos()` or `ev` itself). Those objects are destroyed as soon as the event callback returns, leaving the delayed callback to read dangling memory. When delaying execution, capture or copy the values you need (`BlockPos`, dimension id, and so on) by value—for example, `[pos = BlockPos(ev.pos()), dim = ...]`—or copy them into local variables at the start of the coroutine before suspending, rather than capturing references. In current versions, delays are typically written with `ll::coro` (for example, `ll::coro::keepThis([=]() -> ll::coro::CoroTask<> { co_await std::chrono::seconds(1); ... }).launch(ll::thread::ServerThreadExecutor::getDefault());`), which likewise requires capturing by value.

## A LeviLamina mod crashes in an event listener near `isCancelled()` with exception code `0xC0000005`, which looks like a null pointer. What is the cause?

A common cause is passing a temporary `std::string` (such as the return value of `fmt::format`) when constructing an event ID with `EventIdView`. Because `EventIdView` holds only a `std::string_view` internally, the temporary string is destroyed at the end of the statement and leaves a dangling view—undefined behavior that may not reproduce during testing. To fix this, return or store an `ll::event::EventId` instead (which owns a `std::string` and converts implicitly to `EventIdView`), or make sure the source string outlives its use. Note also that `0xC0000005` (`EXCEPTION_ACCESS_VIOLATION`) is not necessarily a null pointer dereference: `ExceptionInformation[0]` indicates the operation (0 for read, 1 for write, 8 for DEP) and `[1]` holds the inaccessible address. Because of inlining, the crash line reported in the dump may also point to an adjacent statement, off by one line.

*Applies to: LeviLamina 1.x and later (including 26.60.x)*

## Writing `auto* bs = dynamic_cast<BedrockSpawner*>(&ll::service::getLevel()->getSpawner());` in a LeviLamina mod crashes (`vcruntime140.dll` `0xC0000005` access violation). Why?

The Windows build of Bedrock Dedicated Server (BDS) has no usable RTTI information, so calling `dynamic_cast` on internal BDS types fails (either returning `nullptr` or crashing directly inside vcruntime). `getSpawner()` returns a `Spawner&`, and taking its address is fine; use `static_cast` instead: `auto* bs = static_cast<BedrockSpawner*>(&ll::service::getLevel()->getSpawner());` (you must ensure that the actual type is `BedrockSpawner`).

*Applies to: LeviLamina 26.x (Windows BDS). Not confirmed against the source code or the documentation: treat it as a pointer.*

## After hooking a BDS function (for example a piston's redstone update function), a parameter is an invalid address and crashes, while the same hook for other similar blocks works. Why?

Check whether the function is marked `MCFOLD` in the LeviLamina headers. `MCFOLD` means the compiler applied Identical COMDAT Folding (ICF) to the function: because it shares its address with other functions, hooking it intercepts calls to several different functions at once, and the parameters may not match the expected types at all. You can still call or hook an `MCFOLD` function, but inside the hook you must identify the caller yourself (for example, by checking the actual type of `this` or the block type) and validate the parameters (if necessary, use the Windows API `IsBadReadPtr` to verify that a pointer is readable). A better approach is to hook an unfolded caller or callee function instead.

## After porting a server mod to the LeviLamina client, code in a hook misbehaves or crashes (the exception is on the MINECRAFT MAIN THREAD). What should I do?

The hook is usually firing on a thread other than the `MC_SERVER` thread (the client also has a main thread, a render thread, and so on). Most server-side MCAPI functions can only be called on the `MC_SERVER` thread, so check inside the hook that the current thread is the server thread before running server logic. See LegacyScriptEngine's `lse::api::thread::isServerThread()`: `auto instance = ll::service::getServerInstance(); return instance && std::this_thread::get_id() == instance->mServerInstanceThread->get_id();`. Its event implementation (for example, `src/lse/events/BlockEvents.cpp`) checks `if (isServerThread())` in the callback before handling the event. In addition, the `BlockSource` you receive may belong to the client world, so check it first with `blockSource.getLevel().isClientSide()` (`BlockSource` itself has no `isClientSide()`; go through `Level`/`ILevel`). Do not run server-side operations such as `removeBlock` on a client-side `BlockSource` (the client's `playerDestroy` does not spawn drops either).

*Applies to: LeviLamina client build*

## A self-built LeviLamina mod fails in an event listener (for example `Error in Listener<ll::event::world::BlockChangedEvent>`) but the official tests cannot reproduce it. What should I check?

First, verify that the mod uses LeviLamina's memory allocator (mimalloc): the official template includes `#include "ll/api/memory/MemoryOperators.h"` in `src/mod/MemoryOperators.cpp`, and without it, cross-DLL allocation and deallocation become inconsistent and crash. If the problem persists, delete the project's old `.xmake` cache directory (along with the `build` directory), then reconfigure with `xmake f` and rebuild to clear out any stale dependencies or headers.
