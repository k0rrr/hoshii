# HOSHII

地域の「こんなお店・施設が欲しい」を投稿し、賛同とアンケートで需要を見える化するWebアプリです。

## ローカルで起動

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`にSupabaseのProject URLとPublishable keyを設定してください。Secret key / Service Role keyは設定しないでください。

## Supabaseの初期設定

1. SQL Editorで `supabase/migrations/20261111000000_hoshii_mvp.sql` を確認し、対象プロジェクトが開発用であることを確認してから実行します。このSQLは既存の`demands`行を削除せず、プロフィール・賛同・回答テーブル、集計関数、RLSを追加します。既存の`demands`の書き込みポリシーは所有者限定のものに置き換えます。
2. Authentication → URL ConfigurationでローカルURL `http://localhost:5173/**`、`http://localhost:5174/**`、`http://127.0.0.1:5173/**` と本番URL `https://<your-domain>/**` をRedirect URLsへ登録します。
3. AuthenticationのEmail providerでメール確認を設定します。パスワード再設定メールもこの設定を使います。

## 検証

```bash
npm test
npm run lint
npm run build
npm run preview
```

## Vercelへデプロイ

VercelのProject SettingsでFramework PresetをViteにし、環境変数`VITE_SUPABASE_URL`と`VITE_SUPABASE_PUBLISHABLE_KEY`をPreview / Productionへ設定してデプロイします。`vercel.json`はReact Routerの直リンクをアプリへ返す設定です。デプロイ後は実際のドメインをSupabase AuthのRedirect URLsへ追加してください。

## 画面

- `/` 投稿一覧、地域・カテゴリ絞り込み、人気順・新着順
- `/map` 座標が未登録のため、ピン配置をせず地域別件数を表示
- `/post` ログインユーザーの投稿
- `/demands/:id` 詳細、賛同アンケート、所有者向け編集・削除
- `/mypage` 表示名、自分の投稿、賛同履歴
- `/login` ログイン・新規登録
- `/reset-password` パスワード再設定メールの依頼

## 自動テストの範囲

`npm test`は一覧・履歴の回帰テストと、ローカルPostgreSQL（PGlite）でのマイグレーション・RLS検証を実行します。匿名／本人／別ユーザーによる読み書き、重複賛同、回答の非公開、集計、削除時の関連データ処理を確認します。テストはメモリ内で完結し、Supabaseの実データは変更しません。Supabase Auth・メール配送と本番DBへの適用後の動作確認は別途必要です。
