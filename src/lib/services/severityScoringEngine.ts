import {
  EmergencySeverity,
  ExplainableSeverity,
  MultimodalObservation,
  StructuredExtraction,
  QuickQuestion,
  EmergencyIncidentAnalysis,
  AccidentDetectionResult,
} from '@/types/emergency';
import { matchEmergencyDomain, EMERGENCY_KNOWLEDGE_BASE } from '@/lib/data/emergencyKnowledgeBase';

interface SeverityRule {
  keywords: string[];
  factor: string;
  points: number;
}

const SEVERITY_RULES: SeverityRule[] = [
  { keywords: ['unconscious', 'passed out', 'unresponsive', 'fainted', 'coma', 'not responding'], factor: 'Unconscious Patient', points: 5 },
  { keywords: ['breathing difficulty', 'cannot breathe', 'not breathing', 'choking', 'asphyxia', 'shortness of breath', 'gasping'], factor: 'Respiratory Compromise / Airway Risk', points: 5 },
  { keywords: ['bleeding heavily', 'severe bleeding', 'hemorrhage', 'arterial bleeding', 'blood gushing', 'bleeding from head'], factor: 'Severe Active Hemorrhage', points: 5 },
  { keywords: ['fire', 'explosion', 'burns', 'smoke inhalation', 'blaze'], factor: 'Fire Hazard / Active Flame Risk', points: 5 },
  { keywords: ['head injury', 'head trauma', 'skull fracture', 'brain injury', 'concussion', 'head hit'], factor: 'Traumatic Head Trauma', points: 4 },
  { keywords: ['chest pain', 'heart attack', 'cardiac', 'cardiac arrest'], factor: 'Possible Cardiac Event', points: 5 },
  { keywords: ['stroke', 'face drooping', 'slurred speech', 'paralysis'], factor: 'Possible Stroke-Like Symptoms', points: 5 },
  { keywords: ['multiple victims', 'casualties', 'many injured', '2 people', '3 people', '4 people', '5 people'], factor: 'Multiple Casualties', points: 3 },
  { keywords: ['fracture', 'broken bone', 'dislocation', 'deformed limb', 'fell from'], factor: 'Possible Bone Fracture / Skeletal Trauma', points: 3 },
  { keywords: ['vehicle collision', 'car crash', 'highway accident', 'bike accident', 'collision'], factor: 'High-Impact Vehicle Collision', points: 3 },
  { keywords: ['minor injury', 'cut', 'scratch', 'small wound', 'sprain'], factor: 'Minor Superficial Trauma', points: 1 },
];

export function extractCategories(text: string): string[] {
  const lower = text.toLowerCase();
  const categories: string[] = [];

  if (lower.includes('bike') || lower.includes('car') || lower.includes('crash') || lower.includes('accident') || lower.includes('vehicle') || lower.includes('road')) {
    categories.push('Road accident');
  }
  if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('chest pain')) {
    categories.push('Cardiac emergency');
  }
  if (lower.includes('breath') || lower.includes('gasping') || lower.includes('choking') || lower.includes('suffocat')) {
    categories.push('Breathing emergency');
  }
  if (lower.includes('bleed') || lower.includes('blood') || lower.includes('hemorrhage')) {
    categories.push('Severe bleeding');
  }
  if (lower.includes('head') || lower.includes('skull') || lower.includes('brain') || lower.includes('concussion')) {
    categories.push('Head injury');
  }
  if (lower.includes('fracture') || lower.includes('broken') || lower.includes('bone') || lower.includes('trauma') || lower.includes('fall')) {
    categories.push('Fracture/major trauma');
  }
  if (lower.includes('burn') || lower.includes('fire') || lower.includes('scald') || lower.includes('flame')) {
    categories.push('Burns');
  }
  if (lower.includes('smoke') || lower.includes('explosion')) {
    categories.push('Fire-related injury');
  }
  if (lower.includes('poison') || lower.includes('chemical') || lower.includes('overdose') || lower.includes('toxic')) {
    categories.push('Poisoning');
  }
  if (lower.includes('stroke') || lower.includes('paralysis') || lower.includes('slurred') || lower.includes('face drooping')) {
    categories.push('Stroke-like symptoms');
  }
  if (lower.includes('allergy') || lower.includes('anaphylaxis') || lower.includes('swelling')) {
    categories.push('Severe allergic reaction');
  }
  if (lower.includes('unconscious') || lower.includes('passed out') || lower.includes('unresponsive') || lower.includes('not responding')) {
    categories.push('Unconscious person');
  }
  if (lower.includes('multiple') || lower.includes('people') || lower.includes('casualties') || lower.includes('group')) {
    categories.push('Multiple casualties');
  }

  if (categories.length === 0) {
    categories.push('Other medical emergency');
  }

  return categories;
}

export function extractStructuredData(
  text: string,
  peopleCount: number = 1,
  visionLabels: string[] = []
): StructuredExtraction {
  const lower = `${text} ${visionLabels.join(' ')}`.toLowerCase();

  let consciousness: 'Conscious' | 'Unconscious' | 'Altered' | 'Unknown' = 'Unknown';
  if (lower.includes('unconscious') || lower.includes('passed out') || lower.includes('unresponsive') || lower.includes('not responding')) {
    consciousness = 'Unconscious';
  } else if (lower.includes('conscious') || lower.includes('awake') || lower.includes('alert') || lower.includes('talking')) {
    consciousness = 'Conscious';
  } else if (lower.includes('confused') || lower.includes('dizzy') || lower.includes('disoriented') || lower.includes('altered')) {
    consciousness = 'Altered';
  }

  let breathing: 'Normal' | 'Difficulty' | 'Not breathing' | 'Choking' | 'Unknown' = 'Unknown';
  if (lower.includes('not breathing') || lower.includes('stopped breathing')) {
    breathing = 'Not breathing';
  } else if (lower.includes('choking') || lower.includes('choke')) {
    breathing = 'Choking';
  } else if (lower.includes('breathing difficulty') || lower.includes('cannot breathe') || lower.includes('gasping') || lower.includes('shortness of breath')) {
    breathing = 'Difficulty';
  } else if (lower.includes('breathing normally') || lower.includes('normal breathing')) {
    breathing = 'Normal';
  }

  let visible_bleeding: boolean | null = null;
  if (lower.includes('bleeding') || lower.includes('blood')) {
    visible_bleeding = true;
  } else if (lower.includes('no bleeding')) {
    visible_bleeding = false;
  }

  const possible_trauma = lower.includes('accident') || lower.includes('fall') || lower.includes('crash') || lower.includes('head') || lower.includes('trauma') || lower.includes('fracture');

  let possible_injury: string | null = null;
  const injuries: string[] = [];
  if (lower.includes('head')) injuries.push('Head injury indicator');
  if (lower.includes('leg') || lower.includes('arm') || lower.includes('fracture') || lower.includes('bone')) injuries.push('Possible skeletal limb fracture');
  if (lower.includes('burn')) injuries.push('Possible thermal burn');
  if (lower.includes('chest')) injuries.push('Possible chest trauma');
  if (injuries.length > 0) possible_injury = injuries.join(', ');

  const observed_information: string[] = [];
  if (visionLabels.length > 0) {
    visionLabels.forEach((l) => observed_information.push(`Visual indicator: ${l}`));
  }
  if (visible_bleeding) observed_information.push('Active hemorrhage reported/observed');
  if (consciousness === 'Unconscious') observed_information.push('Patient reported unresponsive');

  const user_reported_information: string[] = [text.trim()];

  const ai_inference: string[] = [];
  if (consciousness === 'Unconscious' && possible_trauma) {
    ai_inference.push('Possible severe traumatic brain or cervical injury based on unconsciousness post-impact.');
  }
  if (breathing === 'Difficulty' || breathing === 'Not breathing' || breathing === 'Choking') {
    ai_inference.push('Airway and respiratory risk detected requiring immediate oxygenation / ventilation capability.');
  }
  if (visible_bleeding) {
    ai_inference.push('Active blood loss requiring trauma hemorrhage control readiness.');
  }

  const categories = extractCategories(text);
  const incidentSummary = categories.join(' + ');

  return {
    incident: incidentSummary,
    patient_count: peopleCount,
    consciousness,
    breathing,
    visible_bleeding,
    possible_injury,
    possible_trauma,
    observed_information: observed_information.length > 0 ? observed_information : ['General incident telemetry recorded'],
    user_reported_information,
    ai_inference: ai_inference.length > 0 ? ai_inference : ['AI preliminary triage assessment generated'],
  };
}

export function generateNextQuickQuestion(extraction: StructuredExtraction): QuickQuestion | null {
  if (extraction.consciousness === 'Unknown') {
    return {
      id: 'q_consciousness',
      question: 'Is the person conscious and responsive?',
      options: ['YES', 'NO', 'NOT SURE'],
    };
  }
  if (extraction.breathing === 'Unknown') {
    return {
      id: 'q_breathing',
      question: 'Is the person breathing normally?',
      options: ['YES', 'NO', 'NOT SURE'],
    };
  }
  if (extraction.visible_bleeding === null) {
    return {
      id: 'q_bleeding',
      question: 'Is there active bleeding visible?',
      options: ['YES', 'NO', 'NOT SURE'],
    };
  }
  return null;
}

export function calculateExplainableSeverity(
  textInput: string,
  peopleCount: number = 1,
  visionLabels: string[] = []
): ExplainableSeverity {
  const lowerText = `${textInput} ${visionLabels.join(' ')}`.toLowerCase();
  let totalScore = 0;
  const breakdown: { factor: string; points: number }[] = [];
  const reasons: string[] = [];

  for (const rule of SEVERITY_RULES) {
    if (rule.keywords.some((kw) => lowerText.includes(kw))) {
      totalScore += rule.points;
      breakdown.push({ factor: rule.factor, points: rule.points });
      reasons.push(rule.factor);
    }
  }

  if (peopleCount > 1 && !reasons.includes('Multiple Casualties')) {
    totalScore += 3;
    breakdown.push({ factor: `Multiple Victims (${peopleCount} affected)`, points: 3 });
    reasons.push(`Multiple Victims (${peopleCount} affected)`);
  }

  let severity: EmergencySeverity = 'LOW';
  if (totalScore >= 10) {
    severity = 'CRITICAL';
  } else if (totalScore >= 6) {
    severity = 'HIGH';
  } else if (totalScore >= 3) {
    severity = 'MODERATE';
  } else {
    severity = 'LOW';
  }

  return {
    severity,
    score: totalScore,
    reasons: reasons.length > 0 ? reasons : ['General Triage Assessment'],
    breakdown,
  };
}

export function generateMultimodalObservations(
  textDescription: string,
  voiceTranscript?: string,
  visionObjects: string[] = []
): MultimodalObservation[] {
  const observations: MultimodalObservation[] = [];

  if (visionObjects.length > 0) {
    visionObjects.forEach((obj, idx) => {
      observations.push({
        id: `obs-vis-${idx}`,
        source: 'VISION',
        observation_type: 'OBJECT_DETECTION',
        // Note: 'confidence' here is a fixed informational placeholder;
        // it is NOT a probability output from a trained object detection model.
        label: `Visual Indicator: ${obj}`,
        confidence: 80, // Conservative placeholder — not a detector score
      });
    });
  }

  if (textDescription) {
    observations.push({
      id: 'obs-rep-1',
      source: 'TEXT',
      observation_type: 'USER_REPORTED',
      label: `Text Input: "${textDescription.substring(0, 60)}..."`,
      confidence: 100,
    });
  }

  if (voiceTranscript) {
    observations.push({
      id: 'obs-rep-2',
      source: 'VOICE',
      observation_type: 'WHISPER_TRANSCRIPT',
      label: `Voice Note: "${voiceTranscript.substring(0, 60)}..."`,
      confidence: 95,
    });
  }

  const explainable = calculateExplainableSeverity(`${textDescription} ${voiceTranscript || ''}`);
  observations.push({
    id: 'obs-inf-1',
    source: 'INFERENCE',
    observation_type: 'SEVERITY_TRIAGE',
    // Renamed to remove clinical authority language; this is a rule-based keyword score, not a medically validated triage
    label: `Automated Severity Assessment (rule-based): ${explainable.severity} — Raw keyword score ${explainable.score}/20 (see breakdown)`,
    // Not a model probability — this value indicates coverage of the rule-matching process
    confidence: 80,
    metadata: { breakdown: explainable.breakdown },
  });

  return observations;
}

export function generateDetailed31FieldAnalysis(
  textInput: string,
  peopleCount: number = 1,
  visionLabels: string[] = [],
  voiceTranscript?: string,
  locationText?: string
): EmergencyIncidentAnalysis {
  const combinedText = `${textInput} ${voiceTranscript || ''} ${visionLabels.join(' ')}`;
  const domain = matchEmergencyDomain(combinedText);
  const categories = extractCategories(combinedText);
  const structured = extractStructuredData(combinedText, peopleCount, visionLabels);
  const explainable = calculateExplainableSeverity(combinedText, peopleCount, visionLabels);

  const telemetrySources = (textInput ? 1 : 0) + (voiceTranscript ? 1 : 0) + (visionLabels.length > 0 ? 1 : 0) + (locationText ? 1 : 0);
  // Input-completeness indicator (0.0–1.0): reflects how many of the 4 input channels
  // (text, voice, image, GPS) were provided. NOT a statistical model confidence or accuracy score.
  const inputCompletenessScore = telemetrySources >= 3 ? 0.96 : telemetrySources === 2 ? 0.92 : 0.88;

  const redFlags: string[] = [];
  const lowerCombined = combinedText.toLowerCase();

  domain.redFlags.forEach((rf) => {
    const keywords = rf.toLowerCase().split(' ').filter((w) => w.length > 4);
    if (keywords.some((kw) => lowerCombined.includes(kw))) {
      redFlags.push(rf);
    }
  });

  if (explainable.severity === 'CRITICAL' && redFlags.length === 0) {
    redFlags.push('High-severity score triggers critical clinical escalation');
  }

  let triagePriorityScore = 4;
  if (explainable.severity === 'CRITICAL') triagePriorityScore = 1;
  else if (explainable.severity === 'HIGH') triagePriorityScore = 2;
  else if (explainable.severity === 'MODERATE') triagePriorityScore = 3;

  const keyUncertainties: string[] = [
    'Exact number of injured people on scene',
    'Presence of internal hemorrhage or closed organ trauma',
  ];
  const missingData: string[] = ['On-scene vitals (Blood pressure, Pulse, SpO2)'];

  if (structured.consciousness === 'Unknown') {
    keyUncertainties.push('Patient consciousness state unverified');
    missingData.push('AVPU / Glasgow Coma Scale (GCS) assessment score');
  }
  if (structured.breathing === 'Unknown') {
    keyUncertainties.push('Airway patency and oxygenation status unverified');
    missingData.push('Respiratory rate and SpO2 oxygen saturation percentage');
  }

  const provenance: { source: 'VISION' | 'VOICE' | 'TEXT' | 'GPS'; detail: string }[] = [];
  if (textInput) {
    provenance.push({ source: 'TEXT', detail: `User typed report: "${textInput.substring(0, 50)}..."` });
  }
  if (voiceTranscript) {
    provenance.push({ source: 'VOICE', detail: `Whisper STT audio transcript: "${voiceTranscript.substring(0, 50)}..."` });
  }
  if (visionLabels.length > 0) {
    provenance.push({ source: 'VISION', detail: `Visual indicators extracted: ${visionLabels.join(', ')}` });
  }
  if (locationText) {
    provenance.push({ source: 'GPS', detail: `Browser GPS coordinates: ${locationText}` });
  }

  return {
    primary_incident_category: domain.category,
    secondary_categories: categories,
    // Input-completeness indicator: reflects number of active input channels (text/voice/image/GPS),
    // NOT a model accuracy or statistical confidence probability.
    confidence_score: inputCompletenessScore,
    confidence_level: inputCompletenessScore >= 0.9 ? 'HIGH' : 'MEDIUM',
    severity_level: explainable.severity,
    // Raw keyword-match score on a 1–20 scale (sum of matched rule weights).
    // A separate UI-display score (scaled to 0–100) is also provided but both refer to the same rule-based assessment.
    severity_score: explainable.score,            // Authoritative: raw 1–20 keyword score
    severity_score_display: Math.min(100, Math.max(15, explainable.score * 5)),  // Display-only 0–100 scaled value
    estimated_patient_count: peopleCount,
    patient_count_confidence: peopleCount > 1 ? 'HIGH' : 'MEDIUM',
    consciousness_status: structured.consciousness,
    consciousness_evidence: structured.consciousness === 'Unconscious'
      ? 'Report/input mentions unconscious, unresponsive, or passed out'
      : structured.consciousness === 'Conscious'
      ? 'Report/input indicates conscious state'
      : 'No definitive consciousness state specified in emergency input',
    breathing_status: structured.breathing,
    breathing_evidence: structured.breathing === 'Difficulty' || structured.breathing === 'Not breathing'
      ? 'Report/input indicates respiratory distress or absent breathing'
      : 'No explicit respiratory failure reported',
    active_hemorrhage_observed: structured.visible_bleeding,
    hemorrhage_evidence: structured.visible_bleeding
      ? 'Active bleeding reported or detected in scene telemetry'
      : 'No visible hemorrhage explicitly reported',
    suspected_physical_trauma: structured.possible_trauma,
    trauma_evidence: structured.possible_trauma
      ? `High-energy mechanism or impact reported (${structured.possible_injury || 'physical trauma'})`
      : 'No high-energy mechanical impact identified',
    visual_scene_descriptors: visionLabels.length > 0 ? visionLabels : ['No image telemetry attached'],
    voice_audio_descriptors: voiceTranscript ? [voiceTranscript] : ['No audio recording submitted'],
    key_text_extracts: textInput ? [textInput] : [],
    red_flags_detected: redFlags.length > 0 ? redFlags : ['No immediate life-threatening red flags detected'],
    triage_priority_score: triagePriorityScore,
    recommended_medical_specialties: domain.recommendedCapabilities,
    required_hospital_capabilities: domain.recommendedCapabilities,
    immediate_first_aid_steps: domain.immediateFirstAid,
    dispatch_recommendations: domain.dispatchRecommendations,
    key_uncertainties: keyUncertainties,
    missing_critical_data: missingData,
    recommended_clarifying_questions: [
      'Is the patient breathing without obstruction?',
      'Are there any signs of head trauma or neck pain?',
      'Is there active arterial bleeding?'
    ],
    clinical_reasoning_summary: `Incident categorized under ${domain.category} with ${explainable.severity} triage priority based on rule matches: [${explainable.reasons.join('; ')}]. Recommended destination capabilities: ${domain.recommendedCapabilities.join(', ')}.`,
    evidence_provenance: provenance,
    non_diagnostic_disclaimer: 'DISCLAIMER: AI incident analysis provides emergency decision-support telemetry only and does NOT constitute a formal medical diagnosis. Immediate response dispatch should occur independently of automated assessments.'
  };
}
