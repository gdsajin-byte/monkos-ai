"""
파일 선택 다이얼로그로 이미지 선택하고 경로 출력
"""
import sys
import tkinter as tk
from tkinter import filedialog
from pathlib import Path

try:
    import pyperclip
except ImportError:
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "pyperclip", "-q"])
    import pyperclip

def main():
    # tkinter 루트 윈도우 숨기기
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)

    # 파일 선택 다이얼로그
    filepath = filedialog.askopenfilename(
        title="이미지 선택",
        filetypes=[
            ("이미지 파일", "*.png *.jpg *.jpeg *.gif *.bmp *.webp"),
            ("모든 파일", "*.*")
        ],
        initialdir=Path.home() / "Pictures"
    )

    root.destroy()

    if filepath:
        pyperclip.copy(filepath)
        print(f"선택됨: {filepath}")
        print("경로가 클립보드에 복사되었습니다.")
    else:
        print("파일이 선택되지 않았습니다.")

if __name__ == "__main__":
    main()
