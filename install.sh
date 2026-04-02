#!/bin/bash
# @yountofu/pm-tools installer
# ~/.claude/plugins/pm-tools/ 에 스킬 파일을 복사합니다

PLUGIN_DIR="$HOME/.claude/plugins/pm-tools"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$PLUGIN_DIR/.claude-plugin"
mkdir -p "$PLUGIN_DIR/skills/ui-design-guide"
mkdir -p "$PLUGIN_DIR/skills/ui-mobile-design"

cp "$SCRIPT_DIR/.claude-plugin/plugin.json" "$PLUGIN_DIR/.claude-plugin/plugin.json"
cp "$SCRIPT_DIR/skills/ui-design-guide/SKILL.md" "$PLUGIN_DIR/skills/ui-design-guide/SKILL.md"
cp "$SCRIPT_DIR/skills/ui-mobile-design/SKILL.md" "$PLUGIN_DIR/skills/ui-mobile-design/SKILL.md"

echo "✔ @yountofu/pm-tools installed to $PLUGIN_DIR"
echo "  Restart Claude Code to load the skills."
