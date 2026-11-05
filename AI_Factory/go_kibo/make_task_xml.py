#!/usr/bin/env python3
"""4060 작업 스케줄러 XML 생성 — 기존 GO-train-resume XML(내보내기)을 바탕으로 principal·설정을 그대로 물려받는다.

사용: python3 make_task_xml.py RESUME_EXPORT.xml OUTDIR --b10-at 2026-11-05T23:00:00 --b10-until 2026-11-06_07:30
출력: OUTDIR/GO-train-resume.xml (트리거·--until만 변경), OUTDIR/GO-mistakes-run.xml (매일 23:05, 러너)
둘 다 UTF-16(schtasks /create /xml 요구). StartWhenAvailable=true 강제.
"""
import argparse
import os
import re

RUNNER = r"C:\Users\smuse73\go_kibo\mistakes_runner.py"
PYW = r"C:\Users\smuse73\venvs\go-train\Scripts\pythonw.exe"


def read(path):
    b = open(path, "rb").read()
    for enc in ("utf-16", "utf-8"):
        try:
            t = b.decode(enc)
            if "<Task" in t:
                return t
        except UnicodeDecodeError:
            pass
    raise SystemExit("❌ make_task_xml: XML 해독 실패")


def write(path, text):
    with open(path, "w", encoding="utf-16") as f:
        f.write(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("outdir")
    ap.add_argument("--b10-at", required=True, help="YYYY-MM-DDTHH:MM:SS (KST)")
    ap.add_argument("--b10-until", required=True, help="YYYY-MM-DD_HH:MM")
    ap.add_argument("--no-final-eval", action="store_true", help="b10 인자에서 --final-eval 제거(평가가 07:30을 넘길 수 있을 때)")
    ap.add_argument("--scenes-at", default=None, help="결정 장면 1회 예약 YYYY-MM-DDTHH:MM:SS (낮 창, GO-scenes-run.xml 추가 생성)")
    ap.add_argument("--scenes-end", default="14:00", help="결정 장면 창 끝(러너가 이 시각에 엔진을 끊음)")
    ap.add_argument("--mistakes-at", default=None, help="매일 시작 기준 YYYY-MM-DDTHH:MM:SS (기본 b10-at 날짜 23:05)")
    a = ap.parse_args()
    src = read(a.src)
    if "<StartWhenAvailable>true</StartWhenAvailable>" not in src:
        src = src.replace("<StartWhenAvailable>false</StartWhenAvailable>", "<StartWhenAvailable>true</StartWhenAvailable>")
    # ① b10: 트리거 시각 + --until 만 변경
    b10 = re.sub(r"<StartBoundary>[^<]*</StartBoundary>", f"<StartBoundary>{a.b10_at}+09:00</StartBoundary>", src, count=1)
    b10, n = re.subn(r"--until [^\s<]+", f"--until {a.b10_until}", b10)
    if n != 1:
        raise SystemExit("❌ make_task_xml: --until 인자를 찾지 못함")
    if a.no_final_eval:
        b10 = b10.replace(" --final-eval", "")
    # ② 실수 사전 러너: 매일 23:05, 실행 한도 9시간
    at = a.mistakes_at or a.b10_at[:10] + "T23:05:00"
    mk = re.sub(r"<URI>[^<]*</URI>", r"<URI>\\MONK\\GO-mistakes-run</URI>", src)
    mk = re.sub(r"<Triggers>.*?</Triggers>",
                f"<Triggers>\n    <CalendarTrigger>\n      <StartBoundary>{at}+09:00</StartBoundary>\n      <Enabled>true</Enabled>\n"
                f"      <ScheduleByDay>\n        <DaysInterval>1</DaysInterval>\n      </ScheduleByDay>\n    </CalendarTrigger>\n  </Triggers>",
                mk, flags=re.S)
    mk = re.sub(r"<ExecutionTimeLimit>[^<]*</ExecutionTimeLimit>", "<ExecutionTimeLimit>PT9H</ExecutionTimeLimit>", mk)
    mk = re.sub(r"<Command>[^<]*</Command>", lambda _: f"<Command>{PYW}</Command>", mk)
    mk = re.sub(r"<Arguments>[^<]*</Arguments>", lambda _: f"<Arguments>\"{RUNNER}\"</Arguments>", mk)
    mk = re.sub(r"<WorkingDirectory>[^<]*</WorkingDirectory>", lambda _: r"<WorkingDirectory>C:\Users\smuse73\go_kibo</WorkingDirectory>", mk)
    os.makedirs(a.outdir, exist_ok=True)
    write(os.path.join(a.outdir, "GO-train-resume.xml"), b10)
    write(os.path.join(a.outdir, "GO-mistakes-run.xml"), mk)
    if a.scenes_at:  # 결정 장면 정밀 분석(낮 학교 시간 창) — 1회 트리거, 같은 러너를 1단계만·b10 비대기로
        sc = re.sub(r"<URI>[^<]*</URI>", r"<URI>\\MONK\\GO-scenes-run</URI>", mk)
        sc = re.sub(r"<Triggers>.*?</Triggers>", f"<Triggers>\n    <TimeTrigger>\n      <StartBoundary>{a.scenes_at}+09:00</StartBoundary>\n"
                    f"    </TimeTrigger>\n  </Triggers>", sc, flags=re.S)
        # 바탕 XML(GO-train-resume)이 11-05 23:28부터 '사용 안 함'이라 그 설정을 물려받지 않게 켠다
        sc = sc.replace("<Enabled>false</Enabled>", "<Enabled>true</Enabled>")
        st = a.scenes_at[11:16]
        sc = re.sub(r"<Arguments>[^<]*</Arguments>", lambda _: (f"<Arguments>\"{RUNNER}\" --root C:\\Users\\smuse73\\go_kibo\\scenes "
                    f"--queries scenes_queries.jsonl --stage1-only --no-b10-wait --window-start {st} --window-end {a.scenes_end}</Arguments>"), sc)
        write(os.path.join(a.outdir, "GO-scenes-run.xml"), sc)
        print("== GO-scenes-run\n" + re.search(r"<Triggers>.*?</Triggers>", sc, re.S).group(0) + "\nArguments: " + re.search(r"<Arguments>([^<]*)</Arguments>", sc).group(1))
    for name, t in (("GO-train-resume", b10), ("GO-mistakes-run", mk)):
        trig = re.search(r"<Triggers>.*?</Triggers>", t, re.S).group(0)
        args = re.search(r"<Arguments>([^<]*)</Arguments>", t).group(1)
        print(f"== {name}\n{trig}\nArguments: {args}\nStartWhenAvailable: {'true' if '<StartWhenAvailable>true' in t else 'false'}")


if __name__ == "__main__":
    main()
