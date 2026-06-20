#!/usr/bin/env node
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const { helpers } = require('@google-cloud/aiplatform');

const PROJECT = 'monkos';
const LOCATION = 'us-central1';
const MODEL = 'text-multilingual-embedding-002';
const ENDPOINT = `projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}`;
const BATCH_SIZE = 50;

const client = new PredictionServiceClient({
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
});

async function embedBatch(texts) {
  const instances = texts.map(text => helpers.toValue({ content: text }));
  const [response] = await client.predict({ endpoint: ENDPOINT, instances });
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

module.exports = { embedTexts, embedQuery };
