# 바둑판 원격 접속(집·모바일) 설정 — Cloudflare Access(이메일 일회용 코드) + 원격 관리형 터널 + DNS. 멱등(있으면 재사용).
# 사용: python3 remote_setup.py setup | token-run | status
#   setup     : 일회용 코드 IdP → Access 앱(go.monkos.ai, 허용 이메일만) → 터널 go-imac(인그레스 go.monkos.ai → 127.0.0.1:8765) → DNS CNAME
#   token-run : 터널 토큰을 API로 받아 env로만 cloudflared에 넘겨 exec (launchd ai.monkos.go-tunnel 용) — 토큰 미출력·미기록
#   status    : 앱·터널·DNS 상태 + 외부 접근 대조(잠금이 로그인으로 보내는지, 2회 히트)
# 인증 = SM CF_API_TOKEN · CF_ACCOUNT_ID (secret.sh 경유, 값 미출력). 10-23 iMac/쌍아, 작가님 "진행"(바둑 PoC 모바일 테스트).
# 순서 원칙: 잠금(Access) → 그다음 DNS. 잠금 없이 주소를 열지 않는다. matte-imac 등 다른 터널·DNS는 이름이 정확히 같은 것만 다룬다.
import json, os, ssl, subprocess, sys, urllib.request

ROOT = subprocess.run(["git", "-C", os.path.dirname(os.path.abspath(__file__)), "rev-parse", "--show-toplevel"],
                      capture_output=True, text=True).stdout.strip()
HOST, ZONE, TUNNEL, ORIGIN = "go.monkos.ai", "monkos.ai", "go-imac", "http://127.0.0.1:8765"
ALLOW = ["gdsajin@gmail.com"]
APP_NAME = "MONK 바둑 PoC (iMac)"
try:
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()


def fail(msg):
    print(f"❌ remote_setup: {msg}"); sys.exit(1)


def sm(name):
    r = subprocess.run(["zsh", f"{ROOT}/scripts/secret.sh", "get", name], capture_output=True, text=True)
    if r.returncode or not r.stdout.strip():
        fail(f"SM {name} 조회 실패")
    return r.stdout.strip()


T, A = sm("CF_API_TOKEN"), sm("CF_ACCOUNT_ID")


def api(method, path, body=None):
    req = urllib.request.Request("https://api.cloudflare.com/client/v4" + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Bearer {T}", "Content-Type": "application/json"})
    try:
        d = json.load(urllib.request.urlopen(req, context=CTX, timeout=30))
    except urllib.error.HTTPError as e:
        d = json.loads(e.read() or b"{}")
    if not d.get("success"):
        fail(f"API {method} {path.split('?')[0].replace(A, '<acct>')} → {[(e.get('code'), e.get('message')) for e in d.get('errors', [])]}")
    return d["result"]


def zone_id():
    z = [x for x in api("GET", f"/zones?name={ZONE}") if x["name"] == ZONE]
    return z[0]["id"] if z else fail(f"존 {ZONE} 없음")


def tunnel_id():
    t = [x for x in api("GET", f"/accounts/{A}/cfd_tunnel?is_deleted=false&name={TUNNEL}") if x["name"] == TUNNEL]
    return t[0]["id"] if t else None


def setup():
    # 로그인 방식: IdP를 따로 두지 않으면 Access 기본 = 이메일 일회용 코드(10-23 — 토큰에 IdP 생성 권한 없음, 1010)
    idps = [x for x in api("GET", f"/accounts/{A}/access/identity_providers") if x["type"] == "onetimepin"]
    idp = idps[0]["id"] if idps else None
    print("ℹ️ 로그인 방식:", "일회용 코드 IdP" if idp else "IdP 미설정 → 기본 일회용 코드")
    apps = [x for x in api("GET", f"/accounts/{A}/access/apps") if x.get("domain") == HOST]
    pol = [{"name": "작가님만", "decision": "allow", "include": [{"email": {"email": e}} for e in ALLOW]}]
    body = {"name": APP_NAME, "domain": HOST, "type": "self_hosted", "session_duration": "720h",
            **({"allowed_idps": [idp], "auto_redirect_to_identity": True} if idp else {}), "app_launcher_visible": False, "policies": pol}
    app = api("PUT", f"/accounts/{A}/access/apps/{apps[0]['id']}", body) if apps else api("POST", f"/accounts/{A}/access/apps", body)
    print(f"✅ Access 앱 {HOST}", "갱신" if apps else "생성", "· 정책", len(app.get("policies", [])), "· 허용", ALLOW)
    if not app.get("policies"):
        fail("앱에 정책이 붙지 않음 — DNS를 열지 않고 중단")
    tid = tunnel_id() or api("POST", f"/accounts/{A}/cfd_tunnel", {"name": TUNNEL, "config_src": "cloudflare"})["id"]
    api("PUT", f"/accounts/{A}/cfd_tunnel/{tid}/configurations",
        {"config": {"ingress": [{"hostname": HOST, "service": ORIGIN}, {"service": "http_status:404"}]}})
    print(f"✅ 터널 {TUNNEL} 인그레스 {HOST} → {ORIGIN}")
    zid = zone_id()
    rec = api("GET", f"/zones/{zid}/dns_records?name={HOST}")
    want = f"{tid}.cfargotunnel.com"
    if not rec:
        api("POST", f"/zones/{zid}/dns_records", {"type": "CNAME", "name": HOST, "content": want, "proxied": True,
                                                   "comment": "바둑 PoC iMac 원격 접속(Access 잠금) 10-23"})
        print("✅ DNS CNAME 생성")
    elif rec[0]["type"] == "CNAME" and rec[0]["content"] == want:
        print("ℹ️ DNS 이미 정합")
    else:
        fail(f"DNS {HOST} 기존 레코드가 이 터널과 다름 — 덮어쓰지 않음")


def token_run():
    tid = tunnel_id() or fail("터널 없음 — setup 먼저")
    tok = api("GET", f"/accounts/{A}/cfd_tunnel/{tid}/token")
    cfd = subprocess.run(["zsh", "-lc", "command -v cloudflared"], capture_output=True, text=True).stdout.strip() or fail("cloudflared 없음")
    os.execve(cfd, [cfd, "--no-autoupdate", "tunnel", "run"], {**os.environ, "TUNNEL_TOKEN": tok})


def status():
    apps = [x for x in api("GET", f"/accounts/{A}/access/apps") if x.get("domain") == HOST]
    print("Access 앱:", "있음 · 정책 " + str(len(apps[0].get("policies", []))) if apps else "없음")
    tid = tunnel_id()
    conns = api("GET", f"/accounts/{A}/cfd_tunnel/{tid}/connections") if tid else []
    print("터널:", TUNNEL, "커넥터", len(conns))
    for k in (1, 2):  # 2회 히트 — 2차로 판정(live-verify)
        r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{redirect_url}", "-m", "15", f"https://{HOST}/health"],
                           capture_output=True, text=True).stdout
    print(f"외부 https://{HOST}/health (2차):", r, "→ 302 + cloudflareaccess 로그인이면 잠금 정상")


{"setup": setup, "token-run": token_run, "status": status}.get(sys.argv[1] if len(sys.argv) > 1 else "status", status)()
