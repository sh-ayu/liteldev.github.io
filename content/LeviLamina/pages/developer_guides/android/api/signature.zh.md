# Signature API

## 作用

Signature API 用于在已加载的模块中解析符号或字节特征。

## 头文件

```cpp
#include <pl/memory/Signature.hpp>
```

## 函数

```cpp
uintptr_t resolveSignature(std::string_view signature,
                           std::string_view moduleName);

std::unordered_map<std::string, uintptr_t>
resolveSignatures(std::span<const std::string> signatures,
                  std::string_view moduleName);
```

解析失败时返回 `0`。

## Pattern 格式

```text
48 8B ?? ?? 89
488B????89
```

通配符：

| Pattern | 含义 |
| --- | --- |
| `?` | 整字节通配 |
| `??` | 整字节通配 |
| `A?` | 低半字节通配 |
| `?F` | 高半字节通配 |

## 示例

```cpp
#include <pl/memory/Signature.hpp>

uintptr_t update = pl::memory::resolveSignature(
    "Game_update", "libminecraftpe.so");

if (update == 0) {
  update = pl::memory::resolveSignature(
      "48 8B ?? ?? 89", "libminecraftpe.so");
}
```

在同一模块中解析多个特征时，优先使用 `resolveSignatures()`。

## 虚表函数

`<pl/memory/Vtable.hpp>` 通过 RTTI（而非字节特征）解析虚函数：

```cpp
uintptr_t resolveVtableFunction(std::string_view typeInfoName, size_t slot,
                                std::string_view moduleName);
```

`typeInfoName` 是 Itanium typeinfo-name 符号（`"_ZTS9CameraAPI"`）或其保存的名称（`"9CameraAPI"`），`slot` 是函数相对于虚表地址点（address point）的索引。解析失败时返回 `0`。
