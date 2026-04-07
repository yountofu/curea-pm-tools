---
name: tool-figma-capture
description: Use when capturing web app screens into Figma — Puppeteer controls viewport and navigation, Figma MCP (generate_figma_design) provides capture IDs, use_figma organizes frames. Triggers on requests to capture UI flows, sync screens to Figma, or update Figma frames.
---

# Figma Capture

## Overview

Puppeteer + Figma MCP 조합으로 화면을 캡처하는 워크플로우.

- **Puppeteer**: 뷰포트 크기 제어, 화면 탐색 (URL 이동, 탭 클릭, 폼 입력), capture.js inject + 트리거
- **MCP `generate_figma_design`**: capture ID 발급
- **MCP `use_figma`**: 캡처 후 프레임 rename + 섹션 배치

## When to Use

- 구현된 UI 플로우를 Figma에 동기화할 때
- 디자인 리뷰용 Figma 프레임을 생성할 때
- 기존 Figma 프레임을 최신 UI로 업데이트할 때
- NOT: Figma에서 코드로 변환할 때 (→ Figma MCP get_design_context 사용)

## 사전 조건

- dev 서버 실행 중 (`pnpm dev`, 기본 `http://localhost:3000/ko`)
- Figma 데스크톱 앱 열려있고, 대상 파일에 MCP 연결 활성화
- puppeteer 설치 (`pnpm add -D puppeteer` 또는 전역)

## Workflow

### 1. 캡처 대상 파악

사용자에게 확인:

- 어떤 도메인/플로우를 캡처할 것인지 (예: 인증, 마이페이지, 스토어)
- 캡처할 화면 목록 (각 스텝별 URL 또는 UI 상태)
- 대상 Figma 파일 (fileKey — URL에서 `/design/{fileKey}/` 부분)
- **Figma 내 어느 페이지에 넣을 것인지** — 기존 페이지의 nodeId를 지정하거나, 새 페이지를 생성할지 결정. nodeId를 생략하면 새 페이지가 자동 생성된다.
- **프레임 배치 방식** — 하나의 페이지에 섹션별로 그룹핑할지, 페이지를 분리할지
- **모바일 병행 여부** — 모바일도 함께 캡처할지 확인. 병행 시 동일 플로우를 데스크톱 + 모바일 두 벌로 캡처한다.
- **캡처 뷰포트 너비** — 데스크톱 기본값 1440px, 모바일 기본값 375px

### 2. Capture ID 발급 — generate_figma_design

캡처할 화면 수만큼 `generate_figma_design`을 호출하여 capture ID를 발급받는다. 모바일 병행 시 화면 수 x 2.

```
generate_figma_design({
  outputMode: "existingFile",
  fileKey: "{figma-file-key}",
  nodeId: "{page-node-id}"    // Figma 페이지 nodeId (생략 시 새 페이지 생성)
})
```

- capture ID는 1회용 — 화면마다 개별 발급
- 여러 ID를 한번에 발급받아 Puppeteer 스크립트에 넣는다

### 3. 캡처 스크립트 생성 + 실행

발급받은 capture ID를 사용하여 Puppeteer 스크립트를 생성하고 실행한다.

#### 파일 규칙

- **네이밍**: `figma-capture-{도메인}.mjs`
- **위치**: 프로젝트 루트
- **생명주기**: 일회성 — 캡처 완료 후 삭제 가능
- **gitignore**: `figma-capture*.mjs`로 추적 제외됨

#### 스크립트 구조

```mjs
import puppeteer from "puppeteer";

const BASE = "http://localhost:3000/ko";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Capture ID 매핑 (MCP에서 발급받은 ID 사용) ──
const desktopCaptures = [
  { id: "{capture-uuid}", name: "Account_개인정보", url: "/account" },
  {
    id: "{capture-uuid}",
    name: "Account_보안",
    url: "/account?section=security",
  },
  // ...
];

const mobileCaptures = [
  { id: "{capture-uuid}", name: "Account_개인정보_Mobile", url: "/account" },
  {
    id: "{capture-uuid}",
    name: "Account_보안_Mobile",
    url: "/account?section=security",
  },
  // ...
];

// ── 캡처 트리거 ──
async function triggerCapture(page, captureId, name) {
  console.log(`[${name}] 캡처 시작...`);
  await page.evaluate(
    ({ captureId, endpoint }) => {
      const old = document.querySelector('script[src*="capture.js"]');
      if (old) old.remove();
      const s = document.createElement("script");
      s.src = "https://mcp.figma.com/mcp/html-to-design/capture.js";
      document.head.appendChild(s);
      window.location.hash = `figmacapture=${captureId}&figmaendpoint=${encodeURIComponent(endpoint)}&figmadelay=3000`;
    },
    {
      captureId,
      endpoint: `https://mcp.figma.com/mcp/capture/${captureId}/submit`,
    }
  );
  await wait(10000);
  console.log(`[${name}] 캡처 전송 완료`);
}

// ── 캡처 실행 (뷰포트 크기별) ──
async function runCaptures(browser, captures, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  // 인증 필요 시 쿠키 설정
  await page.goto(`${BASE}/login`, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  await page.evaluate(() => {
    document.cookie = "sb-localhost-auth-token=mock; path=/; max-age=86400";
    document.cookie = "sb-auth-token=mock; path=/; max-age=86400";
  });

  for (const cap of captures) {
    await page.goto(`${BASE}${cap.url}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await wait(3000);
    // 필요 시 탭 클릭, 폼 입력 등 추가 탐색
    await triggerCapture(page, cap.id, cap.name);
  }

  await page.close();
}

// ── 메인 ──
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null, // setViewport로 개별 제어
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    protocolTimeout: 120000,
    args: ["--no-sandbox"],
  });

  // 데스크톱 캡처 (1440x900)
  console.log("=== Desktop Captures ===");
  await runCaptures(browser, desktopCaptures, { width: 1440, height: 900 });

  // 모바일 캡처 (375x812)
  console.log("=== Mobile Captures ===");
  await runCaptures(browser, mobileCaptures, { width: 375, height: 812 });

  console.log("\n모든 캡처 완료!");
  await wait(3000);
  await browser.close();
})();
```

#### 실행

```bash
node figma-capture-{도메인}.mjs
```

### 4. 캡처 확인 — polling

스크립트 실행 후 `generate_figma_design`에 captureId를 넘겨 polling한다. completed 될 때까지 5초 간격으로 확인.

### 5. 프레임 정리 — use_figma

캡처 완료 후 `use_figma`로 프레임을 정리한다.

**프레임 네이밍 규칙:** `{Domain}_{화면명}` (PascalCase + 한국어)

- 데스크톱: `Account_개인정보`, `Account_보안`
- 모바일: `Account_개인정보_Mobile`, `Account_보안_Mobile`

**프레임 rename:**

```js
// use_figma로 실행
const FRAME_MAP = {
  "{nodeId}": "Account_개인정보",
  "{nodeId}": "Account_보안",
  // ...
};

for (const [nodeId, name] of Object.entries(FRAME_MAP)) {
  const node = figma.getNodeById(nodeId);
  if (node) node.name = name;
}
```

**섹션 생성 + 배치:**

```js
// use_figma로 실행
const SECTIONS = [
  { name: 'Account - Desktop', frames: ['{nodeId}', ...] },
  { name: 'Account - Mobile', frames: ['{nodeId}', ...] },
];

const GAP = 80;
const FRAME_GAP = 40;
let sectionX = 0;

for (const sectionDef of SECTIONS) {
  const frames = sectionDef.frames.map(id => figma.getNodeById(id)).filter(Boolean);
  if (frames.length === 0) continue;

  let frameX = GAP;
  let maxHeight = 0;

  for (const frame of frames) {
    frame.x = frameX;
    frame.y = GAP + 40;
    frameX += frame.width + FRAME_GAP;
    if (frame.height > maxHeight) maxHeight = frame.height;
  }

  const section = figma.createSection();
  section.name = sectionDef.name;
  section.x = sectionX;
  section.y = 0;
  section.resizeWithoutConstraints(frameX + GAP, maxHeight + GAP * 2 + 40);

  for (const frame of frames) {
    section.appendChild(frame);
  }

  figma.currentPage.appendChild(section);
  sectionX += section.width + 100;
}
```

### 6. 결과 확인

- Figma에서 모든 프레임이 올바른 이름으로 섹션에 배치되었는지 확인
- `get_screenshot`으로 결과를 확인할 수 있음
- 누락된 화면이 있으면 해당 화면만 재캡처

## 화면 탐색 패턴

캡처할 화면 상태로 이동하는 방법은 플로우에 따라 다르다. 스크립트의 `runCaptures` 내에서 사용:

**단순 URL 이동:**

```mjs
await page.goto(`${BASE}/account`, {
  waitUntil: "networkidle0",
  timeout: 30000,
});
await wait(3000);
```

**탭 클릭 후 캡처:**

```mjs
await page.evaluate((text) => {
  const links = [...document.querySelectorAll('a, button, [role="tab"]')];
  const target = links.find((el) => el.textContent?.trim() === text);
  if (target) target.click();
}, "탭 텍스트");
await wait(2000);
```

**폼 입력 + 버튼 클릭 (스텝 플로우):**

```mjs
await page.type('input[type="email"]', "test@example.com", { delay: 30 });
await page.evaluate(
  (texts) => {
    const els = [...document.querySelectorAll('a, button, [role="button"]')];
    const target = els.find((el) => texts.some((t) => el.textContent?.trim().includes(t)));
    if (target) target.click();
  },
  ["다음", "계속"]
);
await wait(2000);
```

## Common Mistakes

| 실수                                             | 해결                                                       |
| ------------------------------------------------ | ---------------------------------------------------------- |
| dev 서버 안 켜고 캡처                            | `pnpm dev` 먼저 실행                                       |
| capture ID를 MCP에서 발급받지 않고 스크립트 실행 | generate_figma_design으로 먼저 ID 발급                     |
| 같은 capture ID를 여러 화면에 재사용             | 1 ID = 1 화면, 모바일 포함 시 x2                           |
| 뷰포트 크기 미지정                               | setViewport로 데스크톱 1440x900, 모바일 375x812 명시       |
| 모바일/데스크톱 프레임 구분 안 됨                | 네이밍에 \_Mobile suffix 추가                              |
| Puppeteer 스크립트를 git에 커밋                  | gitignore 확인 — `figma-capture*.mjs`                      |
| wait 시간 부족으로 빈 화면 캡처                  | wait 늘리기 (최소 3초, 무거운 페이지 5초+)                 |
| Figma 페이지 미지정                              | nodeId로 대상 페이지 지정, 생략 시 새 페이지 생성          |
| `open` 명령으로 뷰포트 제어 안 됨                | 뷰포트 정확도 필요하면 반드시 Puppeteer `setViewport` 사용 |
| Puppeteer `btn.click()` 모바일에서 에러          | `page.evaluate(() => el.click())` DOM API로 클릭           |
| `use_figma`가 엉뚱한 페이지에서 실행             | 매 호출마다 `await figma.setCurrentPageAsync(page)` 필수   |
| 모바일 캡처 시 중간 화면 누락                    | 메뉴 리스트 → 섹션 기본 뷰 → 모달 순서로 빠짐없이 나열     |
| html-to-design 간격 부정확                       | 캡처 도구 한계 — 참고용, Figma에서 수동 조정               |
| layout.tsx capture script 제거 안 함             | 캡처 완료 후 임시 script 태그 반드시 제거                  |
