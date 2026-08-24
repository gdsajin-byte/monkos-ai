/**
 * 엣지 신뢰 판정 — CF Worker 경유 요청의 실클라이언트 IP·국가 복원 (2026-08-24)
 *
 * 배경: monkos.ai가 CF Worker(monkos-portal-edge) 뒤로 이관되면 Cloud Run이 보는
 * 피어 IP = CF 이그레스 IP가 된다. 이 상태로는
 *   ① checkRateLimit이 CF IP 기준으로 버킷팅 → 정상 유저 간 429 충돌
 *   ② detectPaymentRegion(geoip)이 CF 엣지 위치로 오판 → Toss/Lemon 오배정
 * Worker가 X-Monkos-Client-IP / X-Monkos-Client-Country 헤더로 원 클라이언트
 * 정보를 전달하고, 본 모듈은 **피어가 실제 Cloudflare 대역일 때만** 이를 신뢰한다
 * (신뢰 프록시 패턴 — 공유 시크릿 불요, 직접 run.app 타격 시 헤더 스푸핑 무효).
 *
 * CF 대역 정본: https://www.cloudflare.com/ips (실측 2026-08-24. 연 단위로 드물게 변경 —
 * 변경 시 이 목록 갱신. 미갱신 시 신뢰 실패로 무해하게 폴백될 뿐 보안 저하는 없다.)
 */

const CF_IPV4 = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
];
const CF_IPV6_PREFIXES = [
  '2400:cb00:', '2606:4700:', '2803:f800:', '2405:b500:', '2405:8100:', '2a06:98c', '2c0f:f248:',
];

// v4 CIDR → [base, mask] 사전 계산
const V4_RANGES = CF_IPV4.map((cidr) => {
  const [ip, bits] = cidr.split('/');
  const base = ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o, 10), 0) >>> 0;
  const mask = bits === '0' ? 0 : (~0 << (32 - parseInt(bits, 10))) >>> 0;
  return [base & mask, mask];
});

function ipv4ToInt(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = parseInt(p, 10);
    if (Number.isNaN(o) || o < 0 || o > 255) return null;
    n = ((n << 8) + o) >>> 0;
  }
  return n;
}

export function isCloudflareIP(ip) {
  if (!ip) return false;
  ip = ip.trim();
  if (ip.includes(':')) {
    const low = ip.toLowerCase();
    return CF_IPV6_PREFIXES.some((p) => low.startsWith(p));
  }
  const n = ipv4ToInt(ip);
  if (n === null) return false;
  return V4_RANGES.some(([base, mask]) => (n & mask) === base);
}

import { timingSafeEqual } from 'crypto';

/** 공유 시크릿 상수시간 대조 — 길이 불일치도 비신뢰 (타이밍 누설 방지) */
function edgeKeyMatches(claimed) {
  const expected = process.env.EDGE_TRUST_KEY || '';
  if (!expected || !claimed) return false;
  const a = Buffer.from(String(claimed));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * 요청의 신뢰 엣지 여부 + 실클라이언트 IP·국가 복원.
 * 신뢰 조건 = 피어(rightmost XFF — GFE가 실피어를 우측 append) ∈ CF 대역 **AND**
 * 공유 시크릿(X-Monkos-Edge-Key) 일치 (2026-08-24 쌍아 P2-2 — CF 공용 대역은 전 테넌트
 * 공유라 대역만으로는 타 계정 Worker 중계 위장을 못 거름. 한쪽만 충족해도 비신뢰).
 * EDGE_TRUST_KEY 미설정 시 항상 비신뢰 (fail-secure). 그 외엔 종전 로직 폴백.
 */
export function resolveEdgeClient(req) {
  const xff = req.headers['x-forwarded-for'];
  const peer = (xff ? xff.split(',').pop().trim() : '') || req.socket?.remoteAddress || '';
  const claimedIp = req.headers['x-monkos-client-ip'];
  const claimedCountry = req.headers['x-monkos-client-country'];
  if (claimedIp && isCloudflareIP(peer) && edgeKeyMatches(req.headers['x-monkos-edge-key'])) {
    return { trusted: true, ip: claimedIp, country: claimedCountry || null };
  }
  return { trusted: false, ip: null, country: null };
}

/**
 * 절대 URL 조립용 유효 호스트 — 엣지 경유 시 오리진이 보는 Host는 run.app이므로
 * Worker가 전달한 X-Forwarded-Host(= monkos.ai)를 신뢰 조건부로 우선한다.
 * OAuth redirect_uri 등 호스트 파생 URL이 run.app으로 새는 것을 방지 (2026-08-24).
 * 비신뢰 요청의 XFH는 무시 — 직접 run.app 타격으로 호스트 위조 불가.
 */
export function effectiveHost(req) {
  const xfh = req.headers['x-forwarded-host'];
  if (xfh && resolveEdgeClient(req).trusted) return xfh;
  return req.headers.host;
}
