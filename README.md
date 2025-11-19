# megami

## 📌 概要
このリポジトリは、チーム開発で担当した機能を抜粋し再構築したものです。  
全体の開発プロジェクトの中で、私が担当したページ/機能を整理し、ポートフォリオ用にまとめています。  

## 🎯 担当範囲
- 実装したページ：イベント管理、会場情報、LINE友だち登録者管理、タグ管理、通知管理、イベント参加データ分析の6ページのUIとCRUD処理
- 使用技術：JavaScript, Vue3, Nuxt3, Vuetify, Supabase
- 主な役割：フロントエンド・バックエンド実装、API連携、UIデザイン調整

## 🛠 技術スタック
- フロントエンド: Vue3 / Nuxt3 / Vuetify
- バックエンド: Supabase (PostgreSQL) / Firebase Functions
- その他: GitHub / Figma / Slack

## 💡 工夫したポイント
- UI/UX改善：一覧表示や色の統一感（余白のバランスなど）、フォーム未入力で登録ボタンを押せない設計、カレンダーの表示を今日の日付と連動させて表示する
- バリデーション処理の実装：タグの重複登録を防止、必須項目未入力防止、数字の半角と全角入力、
- リレーションDB設計：中間テーブルを利用した多対多管理
- チームでの開発フローに基づいたGit運用：featureブランチ → developへのPR

## 📸 デモ 
-稼働イメージをFigmaにて掲載しています。→【https://www.figma.com/design/VpoRbNJfjKbFzMZ1XcPeFI/megamoPortfolio?node-id=0-1&t=SNgF8Qu2gshxwBal-1】
-アプリURL【https://megamiportfolio.web.app/】

## 📂 コード構成
フロントエンド
/pages
 /dashboard
  /index.vue(イベント管理)
  /dataAnalysis
   index.vue（イベント参加データ分析）
  /manage
   /friend
    /index.vue（LINE友だち登録者管理）
   /tag
    /index.vue（タグ管理）
  /notificationManage
   /index.vue（通知管理）
  /venue
   /index.vue（会場管理）
バックエンド
/functions
 /index.mjs(バックエンド一元管理)

## 🚀 実行方法
-アプリURL【https://megamiportfolio.web.app/】  

## 👤 補足
- 開発形態: チーム開発 / 実務案件  
- チーム規模: 2名  
- 私の役割: フロントエンド・バックエンドエンジニア  
- 開発期間: 2ヶ月  
