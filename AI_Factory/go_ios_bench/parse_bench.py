import glob, os, re, statistics, sys
B = os.path.expanduser('~/.monkos/go-board/analysis/iphone_v0/')
for tag in sys.argv[1:]:
    f = sorted(glob.glob(B + tag + '/gtp_logs/*.log'))[-1]
    t = open(f, encoding='utf-8', errors='replace').read()
    times = [float(x) for x in re.findall(r'Time taken: ([\d.]+)', t)]
    visits = [int(x) for x in re.findall(r'Root visits: (\d+)', t)]
    stamps = re.findall(r'(\d\d:\d\d:\d\d)\+0900: (GTP Engine starting|Loaded model|GTP ready)', t)
    dev = [l for l in t.splitlines() if re.search(r'Metal|CoreML|MPS|GPU|Neural|device', l)][:6]
    print(f'== {tag} ({os.path.basename(f)}) genmoves={len(times)}')
    print(' stamps', stamps)
    print(' backend lines:'); [print('  ', d[:160]) for d in dev]
    labels = ['empty(첫 계산)', 'mid100', 'end200'] + [f'mid#{i+1}' for i in range(len(times) - 3)]
    for i, (lab, tt, v) in enumerate(zip(labels, times, visits)):
        if i < 3:
            print(f'  {lab}: {tt:.2f}s visits {v} → {v / tt:.0f} v/s')
    s = times[3:]
    if s:
        print(f'  sustain n={len(s)} median {statistics.median(s):.2f}s first5 {statistics.mean(s[:5]):.2f} last5 {statistics.mean(s[-5:]):.2f} → v/s median {1531 / statistics.median(s):.0f}')
