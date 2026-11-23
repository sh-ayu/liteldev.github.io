# 开发工具

读完本页，你就能使用界面里为制作包的人准备的两个工具：在一个边输入边检查的表单里创建和编辑 `lip.toml`，以及迁移旧的 `tooth.json`。

如果你只是运行服务器，用不到这个页面。想了解什么是包、怎样发布包，请阅读[用 lip 发布你的模组](https://levimc.org/zh-Hans/tutorials/develop/publish-a-package/)。

## 页面

这些工具在当前工作区里操作。要处理你自己的模组，请在模组的文件夹里启动 `lip`，或者在从顶部一行打开的[工作区选择器](workspaces.md)里选择那个文件夹。

打开页面：在侧边栏移到**开发工具**，按 `Enter`。

![文件夹 D:\projects\WelcomeMod 里的“开发工具”页：两个操作，其中“迁移 tooth.json”是灰色的；下面是关于所选操作的一句话，再下面是工作区，以及它有没有 lip.toml 和 tooth.json，两者都是“不存在”。](/screenshots/zh-Hans/tools-05-status.svg)

1. 所选操作的作用。用 `↑` `↓` 移动，按 `Enter` 执行。
2. 当前工作区：这些操作所在的文件夹。
3. 这个文件夹里有没有 `lip.toml` 和 `tooth.json`：**已存在**或**不存在**。lip 每两秒查看一次，所以这两行会跟上你在 lip 之外做的改动。
4. 灰色的操作：按文件夹现在的情况做不了的操作。见[灰色的操作](#灰色的操作)。

| 操作 | 作用 | 在命令行上 |
| --- | --- | --- |
| **创建 lip.toml** | 打开一个表单，为新的包写出包文件。文件夹里已有 `lip.toml` 时，这个操作是**编辑 lip.toml**，表单编辑的就是那个文件。 | [`lip pkg init`](../reference/commands/pkg_init.md) 也能创建，但没有表单 |
| **迁移 tooth.json** | 把 lip 0.x 的包文件转换为 `lip.toml`。 | [`lip pkg migrate`](../reference/commands/pkg_migrate.md) |

## 灰色的操作

**迁移 tooth.json** 做不做得了，由状态行里的两个文件决定。被它们排除时，它显示为灰色。选中它时，说明下面会多出一行原因，屏幕最下面一行也不再列出 `Enter`。

![选中了灰色的“迁移 tooth.json”操作。它的说明下面写着“这里没有 tooth.json。”](/screenshots/zh-Hans/tools-06-migrate-disabled.svg)

1. 原因。

| 何时变灰 | 页面上的说明 |
| --- | --- |
| 文件夹里已有 `lip.toml`。lip 不会替换它。 | **这里已有 lip.toml。** |
| 文件夹里没有 `tooth.json`。 | **这里没有 tooth.json。** |

第一个操作从不变灰：它要么创建 `lip.toml`，要么编辑已有的那个。服务器是否在运行对这个页面没有影响：两个操作都不会改动服务器。

文件的情况一变，操作就恢复可用：你在 lip 之外做的改动，两秒之内就会反映出来。

## 创建 lip.toml

1. 移到**创建 lip.toml**，按 `Enter`。表单会取代列表。它的标题是**创建 lip.toml**，后面是它要写出的文件的路径。`lip.toml` 的每个键在表单里都有一行，并且已经按 Windows x64 服务器填好，版本是 `0.1.0`。只缺包 ID：在你输入之前，标题下面一行写着**有 1 项需要修正。**

2. 输入包 ID：包的仓库地址，例如 `github.com/owner/repo`。

   ![路径为 D:\projects\WelcomeMod\lip.toml 的“创建 lip.toml”表单。顶部写着“✓ 所有内容均有效。”“包”一节里有“包 ID” github.com/steve/WelcomeMod 和“版本” 0.1.0，各自标着 ✓；“信息”一节里有“名称”“描述”“图标网址”和“标签”；下面开始是“默认变体”一节。底部是“保存”和“取消”两个按钮。](/screenshots/zh-Hans/tools-07-init-form.svg)

   1. 每个值在输入时就会检查，结果标在它的右边：`✓` 合法，`✗` 不合法，`⋯` 正在联网检查。所选行的下面有一行说明这个值是什么；标着 `✗` 的值下面写着它为什么不合法。
   2. 整个文件是否合法：**所有内容均有效。**，或者有几项需要修正、正在联网检查、未能确认。

   用 `↑`、`↓` 和 `Tab` 在各行之间移动，直接输入就会填进所选的行。在内容更多的行上，比如变体的条目或者一个列表，按 `Enter` 会打开菜单：添加或删除条目、资源、变体。每个变体的一节在第一屏下面继续；`PgDn` 一次移动十行。

3. 按 `Ctrl+S`，或在底部的**保存**上按 `Enter`。lip 写入之前会先询问。只要还有标着 `✗` 的值，它就什么也不写：它会提示**请先修正标记为 ✗ 的内容。**，并移到第一个这样的值上。

   ![“保存 lip.toml”对话框。“更改”下面是“将写入新的 lip.toml：”和五行以 + 开头的内容：format = 4、ID、版本 0.1.0、side "server" 和 platform "win-x64"。“预计安装情况”下面是“依据 Marketplace 的信息，针对使用以下版本的服务器。以 lip install 的实际结果为准。”、BDS ‹ 1.26.60 ›、LeviLamina ‹ 26.60.3 ›，以及“✓ github.com/steve/WelcomeMod  有适用于 server、win-x64 的条目。”底部是“保存”和“取消”。](/screenshots/zh-Hans/tools-08-init-save.svg)

   - **更改**：要写入的键。`+` 表示新增的键，`~` 表示改变的键（带旧值和新值），`-` 表示删除的键。
   - **预计安装情况**：依据市场的信息，假如把这个包安装到使用上面两行 **BDS** 和 **LeviLamina** 版本的服务器上，会是什么结果。用 `↑` 移到这两行，用 `←` `→` 切换版本；有多个变体的包还有第三行**变体**。这个包和它的每个依赖各占一行：会被安装的标 `✓`，不会被安装的标 `✗` 并写明原因。这只是预计：以 [`lip install`](../reference/commands/install.md) 的实际结果为准。

   对话框打开时选中的是**保存**：按 `Enter` 写入文件。按 `Esc` 或**取消**回到表单。

4. lip 写出 `lip.toml`，关闭表单，并在屏幕底部提示**已保存 lip.toml。**

这个例子的 `lip.toml`：

```toml
format = 4
id = "github.com/steve/WelcomeMod"
version = "0.1.0"

[[variants.""]]
side = "server"
platform = "win-x64"
```

在表单里按 `Esc` 会关闭它。如果你改过内容，lip 会先在**未保存的更改**对话框里询问：**放弃**关闭表单而不写入，**取消**回到表单。切换到别的页面时也会这样询问。

每个键的含义见 [lip.toml](../concepts/lip_toml.md)。

### 编辑 lip.toml

文件夹里有了 `lip.toml` 之后，第一个操作就变成了**编辑 lip.toml**：

![“开发工具”页：第一个操作是“编辑 lip.toml”，它的说明是“在表单中编辑工作区的 lip.toml，输入时自动检查每一项。”，lip.toml 的状态行是“已存在”。右下角写着“已保存 lip.toml。”](/screenshots/zh-Hans/tools-09-edit.svg)

1. 文件夹里现在有 `lip.toml` 了：用同一个表单编辑它。

按 `Enter` 会用表单打开这个文件，标题是**编辑 lip.toml**。保存时，表单里没有对应行的键会保留下来。**保存 lip.toml** 对话框会说明文件里的注释和格式是否也会保留：**lip.toml 中的注释和其他键会保留。**，或者 **lip.toml 将被重写：其他键会保留，但注释和格式不会保留。** 如果表单打开之后磁盘上的文件被改过，lip 写入之前会再问一次：**覆盖**还是**取消**。

如果 `lip.toml` 不是 TOML 文件，或者其中某个键的值类型不对，lip 不会用表单打开它，而是提示**无法在这里编辑 lip.toml。请先手动修正：**以及哪里有问题。请用文本编辑器修好文件，再选一次这个操作。

### 依赖

变体的每个条目都有一行**依赖**，末尾是 **+ 添加…**。在它上面按 `Enter` 有两个选择：

- **在 Marketplace 中查找…**：输入名称、ID 或标签，在[市场](get_mods.md)的模组里搜索，在其中一个上按 `Enter`；
- **输入包 ID…**：任意一个包 ID；不是默认变体时，加上 `#` 和变体名。

接着 lip 列出这个包的版本，最新的在前；包有多个变体时，在列表上方用 `←` `→` 选择变体。在一个版本上按 `Enter`，或者在最后一行**不选版本：直接输入范围**上按 `Enter`。然后 lip 提供这些范围：

| 范围 | 允许 |
| --- | --- |
| **补丁更新（推荐）** | 不低于所选版本的所有补丁版本。 |
| **次版本更新** | 直到下一个主版本之前的所有版本。 |
| **此版本或更新** | 所选版本及所有更新的版本。 |
| **仅此版本** | 只允许所选版本。 |
| **任意版本** | 任意版本，总是取最新。 |
| **自定义** | 你输入的范围，例如 `>=1.2.0 <2.0.0`、`^1.2.0`、`~1.2.0` 或 `1.*`。 |

下面会显示所选范围内有多少个已知版本，以及其中最新的版本。按 `Enter` 采用这个范围。

在列表里已有的依赖上按 `Enter`，可以选择**选择版本…**、**版本范围…**、**修改包 ID…**和**删除**。每个依赖都会联网检查：找到时标 `✓` 并写着**已找到；范围内最新：**和一个版本；找不到这个包、它的变体或范围内的版本时标 `✗`；lip 无法检查时标 `?`。联网检查的结果从不妨碍你保存。

## 迁移 tooth.json

lip 0.x 的包用 `tooth.json` 描述自己。这个操作写出内容相同的 `lip.toml`，并删除 `tooth.json`。

1. 移到**迁移 tooth.json**。状态行是 `lip.toml` **不存在**、`tooth.json` **已存在**时，它才可以选择。

   ![选中了“迁移 tooth.json”操作。状态行显示 lip.toml 不存在、tooth.json 已存在。](/screenshots/zh-Hans/tools-10-migrate.svg)

   1. 让这个操作可以进行的状态行。

2. 按 `Enter`。如果 `tooth.json` 缺少 `lip.toml` 需要的内容，lip 会逐项询问。这里旧文件没有写明适用的平台：

   ![标题为“lip 询问”的对话框询问“the platforms (RIDs, comma-separated, e.g. win-x64) the variants without a platform apply to”，输入框里是 win-x64。](/screenshots/zh-Hans/tools-11-migrate-question.svg)

   输入回答，按 `Enter`。无效的回答会被重新询问。

3. lip 显示结果。按 `Enter`。

   ![“迁移 tooth.json”对话框里有一行以警告符号开头、关于 preserve_files 的内容，最后是“已将 tooth.json 迁移为 lip.toml。”和“确定”按钮。](/screenshots/zh-Hans/tools-12-migrate-result.svg)

   1. 以 `⚠` 标出的提示：新文件里换了一种写法的内容，或者新文件里没有位置放的内容。请逐条阅读，并检查 `lip.toml` 里对应的部分。提示是英文。
   2. 结果：`lip.toml` 已写入，`tooth.json` 已删除。

4. 状态行现在反过来了，这个操作也变灰了：已经没有可迁移的东西。第一个操作现在是**编辑 lip.toml**：用表单打开新文件检查一遍。

   ![第一个操作是“编辑 lip.toml”。选中了“迁移 tooth.json”，页面上写着“这里已有 lip.toml。”状态行显示 lip.toml 已存在、tooth.json 不存在。](/screenshots/zh-Hans/tools-13-migrated.svg)

两种格式之间有哪些变化，见[迁移包](../authors/migrating_packages.md)。

## 操作失败时

页面只根据两个状态行来判断操作要不要变灰。操作仍然可能因为别的原因失败，例如 `tooth.json` 写坏了、文件夹刚刚被删掉。这时 lip 会显示一个对话框，标题是操作的名称加上**失败**，并且不改动任何东西。

![“迁移 tooth.json · 失败”对话框以“错误: Cannot read tooth.json”开头，后面是三行以“caused by:”开头的内容，并给出一个报告文件。](/screenshots/zh-Hans/tools-23-failed.svg)

1. **错误**：出了什么问题，通常还有该怎么办。每一行 **caused by:** 都把原因再往深处说一层，最后一行往往最具体。这里是 `tooth.json` 里没有 `version`。这段文字来自命令，是英文。
2. **完整报告**：记录详细信息的文件，位于工作区的 `.lip/logs` 下。求助时请附上它，见[故障排除](../guides/troubleshooting.md)。

按 `Enter` 或 `Esc` 关闭对话框。
