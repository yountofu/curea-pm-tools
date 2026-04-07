# task-clickup

ClickUp 태스크 조회, 생성, 업데이트, 스크린샷 첨부를 처리한다.

## Version

`0.1.0`

## Changelog

### 0.1.0 (2026-04-07)

- 초기 버전
- 워크스페이스 설정 (`~/.claude/skills/task-clickup/workspaces/`)
- API 토큰 설정 (`~/.clickup-token`)
- 태스크 조회, Epic 하위 생성, 이슈 생성, 업데이트
- Puppeteer 스크린샷 캡처 + curl 업로드
- 스크린샷 네이밍 규칙 (`{prefix}-{nn}-{설명}.png`)
- 플로우 캡처 커버리지 규칙
- 커스텀 필드, 스프린트 배치, 태그 규칙
