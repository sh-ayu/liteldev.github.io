# LegacyScriptEngine API: forms and on-screen text

## What does the callback receive in LSE when a player closes a form (Esc/back)? The docs say Null, but the `data === null` check in JS does not work. What should I do?

When a player cancels a form, the callback result (`id` for a SimpleForm, `data` for a CustomForm, or `result` for a ModalForm) is empty. Because ScriptX does not distinguish between null and undefined at the C++ level, the empty `Local<Value>` returned by LSE becomes `undefined` in JS, causing `data === null` to fail. To check whether the player closed the form, use `data == null` or `!data` (for a SimpleForm, use `id == null` because `!id` is also true when `id` is 0). The third callback parameter, `reason`, gives the cancellation reason (0 = UserClosed, 1 = UserBusy) and may also be empty.

*Applies to: all current LSE versions*

## In an LSE/LLSE script plugin, how do I send the player back to the previous form after they click a form, and how do I detect that the player closed the form?

Call `pl.sendForm(form, callback)` again with the previous form. Common approaches include:

1. Wrap building and sending the form in a named function (and define the callback as a named function too); to go back, call that function again from the callback.
2. Cache the previous form instance and pass it along with the callback to `player.sendForm` when going back.
3. Use a class that maintains a session stack of the "current form / previous form" to support multi-level back navigation.

If the player closes the form directly, the callback's result argument is empty (`undefined` in JS). Check for this with `data == null`.

*Applies to: all current LSE versions (the LLSE-era approach works too)*

## What can the image parameter of an LSE/LLSE form button (`SimpleForm.addButton`) be, and how do I use a custom image?

The `image` parameter of `addButton(text, image)` accepts one of two values:

1. A resource pack texture path, such as the vanilla `textures/items/diamond`, or `textures/test/test` for a custom resource pack containing `textures/test/test.png`. The player must have that resource pack loaded.
2. A network image URL starting with `http` (LSE automatically detects this as the url type).

URL images load slowly on the client and occasionally fail to display. Because this is client behavior, use a resource pack path for reliability. There is no hard limit on image size; it mainly affects the aspect ratio.

*Applies to: all current LSE versions*

## The built-in LSE form API is awkward. Is there a form wrapper library that binds callbacks directly to buttons and supports async?

Use the third-party library FormAPIEx (<https://github.com/lgc-LLDev/FormAPIEx>), which provides a form wrapper with type hints (d.ts), async syntax, and callbacks bound directly to buttons. See `FormAPIExExample.js` in the repository for an example. XYSDK (<https://github.com/xianyubb/XYSDK>) includes a similar wrapper, or you can wrap LSE's `mc.newSimpleForm` and `mc.newCustomForm` in Promises yourself.

*Applies to: LSE (JS); you must verify the compatibility of third-party libraries yourself. Not confirmed against the source code or the documentation: treat this as a pointer.*

## Passing the online player list to the `fm.addDropdown` of an LSE custom form throws `"can't cast value as string"`. How do I list all online player names in the dropdown?

`mc.getOnlinePlayers()` returns `Array<Player>`, whereas the `items` parameter of `fm.addDropdown(title, items[, default, tooltip])` expects `Array<String>`. Passing Player objects directly throws `can't cast value as string` during string conversion. Convert the list to an array of player names first:

```js
let names = mc.getOnlinePlayers().map(player => player.name);
fm.addDropdown("选择玩家", names);
```

Read each player's name from the Player object's `name` (or `realName`) property.

*Applies to: current version of LegacyScriptEngine*

## In LSE, can a form sent to a player only be closed by client interaction? Is there a way to force-close or overwrite an open form from code?

LSE now provides `pl.closeForm()` directly (`closeForm` was added in 2025-05). It sends a ClientboundCloseFormPacket to the client to close the form, so you no longer need to build the packet manually.

To overwrite or update an open form, pass the optional parameter `forUpdating=true` (added in 0.11.0) when sending it—for example, `pl.sendForm(fm, callback, true)` (`sendModalForm`, `sendSimpleForm`, and `sendCustomForm` also support this parameter). This sends the form as an update. The `send*` functions also return the ID of the sent form.

*Applies to: LSE 0.11.0 and later*

## In LSE, how do I create and send a custom form (CustomForm)?

See the documentation at <https://levimc.org/LegacyScriptEngine/apis/GuiAPI/FormBuilder/>. Example:

```js
var fm = mc.newCustomForm();
fm.setTitle("标题");
fm.addLabel("文本");
fm.addInput("描述", "提示", "默认内容");
fm.addSwitch("开关", false);
fm.addDropdown("下拉", ["选项1", "选项2"], 0);
fm.addSlider("滑块", min, max, step, initial);
fm.addStepSlider("步进滑块", ["选项1", "选项2"], 0);
pl.sendForm(fm, (player, data, reason) => { /* ... */ });
```

In the callback, `data` is an array of values ordered by control, or `null` if the player canceled the form. `reason` gives the cancellation reason (0 = UserClosed, 1 = UserBusy) and can also be `null`. Newer versions also support `addHeader`, `addDivider`, `setSubmitButton`, and a `tooltip` parameter on each control.

## When building a form with CustomForm (`mc.newCustomForm`) in LSE, how do I get the value of an input box? How do I tell whether the player submitted the form or closed it?

CustomForm includes a built-in submit button, so you do not need to add one. The callback signature for `pl.sendForm(fm, callback)` is `function(player, data, reason)`:

- `data` is an array of values in the order the controls were added. Use the matching index to get an input box's value; for example, the 3rd control is `data[2]`.
- If `data` is `null`, the player cancelled or closed the form; if it is not `null`, the form was submitted.
- `reason` is the cancellation reason (`0` = UserClosed, `1` = UserBusy) and may be `null`.

If you are unsure, `log` all the callback parameters to inspect them.

*Applies to: LSE 0.23.x*

## Can LSE form callbacks such as `player.sendForm` now tell why the player cancelled the form?

Yes. Starting in LSE 0.9.0, form callbacks pass an extra `reason` parameter (an Integer corresponding to LeviLamina's `FormCancelReason`) for the cancellation reason. For example, a `SimpleForm` callback is `function(player, id, reason)`, and a `CustomForm` callback is `function(player, data, reason)`. On a normal submission, `reason` may be `null`.

*Applies to: LSE 0.9.0 and later*

## After a selection in an LSE custom form's `addDropdown(title, [a, b])`, does the callback's `data` contain the option index or the option value?

It contains the index of the selected item (starting from 0). For example, selecting the first item `a` returns `0`, and you look up the value yourself with `items[data[i]]`.

## In an LSE custom form (`mc.newCustomForm`), if an `addInput` field is left empty and the form is submitted, does the callback return an empty string, `undefined` or `null`? How do I handle the player closing the form?

Submitting the field without input returns an empty string `""`. When the player closes or abandons the form, `data` (or `id` for a `SimpleForm`) is empty (`null` / `undefined`), and the third parameter, `reason`, gives the cancellation reason (0 = `UserClosed`, 1 = `UserBusy`, and it may also be `null`). Check for this at the start of the callback with `if (data == null) return;`, and optionally notify the user that the form was closed.

## In LSE (JS), after sending a modal form (two buttons, confirm and cancel) with `pl.sendModalForm`, what values can the callback's `result` take? Do I need an extra `null` check?

The callback signature is `function(player, result, reason)`. `result` is `true` if the player clicks confirm (the upper button, button 1) and `false` if they click cancel (the lower button, button 2). If the player closes the form with X, `result` has no value (the documentation says Null, but JS actually receives `undefined`). You can usually handle this the same way as cancel—for example, with `if (result) {...} else {...}`—without a separate `else if` check for `null`. To tell why the form was closed, check the third parameter, `reason`, which gives the cancellation reason and is set only on cancellation.

*Applies to: LSE 0.9 and later; still applies to current 0.23.x*
