#!/usr/bin/env python3
"""
MONK.KR R&D 보고서 PDF 생성기
학술 보고서 형식: 작은 폰트, 텍스트 위주, 깔끔한 레이아웃
fpdf2 + markdown 기반 (순수 Python, 시스템 의존성 없음)
"""

import re
import os
import tempfile
from fpdf import FPDF

# TTC에서 개별 TTF 추출
TTC_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_DIR = tempfile.mkdtemp()
FONT_REGULAR = os.path.join(FONT_DIR, "AppleSDGothicNeo-Regular.ttf")
FONT_BOLD = os.path.join(FONT_DIR, "AppleSDGothicNeo-SemiBold.ttf")


def _extract_fonts():
    """TTC에서 Regular/SemiBold TTF 추출"""
    if os.path.exists(FONT_REGULAR):
        return
    from fontTools.ttLib import TTCollection
    ttc = TTCollection(TTC_PATH)
    ttc.fonts[0].save(FONT_REGULAR)   # Regular (400)
    ttc.fonts[4].save(FONT_BOLD)      # SemiBold (600)


class AcademicPDF(FPDF):
    """학술 보고서 스타일 PDF"""

    def __init__(self):
        super().__init__('P', 'mm', 'A4')
        self.set_auto_page_break(True, margin=20)
        self.set_margins(20, 20, 20)

        # 한국어 폰트 등록 (TTC에서 추출한 TTF)
        _extract_fonts()
        self.add_font('KR', '', FONT_REGULAR)
        self.add_font('KR', 'B', FONT_BOLD)

        self.section_num = 0
        self.subsection_num = 0

    def header(self):
        if self.page_no() > 1:
            self.set_font('KR', '', 6)
            self.set_text_color(150, 150, 150)
            self.cell(
                0, 5,
                'MONK.KR 연구개발 전담부서 — 연구개발 활동 보고서',
                align='C'
            )
            self.ln(2)
            self.set_draw_color(200, 200, 200)
            self.line(20, 12, 190, 12)
            self.ln(3)

    def footer(self):
        self.set_y(-15)
        self.set_font('KR', '', 6)
        self.set_text_color(150, 150, 150)
        self.cell(0, 5, f'— {self.page_no()} —', align='C')


class MarkdownToPDFRenderer:
    """Markdown을 파싱해서 AcademicPDF에 렌더링"""

    def __init__(self, pdf):
        self.pdf = pdf
        self.in_table = False
        self.table_headers = []
        self.table_rows = []
        self.in_code_block = False
        self.code_content = []
        self.in_blockquote = False
        self.list_depth = 0

    def render_markdown(self, md_text):
        """Markdown 텍스트를 PDF로 변환"""
        lines = md_text.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i]

            # page-break
            if '<div style="page-break-after: always;"></div>' in line:
                self.pdf.add_page()
                i += 1
                continue

            # 코드 블록
            if line.strip().startswith('```'):
                if self.in_code_block:
                    self._render_code_block()
                    self.in_code_block = False
                else:
                    self.in_code_block = True
                    self.code_content = []
                i += 1
                continue

            if self.in_code_block:
                self.code_content.append(line)
                i += 1
                continue

            # 테이블
            if '|' in line and line.strip().startswith('|'):
                if not self.in_table:
                    self.in_table = True
                    self.table_headers = []
                    self.table_rows = []
                    cells = [c.strip() for c in line.strip().strip('|').split('|')]
                    self.table_headers = cells
                    i += 1
                    # 구분선 스킵
                    if i < len(lines) and re.match(r'^[\s|:-]+$', lines[i]):
                        i += 1
                    continue
                else:
                    if re.match(r'^[\s|:-]+$', line.strip()):
                        i += 1
                        continue
                    cells = [c.strip() for c in line.strip().strip('|').split('|')]
                    self.table_rows.append(cells)
                    i += 1
                    continue

            # 테이블 종료
            if self.in_table and (not line.strip() or not line.strip().startswith('|')):
                self._render_table()
                self.in_table = False
                if not line.strip():
                    i += 1
                    continue

            # 빈 줄
            if not line.strip():
                i += 1
                continue

            # 헤더
            if line.startswith('#'):
                self._render_header(line)
                i += 1
                continue

            # 수평선
            if re.match(r'^---+$', line.strip()):
                self.pdf.set_draw_color(200, 200, 200)
                y = self.pdf.get_y()
                self.pdf.line(20, y, 190, y)
                self.pdf.ln(3)
                i += 1
                continue

            # 블록인용
            if line.startswith('>'):
                text = line.lstrip('>').strip()
                self._render_blockquote(text)
                i += 1
                continue

            # 리스트
            if re.match(r'^(\s*)([-*]|\d+\.)\s', line):
                self._render_list_item(line)
                i += 1
                continue

            # 체크박스 리스트
            if re.match(r'^-\s\[([ x])\]', line):
                self._render_list_item(line)
                i += 1
                continue

            # 일반 텍스트
            self._render_paragraph(line)
            i += 1

        # 마지막 테이블 플러시
        if self.in_table:
            self._render_table()

    def _clean_md(self, text):
        """마크다운 인라인 문법 제거"""
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'`(.+?)`', r'\1', text)
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
        text = re.sub(r'<[^>]+>', '', text)
        return text

    def _render_header(self, line):
        """h1~h4 렌더링"""
        match = re.match(r'^(#{1,4})\s+(.*)', line)
        if not match:
            return

        level = len(match.group(1))
        text = self._clean_md(match.group(2))
        self.pdf.set_x(self.pdf.l_margin)

        if level == 1:
            self.pdf.ln(10)
            self.pdf.set_font('KR', 'B', 16)
            self.pdf.set_text_color(17, 17, 17)
            self.pdf.cell(0, 12, text, align='C', new_x='LMARGIN', new_y='NEXT')
            self.pdf.ln(5)
        elif level == 2:
            self.pdf.ln(6)
            self.pdf.set_font('KR', 'B', 11)
            self.pdf.set_text_color(34, 34, 34)
            self.pdf.cell(0, 8, text, new_x='LMARGIN', new_y='NEXT')
            y = self.pdf.get_y()
            self.pdf.set_draw_color(60, 60, 60)
            self.pdf.set_line_width(0.4)
            self.pdf.line(20, y, 190, y)
            self.pdf.ln(3)
        elif level == 3:
            self.pdf.ln(3)
            self.pdf.set_font('KR', 'B', 9)
            self.pdf.set_text_color(51, 51, 51)
            self.pdf.cell(0, 6, text, new_x='LMARGIN', new_y='NEXT')
            self.pdf.ln(1)
        elif level == 4:
            self.pdf.ln(2)
            self.pdf.set_font('KR', 'B', 8)
            self.pdf.set_text_color(68, 68, 68)
            self.pdf.cell(0, 5, text, new_x='LMARGIN', new_y='NEXT')
            self.pdf.ln(1)

    def _render_paragraph(self, text):
        """본문 텍스트"""
        text = self._clean_md(text)
        self.pdf.set_font('KR', '', 7.5)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.set_x(self.pdf.l_margin)
        self.pdf.multi_cell(170, 4, text)
        self.pdf.ln(1)

    def _render_list_item(self, line):
        """리스트 항목"""
        match = re.match(r'^(\s*)([-*]|\d+\.)\s*(.*)', line)
        if not match:
            return

        indent = len(match.group(1))
        indent_mm = 3 + (indent // 2) * 3
        text = self._clean_md(match.group(3))
        bullet = '•' if match.group(2) in ['-', '*'] else match.group(2)

        # 체크박스
        checkbox = re.match(r'\[([ x])\]\s*(.*)', text)
        if checkbox:
            checked = checkbox.group(1) == 'x'
            text = ('☑ ' if checked else '☐ ') + checkbox.group(2)
            bullet = ''

        self.pdf.set_font('KR', '', 7.5)
        self.pdf.set_text_color(30, 30, 30)
        x = self.pdf.get_x()
        self.pdf.set_x(x + indent_mm)
        bullet_w = 4 if bullet else 0
        if bullet:
            self.pdf.cell(bullet_w, 4, bullet)
        remaining = 170 - indent_mm - bullet_w
        if remaining < 20:
            remaining = 20
        self.pdf.multi_cell(remaining, 4, text)

    def _render_blockquote(self, text):
        """블록인용"""
        text = self._clean_md(text)
        self.pdf.set_font('KR', '', 6.5)
        self.pdf.set_text_color(100, 100, 100)

        x = self.pdf.get_x()
        y = self.pdf.get_y()
        self.pdf.set_fill_color(248, 248, 248)
        self.pdf.set_x(x + 3)
        self.pdf.multi_cell(164, 3.5, text, fill=True)

        # 왼쪽 인용 바
        self.pdf.set_draw_color(150, 150, 150)
        self.pdf.set_line_width(0.6)
        self.pdf.line(x + 2, y, x + 2, self.pdf.get_y())
        self.pdf.ln(1)
        self.pdf.set_x(self.pdf.l_margin)

    def _render_code_block(self):
        """코드 블록 (ASCII 아트 포함)"""
        code = '\n'.join(self.code_content)
        self.pdf.set_font('KR', '', 5.5)
        self.pdf.set_text_color(50, 50, 50)
        self.pdf.set_fill_color(245, 245, 245)

        x = self.pdf.get_x()

        # 배경 박스를 그리기 위해 높이 계산
        lines = code.split('\n')
        for line in lines:
            self.pdf.set_x(x + 2)
            self.pdf.cell(166, 3, line, fill=True, new_x='LMARGIN', new_y='NEXT')

        self.pdf.ln(2)
        self.pdf.set_x(self.pdf.l_margin)
        self.code_content = []

    def _render_table(self):
        """테이블 렌더링"""
        if not self.table_headers:
            return

        num_cols = len(self.table_headers)
        if num_cols == 0:
            return

        # 컬럼 너비 계산
        avail_width = 170
        col_widths = self._calc_col_widths(num_cols, avail_width)

        self.pdf.set_font('KR', 'B', 6.5)

        # 헤더
        self.pdf.set_fill_color(235, 235, 235)
        self.pdf.set_draw_color(160, 160, 160)
        self.pdf.set_text_color(34, 34, 34)
        self.pdf.set_line_width(0.2)

        for j, header in enumerate(self.table_headers):
            w = col_widths[j] if j < len(col_widths) else col_widths[-1]
            self.pdf.cell(w, 5, self._clean_md(header)[:40], border=1, fill=True)
        self.pdf.ln()

        # 데이터 행
        self.pdf.set_font('KR', '', 6)
        self.pdf.set_text_color(50, 50, 50)

        for row_idx, row in enumerate(self.table_rows):
            if row_idx % 2 == 1:
                self.pdf.set_fill_color(248, 248, 248)
            else:
                self.pdf.set_fill_color(255, 255, 255)

            max_h = 5
            for j, cell in enumerate(row):
                w = col_widths[j] if j < len(col_widths) else col_widths[-1]
                text = self._clean_md(cell)
                # 텍스트 길이에 따라 잘라내기
                if self.pdf.get_string_width(text) > w - 2:
                    while self.pdf.get_string_width(text + '…') > w - 2 and len(text) > 0:
                        text = text[:-1]
                    text = text + '…'
                self.pdf.cell(w, max_h, text, border=1, fill=True)
            self.pdf.ln()

        self.pdf.ln(2)
        self.pdf.set_x(self.pdf.l_margin)
        self.table_headers = []
        self.table_rows = []

    def _calc_col_widths(self, num_cols, total_width):
        """컬럼 너비 자동 계산"""
        if num_cols <= 2:
            return [total_width / num_cols] * num_cols
        elif num_cols == 3:
            return [total_width * 0.2, total_width * 0.4, total_width * 0.4]
        elif num_cols == 4:
            return [total_width * 0.05, total_width * 0.30, total_width * 0.30, total_width * 0.35]
        else:
            return [total_width / num_cols] * num_cols


def generate_pdf(md_path, pdf_path):
    """Markdown → PDF 메인 함수"""
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    pdf = AcademicPDF()
    pdf.add_page()

    renderer = MarkdownToPDFRenderer(pdf)
    renderer.render_markdown(md_text)

    pdf.output(pdf_path)

    size = os.path.getsize(pdf_path)
    print(f"  [완료] {os.path.basename(pdf_path)} ({size / 1024:.0f} KB)")


if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))

    print("=" * 50)
    print("MONK.KR R&D 보고서 PDF 생성기")
    print("=" * 50)

    # 1. 50p 요약본 PDF
    summary_md = os.path.join(base_dir, 'KOITA_연구활동보고서_요약본_50p.md')
    summary_pdf = os.path.join(base_dir, 'KOITA_연구활동보고서_요약본.pdf')

    if os.path.exists(summary_md):
        print("\n[1/2] 요약본 PDF 생성 중...")
        generate_pdf(summary_md, summary_pdf)

    # 2. 증빙 원본 PDF
    evidence_md = os.path.join(base_dir, '20260212_RND_활동증빙_현장조사용.md')
    evidence_pdf = os.path.join(base_dir, 'KOITA_RND_활동증빙_상세본.pdf')

    if os.path.exists(evidence_md):
        print("\n[2/2] 증빙 상세본 PDF 생성 중...")
        generate_pdf(evidence_md, evidence_pdf)

    print("\n" + "=" * 50)
    print("[완료] 모든 PDF 생성 완료")
    print(f"  위치: {base_dir}/")
    print("=" * 50)
