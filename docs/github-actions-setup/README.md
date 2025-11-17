# GitHub Workflows

このディレクトリには、PR作成時の自動テストワークフローが含まれています。

## ワークフロー一覧

### PR Tests (`pr-test.yml`)

Pull Request作成時に自動実行されるテストワークフローです。

#### トリガー条件

- `main` または `develop` ブランチへのPR作成/更新時
- 手動実行（workflow_dispatch）

#### 実行されるチェック（並列実行）

1. **Lint** (~30秒)
   - ESLintによるコード品質チェック
   - `bun run lint`

2. **TypeScript Check** (~1分)
   - 型チェック
   - `bun run typecheck`

3. **Unit Tests** (~2-3分)
   - Vitestによるユニットテスト
   - テストデータベースの自動セットアップ
   - `bun test`

4. **E2E Tests** (~5-10分) ⚡ 条件付き実行
   - Playwrightによるエンドツーエンドテスト
   - 実行条件：
     - PRに `run-e2e` ラベルが付いている場合
     - `main` ブランチへのPRの場合
   - テストサーバーの自動起動
   - `bun run test:e2e`

#### コスト最適化機能

- **並列実行**: Lint、TypeCheck、Unit Testsを同時実行
- **Bunキャッシュ**: 依存関係のインストールを高速化
- **Playwrightキャッシュ**: ブラウザインストールをスキップ（2回目以降）
- **条件付きE2E**: E2Eテストは必要な場合のみ実行
- **同時実行制御**: 同じPRで複数のワークフローが実行中の場合、古いものをキャンセル

#### 推定実行時間とコスト

##### プライベートリポジトリの場合

- 基本チェックのみ: **~4分/回**
- E2E含む: **~14分/回**

##### GitHub Actions無料枠（プライベート）

- 月2,000分無料
- 基本チェック: 月500回まで実行可能
- E2E含む: 月142回まで実行可能
- 超過分: $0.008/分

##### パブリックリポジトリ

- 完全無料・無制限

#### E2Eテストの実行方法

E2Eテストを実行したい場合は、以下のいずれかを実施：

1. **PRラベルを追加**

   ```
   PRページで "run-e2e" ラベルを追加
   ```

2. **mainブランチへのPR**
   ```
   mainブランチへのPRは自動的にE2Eテストが実行されます
   ```

#### ブランチ保護設定（推奨）

以下のステータスチェックを必須にすることを推奨：

- `Lint`
- `TypeScript Check`
- `Unit Tests`
- `Test Summary`

設定方法：

1. リポジトリの Settings > Branches
2. `main` ブランチのルールを追加/編集
3. "Require status checks to pass before merging" を有効化
4. 上記のチェックを選択

## トラブルシューティング

### データベースエラーが発生する

ワークフローは自動的にテストデータベースをセットアップします。エラーが発生する場合：

- マイグレーションファイルが正しく配置されているか確認
- `backend/drizzle` ディレクトリが存在するか確認

### Playwrightのインストールエラー

キャッシュが破損している可能性があります：

1. PRを再実行
2. それでも失敗する場合、キャッシュをクリア（Actions > Caches）

### E2Eテストがスキップされる

- PRに `run-e2e` ラベルが付いているか確認
- または `main` ブランチへのPRであることを確認

## ローカルでの実行

ワークフローと同じテストをローカルで実行：

```bash
# Lint
bun run lint

# TypeCheck
bun run typecheck

# Unit Tests
bun test

# E2E Tests
bun run dev:test  # 別ターミナル
bun run test:e2e
```

## 参考リンク

- [GitHub Actions料金](https://docs.github.com/ja/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Bunのドキュメント](https://bun.sh/docs)
- [Vitestのドキュメント](https://vitest.dev/)
- [Playwrightのドキュメント](https://playwright.dev/)
