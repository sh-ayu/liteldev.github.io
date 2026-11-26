# LegacyScriptEngine API: network and system

## Is there a way to get which IP a player used to join the server, from an LSE plugin?

Yes, through the player's device information object: `player.getDevice().ip` (the `ip` property of the Device object).

Note: if the server sits behind an intranet tunnel or proxy such as frp, you get the address of the tunnel client (for example `127.0.0.1`), not the player's real IP.

*Applies to: all current LSE versions (including v0.23.1)*

## How can an LSE plugin update itself automatically?

Check for updates periodically (for example by requesting version information with `network.httpGet`). When a new version is found, download it, overwrite the plugin's own file, and reload the plugin by running LeviLamina's reload command (such as `ll reload <plugin name>`) with `mc.runcmdEx`. Fetching code from the network on every load and running it with `eval` is not recommended.

*Applies to: LeviLamina + LSE current version*

## Does LSE have an interface to get the server's public IP?

There is no dedicated interface (LSE only provides the `ip` property on a player's device, such as `pl.getDevice().ip`). You can use LSE's `network.httpGet(url, callback)` interface to query an external IP lookup service (such as <https://ip.sb> or <https://4.ipw.cn>) for the public IP; a Node.js plugin can also use Node's network libraries.

*Applies to: all current LSE versions*

## What should I pass to `writeVec3` in LSE's `BinaryStream`? Is it different from calling `writeFloat` three times?

`writeVec3` takes a `FloatPos`. It writes x, y, and z with `writeFloat` in turn, so it is equivalent to calling `writeFloat` three times.

## Can LSE Node.js plugins share memory with each other? How can a Node plugin notify an external front-end program once the server has finished starting?

They cannot share memory directly; LSE isolates each Node.js plugin's execution environment. For calls between plugins, use `ll.exports` and `ll.imports` (remote function calls). To communicate with an external program, use the network: in the `onServerStarted` event, notify the program over HTTP (`network.httpGet` / `httpPost` or Node's built-in `http` module) or WebSocket (LSE's `WSClient` or the npm `ws` package). To check whether the server is still alive, send periodic WebSocket heartbeats and treat a timeout as a server crash. Exchanging data through files is less reliable than using the network. Users report that `process.send` does not work.

*Applies to: current version (Node.js engine)*

## In an LSE JS script plugin, can I keep a joining player on the "Loading resources" screen with almost no packets sent, and decide whether to let them in only after a `Promise` resolves?

Script plugins cannot suspend a player's connection during login or resource loading, nor control which packets are sent. Event callbacks such as `onPreJoin` are synchronous: they must decide immediately whether to intercept the connection and cannot wait for a `Promise`. You need a C++ mod that hooks the network and login flow directly.

## In LSE, building an `AddActor` packet with `BinaryStream` and sending it with `createPacket` fails or reports a parameter error. Why? Does using the `sendNetworkPacket` symbol fix it?

By default, `bs.createPacket(pktid)` creates a packet object of the matching type and reads it from the `BinaryStream` for parsing and validation. Some packets (such as `AddActor`) fail to parse when built from hand-assembled data. Starting in LSE 0.19.1, you can call `bs.createPacket(pktid, true)` to create a raw network packet that uses the bytes currently in the stream as the packet body without parsing, and then send it with `pkt.sendTo(player)` or `player.sendPacket(pkt)`. `?sendNetworkPacket@Player@@UEBAXAEAVPacket@@@Z` is essentially the same as `player.sendPacket`, so calling it instead does not solve the problem. Also, if a symbol in a JS string contains backslashes, escape them or use `String.raw`.

*Applies to: LegacyScriptEngine 0.19.1 and later (raw parameter); earlier versions cannot send `AddActor` with `createPacket`*

## After I change a map art's (the map in an item frame) NBT or the pixel data for a mapid on the server, the client does not refresh. How do I make the client show the update?

The server data has changed, but the client has not received an update packet. The client requests map data by sending `MapInfoRequestPacket` (`mMapId`, `mClientPixels`), and the server replies with `ClientboundMapItemDataPacket`; `UpdateBlockActorPacket` only tells the client the map ID in the item frame. When the map ID stays the same and only the data changes, send an `UpdateBlockPacket` to trigger a block update so the client requests the map data again. (Reloading with a command block `clone`, `structure`, or `pl.refreshChunks()` also forces a refresh, but causes flickering.) LSE can send packets directly with `pl.sendPacket`, though you must write the `BinaryStream` by hand; for the protocol, see <https://mojang.github.io/bedrock-protocol-docs/html/packets.html>. Note that every update goes to all players and consumes bandwidth.

*Applies to: LSE / LeviLamina current version (packet details depend on the BDS protocol). Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I transfer a player between two Bedrock servers? Can data be shared between them?

The transfer itself is simple: in LSE, call `pl.transServer(ip, port)`; in a C++ mod, construct a `TransferPacket` from `<mc/network/packet/TransferPacket.h>` with the target IP and port, then send it with `player.sendNetworkPacket`. However, server data (including each plugin's data) is not shared automatically. You must synchronize it yourself using shared storage such as MySQL, files, or a WebSocket relay.

*Applies to: LSE / LeviLamina current version*

## I want to write a `/ping` command that shows a player's latency to the server. Do LSE or LeviLamina have an interface that gets player latency directly?

You do not need to ping the player's IP from the server (the IP you see is often an ISP exit address, and ICMP ping is usually blocked). In LSE, use the device info object returned by `pl.getDevice()`: it exposes `dv.lastPing` (current latency in ms), `dv.avgPing` (average latency in ms), and the packet loss rates `lastPacketLoss`/`avgPacketLoss`. C++ mod developers can check `DeviceAPI.cpp` in the LSE source code to see how these properties are implemented.

*Applies to: LegacyScriptEngine current version*

## The server already has custom join/leave messages. How do I turn off the vanilla yellow "xxx joined/left the game" message? Can returning `false` from a `mc.listen('onJoin'/'onLeft')` callback in LSE block it?

No: `onLeft` cannot be intercepted, and while `return false` in `onJoin` does intercept the event, it blocks the player from joining rather than suppressing the message.

Instead, use one of these approaches:

1. Use a resource pack to modify `multiplayer.player.joined` / `multiplayer.player.left` in the language file.
2. Intercept the `TextPacket` sent to the client. In LSE, use the third-party ila-lseexport plugin (which exports iListenAttentively events) to listen for and cancel the packet-send event. In a C++ mod, depend on iListenAttentively's `SendPacketBeforeEvent`: `if (event.packet().getId() == MinecraftPacketIds::Text) event.cancel();` (filtering by the text content).

*Applies to: LegacyScriptEngine / iListenAttentively current version*

## When I build a fake chest (fake chest) inspection UI by sending packets with LSE, opening a large chest (double chest) closes immediately. How do I fix it?

When opening a container UI, the client expects a chest block at the target position; otherwise, the UI closes immediately. First, send the player fake chest blocks (a large chest requires two adjacent, paired chests), typically placed just above the player's head, and then send a `ContainerOpenPacket` to open the UI. In LSE, build the packet with `BinaryStream` and send it with `pl.sendPacket(packet)`. For a working example, see <https://github.com/Cdm2883/code-snippets/blob/vscode/LLSE/FakeChestLLSE/fake-chest.llse.js>

*Applies to: current version (depends on client behavior and the specific protocol version). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can the text above a player's head (name tag / floating text) be made visible only to specific players?

Yes. Send the entity name/metadata update packet (such as `SetActorDataPacket`) only to the target player; other players never receive the packet, so they never see the change. In LSE, build the packet with the Packet API (write the data into `new BinaryStream()`, then call `bs.createPacket(pktid)`) and send it to the target player with `pl.sendPacket(packet)`. Alternatively, use a dependency plugin that provides a packet-sending or floating-text interface. Note that your version must support the Packet API, and because packet structures change across BDS protocol versions, you must match the current protocol.

*Applies to: LegacyScriptEngine current version*

## In LSE, the status code returned by `network.httpGet()` is always `-1`, but the same URL works in a browser. Why?

Status code `-1` means the request itself failed (no response was received). First, print the assembled URL to verify that it is correct, and check both the request parameters and the server. One user ran into this because of a DNS resolution failure; switching to the IP address fixed it. You can also test the request with `curl`, or use a different HTTP library in a Node.js plugin.
