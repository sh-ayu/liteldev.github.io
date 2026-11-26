# LeviLamina mod API: forms, packets and network

## How does a LeviLamina client mod draw its own UI? Is there a unified ImGui hook?

LeviLamina provides neither a unified ImGui hook nor a wrapper around vanilla JsonUI/OreUI. The maintainers advise against hooking the system layer (DX/window) to attach ImGui yourself. Instead, plug into MC's own rendering and UI: the LL client provides `ll::event::BeforeUIRenderEvent` and `AfterUIRenderEvent` (which give you the `ScreenView` and `MinecraftUIRenderContext`), where you can draw with MC's UI render context. The relevant MC APIs are all in the `src-client/mc` headers and can be called directly. (You must implement JsonUI/OreUI yourself, and OreUI is difficult because Mojang has not open-sourced some of its libraries.) You can also look at examples from client mod frameworks such as Amethyst.

Note: LL's `ll::form` and the new `ll::ui` (data-driven UI/DDUI forms; see data_driven_ui_guide) are APIs for the server to send forms to players, not wrappers for client-side custom drawing.

*Applies to: LeviLamina client edition 26.60.x*

## Does LeviLamina have an API for drawing wireframes (such as showing hitboxes or claim boundaries)? Can it show borders on the client like a structure block does?

LeviLamina itself has no debug-shape or wireframe API. The structure block's border is hard-coded, and extracting it is not recommended.

On the server, use OEOTYAN's BedrockServerClientInterface (BSCI, <https://github.com/OEOTYAN/BedrockServerClientInterface>, also available at <https://levimc.org/mods/github.com/OEOTYAN/BedrockServerClientInterface/>) to draw debug shapes and wireframes; claim plugins such as PLand use it to display claim boundaries.

To draw inside a client mod yourself, you need to hook into the game's rendering. The LL client's `BeforeUIRenderEvent` and `AfterUIRenderEvent` are built on a hook of `ScreenView::render`, so you can listen to these events or hook a rendering function yourself.

*Applies to: LeviLamina 26.x (BSCI v26.60.0 is released for the current version)*

## How can a server mod send a player text that contains only a translation key (optionally with parameters), so the client translates it into its own language? What about custom keys?

Send a `TextPacket` of type `Translate`, for example:

```cpp
TextPacket pkt{};
pkt.mLocalize = true;
pkt.mBody = TextPacketPayload::MessageAndParams{TextPacketType::Translate, "my.key", {"param1", "param2"}};
pkt.sendTo(player);
```

The client translates the key using its local language files. You can use vanilla keys directly. Because the client can only load language files from resource packs, custom keys must be delivered to the client in a resource pack as language files (`texts/*.lang`), which the server can force with `resource_packs`. You do not need to write the packet by hand with `BinaryStream`; for the protocol format, see Mojang's official protocol documentation. Third-party dependency mods (such as GMLIB) also provide related APIs.

*Applies to: current LeviLamina version (26.x)*

## How can a LeviLamina native (C++) mod define custom packets so a client mod and a server mod can communicate with each other?

LeviLamina has built-in custom packet support (`ll/api/network`) since 1.9.0. To use it:

- Inherit from `ll::network::PacketBase<T>` and implement `write` and `read` to define a packet (inheriting registers it).
- Inherit from `ll::network::PacketHandlerBase<Handler, Packet>` and implement `handlePacket(NetworkIdentifier const&, NetEventCallback&, ll::network::PacketSide side, Packet const&)` to handle the packet.
- To send, use `packet.sendToServer()` (client to server) and `packet.sendTo(player)`, `sendToClient(networkId, subClientId)`, or `sendToClients()` (server to client).

To register packets dynamically at runtime (for example, in a script engine), use `ll::network::PacketRegistrar::getInstance()`. Since 26.60, you can also declare `CustomPacketId`, `PacketVersion`, the handling side `Side`, and `Optional`; a side that lacks a required packet is disconnected at login.

*Applies to: LeviLamina 1.9.0 and later (the `handlePacket` signature and `Side`/`Optional` are 26.60.0 and later)*

## What does the `write` function of the BDS `Packet` class do, and when is it called? What is `read`?

`write(BinaryStream&)` serializes the packet into a `BinaryStream` and is called when a packet is sent. `read(ReadOnlyBinaryStream&)` reads data from a `ReadOnlyBinaryStream` and deserializes it into the `Packet` object; it is called when a packet is received (concrete packet classes implement the pure virtual function `_read`, which `read` calls internally).

## The `ll::form::ModalForm` constructor takes only the title, content and two button texts. Where does the callback go? Writing a lambda as in old tutorials gives `No viable conversion ... to 'Callback'`. What should I do?

Pass the callback to `sendTo(player, callback)`. The signature of `ModalForm::Callback` is `void(Player&, ll::form::ModalFormResult, ll::form::FormCancelReason)`, where `ModalFormResult = std::optional<ModalFormSelectedButton>` and `FormCancelReason = std::optional<ModalFormCancelReason>`. Because the last two parameters are both `optional`, check whether they have a value first. At its simplest: `form.sendTo(player, [](Player& player, ll::form::ModalFormResult result, ll::form::FormCancelReason reason) { ... });` (you can also use `auto`). Using the wrong parameter type—such as writing `ModalFormSelectedButton` directly instead of an `optional`—causes that conversion error. For details, see the official form guide at `developer_guides/how_to_guides/form_guide`.

*Applies to: LeviLamina 0.11 and later*

## After changing the item in one inventory slot of a player in a LeviLamina C++ mod, why send an `InventorySlotPacket` instead of calling `refreshInventory` to sync it to the client?

`Mob::refreshInventory()` calls `sendInventory(true)` and `sendArmor` (sending all armor slots), refreshing the entire inventory and armor bar. `InventorySlotPacket`, by contrast, updates only a single container slot (`mInventoryId`, `mSlot`, `mItem`) and sends less network data. When only one item changes, sending an `InventorySlotPacket` is the better choice.

Also, functions like `Actor::getPlayerOwner()` return a `Player*` that can be `nullptr` (for example, on a force-spawned fishing hook with no owner). Calling player functions on that pointer directly crashes the server with a null pointer dereference, so always check it first.

## How do I write a form in a LeviLamina C++ mod? Is there an official tutorial?

Yes. The official documentation includes a form guide at <https://levimc.org/LeviLamina/developer_guides/how_to_guides/form_guide/>, which covers `SimpleForm`, `ModalForm`, and `CustomForm`, sent with `sendTo` and a callback. For the API reference, see `api_reference/form`. You can also look at how LegacyScriptEngine implements the form API.

## In LeviLamina C++, I send a `CustomForm` (with `appendDropdown`) to a player. Submitting works, but the server crashes when the player closes the form with the X in the top-right corner. Why?

The `CustomForm` callback signature is `void(Player&, CustomFormResult const&, FormCancelReason)`, where `CustomFormResult` is `std::optional<std::unordered_map<std::string, CustomFormElementResult>>`. When the player closes the form with X, the result is `std::nullopt` (and `FormCancelReason` has a value). Accessing `result->at("playerName")` or `std::get<std::string>(...)` directly dereferences an empty `optional` or looks up a missing key, which throws an exception or crashes the server.

In the callback, check `if (!result) return;` (or check `cancelReason`) first, then verify that the key exists with `find` or `contains`, and check the type with `std::get_if` before reading the value. Also, never pass an empty options array to `appendDropdown`.

## What type does the callback result of `appendStepSlider` in a LeviLamina C++ `CustomForm` have?

Unlike LSE, which returns the index, `ll::form::CustomForm::appendStepSlider(name, text, std::vector<std::string> steps, defaultVal, tooltip)` in LeviLamina C++ puts the selected item's string itself—not its index—into the callback result `CustomFormResult` (`std::unordered_map<std::string, CustomFormElementResult>`), as a `std::string` inside `std::variant<std::monostate, uint64, double, std::string>`. This remains true as of v26.60.8.

Example of reading the value:

```cpp
std::get<std::string>(result->at("name"))
```

*Applies to: LeviLamina 0.11 and later*

## Are the packet structs in LeviLamina complete, and can I build and send packets myself?

Yes. LeviLamina defines a large number of packet structs (hundreds of headers under `mc/network/packet/`), enough to build and send packets yourself. Once you build a packet, send it using the methods LL provides on `Packet`, such as `packet.sendTo(player)`, `sendTo(actor)`, `sendTo(pos, dimId)`, and `sendToClients()`.

## Can a LeviLamina `CustomForm` have only one submit button? Can I add other buttons?

The traditional `ll::form::CustomForm` supports only a single submit button, configured with `setSubmitButton(text)`; you cannot add multiple buttons to it. If you need multiple buttons or richer interaction, use the new DDUI (data-driven UI) interface `ll::ui::CustomForm` (in `ll/api/ui/form/CustomForm.h`). It lets you add multiple buttons with `button(label, callback, options)`, along with controls such as `closeButton()`, `textField()`, `toggle()`, and `dropdown()`, and display the form with `show()` or `showAsync()`. The DDUI interface requires both the client and BDS to support data-driven UI.

*Applies to: LeviLamina 26.60.x*

## Does the LeviLamina (LL3) C++ API still have an HTTP request feature (httplib) like LL2?

No. LeviLamina does not provide a public HTTP request wrapper (`ll/api/network` contains only packet-related code). Add a third-party library in `xmake.lua`, such as cpp-httplib (which LegacyScriptEngine uses for network requests—you can check its source for reference) or cpr, or build your own on top of asio.

*Applies to: all LeviLamina versions (LL3 onward)*

## How do I send a packet to a specific player in a LeviLamina C++ mod? What is the difference between `player->sendNetworkPacket` and `Packet::sendTo`?

After building the Packet, call `player.sendNetworkPacket(packet)` or LeviLamina's `packet.sendTo(player)`. Currently, `Packet::sendTo(Player const&)` sends the packet through Minecraft's `PacketSender::sendToClient` using the player's `NetworkIdentifier` and `SubClientId`. For a regular online player, it behaves the same as `sendNetworkPacket` and is simply a more convenient wrapper. Overloads such as `sendTo(BlockPos, DimensionType, except)`, `sendTo(Actor, except)`, and `sendToClients()` are also available for broadcasting by position or entity.

If the client does not respond after you send a packet, the packet contents are usually invalid and the client dropped it.

*Applies to: all LeviLamina versions*

## In a LeviLamina C++ plugin, which packet should I send to force-close the container screen (chest and so on) a player has open?

Send a `ContainerClosePacket` with `mContainerId` in its payload set to the ID of the player's currently open container and `mServerInitiatedClose` set to `true`. The server then closes the player's container screen. `ContainerClosePacket` currently extends `ll::PayloadPacket<ContainerClosePacketPayload>`, which defines `mContainerId`, `mContainerType`, and `mServerInitiatedClose` in `ContainerClosePacketPayload`.

Note: this method cannot close every screen, such as the chat box or the command block editor. If you only want to show a form, you do not need to close all open screens first.

*Applies to: LeviLamina 1.x and later (currently v26.60.x)*

## How do I build and send a packet in a LeviLamina mod? What if I cannot understand the write order of `BinaryStream`?

Instead of writing a `BinaryStream` by hand, construct the corresponding Packet class directly (such as `XxxPacket`), set its members or payload, and send it with a method like `sendTo(player)`.

If you must write a `BinaryStream` by hand, `write` the fields one by one in protocol order. To find the correct order, check the corresponding `Packet::write` implementation in IDA, the protocol classes in PowerNukkitX, or the commented Go protocol library gophertunnel (`github.com/Sandertv/gophertunnel/minecraft/protocol/packet`). Mojang's official protocol documentation is incomplete and contains errors. For an example of sending packets with `BinaryStream`, see `src/legacy/api/PacketAPI.cpp` in LegacyScriptEngine.

Using the generic packet classes bundled with BDS for reading and writing is not recommended: for some packets, the source cannot be found during read/write, which crashes the server.

*Applies to: LeviLamina current version*

## How do I show a BossBar in a native (C++) LeviLamina mod? Is there an example or documentation?

You can manually build and send a `BossEventPacket` (its payload is `BossEventPacketPayload`, which includes fields such as `mEventType` (`BossEventUpdateType`) and `mName`). See the class documentation at <https://lamina.levimc.org/api/dc/df0/classBossEventPacket.html>. To display a boss health bar for a mob, use the mob's boss component rather than sending packets manually. You only need to send the packet yourself for a custom BossBar that is not tied to a mob.

*Applies to: LeviLamina 26.x*

## How do I write a plugin that sends a fake world seed to players? LSE scripts seem unable to do it.

You need a native mod: hook the functions that construct or send `StartGamePacket` and modify the seed before the packet reaches the client. In the latest version, the seed is stored in `mSeed` (`LevelSeed64`) inside `StartGamePacketPayload::mSettings` (`LevelSettings`). GMLIB has a similar implementation you can use as a reference.

*Applies to: LeviLamina current version*

## How do I get a 3D rendering of a block in a client mod (for an info-display mod)?

You can use the block-item rendering function in `ItemRenderer` (`class ItemRenderer : public ActorRenderer`), though some blocks may not appear on the HUD depending on the rendering context and hook point. Some users also suggest using `BlockTessellator` directly.

*Applies to: LeviLamina client (src-client) mod. Not confirmed against the source code or the documentation: treat it as a pointer.*

## I want to write a LeviLamina mod that automatically translates the text in specific packets the server sends to clients into a target language. How do I implement it?

Hook the packet class's `write` function (such as `TextPacket::$write(BinaryStream&) const`) and modify the packet's members inside the hook. Because `write` is `const`, you will need `const_cast`. Many packets are now `ll::PayloadPacket<XxxPayload>`, with the text stored in a payload member (such as `mBody` on `TextPacket`). Then call `origin` to proceed with normal serialization and sending. Alternatively, you can intercept the packet before it is sent (for example, using `SendPacketEvent` from iListenAttentively).

## I want to send a fake entity. How do I construct an `AddActorPacket`?

Do not call the constructor directly and populate the fields manually; missing internal pointers, such as entity data, can easily cause crashes. Instead, follow the LSE approach: create the packet with `MinecraftPackets::createPacket(MinecraftPacketIds::AddActor)` and `static_pointer_cast<AddActorPacket>`, populate fields such as `mEntityId`, `mRuntimeId`, `mActorType`, and `mPos`, and then call `sendTo(player)` (see the `setBossBar` implementation in `LegacyScriptEngine/src/legacy/api/PlayerAPI.cpp`). Alternatively, create a temporary real entity, generate the packet with `Actor::tryCreateAddActorPacket()`, and modify fields such as the position before sending it. The header is `mc/network/packet/AddActorPacket.h`.

*Applies to: current LeviLamina version; current LegacyScriptEngine version*

## Can the server make a client open a book and show its contents by sending a packet?

Basically, no. Viewing a book is purely client-side: no packet is sent while a player reads a book, and a `BookEditPacket` is sent only when its content is modified. The book's content is stored in the item's NBT. As a workaround, you can have the player open a lectern that holds the book.

*Applies to: vanilla BDS protocol behavior, independent of the LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After hiding other players' names from a specific player by sending packets, the server restores them after a while. How do I fix this?

The server periodically sends `SetActorDataPacket` to update player entity metadata. Instead of sending a separate packet to override it, modify the DataItem (`SetActorDataPacketPayload::mPackedItems`) directly when the server sends that packet. For an example of modifying packets this way, see the open-source plugin FuckNetherHeight.

*Applies to: LeviLamina server, relies on the vanilla BDS sync behavior. Not confirmed against the source code or the documentation: treat it as a pointer.*
