---
name: commit-message
description: gitのステージ済み変更を確認し、Semantic Commit Messages形式（`type: verb object`の1行、scopeなし、descriptionなし）のコミットメッセージ案を3つ提示するシンプルなスキル。「コミットメッセージを考えて」「メッセージ提案して」「/commit-message」のようなリクエストで発動する。typeに迷う変更（fixともchoreとも取れる等）では、prefixを散らした3案を返してユーザーに選ばせる。コミット自体は実行しない。
---

# Commit Message 提案

ステージ済みの変更に対して`type: verb object`形式のコミットメッセージを**3案**提示する。提案のみで、`git commit`や`git add`は実行しない。

## 動作フロー

1. `git diff --cached --stat`でステージ済みの有無とファイル一覧を同時に確認する。出力が空なら「ステージ済みの変更がありません」と返して終了。未ステージファイルは見ない（`git status`は使わない）。
2. `git diff --cached`で実際の変更内容を取得する。長大なdiffは要点だけ拾えばよい。
3. 会話の文脈に変更の背景・意図（直前の議論、ユーザーから明示された目的、関連する依頼など）があれば踏まえる。なければdiffから推測する。背景情報があると軽微な修正なのか機能追加なのかの判断に決定的に効くため、ここは抜かさない。
4. 以下のフォーマットで**3案だけ**を返して終了：

   ```
   1. <type>: <verb> <object>
   2. <type>: <verb> <object>
   3. <type>: <verb> <object>
   ```

   前置き・対象ファイル一覧・選び方の解説など、3行以外の出力は付けない。

## typeの選び方

使うtypeは次の7つに限定する: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`

- **feat**: 新機能・新規追加（ソース系ディレクトリへの`A`等）
- **fix**: 既存の誤り・不具合の訂正
- **refactor**: 内容を変えずに構造を整理
- **docs**: ドキュメント・コメント（`*.md`, `docs/`, コメント主体）
- **style**: フォーマット・空白・整形のみ
- **test**: テスト関連
- **chore**: 設定・補助ツール・上記以外（`.gitignore`, `.vscode/`, ビルド設定の調整等）

typeに迷う変更（fixともchoreともstyleとも取れる等）では、**3案でprefixを散らす**。例：

```
1. fix: adjust output format
2. chore: tweak config file
3. style: refine formatting rules
```

一方、typeがほぼ一意に決まる変更では、**同type内でsubjectの言い回しや粒度を変えた3案**を返してよい。ただし一意と決め込む前に、別typeに置換しても通るか少し自問する。通るなら散らす側に倒す。例：

```
1. docs: add architecture overview
2. docs: document section structure
3. docs: clarify build instructions
```

## subjectの書き方

- 全部小文字
- 命令形動詞（add, update, fix, remove, rename, move, extract, introduce, drop等）
- 句点なし
- 50字以内
- 具体的なファイル名は羅列しない（「何を」「どう変えたか」を抽象化）

## やってはいけないこと

- scopeを付けない（`feat(api): ...`のような括弧表記は使わない）
- description / body / footerを書かない（1行のみ）
- `git commit` / `git add` を実行しない（提案だけ）
- 3案以外の前置き・補足・対象ファイル一覧を出力しない
