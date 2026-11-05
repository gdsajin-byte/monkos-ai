"""MONKOS Go 버전 공존(ORDER_20261105) — 엔진 풀: 지연 기동·상한 2·자리 양보·유휴 정리·레벨→버전.
실행: python3 -I tools/test_monk_versions.py (실제 KataGo를 띄우지 않는다 — 가짜 엔진)"""
import sys
import threading
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server as S  # noqa: E402


class FakeEngine:
    started = []

    def __init__(self, name, args):
        self.name, self.args = name, args
        self.job = threading.Lock()
        self.waiting = 0
        self.last_game = 0.0
        self.error = None
        self._ok = False

    def start(self):
        FakeEngine.started.append(self.name)
        self._ok = True

    @property
    def ok(self):
        return self._ok

    def stop(self):
        self._ok = False


class Pool(unittest.TestCase):
    def setUp(self):
        self._eng, self._why, self._by = S.Engine, S.MonkPool.why, S.MONK_BY_KEY
        S.Engine = FakeEngine
        S.MonkPool.why = staticmethod(lambda key: None if key in S.MONK_BY_KEY else "없음")
        S.MONK_BY_KEY = {k: {"key": k, "ver": v, "model": f"m_{v}.bin.gz"} for k, v in
                         (("monkos", "v1"), ("monkos-v2", "v2"), ("monkos-v3", "v3"))}
        FakeEngine.started = []

    def tearDown(self):
        S.Engine, S.MonkPool.why, S.MONK_BY_KEY = self._eng, self._why, self._by

    def test_lazy_and_reuse(self):
        p = S.MonkPool()
        self.assertEqual(p.running(), [])          # 기동 시 아무것도 안 띄운다
        e1 = p.get("monkos")
        self.assertIs(p.get("monkos"), e1)          # 두 번째는 같은 엔진
        self.assertEqual(len(FakeEngine.started), 1)
        self.assertIn("monkos", p.start_ms)

    def test_max_two_evicts_lru_idle(self):
        p = S.MonkPool()
        p.get("monkos")
        time.sleep(0.01)
        p.get("monkos-v2")
        p.get("monkos-v3")                          # 상한 2 — 가장 오래 안 쓴 v1이 내려간다
        self.assertEqual(p.running(), ["monkos-v2", "monkos-v3"])

    def test_all_busy_refuses(self):
        p = S.MonkPool()
        a, b = p.get("monkos"), p.get("monkos-v2")
        a.job.acquire(); b.waiting = 1              # 둘 다 계산·줄 서기 중
        with self.assertRaises(RuntimeError):
            p.get("monkos-v3")
        a.job.release()
        self.assertEqual(sorted(p.running()), ["monkos", "monkos-v2"])

    def test_reap_idle(self):
        p = S.MonkPool()
        p.get("monkos")
        p.reap(now=time.time() + S.MONK_IDLE + 1)
        self.assertEqual(p.running(), [])
        p.get("monkos")                              # 다시 쓰면 다시 뜬다
        self.assertEqual(len(FakeEngine.started), 2)

    def test_reap_keeps_busy(self):
        p = S.MonkPool()
        e = p.get("monkos")
        e.job.acquire()
        p.reap(now=time.time() + S.MONK_IDLE + 1)
        self.assertEqual(p.running(), ["monkos"])
        e.job.release()


class Levels(unittest.TestCase):
    def test_level_map(self):
        self.assertEqual(S.monk_ver("monk")["key"], "monkos")     # 옛 판 = v1 모델
        self.assertEqual(S.monk_ver("monkos")["ver"], "v1")
        self.assertIsNone(S.monk_ver("strong"))
        self.assertTrue(S.level_ok("monkos") and S.level_ok("monk"))
        self.assertFalse(S.level_ok("monkos-v99"))
        self.assertEqual(S.bot_sgf("monkos"), "MONKOS-Go-b10-s41M(1500v)")  # v1 태그 유지
        for v in S.MONKOS_VERSIONS:
            self.assertTrue(v["tag"].startswith("MONKOS-Go-"))  # 기보 가져오기 판정 접두


if __name__ == "__main__":
    unittest.main(verbosity=1)
