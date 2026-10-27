import { NextResponse } from 'next/server';
import { AIAssessment } from '@/types/emergency';
import {
  calculateExplainableSeverity,
  generateMultimodalObservations,
  extractCategories,
  extractStructuredData,
  generateNextQuickQuestion,
  generateDetailed31FieldAnalysis,
} from '@/lib/services/severityScoringEngine';
import { analyzeEmergencyWithGemini } from '@/lib/services/geminiService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emergency_type, description, voice_transcription, people_affected = 1, vision_objects = [], location } = body;

    const fullText = `${emergency_type || ''} ${description || ''} ${voice_transcription || ''}`.trim();

    if (!fullText) {
      return NextResponse.json({ success: false, error: 'Empty emergency description' }, { status: 400 });
    }

    // 1. Categories & Structured Extraction
    const categories = extractCategories(fullText);
    const structured_extraction = extractStructuredData(fullText, Number(people_affected), vision_objects);

    // 2. Explainable Severity Score
    const explainable = calculateExplainableSeverity(fullText, Number(people_affected), vision_objects);
    const is_critical = explainable.severity === 'CRITICAL' || explainable.severity === 'HIGH';

    // 3. Telemetry Observations
    const observations = generateMultimodalObservations(description || emergency_type, voice_transcription, vision_objects);

    // 4. Detailed 31-Field Emergency Incident Analysis
    const locationText = location ? `${location.latitude}, ${location.longitude}` : undefined;
    const detailed_analysis = generateDetailed31FieldAnalysis(
      fullText,
      Number(people_affected),
      vision_objects,
      voice_transcription,
      locationText
    );

    const primaryType = categories.length > 0 ? categories[0] : (emergency_type || 'Medical Incident');

    // 5. Call Google Gemini 1.5 Flash (or deterministic fallback)
    const geminiAssessment = await analyzeEmergencyWithGemini({
      emergency_type: primaryType,
      description: fullText,
      voice_transcription,
      people_affected: Number(people_affected),
      vision_objects,
      location,
    });

    // 6. Required Facilities Mapping
    const facilityList = [
      'Emergency Department',
      ...detailed_analysis.required_hospital_capabilities,
      ...(geminiAssessment.suggested_hospital_department ? [geminiAssessment.suggested_hospital_department] : []),
    ];
    const requiredFacilities: string[] = Array.from(new Set(facilityList));

    // 7. Next Quick Question (None if Critical or complete)
    const next_quick_question = is_critical ? null : generateNextQuickQuestion(structured_extraction);

    const firstAidActions = geminiAssessment.immediate_first_aid && geminiAssessment.immediate_first_aid.length > 0
      ? geminiAssessment.immediate_first_aid
      : detailed_analysis.immediate_first_aid_steps;

    const baseReasoning = geminiAssessment.gemini_used && geminiAssessment.clinical_summary
      ? `[Gemini 1.5 Flash Triage]: ${geminiAssessment.clinical_summary} ${geminiAssessment.triage_recommendation ? `Dispatch: ${geminiAssessment.triage_recommendation}.` : ''}`
      : `AI Emergency Assessment: Triage priority ${explainable.severity} (Score: ${explainable.score} pts). Category: ${detailed_analysis.primary_incident_category}. Detected red flags: ${detailed_analysis.red_flags_detected.join(', ')}.`;

    const assessment: AIAssessment = {
      emergency_type: primaryType,
      categories,
      severity: explainable.severity,
      is_critical,
      // Input completeness percentage (25% - 100% based on channels provided):
      confidence: Math.round(detailed_analysis.confidence_score * 100),
      severity_score: explainable.score,
      severity_score_display: detailed_analysis.severity_score_display,
      explainable_breakdown: explainable,
      observations,
      structured_extraction,
      detailed_analysis,
      reasoning: baseReasoning,
      required_facilities: requiredFacilities,
      recommended_response: is_critical
        ? 'CRITICAL ALERT: Immediate emergency medical assistance is recommended. Dispatching telemetry to nearest facility.'
        : 'Priority triage evaluation complete. Contacting nearest emergency healthcare facilities.',
      immediate_safety_actions: firstAidActions,
      next_quick_question,
      disclaimer: detailed_analysis.non_diagnostic_disclaimer,
    };

    return NextResponse.json({
      success: true,
      assessment,
      detailed_analysis,
      ai_engine: geminiAssessment.gemini_used ? 'google_gemini_1.5_flash' : 'explainable_deterministic_engine',
    });
  } catch (error: any) {
    console.error('Analyze API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'AI analysis failed', stack: error.stack },
      { status: 500 }
    );
  }
}
