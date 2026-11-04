---
type: design
date: 2026-11-05
portfolio: PF_GO
---

# 첫 실행 자동 측정(autobench) 설계 메모 — MONKOS Go 정식 앱(⑥-2) 재사용용

> 구현: `patch_autobench.py` → 시험 앱 `KataGoHelper.mm`의 `// ===== MONK autobench` 블록. 지시서 ORDER_20261105 기기사양별실측 §1.

## 목적
기기마다 성능이 10배 넘게 차이 난다(17 Pro b10 약 1,000 v/s). 그래서 봇 응수가 **목표 2초 안**에 들어오도록 수읽기를 기기에서 스스로 정한다.

## 세 단계 (함수 하나씩, UI 무관)

| 함수 | 입력 → 출력 | 비고 |
|---|---|---|
| `monkMeasureVisitsPerSec(model, config, raw&)` | → visits/s (실패 −1) | KataGo `benchmark -v 300 -n 3 -t 32,32`를 cout 캡처로 1회 실행한다. 같은 스레드 수를 두 번 돌려 **마지막(두 번째) 값**만 쓴다. 첫 회에는 Metal 그래프 준비(17 Pro 약 4초)가 섞인다. 위치마다 NN 캐시를 비우므로(playutils `clearCache`) 두 번째 값이 부풀지 않는다 |
| `monkDecideVisits(vps, 2.0, 0.85, 100, 1500)` | → 수읽기 | `clamp(floor(vps × 2초 × 0.85 / 50) × 50, 100, 1500)`. 0.85는 실대국 국면이 벤치 국면보다 무거울 때의 여유다. 측정 실패 시 하한 100 |
| `monkAutoBench(docs, model, config)` | → 수읽기 | `Documents/autobench.json`이 있고 모델 바이트 수가 같으면 재사용한다(재측정 없음). `Documents/autobench_redo`가 있으면 다시 잰다. 기록 필드: machine(예: iPhone18,1)·os·modelBytes·visitsPerSec·maxVisits·targetSec·safety·measureSec·measuredAt·rawTail |

- 적용: gtp에 `-override-config maxVisits=N`(설정 파일은 번들이라 읽기 전용).
- 회수: `devicectl device copy from --domain-type appDataContainer --source Documents/autobench.json`.

## 정식 앱으로 옮길 때
- 측정은 첫 실행 "준비 중" 화면에서 한다(약 5~8초. 저가 기기는 더 걸릴 수 있으니 상한 10초·실패 시 하한값으로).
- 발열 감속 대비: 대국 중 실측 응수 시간의 이동평균이 목표 ×1.3을 넘으면 수읽기를 한 단계 낮춘다(이번 구현에는 없음 — 제안).
- OS 업데이트·모델 교체 때 재측정한다(모델 바이트 수·os 문자열 비교).
- 기기명은 기종 코드(utsname)만 남긴다. 사용자 기기 이름은 쓰지 않는다(개인정보).
