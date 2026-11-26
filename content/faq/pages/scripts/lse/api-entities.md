# LegacyScriptEngine API: entities

## In LSE, I want the damage source of `pl.hurt(damage[,type[,source]])` to be another player. Can I pass a Player object directly? What is the difference between Player and Entity objects, and how do I convert a Player to an Entity?

LSE's Player object (runtime class name `LLSE_Player`) includes most of the methods and properties of Entity, but it is a separate type. For interfaces that require an Entity argument, call `pl.toEntity()` to convert the player to an Entity object (or `null` if the conversion fails). `toEntity` has long been available.

In the current version, the `source` parameter of `pl.hurt` and `en.hurt` accepts both Entity and Player objects internally, so you can call `target.hurt(damage, ActorDamageCause.EntityAttack, attackerPlayer)` directly; passing `attackerPlayer.toEntity()` also works. If you need vanilla damage calculation (such as armor reduction), you can run a command instead:

```js
mc.runcmdEx(`execute as "<attacker>" run damage <target> <amount> entity_attack entity @s`)
```

*Applies to: LSE 0.23.x*

## `entity.hurt()` in LSE needs an integer damage type. How do I get the enum values? Can the `cause` from the `onMobHurt` event be passed straight to `hurt()`?

LSE registers a global damage-cause enum object, `DamageCause`, and keeps `ActorDamageCause` with the same contents for compatibility. Its keys are the enum names and its values are ints, so you can use them directly—for example, `pl.hurt(1.0, ActorDamageCause.Fire)` or `pl.hurt(1.0, DamageCause.Fire)`. The signature of `hurt` is `hurt(damage, type?, source?)`. The `cause` parameter of the `onMobHurt` callback is the integer value of this enum and can be passed directly to `hurt()`. For the authoritative enum definition, see `src/mc/deps/shared_types/legacy/actor/ActorDamageCause.h` in the LeviLamina source (the enum table in the docs may be incomplete).

*Applies to: current LSE version*

## In LSE, `entity.name`/`getName` returns the untranslated key for Addon mobs (even though the resource pack's `zh_CN.lang` has a translation). How do I translate the entity name into a given language?

Since 1.19.80, BDS loads server I18n before resource packs. As a result, the server loads only the vanilla language files, and the language files in Addon resource packs never reach server I18n. You have several options:

1. For vanilla entities, take the entity `type` (such as `minecraft:zombie`), strip the `"minecraft:"` prefix to form the language key `entity.<name>.name` (such as `entity.zombie.name`), and translate that key.
2. Install the third-party GMLIB plugin. Its built-in I18nFix restores the loading order (it is disabled by default and must be enabled through the C++ interface or by a plugin that depends on it). Alternatively, use the GMLIB-LRCA interface to load the resource pack's `zh_CN.lang` into server I18n manually; interfaces that rely on server-side translation, such as `entity.name`, will then return the Chinese name directly.
3. Parse the resource pack's `.lang` files yourself and build a mapping, or use LSE's built-in `i18n.load` to load your plugin's own translation files and translate with `i18n.tr`/`trl` (note that this uses the plugin's own translation system, not BDS's I18n).

*Applies to: BDS 1.19.80 and later; GMLIB-related options are third-party plugins. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In an LSE JS plugin, using an entity object as a Map key or comparing two entity objects with `==` fails to find or match them. What should I do?

Every entity or player object returned by LSE is a freshly created JS wrapper with no custom equality logic, so comparing two objects with `==`/`===` or using them as Map keys never matches. Compare or key by the entity's `uniqueId` instead—for example, `Boss.find(entity => entity.uniqueId == mob.uniqueId)`.

## Which parameters does `entity.distanceTo()` accept in LSE? Passing `pos.x`/`pos.y`/`pos.z` gives a parameter type error or `too few arguments`. What should I do?

With a single argument, `distanceTo` accepts an IntPos, FloatPos, Player, or Entity—pass a position object such as `player.pos` directly rather than splitting it into `.x` `.y` `.z`. Otherwise, pass 4 numeric arguments: `x, y, z, dimid` (passing only 3 causes an argument-count error). For example:

```js
const pos = player.pos;
if (entity.distanceTo(pos) > R) { /* ... */ }
```

If the target is in a different dimension from the entity, the return value is a very large number (`INT_MAX`). Player also has a `distanceTo` method with the same name, along with the alias `distanceToPos`.

## In LSE, why does checking whether an entity is a player with `entity.isPlayer` (without parentheses) always succeed?

`isPlayer` is a function, so call it with parentheses: `entity.isPlayer()` (just like `pl.isOP()`). Without parentheses, you are evaluating the function object itself, which is always truthy because the function exists.

## In LSE, how do I convert an entity object (Entity) to a player object (Player)?

Use `en.toPlayer()`. It returns `null` if the entity is not a player or the conversion fails, so you can check with `en.isPlayer()` first. This API is documented on the "Entity" page and in the d.ts type definitions in the legacy-script-engine-api repository (`GameAPI/Entity/Entity.d.ts`). To convert in the opposite direction, use `pl.toEntity()`.

## In LSE, how do I open a menu when a player right-clicks (interacts with) or left-clicks (attacks) an entity?

For right-click interactions, use the `onPlayerInteractEntity` event, added in LSE 0.9.5:

```js
mc.listen("onPlayerInteractEntity", (pl, en, pos) => {
  if (en.type == "minecraft:entity_id") {
    pl.runcmd("command that opens the menu");
  }
});
```

Interaction means right-clicking with a mouse, long-pressing on a touch screen, or pressing the interact button on the entity.

For left-click attacks, use `onAttackEntity(player, entity)` or `onMobHurt`:

```js
mc.listen("onMobHurt", (m, s, d, c) => {
  if (s && s.isPlayer() && m.type == "minecraft:entity_id") {
    s.toPlayer().runcmd("command that opens the menu");
  }
});
```

Note that the `source` of `onMobHurt` may be `null`, so check it first.

*Applies to: LSE 0.9.5 and later*

## Does the LSE JS plugin API have an interface for spawning or handling experience orbs?

There is no dedicated experience orb interface, but you can use the generic entity spawning API: `mc.summonMob("minecraft:xp_orb", pos)` (added in 0.19.1, following the same code path as `/summon`) spawns the orb and returns an `Entity` object, which you can then manage with the entity API. Alternatively, run `mc.runcmdEx("summon xp_orb x y z")`. See the entity API page for details: <https://levimc.org/LegacyScriptEngine/apis/GameAPI/Entity/>.

*Applies to: LSE 0.19.1 and later (`summonMob`)*

## How do I generate loot (drops) for a mob in an LSE script?

LSE has no direct loot table API. Your options are:

1. Spawn an entity of the same type with `mc.spawnMob(type, pos)`, then kill it with `entity.hurt(damage[, type[, source]])` so it drops its items.
2. Run the vanilla `/loot` command (`mc.runcmd`). The source can be an entity (`kill`) or a loot table (`loot`), and you can combine it with options like `mainhand` to simulate killing with a tool (such as Looting).
3. Parse the loot table JSON yourself and calculate the drops.
4. Implement the logic in a C++ mod and export it to scripts.

*Not confirmed against the source code or documentation; treat this as a pointer.*

## How do I apply an impulse or velocity to a player in LSE (like `applyImpulse` in ScriptAPI)?

Use `setPosDelta` on `Entity`: call `player.toEntity().setPosDelta(x, y, z)`, or pass a `FloatPos` with `en.setPosDelta(delta)`. This sets the entity's per-tick position change (its motion), works on players as well, and returns whether it succeeded.

## In LSE, calling `mc.spawnMob` inside a mob spawn event callback causes an infinite loop / stack overflow and crashes the server. Why, and how do I avoid it?

Under the hood, `mc.spawnMob` calls the Level's Spawner (`BedrockSpawner`) `spawnMob`, which uses the same logic as natural spawning. Because the mob spawn event (`onMobTrySpawn`, formerly `onMobSpawn`) hooks this exact function, calling `spawnMob` inside the callback re-triggers the event and recurses indefinitely.

Solutions:

- Guard against re-entry with a flag variable: when the event fires, return immediately if the flag is `true`; otherwise, set it to `true`, spawn the entity, and reset it to `false`.
- Use `mc.summonMob`, added in LSE 0.19.1. It uses the summon command's spawn logic and bypasses `Spawner::spawnMob`. However, entities spawned this way are made persistent and never despawn naturally, so be careful with heavy use.

Note that because the entity does not exist yet when the spawn event fires, you cannot add a tag afterward to identify it. If you simply want more mobs to spawn, it is better to increase the herd size in `spawn_rules` using a behavior pack.

*Applies to: LeviLamina + LegacyScriptEngine current version (`mc.summonMob` requires LegacyScriptEngine 0.19.1 or later)*

## I want to disable almost all entity spawning with LSE (including spawn eggs, commands, etc.). Can LSE do that?

LSE can only intercept mob spawning that goes through `Spawner::spawnMob`:

- `onMobTrySpawn`: `return false` to intercept. Although the documentation describes it as firing when "an entity attempts to spawn naturally", it actually hooks `BedrockSpawner::spawnMob`, so non-natural paths like LSE's own `mc.spawnMob` also trigger it. You will need to test whether spawn eggs and other mechanisms go through this function.
- `onMobSpawned`: fires as a notification after spawning completes and cannot be intercepted.
- For projectiles, use `onSpawnProjectile`.

`/summon` bypasses `spawnMob` (its spawn logic is in the anonymous-namespace function `CommandUtilsAnon::_spawnEntityAt`), so intercepting it requires a native C++ hook. While deleting entity registrations directly is theoretically possible, it is too invasive and may cause plugin conflicts or other problems, so it is not recommended.

*Applies to: LegacyScriptEngine current version*

## How do I attach custom data to an entity (like custom NBT on an item), and how do I get a single entity by `uniqueId` in LSE?

You can store the data in your plugin's own data file using the entity's `uniqueId`, or add a tag to the entity with `en.addTag(tag)` (`Actor::addTag` in C++). To get a single entity by `uniqueId`, use `mc.getEntity(id)` (added in LSE 0.9.5), which takes the entity's `UniqueId` or `RuntimeId` and returns `null` on failure. You can also iterate through the results of `mc.getAllEntities()` or `mc.getEntities(...)` to find it.

*Applies to: LegacyScriptEngine 0.9.5 and later*

## I want a mob to be visible only to a specific player and attack only that player. Can an LSE JS plugin do this?

You can make a mob "Visible only to a specific player" by intercepting or customizing the packets sent to the client (using native packet capabilities or a plugin). However, you cannot check or control a mob's locked attack target in JS, because LSE completely removed NativeAPI long ago. You must implement this in a native C++ mod.

*Applies to: LegacyScriptEngine 0.8.19 and later*

## Can LSE get all entities to clean up entities in unloaded chunks? How do I get all entities in C++?

No. In LSE, `mc.getAllEntities()` gets all entities, and `mc.getEntities(pos...)` queries entities within a coordinate range. Because both return only loaded entities and cannot access unloaded chunks, a script cannot clean up unloaded entities. In a C++ mod, you can get all loaded entities with `Level::getRuntimeActorList()` or `Level::getEntities()`.

*Applies to: LSE / LeviLamina current version*
