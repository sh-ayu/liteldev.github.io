# Find Function Guide

This article explains how to understand BDS functions and how to find the ones you need.

## How to Start?

Before you begin, it is best to read the [Hook Guide](hook_guide.md) first. You should also have some understanding of C++ and low-level concepts.

### Tools Needed

`IDA Pro`: Used to decompile BDS binaries.
!!! Note
    If you have not purchased IDA Pro, you can use [IDA Free](https://hex-rays.com/ida-free), though IDA Free cannot decompile functions into C.

## Why Understand BDS Functions?

Suppose you need to get a player's coordinates. How would you do it?

If you open IDA Pro and look at the generated function list, you will see that BDS is highly object-oriented. Searching for `Player` reveals many functions in the class, but nothing like `getPos` or `getPosition`.

Why is that?

If we open LeviLamina's [`Fake Header`](https://github.com/LiteLDev/LeviLamina/blob/53135ef92ccc4ee5cda12772651e1d7e319300e8/src/mc/world/actor/player/Player.h#L129) file for the Player class, we find it defined like this:

```cpp
class Player : public ::Mob {
...
};
```

Player inherits from the Mob class, which in turn inherits from Actor. In the Actor class, we finally find the function:

```cpp
class Vec3 const& getPosition() const;
```

We can guess what this function does from its name, and its `Vec3` reference return value matches our expectations.

To be more certain of what the function does, however, we need to examine its implementation.

Open IDA Pro and search for `Actor::getPosition`.

IDA Pro gives the following result:

=== "Assembly"

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

=== "Pseudocode"
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

This function is very simple: it returns a `Vec3` pointer calculated by adding an offset of `84` to the `this` pointer.

Based on experience, an object pointer plus an offset is often a member variable.

Subsequent testing confirmed that this function returns the coordinates of the player (or entity).

This function is simple, intuitively named, and straightforward to find. Finding target functions this way is a fundamental skill in our development work.

## How to Find Functions After Determining the Mod Purpose?

Sometimes, we look for a function not to call it, but to modify its behavior to suit our needs.

For example, to forward player chat messages to the console, we need to find the function in BDS that handles player chat. (Yes, native BDS does not have this feature.)

So how do we find this function?

From existing documentation, we know that the Minecraft Bedrock Edition client and server communicate over the `RakNet` protocol, and the `RakNet` protocol runs over `UDP`.

This means BDS receives packets from the client.

Research shows that the packet that handles chat is `TextPacket`. Open IDA Pro and search for `TextPacket`.

This reveals the function that receives `TextPacket`:

```cpp
public: virtual void __cdecl ServerNetworkHandler::handle(class NetworkIdentifier const & __ptr64,class TextPacket const & __ptr64) __ptr64
//symbol: ?handle@ServerNetworkHandler@@UEAAXAEBVNetworkIdentifier@@AEBVTextPacket@@@Z
```

Using what we covered in the [Hook Guide](hook_guide.md), we can easily hook this function to implement our feature. (Right?)

In practice, we run into a second problem: there is no `std::string` parameter here, so there seems to be no way to get the player's chat content.

Or is there?

Open IDA Pro and inspect the pseudocode of this function:

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

It looks complicated, doesn't it?

You don't need to understand all of it at once. Just focus on the two pieces of information we need: the `Player` and the `chat content`.

The chat content is likely a `std::string`. Searching for `std::string` inside this function turns up the following block:

```cpp
std::string::string(v17, (char *)a3 + 88);

...

std::string::string(v23, (char *)a3 + 56);
```

There are several string constructors here, but notice that v23 is not used in subsequent calls, whereas v17 is. We can guess that v17 holds the string we want.

The following code:

```cpp
if ( (unsigned int)ServerNetworkEventCoordinator::sendEvent(v10, &v13) == 1 )
          ServerNetworkHandler::_displayGameMessage(
            (ServerNetworkHandler *)((char *)this - 16),
            v6,
            (struct ChatEvent *)v17);
```

strongly supports this guess.

The Player is easy to obtain from the first line:

```cpp
v5 = (const struct Player *)(*(__int64 (__fastcall **)(char *, const struct NetworkIdentifier *, _QWORD))(*((_QWORD *)this - 2) + 8i64))(
                                (char *)this - 16,
                                a2,
                                *((unsigned __int8 *)a3 + 16));
```

This is clearly a virtual function call that returns a Player pointer.

We could copy this expression directly, but that isn't very clean.

Checking LeviLamina's definition of [ServerNetworkHandler](https://github.com/LiteLDev/LeviLamina/blob/53135ef92ccc4ee5cda12772651e1d7e319300e8/src/mc/network/ServerNetworkHandler.h#L625) shows that the ServerNetworkHandler class provides a virtual function, `_getServerPlayer`, that returns a player pointer. However, as the pseudocode and context above show, we cannot call _getServerPlayer directly; we have to apply a -16 offset to the `this` pointer to get the player pointer properly. For convenience, LeviLamina's hook macros provide `thisFor<T>()`, which applies this adjustment automatically, letting you retrieve the player pointer directly inside a hook (this is how LeviLamina's own `PlayerChatEvent` does it):

```cpp
// Inside LL_TYPE_INSTANCE_HOOK(..., ServerNetworkHandler, &ServerNetworkHandler::$handle, void,
//                              NetworkIdentifier const& identifier, TextPacket const& packet)
auto player = thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId);
```

That gives us everything we need. We can now hook this function to implement our feature.

The full implementation is omitted here for brevity.

In newer versions, LeviLamina also provides struct definitions for several packets. As shown in [TextPacket.h](https://github.com/LiteLDev/LeviLamina/blob/19e0aeb44c13967307bb1ed0795325fca41e0e48/src/mc/network/packet/TextPacket.h#L13), the LeviLamina developers have filled in the fields of this packet.

```cpp
std::string              mMessage;    // this+0x58
```

With this definition, you can read `textPacket.mMessage` directly instead of using a raw offset to get the player's chat content.

!!! Danger
    Keep in mind that we are not an official source, so the struct definitions we provide may not be completely accurate. Struct layouts can also change across version updates, and we may not always update them right away. Be careful when using struct fields in place of raw offsets!
    If you find any discrepancies, you are welcome to submit a PR.

## Conclusion

This article explained how to read functions in BDS and how to locate the ones you need.

This tutorial is only an introduction. Real-world development will present harder cases that require more effort, deeper knowledge, and further problem-solving.

We hope this tutorial helps you get started—happy coding!
