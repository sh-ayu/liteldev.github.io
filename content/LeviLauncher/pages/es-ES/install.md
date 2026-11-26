# Instalar LeviLauncher

LeviLauncher tiene una versión para Windows y otra para Android, además de una versión para macOS que está en beta. La pestaña de tu dispositivo se selecciona automáticamente.

## Qué necesitas

=== "Windows"

    - Windows 10 u 11.
    - Una copia con licencia de Minecraft Bedrock Edition (GDK / UWP) de Microsoft Store.

=== "Android"

    - Android 9.0 o posterior en un dispositivo ARM64.
    - Minecraft Bedrock Edition 1.21.80 o posterior, comprado e instalado desde Google Play en este dispositivo.

=== "macOS"

    - macOS 14.6 o posterior en un Mac con Apple silicon.
    - Una copia con licencia de Minecraft Bedrock Edition. LeviLauncher ejecuta el juego de Windows (GDK) mediante Wine.

::: info iOS
No existe una versión de LeviLauncher para iOS, y no tenemos planes de hacerla.
:::

## Instalar

=== "Windows"

    1. Abre la [última versión de LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases/latest) y descarga `LeviLauncher-amd64-installer.exe`.
    2. Ejecútalo y completa el asistente de instalación. Pide permisos de administrador porque se instala en `Program Files` por defecto. Si pide instalar WebView2 u otro componente, deja que continúe.

    La versión incluye dos archivos más, que normalmente no necesitas:

    | Archivo | Qué es |
    | --- | --- |
    | `LeviLauncher.exe` | La versión portátil: ponla sola en una carpeta nueva cuya ruta solo tenga letras inglesas y ejecútala desde ahí. |
    | `LeviLauncher.zip` | El paquete que el lanzador descarga cuando se actualiza a sí mismo. |

=== "Android"

    1. En el dispositivo, abre la [última versión de LeviLauncher para Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) y descarga el archivo cuyo nombre termina en `-release.apk`.
    2. Abre el archivo descargado. Si Android dice que tu navegador no puede instalar aplicaciones, toca **Ajustes**, activa **Permitir desde esta fuente**, vuelve atrás y toca **Instalar**.

=== "macOS"

    La versión para macOS está en beta: se encuentra en las versiones marcadas como **Pre-release**, no en la última versión estable.

    1. Abre las [versiones de LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases) y busca la más reciente que tenga `LeviLauncher-macos-arm64-installer.dmg`.
    2. Descarga ese archivo, ábrelo y arrastra **LeviLauncher** a **Aplicaciones**.

    Las instancias UWP son solo para Windows.

## Comprueba que funciona

Inicia LeviLauncher. Se abre su ventana; la primera vez muestra la configuración inicial (Windows, macOS) o el acuerdo de licencia (Android).

## Actualizar

=== "Windows"

    LeviLauncher busca una versión más reciente al iniciarse y ofrece instalarla; se actualiza sin desinstalar. Para buscarla tú mismo, abre **Ajustes** y pulsa **Verificar actualización**, o ejecuta `LeviLauncher.exe self-update`.

=== "Android"

    LeviLauncher ofrece una versión más reciente cuando la encuentra, descarga su APK y se lo entrega a Android para instalarlo. Si tu red no llega a GitHub, descarga el nuevo APK desde las versiones e instálalo sobre la aplicación.

=== "macOS"

    LeviLauncher busca una versión más reciente al iniciarse y ofrece instalarla.

## Versiones beta y anteriores

Todas las versiones, con sus archivos y sus cambios, están en las páginas de versiones:

- Windows y macOS: [versiones de LiteLDev/LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases)
- Android: [versiones de LiteLDev/LeviLauncher-Android](https://github.com/LiteLDev/LeviLauncher-Android/releases)

Una **beta** es una versión marcada allí como **Pre-release**, por ejemplo `v1.2.0-beta.1`. Trae lo que incluirá la próxima versión antes de estar terminada, y puede fallar. Para probar una, descarga sus archivos desde su versión como se explica arriba. En Windows, un LeviLauncher instalado también puede seguir las betas: activa **Recibir actualizaciones Beta** en **Ajustes** y ofrecerá cada nueva beta como actualización. Desactívalo para quedarte en las versiones estables.

## Siguientes pasos

=== "Windows"

    - [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/) (en inglés): de un LeviLauncher recién instalado a tu primera partida con un mod.
    - [Gestión de versiones](/es-ES/guide/version-management?platform=windows)

=== "Android"

    - [Play with mods on Android](https://levimc.org/tutorials/play/play-with-mods-android/) (en inglés): de un LeviLauncher recién instalado a tu primera partida con un mod.
    - [Gestión de versiones](/es-ES/guide/version-management?platform=android)

=== "macOS"

    - [Gestión de versiones](/es-ES/guide/version-management)
    - [Actualizaciones y solución de problemas](/es-ES/guide/update-troubleshooting)
