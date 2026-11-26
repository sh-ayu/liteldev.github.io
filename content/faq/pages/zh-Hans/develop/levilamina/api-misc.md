# LeviLamina 模组 API：其他 API

## LeviLamina 原生 C++ mod 如何实现多语言（i18n）：语言文件放哪、如何加载、如何使用 `_tr`？

做法与 LeviLamina 本体一致：在代码中将英文硬编码为 key，再提供各语言的 JSON 翻译文件，随 mod 一起分发到 mod 目录下的 `lang/`（如 `lang/zh_CN.json`，内容如 `{"hello {}": "你好 {}"}`）。在 mod 的 `load()` 中调用 `ll::i18n::getInstance().load(getSelf().getLangDir())` 加载翻译。传入目录路径时会读取其中所有 `.json` 文件，文件名即语言代码；也可传入单个 JSON 文件，此时顶层键为语言代码。用法如下：

```cpp
#include "ll/api/i18n/I18n.h"
using namespace ll::i18n_literals;
int a = 114514;
"hello {}"_tr(a);
```

默认语言由 LeviLamina 的 `language` 配置项决定（默认为 `"system"`，即跟随系统）。当默认语言为 `zh_CN` 且已加载 `zh_CN` 翻译时，上述代码输出“你好 114514”；未找到对应翻译时则原样输出“hello 114514”。此外，也可用 `"hello {}"_trl("zh_CN", a)` 显式指定语言。`I18n.h` 还提供了 `LL_I18N_COLLECT_STRINGS` 宏，用于收集代码中所有的 `_tr` 字符串，便于生成翻译模板。打包时需确保 `lang` 目录一并复制到构建产物中：当前模板使用 levibuildscript 的 `modpacker` 规则（已移除旧模板的 `after_build.lua`），但 `modpacker` 只会将 dll、pdb 和 `manifest.json` 复制到 `bin/<modName>/`，不会复制 `lang` 目录。因此，需要在 `xmake.lua` 中自行添加 `after_build` 并用 `os.cp` 复制，或在发布时手动放入 mod 目录。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## LeviLamina 头文件里有些 `enum` 是空的、有些结构体（例如 `getIconInfo` 返回的 `ResolvedItemIconInfo`）只有构造函数没有成员，正常吗？需要自己补吗？

正常，mc 头文件由逆向工程自动生成。目前大部分类与结构体已生成成员布局：类型已知的成员声明为 `::ll::TypedStorage<对齐, 大小, 类型>`（如 `ResolvedItemIconInfo` 已包含 `mIconName`、`mIconFrame`、`mIconType` 等完整成员）；类型未知的成员声明为 `::ll::UntypedStorage<对齐, 大小>`，可通过 `.as<T>()` 按实际类型访问。不过，仍有部分 `enum` 缺少枚举值、部分类为空类（`{}`）。

遇到这些情况需要自行补全定义，可参考其他实现（如 Nukkit 系项目、协议文档）或自行逆向分析。

*适用版本：当前所有 LeviLamina 版本*

## LeviLamina 的 API 对裸指针有什么约定？`Player*` 之类还能用吗？可空的参数/返回值应该用什么？

LeviLamina 自身 API 的参数与返回值均不使用裸指针：原先的 `Player*` 等已改为 `Player&` 等引用；可能为空的非拥有引用使用 `optional_ref<T>`（定义于 `mc/deps/core/utility/optional_ref.h`，已由 `mc/_HeaderOutputPredefine.h` 引入，例如 `ll::service::getLevel()` 返回 `optional_ref<Level>`，`PlayerInfo::fromXuid` 返回 `optional_ref<PlayerInfoEntry const>`）；由 LL 管理所有权的对象则使用 `std::shared_ptr` / `std::unique_ptr` 等智能指针。

注意，mc 下由逆向生成的原版函数签名仍可能带有裸指针。

*适用版本：LeviLamina 0.6 及以上至当前版本*

## C++ mod 中如何自己构造一个 `ActorUniqueID`？

`ActorUniqueID` 是仅含一个 `int64 rawID` 成员的聚合结构体，直接聚合初始化即可：`auto id = ActorUniqueID{123};`。`ActorUniqueID{}` 会将 `rawID` 置为 0；注意 `ActorUniqueID id;` 不会初始化 `rawID`。若需要无效 ID，可使用 `ActorUniqueID::INVALID_ID()`。

## C++ mod 开发中，如何从 `ItemActor` 得到 `Actor`？能否用 `dynamic_cast`？

`ItemActor` 公有继承自 `Actor`，`ItemActor*` 可直接作为 `Actor*` 使用（隐式向上转型），无需额外转换。BDS 未开启 RTTI，因此无法使用 `dynamic_cast`。同理，`ItemStack` 继承自 `ItemStackBase`，要求传入 `ItemStackBase` 的 API 直接传入 `ItemStack` 即可。

## C++ 的 `switch` 不能直接对 `std::string` 做分支，开发 LeviLamina mod 时怎样避免写一堆 `if-else`？

可先将字符串哈希为整数，再使用 `switch`。LeviLamina 提供了 `#include "ll/api/utils/HashUtils.h"`，其中的 `ll::hash_utils::doHash(std::string_view)` 为 `constexpr` 函数，字面量运算符 `"xxx"_h` 为 `consteval` 函数（位于命名空间 `ll::literals::hash_literals`），可直接用于 `case` 标签：

```cpp
using namespace ll::literals;
switch (ll::hash_utils::doHash(str)) {
case "foo"_h: ...; break;
case "bar"_h: ...; break;
}
```

标准库的 `std::hash<std::string>{}(str)` 不是 `constexpr`，不能用于 `case` 标签。

*适用版本：LeviLamina 0.8 及以上*

## LL2（LiteLoaderBDS）中的 LLAPI（如 `Block` 相关接口、各类事件、NBT）在 LeviLamina 中还有吗？怎么找对应接口？

LeviLamina 并未一一保留 LL2 的 API，而是进行了重写或直接使用 BDS 原生类（LSE 正是基于 LeviLamina 移植而来）。其命名方式与 LL2 不同，可查阅 API 文档 <https://levimc.org/LeviLamina/api/>（例如 `Block` 类）；方块可通过 BDS 自身的方块注册表获取。LeviLamina 仅提供基础事件（见 `src/ll/api/event`），若需要 LL2 中的完整事件，可参考 LegacyScriptEngine 中整理好的 Hook 实现（`src/lse/events/*Hooks.cpp`）。不建议直接照搬 LL2 代码，参考 LSE 的实现更佳。

## LeviLamina 头文件中有些函数的参数没有名字（IDE 提示为空或只有一半参数名），是什么原因？

这些通常是新版 BDS 新增但尚未分析出参数含义的函数。由于头文件由工具自动生成，因此缺少参数名。你可以自行验证参数作用并向 LeviLamina 提交 Issue 反馈；采纳后会录入自动生成数据，后续版本的头文件便会附上参数名。

*适用版本：所有版本。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 头文件中标记为 `LLNDAPI` 的函数是什么意思？返回的 `ll::Expected<>` 有什么用？

`LLNDAPI` 即 `[[nodiscard]] LLAPI`，表示不应忽略函数的返回值。像 `ll::i18n::load` 这类返回 `ll::Expected<>`（即 `Expected<void>`）的函数，应当检查其返回值；出错时可通过 `.error().log(logger)` 输出错误信息，例如：

```cpp
if (auto res = ll::i18n::load(path); !res) res.error().log(getSelf().getLogger());
```

## LeviLamina 头文件中缺少需要的函数/符号/虚表，或者 `mUnk` 成员的类型不知道，该怎么办？

`mUnk` 成员的类型只能靠推测，或使用 IDA 等工具逆向分析。标记为 `MCNAPI` 的函数尚未导出，无法直接调用。若缺少函数、符号或需要明确成员类型，请前往 <https://github.com/LiteLDev/mcapi-requests/issues/new> 提交请求并附上缺失的符号。提交前，建议先在在线文档或最新头文件中确认该函数是否已恢复为 `MCAPI`。

## LeviLamina 有没有封装好的获取系统时间的函数？

有。头文件 `ll/api/utils/SystemUtils.h` 中的 `ll::sys_utils::getLocalTime()`（位于命名空间 `ll::inline utils::sys_utils`，可直接写作 `ll::sys_utils::`）返回 `ll::data::TmWithMs`（即 `std::tm` 加毫秒），无需自行封装。当前版本仍保留了该函数。

*适用版本：LeviLamina 0.13 及以上*

## LeviLamina 的 i18n 翻译字符串格式化语法是什么？

采用 `fmt::format` 语法（支持 `{}` 占位符、`{0}` 位置参数、具名参数、格式说明符等）。例如调用 `"key"_tr(arg1, arg2)` 时，可在翻译文本中用 `{}` 或 `{0}` 引用参数。

*适用版本：所有版本*

## 在 LeviLamina 原生 mod 中如何计算两个颜色的相似度（例如为地图画/像素画匹配方块颜色）？

LeviLamina 头文件中的 `mce::Color`（现位于 `src/mc/deps/core/math/Color.h`）提供了 `deltaE76`、`deltaE94`、`deltaE00` 以及 `distanceTo`（等价于 `deltaE00`）等函数。这些函数会先将 sRGB 转换至线性、XYZ、Lab 色彩空间再计算色差，可直接调用，也可参照其实现移植到其他语言。

制作地图画时，应获取方块的地图色而非方块本身的颜色：`BlockType` 带有 `getMapColor(BlockSource&, BlockPos const&, Block const&)` 虚函数和 `mMapColor` 成员，可通过遍历所有已注册方块来获取。获取到的 8 位十六进制颜色值末尾两位为透明度（`ff`），转换为 RGB 时将其去除即可。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 头文件中，斧头物品对应的类是哪个？

斧头对应的类是 `HatchetItem`（位于 `mc/world/item/HatchetItem.h`）。该类继承自 `DiggerItem`，搜索 `DiggerItem` 即可找到所有挖掘工具类物品。

*适用版本：LeviLamina 当前版本*

## LeviLamina 新版头文件中 `mc/deps/json/JsonHelpers.h` 找不到了，`JsonHelpers` 现在应该 include 哪个路径？

请改为 `#include "mc/util/JsonHelpers.h"`。头文件位置发生变动时，可直接在 LeviLamina 头文件中搜索对应类名。

*适用版本：LeviLamina 1.0.0 及以上*

## 开发 LeviLamina C++ mod 时如何方便地读取 Windows 注册表？

可以通过 xmake 引入第三方库 WinReg（<https://github.com/GiovanniDicanio/WinReg>）：在 `xmake.lua` 中添加 `add_requires("winreg")`，在 target 中添加 `add_packages("winreg")`，然后在代码中 `#include <WinReg/WinReg.hpp>` 并使用 `winreg::RegKey`。相比直接调用 Win32 API，这种方式更加简洁。

*适用版本：当前所有版本（Windows 平台）*
