# Memory Hook 示例

## 作用

本示例演示如何通过 `pl::memory::resolveSignature()` 解析目标，使用 `pl::memory::HookHandle` 安装 hook，并在调用 `disable()` 或析构句柄时将其释放。

## 头文件

```cpp
#include <pl/memory/Hook.hpp>
#include <pl/memory/Signature.hpp>
```

## 示例

```cpp
#include <pl/Mod.hpp>
#include <pl/memory/Hook.hpp>
#include <pl/memory/Signature.hpp>

class MyMod {
public:
  bool enable() {
    const auto target = pl::memory::resolveSignature(
        "Game_update", "libminecraftpe.so");
    if (target == 0) {
      getSelf().getLogger().warn("Game_update was not found");
      return true;
    }

    mUpdateHook = pl::memory::HookHandle(
        reinterpret_cast<void *>(target),
        reinterpret_cast<void *>(&updateHook),
        reinterpret_cast<void **>(&mOriginalUpdate));
    return mUpdateHook.installed();
  }

  bool disable() {
    mUpdateHook.reset();
    return true;
  }

  [[nodiscard]] ll::mod::NativeMod &getSelf() const;

private:
  using UpdateFn = void (*)(void *);

  static void updateHook(void *self) {
    instance().mOriginalUpdate(self);
  }

  static MyMod &instance();

  UpdateFn mOriginalUpdate{};
  pl::memory::HookHandle mUpdateHook;
};
```

## 注意

- detour 的签名必须与目标函数完全一致。
- hook handle 应保存在模组自身的状态中，切勿定义为局部变量。
- 优先在明确的生命周期阶段执行清理，不要依赖构造阶段（constructor-time）的自动注册。
