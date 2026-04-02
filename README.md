# @yountofu/pm-tools

PM/프론트엔드 작업용 Claude Code 스킬 모음

## Skills

| Skill | 설명 |
|-------|------|
| `ui-design-guide` | UI 구현 전 디자인 의도, 레퍼런스, 반응형, 모션, 접근성 정리 |
| `ui-mobile-design` | 모바일 반응형 UI 패턴 가이드 (모달, 레이아웃, 버튼, 키보드 대응) |

## Install

```bash
claude plugin marketplace add yountofu/pm-tools && claude plugin install pm-tools@yountofu
```

## Troubleshooting

`Permission denied (publickey)` 에러가 나면 SSH 대신 HTTPS로 클론하도록 설정:

```bash
git config --global url."https://github.com/".insteadOf "git@github.com:"
```

설정 후 다시 설치하면 됩니다.

## License

MIT
