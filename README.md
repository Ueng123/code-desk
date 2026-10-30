# Code Desk

태블릿용 Python/C# 코딩테스트 편집·실행 앱입니다. Next.js App Router, TypeScript, CodeMirror 6을 사용합니다.

## 실행

Node.js 20.9 이상과 npm이 필요합니다.

```bash
npm ci
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다. 같은 네트워크의 태블릿에서는 개발 컴퓨터의 IP와 포트 3000으로 접속할 수 있습니다.

```bash
npm run typecheck
npm run build
npm start
```

위 명령은 각각 타입 검사, 프로덕션 빌드, 프로덕션 서버 실행입니다. 테스트는 추가하지 않았습니다.

## 구성

- `app/`: 페이지, 레이아웃, 반응형 스타일
- `components/code-editor.tsx`: CodeMirror 6, Python/C# 문법, 들여쓰기, 괄호와 줄 번호
- `components/workspace.tsx`: 언어별 코드 저장, UI 상태, 로그 패널
- `lib/languages.ts`: 언어 정의와 예제 코드
- `lib/run-code.ts`: 실행 요청·응답 타입과 API 호출

기본 언어는 Python입니다. 언어별 코드는 현재 브라우저의 localStorage에 보관하며, 빈 코드도 복원합니다. 저장소 사용이 차단되면 현재 탭의 메모리에만 유지하고 상태 표시줄에 안내합니다. 다른 기기나 브라우저로 동기화하지 않습니다.

가로 화면은 편집기와 로그를 약 70:30으로 배치합니다. 세로 화면과 좁은 화면에서는 로그를 아래에 표시하고 접거나 펼칠 수 있습니다. Tab으로 들여쓰고, Esc 다음 Tab으로 편집기를 벗어날 수 있습니다. 모바일 자동 대문자 변환·자동 수정·맞춤법 검사는 비활성화합니다.

## 코드 실행

실행 버튼은 `POST /api/run`으로 코드를 보내 Vercel Sandbox에서 실행합니다. Python은 기본 이미지의 Python 3을, C#은 .NET 8 SDK 스냅샷을 사용합니다. 표준 출력·표준 오류·종료 코드를 로그에 표시합니다.

- 입력 코드 최대 64KB, 요청 최대 100KB
- 실행 및 C# 컴파일 합계 최대 20초, 출력 합계 최대 64KB
- 실행마다 새 환경 생성, 외부 네트워크 차단, 실행 후 종료 및 파일 폐기
- 표준 입력은 EOF로 처리합니다. `input()`이나 `Console.ReadLine()` 대신 코드 안에 입력 데이터를 작성하세요.
- 기본 제공 표준 라이브러리만 지원하며 pip/NuGet 패키지는 설치하지 않습니다.
- 요청은 인스턴스당 IP별 분당 5회, 동시 실행 2개로 제한합니다. 분산된 모든 인스턴스의 합산 제한은 아니므로 공개 서비스 규모가 커지면 Vercel Firewall 제한을 추가하세요.
- 인증과 데이터베이스는 추가하지 않았습니다. Sandbox 사용량과 C# 스냅샷 저장에는 Vercel 사용량이 발생합니다.

서버 구성은 `app/api/run/route.ts`, `lib/sandbox-runner.ts`에 있습니다. 입력 코드는 Next.js 프로세스에서 실행하지 않습니다. 프로세스 제어는 격리된 VM 내부의 Python 감독 프로세스에서만 수행합니다.

Vercel에서는 SDK가 OIDC 인증을 자동으로 사용합니다. 로컬에서는 Vercel CLI로 프로젝트를 연결한 뒤 `vercel env pull .env.local`을 실행하세요. 토큰은 클라이언트나 실행 VM에 전달하지 않습니다.

C# 실행 환경을 재구축할 때:

```bash
node --env-file=.env.local scripts/prepare-csharp.mjs
```

출력된 `CSHARP_SANDBOX_SNAPSHOT_ID`를 Vercel 프로젝트의 Production/Preview 환경 변수로 설정한 뒤 재배포합니다. .NET 8.0.427과 ICU를 설치하고 템플릿 복원을 마친 파일시스템을 스냅샷으로 보관합니다. 준비 스크립트는 스냅샷을 만료 없이 보관합니다. 최초 배포에 설정한 스냅샷은 관리 도구의 기본 만료 기간인 7일을 사용합니다. 스냅샷이 없거나 만료되면 서버가 사용자 코드 업로드 전에 SDK를 다시 준비하고 네트워크를 차단하므로 C#은 계속 동작하지만 시작이 느려질 수 있습니다. SDK 업데이트 시 새 스냅샷으로 교체하고 기존 스냅샷을 삭제하세요. 사용자 코드는 이 준비 과정에서 실행하지 않습니다.

## 화면 테마와 저장 단축키

헤더의 테마 선택에서 총 14개 테마를 고를 수 있습니다: Light, Dark, Rider Dark, Dracula, Atom One Dark/Light, VS Code Dark+/Light+, GitHub Dark/Light, Nord, Solarized Dark/Light, Monokai. 각 편집기 테마의 색상에서 영감을 받은 자체 팔레트이며, 라이트·다크 그룹으로 표시합니다. 해·달 버튼으로 라이트와 최근 선택한 다크 테마 사이를 전환합니다. 선택은 이 브라우저에 저장되며, 첫 방문에는 시스템의 화면 모드를 따릅니다. 테마 전환은 편집기 문서, 커서, 실행 취소 기록을 유지합니다.

`Ctrl+S`와 `⌘+S`는 페이지 저장 창을 열지 않습니다. 코드는 입력할 때 기존 방식대로 자동 저장됩니다.
