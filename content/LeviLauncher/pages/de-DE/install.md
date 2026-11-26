# LeviLauncher installieren

LeviLauncher gibt es als Windows- und als Android-Version sowie als macOS-Version, die sich in der Beta befindet. Der Tab für dein Gerät ist bereits ausgewählt.

## Was du brauchst

=== "Windows"

    - Windows 10 oder 11.
    - Eine lizenzierte Kopie von Minecraft Bedrock Edition (GDK / UWP) aus dem Microsoft Store.

=== "Android"

    - Android 9.0 oder neuer auf einem ARM64-Gerät.
    - Minecraft Bedrock Edition 1.21.80 oder neuer, auf diesem Gerät bei Google Play gekauft und installiert.

=== "macOS"

    - macOS 14.6 oder neuer auf einem Mac mit Apple Silicon.
    - Eine lizenzierte Kopie von Minecraft Bedrock Edition. LeviLauncher führt das Windows-Spiel (GDK) über Wine aus.

::: info iOS
Es gibt keine iOS-Version von LeviLauncher, und wir planen auch keine.
:::

## Installieren

=== "Windows"

    1. Öffne das [neueste Release von LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases/latest) und lade `LeviLauncher-amd64-installer.exe` herunter.
    2. Führe die Datei aus und schließe den Einrichtungsassistenten ab. Er fragt nach Administratorrechten, weil er standardmäßig nach `Program Files` installiert. Wenn er WebView2 oder eine andere Komponente installieren möchte, lass ihn fortfahren.

    Das Release enthält zwei weitere Dateien, die du normalerweise nicht brauchst:

    | Datei | Was sie ist |
    | --- | --- |
    | `LeviLauncher.exe` | Die portable Version: Lege sie allein in einen neuen Ordner, dessen Pfad nur englische Buchstaben enthält, und starte sie von dort. |
    | `LeviLauncher.zip` | Das Paket, das der Launcher herunterlädt, wenn er sich selbst aktualisiert. |

=== "Android"

    1. Öffne auf dem Gerät das [neueste Release von LeviLauncher für Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) und lade die Datei herunter, deren Name auf `-release.apk` endet.
    2. Öffne die heruntergeladene Datei. Wenn Android meldet, dass dein Browser keine Apps installieren darf, tippe auf **Einstellungen**, aktiviere **Dieser Quelle vertrauen**, gehe zurück und tippe auf **Installieren**.

=== "macOS"

    Die macOS-Version befindet sich in der Beta: Sie liegt in den Releases, die als **Pre-release** markiert sind, nicht im neuesten stabilen Release.

    1. Öffne die [Releases von LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases) und suche das neueste Release, das `LeviLauncher-macos-arm64-installer.dmg` enthält.
    2. Lade diese Datei herunter, öffne sie und ziehe **LeviLauncher** in **Programme**.

    UWP-Instanzen gibt es nur unter Windows.

## Prüfen, ob es funktioniert

Starte LeviLauncher. Sein Fenster öffnet sich; beim ersten Start zeigt es die Ersteinrichtung (Windows, macOS) oder die Lizenzvereinbarung (Android).

## Aktualisieren

=== "Windows"

    LeviLauncher sucht beim Start nach einer neueren Version und bietet an, sie zu installieren; die Aktualisierung erfolgt an Ort und Stelle. Um selbst nachzusehen, öffne **Einstellungen** und klicke auf **Auf Update prüfen**, oder führe `LeviLauncher.exe self-update` aus.

=== "Android"

    LeviLauncher bietet eine neuere Version an, sobald er eine findet, lädt ihre APK herunter und übergibt sie Android zur Installation. Wenn dein Netzwerk GitHub nicht erreicht, lade die neue APK aus den Releases herunter und installiere sie über die App.

=== "macOS"

    LeviLauncher sucht beim Start nach einer neueren Version und bietet an, sie zu installieren.

## Beta- und ältere Versionen

Jede Version mit ihren Dateien und Änderungen steht auf den Release-Seiten:

- Windows und macOS: [Releases von LiteLDev/LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases)
- Android: [Releases von LiteLDev/LeviLauncher-Android](https://github.com/LiteLDev/LeviLauncher-Android/releases)

Eine **Beta** ist ein Release, das dort als **Pre-release** markiert ist, etwa `v1.2.0-beta.1`. Sie enthält, was die nächste Version bringt, bevor es fertig ist, und kann fehlerhaft sein. Um eine auszuprobieren, lade ihre Dateien wie oben beschrieben aus ihrem Release herunter. Unter Windows kann ein installierter LeviLauncher den Betas auch folgen: Aktiviere **Beta-Updates erhalten** in den **Einstellungen**, dann bietet er jede neue Beta als Update an. Deaktiviere die Option, um bei stabilen Versionen zu bleiben.

## Nächste Schritte

=== "Windows"

    - [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/) (auf Englisch): vom frisch installierten LeviLauncher zum ersten Spiel mit einer Mod.
    - [Versionsverwaltung](/de-DE/guide/version-management?platform=windows)

=== "Android"

    - [Play with mods on Android](https://levimc.org/tutorials/play/play-with-mods-android/) (auf Englisch): vom frisch installierten LeviLauncher zum ersten Spiel mit einer Mod.
    - [Versionsverwaltung](/de-DE/guide/version-management?platform=android)

=== "macOS"

    - [Versionsverwaltung](/de-DE/guide/version-management)
    - [Update & Fehlerbehebung](/de-DE/guide/update-troubleshooting)
