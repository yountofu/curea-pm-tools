#!/usr/bin/env node

const { execSync } = require("child_process");
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");
const { homedir } = require("os");

const TOFU = `
       ~  .  ~
    ┌───────────┐ .
  ~ │  ·     ·  │
    │    ___    │ ~
  . │           │
    └───────────┘
  ~  curea-pm-tools
`;

const PLUGIN_DIR = join(homedir(), ".claude", "plugins", "marketplaces", "yountofu");
const PLUGIN_JSON = join(PLUGIN_DIR, ".claude-plugin", "plugin.json");
const SKILL_DIR = join(PLUGIN_DIR, "skills");

function getInstalledVersion() {
  try {
    if (!existsSync(PLUGIN_JSON)) return null;
    const data = JSON.parse(readFileSync(PLUGIN_JSON, "utf-8"));
    return data.version || null;
  } catch {
    return null;
  }
}

function getInstalledSkills() {
  try {
    if (!existsSync(SKILL_DIR)) return [];
    const { readdirSync } = require("fs");
    return readdirSync(SKILL_DIR);
  } catch {
    return [];
  }
}

console.log(TOFU);

const prevVersion = getInstalledVersion();
const prevSkills = getInstalledSkills();

try {
  // 1. 마켓플레이스 추가
  if (!prevVersion) {
    console.log("마켓플레이스 등록...");
  } else {
    console.log("업데이트 확인 중...");
  }
  execSync("claude plugin marketplace add yountofu/curea-pm-tools", {
    stdio: "pipe",
  });

  // 2. 플러그인 설치/업데이트
  execSync("claude plugin install pm-tools@yountofu", {
    stdio: "pipe",
  });

  // 3. 결과 비교
  const newVersion = getInstalledVersion();
  const newSkills = getInstalledSkills();

  const contact = "  기능 제안/문의: yountofu@gmail.com";

  if (!prevVersion) {
    // 신규 설치
    console.log(`✔ 설치 완료! (v${newVersion})`);
    console.log(`  스킬 ${newSkills.length}개: ${newSkills.join(", ")}`);
    console.log("\n  Claude Code를 재시작하면 스킬이 로드됩니다.");
    console.log(contact);
  } else if (prevVersion === newVersion) {
    // 이미 최신
    console.log(`✔ 이미 최신 버전입니다. (v${newVersion})`);
    console.log(`  스킬 ${newSkills.length}개: ${newSkills.join(", ")}`);
    console.log(contact);
  } else {
    // 업데이트
    console.log(`✔ 업데이트 완료! (v${prevVersion} → v${newVersion})`);
    const added = newSkills.filter((s) => !prevSkills.includes(s));
    if (added.length > 0) {
      console.log(`  새 스킬: ${added.join(", ")}`);
    }
    console.log(`  전체 스킬: ${newSkills.join(", ")}`);
    console.log("\n  Claude Code를 재시작하면 변경사항이 반영됩니다.");
    console.log(contact);
  }
} catch (e) {
  console.error("\n✘ 설치 실패:", e.message);
  console.error(
    "\n수동 설치 방법:\n  1. claude plugin marketplace add yountofu/curea-pm-tools\n  2. claude plugin install pm-tools@yountofu"
  );
  process.exit(1);
}
