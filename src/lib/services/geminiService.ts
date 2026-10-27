/**
 * Google Gemini Multimodal Triage Service
 * Connects to Google Gemini 1.5 Flash via REST API
 * Gracefully falls back to the deterministic local scoring engine if GEMINI_API_KEY is not configured.
 */

export interface GeminiTriageOutput {
  gemini_used: boolean;
  model: string;
  clinical_summary?: string;
  immediate_first_aid?: string[];
  triage_recommendation?: string;
  suggested_hospital_department?: string;
}

export async function analyzeEmergencyWithGemini(params: {
  emergency_type: string;
  description: string;
  voice_transcription?: string;
  people_affected: number;
  vision_objects?: string[];
  location?: { latitude: number; longitude: number; address?: string };
}): Promise<GeminiTriageOutput> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return {
      gemini_used: false,
      model: 'deterministic_triage_engine',
    };
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `You are a certified emergency medical dispatch AI assistant assisting a first responder.
Analyze the following multi-modal incident telemetry and produce a structured clinical triage assessment.
Return strictly valid JSON with the following keys:
- clinical_summary: A concise 2-sentence clinical impression of patient acuity.
- immediate_first_aid: An array of 3-4 life-saving first-aid steps the bystander should execute while waiting for the ambulance.
- triage_recommendation: Priority recommendation for the dispatcher (e.g. ALS Unit, BLS Unit, Fire Tender, or Outpatient).
- suggested_hospital_department: Specific trauma or specialty department needed (e.g. Level-1 Trauma, Burn ICU, Cardiac Catheterization Lab).

Incident Data:
- Incident Type: ${params.emergency_type}
- Text Description: ${params.description}
- Voice Transcript: ${params.voice_transcription || 'None'}
- Casualties / Affected Persons: ${params.people_affected}
- Detected Objects from Camera: ${(params.vision_objects || []).join(', ') || 'None'}
- Location: ${params.location?.address || `${params.location?.latitude || 'N/A'}, ${params.location?.longitude || 'N/A'}`}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Gemini Service] Gemini API returned status ${res.status}. Falling back to deterministic engine.`);
      return { gemini_used: false, model: 'deterministic_triage_engine' };
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      return { gemini_used: false, model: 'deterministic_triage_engine' };
    }

    const parsed = JSON.parse(rawText);

    return {
      gemini_used: true,
      model: 'gemini-1.5-flash',
      clinical_summary: parsed.clinical_summary,
      immediate_first_aid: Array.isArray(parsed.immediate_first_aid) ? parsed.immediate_first_aid : undefined,
      triage_recommendation: parsed.triage_recommendation,
      suggested_hospital_department: parsed.suggested_hospital_department,
    };
  } catch (err: any) {
    console.warn('[Gemini Service] Exception calling Gemini API:', err?.message || err);
    return {
      gemini_used: false,
      model: 'deterministic_triage_engine',
    };
  }
}
