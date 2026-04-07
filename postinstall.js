const { cpSync, mkdirSync, readdirSync } = require("fs");
const { join } = require("path");
const { homedir } = require("os");

const dest = join(homedir(), ".claude", "plugins", "pm-tools");
const src = __dirname;

const skills = ["ui-design-guide", "ui-mobile-design", "task-clickup", "tool-figma-capture"];

// 디렉토리 생성
mkdirSync(join(dest, ".claude-plugin"), { recursive: true });
skills.forEach((s) => mkdirSync(join(dest, "skills", s), { recursive: true }));
mkdirSync(join(dest, "skills", "task-clickup", "templates"), { recursive: true });
mkdirSync(join(dest, "skills", "task-clickup", "examples"), { recursive: true });

// 플러그인 설정
cpSync(join(src, ".claude-plugin", "plugin.json"), join(dest, ".claude-plugin", "plugin.json"));

// 스킬 파일 복사
skills.forEach((s) => {
  const skillSrc = join(src, "skills", s);
  const skillDest = join(dest, "skills", s);
  ["SKILL.md", "README.md"].forEach((f) => {
    try { cpSync(join(skillSrc, f), join(skillDest, f)); } catch {}
  });
});

// task-clickup templates & examples
["templates", "examples"].forEach((dir) => {
  const dirSrc = join(src, "skills", "task-clickup", dir);
  const dirDest = join(dest, "skills", "task-clickup", dir);
  try {
    readdirSync(dirSrc).forEach((f) => cpSync(join(dirSrc, f), join(dirDest, f)));
  } catch {}
});

console.log(`✔ curea-pm-tools installed to ${dest}`);
console.log("  Restart Claude Code to load the skills.");
