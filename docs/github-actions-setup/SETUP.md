# PR Test Automation Setup Instructions

## 概要

このディレクトリには、PR作成時の自動テストワークフローの設定ファイルが含まれています。

## セットアップ手順

### ステップ1: ワークフローファイルを配置

以下の2つのファイルを正しい場所にコピーしてください：

1. `pr-test.yml` → `.github/workflows/pr-test.yml`
2. `README.md` → `.github/README.md`

### コマンド例

リポジトリのルートディレクトリで実行：

```bash
# ディレクトリを作成
mkdir -p .github/workflows

# ファイルをコピー
cp docs/github-actions-setup/pr-test.yml .github/workflows/
cp docs/github-actions-setup/README.md .github/
```

### ステップ2: コミットしてプッシュ

```bash
git add .github/
git commit -m "feat: add GitHub Actions PR test automation"
git push
```

## なぜこの手順が必要か？

GitHub Appには `.github/workflows/` ディレクトリ内のファイルを直接作成・更新する権限がありません。
これはGitHubのセキュリティ機能です。

そのため、ファイルは `docs/` ディレクトリに配置してあり、手動で `.github/` に移動する必要があります。

## ワークフロー概要

### 実行されるテスト

- **Lint** (~30秒) - ESLintによるコード品質チェック
- **TypeScript Check** (~1分) - 型チェック
- **Unit Tests** (~2-3分) - Vitestによるユニットテスト
- **E2E Tests** (~5-10分) - 条件付き実行（`run-e2e`ラベルまたはmainブランチPR）

### コスト試算（プライベートリポジトリ）

- 基本チェック（Lint + TypeCheck + Unit Tests）: **4分/PR**
- GitHub Actions無料枠: 月2,000分
- **月500回のPRまで無料枠内で実行可能**

パブリックリポジトリの場合は完全無料です。

### E2Eテストの実行方法

E2Eテストを実行したい場合：

1. PRに `run-e2e` ラベルを追加
2. または `main` ブランチへのPRとして作成

## トラブルシューティング

詳細は `.github/README.md` を参照してください（セットアップ後）。

## 次のステップ

セットアップ完了後：

1. テストPRを作成してワークフローが動作することを確認
2. リポジトリ設定でブランチ保護を有効化（推奨）
   - Settings > Branches > Add rule
   - 必須チェック: `Lint`, `TypeScript Check`, `Unit Tests`, `Test Summary`
