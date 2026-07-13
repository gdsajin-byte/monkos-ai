#!/usr/bin/env node
// 미국 서브 헤드텀 FAQ 증보 — us-visa·us-passport (1회성 배치, 재실행 시 중복 방지)
// 근거: REPORT_20260713 헤드텀 설계 §4-5 — 초경쟁 메인텀 대신 DS-160·green card·2x2 online 서브텀 침투.
// FAQ는 FAQPage JSON-LD에 자동 편입되므로 데이터 추가만으로 구조화 노출까지 완결된다.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DATA_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/cms/specs-data.json');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const ADD = {
  'us-visa': [
    {
      ko: { q: 'DS-160 비자 신청서용 디지털 사진 규격은?', a: 'DS-160 온라인 신청에는 정사각형 디지털 사진이 필요합니다 — 600×600에서 1200×1200픽셀, JPEG 형식, 240KB 이하, 6개월 이내 촬영본. 인쇄 제출용은 2×2인치(5.1×5.1cm)입니다. MONKOS는 두 형식 모두 규격에 맞춰 생성합니다.' },
      en: { q: 'What are the DS-160 photo requirements?', a: 'The DS-160 online application requires a square digital photo: 600×600 to 1200×1200 pixels, JPEG format, 240KB or less, taken within the last 6 months. For printed submission, the size is 2×2 inches (51×51 mm). MONKOS generates both formats to spec.' },
      ja: { q: 'DS-160申請用のデジタル写真の規格は？', a: 'DS-160オンライン申請には正方形のデジタル写真が必要です — 600×600〜1200×1200ピクセル、JPEG形式、240KB以下、6ヶ月以内の撮影。印刷提出用は2×2インチ（5.1×5.1cm）です。MONKOSは両方の形式に対応しています。' },
    },
    {
      ko: { q: '2×2인치 비자 사진을 온라인으로 만들 수 있나요?', a: '가능합니다. 셀카를 업로드하면 AI가 흰 배경으로 변환하고 미국 규격(2×2인치, 머리 높이 2.2~3.5cm)에 맞춰 자동 크롭합니다. 인화 없이 디지털 파일로 즉시 받을 수 있습니다.' },
      en: { q: 'Can I make a 2x2 visa photo online?', a: 'Yes. Upload a selfie and the AI converts it to a white background and auto-crops it to the US spec — 2×2 inches with head height 1 to 1⅜ inches (25–35 mm). You get a compliant digital file instantly, no printing required.' },
      ja: { q: '2×2インチのビザ写真をオンラインで作れますか？', a: 'はい。セルフィーをアップロードすると、AIが白背景に変換し、米国規格（2×2インチ、頭部の高さ25〜35mm）に自動クロップします。デジタルファイルを即時ダウンロードできます。' },
    },
  ],
  'us-passport': [
    {
      ko: { q: '영주권(그린카드) 신청 사진도 같은 규격인가요?', a: '네, 영주권(I-485 등) 신청 사진도 미국 여권 사진과 동일한 2×2인치(5.1×5.1cm) 규격입니다 — 흰 배경, 정면, 6개월 이내 촬영. 통상 2매를 제출합니다.' },
      en: { q: 'Is the green card photo the same size as the passport photo?', a: 'Yes. Green card (e.g. I-485) application photos use the same spec as US passport photos — 2×2 inches (51×51 mm), white background, front-facing, taken within 6 months. Two copies are typically required.' },
      ja: { q: 'グリーンカード申請の写真も同じ規格ですか？', a: 'はい。グリーンカード（I-485など）申請の写真も米国パスポート写真と同じ2×2インチ（5.1×5.1cm）規格です — 白背景・正面・6ヶ月以内の撮影。通常2枚提出します。' },
    },
  ],
};

for (const [slug, items] of Object.entries(ADD)) {
  const d = data[slug];
  if (!d) { console.log(`⚠️ ${slug} 미존재 — 건너뜀`); continue; }
  d.faqs = d.faqs || {};
  for (const lang of ['ko', 'en', 'ja']) {
    d.faqs[lang] = d.faqs[lang] || [];
    for (const item of items) {
      if (d.faqs[lang].some(f => f.q === item[lang].q)) continue; // 재실행 중복 방지
      d.faqs[lang].push(item[lang]);
    }
  }
  console.log(`${slug}: faqs → ko ${d.faqs.ko.length} / en ${d.faqs.en.length} / ja ${d.faqs.ja.length}`);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log('기록 완료');
