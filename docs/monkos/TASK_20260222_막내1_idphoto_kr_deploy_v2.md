# 지시서: idphoto-kr dev 배포 + 전체 검증

> [2026-02-22 17:20 KST] iMac/쌍아 → 막내1

## 역할 선언
> **너는 "막내1호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 법률 제5장 (배포 규칙): dev 배포만. prod 배포 금지
- 법률 제6장 (브랜치/커밋): develop 브랜치에서 커밋

## 전제
- S1(camera.html v2), S2(prep.js 챗봇 제거) 완료 상태여야 함
- P2(dead CSS), P3(responseModalities) 완료분도 pull 후 반영

## 작업

### 1. git pull (다른 막내 커밋 수렴)
```bash
git pull origin develop
```

### 2. 전체 가격 정합성 검증
```bash
grep -rn 'buyCreditsKR' monkos_AI/idphoto-kr/public/*.html
```
- 5개 HTML 전부 v2 가격(1450/13050/34800/50750)만 존재 확인
- v1 가격(12900/29900/45900) 0건 확인

### 3. 일괄 커밋
```bash
git add monkos_AI/idphoto-kr/public/
git commit -m "[fix] idphoto-kr v2 가격 통일 + dead code 정리 — camera v1→v2, 챗봇 껍데기 제거"
git push origin develop
```

### 4. dev 배포
```bash
cd monkos_AI/idphoto-kr
./deploy.sh dev
```

### 5. 배포 검증
- `/health` 200 확인
- LP(`/`) 접근 확인

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `배포` |
| 산출물 | dev 배포 완료 |
| 문서 유형 | 해당 없음 |
| 세션 로그 | `[log] 태그 커밋` |
