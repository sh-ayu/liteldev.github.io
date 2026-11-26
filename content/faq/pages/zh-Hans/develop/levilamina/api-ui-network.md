# LeviLamina 模组 API：表单、数据包与网络

## LeviLamina 客户端 mod 怎样绘制自己的界面？有统一的 ImGui hook 吗？

LeviLamina 没有提供统一的 ImGui hook，也没有封装原版的 JsonUI/OreUI。维护者建议不要去 hook 系统层（DX/窗口）来自己接入 ImGui，而是直接接入 MC 自身的渲染/UI：LL 客户端提供了 `ll::event::BeforeUIRenderEvent` / `AfterUIRenderEvent`（可获取 `ScreenView` 和 `MinecraftUIRenderContext`），可以在事件中用 MC 的 UI 渲染上下文进行绘制。MC 的相关 API 都在 `src-client/mc` 头文件中，可直接调用（JsonUI/OreUI 需自行实现，其中 OreUI 因 Mojang 未开源部分库而较难实现）。此外，也可以参考 Amethyst 等客户端 mod 框架的示例。

注：LL 的 `ll::form` 以及新的 `ll::ui`（数据驱动 UI/DDUI 表单，见 data_driven_ui_guide）是服务端向玩家发送表单的 API，并非客户端自绘界面的封装。

*适用版本：LeviLamina 客户端版 26.60.x*

## LeviLamina 有没有绘制线框（如显示碰撞箱、领地范围）的 API？能否像结构方块那样在客户端显示边框？

LeviLamina 本身没有调试图形/线框 API。结构方块的边框是硬编码的，不建议去拆解复用。

服务端推荐使用 OEOTYAN 的 BedrockServerClientInterface（BSCI，<https://github.com/OEOTYAN/BedrockServerClientInterface>，也可在 <https://levimc.org/mods/github.com/OEOTYAN/BedrockServerClientInterface/> 获取）来绘制调试图形和线框，PLand 等领地插件的范围显示就是基于它实现的。

若要在客户端 mod 中自行绘制，则需要接入游戏渲染：LL 客户端的 `BeforeUIRenderEvent` / `AfterUIRenderEvent` 是基于 hook `ScreenView::render` 实现的，可以监听这些事件或自行 hook 渲染函数。

*适用版本：LeviLamina 26.x（BSCI 已发布 v26.60.0 适配当前版本）*

## 服务端 mod 如何给玩家发送只包含翻译键（可带参数）的文本，让客户端按自身语言翻译显示？自定义键名怎么办？

发送 `Translate` 类型的 `TextPacket`，例如：

```cpp
TextPacket pkt{};
pkt.mLocalize = true;
pkt.mBody = TextPacketPayload::MessageAndParams{TextPacketType::Translate, "my.key", {"参数1", "参数2"}};
pkt.sendTo(player);
```

客户端会使用本地语言文件进行翻译。原版键名可以直接使用；自定义键名则必须通过资源包将语言文件（`texts/*.lang`）下发给客户端（服务器可通过 `resource_packs` 强制下发），因为客户端只能从资源包加载语言文件。无需使用 `BinaryStream` 手写数据包，协议格式可参考 Mojang 官方协议文档。第三方前置（如 GMLIB）也提供了相关 API。

*适用版本：当前 LeviLamina 版本（26.x）*

## LeviLamina 原生（C++）mod 如何自定义数据包，实现客户端 mod 与服务端 mod 互相通信？

LeviLamina 自 1.9.0 起内置了自定义数据包支持（`ll/api/network`）。当前用法如下：

- 继承 `ll::network::PacketBase<T>` 并实现 `write` / `read` 来定义数据包（继承即自动注册）。
- 继承 `ll::network::PacketHandlerBase<Handler, Packet>` 并实现 `handlePacket(NetworkIdentifier const&, NetEventCallback&, ll::network::PacketSide side, Packet const&)` 来处理数据包。
- 发送数据包时，客户端发往服务端使用 `packet.sendToServer()`，服务端发往客户端使用 `packet.sendTo(player)`、`sendToClient(networkId, subClientId)` 或 `sendToClients()`。

如果需要在运行时动态注册（例如用于脚本引擎），请使用 `ll::network::PacketRegistrar::getInstance()`。自 26.60 起，还可以声明 `CustomPacketId`、`PacketVersion`、处理端 `Side` 以及 `Optional`；缺少必需数据包的一端会在登录时被断开连接。

*适用版本：LeviLamina 1.9.0 及以上（`handlePacket` 签名与 `Side`/`Optional` 为 26.60.0 及以上）*

## BDS 数据包（`Packet`）类的 `write` 函数是做什么的？什么时候会被调用？`read` 又是什么？

`write(BinaryStream&)` 用于将数据包序列化并写入 `BinaryStream`，在发送数据包时调用；`read(ReadOnlyBinaryStream&)` 则用于从 `ReadOnlyBinaryStream` 读取数据并反序列化到 `Packet` 对象，在接收数据包时调用（具体的数据包类实现的是纯虚函数 `_read`，由 `read` 在内部调用）。

## `ll::form::ModalForm` 构造函数只接收标题、内容、两个按钮文本，回调放哪？按旧教程写 lambda 报 `No viable conversion ... to 'Callback'` 怎么办？

回调函数应在调用 `sendTo(player, callback)` 时传入。`ModalForm::Callback` 的签名为 `void(Player&, ll::form::ModalFormResult, ll::form::FormCancelReason)`，其中 `ModalFormResult = std::optional<ModalFormSelectedButton>`，`FormCancelReason = std::optional<ModalFormCancelReason>`。后两个参数都是 `optional`，使用前需先判断是否有值。最简单的写法是：`form.sendTo(player, [](Player& player, ll::form::ModalFormResult result, ll::form::FormCancelReason reason) { ... });`（参数类型也可以用 `auto`）。如果写错了参数类型（例如直接写成 `ModalFormSelectedButton` 而非 `optional`），就会出现上述类型转换错误。详情可参考官方表单指南 `developer_guides/how_to_guides/form_guide`。

*适用版本：LeviLamina 0.11 及以上*

## LeviLamina C++ mod 中修改了玩家某个背包槽位的物品后，为什么用发送 `InventorySlotPacket` 而不是调用 `refreshInventory` 来同步给客户端？

`Mob::refreshInventory()` 会调用 `sendInventory(true)` 并通过 `sendArmor` 发送全部盔甲槽，这会刷新整个背包和盔甲栏；而 `InventorySlotPacket` 只更新单个容器槽位（`mInventoryId`、`mSlot`、`mItem`），网络数据量更小。因此，只修改单个物品时发送 `InventorySlotPacket` 更加合适。

另外，`Actor::getPlayerOwner()` 这类函数返回的是指针（`Player*`），可能为 `nullptr`（例如被强制生成的无主鱼钩）。直接调用玩家相关函数会导致空指针崩溃，使用前应先判空。

## LeviLamina C++ mod 中如何编写表单（Form）？有没有官方教程？

官方文档提供了表单指南：<https://levimc.org/zh-Hans/LeviLamina/developer_guides/how_to_guides/form_guide/>（涵盖 `SimpleForm`、`ModalForm` 和 `CustomForm`，均通过 `sendTo` 发送并传入回调），API 参考见 `api_reference/form`。此外，也可以参考 LegacyScriptEngine 中表单 API 的实现代码。

## LeviLamina C++ 中发送 `CustomForm`（含 `appendDropdown`）给玩家，点提交正常，但玩家点右上角 X 关闭表单时服务器闪退，为什么？

`CustomForm` 的回调签名是 `void(Player&, CustomFormResult const&, FormCancelReason)`，其中 `CustomFormResult` 的类型为 `std::optional<std::unordered_map<std::string, CustomFormElementResult>>`。当玩家点击右上角的 X 关闭表单时，结果为空（即 `std::nullopt`，同时 `FormCancelReason` 有值）。如果代码直接通过 `result->at("playerName")` 或 `std::get<std::string>(...)` 取值，就会因访问空的 `optional` 或不存在的 key 而抛出异常或崩溃。

正确的做法是在回调中先判空（`if (!result) return;` 或检查 `cancelReason`），再用 `find`/`contains` 确认 key 存在，并通过 `std::get_if` 判断类型后再取值。另外，传入 `appendDropdown` 的选项数组不要为空。

## LeviLamina C++ 表单 `CustomForm` 中 `appendStepSlider` 的回调结果是什么类型？

与返回序号的 LSE 不同，在 LeviLamina C++ 中调用 `ll::form::CustomForm::appendStepSlider(name, text, std::vector<std::string> steps, defaultVal, tooltip)` 后，回调结果 `CustomFormResult`（`std::unordered_map<std::string, CustomFormElementResult>`）中对应的值是所选项的字符串本身（即存放在 `std::variant<std::monostate, uint64, double, std::string>` 中的 `std::string`），而不是索引。当前 v26.60.8 依然如此。

取值示例：

```cpp
std::get<std::string>(result->at("name"))
```

*适用版本：LeviLamina 0.11 及以上*

## LeviLamina 中的数据包（Packet）结构体是否完整，能否自己构造并发送数据包？

可以。LeviLamina 已补全了大量数据包结构体（位于 `mc/network/packet/` 下的数百个头文件中），能够满足自行构造并发送数据包的需求。构造完成后，可调用 LL 为 Packet 提供的发送方法，如 `packet.sendTo(player)`、`sendTo(actor)`、`sendTo(pos, dimId)`、`sendToClients()` 等。

## LeviLamina 的 `CustomForm` 只能有一个提交按钮吗？能加其他按钮吗？

传统表单 `ll::form::CustomForm` 只能通过 `setSubmitButton(text)` 设置一个提交按钮，无法添加多个按钮。如果需要多个按钮或更复杂的交互，可以使用基于 DDUI（数据驱动 UI）的新接口 `ll::ui::CustomForm`（头文件 `ll/api/ui/form/CustomForm.h`）。该接口支持通过 `button(label, callback, options)` 添加多个按钮，提供 `closeButton()`、`textField()`、`toggle()`、`dropdown()` 等控件，并通过 `show()` / `showAsync()` 显示。使用 DDUI 接口需要客户端和 BDS 支持数据驱动 UI。

*适用版本：LeviLamina 26.60.x*

## LeviLamina（LL3）的 C++ API 里还有 LL2 那样发起 HTTP 请求的功能（httplib）吗？

没有。LeviLamina 不提供公开的 HTTP 请求封装（`ll/api/network` 下只有 packet 相关内容）。你需要在 `xmake.lua` 中自行引入第三方库，例如 cpp-httplib（LegacyScriptEngine 即使用 cpp-httplib 实现网络请求，可参考其源码）或 cpr，也可以基于 asio 自行实现。

*适用版本：LeviLamina 所有版本（LL3 起）*

## 在 LeviLamina C++ mod 中如何给某个玩家发送数据包？`player->sendNetworkPacket` 和 `Packet::sendTo` 有什么区别？

构造好 Packet 后，可以调用 `player.sendNetworkPacket(packet)`，也可以使用 LeviLamina 提供的 `packet.sendTo(player)`。在当前实现中，`Packet::sendTo(Player const&)` 会通过 Minecraft 的 `PacketSender::sendToClient` 按玩家的 `NetworkIdentifier` 和 `SubClientId` 发送。对普通在线玩家而言，它与 `sendNetworkPacket` 效果相同，只是封装得更方便；此外还有 `sendTo(BlockPos, DimensionType, except)`、`sendTo(Actor, except)`、`sendToClients()` 等重载，用于按位置或实体广播。

如果发包后客户端无反应，通常是因为包内容不正确而被客户端丢弃。

*适用版本：当前所有 LeviLamina 版本*

## 在 LeviLamina C++ 插件中，想强制关闭玩家当前打开的容器界面（箱子等），应该发什么数据包？

发送 `ContainerClosePacket`，设置其载荷中的 `mContainerId`（玩家当前打开容器的 ID），并将 `mServerInitiatedClose` 设为 `true`，即可由服务端主动关闭玩家的容器界面。当前 `ContainerClosePacket` 继承自 `ll::PayloadPacket<ContainerClosePacketPayload>`，字段 `mContainerId`、`mContainerType` 和 `mServerInitiatedClose` 均定义在 `ContainerClosePacketPayload` 中。

注意：聊天栏、命令方块编辑界面等并非都能通过这种方式关闭；如果只是为了弹出表单，则没必要关闭所有界面。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.x）*

## 在 LeviLamina mod 中如何构建并发送数据包？`BinaryStream` 的写入顺序看不懂怎么办？

推荐直接构造对应的 Packet 类（如 `XxxPacket`），给成员或 payload 赋值后调用 `sendTo(player)` 等方法发送，而不建议手写 `BinaryStream`。

如果一定要手写 `BinaryStream`，按协议顺序依次 `write` 字段即可。写入顺序可参考 IDA 中对应 `Packet::write` 的实现、PowerNukkitX 的协议类，或带注释的 Go 协议库 gophertunnel（`github.com/Sandertv/gophertunnel/minecraft/protocol/packet`）。Mojang 官方协议文档内容不全且存在错误。使用 `BinaryStream` 发包的示例可参考 LegacyScriptEngine 的 `src/legacy/api/PacketAPI.cpp`。

注意：不建议使用 BDS 自带的通用包类进行读写，部分包在 read/write 阶段因找不到来源会导致崩服。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 原生（C++）mod 中如何显示 BossBar？有没有示例或文档？

可以手动构造并发送 `BossEventPacket`（payload 为 `BossEventPacketPayload`，包含 `mEventType`（`BossEventUpdateType`）、`mName` 等字段），类文档见 <https://lamina.levimc.org/api/dc/df0/classBossEventPacket.html>。如果要让某个生物显示 boss 血条，不建议手动发包，而应使用生物的 boss 组件实现；只有非生物的自定义 BossBar 才需要自行发包。

*适用版本：LeviLamina 26.x*

## 如何实现给玩家发送虚假世界种子（假种子）的插件？LSE 脚本似乎做不到。

这需要编写原生 mod：hook `StartGamePacket` 的发送或构造相关函数，在发给客户端之前修改其中的种子。在最新版本中，种子位于 `StartGamePacketPayload::mSettings`（`LevelSettings`）的 `mSeed`（`LevelSeed64`）。GMLIB 中有类似实现可供参考。

*适用版本：LeviLamina 当前版本*

## 客户端 mod 中如何获取方块的 3D 渲染图（用于信息显示类 mod）？

可以使用 `ItemRenderer`（`class ItemRenderer : public ActorRenderer`）中渲染方块物品的函数，但在 HUD 上有些方块可能无法显示（与渲染上下文和 hook 点有关）；也有用户建议直接使用 `BlockTessellator`。

*适用版本：LeviLamina 客户端（src-client）mod。未能从源码或文档中直接证实，仅供参考。*

## 想写一个 LeviLamina mod，把服务器发给客户端的特定数据包里的文本自动翻译成目标语言，应该怎么实现？

hook 该数据包类的 `write` 函数（如 `TextPacket::$write(BinaryStream&) const`），在 hook 中修改数据包成员（`write` 为 `const` 方法，需使用 `const_cast`；当前许多包为 `ll::PayloadPacket<XxxPayload>`，文本位于 payload 成员中，例如 `TextPacket` 的 `mBody`），然后调用 `origin` 让其继续正常序列化并发送。也可以改为在发送前拦截（例如使用 iListenAttentively 的 `SendPacketEvent`）。

## 想发送假实体，`AddActorPacket` 怎么构造？

不要直接调用构造函数拼凑字段，因为缺少实体数据等内部指针容易导致崩溃。可以参考 LSE 的做法：使用 `MinecraftPackets::createPacket(MinecraftPacketIds::AddActor)` 创建数据包并执行 `static_pointer_cast<AddActorPacket>`，填入 `mEntityId`、`mRuntimeId`、`mActorType`、`mPos` 等字段后调用 `sendTo(player)`（见 `LegacyScriptEngine/src/legacy/api/PlayerAPI.cpp` 中的 `setBossBar` 实现）；或者先创建一个临时真实体，调用 `Actor::tryCreateAddActorPacket()` 生成数据包，修改包内坐标等字段后再发送。头文件为 `mc/network/packet/AddActorPacket.h`。

*适用版本：当前 LeviLamina 版本；当前 LegacyScriptEngine 版本*

## 服务端能不能通过发包让客户端直接打开一本书查看内容？

基本做不到。查看书本是纯客户端行为：玩家翻阅书本时不会发包，只有在修改内容时才会发送 `BookEditPacket`；书本内容存储在物品 NBT 中。可以考虑变通方案，例如让玩家打开一个放有这本书的讲台。

*适用版本：BDS 原版协议行为，与 LeviLamina 版本无关。未能从源码或文档中直接证实，仅供参考。*

## 通过发包对特定玩家隐藏其他玩家名字后，服务器过段时间会自动校正恢复，怎么解决？

服务器本身会定期发送 `SetActorDataPacket` 来更新玩家实体元数据。与其单独补发数据包，不如在服务器发出该包时直接修改其中的 DataItem（`SetActorDataPacketPayload::mPackedItems`）。具体可参考开源插件 FuckNetherHeight 中的改包实现。

*适用版本：LeviLamina 服务端，依赖 BDS 原版同步行为。未能从源码或文档中直接证实，仅供参考。*
