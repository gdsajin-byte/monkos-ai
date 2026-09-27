#!/usr/bin/env node
// aiplatform 모듈·클라이언트는 첫 호출 시 지연 로딩 — build_index.js가 MODEL만 읽을 때(BM25 전용 빌드) 무거운 로딩을 피한다
const PROJECT = 'monkos';
const LOCATION = 'us-central1';
const MODEL = 'text-multilingual-embedding-002';
const ENDPOINT = `projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}`;
const BATCH_SIZE = 5;

let client = null;
let helpers = null;
function getClient() {
  if (!client) {
    const aiplatform = require('@google-cloud/aiplatform');
    helpers = aiplatform.helpers;
    client = new aiplatform.v1.PredictionServiceClient({
      apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
    });
  }
  return client;
}

async function embedBatch(texts) {
  const c = getClient();
  const instances = texts.map(text => helpers.toValue({ content: text }));
  const [response] = await c.predict({ endpoint: ENDPOINT, instances });
  return response.predictions.map(pred => {
    const values = pred.structValue.fields.embeddings.structValue.fields.values.listValue.values;
    return new Float32Array(values.map(v => v.numberValue));
  });
}

async function embedTexts(texts) {
  const results = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(batch);
    results.push(...embeddings);
  }
  return results;
}

async function embedQuery(query) {
  const [embedding] = await embedBatch([query]);
  return embedding;
}

module.exports = { embedTexts, embedQuery, MODEL };
