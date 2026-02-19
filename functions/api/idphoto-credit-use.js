// CF Pages Function — idphoto credit-use 프록시
// 다운로드 크레딧 차감: monk.kr → idphoto-kr.monkos.ai → monkos.ai 포탈
const TARGET = 'https://idphoto-kr.monkos.ai/api/credit/use';

export async function onRequestPost(context) {
  try {
    const res = await fetch(TARGET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await context.request.text(),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
  });
}
