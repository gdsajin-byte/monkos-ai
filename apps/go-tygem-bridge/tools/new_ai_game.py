# 사용: new_ai_game.py [--from-game]  — 타이젬 웹 '19줄 인공지능' 대국 신청: KatagoAI-P9단 · 호선 · 흑돌
#   --from-game  끝난 대국 화면에서 시작(먼저 '나가기')
# 대기실·신청 창은 canvas라 좌표 클릭이다. 좌표는 CSS 뷰포트 1571×1352 실측(10-23) — 다르면 클릭하지 않고 멈춘다.
# 각 단계 캡처: ~/.monkos/tygem/shots/ng_*.png. 신청 직전 설정 화면을 캡처로 남긴다(사람 확인용).
import asyncio, sys
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, ev, shot, click

VIEW = (1571, 1352)
STEPS_FROM_GAME = [("나가기", 94, 1270, 3)]
STEPS = [("인공지능 탭", 1100, 159, 2), ("19줄 인공지능", 1098, 209, 3),
         ("컴퓨터 수준 열기", 729, 677, 1.5), ("KatagoAI-P9단", 700, 716, 1.5),
         ("대국방법 열기", 965, 678, 1.5), ("호선", 936, 716, 1.5)]
SUBMIT = ("신청", 615, 932, 3)


async def main(from_game, submit):
    c, _ = await connect()
    vw = tuple(await ev(c, "[innerWidth, innerHeight]"))
    if vw != VIEW:
        raise SystemExit(f"❌ new_ai_game: 뷰포트 {vw} ≠ 실측 {VIEW} — 좌표 재측정 필요, 클릭 안 함")
    for i, (name, x, y, w) in enumerate((STEPS_FROM_GAME if from_game else []) + STEPS):
        await click(c, x, y); await asyncio.sleep(w)
        print(f"{i + 1}. {name}")
    print("설정 캡처:", await shot(c, "ng_settings.png"))
    if submit:
        await click(c, SUBMIT[1], SUBMIT[2]); await asyncio.sleep(SUBMIT[3])
        print("신청 후:", await shot(c, "ng_started.png"))

a = sys.argv
asyncio.run(main("--from-game" in a, "--no-submit" not in a))
