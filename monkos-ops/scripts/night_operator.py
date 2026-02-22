"""
MONKOS Night Operator
야간/원격 자율 운영 스크립트

퇴근 전 실행:
    python scripts/monkos/night_operator.py

동작:
    1. Firestore 폴링 (5초 간격)
    2. 새 명령 감지 → claude -p "[명령]" 실행
    3. 결과 → 텔레그램 알림
"""

import subprocess
import requests
import time
import json
import os
import sys
from datetime import datetime

# Windows stdout 버퍼링 해제
sys.stdout.reconfigure(line_buffering=True)

# === 설정 ===
AI_NAME = "ssanga"
PROJECT_DIR = r"c:\Users\smuse73\developer\monk_project"
CLAUDE_PATH = r"C:\Users\smuse73\AppData\Roaming\npm\claude.cmd"  # 전체 경로
API_BASE = "https://us-central1-monkos-3c6e4.cloudfunctions.net"
POLL_INTERVAL = 5  # 초

# === API 함수 ===

def get_commands():
    """대기 중인 명령 조회"""
    try:
        r = requests.get(f"{API_BASE}/getCommands?aiName={AI_NAME}", timeout=10)
        return r.json().get("commands", [])
    except Exception as e:
        print(f"[에러] 명령 조회 실패: {e}")
        return []

def notify(msg_type, content):
    """텔레그램 알림"""
    try:
        requests.post(
            f"{API_BASE}/notifyWriter",
            json={"aiName": AI_NAME, "type": msg_type, "content": content},
            timeout=10
        )
        print(f"[알림] {msg_type}: {content[:50]}...")
    except Exception as e:
        print(f"[에러] 알림 실패: {e}")

def complete_command(command_id):
    """명령 완료 처리"""
    try:
        requests.post(
            f"{API_BASE}/completeCommand",
            json={"aiName": AI_NAME, "commandId": command_id},
            timeout=10
        )
    except Exception as e:
        print(f"[에러] 완료 처리 실패: {e}")

# === Claude 실행 ===

def load_context():
    """프로젝트 컨텍스트 로드 (.cursorrules)"""
    try:
        rules_path = os.path.join(PROJECT_DIR, ".cursorrules")
        if os.path.exists(rules_path):
            with open(rules_path, "r", encoding="utf-8") as f:
                return f.read()[:8000]  # 8KB 제한
    except Exception as e:
        print(f"[경고] 컨텍스트 로드 실패: {e}")
    return ""

def run_claude(command):
    """
    Claude CLI 비대화형 실행
    옵션 1: claude -c -p "[명령]" --print (마지막 세션 이어서)
    옵션 2: claude --system-prompt "[규칙]" -p "[명령]" --print
    """
    print(f"\n{'='*60}")
    print(f"[Claude] Running: {command[:60]}...")
    print(f"{'='*60}")

    try:
        # 방법 1: 마지막 세션 이어서 실행 (--continue)
        # 컨텍스트가 유지되어 프로젝트 상태를 알고 있음
        args = [CLAUDE_PATH, "-c", "-p", command, "--print"]

        # 만약 -c 실패시 system-prompt로 fallback
        context = load_context()
        if context:
            # 방법 2: system-prompt로 규칙 주입
            args_fallback = [
                CLAUDE_PATH,
                "--system-prompt", context[:4000],  # 시스템 프롬프트 제한
                "-p", command,
                "--print"
            ]

        print(f"[DEBUG] Args: {' '.join(args[:3])}...")

        result = subprocess.run(
            args,
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            shell=True,  # Windows에서 .cmd 파일 실행
            timeout=600,  # 10분 타임아웃
            encoding='utf-8',
            errors='replace'
        )

        output = result.stdout
        if result.returncode != 0:
            output = f"[에러] {result.stderr}\n{result.stdout}"

            # -c 실패시 fallback 시도
            if context and "no conversation" in result.stderr.lower():
                print("[INFO] Fallback to --system-prompt mode...")
                result = subprocess.run(
                    args_fallback,
                    cwd=PROJECT_DIR,
                    capture_output=True,
                    text=True,
                    shell=True,
                    timeout=600,
                    encoding='utf-8',
                    errors='replace'
                )
                output = result.stdout if result.returncode == 0 else f"[에러] {result.stderr}"

        print(output[:500])
        return output

    except subprocess.TimeoutExpired:
        return "[에러] 10분 타임아웃 초과"
    except Exception as e:
        return f"[에러] 실행 실패: {e}"

# === 명령 처리 ===

def process_command(cmd):
    """단일 명령 처리"""
    command_id = cmd.get("id")
    command_text = cmd.get("command", "")

    print(f"\n[CMD] Received: {command_text}")
    notify("info", f"Starting: {command_text[:40]}...")

    # Claude 실행
    result = run_claude(command_text)

    # 완료 처리
    complete_command(command_id)

    # 결과 알림 (너무 길면 자름)
    summary = result[:300] + "..." if len(result) > 300 else result
    notify("complete", f"Done: {command_text[:30]}...\n\n{summary}")

    print(f"\n[DONE]")
    return result

# === 메인 루프 ===

def main():
    print(f"""
+============================================================+
|  MONKOS Night Operator - {AI_NAME}                              |
|  Night/Remote Auto Operation Mode                          |
|  Polling every {POLL_INTERVAL} seconds...                                  |
|  Exit: Ctrl+C                                              |
+============================================================+
    """)

    notify("info", "Night Operator Started")

    while True:
        try:
            commands = get_commands()

            if commands:
                print(f"\n[QUEUE] {len(commands)} commands pending")
                for cmd in commands:
                    process_command(cmd)

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            print("\n\n[EXIT] Night Operator Stopped")
            notify("info", "Night Operator Stopped")
            break
        except Exception as e:
            print(f"[에러] {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
