# LeviLamina 模组的报错与崩溃

## 在 LeviLamina mod 中从子线程/线程池（`ThreadPoolExecutor`、`std::thread`、定时器线程）调用 MC API 或发包（如 `forEachPlayer`、`sendPacket`、`TextPacket`），导致崩服或客户端提示“服务器发送了破损的数据包”，怎么处理？

BDS 的游戏逻辑和发包都不是线程安全的（内部无锁，多线程同时写入发送队列会导致崩溃）。因此，所有 MC/BDS API（包括 `sendPacket`，哪怕只是发送 `TextPacket`）都必须在服务器主线程中调用。这是 mod 自身的问题，LeviLamina 不会对此进行“修复”。

处理方法：耗时操作可以放到线程池中，但涉及 MC API 的部分必须切回主线程，例如：

```cpp
ll::thread::ServerThreadExecutor::getDefault().execute([]{ ... });
```

或者使用协程：

```cpp
ll::coro::keepThis([]() -> ll::coro::CoroTask<> { co_await 20_tick; ... }).launch(ll::thread::ServerThreadExecutor::getDefault());
```

协程是否在主线程运行，取决于 `launch` 时传入的 Executor：只有 `ServerThreadExecutor` 运行在主线程，`ThreadPoolExecutor` 不是。

定时或周期性任务应按 tick 执行（1 tick = 50ms），切勿高频（如 1ms）发包。客户端不会以更高的频率处理数据包，而且 RakNet 在高频发包下并不稳定，容易将其判定为破损数据包。如需高精度播放音乐，可改用资源包内置的 ogg 音频，或转换为按 tick 播放的格式（如 nbs）。此外，addon 无法发包，遇到破损数据包提示时应排查原生 mod。

LeviOptimize 曾提供的多线程发包优化（PacketSenderOpt）现已移除，不能再依赖它在非主线程发包。如果确实需要在其他线程发包，只能采用第三方方案：先在主线程外用 `Packet::write` 将数据包序列化成二进制流，再通过自带加锁的第三方接口（如 GMLIB 的二进制流发包）发送。

*适用版本：LeviLamina 1.0 及以上（当前 v26.60.8）；主线程限制适用于所有版本*

## 自己写的 LeviLamina C++ mod 构建成功，但运行时让 BDS 崩溃（时而内存访问错误、时而除以 0），控制台看不到有用的报错，怎么定位到自己代码里的出错位置？

请使用调试器定位，而不要靠到处加 logger 盲猜：

1. 先正常启动 `bedrock_server_mod.exe`，再通过 Visual Studio 的“调试 → 附加到进程”（或 VSCode 的 cppvsdbg attach、WinDbg）附加到该进程。如果需要捕获启动早期的崩溃，先执行 `set PL_DEBUG=1` 再启动，让 PreLoader 等待调试器附加。不要用调试器直接启动 `bedrock_server_mod.exe`，这在新版 LeviLamina 下会失败。
2. 发生异常时，调试器会中断在出错位置。如果未直接停在你的代码处，可以顺着调用堆栈向上找到属于自己 mod 的帧，并查看当时的变量值；也可以直接在可疑代码处打断点进行单步调试。
3. 要在调试时查看源码，需要提供 mod 对应的 pdb 文件（项目模板默认配置了 `set_symbols("debug")`，会自动生成）。
4. 未附加调试器时，LeviLamina 内置的 CrashLogger 会在崩溃时输出调用堆栈。如果是自己的 mod 引起崩溃，堆栈中的函数名通常能直接对应到代码位置（注意：若 CrashLogger 初始化时已附加了调试器，例如使用了 `PL_DEBUG=1`，则 CrashLogger 不会启用）。

*适用版本：LeviLamina 1.2.0 及以上（含当前 26.x）；思路适用于所有版本*

## 关服时出现提示某插件（如依赖 GMLIB 的插件）无法 disable / failed to disable，会导致崩服吗？

不会。关服时，LeviLamina 会按加载顺序的逆序逐个禁用（disable）mod。禁用某个 mod 时，若仍有未禁用的其他 mod 依赖它，会返回错误“`{0} still depends on {1}`”；若该 mod 的 `disable()` 方法返回 `false`，则会返回“`The mod cannot be disabled`”。这些错误在 `disableAllMods` 中仅以 Warn 级别输出到日志，不影响正常关服。如果确实发生了崩服，则是由其他原因（如某个 mod 在关闭阶段执行的代码有问题）引起的，应安装 CrashLogger 来定位。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina C++ mod 在方块破坏等事件中延迟执行逻辑时，拿到的方块坐标随机乱跳、按坐标取到的方块是空气，是什么原因？

这是因为延迟执行的回调或协程引用了事件对象中的数据（例如按引用捕获了 `ev.pos()` 或 `ev` 本身）。事件回调返回后，这些事件对象即被销毁，延迟逻辑真正执行时读到的其实是悬垂数据。因此，延迟执行时必须将所需的值（如 `BlockPos`、维度 id 等）按值拷贝或捕获后再传入，例如使用 `[pos = BlockPos(ev.pos()), dim = ...]`，或者在协程中先拷贝到局部变量，切勿按引用捕获。当前版本通常使用 `ll::coro` 实现延时（如 `ll::coro::keepThis([=]() -> ll::coro::CoroTask<> { co_await std::chrono::seconds(1); ... }).launch(ll::thread::ServerThreadExecutor::getDefault());`），同样需要按值捕获。

## LeviLamina mod 中事件监听崩溃，崩溃位置在 `isCancelled()` 附近，异常码 `0xC0000005`，看起来像空指针，原因是什么？

常见原因是在用 `EventIdView` 构造事件 id 时传入了临时的 `std::string`（如 `fmt::format` 的返回值）。`EventIdView` 内部只持有 `std::string_view`，当前语句结束后临时字符串即被销毁，导致 view 悬空（属于未定义行为，测试时不一定稳定复现）。解决方法：改为返回或持有 `ll::event::EventId`（它内部持有 `std::string`，且可隐式转换为 `EventIdView`），或者确保源字符串的生命周期覆盖整个使用期间。此外，`0xC0000005` 代表 `EXCEPTION_ACCESS_VIOLATION`，不一定是空指针：`ExceptionInformation[0]` 为读写标志（0 为读、1 为写、8 为 DEP），`[1]` 为无法访问的目标地址；受编译器内联优化影响，dmp 文件中定位到的代码行可能会偏移到相邻语句。

*适用版本：LeviLamina 1.x 及以上（含 26.60.x）*

## LeviLamina mod 中写 `auto* bs = dynamic_cast<BedrockSpawner*>(&ll::service::getLevel()->getSpawner());` 导致崩溃（`vcruntime140.dll` `0xC0000005` 访问冲突），为什么？

BDS（Windows 版）在编译时未保留可用的 RTTI 信息，因此对 BDS 内部类型使用 `dynamic_cast` 会失败（返回 `nullptr` 或直接在 vcruntime 中崩溃）。`getSpawner()` 返回的是 `Spawner&`，对其取地址本身没有问题，只需将类型转换改用 `static_cast` 即可：`auto* bs = static_cast<BedrockSpawner*>(&ll::service::getLevel()->getSpawner());`（调用者需自行确保实际类型确实是 `BedrockSpawner`）。

*适用版本：LeviLamina 26.x（Windows BDS）。未能从源码或文档中直接证实，仅供参考。*

## hook 了某个 BDS 函数（例如活塞的红石更新函数），参数是无效地址导致崩溃，而同类其他方块的同名 hook 却正常，为什么？

请检查该函数在 LeviLamina 头文件中是否带有 `MCFOLD` 标记。`MCFOLD` 表示该函数被编译器进行了相同 COMDAT 折叠（Identical COMDAT Folding），其函数地址与其他函数共享。一旦 hook 该地址，就会同时拦截到多个不同函数的调用，传入的参数自然可能根本不是你预期的类型。标记为 `MCFOLD` 的函数依然可以调用或 hook，但在 hook 时必须自行判断调用来源（如检查 `this` 指针的实际类型或方块类型）及参数有效性（必要时可用 Windows API `IsBadReadPtr` 检查指针是否可读）。更稳妥的做法是改为 hook 未被折叠的上层或下层函数。

## 把服务端 mod 移植到 LeviLamina 客户端后，hook 里的代码运行异常/崩溃（异常在 MINECRAFT MAIN THREAD），怎么处理？

这通常是因为 hook 点位在非 `MC_SERVER` 线程（客户端还包含主线程、渲染线程等）中被触发了。绝大多数服务端侧的 MCAPI 只能在 `MC_SERVER` 线程中调用，因此需要在 hook 内先判断当前是否为服务端线程，再执行服务端逻辑。判断方法可参考 LegacyScriptEngine 的 `lse::api::thread::isServerThread()`：`auto instance = ll::service::getServerInstance(); return instance && std::this_thread::get_id() == instance->mServerInstanceThread->get_id();`；其事件实现（如 `src/lse/events/BlockEvents.cpp`）也是在回调中先检查 `if (isServerThread())` 再做处理的。另外，hook 中拿到的 `BlockSource` 可能属于客户端世界，应先通过 `blockSource.getLevel().isClientSide()` 进行判断（`BlockSource` 自身没有 `isClientSide()`，需通过 `Level`/`ILevel` 调用）。不要对客户端侧的 `BlockSource` 执行 `removeBlock` 等服务端操作（客户端的 `playerDestroy` 也不会生成掉落物）。

*适用版本：LeviLamina 客户端版*

## 自己编译的 LeviLamina mod 在事件监听中报错（如 `Error in Listener<ll::event::world::BlockChangedEvent>`）而官方 tests 无法复现，应该检查什么？

首先检查 mod 是否使用了 LeviLamina 的内存分配器（mimalloc）：官方模板在 `src/mod/MemoryOperators.cpp` 中包含了 `#include "ll/api/memory/MemoryOperators.h"`，缺失该头文件会导致跨 DLL 的内存分配与释放不一致，进而引发崩溃。如果包含后问题依旧，请删除项目中的旧 `.xmake` 缓存目录及 `build` 目录，然后重新执行 `xmake f` 配置并构建，以排除旧依赖或旧头文件的残留干扰。
