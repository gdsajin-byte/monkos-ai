# 📂 실행파일 폴더 정리 가이드

**작성일**: 2026-01-08 18:30  
**목표**: monk_cs 스크립트 정리 및 구조화

---

## 📊 현재 상황 (정리 전)

```
MONK_kr/monk_cs/
  ├─ auto_sync_to_d1.py .................. [파싱 + D1 동기화]
  ├─ yonga_qa_validator.py ............... [QA 검증]
  ├─ CS_QA_FOR_YONGA.md .................. [용아 학습 문서]
  ├─ 몽크사진관 Q&A의 사본.txt ........... [원본 CS 데이터]
  ├─ 여권사진_추가.txt ................... [추가 CS 데이터]
  ├─ README.md ........................... [설명서]
  ├─ qa_logs/ ............................ [QA 로그 폴더]
  └─ feedback_logs/ ...................... [피드백 폴더]
```

**문제점:**
- 스크립트, 데이터, 문서가 섞여 있음
- 새로운 스크립트 추가 시 복잡해질 것

---

## 🎯 목표 구조 (정리 후)

```
MONK_kr/monk_cs/
  ├─ scripts/ ............................ [실행 파일들]
  │  ├─ auto_sync_to_d1.py
  │  ├─ yonga_qa_validator.py
  │  └─ batch_update.py (향후)
  │
  ├─ data/ ............................... [원본 CS 데이터]
  │  ├─ 몽크사진관_QA.txt
  │  ├─ 여권사진_QA.txt
  │  └─ 기타_QA.txt
  │
  ├─ docs/ ............................... [문서]
  │  ├─ CS_QA_FOR_YONGA.md
  │  └─ README.md
  │
  ├─ logs/ ............................... [로그 폴더]
  │  ├─ qa_logs/
  │  └─ feedback_logs/
  │
  └─ README.md ........................... [메인 설명서]
```

---

## 🚀 정리 방법

### 방법 1: 자동 정리 스크립트 (추천, 1분)

```bash
#!/bin/bash
# cleanup_monk_cs.sh

cd /Users/jeong-kyushin/developer/monk_project\ /MONK_kr/monk_cs

echo "📂 폴더 생성..."
mkdir -p scripts data docs logs

echo "🔄 파일 이동..."
# 스크립트
mv auto_sync_to_d1.py scripts/
mv yonga_qa_validator.py scripts/

# 데이터
mv 몽크사진관\ Q\&A의\ 사본.txt data/몽크사진관_QA.txt
mv 여권사진_추가.txt data/여권사진_QA.txt

# 문서
mv CS_QA_FOR_YONGA.md docs/

# 로그 (이미 있으면 유지)
mv qa_logs logs/ 2>/dev/null || true
mv feedback_logs logs/ 2>/dev/null || true

echo "✅ 정리 완료!"
tree -L 2
```

### 방법 2: 수동 정리 (안전, 5분)

```bash
# 1. 폴더 생성
mkdir scripts data docs logs

# 2. 파일 복사 (먼저 복사, 나중에 삭제)
cp auto_sync_to_d1.py scripts/
cp yonga_qa_validator.py scripts/
# ... 하나씩 복사

# 3. 테스트 (새 경로에서 실행)
python3 scripts/auto_sync_to_d1.py

# 4. 확인 후 원본 삭제
rm auto_sync_to_d1.py
```

---

## ⚠️ 주의사항

### 1. 경로 업데이트 필요

#### auto_sync_to_d1.py
```python
# 변경 전
WRANGLER_DIR = Path("/Users/.../MONK_kr/cloudflare-workers")

# 변경 후 (상대 경로)
WRANGLER_DIR = Path(__file__).parent.parent.parent / "cloudflare-workers"
```

#### yonga_qa_validator.py
```python
# 변경 전
LOG_DIR = Path(__file__).parent / "qa_logs"

# 변경 후
LOG_DIR = Path(__file__).parent.parent / "logs" / "qa_logs"
```

### 2. README.md 업데이트

```markdown
# monk_cs - CS 자동화 시스템

## 사용법

### CS 데이터 추가
1. `data/` 폴더에 TXT/MD 파일 추가
2. `python3 scripts/auto_sync_to_d1.py` 실행
3. D1 동기화 확인

### QA 검증
`python3 scripts/yonga_qa_validator.py`

## 폴더 구조
- `scripts/`: 실행 파일
- `data/`: CS 원본 데이터
- `docs/`: 문서
- `logs/`: 로그
```

---

## 🎯 난이도 평가

| 방법 | 난이도 | 시간 | 안전성 |
|------|--------|------|--------|
| **자동 스크립트** | ⭐ 쉬움 | 1분 | 중간 (테스트 필요) |
| **수동 정리** | ⭐⭐ 보통 | 5분 | 높음 (단계별 확인) |
| **나중에** | ⭐⭐⭐ - | - | 낮음 (복잡해질 수 있음) |

**제 추천:**
- **지금 하기**: 파일이 적을 때 (16개)
- **방법**: 수동 정리 (안전)
- **시간**: 5분
- **이점**: 나중에 관리 편함

**안 해도 됨:**
- 현재도 작동은 잘 됨
- 급하지 않으면 나중에 해도 OK

---

## 🚀 빠른 정리 스크립트 (준비됨!)

```bash
#!/bin/bash
# ~/cleanup_monk_cs.sh

cd /Users/jeong-kyushin/developer/monk_project\ /MONK_kr/monk_cs

# 백업 먼저
echo "💾 백업 중..."
tar -czf ../monk_cs_backup_$(date +%Y%m%d_%H%M%S).tar.gz .

# 폴더 생성
mkdir -p scripts data docs logs/qa_logs logs/feedback_logs

# 파일 이동 (안전하게)
[ -f auto_sync_to_d1.py ] && mv auto_sync_to_d1.py scripts/
[ -f yonga_qa_validator.py ] && mv yonga_qa_validator.py scripts/
[ -f "몽크사진관 Q&A의 사본.txt" ] && mv "몽크사진관 Q&A의 사본.txt" data/
[ -f 여권사진_추가.txt ] && mv 여권사진_추가.txt data/
[ -f CS_QA_FOR_YONGA.md ] && mv CS_QA_FOR_YONGA.md docs/

# 로그 이동
[ -d qa_logs ] && mv qa_logs/* logs/qa_logs/ 2>/dev/null
[ -d feedback_logs ] && mv feedback_logs/* logs/feedback_logs/ 2>/dev/null

# 빈 폴더 정리
rmdir qa_logs 2>/dev/null
rmdir feedback_logs 2>/dev/null

echo "✅ 정리 완료!"
echo ""
echo "📂 새 구조:"
tree -L 2 -I '__pycache__|*.pyc'
```

---

## 💡 대표님, 어떻게 하시겠습니까?

**1번**: 자동 스크립트 실행 (1분, 제가 실행)  
**2번**: 수동으로 천천히 (5분, 안전)  
**3번**: 나중에 (현재 구조 유지)

**제 추천:** 2번 (안전하고 확실함)

---

**Version**: 1.0  
**Status**: 준비 완료  
**Risk**: 낮음 (백업 자동 생성)
