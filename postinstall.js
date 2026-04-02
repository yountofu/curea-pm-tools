const { cpSync, mkdirSync } = require("fs");
const { join } = require("path");
const { homedir } = require("os");

const dest = join(homedir(), ".claude", "plugins", "pm-tools");
const src = __dirname;

const dirs = [
  ".claude-plugin",
  join("skills", "ui-design-guide"),
  join("skills", "ui-mobile-design"),
];

dirs.forEach((d) => mkdirSync(join(dest, d), { recursive: true }));

const files = [
  [".claude-plugin/plugin.json", ".claude-plugin/plugin.json"],
  ["skills/ui-design-guide/SKILL.md", "skills/ui-design-guide/SKILL.md"],
  ["skills/ui-mobile-design/SKILL.md", "skills/ui-mobile-design/SKILL.md"],
];

files.forEach(([from, to]) => cpSync(join(src, from), join(dest, to)));

console.log(`✔ @yountofu/pm-tools installed to ${dest}`);
console.log("  Restart Claude Code to load the skills.");
