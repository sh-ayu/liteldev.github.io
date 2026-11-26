# LegacyScriptEngine API：网络与系统

## LSE 插件中有没有办法获取玩家是通过哪个 IP 进入服务器的？

可以，通过玩家的设备信息对象获取：`player.getDevice().ip`（即 Device 对象的 `ip` 属性）。

注意：如果服务器使用了 frp 等内网穿透或代理，这里拿到的会是穿透客户端的地址（如 `127.0.0.1`），而非玩家的真实 IP。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件如何实现自动更新自身？

可以定时检查更新（如用 `network.httpGet` 请求版本信息）。发现新版本后，先将其下载到本地并覆盖插件自身文件，再通过 `mc.runcmdEx` 执行 LeviLamina 的重载命令（如 `ll reload <插件名>`）重载插件。不建议每次加载时从网络拉取代码再通过 `eval` 执行。

*适用版本：LeviLamina + LSE 当前版本*

## LSE 有获取服务器公网 IP 的接口吗？

没有专门的接口（LSE 只有玩家或设备的 `ip` 属性，如 `pl.getDevice().ip`）。可以用 LSE 的网络接口 `network.httpGet(url, callback)` 请求外部 IP 查询服务（如 <https://ip.sb>、<https://4.ipw.cn>）来获取公网 IP；Node.js 插件也可以用 Node 自带的网络库实现。

*适用版本：LSE 当前所有版本*

## LSE 的 `BinaryStream` 中 `writeVec3` 应该传什么参数？和连续调用三次 `writeFloat` 有区别吗？

`writeVec3` 需要传入一个 `FloatPos` 对象。它在底层就是依次调用 `writeFloat` 写入 x、y、z，与连续调用三次 `writeFloat` 等价。

## LSE 的 Node.js 插件之间能共享内存吗？Node 插件想在服务器启动完成后通知外部前端程序，有什么办法？

不能直接共享内存，因为 LSE 隔离了每个 Node.js 插件的执行环境。插件之间如需互相调用，可以使用 `ll.exports` 和 `ll.imports`（远程函数调用）。与外部程序通信建议走网络：在 `onServerStarted` 事件中，通过 HTTP 请求（`network.httpGet` / `httpPost` 或 Node 自带的 `http` 模块）或 WebSocket（LSE 的 `WSClient` 或 npm 的 `ws` 包）通知外部程序；如需监测服务器是否存活，可以用 WebSocket 发送定时心跳，超时即判定服务器下线。网络通信比文件交互更可靠。此外，有用户反馈 `process.send` 不可用。

*适用版本：当前版本（Node.js 引擎）*

## 在 LSE 的 JS 脚本插件里，能否让玩家进服时一直停留在“正在加载资源”阶段、几乎不下发数据包，等某个 `Promise` 返回后再决定是否放行进服？

脚本插件无法在登录或加载资源阶段挂起玩家连接、阻止下发数据包（`onPreJoin` 等事件回调是同步的，必须当场决定是否拦截，无法等待 `Promise`）。这类需求需要编写 C++ mod，自行 hook 网络或登录流程来实现。

## 在 LSE 中用 `BinaryStream` 构建 `AddActor` 数据包再 `createPacket` 发送失败/报参数错误，为什么？用 `sendNetworkPacket` 符号能解决吗？

`bs.createPacket(pktid)` 默认会先创建对应类型的包对象，再从 `BinaryStream` 中读取数据并解析校验；部分数据包（如 `AddActor`）在解析自行拼接的数据时会失败。从 LSE 0.19.1 起，可用 `bs.createPacket(pktid, true)` 创建原始网络数据包，直接将当前流中的字节作为包体，跳过解析步骤，随后用 `pkt.sendTo(player)` 或 `player.sendPacket(pkt)` 发送。`?sendNetworkPacket@Player@@UEBAXAEAVPacket@@@Z` 与 `player.sendPacket` 本质相同，换用它并不能解决问题。另外，在 JS 字符串中写符号名时，需要对反斜杠进行转义，或使用 `String.raw`。

*适用版本：LegacyScriptEngine 0.19.1 及以上（raw 参数）；更早版本无法用 `createPacket` 发送 `AddActor`*

## 在服务端修改了地图画（物品展示框里地图）的 NBT 或 mapid 对应的像素数据后，客户端画面不刷新，如何让客户端看到更新？

服务端数据其实已经修改成功，只是尚未向客户端发送更新包。地图数据的同步流程是：客户端发送 `MapInfoRequestPacket`（含 `mMapId`、`mClientPixels`）发起请求，服务端以 `ClientboundMapItemDataPacket` 回传数据；而 `UpdateBlockActorPacket` 仅用于告知客户端展示框内的地图 id。如果地图 id 不变、只修改像素数据，可以发送一个 `UpdateBlockPacket` 触发方块更新，促使客户端重新请求地图数据（用命令方块的 `clone`、`structure` 重新加载或调用 `pl.refreshChunks()` 也能强制刷新，但画面会闪烁）。LSE 可以用 `pl.sendPacket` 直接发包，但需要手写 `BinaryStream`，具体协议可参考 <https://mojang.github.io/bedrock-protocol-docs/html/packets.html>。注意每次更新都会广播给所有玩家，从而占用带宽。

*适用版本：LSE / LeviLamina 当前版本（发包细节依赖 BDS 协议）。未能从源码或文档中直接证实，仅供参考。*

## 基岩版两个服务器之间如何实现跨服传送（传服）？数据能互通吗？

跨服传送本身很简单：LSE 提供了 `pl.transServer(ip, port)`；C++ mod 则可以构造 `<mc/network/packet/TransferPacket.h>` 中的 `TransferPacket`（传入目标 IP 和端口），再通过 `player.sendNetworkPacket` 发送。但各个服务器的数据（包括各插件的数据）不会自动互通，需要自行通过 MySQL 等共享存储，或借助文件、WebSocket 中转来同步。

*适用版本：LSE / LeviLamina 当前版本*

## 想写一个 `/ping` 命令显示玩家到服务器的延迟，LSE 或 LeviLamina 有没有直接获取玩家延迟的接口？

不必在服务端自行 ping 玩家 IP（拿到的往往是运营商出口 IP，而且通常禁 ping）。在 LSE 中，直接通过 `pl.getDevice()` 返回的设备信息对象即可获取：`dv.lastPing`（当前延迟，单位 ms）、`dv.avgPing`（平均延迟，单位 ms），此外还有 `lastPacketLoss` 和 `avgPacketLoss` 丢包率属性。C++ mod 开发者可以参考 LSE 开源代码 `DeviceAPI.cpp` 中这些属性的实现。

*适用版本：LegacyScriptEngine 当前版本*

## 服务器已有自定义进出服提示，如何关闭原版的黄字“xxx 加入/离开了游戏”提示？LSE 中 `mc.listen('onJoin'/'onLeft')` 回调 `return false` 能拦截吗？

不能用这种方式关闭提示：`onLeft` 事件不可拦截；`onJoin` 虽然能用 `return false` 拦截，但拦截的是玩家进入服务器这一行为本身，而不是那条提示消息。

可行方法：

1. 使用资源包修改语言文件中的 `multiplayer.player.joined` 和 `multiplayer.player.left`。
2. 拦截发送给客户端的 `TextPacket` 数据包。在 LSE 中，可借助第三方插件 ila-lseexport（用于导出 iListenAttentively 事件）监听数据包发送事件并予以拦截。在 C++ mod 中，可依赖 iListenAttentively 的 `SendPacketBeforeEvent`：`if (event.packet().getId() == MinecraftPacketIds::Text) event.cancel();`（再按文本内容过滤）。

*适用版本：LegacyScriptEngine / iListenAttentively 当前版本*

## 用 LSE 发包做假箱子（fake chest）查包界面时，打开大箱子（双箱）会瞬间关闭，怎么解决？

客户端打开容器界面时，要求对应坐标处必须存在箱子方块，否则界面会立刻关闭。因此，需要先向该玩家发送假的箱子方块（大箱子需要两个相邻且已配对的箱子），通常生成在玩家头顶附近，然后再发送 `ContainerOpenPacket` 打开界面。在 LSE 中，可以用 `BinaryStream` 构造数据包并通过 `pl.sendPacket(packet)` 发送。可参考社区示例：<https://github.com/Cdm2883/code-snippets/blob/vscode/LLSE/FakeChestLLSE/fake-chest.llse.js>

*适用版本：当前版本（依赖客户端行为与具体协议版本）。未能从源码或文档中直接证实，仅供参考。*

## 能否让某个玩家头顶的文字（名称标签/悬浮字）只对特定玩家单方面可见？

可以。原理是只向目标玩家发送修改实体名称或元数据的数据包（如 `SetActorDataPacket`），其他玩家收不到该包，自然也就看不到变化。在 LSE 中，可以用 Packet API 构造数据包（用 `new BinaryStream()` 写入数据后调用 `bs.createPacket(pktid)`），再用 `pl.sendPacket(packet)` 单独发给指定玩家；也可以借助其他提供发包或悬浮字接口的前置插件来实现。注意：Packet API 需在当前版本中可用，且数据包结构会随 BDS 协议版本变化，需按当前协议构造。

*适用版本：LegacyScriptEngine 当前版本*

## LSE 中 `network.httpGet()` 的返回状态码一直是 `-1`，但同一 URL 在浏览器能正常访问，是什么原因？

状态码 `-1` 表示请求本身失败（未收到任何响应）。请先打印拼接后的 URL 确认格式无误，并检查请求参数和服务端状态；曾有用户是因为域名解析失败遇到此问题，改用 IP 访问即可解决。此外，也可以用 `curl` 进行测试，或在 Node.js 插件中改用其他 HTTP 库发起请求。
