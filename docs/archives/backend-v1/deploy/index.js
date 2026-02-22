const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0105707468';
const LOCATION = 'us-central1';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'MONK AI Backend v2', version: '2.0.0' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// ========== 고정 프롬프트 (동일인 강제) ==========
const FIXED_PROMPTS = {
    id_photo: `Professional Korean passport ID photo, 
        MUST preserve exact facial features and identity of the input person,
        formal black suit with white dress shirt,
        pure white background,
        professional studio lighting,
        neutral expression, eyes looking straight at camera,
        high resolution, sharp focus,
        skin naturally retouched but identity preserved,
        no glasses reflection, no shadows on face`,
    
    profile: `Professional business profile photo,
        MUST preserve exact facial features and identity of the input person,
        modern corporate style,
        soft gradient background,
        confident but approachable expression,
        professional studio lighting,
        high quality portrait photography`,
        
    casual: `Casual portrait photo,
        MUST preserve exact facial features and identity of the input person,
        natural friendly smile,
        soft blurred background,
        warm natural lighting,
        lifestyle photography style`
};

/**
 * POST /api/photo/generate
 * Imagen 3 with SafetyGuard 4 + Fixed Prompt
 */
app.post('/api/photo/generate', async (req, res) => {
    try {
        const { 
            prompt = '', 
            inputImage,
            aspectRatio = '3:4', 
            numberOfImages = 4,
            mode = 't2i',
            style = 'id_photo'
        } = req.body;

        console.log(`📸 Generate: mode=${mode}, style=${style}, images=${numberOfImages}`);

        // Lazy load
        const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
        const client = new PredictionServiceClient({
            apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`
        });

        // 고정 프롬프트 + 사용자 프롬프트
        const fixedPrompt = FIXED_PROMPTS[style] || FIXED_PROMPTS.id_photo;
        const finalPrompt = prompt ? `${fixedPrompt}, ${prompt}` : fixedPrompt;

        let endpoint, instances, parameters;

        // mode가 'i2i' 또는 'edit'이면 I2I 모드
        if ((mode === 'i2i' || mode === 'edit') && inputImage) {
            // Imagen 3 Edit Image API (올바른 구조)
            endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-001`;
            
            const cleanBase64 = inputImage.replace(/^data:image\/\w+;base64,/, '');
            
            // Edit 모드: image + mask 또는 image + prompt
            instances = [{
                structValue: {
                    fields: {
                        prompt: { stringValue: finalPrompt },
                        image: {
                            structValue: {
                                fields: {
                                    bytesBase64Encoded: { stringValue: cleanBase64 }
                                }
                            }
                        }
                    }
                }
            }];

            parameters = {
                structValue: {
                    fields: {
                        sampleCount: { numberValue: Math.min(numberOfImages, 4) },
                        aspectRatio: { stringValue: aspectRatio },
                        personGeneration: { stringValue: 'allow_adult' },
                        safetySetting: { stringValue: 'block_only_high' },
                        addWatermark: { boolValue: false },
                        editMode: { stringValue: 'inpaint-insert' },
                        editConfig: {
                            structValue: {
                                fields: {
                                    editMode: { stringValue: 'EDIT_MODE_INPAINT_INSERTION' }
                                }
                            }
                        }
                    }
                }
            };

            console.log('🎯 I2I Mode: Edit with input image');

        } else {
            // T2I 모드
            endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-001`;
            
            instances = [{
                structValue: {
                    fields: {
                        prompt: { stringValue: finalPrompt }
                    }
                }
            }];

            parameters = {
                structValue: {
                    fields: {
                        sampleCount: { numberValue: numberOfImages },
                        aspectRatio: { stringValue: aspectRatio },
                        personGeneration: { stringValue: 'allow_adult' },
                        safetySetting: { stringValue: 'block_only_high' },
                        addWatermark: { boolValue: false }
                    }
                }
            };
        }

        console.log(`🎨 Calling: ${endpoint.split('/').pop()}`);

        const [response] = await client.predict({ endpoint, instances, parameters });

        const images = (response.predictions || []).map((pred, i) => ({
            id: `img-${Date.now()}-${i}`,
            imageBytes: pred.structValue?.fields?.bytesBase64Encoded?.stringValue || ''
        })).filter(img => img.imageBytes);

        console.log(`✅ Generated ${images.length} images`);

        res.json({ success: true, images, count: images.length, mode, style });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 상품 목록
app.get('/api/photo/products', (req, res) => {
    res.json({
        products: [
            { id: 'resume', name: '이력서 세트', credits: 75, style: 'id_photo' },
            { id: 'profile', name: '프로필 세트', credits: 100, style: 'profile' },
            { id: 'casual', name: '캐쥬얼', credits: 100, style: 'casual' }
        ]
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MONK AI Backend v2 on port ${PORT}`);
    console.log(`🔒 SafetyGuard: Level 4`);
});
