# 找函数指南

本篇将介绍如何理解 BDS 中函数的作用，以及如何在 BDS 中找到所需的函数。

## 如何开始？

在开始之前，建议先阅读[Hook指南](hook_guide.zh.md)，并对 C++ 和底层知识有一定了解。

### 需要的工具

`IDA Pro`：用于反编译 BDS 的二进制文件。
!!! Note
    如果你没有购买 IDA Pro，可以使用 [IDA Free](https://hex-rays.com/ida-free)，但 IDA Free 没有将函数反编译为 C 语言的功能。

## 为什么要理解BDS的函数？

试想一个场景：你需要获取玩家的坐标，你会怎么做？

如果你用 IDA Pro 查看过生成的函数列表，会发现 BDS 是高度面向对象的。但搜索关键词 `Player` 时，尽管这个类里有许多函数，却找不到 `getPos`、`getPosition` 这样的函数。

为什么呢？

打开 LeviLamina 中 Player 类的 [`Fake Header`](https://github.com/LiteLDev/LeviLamina/blob/53135ef92ccc4ee5cda12772651e1d7e319300e8/src/mc/world/actor/player/Player.h#L129) 文件，可以看到该类的定义如下：

```cpp
class Player : public ::Mob {
...
};
```

可以看到，Player 继承自 Mob 类，而 Mob 又继承自 Actor 类。在 Actor 类中，我们终于找到了这样一个函数：

```cpp
class Vec3 const& getPosition() const;
```

从函数名可以推测出它的作用，而且它返回 `Vec3` 类型的引用，这也很符合预期。

为了进一步确认该函数的作用，我们还需要查看它的实现。

打开 IDA Pro，搜索 `Actor::getPosition`

IDA Pro 给出了如下结果：

=== "汇编"
    ```ASM
    .text:00000001415B8D50 ; const struct Vec3 *__fastcall Actor::getPosition(Actor *__hidden this)
    .text:00000001415B8D50 ?getPosition@Actor@@QEBAAEBVVec3@@XZ proc near
    .text:00000001415B8D50                                         ; CODE XREF: BarterGoal::_getThrowVector(void)+96↑p
    .text:00000001415B8D50                                         ; BarterGoal::_getThrowVector(void)+A6↑p ...
    .text:00000001415B8D50                 sub     rsp, 28h
    .text:00000001415B8D54                 mov     rax, [rcx+2A0h]
    .text:00000001415B8D5B                 test    rax, rax
    .text:00000001415B8D5E                 jz      short loc_1415B8D65
    .text:00000001415B8D60                 add     rsp, 28h
    .text:00000001415B8D64                 retn
    .text:00000001415B8D65 ; ---------------------------------------------------------------------------
    .text:00000001415B8D65
    .text:00000001415B8D65 loc_1415B8D65:                          ; CODE XREF: Actor::getPosition(void)+E↑j
    .text:00000001415B8D65                 call    ?terminate@details@gsl@@YAXXZ ; gsl::details::terminate(void)
    .text:00000001415B8D65 ; ---------------------------------------------------------------------------
    .text:00000001415B8D6A                 db 0CCh
    .text:00000001415B8D6A ?getPosition@Actor@@QEBAAEBVVec3@@XZ endp
    ```

=== "伪代码"
    ```cpp
    const struct Vec3 *__fastcall Actor::getPosition(Actor*this)
    {
    const struct Vec3 *result; // rax

    result = (const struct Vec3 *)*((_QWORD *)this + 84);
    if ( !result )
        gsl::details::terminate(this);
    return result;
    }
    ```

该函数的实现非常简单：返回 `this` 指针加上偏移量 `84` 后的 `Vec3` 类型指针。

根据经验，对象指针加上偏移量，指向的多半是成员变量。

后续实践证明，该函数确实返回了玩家的坐标（准确地说，是返回实体的坐标）。

这个函数命名直观，实现和查找过程都很简单。在实际开发中，通过这种方式寻找目标函数是最基本的技能。

## 确定模组目的后，如何寻找函数？

有时，寻找函数不是为了调用它，而是为了修改其行为以满足需求。

例如，若想将玩家的聊天内容转发到控制台，就需要找到 BDS 中处理玩家聊天的函数（原生 BDS 并没有这个功能）。

那么，该如何寻找这个函数呢？

查阅资料可知，Minecraft 基岩版客户端与服务端之间使用 `RakNet` 协议进行通信，而 `RakNet` 协议底层使用的是 `UDP` 协议。

这意味着 BDS 会接收来自客户端的数据包。

查阅资料可知，处理聊天的数据包是 `TextPacket`。打开 IDA Pro，搜索 `TextPacket`。

我们顺利找到了接收 `TextPacket` 的函数：

```cpp
public: virtual void __cdecl ServerNetworkHandler::handle(class NetworkIdentifier const & __ptr64,class TextPacket const & __ptr64) __ptr64
//symbol: ?handle@ServerNetworkHandler@@UEAAXAEBVNetworkIdentifier@@AEBVTextPacket@@@Z
```

利用在[Hook指南](hook_guide.zh.md)中学到的知识，我们可以轻松地 Hook 这个函数来实现功能。（真的吗？）

但很快就会遇到第二个问题：参数中似乎没有 `std::string` 类型，我们好像无法获取玩家的聊天内容。

真是如此吗？

打开 IDA Pro，查看该函数的伪代码：

```cpp
void __fastcall ServerNetworkHandler::handle(
        ServerNetworkHandler *this,
        const struct NetworkIdentifier *a2,
        const struct TextPacket *a3)
{
  const struct Player *v5; // rax
  const struct Player *v6; // rdi
  const struct PlayerCapabilities::ISharedController *v7; // rax
  __int64 v8; // rax
  __int64 v9; // rcx
  __int64 v10; // rax
  __int128 v11; // [rsp+28h] [rbp-D8h] BYREF
  int v12; // [rsp+38h] [rbp-C8h]
  char *v13; // [rsp+40h] [rbp-C0h] BYREF
  char v14; // [rsp+C0h] [rbp-40h]
  char v15; // [rsp+C8h] [rbp-38h]
  char v16[16]; // [rsp+D0h] [rbp-30h] BYREF
  char v17[32]; // [rsp+E0h] [rbp-20h] BYREF
  __int128 v18; // [rsp+100h] [rbp+0h]
  int v19; // [rsp+110h] [rbp+10h]
  char v20; // [rsp+118h] [rbp+18h]
  __int128 v21; // [rsp+120h] [rbp+20h]
  __int64 v22; // [rsp+130h] [rbp+30h]
  char v23[32]; // [rsp+138h] [rbp+38h] BYREF
  __int16 v24; // [rsp+158h] [rbp+58h]

  v5 = (const struct Player *)(*(__int64 (__fastcall **)(char *, const struct NetworkIdentifier *, _QWORD))(*((_QWORD *)this - 2) + 8i64))(
                                (char *)this - 16,
                                a2,
                                *((unsigned __int8 *)a3 + 16));
  v6 = v5;
  if ( v5 )
  {
    PlayerCapabilities::PlayerData::PlayerData((PlayerCapabilities::PlayerData *)v16, v5);
    v7 = (const struct PlayerCapabilities::ISharedController *)(*(__int64 (__fastcall **)(_QWORD))(***((_QWORD ***)this + 9)
                                                                                                 + 2200i64))(**((_QWORD **)this + 9));
    if ( TextPacket::_shouldHandleTextPacketForPlayer(a3, (struct PlayerCapabilities::IPlayerData *)v16, v7) )
    {
      if ( *((_BYTE *)a3 + 48) == 1 && (!*((_QWORD *)a3 + 13) || *(_BYTE *)std::string::at((char *)a3 + 88, 0i64) != 47) )
      {
        EntityContext::getWeakRef((char *)v6 + 8, &v11);
        std::string::string(v17, (char *)a3 + 88);
        v18 = 0i64;
        if ( *((_QWORD *)&v11 + 1) )
        {
          v18 = v11;
          _InterlockedIncrement((volatile signed __int32 *)(*((_QWORD *)&v11 + 1) + 12i64));
        }
        v19 = v12;
        v20 = 0;
        v21 = 0i64;
        v22 = 0i64;
        std::string::string(v23, (char *)a3 + 56);
        v24 = 257;
        v9 = *((_QWORD *)&v11 + 1);
        if ( *((_QWORD *)&v11 + 1)
          && _InterlockedExchangeAdd((volatile signed __int32 *)(*((_QWORD *)&v11 + 1) + 12i64), 0xFFFFFFFF) == 1 )
        {
          (*(void (__fastcall **)(__int64))(*(_QWORD *)v9 + 8i64))(v9);
        }
        v10 = (*(__int64 (__fastcall **)(_QWORD))(***((_QWORD ***)this + 9) + 1440i64))(**((_QWORD **)this + 9));
        v13 = v17;
        v14 = 0;
        v15 = 0;
        if ( (unsigned int)ServerNetworkEventCoordinator::sendEvent(v10, &v13) == 1 )
          ServerNetworkHandler::_displayGameMessage(
            (ServerNetworkHandler *)((char *)this - 16),
            v6,
            (struct ChatEvent *)v17);
        ChatEvent::~ChatEvent((ChatEvent *)v17);
      }
    }
    else if ( *((_QWORD *)a3 + 13) > 0x200ui64 )
    {
      v8 = (*(__int64 (__fastcall **)(const struct Player *))(*(_QWORD *)v6 + 2048i64))(v6);
      (*(void (__fastcall **)(__int64, const struct Player *, __int64))(*(_QWORD *)v8 + 968i64))(v8, v6, 1i64);
    }
  }
}
```

看起来是不是很复杂？

但我们不需要一次性全部看懂，只需明确要获取的信息：`玩家`和`聊天内容`。

聊天内容大概率是 `std::string` 类型。在该函数中搜索 `std::string`，可以找到如下代码：

```cpp
std::string::string(v17, (char *)a3 + 88);

...

std::string::string(v23, (char *)a3 + 56);
```

光是字符串的构造函数就有这么多。不过观察发现，v23 在后续并未被调用，而 v17 被调用了，因此可以推测 v17 就是目标字符串。

下文的代码：

```cpp
if ( (unsigned int)ServerNetworkEventCoordinator::sendEvent(v10, &v13) == 1 )
          ServerNetworkHandler::_displayGameMessage(
            (ServerNetworkHandler *)((char *)this - 16),
            v6,
            (struct ChatEvent *)v17);
```

也极大地支持了这一猜测。

至于 Player，也很容易从第一行代码中得到：

```cpp
v5 = (const struct Player *)(*(__int64 (__fastcall **)(char *, const struct NetworkIdentifier *, _QWORD))(*((_QWORD *)this - 2) + 8i64))(
                                (char *)this - 16,
                                a2,
                                *((unsigned __int8 *)a3 + 16));
```

这显然是一次虚函数调用，最终返回了一个 Player 指针。

我们可以直接照抄这段代码，但这样很不优雅。

查阅 LeviLamina 中 [ServerNetworkHandler](https://github.com/LiteLDev/LeviLamina/blob/53135ef92ccc4ee5cda12772651e1d7e319300e8/src/mc/network/ServerNetworkHandler.h#L625) 的定义可知，ServerNetworkHandler 类提供了虚函数 `_getServerPlayer` 用于获取玩家指针。但从前面的伪代码和上下文来看，直接调用 _getServerPlayer 并不可行，必须先对 `this` 指针做 -16 的偏移才能正确获取玩家指针。为方便开发，LeviLamina 的 Hook 宏提供了 `thisFor<T>()` 来自动完成这一偏移。因此在 Hook 中可以直接获取玩家指针（LeviLamina 自身的 `PlayerChatEvent` 就是这样实现的）：

```cpp
// 在 LL_TYPE_INSTANCE_HOOK(..., ServerNetworkHandler, &ServerNetworkHandler::$handle, void,
//                         NetworkIdentifier const& identifier, TextPacket const& packet) 中
auto player = thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId);
```

至此，目标已经达成，我们可以 Hook 这个函数来实现所需功能。

受篇幅所限，具体代码实现不再赘述。

此外，新版本的 LeviLamina 提供了部分数据包的结构体信息。从 [TextPacket.h](https://github.com/LiteLDev/LeviLamina/blob/19e0aeb44c13967307bb1ed0795325fca41e0e48/src/mc/network/packet/TextPacket.h#L13) 中可以看到，LeviLamina 开发者已经补全了该数据包的结构体信息。

```cpp
std::string              mMessage;    // this+0x58
```

借助该结构体，我们可以直接使用 `textPacket.mMessage` 代替指针偏移来获取玩家的聊天内容。

!!! Danger
    但我们并非官方，提供的结构体信息不一定完全准确。随着版本更新，结构体可能会发生变化，而我们未必能及时更新。因此，使用结构体替代偏移时一定要多加注意！
    当然，如果你发现了这类问题，欢迎提交 PR。

## 总结

本篇介绍了如何理解 BDS 中函数的作用，以及如何在 BDS 中找到所需的函数。

本教程仅作为入门指南。在实际开发中，你会遇到更复杂的条件和情况，这需要你付出更多努力，不断学习新知识来解决问题。

希望本教程能对你有所帮助，祝你开发愉快！
