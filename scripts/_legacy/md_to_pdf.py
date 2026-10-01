#!/usr/bin/env python3
"""
MD → PDF 변환 스크립트
한글 오피스에서 열어서 수정 후 최종 PDF로 제출
"""

import markdown
from weasyprint import HTML, CSS
import sys
import os

def convert_md_to_pdf(md_path, pdf_path=None):
    """마크다운 파일을 PDF로 변환"""
    
    if pdf_path is None:
        pdf_path = md_path.replace('.md', '.pdf')
    
    # MD 파일 읽기
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # MD → HTML 변환
    html_content = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'toc']
    )
    
    # HTML 템플릿 (한글 지원 스타일)
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                size: A4;
                margin: 2cm;
            }}
            body {{
                font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
                font-size: 10pt;
                line-height: 1.6;
                color: #333;
            }}
            h1 {{
                font-size: 18pt;
                border-bottom: 2px solid #333;
                padding-bottom: 5px;
                margin-top: 20px;
            }}
            h2 {{
                font-size: 14pt;
                border-bottom: 1px solid #666;
                padding-bottom: 3px;
                margin-top: 15px;
            }}
            h3 {{
                font-size: 12pt;
                margin-top: 12px;
            }}
            h4 {{
                font-size: 11pt;
                margin-top: 10px;
            }}
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 10px 0;
                font-size: 9pt;
            }}
            th, td {{
                border: 1px solid #333;
                padding: 6px 8px;
                text-align: left;
            }}
            th {{
                background-color: #f0f0f0;
                font-weight: bold;
            }}
            code {{
                background-color: #f5f5f5;
                padding: 2px 5px;
                border-radius: 3px;
                font-family: 'Consolas', monospace;
                font-size: 9pt;
            }}
            pre {{
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
                font-size: 8pt;
                line-height: 1.4;
            }}
            pre code {{
                background: none;
                padding: 0;
            }}
            blockquote {{
                border-left: 3px solid #666;
                padding-left: 15px;
                margin-left: 0;
                color: #555;
                font-style: italic;
            }}
            hr {{
                border: none;
                border-top: 1px solid #ccc;
                margin: 20px 0;
            }}
            ul, ol {{
                margin: 10px 0;
                padding-left: 25px;
            }}
            li {{
                margin: 5px 0;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # HTML → PDF 변환
    HTML(string=html_template).write_pdf(pdf_path)
    
    print(f"✅ PDF 생성 완료: {pdf_path}")
    return pdf_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python md_to_pdf.py <input.md> [output.pdf]")
        sys.exit(1)
    
    md_file = sys.argv[1]
    pdf_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(md_file):
        print(f"❌ 파일을 찾을 수 없습니다: {md_file}")
        sys.exit(1)
    
    convert_md_to_pdf(md_file, pdf_file)
