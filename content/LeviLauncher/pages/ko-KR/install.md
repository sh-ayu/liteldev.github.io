# LeviLauncher 설치

LeviLauncher는 Windows 버전과 Android 버전이 있으며, macOS 버전은 베타 단계입니다. 사용 중인 기기에 맞는 탭이 자동으로 선택됩니다.

## 필요한 것

=== "Windows"

    - Windows 10 또는 11.
    - Microsoft Store에서 받은 정품 Minecraft Bedrock Edition(GDK / UWP).

=== "Android"

    - ARM64 기기의 Android 9.0 이상.
    - 이 기기에 Google Play에서 구매하고 설치한 Minecraft Bedrock Edition 1.21.80 이상.

=== "macOS"

    - Apple 실리콘 Mac의 macOS 14.6 이상.
    - 정품 Minecraft Bedrock Edition. LeviLauncher는 Windows(GDK) 버전 게임을 Wine으로 실행합니다.

::: info iOS
LeviLauncher의 iOS 버전은 없으며, 만들 계획도 없습니다.
:::

## 설치

=== "Windows"

    1. [LeviLauncher 최신 릴리스](https://github.com/LiteLDev/LeviLauncher/releases/latest)를 열고 `LeviLauncher-amd64-installer.exe`를 다운로드합니다.
    2. 실행하여 설치 마법사를 완료합니다. 기본적으로 `Program Files`에 설치하므로 관리자 권한을 요청합니다. WebView2 등 구성 요소 설치를 요청하면 계속 진행하세요.

    릴리스에는 파일이 두 개 더 있지만, 보통은 필요하지 않습니다:

    | 파일 | 설명 |
    | --- | --- |
    | `LeviLauncher.exe` | 포터블 버전: 경로에 영문자만 있는 새 폴더에 단독으로 넣고 거기서 실행합니다. |
    | `LeviLauncher.zip` | 런처가 자체 업데이트할 때 다운로드하는 패키지. |

=== "Android"

    1. 기기에서 [Android용 LeviLauncher 최신 릴리스](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest)를 열고 이름이 `-release.apk`로 끝나는 파일을 다운로드합니다.
    2. 다운로드한 파일을 엽니다. Android가 브라우저에서 앱을 설치할 수 없다고 하면 **설정**을 누르고 **이 출처 허용**을 켠 다음, 돌아가서 **설치**를 누릅니다.

=== "macOS"

    macOS 버전은 베타 단계입니다. 최신 안정 버전이 아니라 **Pre-release**로 표시된 릴리스에 있습니다.

    1. [LeviLauncher 릴리스 목록](https://github.com/LiteLDev/LeviLauncher/releases)을 열고 `LeviLauncher-macos-arm64-installer.dmg`가 있는 가장 최신 릴리스를 찾습니다.
    2. 그 파일을 다운로드해 열고 **LeviLauncher**를 **응용 프로그램**으로 드래그합니다.

    UWP 인스턴스는 Windows 전용입니다.

## 동작 확인

LeviLauncher를 실행합니다. 창이 열리고, 처음 실행할 때는 첫 실행 설정(Windows, macOS) 또는 라이선스 계약(Android)이 표시됩니다.

## 업데이트

=== "Windows"

    LeviLauncher는 시작할 때 더 새로운 버전을 찾아 설치를 제안하며, 제자리에서 업데이트합니다. 직접 확인하려면 **설정**을 열고 **업데이트 확인**을 누르거나 `LeviLauncher.exe self-update`를 실행합니다.

=== "Android"

    LeviLauncher는 더 새로운 버전을 찾으면 알려 주고, APK를 다운로드해 Android에 설치를 넘깁니다. 네트워크에서 GitHub에 접속할 수 없다면 릴리스에서 새 APK를 다운로드해 덮어 설치하세요.

=== "macOS"

    LeviLauncher는 시작할 때 더 새로운 버전을 찾아 설치를 제안합니다.

## 베타 및 이전 버전

모든 버전과 그 파일, 변경 사항은 릴리스 페이지에 있습니다:

- Windows 및 macOS: [LiteLDev/LeviLauncher 릴리스](https://github.com/LiteLDev/LeviLauncher/releases)
- Android: [LiteLDev/LeviLauncher-Android 릴리스](https://github.com/LiteLDev/LeviLauncher-Android/releases)

**베타**는 거기서 **Pre-release**로 표시된 릴리스입니다(예: `v1.2.0-beta.1`). 다음 버전에 들어갈 내용을 완성 전에 담고 있어 문제가 생길 수 있습니다. 사용해 보려면 위와 같은 방법으로 해당 릴리스에서 파일을 다운로드합니다. Windows에서는 설치된 LeviLauncher가 베타를 따라갈 수도 있습니다. **설정**에서 **베타 업데이트 수신**을 켜면 새 베타가 나올 때마다 업데이트로 제안합니다. 안정 버전만 쓰려면 끄세요.

## 다음 단계

=== "Windows"

    - [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/)(영어): 방금 설치한 LeviLauncher에서 모드를 넣은 첫 게임까지.
    - [버전 관리](/ko-KR/guide/version-management?platform=windows)

=== "Android"

    - [Play with mods on Android](https://levimc.org/tutorials/play/play-with-mods-android/)(영어): 방금 설치한 LeviLauncher에서 모드를 넣은 첫 게임까지.
    - [버전 관리](/ko-KR/guide/version-management?platform=android)

=== "macOS"

    - [버전 관리](/ko-KR/guide/version-management)
    - [업데이트 및 문제 해결](/ko-KR/guide/update-troubleshooting)
