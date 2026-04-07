#!/usr/bin/env node

const { execSync } = require("child_process");

console.log(`
       ~  .  ~
    ┌───────────┐ .
  ~ │  ·     ·  │
    │    ___    │ ~
  . │           │
    └───────────┘
  ~  curea-pm-tools
`);

try {
  // 1. 마켓플레이스 추가
  console.log("마켓플레이스 등록...");
  execSync(
    'git config --global url."https://github.com/".insteadOf "git@github.com:"',
    { stdio: "inherit" }
  );
  execSync("claude plugin marketplace add yountofu/curea-pm-tools", {
    stdio: "inherit",
  });

  // 2. 플러그인 설치
  console.log("\n플러그인 설치...");
  execSync("claude plugin install pm-tools@yountofu", { stdio: "inherit" });

  console.log("\n✔ 설치 완료! Claude Code를 재시작하면 스킬이 로드됩니다.");
} catch (e) {
  console.error("\n✘ 설치 실패:", e.message);
  console.error(
    "\n수동 설치 방법:\n  1. claude plugin marketplace add yountofu/curea-pm-tools\n  2. claude plugin install pm-tools@yountofu"
  );
  process.exit(1);
}
