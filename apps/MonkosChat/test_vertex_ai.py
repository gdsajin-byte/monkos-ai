"""
Vertex AI Model Test - MONKOS Chat
테스트: Gemini (MaaS) 연결 확인

LLaMA 4가 Model Garden에서 사용 불가할 경우 Gemini로 대체
"""
import vertexai
from vertexai.generative_models import GenerativeModel

# Initialize Vertex AI
PROJECT_ID = "monkos"
LOCATION = "us-central1"

vertexai.init(project=PROJECT_ID, location=LOCATION)

def test_gemini():
    """Gemini 2.0 Flash 테스트"""
    print("=" * 50)
    print("[MONKOS] Vertex AI Gemini Test")
    print("=" * 50)

    try:
        # Gemini 2.0 Flash - 빠른 응답용
        model = GenerativeModel("gemini-2.0-flash-001")

        prompt = """You are MONKOS, an AI assistant for creative professionals.

        Say hello and introduce yourself in Korean (한국어로).
        Keep it brief (2-3 sentences)."""

        response = model.generate_content(prompt)

        print("\n[RESPONSE]")
        print(response.text)
        print("\n[STATUS] SUCCESS - Gemini 2.0 Flash connected")
        return True

    except Exception as e:
        print(f"\n[ERROR] {e}")
        return False

def test_gemini_pro():
    """Gemini 1.5 Pro 테스트 - 복잡한 추론용"""
    print("\n" + "=" * 50)
    print("[MONKOS] Vertex AI Gemini 1.5 Pro Test")
    print("=" * 50)

    try:
        model = GenerativeModel("gemini-1.5-pro-002")

        prompt = """Analyze this request and suggest an appropriate response:

        User wants to generate a fashion model image with:
        - Korean female model, 23 years old
        - Standing pose
        - Professional studio lighting

        What parameters would you recommend for image generation?
        Reply in Korean."""

        response = model.generate_content(prompt)

        print("\n[RESPONSE]")
        print(response.text[:500] + "..." if len(response.text) > 500 else response.text)
        print("\n[STATUS] SUCCESS - Gemini 1.5 Pro connected")
        return True

    except Exception as e:
        print(f"\n[ERROR] {e}")
        return False

if __name__ == "__main__":
    results = []

    results.append(("Gemini 2.0 Flash", test_gemini()))
    results.append(("Gemini 1.5 Pro", test_gemini_pro()))

    print("\n" + "=" * 50)
    print("[SUMMARY]")
    print("=" * 50)
    for name, success in results:
        status = "OK" if success else "FAIL"
        print(f"  {name}: {status}")
