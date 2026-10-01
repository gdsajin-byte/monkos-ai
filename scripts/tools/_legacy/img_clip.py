"""
클립보드 이미지를 파일로 저장하고 경로 출력
사용: Win+Shift+S로 스크린샷 → img 명령어 실행
"""
import sys
from datetime import datetime
from pathlib import Path

try:
    from PIL import ImageGrab
    import pyperclip
except ImportError:
    print("필요한 패키지 설치 중...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "Pillow", "pyperclip", "-q"])
    from PIL import ImageGrab
    import pyperclip

def main():
    # 클립보드에서 이미지 가져오기
    img = ImageGrab.grabclipboard()

    if img is None:
        print("클립보드에 이미지가 없습니다.")
        print("Win + Shift + S로 스크린샷을 찍어주세요.")
        return

    # 저장 경로 설정
    save_dir = Path.home() / "monk_project" / "screenshots"
    save_dir.mkdir(parents=True, exist_ok=True)

    # 파일명: 날짜_시간.png
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = save_dir / f"screenshot_{timestamp}.png"

    # 저장
    img.save(filepath)

    # 경로를 클립보드에 복사
    path_str = str(filepath)
    pyperclip.copy(path_str)

    print(f"저장됨: {filepath}")
    print("경로가 클립보드에 복사되었습니다. Ctrl+V로 붙여넣기 하세요.")

if __name__ == "__main__":
    main()
