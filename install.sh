#!/bin/bash
# curea-pm-tools installer
# ~/.claude/plugins/pm-tools/ 에 스킬 파일을 복사합니다

PLUGIN_DIR="$HOME/.claude/plugins/pm-tools"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cat << 'TOFU'

       ~  .  ~
    ┌───────────┐ .
  ~ │  ·     ·  │
    │    ___    │ ~
  . │           │
    └───────────┘
  ~  curea-pm-tools

TOFU

# 스킬 디렉토리 생성
mkdir -p "$PLUGIN_DIR/.claude-plugin"
for skill in ui-design-guide ui-mobile-design task-clickup tool-figma-capture; do
  mkdir -p "$PLUGIN_DIR/skills/$skill"
done
mkdir -p "$PLUGIN_DIR/skills/task-clickup/templates"
mkdir -p "$PLUGIN_DIR/skills/task-clickup/examples"

# 플러그인 설정 복사
cp "$SCRIPT_DIR/.claude-plugin/plugin.json" "$PLUGIN_DIR/.claude-plugin/plugin.json"

# 스킬 파일 복사
for skill in ui-design-guide ui-mobile-design task-clickup tool-figma-capture; do
  cp "$SCRIPT_DIR/skills/$skill/SKILL.md" "$PLUGIN_DIR/skills/$skill/SKILL.md"
  [ -f "$SCRIPT_DIR/skills/$skill/README.md" ] && cp "$SCRIPT_DIR/skills/$skill/README.md" "$PLUGIN_DIR/skills/$skill/README.md"
done

# task-clickup templates & examples 복사
cp "$SCRIPT_DIR/skills/task-clickup/templates/"* "$PLUGIN_DIR/skills/task-clickup/templates/" 2>/dev/null
cp "$SCRIPT_DIR/skills/task-clickup/examples/"* "$PLUGIN_DIR/skills/task-clickup/examples/" 2>/dev/null

echo "✔ curea-pm-tools installed to $PLUGIN_DIR"
echo "  Restart Claude Code to load the skills."
