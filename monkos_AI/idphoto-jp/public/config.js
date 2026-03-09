/**
 * config.js — 環境設定 + 定数
 * idphoto-jp 現地化版
 */

// Google OAuth (憲法6条: config.js 集中管理)
export const GOOGLE_CLIENT_ID = '933456016842-clagcrpo1juvukjif1m454jq811bd2rq.apps.googleusercontent.com';

// API 設定 — hostname 基準環境自動分岐
const IS_DEV = typeof location !== 'undefined' && location.hostname.includes('-dev-');
export const API = {
  PORTAL_URL: IS_DEV ? 'https://monkos-portal-dev-4jeplpqpua-uc.a.run.app' : 'https://monkos.ai',
  // Cloud Run 自体配信 (相対パス)
  PRECHECK: '/api/precheck',
  GENERATE: '/api/idgen',
  CREDIT_USE: '/api/credit/use',       // Cloud Run 直接 (CFプロキシ除去)
  CREDIT_REFUND: '/api/credit/refund', // ダウンロード失敗返金
  COACHING: '/api/coaching',            // 同一サーバー (絶対URL → 相対パス)
};

// クレジットコスト
export const CREDIT_COST = {
  generate: 10,
  download: 70,
  extraCrop: 10,
  fullOriginal: 10,
};

// キャプチャ設定
export const MAX_CAPTURE_SIZE = 512;
export const COACHING_DISPLAY_MS = 10000;
export const FRAME_INTERVAL_MS = 500;
export const CAPTURE_SIZE = 512;

// DPI および変換関数
export const DPI = 300;
export const mmToPx = (mm) => Math.round(mm / 25.4 * DPI);

// テキスト定数 (日本語)
export const TX = {
  stepReady: '撮影準備',
  waiting: '待機中',
  connecting: '接続中',
  connected: 'AI接続済み',
  disconnected: '接続切断',
  faceGuide: 'ここに顔を合わせてください',
  coachingReady: '撮影OK！',
  coachingInit: '姿勢と照明をチェックしています...',
  coachingCheck: '姿勢をチェックしています...',
  btnStarting: 'カメラ起動中...',
  step1: 'Step 1: AI コーチング',
  step2: 'Step 2: 撮影確認',
  step3: 'Step 3: AI リタッチ',
  step4: 'Step 4: クロースアップ',
  resultConfirm: '撮影確認',
  resultConfirmSub: '撮影した写真をご確認ください',
  resultAIOK: 'AIが撮影OK判定した写真です',
  generating: '証明写真リタッチ中...',
  generatingSub: 'MONKOSが処理中です',
  genLoading: 'リタッチ中...',
  resultDone: '完了！',
  resultDoneSub: '証明写真の準備ができました',
  genFail: 'リタッチ失敗',
  specDone: 'クロースアップ完了',
  cameraError: 'カメラを起動できません。\nカメラへのアクセスを許可してください。',
};

// テキストヘルパー
export const t = (key) => TX[key] || key;

// 規格テーブル (mm基準、300dpi出力)
export const PHOTO_SPECS = {
  passport: {
    name: 'パスポート写真 (35x45mm)',
    widthMM: 35,
    heightMM: 45,
    faceTopMM: 7,
    faceLenMM: 27,
  },
  id: {
    name: '証明写真 (30x40mm)',
    widthMM: 30,
    heightMM: 40,
    faceTopMM: 6,
    faceLenMM: 24,
  },
};

// ─── v5 オプション定数 ───

export const V5_OPTIONS = {
  format: ['passport', 'id'],
  gender: ['f', 'm'],
  age: ['baby', 'child', 'teen', 'adult'],
  clothing: ['default', 'change', 'casual', 'suit'],
  clothingColor: {
    child: ['skyblue', 'pink', 'lemon', 'green'],     // 幼児/子供
    adult: ['beige', 'blue', 'wine', 'green'],         // カジュアル (中高生/成人)
  },
  suitColor: ['navy', 'brown', 'gray', 'black'],
  shirtColor: ['white', 'lightblue', 'lightpink', 'lightbeige'],
  tieColor: ['notie', 'navy', 'wine', 'black'],
  tiePattern: ['solid', 'stripe'],
  hair: ['default', 'tidy', 'updo'],
  bgColor: ['white', 'gray', 'blue', 'beige'],
};

// 年齢別 clothing 許容値
export const CLOTHING_BY_AGE = {
  baby: ['default', 'change'],
  child: ['default', 'change'],
  teen: ['default', 'casual', 'suit'],
  adult: ['default', 'casual', 'suit'],
};

// 年齢別 hair 表示有無
export const HAIR_VISIBLE_AGES = ['teen', 'adult'];

// format="passport" → bgColor 強制
export const PASSPORT_FORCED_BG = 'white';

// ─── チャージ商品 (フロントエンド正本 — Lemon Squeezy Variant ID連携) ───
export const CHARGE_OPTIONS = [
  { key: 'single_70', variantId: '1382367', label: '1枚分 (70+10ボーナス)', price: 990, credits: 70, bonus: 10 },
  { key: 'package_100', variantId: '1382348', label: '100クレジット+30ボーナス', price: 1490, credits: 100, bonus: 30, best: true },
  { key: 'package_300', variantId: '1382362', label: '300クレジット+120ボーナス', price: 3990, credits: 300, bonus: 120 },
  { key: 'package_500', variantId: '1382436', label: '500クレジット+250ボーナス', price: 5990, credits: 500, bonus: 250 },
  { key: 'topup_10', variantId: '1382355', label: '10クレジット', price: 150, credits: 10, bonus: 0 },
];

export const JPY_PER_CREDIT = 15;

// スキーマバージョン
export const SCHEMA_VERSION = 'v5';
