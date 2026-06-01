#!/usr/bin/env python3
# ComfyUI UI 워크플로우(JSON) → API prompt 포맷 변환
import json, sys

WF = sys.argv[1] if len(sys.argv) > 1 else '/tmp/CatvtonLoRA-SAM2.json'
OI = '/tmp/comfy_oi2.json'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/tmp/catvton_api.json'

wf = json.load(open(WF))
oi = json.load(open(OI))

# links 배열: [link_id, from_node, from_slot, to_node, to_slot, type]
links = {l[0]: l for l in wf['links']}

# 프론트엔드가 seed 류 위젯 뒤에 자동 삽입하는 위젯 (object_info엔 없음)
SEED_WIDGETS = {'seed', 'noise_seed'}

api = {}
skipped = []
for node in wf['nodes']:
    nid = str(node['id'])
    ctype = node['type']
    if ctype not in oi:
        skipped.append((nid, ctype)); continue
    entry = {'class_type': ctype, 'inputs': {}}
    # 1) 연결 입력
    linked_names = set()
    for inp in node.get('inputs', []) or []:
        if inp.get('link') is not None and inp['link'] in links:
            l = links[inp['link']]
            entry['inputs'][inp['name']] = [str(l[1]), l[2]]
            linked_names.add(inp['name'])
    # 2) 위젯 입력 (연결 전용 타입 제외 — 위젯형만)
    WIDGET_TYPES = {'INT','FLOAT','STRING','BOOLEAN','COMBO'}
    def is_widget(spec):
        t = spec[0]
        if isinstance(t, list):   # enum combo
            return True
        return t in WIDGET_TYPES
    wv = node.get('widgets_values')
    if wv is not None:
        info = oi[ctype]['input']
        merged = {}
        merged.update(info.get('required') or {})
        merged.update(info.get('optional') or {})
        order = list((info.get('required') or {}).keys()) + list((info.get('optional') or {}).keys())
        # 위젯 순서는 위젯형 input 전체(연결 여부 무관) — widgets_values가 모든 위젯 슬롯을 포함
        widget_order = [n for n in order if is_widget(merged[n])]
        wi = 0
        for name in widget_order:
            if wi >= len(wv): break
            val = wv[wi]; wi += 1
            # 연결된 input은 위젯값으로 덮지 않음 (연결이 우선)
            if name not in linked_names:
                entry['inputs'][name] = val
            # seed 류 뒤 control_after_generate 값 스킵
            if name in SEED_WIDGETS and wi < len(wv) and isinstance(wv[wi], str) and wv[wi] in ('fixed','increment','decrement','randomize'):
                wi += 1
    api[nid] = entry

json.dump(api, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'converted {len(api)} nodes, skipped {len(skipped)}: {skipped}')
print('OUT:', OUT)
