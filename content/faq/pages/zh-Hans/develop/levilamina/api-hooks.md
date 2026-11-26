# LeviLamina 模组 API：Hook 与内存

## LeviLamina mod 的 disable/unload 里需要手动 unhook 吗？用 `AUTO` 宏注册的 hook 会自动卸载吗？

`AUTO` 系列宏（如 `LL_AUTO_TYPE_INSTANCE_HOOK`）会生成一个全局 `HookRegistrar` 对象，在构造时挂钩（hook）、析构时卸载（unhook）。当 mod 卸载（unload）时，DLL 被释放，静态对象随之析构，这些 hook 会自动卸载，因此无需在 unload 中手动编写 unhook 代码。

但禁用（disable）mod 并不会释放 DLL，hook 依然生效。如果需要支持热重载或运行时禁用再启用（即 disable 后让 hook 失效），必须在 disable 中调用 `DEF_TYPE::unhook()`，并在 enable 中调用 `DEF_TYPE::hook()`，或者改用非 `AUTO` 宏手动管理。若无需支持热重载，则可以省去这些代码。此外，所有 hook 都会在游戏退出时自动卸载。

*适用版本：LeviLamina 0.13 及以上*

## 如何在 LeviLamina 中 hook 游戏（BDS）函数？有没有教程？

可以使用 LeviLamina 在 `ll/api/memory/Hook.h` 中提供的 hook 宏，包括实例函数宏 `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`、静态函数宏 `LL_TYPE_STATIC_HOOK` / `LL_AUTO_STATIC_HOOK`，以及带 `_EX` 后缀的变体。带 `AUTO` 的宏会自动注册，非 `AUTO` 的宏则需要手动调用 `XXXHook::hook()` 注册，并在卸载时调用 `unhook()`。

你可以参考官方教程 <https://levimc.org/zh-Hans/LeviLamina/developer_guides/how_to_guides/hook_guide/>（旧的 `lamina.levimc.org` 链接会自动重定向），也可以查阅 LegacyScriptEngine 等官方 mod 源码中的 hook 写法。

*适用版本：LeviLamina 当前版本*

## 写 LeviLamina hook 需要哪些信息？要 hook 的 BDS 函数声明/符号去哪里找？

编写一个 hook 需要以下信息：hook 名称（`DEF_TYPE`）、优先级、所属类型（`TYPE`）、目标函数标识（`IDENTIFIER`，通常为成员函数指针如 `&ScreenView::render`，或符号字符串）、返回类型以及参数列表。

BDS 的类与函数声明可以在 LeviLamina 仓库自带的反编译头文件中查找：服务端及通用部分位于 `src/mc`，客户端专有部分位于 `src-client/mc`（<https://github.com/LiteLDev/LeviLamina/tree/main/src/mc>）。注意，头文件中标记为 `MCNAPI` 的函数尚未导出，目前不可用，无法直接引用；如有需要，请前往 <https://github.com/LiteLDev/mcapi-requests> 提交申请。

此外，官方还提供了“查找函数”指南：<https://levimc.org/zh-Hans/LeviLamina/developer_guides/how_to_guides/find_function_guide/>。

*适用版本：LeviLamina 当前版本*

## LeviLamina 头文件中很多类的构造函数只有声明没有实现（编译 mod 报缺少构造函数符号/提示不可用），mod 里要构造这个类该怎么做？能不能把虚表填 `nullptr`？

头文件中带有 `// prevent constructor by default` 注释、只声明未实现的构造函数，是为了统一防止意外构造。原构造函数通常已被内联，无法确定其中是否包含特殊逻辑，因此默认禁用；如果连构造函数符号都不存在，也可能是被编译器优化掉了。

若确实需要构造该类，只能经人工判断后自行实现：可以在 mod 代码中补全该构造函数的实现，或将类声明复制出来自行定义并实现构造逻辑。如果选择自行定义该类，必须同时实现其虚函数，切勿将虚表填为 `nullptr`，否则其他 mod 在 hook 或直接调用虚函数时会引发崩溃。

此外，受 Mojang 要求，LeviLamina 采用了 API 白名单机制。如果缺少所需的符号（包括构造函数），需要前往 <https://github.com/LiteLDev/mcapi-requests> 提交 issue 申请，维护者会在后续版本中添加（LL 的 CHANGELOG 中经常有“Added constructor for ...”之类的更新记录）。

*适用版本：LeviLamina 26.60.x*

## LeviLamina 没有提供某些上层 API（如拦截原版网络包、修改方块渲染），事件系统里也没有网络包事件，原生 mod 要怎么实现？

LeviLamina 提供的上层 API 较少，缺失的功能需要自行 hook 游戏函数来实现。LeviLamina 源码的 mc 目录（`src/mc`、`src-server/mc`、`src-client/mc`）包含了 MC 的头文件，可在其中查找对应的类和函数，再配合 LL 的 hook 宏（如 `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`）进行拦截。

例如，要拦截服务端收到的原版数据包，可以 hook `ServerNetworkHandler` 中对应包类型的 `handle(NetworkIdentifier const&, XxxPacket const&)`；客户端的包处理则位于 `ClientNetworkHandler` / `LegacyClientNetworkHandler`（`src-client`）。对于渲染相关的修改（如连接纹理），可参考其他开源 mod 的渲染逻辑，在渲染过程中进行 hook 并替换材质。

*适用版本：LeviLamina 当前版本（hook 目标随 BDS 版本变化，需自行核对头文件）*

## C++ mod 中使用带 `AUTO` 的 hook 宏（如 `LL_AUTO_TYPE_INSTANCE_HOOK`）后，又手动调用了 `hook()`，导致回调被重复执行、出现异常，为什么？

带 `AUTO` 的 hook 宏会生成一个 inline 的 `HookRegistrar` 静态对象，在 DLL 加载时自动执行一次 `hook()`。如果再手动调用 `Hook::hook()`，就会造成重复挂钩，导致回调函数被重复执行。

因此，使用 `AUTO` 宏时切勿再手动调用 `hook()`。若需自行控制挂钩时机，请改用不带 `AUTO` 的宏（如 `LL_TYPE_INSTANCE_HOOK`）并手动调用 `hook()`/`unhook()`，或者使用 `ll::memory::HookRegistrar<Hook1, Hook2...>` 统一管理（内置引用计数，可避免重复挂钩）。

*适用版本：LeviLamina 1.x 及以上*

## C++ mod 开发中，只有 `HopperBlockActor` 时如何获取漏斗指向的方块（需要 `BlockSource`）？例如实现漏斗物品计数器。

可以参考 trapdoor 的实现思路：先 hook `HopperBlockActor` 的 `tick(BlockSource& region)`，从参数中获取 `BlockSource` 并临时保存起来。漏斗会在 tick 过程中触发 `setItem(int slot, ItemStack const& item)`；按照调用顺序，tick hook 中保存的 `BlockSource` 正好对应当前正在执行 `setItem` 的漏斗。接着，调用 `BlockActor::getPosition()` 获取漏斗位置，并结合漏斗方块的朝向（方块状态），即可计算出它所指向的方块位置。

*适用版本：LeviLamina（依赖 BDS 内部调用顺序）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina C++ mod 中照抄 LL 源码写的 hook（如 `LL_TYPE_INSTANCE_HOOK`）编译通过却没有任何效果，原因是什么？`AUTO` 与非 `AUTO` 的 hook 有何区别，能否卸载？

hook 宏的第一个参数 `DEF_TYPE` 是所生成结构体的名称，在同一命名空间下不能与 LeviLamina 内置的 hook 或其他 hook 重名，修改名称即可解决冲突。

带 `AUTO` 的宏（如 `LL_AUTO_TYPE_INSTANCE_HOOK`）会在加载时自动调用 `hook()` 完成注册；不带 `AUTO` 的宏（如 `LL_TYPE_INSTANCE_HOOK`）则必须手动调用 `DEF_TYPE::hook()` 注册，否则不会生效。两者均可通过调用 `DEF_TYPE::unhook()` 手动卸载，且所有 hook 在 Minecraft 卸载时也会自动卸载。在 hook 函数体内，如果不调用 `origin(...)`，就相当于拦截了原函数（此时若返回类型非 `void`，需返回相应的值）。详情请参考 `src/ll/api/memory/Hook.h` 与官方 hook 指南。

## LeviLamina 中 hook 一个成员函数用了 `STATIC_HOOK`，结果在日志/调用处报错崩溃，应该用哪种 hook 宏？

成员函数包含隐式的 `this` 指针，必须使用 `INSTANCE_HOOK` 系列宏（如 `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`），而不能用 `STATIC_HOOK`。`STATIC_HOOK` 系列仅适用于静态函数或自由函数。详见 LeviLamina 官方文档站的 hook 指南（开发者指南 `how_to_guides/hook_guide`）。

*适用版本：所有版本*

## LeviLamina 写 hook 时，目标函数名带 `$` 前缀和不带有什么区别？

带 `$` 前缀的名称代表虚函数的具体实现（如 `&Player::$attack`）。hook 虚函数时必须使用带 `$` 的名称，例如 `LL_TYPE_INSTANCE_HOOK(..., ServerNetworkHandler, &ServerNetworkHandler::$handle, ...)`；而非虚函数则直接使用常规名称（`&ClassName::method`）。

*适用版本：所有版本*

## LeviLamina 是否支持通过特征码（signature）查找函数并 hook？还有哪些开发中常被忽略的功能？

支持。`ll/api/memory/Signature.h` 提供了 `SignatureView` 以及 `"..."_sig` / `"..."_sigp` 字面量（可通过 `SignatureView::resolve()` 解析地址）。在使用 Hook 宏（如 `LL_AUTO_TYPE_INSTANCE_HOOK`）时，目标函数标识除了可以填写符号或成员函数指针外，也可以直接传入 `SignatureView` 特征码。

此外，还有一些常被忽略的实用功能：

- `ll/api/memory/Memory.h` 中的 `virtualCall`：按虚表索引调用虚函数。
- `ll/api/reflection`：反射机制，可直接将结构体序列化为配置。
- `ll/api/Config.h`：提供 `ll::config::loadConfig` / `saveConfig`，基于反射读写 JSON 配置，无需手动解析。

这些功能的文档较少，建议直接阅读源码了解用法。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 的 Hook 有优先级，如果高优先级的 Hook 直接 return 而不调用 `origin`，低优先级的 Hook 还会被触发吗？

不会。同一函数上的多个 Hook 按 `HookPriority` 组成调用链，优先级高的先执行（`Highest`=0 … `Lowest`=400）。每个 Hook 必须调用 `origin(...)`，才会进入下一个（优先级更低的）Hook，并最终到达原函数。如果高优先级 Hook 不调用 `origin` 就直接返回，调用链就会中断，低优先级 Hook 和原函数都不会执行。

*适用版本：所有版本*

## LeviLamina 的 hook 宏（如 `LL_AUTO_TYPE_INSTANCE_HOOK`）写在函数里报错（括号后红色波浪线），为什么？

hook 宏本质上会展开为一个结构体（类型）定义（包含 `inline static` 成员、模板特化等），只能写在命名空间或全局作用域中，不能放在函数体内。请将宏移到函数外定义；如果使用非 AUTO 版本（`LL_TYPE_INSTANCE_HOOK`），可以在需要时通过 `Hook::hook()` / `unhook()` 或 `ll::memory::HookRegistrar` 手动注册。

*适用版本：所有版本*

## 在 LeviLamina mod 中实现树叶快速腐烂时，hook/调用 `Block` 的 `randomTick` 虚函数对树叶无效，为什么？

树叶的随机刻逻辑并不是通过 `BlockType` 的虚函数 `randomTick` 实现的。`LeavesBlock` 有自己的非虚成员函数 `randomTick(BlockEvents::BlockRandomTickEvent&)`（新版已将随机刻改为事件形式，并拆分了腐烂逻辑）。因此，需要先将 `BlockType` `static_cast` 为 `LeavesBlock`，再调用或 hook 这个非虚的 `LeavesBlock::randomTick`。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 中 hook 一个类的构造函数，返回值写成 `void` 后运行报错/崩服，构造函数的 hook 应该怎么写？

hook 构造函数时，目标应为头文件中的 thunk 函数 `&Type::$ctor`。因为构造完成的对象地址是通过返回值传递的，所以返回值必须写成指针（与 `$ctor` 的声明一致，目前为 `void*`），并返回原函数的结果。写成 `void` 会破坏返回值，进而导致崩溃。示例：

```cpp
LL_AUTO_TYPE_INSTANCE_HOOK(DedicatedServerCtorHook, ll::memory::HookPriority::Normal,
    DedicatedServer, &DedicatedServer::$ctor, void*) {
    return origin();
}
```

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 的 hook 宏（如 `LL_TYPE_INSTANCE_HOOK` 等）里，`TYPE` 参数为什么有时要用全局命名空间限定（写成 `::ClassName`）？

`TYPE` 是被 hook 函数所属的类型，宏展开后会用于 `TYPE::*` 成员指针和继承等处。使用 `::ClassName`（全局命名空间限定）可以避免与当前命名空间下的同名类型冲突（例如你的 mod 命名空间里也定义了同名类）。平时不加一般也没问题，遇到名称冲突或解析错误时再加 `::` 即可。如果想了解细节，可以直接展开 hook 宏查看生成的代码（位于 `src/ll/api/memory/Hook.h`）。示例：<https://github.com/engsr6982/CustomWorldGenerator/blob/main/src/Hooks/structure.cpp>

*适用版本：LeviLamina 当前版本*

## 开发 MCBE Windows 客户端 mod 时，hook 了 `WeatherManagerProxy::$getRainLevel`、`LevelRendererCamera::calcRainState` 等函数并写入 `WeatherRenderObject.mDensityRain`，却看不到天气变化。怎样实现只在客户端本地显示的天气？

可以 hook `Weather::$levelEvent`，先判断当前是否为本地世界，再决定是否执行原逻辑。例如：

```cpp
if (auto client = ll::service::getClientInstance()) {
  if (auto info = client->getGameConnectionInfo(); info && info->mType == Social::ConnectionType::Local) {
    return origin(type, pos, data);
  }
}
```

注意：在最新头文件中，`Weather::$levelEvent` 标记为 `MCNAPI`（无导出符号），需要先用特征码定位再 hook。

*适用版本：LeviLamina 客户端（src-client）mod。未能从源码或文档中直接证实，仅供参考。*

## 多个 LeviLamina 客户端 mod（如回放、小地图、BetterRenderDragon）hook 同一个函数产生冲突怎么办？

如果各个 mod 都通过 LeviLamina 的 hook 宏挂钩同一函数（并在 hook 内调用 `origin` 原函数），一般可以共存；但如果某个 mod 采用特征码扫描或直接修改字节等方式，就可能因为函数开头已被其他 hook 修改而发生冲突。此时可以调整加载顺序，在 mod 的 `manifest.json` 中使用 `dependencies`、`optionalDependencies`、`loadBefore` 等字段让特定 mod 先加载。此外，同一函数上多个 hook 的执行先后顺序也可以通过 `HookPriority` 调整。

*适用版本：LeviLamina 当前版本*

## 如何在 LeviLamina 插件中检测玩家签名书本时的书名（例如书名为特定值时执行逻辑）？

书本的编辑和签名在客户端完成后，会通过 `BookEditPacket` 发送给服务端，因此可以 hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, BookEditPacket const&)`。在最新版本中，`BookEditPacket` 继承自 `ll::PayloadPacket<BookEditPacketPayload>`，其 payload 的 `mOperation` 是一个 `std::variant`（包含 `ReplacePage`、`AddPage`、`DeletePage`、`SwapPages`、`Finalize`）。签名操作对应 `BookEditAction::Finalize`，其中的 `mTitle`、`mAuthor`、`mXuid` 分别为书名、作者名和 xuid。相关头文件：`src/mc/network/packet/BookEditPacketPayload.h`、`src/mc/network/packet/book_edit_action/Finalize.h`。

*适用版本：LeviLamina 26.60.x*

## 如何拦截玩家用南瓜头搭建铁傀儡？

hook `BlockPatternMatcher::match(::BlockPos const& pos) const`，判断 `this->mData`（类型为 `BlockPatternData const&`，包含 `mPattern` 图案）是否为铁傀儡的建造图案；如果是，将返回的 `BuildMatch` 中的 `mMatched` 改为 `false`。注意，该函数在最新头文件中标记为 `MCNAPI`，需要用特征码定位。

*适用版本：LeviLamina 当前版本*

## 开发 LeviLamina mod 时，需要的函数被内联了，或者是 `MCFOLD`（被合并的相同函数），该怎么调用或 hook？

如果函数被内联，只能寻找更底层的调用方式：像 `getXxx` 这类 getter 经常被内联，有的会变成直接访问成员变量，有的则需要通过其他方法获取。`MCFOLD` 则表示编译器对该函数与其他函数进行了相同代码折叠（Identical COMDAT Folding），使多个函数共用同一份实现。因此，hook 这类函数时必须在内部判断调用来源。推荐检查 `this` 的虚表指针，确认属于目标类后再执行自己的逻辑。要弄清具体有哪些调用方，可以使用 IDA 分析。

*适用版本：LeviLamina 当前版本*

## 想 hook 基岩版的日志输出函数来拦截游戏日志，hook 了某个函数却输出一堆乱七八糟的内容，该 hook 哪个函数？

这是因为找错了函数（hook 到了类似 `Util::format` / `formatWide` 的格式化函数，其调用处极多）。正确的做法是像 LeviLamina 一样 hook `BedrockLogOut`（声明于 `mc/common/Globals.h`：`void BedrockLogOut(uint const _priority, char const* pszFormat, ...)`）。具体写法可参考 LeviLamina 源码 `src/ll/core/tweak/ModifyInfomation.cpp` 中的 `BedrockLogOutHook`（`LL_STATIC_HOOK(BedrockLogOutHook, HookPriority::Normal, BedrockLogOut, void, uint priority, char const* pszFormat, ...)`）。

## 想在 LeviLamina mod 里阻止活塞/移动方块推动旁观者模式玩家，应该 hook 哪个函数？为什么拦截了服务端后移动方块仍会推动玩家？

服务端活塞推动实体的逻辑最终都会经过 `PistonBlockActor::moveEntityLastProgress`（`PistonBlockActor::_moveCollidedEntities` / `_moveCollidedEntitiesHelper` 也走这一路径），可以在这里拦截。但移动方块（moving block）推动实体属于客户端也会自行计算的逻辑：即使拦截了多余的 `MoveDeltaActor` 包、让服务端活塞不再推动，移动方块在客户端依然会推动玩家。要彻底解决只能修改发包方式（例如针对旁观者单独处理，改用直接发送 `setBlock` 等方式）。

*适用版本：当前 LeviLamina 版本*

## 想用 LeviLamina 监听/拦截玩家做表情（emote），hook 了 `Player` 的虚函数 `playEmote` 却从服务器启动起就一直被循环调用，应该 hook 哪里？

不要 hook `Player::playEmote`，服务端该虚函数槽位只是占位符，并不对应真正的表情处理。应当 hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, EmotePacket const&)`，并在 hook 内通过 `thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId)` 获取对应玩家（写法与 LeviLamina 的 `PlayerChatEvent` 实现相同）。需要拦截时，不调用 `origin` 直接 `return` 即可。由于服务端对该包的处理本质上是转发给其他玩家，拦截后就只有发送者自己在本地能看到动作。

*适用版本：当前 LeviLamina 版本*

## 新版 BDS 里，原来在 `ScriptActorEventListener` 这类类里 hook 的函数找不到了，该去哪里找？

Mojang 每隔几个版本就会把 `Script****EventListener` 里的部分函数挪到对应的 `Script****GlobalEventListener` 中，例如 `ScriptActorEventListener` 的函数就被移到了 `ScriptActorGlobalEventListener`。找不到时，直接去对应的 `Global` 版本里查找即可（位于 `mc/scripting/modules/minecraft/events/` 目录）。

*适用版本：BDS 26.40 及以后（LeviLamina 26.x）*

## 新版 BDS（clang 编译）里，传送门生成猪灵的函数 `PortalBlock::trySpawnPigZombie` 被内联了，mod 想拦截或修改这段逻辑怎么办？

`SpawnChecks::canSpawnPigZombieFromPortal` 带有 `MCAPI` 导出，仍然可以 hook，但拿不到坐标；坐标需要通过 hook `PortalShape::evaluate` 获取。按维护者建议，在 hook 中应先调用 `origin`，再接自己的实现，不要提前 `return`，因为该函数后面紧接着就是原始实现。目标函数被内联后，通常需要像这样同时 hook 两个函数来配合实现。

*适用版本：BDS 26.20+（LeviLamina 26.x）*

## 新版 BDS 头文件里找不到 `LevelChunk::tick`，要 hook 区块 tick 该用什么？

该函数已改名为 `LevelChunk::tickImpl(BlockSource& tickRegion, Tick const& tick, std::function<void()> spawnerCallback)`，比原来多了一个与刷怪相关的回调参数。只需改为 hook `tickImpl` 并按新签名调整参数即可。遇到函数被内联或改名的情况，也可以改为 hook 其上层调用函数。

*适用版本：BDS 1.21.6x 及以后（LeviLamina 26.x）*

## 给 LeviLamina 提 PR 还原被内联掉的函数（以 LLAPI 形式实现）时，如果该函数只在服务端存在、客户端没有（或两端符号不同），应该怎么处理？

客户端与服务端的函数集并不相同。对于仅服务端需要的还原实现，请用平台宏 `#ifdef LL_PLAT_S ... #endif` 包裹（客户端宏为 `LL_PLAT_C`），使其仅在服务端编译。手写声明应放在自动生成区块之外，并用 `LLAPI`/`LLNDAPI` 标注，函数定义则写在同目录的 `.cpp` 文件中。确认还原无误后，请删除原有的 `MCAPI` 声明。修改 PR 时直接推送到原分支即可，无需关闭重开。

*适用版本：LeviLamina 当前版本（双端构建）*

## 能否只取消攻击中的暴击判定（其他逻辑不变），比如把原版暴击改成纯随机暴击率？

LSE 的攻击事件只能拦截整次攻击，无法单独取消暴击（若在 LSE 中处理，只能先拦截攻击，再自行计算减伤并调用 `hurt` 造成伤害）。在 C++ 中，可以 hook `Player::attack(Actor&, ActorDamageCause const&, Player::AttackParameters const&)`，将 `parameters` 中的 `mCanCrit` 设为 `false` 即可取消原版暴击，随后再自行实现暴击率逻辑（也可以借助 `iListenAttentively` 导出给 LSE 的接口来实现）。

*适用版本：LeviLamina 当前版本*
