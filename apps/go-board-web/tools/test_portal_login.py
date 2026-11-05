#!/usr/bin/env python3
"""바둑 포털 로그인 단위 테스트 (ORDER_20261105 GO 로그인) — 실행: python3 -I tools/test_portal_login.py

HOME을 임시 폴더로 바꿔 실사용 데이터(~/.monkos/go-board)를 건드리지 않는다. 포털 호출은 가짜 opener.
검증: 토큰 형식 거름 · 포털 응답 → 사용자 · 기존 계정 연결(uid·rank 보존) · 1포털=1계정 · 새 계정(티켓·닉·급수) · 티켓 1회용·만료 · 닉 제안.
"""
import io
import json
import os
import sys
import tempfile
import time
import unittest
import urllib.error
from pathlib import Path

TMP = tempfile.mkdtemp(prefix="go-portal-test-")
os.environ["HOME"] = TMP
os.environ["GO_BOARD_TEST"] = "1"
os.environ["GO_BOARD_PORT"] = "8799"
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server as S  # noqa: E402


class FakeResp(io.BytesIO):
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def opener_for(user=None, code=200):
    seen = {}

    def op(req, timeout=0):
        seen["url"], seen["cookie"], seen["data"] = req.full_url, req.headers.get("Cookie"), req.data
        if code != 200:
            raise urllib.error.HTTPError(req.full_url, code, "x", {}, io.BytesIO(b'{"error":"rate_limited"}'))
        return FakeResp(json.dumps({"user": user} if user is not None else {"success": True, "ttlMin": 15}).encode())
    op.seen = seen
    return op


TOK = "A" * 40


class PortalLogin(unittest.TestCase):
    def setUp(self):
        self.a = S.Auth()
        self.a.users = [{"uid": "u-old", "nick": "신작가", "rank": "6d", "created": "2026-11-04T10:00:00"}]
        self.a._save_users()

    def test_verify_filters_and_maps(self):
        self.assertIsNone(S.portal_verify("짧다"))
        self.assertIsNone(S.portal_verify("bad token with spaces " * 3))
        op = opener_for({"id": "g123", "provider": "google", "name": "Shin", "email": "x@y.com"})
        u = S.portal_verify(TOK, opener=op)
        self.assertEqual(u, {"id": "g123", "provider": "google", "name": "Shin", "emailMasked": "x***@y***.com"})  # 원 주소는 버리고 가린 표시만
        self.assertEqual(op.seen["cookie"], f"monkos_session={TOK}")
        self.assertTrue(op.seen["url"].endswith("/api/auth/verify-cookie"))
        self.assertIsNone(S.portal_verify(TOK, opener=opener_for({"id": "agent_mina"})))  # 에이전트 세션 불가
        self.assertIsNone(S.portal_verify(TOK, opener=opener_for({})))

    def test_link_existing_keeps_uid_rank(self):
        self.assertIsNone(self.a.link_portal("u-old", "g123", "google"))
        u = self.a.get("u-old")
        self.assertEqual((u["uid"], u["nick"], u["rank"], u["portal"], u["portal_provider"]), ("u-old", "신작가", "6d", "g123", "google"))
        saved = json.loads(S.USERS_FILE.read_text())["users"][0]
        self.assertEqual(saved["portal"], "g123")  # 파일에도
        self.assertIs(self.a.by_portal("g123"), u)
        self.assertIsNone(self.a.link_portal("u-old", "g123", "google"))  # 같은 연결 반복은 무해

    def test_one_portal_one_account(self):
        self.a.users.append({"uid": "u-b", "nick": "다른사람", "rank": "1k"})
        self.a.link_portal("u-old", "g123", "google")
        self.assertIn("다른 바둑 아이디", self.a.link_portal("u-b", "g123", "google"))
        self.assertIn("다른 포털 계정", self.a.link_portal("u-old", "k999", "kakao"))

    def test_signup_with_ticket(self):
        t = self.a.portal_ticket("k777", "kakao")
        u, err = self.a.signup_portal(t, "새바둑", "5k")
        self.assertIsNone(err)
        rec = self.a.get(u["uid"])
        self.assertEqual((rec["nick"], rec["rank"], rec["portal"], rec["portal_provider"]), ("새바둑", "5k", "k777", "kakao"))
        u2, err2 = self.a.signup_portal(t, "또다른", "5k")  # 1회용
        self.assertIsNone(u2)
        self.assertIn("시간이 지났", err2)

    def test_signup_rules(self):
        self.assertIn("이미 있는", self.a.signup_portal(self.a.portal_ticket("p1", "google"), "신작가", "5k")[1])
        self.assertIn("쓸 수 없는", self.a.signup_portal(self.a.portal_ticket("p2", "google"), "작가님", "5k")[1])
        self.assertIn("희망 급수", self.a.signup_portal(self.a.portal_ticket("p3", "google"), "새닉", "9d")[1])
        t = self.a.portal_ticket("p4", "google")
        self.a.tickets[t] = ("p4", "google", time.time() - 1)  # 만료
        self.assertIn("시간이 지났", self.a.signup_portal(t, "새닉", "5k")[1])
        self.a.link_portal("u-old", "p5", "google")
        self.assertIn("이미 연결된", self.a.signup_portal(self.a.portal_ticket("p5", "google"), "새닉2", "5k")[1])

    def test_nick_suggest(self):
        self.assertEqual(S.nick_suggest("Shin Jakga!"), "ShinJakga")
        self.assertEqual(S.nick_suggest("a"), "")
        self.assertEqual(S.nick_suggest("신작가 (MONK)"), "신작가MONK")

    def test_email_relay(self):
        op = opener_for()
        code, j = S.portal_email_start("me@example.com", "ko", opener=op)
        self.assertEqual(code, 200)
        body = json.loads(op.seen["data"])
        self.assertEqual(body["redirectApp"], "http://127.0.0.1:8799/")
        self.assertTrue(op.seen["url"].endswith("/api/auth/email/start"))
        self.assertEqual(S.portal_email_start("me@example.com", "ko", opener=opener_for(code=429))[0], 429)


class Revisit(unittest.TestCase):
    """11-05 08:30 — 재방문 카드용 표시 정보 · 이메일 버튼 탐침 · 인증서 묶음"""
    def test_mask_email(self):
        self.assertEqual(S.mask_email("shin.jakka@gmail.com"), "s***@g***.com")
        self.assertEqual(S.mask_email("a@b.co.kr"), "a***@b***.co.kr")
        self.assertEqual(S.mask_email(""), "")
        self.assertEqual(S.mask_email(None), "")
        self.assertEqual(S.mask_email("noat"), "")

    def _probe(self, code=None, exc=None):
        S._EMAIL_CAP.update(ok=None, at=0.0)
        def op(req, timeout=None):
            if exc:
                raise exc
            raise urllib.error.HTTPError(req.full_url, code, "x", {}, io.BytesIO(b"{}"))
        return S.portal_email_available(opener=op, now=1000.0)

    def test_email_probe(self):
        self.assertTrue(self._probe(400))    # invalid_email = 엔드포인트 있음
        self.assertFalse(self._probe(404))   # prod 배포 전
        self.assertFalse(self._probe(exc=urllib.error.URLError("ssl")))
        # 캐시: 실패는 60초, 성공은 600초
        self._probe(404)
        self.assertFalse(S.portal_email_available(opener=lambda *a, **k: 1 / 0, now=1030.0))

    def test_ssl_ctx_has_ca(self):
        self.assertGreater(S._SSL_CTX.cert_store_stats().get("x509_ca", 0), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
