"""PF_AUTOPILOT — 범용 텔레그램 알림 발신."""

import os
import sys

import requests


def send(message):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    chat_id = os.environ["TELEGRAM_CHAT_ID"]
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    resp = requests.post(url, json={
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown",
    })
    resp.raise_for_status()
    print(f"[OK] 텔레그램 발신 완료 (chat_id: {chat_id[:4]}...)")


if __name__ == "__main__":
    send(sys.argv[1] if len(sys.argv) > 1 else "AUTOPILOT 테스트 알림")
