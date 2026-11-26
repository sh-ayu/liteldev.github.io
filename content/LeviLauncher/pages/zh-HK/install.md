# 安裝 LeviLauncher

LeviLauncher 有 Windows 版和 Android 版，另有一個處於測試階段的 macOS 版。下方已自動選中適合你裝置的分頁。

## 需要什麼

=== "Windows"

    - Windows 10 或 11。
    - 從 Microsoft Store 取得的正版 Minecraft 基岩版（GDK / UWP）。

=== "Android"

    - ARM64 裝置上的 Android 9.0 或更高版本。
    - 在這部裝置上從 Google Play 購買並安裝的 Minecraft 基岩版 1.21.80 或更高版本。

=== "macOS"

    - Apple 晶片的 Mac，macOS 14.6 或更高版本。
    - 正版 Minecraft 基岩版。LeviLauncher 透過 Wine 執行 Windows（GDK）版遊戲。

::: info iOS
LeviLauncher 沒有 iOS 版，我們也沒有開發 iOS 版的計劃。
:::

## 安裝

=== "Windows"

    1. 開啟 [LeviLauncher 的最新發行版](https://github.com/LiteLDev/LeviLauncher/releases/latest)，下載 `LeviLauncher-amd64-installer.exe`。
    2. 執行它並完成安裝精靈。它會要求管理員權限，因為預設安裝到 `Program Files`。如果它要安裝 WebView2 或其他元件，讓它繼續。

    發行版裡還有兩個檔案，一般用不到：

    | 檔案 | 用途 |
    | --- | --- |
    | `LeviLauncher.exe` | 可攜版：把它單獨放進一個新建的、路徑裡只有英文字母的資料夾，直接執行。 |
    | `LeviLauncher.zip` | 啟動器自我更新時下載的更新包。 |

=== "Android"

    1. 在裝置上開啟 [LeviLauncher Android 版的最新發行版](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest)，下載檔名以 `-release.apk` 結尾的檔案。
    2. 開啟下載的檔案。如果 Android 提示瀏覽器不允許安裝應用程式，點選**設定**，開啟**允許來自此來源的應用程式**，返回後點選**安裝**。

=== "macOS"

    macOS 版仍在測試階段：它在標有 **Pre-release** 的發行版裡，不在最新的穩定版裡。

    1. 開啟 [LeviLauncher 的發行版列表](https://github.com/LiteLDev/LeviLauncher/releases)，找到最新的、帶有 `LeviLauncher-macos-arm64-installer.dmg` 的發行版。
    2. 下載這個檔案並開啟，把 **LeviLauncher** 拖進**應用程式**。

    UWP 實例僅支援 Windows。

## 確認裝好了

啟動 LeviLauncher，它的視窗會開啟；第一次啟動時顯示首次啟動設定（Windows、macOS）或授權協議（Android）。

## 更新

=== "Windows"

    LeviLauncher 啟動時會檢查新版本並提示安裝，更新在原位進行。想自己檢查，開啟**設定**點選**檢查更新**，或執行 `LeviLauncher.exe self-update`。

=== "Android"

    LeviLauncher 發現新版本時會提示，下載它的 APK 並交給 Android 安裝。如果你的網路連不上 GitHub，從發行版列表下載新的 APK，覆蓋安裝即可。

=== "macOS"

    LeviLauncher 啟動時會檢查新版本並提示安裝。

## 測試版與歷史版本

每個版本的檔案和更新內容都在發行版列表裡：

- Windows 與 macOS：[LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- Android：[LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

**測試版**（beta）是那裡標有 **Pre-release** 的發行版，例如 `v1.2.0-beta.1`。它包含下一個版本尚未完成的新內容，可能出問題。想試用，按上面的方法從它的發行版下載檔案。在 Windows 上，已安裝的 LeviLauncher 也可以跟隨測試版：在**設定**裡開啟**接收測試版更新**，之後每個新的測試版都會作為更新提示。關掉它就只接收穩定版。

## 下一步

=== "Windows"

    - [在 Windows 上玩模組](https://levimc.org/zh-Hant/tutorials/play/play-with-mods/)：從剛裝好的 LeviLauncher 到第一次帶模組進入遊戲。
    - [版本管理](/zh-Hant/guide/version-management?platform=windows)

=== "Android"

    - [在 Android 上玩模組](https://levimc.org/zh-Hant/tutorials/play/play-with-mods-android/)：從剛裝好的 LeviLauncher 到第一次帶模組進入遊戲。
    - [版本管理](/zh-Hant/guide/version-management?platform=android)

=== "macOS"

    - [版本管理](/zh-Hant/guide/version-management)
    - [更新與故障排查](/zh-Hant/guide/update-troubleshooting)
