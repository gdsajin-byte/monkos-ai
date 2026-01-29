const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const { helpers } = require('@google-cloud/aiplatform');
const { Storage } = require('@google-cloud/storage');

const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const BUCKET_NAME = process.env.BUCKET_NAME || 'monk-ai-images'; 

// 3-day cut 전략: CSP 해제 (빠른 배포 우선)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Frontend Static Serving
app.use(express.static(path.join(__dirname, 'public')));

const predictionServiceClient = new PredictionServiceClient({
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
});
const storage = new Storage();

app.get('/', (req, res) => {
  res.status(200).send('MONKOS Image Engine is running (Cloud Run + Vertex AI)');
});

app.post('/generate', async (req, res) => {
  try {
    const { prompt, negative_prompt, aspectRatio = '1:1', sampleCount = 1 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Imagen 3 엔드포인트 (최신)
    // imagen-3.0-generate-001
    const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-001`;

    // Imagen 3 파라미터 구조
    const instanceValue = {
      prompt: prompt,
    };
    // Imagen 3는 negative_prompt 지원 여부가 버전에 따라 다를 수 있으나 일단 포함
    if (negative_prompt) instanceValue.negative_prompt = negative_prompt;

    const parametersValue = {
      sampleCount: parseInt(sampleCount),
      aspectRatio: aspectRatio, // "1:1", "16:9" 등
      safetyFilterLevel: "block_some",
      personGeneration: "allow_adult",
    };

    const request = {
      endpoint,
      instances: [helpers.toValue(instanceValue)],
      parameters: helpers.toValue(parametersValue),
    };

    console.log(`Generating image with Imagen 3: ${prompt}`);
    
    const [response] = await predictionServiceClient.predict(request);
    
    if (!response.predictions || response.predictions.length === 0) {
      throw new Error('No predictions returned from Vertex AI');
    }

    const results = [];

    for (let i = 0; i < response.predictions.length; i++) {
      const prediction = response.predictions[i];
      // Imagen 3 응답 구조
      const base64Image = prediction.structValue?.fields?.bytesBase64Encoded?.stringValue;
      
      if (!base64Image) {
          console.error("Prediction structure mismatch:", JSON.stringify(prediction));
          continue;
      }

      // GCS 업로드
      const filename = `generated/${Date.now()}_${i}.png`;
      const file = storage.bucket(BUCKET_NAME).file(filename);
      const buffer = Buffer.from(base64Image, 'base64');
      
      try {
        await file.save(buffer, {
            metadata: { contentType: 'image/png' },
        });
        
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        });

        results.push({
            base64: base64Image,
            gcsUri: `gs://${BUCKET_NAME}/${filename}`,
            signedUrl: url
        });
      } catch (uploadError) {
          console.error(`GCS Upload Failed: ${uploadError.message}.`);
          results.push({ base64: base64Image, error: "GCS upload failed" });
      }
    }

    res.json({ success: true, images: results });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: error.message, 
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
