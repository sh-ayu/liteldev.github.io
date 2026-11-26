# LeviLamina 模组 API：命令

## LeviLamina mod 卸载/禁用时，注册的命令怎么注销？

不需要也无法手动注销。BDS 不支持真正删除命令，LeviLamina 也不提供注销命令的 API。禁用 mod 时，LeviLamina 会自动禁用该 mod 注册的命令重载（重新启用后恢复）。禁用后，客户端执行该命令会提示 `Command version mismatch`，这是预期行为。理论上可以过滤 `AvailableCommandsPacket` 使客户端不显示该命令，但 LeviLamina 本身不修改数据包。

*适用版本：LeviLamina 0.12 及以上*

## LeviLamina C++ mod 中如何在后台执行一条原版命令（如 `tag`），以服务器或玩家身份执行，并可选获取命令输出？

方式一（使用 LeviLamina 封装，可获取输出）：引入 `#include "ll/api/command/CommandRegistrar.h"`，构造一个 `CommandOrigin`（如 `ServerCommandOrigin` 或 `PlayerCommandOrigin`），然后调用 `CommandOutput out = ll::command::CommandRegistrar::getServerInstance().executeCommand("tag @a add foo", origin);`。该函数内部会先调用 `compileCommand` 再调用 `run`，执行结果保存在 `CommandOutput` 中。

方式二（直接调用 BDS，参考 LSE 的 `mc.runcmd` 实现）：

```cpp
CommandContext context(cmd, std::make_unique<ServerCommandOrigin>("Server", ll::service::getLevel()->asServer(), CommandPermissionLevel::Owner, 0), static_cast<int>(CurrentCmdVersion::Latest));
ll::service::getMinecraft()->mCommands->executeCommand(context, false);  // 第二个参数为 suppressOutput
```

若以玩家身份执行，将 origin 替换为 `std::make_unique<PlayerCommandOrigin>(level, player.getOrCreateUniqueID())`。命令字符串不需要前导 `/`。如需捕获输出，可参考 LSE 的 `runcmdEx` 实现（`compileCommand` + `command->run(origin, output)`）。相关头文件包括：`mc/world/Minecraft.h`、`mc/server/commands/MinecraftCommands.h`、`CommandContext.h`、`ServerCommandOrigin.h`、`PlayerCommandOrigin.h`、`CurrentCmdVersion.h`。命令必须在主线程中执行。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## LeviLamina 注册命令时，可选参数（如坐标 `CommandPosition` / `CommandPositionFloat`、字符串）怎么声明？怎么判断玩家是否填写了该参数？

在参数结构体中，用 LeviLamina 提供的 `ll::command::Optional<T>`（头文件 `ll/api/command/Optional.h`）包装字段，并在 overload 中调用 `.optional("字段名")` 声明；执行命令时，用 `params.xxx.has_value()`（或 `if (params.xxx)`）判断玩家是否填写了该参数，用 `.value()` 或 `.get()` 取值。例如：

```cpp
struct Params { std::string name; ll::command::Optional<CommandPositionFloat> pos; };
cmd.overload<Params>().required("name").optional("pos").execute(...);
```

坐标参数不要使用 `BlockPos`，应使用 `CommandPosition` 或 `CommandPositionFloat`。获取坐标时，应调用 `origin.getExecutePosition(version, params.pos.value())`（`Optional` 需先取值，`version` 为命令版本）或 `CommandPosition::getBlockPos(version, origin, offset)`，不要直接读取原始坐标，否则在 `/execute` 下获取的坐标会出错。如果需要完全不同的参数组合，也可以为同一命令注册多个 overload（含该参数与不含该参数各注册一个）。

*适用版本：LeviLamina 26.60.x*

## 开发 LeviLamina 客户端 mod 时，按文档写法在 `onEnable` 中注册命令不生效，客户端/服务端命令该怎么注册？

命令分为客户端命令和服务端命令：服务端命令通过 `ll::command::CommandRegistrar::getInstance(false)`（或 `getServerInstance()`）注册，客户端命令通过 `getInstance(true)`（或仅存在于客户端构建中的 `getClientInstance()`）注册。

客户端在游戏启动完成（出现主界面）时就会启用所有 mod，此时命令注册表尚未创建，因此在 `enable()` 中注册任何命令都会失败。正确做法是：

1. 监听 `ll::event::ServerCommandRegisterEvent`，在回调中注册服务端命令。
2. 监听 `ll::event::ClientCommandRegisterEvent`，在回调中注册客户端命令。

服务端（BDS）在世界加载完成后才启用 mod，因此可以直接在 `enable()` 中注册命令。此外，BDS 上只能注册服务端命令；本地世界中两类命令均可注册；多人游戏中只能注册客户端命令。

*适用版本：LeviLamina 客户端版 26.60.x*

## 能否在 LeviLamina mod 中屏蔽/删除某些已注册的命令（例如原版 `/me`、`/tell`、`/w`、`/msg`）？

LeviLamina 未提供删除命令的 API。对于原版命令，可以通过 hook 拦截其注册过程（`setup`）来屏蔽；但不要试图移除其他 mod 注册的命令，强行移除容易导致崩服。

如果只是为了防止玩家利用目标选择器（如 `/me @e`）刷屏或崩服，可以使用 LeviAntiCheat 的 `disableSelector` 配置，禁止玩家在命令中使用目标选择器。

*适用版本：LeviLamina 当前版本（hook 方式依赖 BDS 实现）。未能从源码或文档中直接证实，仅供参考。*

## 想用 LeviLamina 替换/扩展原版命令（如 `stop`、`effect`、`tp` 增加参数），需要先禁掉原版命令吗？会冲突吗？LSE 能做到吗？

不需要禁用原版命令（拦截原版命令的 `setup` 反而可能导致命令失效，甚至触发 `std::terminate`）。使用 LeviLamina 的 C++ 命令 API，调用 `ll::command::CommandRegistrar::getInstance(false).getOrCreateCommand("stop", ...)`（或 `getServerInstance()`）获取同名命令后，再用 `.overload<Params>()` 追加新的重载即可，新重载可与原版重载共存而不冲突；也可以注册新命令并通过 `.alias(...)` 设置别名。注意不要直接使用 `StopCommand::mServer`，它可能是空指针。

LSE（JS 插件）方面：旧版 NativeAPI 已被移除，但当前 LSE 的 `mc.newCommand` 内部同样调用 `getOrCreateCommand`。传入已存在的命令名时，会提示 `Runtime command ... already exists, changes will not be applied except for setOverload!`，即命令描述、权限等不会被修改，但仍可通过 `setOverload` 为该命令追加运行时重载。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina mod 中注册/执行命令时需要的命令版本（command version）应该填多少？出现 `Command version not matched` 是怎么回事？

执行或编译命令时，应使用当前最新版本 `CurrentCmdVersion::Latest`（头文件 `mc/server/commands/CurrentCmdVersion.h`），`CommandRegistrar::executeCommand` 和 `compileCommand` 的 `version` 参数默认值即为此项（调用 `getOrCreateCommand` 注册命令本身无需填写版本）。在命令回调中需要传入版本时（例如调用 `origin.getExecutePosition(version, pos)`），可直接使用命令实例自身的版本 `cmd.mVersion`，具体写法可参考 LeviLamina 源码 `src/ll/core/command/Teleport.cpp`。

此外，原版在“命令版本不匹配”和“未匹配到正确的重载”两种情况下都会输出 `Command version not matched`，因此出现该提示不一定是版本填错，也可能是重载匹配失败。在 BDS 26.32 适配初期，曾有用户反馈 LL 注册的重载触发此提示；如遇该问题，请先升级至最新版 LeviLamina 再行排查。

*适用版本：LeviLamina 26.60.x*

## BDS/LeviLamina 中注册的命令名只能是小写吗？

是的，受 BDS 命令系统限制，命令名必须全部使用英文小写字母。LeviLamina 的 `CommandRegistrar::getOrCreateCommand` 会直接将命令名传给 BDS 的 `CommandRegistry` 注册，不会自动转换大小写；而枚举值则会被 LL 自动转为小写。

## C++ 注册命令时 `CommandPermissionLevel` 各等级（`Any`/`GameDirectors`/`Admin`/`Host`/`Owner`/`Internal`，0~5）分别对应什么？OP 玩家是几级？

这些枚举名沿用自 Mojang 原版：

- 0 `Any`：普通成员。
- 1 `GameDirectors`：BDS 默认赋予 OP 的等级，命令方块也属于这一级。
- 2 `Admin`：高于 1 级，但游戏中几乎没有命令使用该等级。
- 3 `Host`：完整 OP，相当于单人存档房主的权限（例如 `/kick` 需要 3 级）。
- 4 `Owner`：控制台。
- 5 `Internal`：供内部使用，与 4 级基本无区别。

据用户反馈：被 deop 的玩家即使处于创造模式，也无法使用 `GameDirectors` 级命令；OP 可以使用 `GameDirectors` 级命令，但无法使用 `Admin`/`Host` 级；控制台无法使用 `Internal` 级。实际开发中常用的是 0/1/3/4 级。在 `server.properties` 中添加 `op-permission-level=4`（注意键名包含 `level`）可提高 OP 的权限等级，使 OP 在游戏内也能执行 `/stop` 等命令。

*适用版本：当前版本（权限行为取决于 BDS）。未能从源码或文档中直接证实，仅供参考。*

## LL 客户端中，mod 同时在服务端和客户端注册了同名命令（如 `/fm`），玩家执行时以谁为准？客户端命令应该在什么时机注册？

这取决于注册的是客户端命令还是服务端命令：客户端命令（`CommandRegistrar::getClientInstance()` / `getInstance(true)`）会覆盖服务端的同名命令（典型例子是 `help`）。

当前版本的 LeviLamina 已将命令注册改为事件驱动：客户端命令应在 `ll::event::command::ClientCommandRegisterEvent` 中注册，服务端命令应在 `ServerCommandRegisterEvent` 中注册（LL 自带的 `BuiltinCommands` 就是这样做的，每次触发时先调用 `registrar.clear()` 再重新注册）。这样在退出重进世界或进入其他服务器时，命令都会被正确重建。旧的做法（在 `ClientJoinLevelEvent` 或 `onEnable` 中注册，或把 client side 设为 `false` 绕过）已不再需要。

*适用版本：LeviLamina 26.10.0 及以上（客户端版）*

## LeviLamina 原生命令中拿到坐标参数后如何得到真实坐标？直接调用 `CommandPosition::getPosition` 有什么问题？

调用 `origin.getExecutePosition(cmd.mVersion, param.pos)` 即可直接得到 `Vec3` 坐标（需要整数坐标时再转为 `BlockPos`），无需自行处理相对坐标的 offset。`getExecutePosition` 内部会调用 `CommandPosition::getPosition`，而 `/execute` 上下文的 `CommandOrigin` 重写了该函数，因此如果自己直接调用 `getPosition`，在 `/execute` 下获取的坐标会出错。命令版本请传入 `Command::mVersion`。

注意，当前 `getExecutePosition` 的参数类型是 `CommandPositionFloat const&`，因此建议将参数结构体中的坐标字段声明为 `CommandPositionFloat`。具体写法可参考 LeviLamina 源码 `src/ll/core/command/Teleport.cpp`。

*适用版本：LeviLamina 0.11 及以上*

## LeviLamina 命令 overload 中，坐标（`Vec3`）类型的命令参数应该用什么类型？

在参数结构体中使用 `CommandPositionFloat`（或 `CommandPosition`，`CommandPositionFloat` 继承自 `CommandPosition`）。由于 `CommandOrigin::getExecutePosition` 接收 `CommandPositionFloat`，推荐使用 `CommandPositionFloat`。参数类型名沿用 Mojang 的命名，没有统一前缀，可在 mcwiki 查询命令参数类型名称，或参考 LeviLamina 的 `src/ll/core/command/Teleport.cpp`。

*适用版本：LeviLamina 0.11 及以上*

## LeviLamina 命令注册（`CommandRegistrar` / `overload`）中的 `.text()` 和 `.postfix()` 分别有什么作用，怎么用？

`text` 用于在命令中添加固定的字面量文本（关键字），例如 `/aa bb cc` 可写为 `cmd.overload().text("bb").text("cc").execute(...)`；它与 `std::string` 类型的参数不同。

`postfix` 用于给前一个参数添加后缀（将上一个参数设为后缀参数，原版仅支持整数后缀）。例如注册了 `xp.overload<XP>().required("value")...` 与 `xp.overload<XP>().required("level").postfix("l")...` 后，`/xp 1` 会匹配第一个重载，而 `/xp 2l` 会匹配第二个重载。

*适用版本：LeviLamina 0.11 及以上*

## LeviLamina 注册命令时 `command.overload().execute([](CommandOrigin const& origin, CommandOutput& output){...})` 中的 `origin` 和 `output` 分别是什么？logger 必须从入口类获取吗？

`origin`（`CommandOrigin`）代表命令的执行来源，可通过 `getEntity()`、`getName()`、`getOriginType()` 等方法得知是谁执行的命令；`output`（`CommandOutput`）用于返回命令执行结果，如 `output.success("...")` / `output.error("...")`（支持 fmt 格式化）。

logger 不必从入口 mod 获取：`ll::io::Logger` 不能直接构造，但可以通过 `ll::io::LoggerRegistry::getInstance().getOrCreate("名字")` 获取一个 `std::shared_ptr<Logger>` 供全局使用；仅在开发阶段需要的日志可使用 `debug` 级别。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 注册命令时，参数枚举只能逐个写死吗？想用可动态变化的枚举值（传数组）该怎么做？

使用软枚举（soft enum）。软枚举的值可以在运行时动态增删，典型例子是原版 `scoreboard` 命令的 `objectives` 参数。在 LL 中，可用 `ll::command::CommandRegistrar::getInstance(false).tryRegisterSoftEnum("名字", {值...})` 注册，之后通过 `addSoftEnumValues` / `removeSoftEnumValues` / `setSoftEnumValues` 动态修改；参数类型可使用 `ll::command::SoftEnum<T>`（`ll/api/command/SoftEnum.h`）。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 注册的自定义命令是否支持像原版 `/tp` 那样同一个命令字面量后接不同类型参数（如目标选择器或坐标）执行不同逻辑？

支持。通过 `CommandRegistrar::getOrCreateCommand` 获取 `CommandHandle` 后，多次调用 `overload<Params>()` 注册多个重载即可，每个重载都有独立的参数列表和 `execute` 回调。

注意重载之间的匹配优先级：例如在同一位置同时注册了 `<字符串>` 参数的重载和 `<枚举>` 参数的重载，解析时会始终匹配字符串重载。因此设计重载时，应避免让字符串参数吞掉其他类型。

*适用版本：LeviLamina 1.x 及以上*

## 在 LeviLamina mod 中如何让目标选择器（`@a`、`@p` 等）选不中某些玩家（如隐身玩家）？

可以 hook `CommandSelectorBase::newResults`（返回 `std::shared_ptr<std::vector<Actor*>>`），从原函数的返回结果中过滤掉不想被选中的玩家；这样目标选择器就无法选中这些玩家（如隐身玩家）。

*适用版本：LeviLamina 0.13.x 及以上（当前版本仍有该函数）*

## 在 LeviLamina 原生 mod 中注册命令时，物品、方块、效果等类型的参数（对应旧 LLSE 的 `ParamType.Item/Block/Effect`）该用什么类型？

不要参考 LL2 的实现，请查阅 LeviLamina 源码 `src/ll/api/command/runtime/ParamKind.h`。其中 `ParamKind::Kind` 枚举列出了运行时命令支持的所有参数类型，包括 `Item`、`BlockName`、`BlockState`、`Effect`、`ActorType`、`Actor`、`Player`、`BlockPos`、`Vec3`、`JsonValue`、`FilePath` 等，`ParamKindList` 则给出了对应的 C++ 类型（例如 `Effect` 对应 `MobEffect const*`）。

*适用版本：LeviLamina 0.11 及以上*

## 在 LeviLamina 命令回调 lambda 里使用 mod 的 logger 报错（`this` 未捕获 / 未找到匹配的重载函数），应该怎么在命令回调中输出信息？

命令回调中应使用回调参数的 `CommandOutput`（`output.success(...)` / `output.error(...)`，支持 fmt 格式化）向执行者输出信息，而不是用 logger。如果确实需要使用 logger，不要捕获 `this`，直接在 lambda 内通过 mod 单例获取，例如 `my_mod::MyMod::getInstance().getSelf().getLogger().info(...)`。

*适用版本：LeviLamina 0.11 及以上*

## 开发 LeviLamina mod 时，在哪里能找到注册 MC 命令等功能的示例代码？

首先可查阅官方文档的开发者指南：命令注册见“命令指南”（`developer_guides/how_to_guides/command_guide`，使用 `ll/api/command/CommandRegistrar.h` 中的 `CommandRegistrar::getInstance(false).getOrCreateCommand(...)`，再调用 `command.overload<Params>().required(...).execute(...)`），此外还有事件、表单、hook、i18n 等指南，以及 LeviLamina 仓库 `src-test` 目录下的测试代码（如 `src-test/server/testCommand.cpp`）。另外，大部分 LeviLamina mod 都发布在 lip 包索引上，可以找一个同类 mod 打开其源码仓库作为参考。

*适用版本：LeviLamina 1.x 及以上*

## mod 注册命令别名时，能占用其他 mod（甚至 LeviLamina 自带命令）的别名，这是 bug 吗？

别名是通过 `CommandHandle::alias()` 注册的，底层调用 BDS 的 `CommandRegistry::registerAlias`。LeviLamina 只会用 `findCommand` 检查该名称是否已是现有命令：若已存在则静默跳过、不予注册；至于别名与别名之间的冲突，则取决于 BDS 原版 `registerAlias` 的行为（可能是后注册的覆盖先注册的），LeviLamina 对此不做处理。编写 mod 时，请自行避免与已有的命令或别名重名。

*适用版本：当前 LeviLamina 版本。未能从源码或文档中直接证实，仅供参考。*

## mod 注册的命令，怎样才能让没有管理员权限的玩家看不到（不出现在命令补全里）？

注册命令时设置更高的权限等级，例如 `ll::command::CommandRegistrar::getInstance(false).getOrCreateCommand("mycmd", "描述", CommandPermissionLevel::GameDirectors)`（或 `Admin`、`Host` 等更高等级）。这样，权限不足的玩家既看不到也无法执行该命令。默认值 `CommandPermissionLevel::Any` 表示所有人可见。

*适用版本：当前 LeviLamina 版本*

## 用 LeviLamina C++ 注册一个名为 `whitelist` 的自定义命令后不生效/冲突，为什么？

BDS 原版的 `whitelist` 命令（`allowlist` 的别名）仍然存在，并未删除，注册同名命令会与其冲突，因此需要更换命令名。此外，原版白名单命令属于 4 级（控制台）权限命令。

*适用版本：LeviLamina 服务端（BDS），取决于原版 BDS 命令表。未能从源码或文档中直接证实，仅供参考。*

## 用 LeviLamina 给原版命令（如 `gamemode`）追加一个重载后直接崩溃或报错，怎么正确给原版命令加重载？runtime overload 是不是可以随时加的重载？

问题出在注册时机：命令重载必须紧跟在该命令注册后添加（即注册了 a 并接着注册 b 后，便不能再修改 a），否则会导致大批原版命令损坏。正确做法是 hook 对应命令的 `setup`，在原命令完成重载注册后立即添加（如果 `setup` 被内联，则可改为在下一个命令注册前添加）。至于 `runtimeOverload()`（`RuntimeOverload`），它是指跳过编译期参数类型检查、在运行时动态描述参数的重载，并非可以随时添加的重载。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 命令重载如何设置执行回调？`execute<fn>()` 写法还能用吗？

不能。自 0.12 起，以模板参数传入回调的 `execute<fn>()` 已改为以普通参数传入回调的 `execute(fn)`，其余用法不变。例如：

```cpp
cmd.overload<Params>().required("name").execute([](CommandOrigin const& origin, CommandOutput& output, Params const& params) { ... });
```

*适用版本：LeviLamina 0.12 及以上*
