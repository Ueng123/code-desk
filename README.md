# Code Desk

태블릿용 코딩테스트 편집 화면 UI 프로토타입입니다. Next.js App Router, TypeScript, CodeMirror 6을 사용합니다.

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
- `lib/run-code.ts`: 실행 요청·응답 타입과 UI 전용 실행 어댑터

기본 언어는 Python입니다. 언어별 코드는 현재 브라우저의 localStorage에 보관하며, 빈 코드도 복원합니다. 저장소 사용이 차단되면 현재 탭의 메모리에만 유지하고 상태 표시줄에 안내합니다. 다른 기기나 브라우저로 동기화하지 않습니다.

가로 화면은 편집기와 로그를 약 70:30으로 배치합니다. 세로 화면과 좁은 화면에서는 로그를 아래에 표시하고 접거나 펼칠 수 있습니다. Tab으로 들여쓰고, Esc 다음 Tab으로 편집기를 벗어날 수 있습니다. 모바일 자동 대문자 변환·자동 수정·맞춤법 검사는 비활성화합니다.

실행 버튼은 약 0.5초 동안 UI 미리보기 상태를 보여준 뒤 완료합니다. 모든 실행 로그에 **실행 서버 미연결 — UI 미리보기**를 명시합니다. 실제 출력, 컴파일 결과, API 요청, `eval`, `new Function`은 없습니다. 로그는 최근 100개까지 현재 탭에서만 유지합니다.

향후 `runCode(request: RunRequest): Promise<RunResponse>` 내부를 `POST /api/run` 호출로 교체할 수 있습니다. `RunResponse`의 `mode`로 미리보기와 실제 실행 응답을 구분합니다. 실제 연결 시 `workspace.tsx`의 응답 처리도 `execution` 분기를 표시하도록 확장해야 합니다. 현재 단계에는 서버 API, Sandbox, 인증, 데이터베이스가 없습니다.

## 화면 테마와 저장 단축키

헤더의 테마 선택에서 총 14개 테마를 고를 수 있습니다: Light, Dark, Rider Dark, Dracula, Atom One Dark/Light, VS Code Dark+/Light+, GitHub Dark/Light, Nord, Solarized Dark/Light, Monokai. 각 편집기 테마의 색상에서 영감을 받은 자체 팔레트이며, 라이트·다크 그룹으로 표시합니다. 해·달 버튼으로 라이트와 최근 선택한 다크 테마 사이를 전환합니다. 선택은 이 브라우저에 저장되며, 첫 방문에는 시스템의 화면 모드를 따릅니다. 테마 전환은 편집기 문서, 커서, 실행 취소 기록을 유지합니다.

`Ctrl+S`와 `⌘+S`는 페이지 저장 창을 열지 않습니다. 코드는 입력할 때 기존 방식대로 자동 저장됩니다.
