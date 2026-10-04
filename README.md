# 拔辣支付 BalaPAY

巴拉國官方數位支付平台 · 隸屬 [blagov.illusd.com](https://blagov.illusd.com)

類似 LINE Pay 的數位錢包體驗，支援：

- 電子郵件註冊 / 登入
- Turso (libSQL) 後端資料庫
- 實名驗證（巴拉國身分證字號 + BlagovAPI，目前 API 未上線先模擬）
- AI 客服（NVIDIA NIM API）
- 轉帳、交易紀錄、餘額顯示

## 技術棧

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS 4 + Framer Motion
- **Backend**: Next.js API Routes + Server Components
- **Database**: Turso (libSQL / SQLite edge)
- **AI**: NVIDIA NIM (OpenAI-compatible `/v1/chat/completions`)
- **Auth**: JWT + httpOnly cookie + bcrypt
- **Deploy**: Vercel + GitHub

## 快速開始

```bash
# 1. 安裝依賴
npm install

# 2. 複製環境變數
cp .env.example .env.local
# 填入 TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, JWT_SECRET, NVIDIA_API_KEY

# 3. 啟動開發
npm run dev
```

### Demo 帳號（無資料庫時）

- Email: `demo@balapay.com`
- Password: `demo1234`

## 環境變數

| 變數 | 說明 |
|------|------|
| `TURSO_DATABASE_URL` | Turso 資料庫 URL |
| `TURSO_AUTH_TOKEN` | Turso Auth Token |
| `JWT_SECRET` | JWT 簽名密鑰（至少 32 字元） |
| `NVIDIA_API_KEY` | NVIDIA API Key (nvapi-...) |
| `NVIDIA_API_BASE` | 預設 `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | 預設 `meta/llama-3.1-8b-instruct` |

## 部署到 Vercel

1. 將專案推送到 GitHub
2. 在 Vercel 匯入 repo
3. 設定上述 Environment Variables
4. Deploy

或使用 CLI：

```bash
npx vercel
npx vercel --prod
```

## 專案結構

```
src/
├── app/
│   ├── (auth)/login, register
│   ├── (app)/dashboard, transfer, history, profile, help
│   ├── api/auth, api/ai
│   └── page.tsx          # Landing
├── components/AppNav.tsx
└── lib/auth, turso, nvidia, utils
```

## 設計指引

- **動畫**: Framer Motion + Apple-style spring (super skill)
- **字體**: Noto Sans TC + Inter (tpst skill)
- **主題色**: Rose / Orange 呼應「拔辣」

---

© 2026 BalaPAY · blagov.illusd.com
