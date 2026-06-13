"""
rembg u2net 풀모델 로컬 테스트 서버
실행: pip install rembg flask pillow && python rembg_server.py
포트: 5000 (벤치마크 페이지에서 호출)
"""

from flask import Flask, request, send_file
from rembg import remove
from io import BytesIO

app = Flask(__name__)

@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    if 'file' not in request.files:
        return 'file required', 400

    file = request.files['file']
    input_bytes = file.read()
    output_bytes = remove(input_bytes)

    return send_file(
        BytesIO(output_bytes),
        mimetype='image/png',
        download_name='result.png',
    )

@app.after_request
def cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

if __name__ == '__main__':
    print('rembg u2net server: http://localhost:5000/remove-bg')
    print('첫 요청 시 u2net 모델 자동 다운로드 (~170MB)')
    app.run(host='0.0.0.0', port=5000)
