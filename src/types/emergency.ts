export type EmergencySeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type EmergencyStatus = 
  | 'NEW'
  | 'ANALYZING'
  | 'HOSPITAL_RECOMMENDED'
  | 'REPORT_GENERATED'
  | 'ALERT_SENT'
  | 'ACKNOWLEDGED'
  | 'IN_RESPONSE'
  | 'RESOLVED';

export type EmergencyType =
  | 'Road Accident'
  | 'Fire'
  | 'Medical Emergency'
  | 'Injury'
  | 'Unconscious Person'
  | 'Chest Pain'
  | 'Breathing Difficulty'
  | 'Cardiac Emergency'
  | 'Burn'
  | 'Fall'
  | 'Other';

export type LocationSource = 'DEVICE_GPS' | 'MANUAL' | 'DEMO';
export type GpsQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  timestamp?: string;
  source?: LocationSource;
  quality?: GpsQuality;
  is_demo?: boolean;
}

export type CapabilityVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'NOT_AVAILABLE';

export interface HospitalCapabilities {
  has_emergency_department: boolean;
  has_icu: boolean;
  has_trauma_center: boolean;
  has_blood_bank: boolean;
  has_cardiology: boolean;
  has_neurology: boolean;
  has_orthopedics: boolean;
  has_burn_unit: boolean;
  has_ambulance: boolean;
  has_operation_theatre: boolean;
  is_emergency_available: boolean;
}

export interface Hospital {
  id: string;
  osm_id?: string;
  google_place_id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  emergency_email?: string;
  website?: string;
  google_maps_uri?: string;
  healthcare_type?: string;
  emergency_capability?: string;
  business_status?: string;
  source: 'OPENSTREETMAP' | 'GOOGLE_PLACES' | 'VERIFIED_DATABASE' | 'DEMO_DATA';
  source_retrieved_at?: string;
  verification_status: CapabilityVerificationStatus;
  capabilities?: HospitalCapabilities;
  is_demo?: boolean;
  distanceKm?: number;
  roadDistanceKm?: number;
  etaMinutes?: number;
  suitabilityScore?: number;
  matchReasons?: string[];
}

export interface ExplainableSeverity {
  severity: EmergencySeverity;
  score: number;
  reasons: string[];
  breakdown: { factor: string; points: number }[];
}

export interface MultimodalObservation {
  id: string;
  source: 'VISION' | 'VOICE' | 'TEXT' | 'LOCATION' | 'INFERENCE';
  observation_type: string;
  label: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface StructuredExtraction {
  incident: string;
  patient_count: number;
  consciousness: 'Conscious' | 'Unconscious' | 'Altered' | 'Unknown';
  breathing: 'Normal' | 'Difficulty' | 'Not breathing' | 'Choking' | 'Unknown';
  visible_bleeding: boolean | null;
  possible_injury: string | null;
  possible_trauma: boolean;
  observed_information: string[];
  user_reported_information: string[];
  ai_inference: string[];
}

export interface QuickQuestion {
  id: string;
  question: string;
  options: ('YES' | 'NO' | 'NOT SURE')[];
}

export interface BoundingBox {
  class: string;
  label: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
}

export interface ObjectCounts {
  people: number;
  vehicles: number;
  smoke_fire: number;
  damaged_vehicles: number;
  others?: number;
}

/**
 * Computer Vision Accident Detection Schema
 */
export interface AccidentDetectionResult {
  accident_detected: boolean;
  confidence: number; // 0.0 - 1.0 (e.g., 0.91)
  incident_type: string; // e.g., "Vehicle Collision"
  detected_objects: string[]; // e.g., ["Car", "Motorcycle", "Person"]
  vehicle_count?: number;
  people_count?: number;
  injury_indicators?: string[];
  damage_indicators?: string[];
  fire_smoke_detected?: boolean;
  road_blockage_detected?: boolean;
  object_counts?: ObjectCounts;
  bounding_boxes?: BoundingBox[];
}

/**
 * 31-Field Complete Emergency Incident Analysis Schema
 */
export interface EmergencyIncidentAnalysis {
  // 1-4: Identification & Confidence
  primary_incident_category: string;
  secondary_categories: string[];
  confidence_score: number; // 0.0 - 1.0
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';

  // 5-6: Severity Metrics
  severity_level: EmergencySeverity;
  severity_score: number; // Authoritative 1 - 20 raw score
  severity_score_display?: number; // 15 - 100 linearly scaled UI display value

  // 7-8: Patient Volume
  estimated_patient_count: number;
  patient_count_confidence: 'HIGH' | 'MEDIUM' | 'LOW';

  // 9-10: Consciousness Evaluation
  consciousness_status: 'Conscious' | 'Unconscious' | 'Altered' | 'Unknown';
  consciousness_evidence: string;

  // 11-12: Respiratory Evaluation
  breathing_status: 'Normal' | 'Difficulty' | 'Not breathing' | 'Choking' | 'Unknown';
  breathing_evidence: string;

  // 13-14: Hemorrhage Evaluation
  active_hemorrhage_observed: boolean | null;
  hemorrhage_evidence: string;

  // 15-16: Physical Trauma Evaluation
  suspected_physical_trauma: boolean;
  trauma_evidence: string;

  // 17-19: Multimodal Input Extracts
  visual_scene_descriptors: string[];
  voice_audio_descriptors: string[];
  key_text_extracts: string[];

  // 20-21: Clinical Risk Metrics
  red_flags_detected: string[];
  triage_priority_score: number; // 1 (Highest) - 5 (Lowest)

  // 22-25: Response & Resource Guidance
  recommended_medical_specialties: string[];
  required_hospital_capabilities: string[];
  immediate_first_aid_steps: string[];
  dispatch_recommendations: string;

  // 26-28: Uncertainty & Diagnostics
  key_uncertainties: string[];
  missing_critical_data: string[];
  recommended_clarifying_questions: string[];

  // 29-31: Explainability & Governance
  clinical_reasoning_summary: string;
  evidence_provenance: { source: 'VISION' | 'VOICE' | 'TEXT' | 'GPS'; detail: string }[];
  non_diagnostic_disclaimer: string;
}

export interface AIAssessment {
  emergency_type: string;
  categories: string[];
  severity: EmergencySeverity;
  is_critical: boolean;
  confidence: number;
  severity_score?: number;
  severity_score_display?: number;
  explainable_breakdown?: ExplainableSeverity;
  observations?: MultimodalObservation[];
  structured_extraction: StructuredExtraction;
  accident_detection?: AccidentDetectionResult;
  detailed_analysis?: EmergencyIncidentAnalysis;
  reasoning: string;
  required_facilities: string[];
  recommended_response: string;
  immediate_safety_actions: string[];
  next_quick_question?: QuickQuestion | null;
  disclaimer: string;
}

export interface VoiceTranscription {
  original_transcription: string;
  detected_language: string;
  transcription_timestamp: string;
  voice_recording_url?: string;
}

export interface TimelineEvent {
  status: EmergencyStatus;
  label: string;
  timestamp: string;
  details?: string;
}

export interface EmailStatus {
  sent: boolean;
  sent_at?: string;
  recipient?: string;
  subject?: string;
  error?: string;
}

export interface EmergencyReport {
  id: string;
  report_id: string;
  created_at: string;
  emergency_type: string;
  description: string;
  people_affected: number;
  severity: EmergencySeverity;
  ai_confidence: number;
  status: EmergencyStatus;
  location: LocationData;
  voice?: VoiceTranscription;
  media_urls?: string[];
  ai_assessment?: AIAssessment;
  accident_detection?: AccidentDetectionResult;
  detailed_analysis?: EmergencyIncidentAnalysis;
  recommended_hospital_id?: string;
  recommended_hospital?: Hospital;
  nearby_hospitals?: Hospital[];
  search_radius_km?: number;
  timeline: TimelineEvent[];
  email_status?: EmailStatus;
  is_demo?: boolean;
}

export type UserRole = 'USER' | 'RESPONDER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospital_id?: string;
}

export type SyncQueueStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface SyncQueueItem {
  id: string;
  local_id: string;
  incident_id: string;
  status: SyncQueueStatus;
  retry_count: number;
  last_attempt?: string;
  error?: string;
  created_at: string;
}
