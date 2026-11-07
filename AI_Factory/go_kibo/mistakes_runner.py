#!/usr/bin/env python3
"""실수 사전 본 실행 러너 — 4060 작업 스케줄러(\\MONK\\GO-mistakes-run)가 기동. 표준 라이브러리만.

흐름
  1. 창 판정: 23:00 ≤ 지금 < 07:30 이 아니면 바로 끝낸다(하교~23시 GPU 금지, 등교 전 반납).
  2. 단일 실행: lock 파일을 잡지 못하면 끝낸다(중복 기동 방지).
  3. b10 대기 — GPU 동시 사용 금지:
       · b10이 목표(95M−2M) 도달이면 기다리지 않는다.
       · 아니면 '오늘 밤 창 안에서 시작된' b10 실행이 끝난 상태(running·final_eval 아님)가 될 때까지 기다린다.
         (낮의 14:50 'done'을 오늘 밤 완료로 오인하지 않으려고 status.json의 start를 창 시작과 대조)
       · 창 시작 +15분이 지나도 오늘 밤 b10 실행 흔적이 없으면 GO-train-resume을 1회 즉시 실행(놓친 예약 보정).
  4. 1단계: 남은 대국을 visits 64로 평가. 대국 단위 체크포인트 out1/{id}.jsonl(.tmp→rename).
  5. 2단계: 1단계 손해 3집+ 착수의 직전·직후 국면만 visits 400으로 재평가 → out2/{id}.jsonl.
  6. 07:30이 되면 엔진을 끊고 끝낸다. 미완 대국은 다음 밤에 이어서(완료 파일이 체크포인트).
상태: runner_status.json · 로그: runner.log (실패 가시화: state=failed + 사유, exit 1)

소유권 모드(--ownership, 11-07 ORDER_20261107 막내3): 같은 질의·같은 국면 순서에 includeOwnership=true, visits --own-visits(64).
  1단계만 돈다. 국면당 {turnNumber, scoreLead, winrate, visits, own: 361 int(×100, 흑 기준 +100=흑 땅, 행 우선 y→x)}로 줄여 기록.
  예: python mistakes_runner.py --root C:/Users/smuse73/go_kibo/own --ownership --no-b10-wait --window-start 23:05 --window-end 07:30
"""
import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import threading
import time

NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
BIG = 3.0


def compact_own(d):
    """KataGo 응답 → 소유권 수집 행. ownership 없으면 실패(무음 강등 금지)."""
    own = d.get("ownership")
    if not own or len(own) != 361:
        raise RuntimeError(f"ownership 없음/길이 {len(own) if own else 0} — id {d.get('id')} turn {d.get('turnNumber')}")
    ri = d.get("rootInfo", {})
    return {"id": d["id"], "turnNumber": d["turnNumber"], "scoreLead": round(ri.get("scoreLead", 0.0), 2),
            "winrate": round(ri.get("winrate", 0.0), 4), "visits": ri.get("visits"), "own": [round(x * 100) for x in own]}


class Runner:
    def __init__(self, a):
        self.a = a
        self.root = a.root
        self.out1 = os.path.join(self.root, "out1")
        self.out2 = os.path.join(self.root, "out2")
        os.makedirs(self.out1, exist_ok=True)
        os.makedirs(self.out2, exist_ok=True)
        self.status_path = os.path.join(self.root, "runner_status.json")
        self.log_path = os.path.join(self.root, "runner.log")
        self.st = {}

    # ---------- 시각 ----------
    def now(self):
        if self.a.fake_now:
            off = time.time() - self.t_start
            return dt.datetime.strptime(self.a.fake_now.replace("_", " "), "%Y-%m-%d %H:%M") + dt.timedelta(seconds=off * self.a.time_scale)
        return dt.datetime.now()

    def window(self):
        n = self.now()
        sh, sm = map(int, self.a.window_start.split(":"))
        eh, em = map(int, self.a.window_end.split(":"))
        start = n.replace(hour=sh, minute=sm, second=0, microsecond=0)
        if (eh, em) > (sh, sm):  # 같은 날 창(예: 학교 시간 08:30~15:30)
            end = start.replace(hour=eh, minute=em)
            return start, end, start <= n < end
        if n < start:  # 밤 창(예: 23:00~07:30)
            start -= dt.timedelta(days=1)
        end = (start + dt.timedelta(days=1)).replace(hour=eh, minute=em)
        return start, end, start <= n < end

    # ---------- 기록 ----------
    def log(self, msg):
        line = f"{self.now():%Y-%m-%d %H:%M:%S} {msg}"
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
        if sys.stdout:  # pythonw.exe(작업 스케줄러)에는 콘솔이 없다
            try:
                print(line, flush=True)
            except UnicodeEncodeError:  # Windows 콘솔 cp949
                print(line.encode(sys.stdout.encoding or "ascii", "replace").decode(sys.stdout.encoding or "ascii"), flush=True)

    def status(self, state, **kw):
        self.st.update(kw)
        self.st.update(state=state, updated=f"{self.now():%Y-%m-%d %H:%M:%S}", pid=os.getpid())
        tmp = self.status_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.st, f, ensure_ascii=False, indent=1)
        os.replace(tmp, self.status_path)

    # ---------- 단일 실행 잠금 ----------
    def lock(self):
        self.lock_f = open(os.path.join(self.root, "runner.lock"), "a+")
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(self.lock_f.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.lock_f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            return True
        except OSError:
            return False

    # ---------- b10 ----------
    def b10(self):
        """b10 status.json + 같은 폴더 stdout.txt 실측 보정.
        status의 nsamp·state는 train_run.last_nsamp가 검증 줄(nsamp = 검증 샘플 수)을 잡으면 틀린다
        (11-06 02:51 실제 'Hit max training samples, exit 0'인데 failed_early·437,504로 기록). 학습 줄 nsamp와 종료 문구로 다시 판정한다."""
        try:
            s = json.load(open(self.a.b10_status, encoding="utf-8"))
        except (OSError, ValueError):
            return None
        log = os.path.join(os.path.dirname(self.a.b10_status), "stdout.txt")
        try:
            with open(log, encoding="utf-8", errors="replace") as f:
                tail = f.read()[-300000:]
        except OSError:
            return s
        m = re.findall(r"nsamp = ([0-9.]+), pslr_batch", tail)
        if m:
            s["nsamp_status"], s["nsamp"] = s.get("nsamp"), int(float(m[-1]))
        if s.get("state") not in ("running", "final_eval") and "Hit max training samples" in tail[-20000:]:
            s["state_status"], s["state"] = s.get("state"), "done_target"
        return s

    def wait_b10(self, wstart, wend):
        kicked = False
        while True:
            s = self.b10()
            if s is None:
                self.log("b10 status.json 없음 — b10 없는 것으로 보고 진행")
                return True
            n, target = s.get("nsamp") or 0, s.get("max_samples") or self.a.b10_target
            state = s.get("state")
            started = s.get("start")
            started_dt = dt.datetime.strptime(started, "%Y-%m-%d %H:%M:%S") if started else None
            if state not in ("running", "final_eval") and n >= target - 2_000_000:
                self.log(f"b10 목표 도달(nsamp {n:,} / {target:,}, state {state}) — 대기 없음")
                return True
            # 창 시작 1시간 전부터 시작한 실행도 '오늘 밤'으로 본다(11-05 22:48 작가님 지시로 b10 조기 시작 사례)
            tonight = started_dt is not None and started_dt >= wstart - dt.timedelta(hours=self.a.early_grace_h)
            if tonight and state not in ("running", "final_eval"):
                self.log(f"b10 오늘 밤 실행 종료 확인 — state {state}, nsamp {n:,}, start {started}")
                self.status("b10_finished", b10_state=state, b10_nsamp=n)
                return True
            # 상태값은 보지 않는다 — 낮에 끊긴 실행이 'final_eval' 등으로 남아 있을 수 있다(11-05 17:22 평가 중단 사례).
            # 같은 작업의 중복 기동은 작업 설정 IgnoreNew가 막는다.
            if not tonight and not kicked and self.now() >= wstart + dt.timedelta(minutes=15):
                self.log(f"오늘 밤 b10 실행 흔적 없음(state {state}, start {started}) — 놓친 예약 보정: {self.a.b10_task} 1회 실행")
                if not self.a.dry_run:
                    r = subprocess.run(["schtasks", "/run", "/tn", self.a.b10_task], capture_output=True, text=True, creationflags=NO_WINDOW)
                    self.log(f"schtasks /run rc={r.returncode} {r.stdout.strip()} {r.stderr.strip()}")
                kicked = True
            if self.now() >= wend:
                self.log("창 종료까지 b10이 끝나지 않음 — 오늘 밤 실수 사전 미실행")
                self.status("window_closed_waiting_b10", b10_state=state, b10_nsamp=n)
                return False
            self.status("waiting_b10", b10_state=state, b10_nsamp=n, b10_start=started)
            time.sleep(self.a.poll)

    # ---------- 엔진 ----------
    def run_engine(self, queries, expect, outdir, wend, stage):
        """queries: [dict], expect: {id: n_turns}. 대국 단위로 out 파일 기록. 창 종료 시 중단."""
        if not queries:
            return True
        cmd = self.a.katago_cmd if self.a.katago_cmd else [self.a.katago, "analysis", "-config", self.a.config, "-model", self.a.model]
        err = open(os.path.join(self.root, f"engine_stderr_stage{stage}.txt"), "a", encoding="utf-8", errors="replace")
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=err, text=True, encoding="utf-8",
                             bufsize=1, cwd=self.root, creationflags=NO_WINDOW)
        buf, done = {}, {"games": 0, "positions": 0, "errors": 0}
        lock = threading.Lock()
        t0 = time.time()

        def reader():
            for line in p.stdout:
                line = line.strip()
                if not line.startswith("{"):
                    continue
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                gid = d.get("id")
                if gid not in expect:
                    continue
                if "error" in d:
                    self.write(outdir, gid, [d], error=True)
                    with lock:
                        done["errors"] += 1
                        done["games"] += 1
                        buf.pop(gid, None)
                    continue
                if "warning" in d or d.get("isDuringSearch"):
                    continue
                if self.a.ownership:
                    try:
                        d = compact_own(d)
                    except RuntimeError as ex:  # 리더 스레드 사망 → 엔진 정지 방지: 대국을 오류로 기록
                        self.log(f"❌ {ex}")
                        self.write(outdir, gid, [{"id": gid, "error": str(ex)}], error=True)
                        with lock:
                            done["errors"] += 1
                            done["games"] += 1
                            buf.pop(gid, None)
                        expect.pop(gid, None)
                        continue
                with lock:
                    buf.setdefault(gid, []).append(d)
                    done["positions"] += 1
                    if len(buf[gid]) >= expect[gid]:
                        self.write(outdir, gid, sorted(buf.pop(gid), key=lambda x: x["turnNumber"]))
                        done["games"] += 1

        th = threading.Thread(target=reader, daemon=True)
        th.start()
        for q in queries:
            p.stdin.write(json.dumps(q) + "\n")
        p.stdin.flush()
        p.stdin.close()  # 질의를 다 넣고 닫으면 엔진은 처리 후 종료
        last = 0
        aborted = False
        while p.poll() is None:
            time.sleep(5)
            if self.now() >= wend:
                self.log(f"stage{stage}: 창 종료 — 엔진 중단(완료 대국은 보존, 미완은 다음 밤)")
                p.terminate()
                try:
                    p.wait(60)
                except subprocess.TimeoutExpired:
                    p.kill()
                aborted = True
                break
            if time.time() - last >= self.a.report_every:
                last = time.time()
                el = time.time() - t0
                with lock:
                    g, pos, e = done["games"], done["positions"], done["errors"]
                rate = pos / el if el else 0
                self.status(f"stage{stage}", **{f"stage{stage}_games_done_this_run": g, f"stage{stage}_games_total_this_run": len(queries),
                                                f"stage{stage}_positions_per_s": round(rate, 2), f"stage{stage}_errors": e,
                                                f"stage{stage}_elapsed_s": round(el)})
        th.join(timeout=30)
        el = time.time() - t0
        with lock:
            g, pos, e = done["games"], done["positions"], done["errors"]
        self.log(f"stage{stage}: 이번 실행 {g}/{len(queries)}국 · {pos:,}국면 · {el:.0f}초 · {pos / el if el else 0:.2f}국면/초 · 오류 {e} · rc {p.returncode}")
        self.status(f"stage{stage}_end", **{f"stage{stage}_games_done_this_run": g, f"stage{stage}_positions_per_s": round(pos / el, 2) if el else 0,
                                            f"stage{stage}_elapsed_s": round(el), f"stage{stage}_errors": e})
        if not aborted and p.returncode not in (0, None) and g < len(queries):
            raise RuntimeError(f"stage{stage} 엔진 비정상 종료 rc={p.returncode} (완료 {g}/{len(queries)})")
        return not aborted

    def write(self, outdir, gid, rows, error=False):
        path = os.path.join(outdir, f"{gid}.jsonl" if not error else f"{gid}.error.jsonl")
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")
        os.replace(tmp, path)

    def is_done(self, outdir, gid):
        return os.path.exists(os.path.join(outdir, f"{gid}.jsonl")) or os.path.exists(os.path.join(outdir, f"{gid}.error.jsonl"))

    # ---------- 2단계 후보 ----------
    def candidates(self, gid, color, moves):
        rows = [json.loads(x) for x in open(os.path.join(self.out1, f"{gid}.jsonl"), encoding="utf-8")]
        lead = {r["turnNumber"]: r["rootInfo"]["scoreLead"] * (1 if color == "B" else -1) for r in rows}
        turns = set()
        for t, (c, _) in enumerate(moves):
            if c == color and t in lead and t + 1 in lead and lead[t] - lead[t + 1] >= BIG:
                turns.update((t, t + 1))
        return sorted(turns)

    # ---------- 본체 ----------
    def main(self):
        self.t_start = time.time()
        wstart, wend, inwin = self.window()
        if not inwin:
            self.log(f"창 밖({self.a.window_start}~{self.a.window_end}) — 시작하지 않음")
            self.status("outside_window")
            return 0
        if not self.lock():
            self.log("다른 러너가 실행 중 — 종료")
            return 0
        self.status("started", window=[f"{wstart:%Y-%m-%d %H:%M}", f"{wend:%Y-%m-%d %H:%M}"])
        self.log(f"러너 시작 — 창 {wstart:%m-%d %H:%M} ~ {wend:%m-%d %H:%M}")
        Q = [json.loads(x) for x in open(os.path.join(self.root, self.a.queries), encoding="utf-8")]
        if self.a.ownership:
            self.a.stage1_only = True
            for q in Q:
                q["includeOwnership"] = True
                q["maxVisits"] = self.a.own_visits
            if self.a.limit:
                Q = Q[:self.a.limit]
        if all(self.is_done(self.out1, q["id"]) and (self.a.stage1_only or self.is_done(self.out2, q["id"]) or
               os.path.exists(os.path.join(self.out1, f"{q['id']}.error.jsonl"))) for q in Q):
            self.log("이미 전체 완료 — GPU 미사용 종료")
            self.status("all_done")
            return 0
        if self.a.no_b10_wait:  # 낮 창 — b10을 기다리지 않되, 돌고 있으면 GPU 동시 사용 금지로 바로 끝낸다
            s0 = self.b10() or {}
            if s0.get("state") in ("running", "final_eval"):
                self.log(f"b10 {s0.get('state')} — GPU 동시 사용 금지, 시작하지 않음")
                self.status("b10_running_skip")
                return 0
        elif not self.wait_b10(wstart, wend):
            return 0
        pend1 = [q for q in Q if not self.is_done(self.out1, q["id"])]
        self.log(f"stage1: 전체 {len(Q)}국 · 완료 {len(Q) - len(pend1)} · 남음 {len(pend1)}")
        self.status("stage1", stage1_total=len(Q), stage1_done_before=len(Q) - len(pend1))
        if not self.run_engine(pend1, {q["id"]: len(q["analyzeTurns"]) for q in pend1}, self.out1, wend, 1):
            self.status("paused_window_end", stage1_done=sum(self.is_done(self.out1, q["id"]) for q in Q))
            return 0
        left1 = [q["id"] for q in Q if not self.is_done(self.out1, q["id"])]
        if left1:
            raise RuntimeError(f"stage1 미완 {len(left1)}국인데 엔진 종료 — 예: {left1[:3]}")
        if self.a.stage1_only:
            self.status("all_done")
            self.log("전체 완료(1단계만)")
            return 0
        meta = {m["id"]: m for m in (json.loads(x) for x in open(os.path.join(self.root, "meta_full.jsonl"), encoding="utf-8"))}
        Q2, exp2 = [], {}
        for q in Q:
            gid = q["id"]
            if self.is_done(self.out2, gid) or os.path.exists(os.path.join(self.out1, f"{gid}.error.jsonl")):
                continue
            turns = self.candidates(gid, meta[gid]["my_color"], q["moves"])
            if not turns:
                self.write(self.out2, gid, [])
                continue
            Q2.append(dict(q, analyzeTurns=turns, maxVisits=self.a.visits2))
            exp2[gid] = len(turns)
        self.log(f"stage2: 재평가 대상 {len(Q2)}국 · 국면 {sum(exp2.values()):,} · visits {self.a.visits2}")
        self.status("stage2", stage2_games=len(Q2), stage2_positions=sum(exp2.values()))
        if not self.run_engine(Q2, exp2, self.out2, wend, 2):
            self.status("paused_window_end")
            return 0
        self.status("all_done")
        self.log("전체 완료")
        return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=r"C:\Users\smuse73\go_kibo\full")
    ap.add_argument("--katago", default=r"C:\Users\smuse73\go_train\engine\katago.exe")
    ap.add_argument("--config", default=r"C:\Users\smuse73\go_kibo\katago_analysis.cfg")
    ap.add_argument("--model", default=r"C:\Users\smuse73\go_train\nets\b18.bin.gz")
    ap.add_argument("--katago-cmd", nargs="+", default=None, help="시험용 엔진 명령 대체")
    ap.add_argument("--b10-status", default=r"C:\Users\smuse73\go_train\run\b10\status.json")
    ap.add_argument("--b10-task", default=r"\MONK\GO-train-resume")
    ap.add_argument("--b10-target", type=int, default=95_000_000)
    ap.add_argument("--early-grace-h", type=float, default=1.0, help="창 시작 전 이 시간 안에 시작한 b10도 오늘 밤 실행으로 본다")
    ap.add_argument("--window-start", default="23:00")
    ap.add_argument("--window-end", default="07:30")
    ap.add_argument("--visits2", type=int, default=400)
    ap.add_argument("--poll", type=int, default=60)
    ap.add_argument("--report-every", type=int, default=300)
    ap.add_argument("--fake-now", default=None, help="시험용 'YYYY-MM-DD HH:MM'")
    ap.add_argument("--time-scale", type=float, default=1.0, help="시험용 시계 배속")
    ap.add_argument("--dry-run", action="store_true", help="schtasks 실행 생략")
    ap.add_argument("--queries", default="queries_full.jsonl", help="root 안 질의 파일")
    ap.add_argument("--stage1-only", action="store_true", help="2단계(재평가) 없이 질의만 처리 — 결정 장면 정밀 분석 등")
    ap.add_argument("--ownership", action="store_true", help="소유권 수집 모드 — includeOwnership, 1단계만, 압축 기록")
    ap.add_argument("--own-visits", type=int, default=64)
    ap.add_argument("--limit", type=int, default=0, help="소유권 모드 스모크용: 앞 N국만")
    ap.add_argument("--no-b10-wait", action="store_true", help="b10을 기다리지 않음(낮 창). b10이 돌고 있으면 시작하지 않음")
    a = ap.parse_args()
    r = Runner(a)
    try:
        sys.exit(r.main())
    except Exception as e:  # 실패 가시화
        r.log(f"❌ mistakes_runner: {type(e).__name__}: {e}")
        r.status("failed", error=f"{type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
