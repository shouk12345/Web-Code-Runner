# WEB Code Runner - Frontend

>WEB Code RunnerプロジェクトのFrontendの内部リファレンスです。

---

## Architecture Overview

React + Viteで構築したSPA。状態管理ライブラリは使わず、`App.tsx`を単一の状態所有者（single source of truth）として、各コンポーネントはpropsで値を受け取りcallbackで変更を通知するcontrolledパターンで統一している。

```mermaid
flowchart TD
    App["App.tsx<br/>(language, code, cases, results, status)"]
    App --> LangSelect["LanguageSelect<br/>言語選択"]
    App --> Editor["CodeEditor<br/>(Monaco Editor)"]
    App --> Cases["TestCaseList<br/>テストケース入力"]
    App --> Results["ResultList<br/>判定結果表示"]

    LangSelect -.onChange.-> App
    Editor -.onChange.-> App
    Cases -.onChange.-> App

    App -->|GET /languages| API["Backend API"]
    App -->|POST /submissions| API
    API -.response.-> App

    style App fill:#F4E3C4,stroke:#D9871B
```

各子コンポーネントは自身の状態を持たない。`language`が変わればMonaco Editorのsyntax highlightingが連動し、`results`が埋まればResultListがAC/WA/TLE/RE判定を描画する。

---

## ファイルリファレンス

| ファイル | 役割 |
|---|---|
| `src/App.tsx` | 状態所有者（composition root相当）。全コンポーネントの配置と、`/submissions`へのfetchロジックを保持。 |
| `src/components/LanguageSelect.tsx` | `/languages`をfetchし、対応言語のドロップダウンを描画。 |
| `src/components/CodeEditor.tsx` | Monaco Editorのラッパー。`language`propを内部でMonaco用の言語IDにマッピング（例: `node` → `javascript`）。 |
| `src/components/TestCaseList.tsx` | テストケース（stdin/stdout）の追加・削除・編集UI。1〜10件。 |
| `src/components/ResultList.tsx` | `/submissions`のレスポンス（`VerdictType`: AC/WA/TLE/RE）をバッジ表示。 |
| `vite.config.ts` | ビルド設定。`base`（GitHub Pagesのサブパス対応）、`server.proxy`（ローカル開発時のバックエンド転送先）を定義。 |

---

## 状態フロー — コード実行時

```mermaid
sequenceDiagram
    participant User
    participant App as App.tsx
    participant API as Backend API

    User->>App: 実行ボタン押下
    App->>App: setStatus('running')<br/>setResults(null)
    App->>API: POST /submissions<br/>{code, cases, language}
    alt 成功
        API-->>App: {ret: JudgeResult[]}
        App->>App: setResults(data.ret)<br/>setStatus('idle')
    else 失敗
        API-->>App: エラー / ネットワーク断
        App->>App: setStatus('error')<br/>setErrorMessage(...)
    end
    App-->>User: 結果 or エラー表示
```

実行のたびに`setResults(null)`で前回の結果を一度クリアしてからfetchする。連続実行時に古い結果が画面に残るのを防ぐため。

---

## Tech Stack

- **Framework**: React
- **Build Tool**: Vite
- **Language**: TypeScript
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Deployment**: GitHub Pages（GitHub Actions経由）

---

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

ローカルでバックエンドとの疎通確認をする場合、リポジトリルートでバックエンドも別途起動しておく必要がある（`npm install && npm run dev`、ルート`README.md`参照）。

### 本番ビルドの確認

```bash
npm run build
npm run preview
```

`base`設定込みでビルドされたアセットパスが正しく機能するか、ローカルで確認できる。