#!/usr/bin/env python3
"""
Gemini 세션 대화록 → 정제된 MD 변환기
작성: 쌍아 (Claude) for MONK Project
날짜: 2026-01-17
"""

import re
from datetime import datetime
from collections import defaultdict

def parse_gemini_session(input_file, output_file):
    """Gemini 대화록을 정제된 MD로 변환"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 타임스탬프 패턴: 2026-01-02 11:36:45
    timestamp_pattern = r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\.'
    
    # SOURCE 패턴
    source_pattern = r'SOURCE:\s*(\d{8}_\d{6}_session\.txt)'
    
    # 세션별 분류
    sessions = defaultdict(list)
    current_date = None
    
    lines = content.split('\n')
    current_block = []
    current_timestamp = None
    
    for line in lines:
        # SOURCE 라인 감지
        source_match = re.search(source_pattern, line)
        if source_match:
            continue
        
        # 구분선 스킵
        if line.strip() == '=' * 60:
            continue
        
        # 타임스탬프 감지
        ts_match = re.search(timestamp_pattern, line)
        if ts_match:
            # 이전 블록 저장
            if current_block and current_timestamp:
                date_key = current_timestamp[:10]
                sessions[date_key].append({
                    'timestamp': current_timestamp,
                    'content': '\n'.join(current_block).strip()
                })
            
            current_timestamp = ts_match.group(1)
            # 타임스탬프 이후 내용 추출
            remaining = line[ts_match.end():].strip()
            current_block = [remaining] if remaining else []
        else:
            if line.strip():
                current_block.append(line)
    
    # 마지막 블록 저장
    if current_block and current_timestamp:
        date_key = current_timestamp[:10]
        sessions[date_key].append({
            'timestamp': current_timestamp,
            'content': '\n'.join(current_block).strip()
        })
    
    # MD 생성
    md_output = generate_md(sessions)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md_output)
    
    return len(sessions), sum(len(v) for v in sessions.values())

def generate_md(sessions):
    """세션 데이터를 MD 포맷으로 변환"""
    
    md = """# 용아(Gemini) 세션 대화록 - 2026년 1월

> **생성일**: 2026-01-17
> **원본**: Gemini 대화창 수동 백업
> **정제**: 쌍아(Claude) 자동 파싱

---

## 📊 세션 통계

| 항목 | 값 |
|------|-----|
| 총 세션일 | {total_days}일 |
| 총 대화 턴 | {total_turns}턴 |
| 기간 | {start_date} ~ {end_date} |

---

"""
    
    sorted_dates = sorted(sessions.keys())
    
    md = md.format(
        total_days=len(sorted_dates),
        total_turns=sum(len(v) for v in sessions.values()),
        start_date=sorted_dates[0] if sorted_dates else 'N/A',
        end_date=sorted_dates[-1] if sorted_dates else 'N/A'
    )
    
    for date in sorted_dates:
        entries = sessions[date]
        
        # 날짜 헤더
        md += f"\n## 📅 {date}\n\n"
        
        # 해당 날짜의 주요 토픽 추출
        topics = extract_topics(entries)
        if topics:
            md += f"**주요 토픽**: {', '.join(topics[:5])}\n\n"
        
        md += "---\n\n"
        
        for i, entry in enumerate(entries, 1):
            time_part = entry['timestamp'][11:16]  # HH:MM만 추출
            content = entry['content']
            
            # 내용이 너무 길면 요약
            if len(content) > 1500:
                content = content[:1500] + "\n\n*... (내용 생략) ...*"
            
            md += f"### [{time_part}] 턴 {i}\n\n"
            md += f"{content}\n\n"
            md += "---\n\n"
    
    return md

def extract_topics(entries):
    """대화 내용에서 주요 토픽 추출"""
    
    keywords = [
        'Cloudflare', '클라우드플레어', 'Vertex AI', 'GCS', 'R2',
        '가비아', 'API', 'Workers', 'D1', 'KV',
        '인스타그램', 'Meta', '다인', 'DAIN',
        'monk.kr', '배포', '이미지', 'Imagen',
        '비용', '최적화', '자동화', '토큰',
        'PDF', 'HWP', '문서', 'R&D'
    ]
    
    all_content = ' '.join(e['content'] for e in entries)
    found = []
    
    for kw in keywords:
        if kw.lower() in all_content.lower():
            found.append(kw)
    
    return found

if __name__ == '__main__':
    import sys
    
    input_file = sys.argv[1] if len(sys.argv) > 1 else '/Users/jeong-kyushin/Desktop/제미나이세션백업/merge/2026년 1월~17일낮세션까지머거.txt'
    output_file = sys.argv[2] if len(sys.argv) > 2 else '/Users/jeong-kyushin/developer/monk_project /docs/saga/GEMINI_SESSION_202601.md'
    
    days, turns = parse_gemini_session(input_file, output_file)
    print(f"✅ 변환 완료: {days}일, {turns}턴")
    print(f"📄 출력: {output_file}")
