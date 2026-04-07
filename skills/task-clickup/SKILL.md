---
name: task-clickup
description: ClickUp 태스크 조회, 생성, 업데이트를 처리한다. /task-clickup 직접 호출 또는 유저가 "ClickUp", "클릭업"을 언급할 때 트리거된다.
---

# task-clickup — ClickUp 태스크 관리

## 언제 적용하는가

- `/task-clickup` 직접 호출
- 유저가 "ClickUp" 또는 "클릭업"을 언급할 때

## API 토큰 설정

ClickUp 파일 첨부(스크린샷 업로드 등)에는 API 토큰이 필요하다.

### 토큰 저장 위치

`~/.clickup-token`

### 설정 흐름

1. 스킬 실행 시 `~/.clickup-token` 파일 존재 여부를 확인한다
2. **파일이 없으면** → 아래 안내를 표시:

> ClickUp API 토큰이 필요합니다.
> 1. https://app.clickup.com/settings/apps 에서 API 토큰을 생성하세요
> 2. 터미널에서 실행: `echo "pk_..." > ~/.clickup-token`
>
> 한 번만 하면 됩니다.

3. 토큰이 설정되면 curl 기반 파일 업로드에 사용

### 사용 방법

```bash
TOKEN=$(cat ~/.clickup-token | tr -d '\n')
curl -s -X POST "https://api.clickup.com/api/v2/task/{task_id}/attachment" \
  -H "Authorization: $TOKEN" \
  -F "attachment=@{파일경로};filename={파일명}"
```

## 워크스페이스 설정

### 설정 파일 위치

`~/.claude/skills/task-clickup/workspaces/{프로젝트명}.md`

각 파일에 저장되는 내용은 [워크스페이스 설정 템플릿](templates/workspace-config.md) 참조.
실제 설정 예시: [pullim 워크스페이스](examples/workspace-pullim.md)

### 설정 로드 절차

1. 현재 프로젝트에 해당하는 `workspaces/*.md` 파일을 찾는다
2. **파일이 없으면** → 유저에게 프로젝트명과 ClickUp 링크를 물어서 새 파일 생성
3. **파일은 있지만 필수 필드가 비어 있으면** → 빠진 항목만 물어봄
4. 유저에게 링크를 요청할 때 아래 메시지를 포함한다:

> "이 정보는 저장해두니까 다음부터는 다시 물어보지 않을게요."

### 필수 필드

- 워크스페이스 ID
- 스페이스 ID (또는 링크)
- 리스트 ID (또는 링크)
- 기본 Assignee

## 기본 흐름

```
스킬 호출
  → 워크스페이스 설정 로드 (없으면 유저에게 질문)
  → ClickUp MCP로 할당된 태스크 조회
  → 태스크 있음 → 목록 표시 → 유저가 선택하면 작업 시작
  → 태스크 없음 → "어떤 작업을 할까요?" 물어봄
```

## 액션

### 1. 태스크 조회

- `clickup_filter_tasks`로 현재 유저에게 할당된 태스크 조회
- 워크스페이스 설정의 스페이스/리스트 범위 내에서 조회
- 결과를 간결하게 목록으로 표시 (태스크명, 상태, 우선순위)

### 2. 태스크 생성 (Epic 하위)

유저가 Epic을 지정하면:

1. 해당 Epic 하위에 태스크 생성
2. 태스크명 형식: `[UI] {Epic 내용}`
3. 워크스페이스 설정에서 기본 Tag, Assignee 자동 fill-in
4. **커스텀 필드 설정** — Epic에 도메인 등 커스텀 필드가 있으면 서브태스크에도 동일하게 설정
5. **스프린트 배치** — 유저에게 어떤 스프린트에 추가할지 물어본다 (워크스페이스 설정의 스프린트 리스트 참조)
6. `clickup_create_task` MCP 도구 사용

### 3. 이슈 태스크 생성

GitHub 이슈와 유사한 독립 태스크를 생성한다. Epic 하위 태스크와는 다른 공간(리스트)에 위치할 수 있다.

1. 유저에게 **어디에 생성할지**(리스트/폴더) 물어본다 — 워크스페이스 설정에 이슈 리스트가 저장되어 있으면 확인만 받음
2. 태스크명과 내용을 유저에게 받는다
3. Tag, Assignee fill-in
4. 생성 위치를 워크스페이스 설정에 아직 없으면 저장 (다음부터 안 물어봄)
5. `clickup_create_task` MCP 도구 사용

### 4. 태스크 업데이트

태스크 타입에 따라 필요한 처리를 수행:

- **템플릿 기반 작성** — 태스크 description을 템플릿에 맞춰 작성/갱신
- **PR attach** — GitHub PR 링크를 태스크에 첨부
- **상태 변경** — 진행 상태 업데이트
- **코멘트 추가** — 작업 내용 코멘트로 기록
- `clickup_update_task`, `clickup_create_task_comment`, `clickup_attach_task_file` 등 MCP 도구 사용

### 5. 서브태스크 티켓 작성 (spec + 스크린샷)

구현 완료된 기능의 서브태스크에 **spec 문서 요약 + 구현 스크린샷**을 포함하여 description을 작성한다.

#### 절차

1. **spec 문서 로드** — 프로젝트 `docs/` 에서 해당 기능의 spec `.md` 파일을 읽는다
2. **스크린샷 캡처** — Puppeteer로 구현된 화면을 캡처하여 이미지 파일로 저장
3. **티켓 작성** — 아래 템플릿에 맞춰 description 작성 + 스크린샷 첨부
4. `clickup_update_task`로 description 갱신, `clickup_attach_task_file`로 스크린샷 첨부

#### 티켓 description 템플릿

[templates/ticket-description.md](templates/ticket-description.md) 참조.
작성 예시: [examples/ticket-description.md](examples/ticket-description.md)

#### Puppeteer 스크린샷 캡처

**사전 조건:**
- Puppeteer 글로벌 설치 필수: `npm install -g puppeteer`
- dev 서버 실행 중이어야 한다

**스크립트 생성 규칙:**
- **매번 `/tmp/`에 새로 생성** — 프로젝트 디렉토리에 넣지 않는다
- **포트 번호는 실행 시점에 확인** — `lsof` 또는 `curl`로 실제 dev 서버 포트를 먼저 찾아서 스크립트에 반영
- **글로벌 puppeteer 사용** — `createRequire`로 글로벌 모듈을 로드
- 캡처 완료 후 스크립트 삭제

**포트 확인 방법:**

```bash
lsof -iTCP -sTCP:LISTEN -P | grep -E ':(3000|3001|3002|5173)'
# 또는 각 포트 curl 테스트
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ko
```

**스크립트 템플릿:** [templates/capture-script.mjs](templates/capture-script.mjs) 참조.

**실행:**

```bash
NODE_PATH=$(npm root -g) node /tmp/clickup-capture-{도메인}.mjs
```

**규칙:**
- 뷰포트: 1440x900 고정
- `headless: "new"` 사용 (GUI 불필요)
- 스크린샷 저장: `/tmp/clickup-screenshots/`
- 스크립트 & 스크린샷 모두 `/tmp` — git과 무관

#### 스크린샷 네이밍 규칙

**파일명 형식:** `{prefix}-{nn}-{설명-kebab}.png`

- `{prefix}` — 기능 약어 (예: `email`, `pw`, `addr`, `withdraw`, `noti`, `social`, `phone`)
- `{nn}` — 플로우 순서 번호 (`01`, `02`, `03`…)
- `{설명}` — 해당 화면의 한글 설명 (kebab-case)

전체 예시: [examples/screenshot-naming.md](examples/screenshot-naming.md) 참조.

#### 플로우 캡처 커버리지 규칙

**단순 1장으로 끝내지 않는다.** 기능의 사용자 플로우를 따라가며 각 단계를 캡처한다:

1. **진입 화면** — 기능이 위치한 탭/페이지 전체 뷰
2. **인터랙션 시작** — 모달/다이얼로그 열림 (빈 상태)
3. **입력 진행** — 폼에 데이터 입력한 상태
4. **유효성 검사** — 에러/미충족/불일치 등 검증 피드백 화면
5. **완료/성공 상태** — 모든 조건 충족 또는 제출 직전 상태
6. **멀티스텝** — 다단계 플로우는 각 스텝마다 캡처

**기능별 최소 캡처 기준:**

| 유형 | 최소 캡처 수 | 포함해야 할 화면 |
|------|------------|-----------------|
| 단순 토글/설정 | 1장 | 설정 화면 |
| 단일 모달 (입력 없음) | 2장 | 탭 뷰 + 모달 |
| 입력 폼 모달 | 3~4장 | 탭 뷰 + 빈 모달 + 입력 중 + 유효성 검사 |
| 인증 플로우 | 3~4장 | 탭 뷰 + 입력 + 인증 단계 + 결과 |
| 다단계 플로우 | 스텝 수 + 1장 | 진입 화면 + 각 스텝 |

**Puppeteer 인터랙션 패턴:**
- 폼 입력: `await input.type("text")` 후 캡처
- 유효성 검사 유발: 일부러 잘못된 값 입력 → 에러 표시 캡처
- 다단계 진행: 다음/계속 버튼 클릭 → 각 스텝 캡처
- 모달 내 버튼: `dialog` 내부에서 버튼 탐색 후 클릭

#### ClickUp 첨부 — curl 업로드

MCP `clickup_attach_task_file`의 base64 방식은 대용량 이미지에서 불안정하므로, **curl로 직접 업로드**한다.

```bash
TOKEN=$(cat ~/.clickup-token | tr -d '\n')
curl -s -X POST "https://api.clickup.com/api/v2/task/{task_id}/attachment" \
  -H "Authorization: $TOKEN" \
  -F "attachment=@/tmp/clickup-screenshots/{prefix}-{nn}-{설명}.png;filename={prefix}-{nn}-{설명}.png"
```

첨부 흐름:
1. 원본 PNG 캡처 (1440px, `/tmp/clickup-screenshots/`)
2. curl로 원본 그대로 업로드 (리사이즈 불필요)
3. **filename에 플로우 순서 번호 + 한글 설명 포함** — ClickUp에서 순서대로 확인 가능
4. `~/.clickup-token`에서 API 토큰 읽어서 사용

## 커스텀 필드 규칙

태스크 생성 시 **부모 Epic의 커스텀 필드를 확인**하고 서브태스크에도 적절히 설정한다.

- **도메인** — Epic에 설정된 도메인 라벨을 서브태스크에도 동일하게 적용
- 기타 커스텀 필드도 Epic과 일관성을 유지

## 스프린트 배치 규칙

태스크 생성 시 **어떤 스프린트에 배치할지 유저에게 반드시 물어본다.**

1. 워크스페이스 설정에서 스프린트 리스트 목록을 참조
2. 유저에게 선택지를 제시하거나, "어느 스프린트에 넣을까요?" 질문
3. 유저가 지정하면 `clickup_add_task_to_list`로 해당 스프린트 리스트에 추가
4. 스프린트 배치 없이 태스크를 생성하지 않는다

## 태그 규칙

**태그를 임의로 만들지 않는다.** 태스크 생성/업데이트 시:

1. 워크스페이스 설정 파일에 사용 가능한 태그 목록이 있으면 그 안에서만 선택
2. 목록이 없으면 `clickup_filter_tasks`로 기존 태스크에서 사용 중인 태그를 먼저 조회
3. 조회된 태그 중에서 적절한 것을 선택. 어떤 태그가 맞는지 애매하면 유저에게 물어본다
4. 새로운 태그를 만들어야 하는 경우 반드시 유저 승인을 받는다

## 금지 사항

- 유저 확인 없이 태스크를 생성/삭제/상태 변경하지 않는다
- 워크스페이스 설정을 임의로 수정하지 않는다
- 존재하지 않는 Epic이나 리스트에 태스크를 만들지 않는다
- 존재하지 않는 태그를 임의로 사용하지 않는다
