---
type: order
date: 2026-11-06
from: iMac/쌍아
to: iMac/쌍아-막내8
subject: 바둑판 설정을 서버에 저장 — 접속 경로(포털 어드민 경유·로컬·테일넷·PWA)가 달라도 같은 설정. 기본 상대를 MONKOS로
status: 대기
portfolio: PF_GO
---

# ORDER — 바둑판 설정 서버 저장

**[2026-11-06 15:45 KST]** iMac/쌍아 → iMac/쌍아-막내8

출처: 작가님 2026-11-06 15:41 iMac/쌍아 세션 사람 턴(캡처 — 4점 접바둑, 상대 KataGo 최강, 기본 돌 그림) "세팅도 없어지고 로딩하는 데 시간도 많이 걸리고 돌 디자인도 바뀌고", 15:45 "포털에서 어드민 통해서 들어간 건데 웹에선 그렇게밖에 못 들어가니까. 몽코스봇으로 바꾸니 훨씬 빨라지긴 하네".

## 0. 진단 (쌍아 실측 15:41)
- iMac 부하 2.8·메모리 여유 81%·8765 응답 1ms(2회) → 자원 문제 아님.
- `apps/go-board-web/index.html` 설정이 브라우저 localStorage(`goBoardSkin`·`goBoardSkinBoard`·`goBoardSkinStones`·`goBoardPack`·`goBoardKataLevel`·`goBoardMonkVer`·`goBoardBots`·`goBoardSound`·`goBoardSize`·`goBoardColorPick`·`goBoardRvNums`·`goBoardRvSpeed`·`goBoardLiveFolded`·`goLobbyTab`)에만 있다 → 포털 어드민 경유 출처에선 전부 기본값. 기본 상대가 KataGo 최강이라 첫 수부터 느렸다.

## 1. 할 일
1. **포털 어드민 경유 경로 실측**: 작가님이 웹에서 들어오는 실제 출처(호스트)와 사용자 식별 수단(어드민 인수 코드·쿠키 등)을 확인해 COMPLETION에 적는다.
2. **서버 저장**: 위 설정을 사용자(작가님) 단위로 서버(`~/.monkos/go-board/` 아래 JSON)에 저장·불러오기. 화면 로딩 시 서버 값 우선, 변경 즉시 저장. localStorage는 서버 불통 시 예비로만.
3. **기본 상대 = MONKOS Go(최신 버전)**: 저장값이 없을 때의 기본. KataGo 최강은 선택 시에만.
4. 기존 로컬 주소(127.0.0.1:8765)에 있는 작가님 설정이 있으면 첫 로딩 때 서버로 1회 올린다(덮어쓰기 아님 — 서버 값 없을 때만).

## 2. 검증
- 시험 포트 8766만. 출처 2개(127.0.0.1·localhost 또는 어드민 경유 재현)에서 스킨·상대를 바꿔 다른 출처에 반영되는지 양성 1, 서버 끈 상태에서 화면이 깨지지 않는지 음성 1.
- 모바일 폭 캡처 1장.

## 3. 하지 않는 것
8765 재기동(쌍아 — 진행 판 0일 때). 포털(monkos.ai) 코드·배포 변경 — 필요하면 보고만.

## 4. 준수
헌법 3조. 반환: COMPLETION + 브랜치 SHA. 병합은 쌍아.
