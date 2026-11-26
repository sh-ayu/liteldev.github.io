# LeviLamina 模组 API：线程、调度与生命周期

## C++ mod 的 `unload` 应该怎么写？levilamina-mod-template 里被注释、带 TODO 的 `unload` 需要取消注释吗？

模板中的 `unload()` 默认是注释掉的，其中的 TODO 表示仅在需要支持卸载时才自行实现。如果没有把握，直接保持注释（即不实现 `unload`）即可。这样 LeviLamina 会拒绝卸载该 mod（提示 `The mod does not register an unload function`），不影响正常运行；你也可以实现该函数并直接 `return false` 来拒绝卸载。若要支持卸载，请注意：卸载时会释放 DLL，期间可能不执行 `atexit` 并强制结束线程。因此，所有线程都应使用线程池并在析构时 join，不要使用需要清理的全局变量，而应将所有状态都保存在 mod 对象中，并在 `unload` 内自行释放全部资源，否则会导致崩溃。事件监听会在禁用或卸载时由 LeviLamina 自动移除，命令也会自动禁用。

*适用版本：LeviLamina 0.9 及以上（当前所有版本）*

## LeviLamina 有没有直接获取服务器 TPS/MSPT 的 API？想在 mod 里常驻显示 MSPT/TPS，需要自己 hook tick 吗？怎么算？

LeviLamina 没有直接提供 TPS/MSPT API，但也无需自行 hook tick。旧版的 `ll::schedule`（`GameTickScheduler` / `ServerScheduler`）已移除，现在改用协程实现：在服务器线程执行器 `ll::thread::ServerThreadExecutor::getDefault()` 上运行循环，每次 `co_await 1_tick`（`ll::chrono::ticks`）后记录时间，相邻两次的时间差即为 MSPT，TPS = 1000 / MSPT（超过 20 按 20 计）；或者使用全局 tick 计数器，配合另一个每秒执行一次的协程取差值，得出每秒 tick 数。

协程用法可参考仓库中的 `src-test/common/ExecTest.cpp`。BDS 自身也有计时数据，可参考 `src/mc/profile/ProfilerLite.h` 中的 `ProfilerLite`。此外，也可以使用第三方前置（如 GMLIB）提供的 TPS 接口。

*适用版本：LeviLamina 1.x 至当前版本（26.60.x）*

## LeviLamina C++ mod 使用协程时，卸载/disable mod 导致服务端卡死或崩溃，如何正确停止协程、打断协程里的长时间 sleep？用 lambda 写协程时 lambda 析构导致崩溃怎么办？

必须确保所有协程在 mod 卸载前都已结束，具体做法如下：

1. 为 mod 单独创建一个执行器（如 `ll::thread::ThreadPoolExecutor`），将自己的协程都挂在该执行器上，并在 disable 时销毁它。
2. 在协程循环中检查停止标志（如类成员 `bool` / `std::atomic<bool>`）和 `ll::getGamingStatus()`，每次从 `co_await` 返回后都做检查，需要停止时直接 `co_return`。
3. 长时间 sleep 应使用可打断的等待：旧的 `ll::coro::InterruptableSleep` 已移除，请改用 `ll::coro::ConditionVariable`（`ll/api/coro/ConditionVariable.h`）。将其作为类成员，在协程中调用 `co_await cv.waitFor(时长, [&]{ return stop; })`；disable 时置位标志并调用 `cv.notifyAll()`（如果确定是在服务器线程上打断服务器线程的协程，可传入 `inplace=true`）。

注意，`this` 可能会先于协程析构，因此可以用 `shared_ptr` 管理实现对象，并让协程也持有一份。用 lambda 编写协程时，若 lambda 先析构，协程就会崩溃，此时可用 `ll::coro::keepThis` 将 lambda 拷贝进协程。此外，`ll::coro::CallbackTransformer` 可将回调转换为协程等待。

参考实现：<https://github.com/GroupMountain/GMSidebar/blob/develop/src/Sidebar.cpp>

*适用版本：LeviLamina 26.60.0 及以上（`ConditionVariable`）；`keepThis`、执行器、状态检查方案适用于 1.x 起所有版本*

## C++ mod 如何“可选依赖”另一个 mod（如 GMLIB）：不直接链接它，存在时才调用其导出函数？为什么 `GetProcAddress` 按函数名总取不到？LSE 脚本能调用吗？

做法：导出方使用 `__declspec(dllexport)` 导出函数；调用方在运行时调用 `GetModuleHandleA` 获取对方的模块句柄（取不到即视为未安装，跳过相关功能），再通过 `GetProcAddress` 获取函数指针。

C++ 函数存在名称修饰（name mangling，clang-cl 与 MSVC 使用同一套修饰规则），导出表中的名称是形如 `?xxx@@...` 的修饰名，需要用 `dumpbin /exports`（或 `llvm-objdump`）查出完整的修饰名再传给 `GetProcAddress`。如果导出方由你自行控制，可用 `extern "C"` 导出以避免名称修饰。不推荐通过基址 + RVA 的方式硬编码。常规开发中，更推荐直接引入对方的包进行调用。

LSE 脚本插件若要调用 C++ 接口，需要通过 RemoteCall（LegacyRemoteCall）等方式添加依赖；如果不想添加依赖，就只能让对方执行命令（`mc.runcmd`）。

## C++ mod 中在 load 阶段调用 `ll::service::getLevel()` 然后 `static_cast<ServerLevel&>` 调用 `getNewUniqueID()`，出现 `0xC0000005` 空指针崩溃，如何正确获取 `Level`？

`Level` 要等 BDS 读取完存档后才存在，而 mod 的 `load()` 是在打开存档之前执行的，此时 `ll::service::getLevel()` 会返回空的 `optional_ref`。应当先判断 `getLevel()` 是否有值，并将相关逻辑移至 `enable()` 阶段（或之后的事件）中执行：LeviLamina 会在服务器线程启动（`ServerScriptManager::onServerThreadStarted`）后才调用 `enableAllMods`，此时 `Level` 已就绪。

*适用版本：当前版本（服务端）*

## C++ mod 中有异常连 `try/catch` 都拦不住（例如访问违例），该怎么捕获？

访问违例属于 Windows SEH 结构化异常，`catch (std::exception&)` 这类按类型匹配的 catch 无法捕获。可靠的做法是使用 `__try/__except`（MSVC 与 clang-cl 均支持；`__try` 所在的函数内不能包含需要析构展开的 C++ 对象，也不能与 C++ 的 `try` 混用，可将危险调用封装到一个单独的小函数中）。

注意：官方 mod 模板的 `xmake.lua` 虽然添加了 `/EHa`，但它使用的是 clang-cl 工具链，且随后又为 `clang_cl` 追加了 `/EHs`，因此不要指望 `catch (...)` 一定能捕获 SEH 异常。对于能够被 catch 捕获的 C++ 异常，可以使用 `ll::error_utils::printCurrentException(logger)`（`ll/api/utils/ErrorUtils.h`）打印异常信息。不过，发生访问违例通常说明代码本身存在问题，应当修复根因，而不是依赖异常捕获继续运行。

*适用版本：Windows 平台 LeviLamina mod（MSVC）*

## LeviLamina C++ mod 中 `ll::memory::dAccess` 怎么用？怎么按偏移取类成员（例如从 `Minecraft` 对象中拿 `mSimTimer`）？

`dAccess` 的模板参数填成员类型，第一个参数填对象地址，第二个参数填字节偏移：`ll::memory::dAccess<T>(ptr, offset)`，返回 `T&`。注意，IDA 中显示的 `this+27` 这类偏移如果是以 QWORD（8 字节）为单位，换算成字节偏移时需要乘以 8（27*8 = `0xD8`）；如果该位置存放的是指针，模板类型应写为指针类型，取出后再解引用。偏移量只能加一次，重复相加会导致 `0xC0000005` 访问冲突。偏移量与游戏版本相关，不能跨版本照搬。

此外，在当前 LeviLamina 的头文件中，`Minecraft` 已直接以 `TypedStorage` 形式声明了成员 `mSimTimer`（`Timer&`），可直接通过 `minecraft.mSimTimer` 访问，无需手动计算偏移；如需调整 tick 速率，可调用 `Minecraft::setSimTimeScale`，或直接修改 `Timer` 的 `mTimeScale`。

*适用版本：当前版本（偏移值随游戏版本变化）*

## LeviLamina C++ mod 中如何输出日志？`std::cout` 似乎没有输出。

在服务端，`std::cout`、`print` 和 `fmt::print` 都能正常输出，但推荐使用 mod 自身的 `ll::io::Logger`：

```cpp
ll::io::Logger& logger = MyMod::getInstance().getSelf().getLogger();
logger.info("...");
```

其中 `MyMod` 是你自己的 mod 主类（模板中 `getSelf()` 返回 `ll::mod::NativeMod&`）。在客户端，需要先开启控制台（终端）窗口才能看到输出。

## LeviLamina C++ mod 中能否修改服务器 TPS（加速/减速/暂停游戏刻）？

可以。`Minecraft` 对象内部包含模拟计时器（`mSimTimer`，类型为 `Timer&`，`Timer` 中含有 `mTimeScale`），并提供了虚函数 `setSimTimeScale(float scale)` 和 `setSimTimePause(bool pause)`，可用于加快、减慢或暂停游戏刻，例如 `ll::service::getMinecraft()->setSimTimeScale(2.0f);`（`getMinecraft()` 返回 `optional_ref<Minecraft>`，使用前需先判断其是否有效）。

有用户反馈原版对倍率有限制（约为 0.1 倍到 10 倍），若想突破该限制，需要自行修改 `Timer` 的相关逻辑。此外，也可以通过手动循环调用 `ll::service::getLevel()->tick()` 来强制多执行 tick，但不推荐这样做。

*适用版本：当前版本（服务端）*

## LeviLamina C++ 插件如何支持热卸载/重载？如何在 hook 函数外部取消 hook？

原生 mod 要支持热卸载和重载（如 `ll unload` / `ll reload`），必须自行实现 unload 函数：使用 `LL_REGISTER_MOD` 时，只要在 mod 类中提供 `bool unload()`，该函数就会被注册；否则 LeviLamina 会报错 `The mod does not register an unload function`，且只能在关服时卸载。

使用 `LL_AUTO_TYPE_INSTANCE_HOOK` 等 hook 宏时会定义一个 hook 类名。在 unload（或 disable）中直接调用该类的 `unhook()`（如 `MyHook::unhook()`），即可在函数外部取消 hook；非 `AUTO` 的宏则需要手动调用 `MyHook::hook()` / `MyHook::unhook()`。此外，智能指针、`new` 分配的内存、`std::function`、线程、事件监听等资源的生命周期都必须在 unload 中清理干净，否则卸载时会崩溃。如果不清楚如何处理，请不要编写 unload。

## LeviLamina C++ 插件必须定义 `load`/`enable`/`disable`/`unload` 这几个函数吗？`DllMain` 还能用吗？

当前版本使用 `LL_REGISTER_MOD(类, 实例)` 注册时，只有 `bool load()` 是必须实现的（有 `static_assert` 检查）；`enable`、`disable`、`unload` 均为可选，实现了才会被注册。未实现 `disable` 时，禁用操作会直接成功；未实现 `unload` 时，mod 无法热卸载（执行 `ll unload` / `reload` 会报错 `The mod does not register an unload function`），只能随关服卸载。除非非常熟悉 C++ 生命周期管理，否则不要实现 `unload`。

`DllMain` 仍会被调用，但不建议使用，因为调用时机过早：`DllMain` 阶段不保证 LL API 可用，`load` 阶段不保证游戏 API 可用，直到 `enable` 阶段两者才都可用。LL mod 应以 `load` 作为入口点，否则就等同于 PreLoader 插件了。

## LeviLamina mod 中不用 `getSelf().getLogger()` 的话，怎么创建一个 logger？

当前版本中，`ll::io::Logger` 的构造函数是私有的（`PrivateTag`），不能再直接通过 `ll::Logger logger("MyMod");` 构造，而应通过日志注册表获取或创建：

```cpp
auto logger = ll::io::LoggerRegistry::getInstance().getOrCreate("MyMod");
```

该函数返回 `std::shared_ptr<ll::io::Logger>`，之后即可调用 `logger->info("...")` 输出日志。当然，也可以继续使用 `getSelf().getLogger()`（返回 `ll::io::Logger&`）。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina mod 中有一个涉及文件操作、不希望被拷贝的全局对象，把它传给 `cmd.overload().execute(lambda)` 和 `eventBus.emplaceListener<Event>(lambda)` 的 lambda 使用时，需要用 `std::ref` 吗？

不需要。全局（静态存储期）对象可在 lambda 中直接使用，无需捕获；局部对象则可使用引用捕获 `[&obj]`，两者都不会产生拷贝。`std::ref` 并非用于 lambda 捕获的工具。只需保证对象的生命周期长于回调（即命令或监听器存在期间）即可。可以将拷贝构造函数设为 `delete` 或 `private`，以验证确实没有发生拷贝。这是 C++ 语言规则，与 LeviLamina 版本无关。

*适用版本：所有版本*

## LeviLamina native mod 中 `load`、`enable`、`disable`、`unload` 这几个生命周期函数的调用顺序和区别是什么？

调用顺序为 `load` -> `enable` -> `disable` -> `unload`。使用 `LL_REGISTER_MOD` 注册的 mod 类中，只有 `load()` 是必须实现的（`bool load()`），`enable`/`disable`/`unload` 均为可选（实现了才会绑定）。如果在服务器运行期间加载 mod，`load` 成功后会立即调用 `enable`；热卸载（`unload`）时，则会先调用 `disable`，再调用 `unload`。当前版本为 v26.60.8。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 模组中用 logger 输出时如何拼接参数？

LeviLamina 的 logger（`ll::io::Logger`）中的 `info`/`warn`/`error`/`debug` 等方法均支持 fmt 风格格式化，可直接写作 `getSelf().getLogger().info("检查到玩家 {} 加入服务器!", ev.self().getRealName());`，无需手动拼接字符串。变量类型可以用 `auto` 推导，例如 `auto& player = ev.self();`。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 的 `logger.info` 输出包含换行符的多行文本时，后续行没有时间前缀，该怎么处理？

`Logger` 每次调用只格式化一条消息，并按格式在整条消息前添加一次时间、级别和标题前缀，不会在字符串内部的换行处补加前缀。如果需要每行都带前缀，请先按行拆分字符串（例如使用 `std::istringstream` + `std::getline`，或 `ll::string_utils::splitByPattern`），再逐行调用 `logger.info`。此方法适用于 `ll::io::Logger`。

*适用版本：所有版本*

## LeviLamina 的协程能利用多核 CPU 吗？

可以。协程本身不决定在哪个线程上执行，而是由启动或恢复它的 Executor 决定。LeviLamina 提供了 `ll::thread::ThreadPoolExecutor`（继承自 `ll::coro::Executor`，可指定线程数，也可直接使用 `ThreadPoolExecutor::getDefault()`），通过 `task.launch(executor)` 将 `ll::coro::CoroTask` 提交到线程池执行，即可利用多核 CPU。需要回到主线程操作游戏对象时，请使用 `ll::thread::ServerThreadExecutor`。注意，BDS 的游戏 API 大多不是线程安全的。

*适用版本：LeviLamina 1.x 及以上*

## 一个 mod DLL 同时用于客户端和服务端时，如何判断当前是在客户端还是服务端加载？

使用 `ll/api/Versions.h` 中的 `ll::isClient()`，即可判断 mod 当前是由客户端还是服务端加载。

如果在客户端中还需要区分是本地世界（作为房主，内置服务端正在运行）还是作为普通玩家连接远程服务器：由于 `Level::isClientSide` 不可靠，可以使用 `ll::service::getMinecraft()`（默认获取服务端实例，`isClientSide=false`）或 `ll::service::getServerInstance()`。能获取到实例，说明存在本地服务端逻辑；获取不到，则说明只是客户端在连接远程服务器。

*适用版本：LeviLamina 1.9 及以上（含客户端支持的版本）*

## 使用 LeviLamina 的协程（`ll::coro`）时，`co_await 1s` 竟然让主线程阻塞了一秒，是怎么回事？应该如何正确启动协程？

这是因为照抄测试代码，误用了 `syncLaunch`。`syncLaunch` 会在当前线程上阻塞等待协程执行完毕并返回结果。

正常启动协程使用 `CoroTask::launch(executor)` 即可，它是异步的；`launch` 还提供了带回调的重载 `launch(executor, callback)` 用于获取返回值（无回调版本默认传入 `[](auto&&){}`）。只有确实需要同步等待结果时才应使用 `syncLaunch`。

*适用版本：LeviLamina 1.0 及以上*

## 在 C++ mod 中使用延迟任务（定时/延迟执行）时，回调 lambda 不执行或行为异常，可能是什么原因？

请检查 lambda 的捕获方式：延迟任务会在稍后执行，如果使用引用捕获 `[&]` 捕获了局部变量，实际执行时这些变量早已销毁，从而产生悬垂引用，导致行为异常。将其改为值捕获（`[=]` 或显式按值捕获，必要时使用 `shared_ptr` / `weak_ptr` 延长生命周期或判断对象是否仍然存在）即可解决。

当前版本的 LeviLamina 推荐使用协程实现延迟任务，例如：

```cpp
ll::coro::keepThis([player = ...]() -> ll::coro::CoroTask<> {
    co_await 20_tick; // 或 co_await 1s;
    // ...
}).launch(ll::thread::ServerThreadExecutor::getDefault());
```

同样需要注意，lambda 捕获的对象在 `co_await` 之后是否仍然有效（例如玩家可能已经下线）。

*适用版本：当前所有 LeviLamina 版本（旧的 schedule/DelayTask API 已被 `ll::coro` 取代）*

## 在 LeviLamina 原生 C++ mod 里使用 cpp-httplib 启动 HTTP 服务（`listen 0.0.0.0`）后，玩家无法连接服务器、连 MOTD 都没有了，为什么？

这是因为在主线程中调用了 `listen`。`httplib::Server::listen` 是阻塞调用，会卡住 BDS 主线程，导致服务器无法响应。应在独立线程（如 `std::thread`）中运行 `server.listen`，并在 mod disable 或卸载时调用 `server.stop()` 并 `join` 该线程；切勿在主线程中调用 `listen`。

## 照着 LeviLamina 官网指南复制示例代码写 mod，用 `self` 时编译报错，怎么改？

旧版指南中的 `self` 写法已经过时。请改用当前模板的写法：在构造 `MyMod` 类时，将 `ll::mod::NativeMod::current()` 返回的实例保存到成员变量 `mSelf`，再通过 `getSelf()` 获取，例如 `MyMod::getInstance().getSelf().getLogger().info("...")`。最省事的做法是直接使用 `levilamina-mod-template` 新建项目。

*适用版本：LeviLamina 1.x 及以上*

## 服务器上某个（可能闭源的）mod 一直往控制台刷日志，能不能不改它的源码就屏蔽或过滤掉？LeviLamina 会内置这种功能吗？

由于会带来性能开销，LeviLamina 官方不会内置此类过滤功能，需要自行编写 mod 实现。在当前日志系统下，可以通过 `ll::mod::ModManagerRegistry::getInstance().getMod("mod名")` 获取目标 mod，再调用其 `getLogger()` 获取 logger；如果该 mod 自行创建了 logger，则使用 `ll::io::LoggerRegistry::getInstance().tryGet("logger 标题")` 获取。拿到 `ll::io::Logger` 后，既可以调用 `setLevel(...)` 提高输出等级，也可以使用 `setSink` / `removeSink` / `clearSinks` 替换或移除其 sink（例如替换为自行实现的带过滤功能的 sink）。旧版日志系统中 hook `ll::OutputStream::print` 的方法已不再适用。

*适用版本：LeviLamina 1.x 及以上（新日志系统 `ll::io::Logger`）*

## 自己写的第三方 mod 加载器（如 .NET loader）注册的 mod，用 LeviLamina 的查询 API 获取不到，怎么办？

只要按标准方式注册就都能获取到。实现一个继承自 `ll::mod::ModManager` 的管理器，并通过 `ModManagerRegistry::addManager` 注册；加载时调用 `addMod(name, mod)` 将 Mod 对象加入管理器，卸载时调用 `eraseMod(name)`。Mod 对象归 `ModManager` 所有，LeviLamina 不会自动代管。具体实现可参照 LeviLamina 自带的 `NativeModManager`。注册完成后，即可通过 `ModManagerRegistry::getManagerForMod`、`ModManager::getMod` 等接口查询。

*适用版本：LeviLamina 1.x 及以上（Plugin 已更名为 Mod）*
