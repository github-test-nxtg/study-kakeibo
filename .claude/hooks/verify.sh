#!/usr/bin/env bash
# Claude Code の Stop フック：Claude が応答を終えるたびに自動チェックを実行する。
# 失敗したら exit 2 で結果を Claude に返し、修正を続けさせる。

INPUT=$(cat)

# フックがすでに一度 Claude を引き止めている場合は、無限ループを避けるため止めない
case "$INPUT" in
  *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# 変更がない応答（質問への回答だけなど）ではチェックを省略する
if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

# Windows に Node.js があれば直接、なければ Docker で実行する
if command -v npm >/dev/null 2>&1; then
  OUTPUT=$(npm run check --silent 2>&1)
else
  OUTPUT=$(docker compose run --rm -T app npm run check --silent 2>&1)
fi
STATUS=$?

if [ $STATUS -ne 0 ]; then
  {
    echo "自動チェック（型チェック・単体テスト・ビルド）が失敗しました。原因を調べて修正してください。"
    echo "----- 出力の末尾 -----"
    echo "$OUTPUT" | tail -n 60
  } >&2
  exit 2
fi
exit 0
