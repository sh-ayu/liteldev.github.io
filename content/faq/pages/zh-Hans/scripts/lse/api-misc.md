# LegacyScriptEngine API：其他 API

## LSE JS 插件中打印查询结果输出 `[object Object]`，用 `String()` 也一样，怎么打印出对象内容？

查询结果是普通对象，调用 `String()` 或 `toString()` 只会返回 `[object Object]`。请先用 `JSON.stringify(results)` 将其转为 JSON 字符串再打印，例如 `logger.info(JSON.stringify(results))`。

*适用版本：当前版本（JS 引擎）*

## LSE 插件中调用 GMLIB 提供的 `PAPI.GetValueWithPlayer`（传 xuid）获取占位符值不生效，正确的 PAPI 翻译写法是什么？

无需逐个提取占位符再取值，直接调用 `PAPI.translateString(字符串, 玩家对象)` 即可。注意第二个参数应传入玩家对象而非 xuid（也不存在 `translateStringWithPlayer` 方法）。第一个参数传入完整字符串，保留占位符前后的 `%`，一段文本中的多个占位符可以一次性完成翻译。例如：

```js
PAPI.translateString("玩家名字：%player_name%，服务器mspt：%server_mspt%", pl)
```

此功能依赖第三方库 GMLIB 及其 LSE 导出。

*适用版本：安装了 GMLIB 及其 LSE 导出的服务器。未能从源码或文档中直接证实，仅供参考。*

## LSE 插件里用到的 Minecraft 类是由哪个前置插件提供的？

Minecraft 类并非 LSE 自带，而是由第三方前置 GMLIB 的 LSE 导出接口（GMLIB-LegacyRemoteCallApi）提供。使用时需安装 GMLIB 及其 LSE 支持。

*适用版本：使用 GMLIB 的 LSE 插件。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 下有没有可以在 LSE 插件里使用的非实体悬浮字 API？

LSE 本身不提供悬浮字 API。你可以安装第三方前置 GMLIB 及其 LegacyRemoteCall 导出（GMLIB-LRCA），通过它提供的 API 在 LSE 插件中实现悬浮字。

*适用版本：需安装第三方 GMLIB 及 GMLIB-LRCA，版本需与当前 LeviLamina 匹配。未能从源码或文档中直接证实，仅供参考。*

## PAPI 变量（如坐标）显示带小数，如何让它不显示小数？

PAPI 内置的这些变量是为了兼容 LL2 时代而保留的，无法直接修改格式。建议自行通过 PAPI 注册一个玩家变量（例如使用 `registerPlayerPlaceholder`）：接收玩家对象，获取坐标并转为整数字符串后返回。需要四舍五入可用 `Math.round(x).toString()` 或 `Number(x).toFixed(0)`，需要截断小数可用 `Math.floor(x)`。

*适用版本：使用第三方 PlaceholderAPI（如 GMLIB-LegacyRemoteCallApi 提供的 PAPI）的 LSE 插件。未能从源码或文档中直接证实，仅供参考。*

## 使用 GMLIB-LegacyRemoteCallApi 提供的 PlaceholderAPI（PAPI）时，如何查看当前所有可用的 PAPI 变量？

在控制台中，通过 LSE（QuickJS 引擎）的 `jsdebug` 调试命令执行以下代码：

```shell
jsdebug require('./GMLIB-LegacyRemoteCallApi/lib/BEPlaceholderAPI-JS.js').PAPI.getAllPAPI()
```

即可列出所有已注册的变量（路径以实际安装位置为准）。

*适用版本：安装了第三方 GMLIB-LegacyRemoteCallApi 及 LSE QuickJS 引擎时。未能从源码或文档中直接证实，仅供参考。*
