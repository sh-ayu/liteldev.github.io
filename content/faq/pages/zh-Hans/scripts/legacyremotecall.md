# LegacyRemoteCall

## C++ mod 用 LegacyRemoteCall（`RemoteCall::exportAs`）导出函数给 LSE 脚本时，参数/返回值用 `std::variant` 编译失败，报 `static_assert` "Unsupported Type"，怎么办？

RemoteCall 的参数和返回值仅支持一组固定类型，包括 `bool`、`std::string`、`nullptr_t`、整数/浮点数（`NumberType`）、`Player*`/`Actor*`/`BlockActor*`/`Container*`、坐标（`WorldPosType`/`BlockPosType`）、`ItemType`、`BlockType`、`NbtType`，以及由这些类型组成的 `std::vector` 和 `std::unordered_map<std::string, T>`。它不支持 `std::variant`，因此会触发 `static_assert(is_supported_type_v<...>, "Unsupported Type")`。

解决办法是将参数改为受支持的类型。最简单的做法是把数据序列化为 JSON 字符串（`std::string`）传递，由接收方解析；也可以自己编写模板为 variant 实现类型转换（理论上可行，但较为繁琐）。

此外，数字传给 JS 时会按 double 转换（LSE 中使用 `Number::newNumber(v.get<double>())`），`long long` 等大整数可能会丢失精度，必要时请改用字符串传递。

*适用版本：LegacyRemoteCall 当前所有版本（至 0.23.x）*

## LeviLamina 下 C++ mod 如何把接口公开给其他插件（尤其是 LSE 的 JS 脚本插件）调用？

可以使用 LegacyRemoteCall（RemoteCall）：在 C++ mod 中调用 `RemoteCall::exportAs("命名空间", "函数名", 函数)` 导出函数，JS 侧则通过 `ll.imports("命名空间", "函数名")` 导入后调用（可先用 `ll.hasExported` 判断函数是否存在；若在 JS 中导出函数，则使用 `ll.exports(func, "命名空间", "函数名")`，注意函数位于第一个参数）。具体导出方式可参考 GMLIB-LegacyRemoteCallApi（LRCA），命名空间与函数名建议采用类似 `Actor.getName` 这样易于辨认的形式。纯原生 mod 之间也可以直接用 `dllexport` 导出函数互相调用，或通过网络通信等方式对接。注意，LeviLamina 本体不内置 RemoteCall，该功能由独立的 LegacyRemoteCall 模组提供（LSE 依赖该模组）。

*适用版本：LeviLamina 当前版本；LegacyRemoteCall 当前版本；LSE 当前版本*

## LSE 中用 `ll.exports` 导出的异步函数，别的插件通过 `ll.imports` 导入后能否 await 拿到异步返回值？

不能。远程调用（`ll.exports`/`ll.imports`）是同步执行的：被调函数的返回值会立即打包（转换为 `RemoteCall::ValueType`）并返回给调用方，Promise 无法跨插件传递，因此调用方无法通过 await 获取异步结果；如果被调函数发生阻塞，还会连带阻塞服务器主线程。如需获取异步结果，请改用其他方式，例如由对方在任务完成后调用你导出的另一个回调函数、写入数据库/文件，或通过事件通知。

*适用版本：LSE 当前所有版本*

## LSE 插件中用 `ll.imports("命名空间", "函数名")` 调用其他插件导出的函数时报错（如函数未导出），如何先判断该导出函数是否存在？

先调用 `ll.hasExported(namespace, name)` 检查目标函数是否已导出，再调用 `ll.imports` 获取的函数（若未导出直接调用，会报错 `Fail to import! Function [ns::name] has not been exported`）。此外，RemoteCall 的参数必须支持类型转换，不能将函数（`kFunction`）或 `ByteBuffer` 作为参数传递，否则会抛出 `Unsupported Type`。排查问题时，可在每一步添加 logger 输出，并用 `typeof` 检查返回值。

*适用版本：LSE 当前所有版本*

## LeviLamina 下的 RemoteCall（`ll.exports`/`ll.imports` 跨插件调用）支持哪些参数类型？能传 Player、方块、物品等对象吗？

可以。当前版本的 LegacyRemoteCall + LSE 支持以下类型：null、字符串、数字、布尔值、数组、普通对象（按键值递归转换），以及 Player、Entity、Item、Block、BlockEntity、Container、FloatPos、IntPos、NbtCompound 等游戏对象。不支持函数和 `ByteBuffer`。如果接收方插件无法识别这些游戏对象类型，也可以改传 uuid/xuid、坐标 JSON 或 SNBT 字符串等。

*适用版本：LSE 0.x 正式版及以后*

## RemoteCall（LegacyRemoteCall）导出/调用的函数参数可以使用 `std::pair` 类型吗？

仅支持特定的 `std::pair` 类型：`std::pair<Vec3, int>`（会转换为 `WorldPosType`，对应 JS 的 FloatPos，即坐标+维度 ID）和 `std::pair<BlockPos, int>`（会转换为 `BlockPosType`，对应 IntPos）。GMLIB-LegacyRemoteCallApi 中的坐标参数正是采用这种方式传递的。其他任意类型的 `std::pair`（如 `std::pair<std::string, int>`）均不受支持，会触发 `Unsupported Type` 编译错误。

*适用版本：LegacyRemoteCall 当前所有版本*

## LSE 中看到的 `LLSEGlobal` 是什么？

调用 `ll.exports`、`ll.imports` 或 `ll.hasExported` 时，如果未指定命名空间（只传入了函数名），系统会自动使用默认命名空间 `LLSEGlobal`。

*适用版本：LSE 当前所有版本*

## LegacyRemoteCall（RemoteCall）是什么，用来解决什么问题？新 mod 应该依赖它吗？

LegacyRemoteCall 用于导出函数以供跨插件调用，主要方便 LSE 的 JS/Lua 插件调用 C++ mod 导出的函数（即 `ll.exports`/`ll.imports` 的底层实现）。它是 LegacyScriptEngine 的配套组件（LSE 依赖它），定位是兼容旧版 LLSE 生态。维护者建议，新的原生 mod 不要强制依赖 RemoteCall；如需向脚本提供接口，可单独编写一个可选的外置模块来负责导出。

*适用版本：当前版本（LegacyRemoteCall 0.23.x）*

## 旧 LLSE 中跨插件导入导出函数（`ll.export`/`ll.import`）在 LeviLamina 里由哪个模块实现？插件加载顺序/依赖又该如何声明？

在 LL2 中，该功能由 LL 本体和 ScriptEngine 提供；在 LeviLamina 中，则由 LegacyRemoteCall（<https://github.com/LiteLDev/LegacyRemoteCall>）和 LSE 共同提供：函数表保存在 LegacyRemoteCall 中（存储为 `std::function<ValueType(std::vector<ValueType>)>`），而脚本侧的 `ll.exports`/`ll.imports` 则定义在 LSE 中（`ll.export`/`ll.import` 为兼容别名）。LeviLamina 采用模块化设计，插件的依赖关系与加载顺序在 `manifest.json` 中声明，支持 `dependencies`（必需依赖）、`optionalDependencies`、`loadBefore`、`conflicts` 等字段。

*适用版本：LeviLamina 当前版本；LSE 当前版本*

## 装了 GMLIB-LegacyRemoteCallApi 后依赖 GMLIB 的插件仍报缺少前置，怎么办？

GMLIB 与 GMLIB-LegacyRemoteCallApi 并非同一组件（后者只是供 LSE 脚本插件调用的 RemoteCall 接口层）。你还需要安装 GMLIB 本体：可前往 <https://github.com/GroupMountain/GMLIB-Release> 下载，或在服务器根目录下执行 `lip install github.com/GroupMountain/GMLIB-Release`。

*适用版本：使用 GMLIB 的 LeviLamina 服务器*

## 升级后 LSE 的 nodejs 等支持库装不上/加载报错，提示 LegacyRemoteCall 相关问题怎么办？

这是因为 LegacyRemoteCall、LegacyScriptEngine 与 LeviLamina 的版本不匹配，需要让三者版本配套。当前 LSE 的 `lip.toml` 已将 LegacyRemoteCall 声明为依赖（例如 LSE 0.23.x 依赖 LegacyRemoteCall 0.23.* 与 LeviLamina 26.60.*），使用 lip 安装或更新时会自动拉取匹配版本：可执行 `lip update`（或 `lip update github.com/LiteLDev/LegacyScriptEngine`）更新包；如需更换 LeviLamina 本体版本，请使用 `lip setup`。如果采用手动安装，请务必同时替换 LegacyRemoteCall。具体命令以当前版本的 lip 为准。

## 用 RemoteCall 导出函数/事件给 LSE 调用时，能调用但报错 `bad variant access`，是什么原因？

`bad variant access` 表示参数或返回值的实际类型与 `RemoteCall::exportAs` / `importAs` 声明的类型不匹配（底层使用 `std::get` 从 `std::variant` 中取值，类型不符时便会抛出 `std::bad_variant_access`）。请检查 JS 侧传入的类型是否与 C++ 导出函数的签名一致。此外，基础数值类型（以及 `WorldPosType`、`BlockPosType` 等转换类型）的参数不能声明为引用（`int&` 或 `const int&` 均不可），必须改为按值传递；新版 `RemoteCallAPI.h` 已对从 `NumberType` 等转换结果中提取引用的操作添加了 `static_assert`，这类写法会直接导致编译报错（自 0.21.1 起，使用引用参数会在编译期报错）。

*适用版本：LegacyRemoteCall 当前版本*

## GMLIB 能正常加载，但 GMLIB-LegacyRemoteCallApi（LRCA）加载失败，是什么原因？

这通常是版本不配套所致：GMLIB、GMLIB-LegacyRemoteCallApi、LegacyRemoteCall、iListenAttentively、LegacyScriptEngine 与 LeviLamina 本体的版本不匹配。请将 LeviLamina 及所有相关依赖一并更新到相互匹配的版本，切勿遗漏。当前 LRCA 的 manifest 声明依赖了 GMLIB、LegacyRemoteCall、iListenAttentively 和 ModAPI，缺少其中任何一个或版本不符都会导致加载失败。此外，LRCA 属于 passive 模组，只有在其他模组或脚本插件声明依赖它时才会被加载。

## 加载插件时报错 `[GMLIB-LegacyRemoteCallApi] setUnknownBlockCleaner is not implemented`，GMLIB 的清理未知方块 API 怎么了？

GMLIB 已移除 `setUnknownBlockCleaner`（清理未知/错误方块）功能。LRCA 仅保留了一个空壳导出，调用时会输出 `setUnknownBlockCleaner is not implemented`，因此插件中依赖该接口的功能将无法生效。如需清理未知方块，请改用 GMEssentials（GME）：<https://github.com/GroupMountain/GMEssentials-Release/>

*适用版本：GMLIB-LegacyRemoteCallApi 当前版本*

## LSE 插件调用 GMLIB 等通过 GMLIB-LegacyRemoteCallApi 导出的接口（例如 `translateString`）失效，明明已经装了 LegacyRemoteCallApi，为什么？

GMLIB-LegacyRemoteCallApi 是 passive 模组，仅在其他模组或插件声明依赖时才会加载。请在插件 `manifest.json` 的 `dependencies` 中添加该依赖，例如：

```json
"dependencies": [{ "name": "GMLIB-LegacyRemoteCallApi" }]
```

依赖项中的 `version` 字段可以省略（省略时匹配任意版本），填写则表示限制版本范围。
