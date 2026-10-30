# Code Desk Android

Android 8.0(API 26) 이상용 전용 WebView 앱입니다. 앱 ID는 `com.ueng123.codedesk`, 접속 주소는 `https://code-desk-topaz.vercel.app`입니다. 기존 Next.js API와 Vercel Sandbox를 그대로 사용하며 웹 업데이트를 별도 APK 재설치 없이 반영합니다.

## 설치

GitHub Release의 `code-desk-android.apk`를 태블릿에서 내려받아 실행합니다. 요청 시 다운로드에 사용한 브라우저 또는 파일 앱의 **이 출처 허용**을 켜고 설치합니다. 현재 APK는 개인 설치용 debug 서명 빌드이며 Play Store 배포용 빌드가 아닙니다.

인터넷과 최신 Android System WebView 또는 Chrome이 필요합니다. 기존 브라우저의 localStorage와 앱 저장소는 서로 다르므로 필요한 코드는 먼저 복사해 두세요. 앱의 데이터 삭제나 앱 제거 시 앱에 저장한 코드도 삭제됩니다.

## 빌드

JDK 17 이상(현재 빌드는 21), Android SDK Platform 35 및 Build Tools 35.0.0이 필요합니다. Android Studio에서 이 디렉터리를 프로젝트로 열어 빌드할 수도 있습니다.

```bash
cd android
# ANDROID_HOME을 Android SDK 경로로 지정하거나 local.properties에 sdk.dir 설정
./gradlew assembleDebug
```

결과: `app/build/outputs/apk/debug/app-debug.apk`

Gradle 8.13과 Android Gradle Plugin 8.9.2를 사용합니다. debug 서명은 로컬 Android 개발 키를 사용합니다. 앱 데이터를 유지하며 업데이트하려면 같은 서명 키로 빌드해야 합니다. 다른 컴퓨터에서 만든 debug APK는 키가 달라 기존 앱을 제거해야 할 수 있으므로 코드를 먼저 백업하세요. Play Store 배포 시에는 별도의 배포 서명과 버전 정책이 필요합니다.

## 앱 동작

- 주소창 없이 실행하고 화면 회전·외장 키보드 연결 시 화면을 유지합니다.
- 시스템 바, 화면 노치, 소프트 키보드에 맞춰 작업 영역을 조정합니다.
- 뒤로가기는 웹 기록을 이동하고, 기록이 없으면 앱을 종료합니다.
- 앱 도메인의 HTTPS 주소만 내부에서 열고, 외부 HTTP(S) 링크는 브라우저로 엽니다.
- JavaScript와 DOM 저장소를 사용하며 네이티브 JavaScript 브리지는 추가하지 않았습니다.
- 파일 접근, 평문 HTTP, 혼합 콘텐츠와 WebView 확대 제스처를 허용하지 않습니다.
- Ctrl+S/⌘+S를 네이티브에서도 차단합니다. 글자 크기는 기존 웹 앱의 버튼과 숫자 입력으로 조절합니다.
- 연결 오류와 인증서 오류 발생 시 재시도 화면을 표시합니다.

앱 아이콘·스플래시는 `app/src/main/res/`, 접속 주소는 `app/build.gradle`의 `APP_URL`에서 수정합니다. 인터넷 이외의 권한은 요청하지 않습니다.
