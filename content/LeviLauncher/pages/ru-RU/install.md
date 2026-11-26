# Установка LeviLauncher

LeviLauncher выпускается в версии для Windows и в версии для Android, а также в версии для macOS, которая находится в бета-тестировании. Вкладка для вашего устройства выбирается автоматически.

## Что потребуется

=== "Windows"

    - Windows 10 или 11.
    - Лицензионная копия Minecraft Bedrock Edition (GDK / UWP) из Microsoft Store.

=== "Android"

    - Android 9.0 или новее на устройстве ARM64.
    - Minecraft Bedrock Edition 1.21.80 или новее, купленный и установленный из Google Play на этом устройстве.

=== "macOS"

    - macOS 14.6 или новее на Mac с Apple silicon.
    - Лицензионная копия Minecraft Bedrock Edition. LeviLauncher запускает игру для Windows (GDK) через Wine.

::: info iOS
Версии LeviLauncher для iOS нет, и мы не планируем её делать.
:::

## Установка

=== "Windows"

    1. Откройте [последний релиз LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases/latest) и скачайте `LeviLauncher-amd64-installer.exe`.
    2. Запустите его и пройдите мастер установки. Он запрашивает права администратора, потому что по умолчанию устанавливается в `Program Files`. Если он предложит установить WebView2 или другой компонент, разрешите.

    В релизе есть ещё два файла, которые обычно не нужны:

    | Файл | Что это |
    | --- | --- |
    | `LeviLauncher.exe` | Портативная версия: положите её одну в новую папку, в пути к которой только английские буквы, и запускайте оттуда. |
    | `LeviLauncher.zip` | Пакет, который лаунчер скачивает при самообновлении. |

=== "Android"

    1. На устройстве откройте [последний релиз LeviLauncher для Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) и скачайте файл, имя которого заканчивается на `-release.apk`.
    2. Откройте скачанный файл. Если Android сообщит, что браузеру не разрешено устанавливать приложения, нажмите **Настройки**, включите **Разрешить установку из этого источника**, вернитесь и нажмите **Установить**.

=== "macOS"

    Версия для macOS находится в бета-тестировании: она есть в релизах с пометкой **Pre-release**, а не в последнем стабильном.

    1. Откройте [релизы LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases) и найдите самый новый релиз, в котором есть `LeviLauncher-macos-arm64-installer.dmg`.
    2. Скачайте этот файл, откройте его и перетащите **LeviLauncher** в **Программы**.

    Инстансы UWP работают только в Windows.

## Проверьте, что всё работает

Запустите LeviLauncher. Откроется его окно; при первом запуске оно показывает первоначальную настройку (Windows, macOS) или лицензионное соглашение (Android).

## Обновление

=== "Windows"

    LeviLauncher при запуске ищет более новую версию и предлагает её установить; обновление происходит поверх текущей установки. Чтобы проверить самостоятельно, откройте **Настройки** и нажмите **Проверить обновления** или выполните `LeviLauncher.exe self-update`.

=== "Android"

    LeviLauncher предлагает более новую версию, когда находит её, скачивает APK и передаёт его Android для установки. Если ваша сеть не достаёт до GitHub, скачайте новый APK из релизов и установите его поверх приложения.

=== "macOS"

    LeviLauncher при запуске ищет более новую версию и предлагает её установить.

## Бета-версии и старые версии

Все версии с их файлами и изменениями находятся на страницах релизов:

- Windows и macOS: [релизы LiteLDev/LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases)
- Android: [релизы LiteLDev/LeviLauncher-Android](https://github.com/LiteLDev/LeviLauncher-Android/releases)

**Бета-версия** — это релиз с пометкой **Pre-release**, например `v1.2.0-beta.1`. В ней есть то, что появится в следующей версии, до того как оно закончено, и она может работать нестабильно. Чтобы попробовать её, скачайте файлы из её релиза, как описано выше. В Windows установленный LeviLauncher тоже может следить за бета-версиями: включите **Получать бета-обновления** в **Настройках**, и он будет предлагать каждую новую бета-версию как обновление. Выключите, чтобы оставаться на стабильных версиях.

## Что дальше

=== "Windows"

    - [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/) (на английском): от только что установленного LeviLauncher до первой игры с модом.
    - [Управление версиями](/ru-RU/guide/version-management?platform=windows)

=== "Android"

    - [Play with mods on Android](https://levimc.org/tutorials/play/play-with-mods-android/) (на английском): от только что установленного LeviLauncher до первой игры с модом.
    - [Управление версиями](/ru-RU/guide/version-management?platform=android)

=== "macOS"

    - [Управление версиями](/ru-RU/guide/version-management)
    - [Обновление и устранение неполадок](/ru-RU/guide/update-troubleshooting)
