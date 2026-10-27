export interface KnowledgeDomain {
  domain: string;
  category: string;
  keywords: string[];
  redFlags: string[];
  triageLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedCapabilities: string[];
  immediateFirstAid: string[];
  dispatchRecommendations: string;
  clinicalNote: string;
}

export const EMERGENCY_KNOWLEDGE_BASE: Record<string, KnowledgeDomain> = {
  TRAUMA: {
    domain: 'TRAUMA',
    category: 'Trauma & Physical Injury',
    keywords: [
      'accident', 'car crash', 'collision', 'fall', 'fracture', 'bleeding',
      'hemorrhage', 'head trauma', 'stab', 'gunshot', 'amputation', 'crush',
      'spinal injury', 'penetrating injury', 'bone sticking out'
    ],
    redFlags: [
      'Uncontrolled severe arterial bleeding',
      'Traumatic amputation',
      'Altered mental status post head trauma',
      'Flail chest or paradoxical breathing',
      'Open fracture with active hemorrhage'
    ],
    triageLevel: 'CRITICAL',
    recommendedCapabilities: [
      'Trauma Care',
      'Emergency Department',
      'Orthopedics',
      'ICU',
      'Blood Bank'
    ],
    immediateFirstAid: [
      'Apply direct firm pressure with clean cloth/bandage to bleeding site',
      'Do not move patient if spinal or neck injury is suspected',
      'Elevate legs if shock signs appear (unless spinal trauma)',
      'Keep patient warm with blankets to prevent hypothermia'
    ],
    dispatchRecommendations: 'Dispatch Advanced Life Support (ALS) Ambulance with Trauma Protocol enabled.',
    clinicalNote: 'High risk of hemorrhagic shock and cervical spine compromised stability.'
  },
  CARDIAC: {
    domain: 'CARDIAC',
    category: 'Cardiovascular Emergencies',
    keywords: [
      'chest pain', 'heart attack', 'cardiac arrest', 'angina', 'palpitations',
      'crushing chest tightness', 'radiating arm pain', 'sweating', 'syncope',
      'collapsed', 'no pulse', 'bradycardia', 'tachycardia'
    ],
    redFlags: [
      'Sudden loss of consciousness with absent normal breathing (Cardiac Arrest)',
      'Crushing central chest pain radiating to left jaw or arm',
      'Profuse cold sweating with severe hypotension signs',
      'History of ischemic heart disease with acute chest pressure'
    ],
    triageLevel: 'CRITICAL',
    recommendedCapabilities: [
      'Cath Lab',
      'Cardiology',
      'ICU',
      'Emergency Department',
      'Defibrillator'
    ],
    immediateFirstAid: [
      'Perform CPR immediately if unconscious and non-breathing (30 compressions : 2 breaths)',
      'Locate and apply Automated External Defibrillator (AED) if available',
      'Keep conscious patient calm in comfortable sitting/semi-recumbent position',
      'Administer 300mg Aspirin if conscious and not allergic'
    ],
    dispatchRecommendations: 'Dispatch Mobile Cardiac Care Unit (MCCU) / ALS Ambulance with AED and EKG capability.',
    clinicalNote: 'Time-critical myocardial ischemia or lethal arrhythmia requiring rapid revascularization.'
  },
  RESPIRATORY: {
    domain: 'RESPIRATORY',
    category: 'Respiratory Emergencies',
    keywords: [
      'shortness of breath', 'choking', 'asthma', 'anaphylaxis', 'stridor',
      'wheezing', 'cannot breathe', 'gasping', 'cyanosis', 'blue lips',
      'allergic reaction', 'swollen throat', 'hyperventilation'
    ],
    redFlags: [
      'Severe respiratory distress with central cyanosis (blue lips/fingers)',
      'Inability to speak in full sentences or complete single words',
      'Stridor or upper airway swelling from severe anaphylaxis',
      'Silent chest in acute severe asthma attack'
    ],
    triageLevel: 'CRITICAL',
    recommendedCapabilities: [
      'ICU',
      'Pulmonology',
      'Emergency Department',
      'Ventilator',
      'Allergy & Immunology'
    ],
    immediateFirstAid: [
      'Assist patient into upright sitting position to optimize diaphragm movement',
      'Administer EpiPen into outer thigh if anaphylaxis/allergic reaction is suspected',
      'Administer rescue inhaler (Salbutamol/Albuterol) 4-10 puffs via spacer if asthma',
      'Clear visible airway obstruction if choking (5 back blows, 5 abdominal thrusts)'
    ],
    dispatchRecommendations: 'Dispatch ALS Ambulance with Oxygen, Nebulizer, and Advanced Airway management.',
    clinicalNote: 'Acute hypoxemic or hypercapnic respiratory failure risk; monitor airway patency closely.'
  },
  NEUROLOGICAL: {
    domain: 'NEUROLOGICAL',
    category: 'Neurological & Brain Emergencies',
    keywords: [
      'stroke', 'seizure', 'convulsion', 'paralysis', 'facial drooping',
      'slurred speech', 'arm weakness', 'unconscious', 'coma', 'fainting',
      'sudden severe headache', 'confusion', 'disorientation'
    ],
    redFlags: [
      'FAST Positive: Facial drop, Arm weakness, Slurred speech (Acute Stroke window)',
      'Status epilepticus: Continuous seizure lasting > 5 minutes or repeated seizures',
      'Sudden onset "thunderclap" headache with neck stiffness',
      'Unresponsive with GCS < 8'
    ],
    triageLevel: 'CRITICAL',
    recommendedCapabilities: [
      'Stroke Center',
      'Neurology',
      'Neurosurgery',
      'CT/MRI Scan',
      'ICU'
    ],
    immediateFirstAid: [
      'Note exact time of symptom onset (critical for thrombolytic window)',
      'Turn seizing or unconscious breathing patient onto recovery side (left lateral)',
      'Do not insert any objects into the patient mouth during a seizure',
      'Protect patient head from impact during involuntary movements'
    ],
    dispatchRecommendations: 'Dispatch ALS Ambulance with Primary Stroke Center notification.',
    clinicalNote: 'Acute brain injury; time-to-treatment window determines neurological outcome.'
  },
  BURNS: {
    domain: 'BURNS',
    category: 'Thermal & Chemical Burns',
    keywords: [
      'burn', 'scald', 'fire', 'explosion', 'chemical burn', 'electrical shock',
      'blisters', 'charred skin', 'smoke inhalation', 'scalding water'
    ],
    redFlags: [
      'Inhalation injury indicated by soot around nostrils/mouth or singed nasal hair',
      'Full-thickness (3rd degree) burns covering > 10% Body Surface Area',
      'Circumferential burns to chest, neck, or limbs',
      'High-voltage electrical contact injuries'
    ],
    triageLevel: 'HIGH',
    recommendedCapabilities: [
      'Burn Unit',
      'Trauma Care',
      'Plastics & Reconstructive Surgery',
      'ICU',
      'Emergency Department'
    ],
    immediateFirstAid: [
      'Cool burn immediately under cool running tap water for 20 minutes (do NOT use ice)',
      'Remove non-adherent clothing and jewelry near burn area before swelling starts',
      'Cover clean burn with sterile non-adherent dressing or clean cling wrap',
      'Do not burst blisters or apply butter/oils to burn sites'
    ],
    dispatchRecommendations: 'Dispatch Specialized Ambulance with Fluid Resuscitation & Burn Protocol.',
    clinicalNote: 'Risk of hypovolemic shock, airway compromise from inhalation, and rapid edema formation.'
  },
  ENVIRONMENTAL: {
    domain: 'ENVIRONMENTAL',
    category: 'Environmental & Toxicological Emergencies',
    keywords: [
      'poison', 'overdose', 'heatstroke', 'hypothermia', 'snake bite',
      'carbon monoxide', 'drowning', 'gas leak', 'intoxication', 'scorpion sting'
    ],
    redFlags: [
      'Heatstroke with high body temp, altered mental status, and lack of sweating',
      'Opioid overdose with respiratory depression (breathing < 8/min) and pinpoint pupils',
      'Venomous snake bite with systemic neurotoxic or hemotoxic symptoms',
      'Carbon monoxide poisoning with multiple affected victims'
    ],
    triageLevel: 'HIGH',
    recommendedCapabilities: [
      'Toxicology',
      'Emergency Department',
      'ICU',
      'Hyperbaric Oxygen',
      'Dialysis'
    ],
    immediateFirstAid: [
      'For heatstroke: aggressively cool patient using ice packs in axillae/groin',
      'For opioid overdose: administer Naloxone nasal spray if available',
      'For snakebite: keep patient still, immobilize limb below heart level, do NOT cut or suck',
      'Move victim to fresh air immediately if carbon monoxide or gas leak'
    ],
    dispatchRecommendations: 'Dispatch ALS Unit equipped with Antidotes / Toxicology Kit.',
    clinicalNote: 'Multi-organ failure potential; toxicology lookup and antidote administration indicated.'
  },
  MASS_CASUALTY: {
    domain: 'MASS_CASUALTY',
    category: 'Mass Casualty & Disaster Incidents',
    keywords: [
      'mass casualty', 'disaster', 'explosion', 'building collapse', 'stampede',
      'multiple victims', 'bus crash', 'active threat', 'major accident'
    ],
    redFlags: [
      'Multiple casualties (>5 victims) requiring immediate field triage',
      'Hazardous material release or structural instability at scene',
      'Resource exhaustion at primary response scene'
    ],
    triageLevel: 'CRITICAL',
    recommendedCapabilities: [
      'Trauma Care',
      'Emergency Department',
      'Blood Bank',
      'Disaster Management',
      'ICU'
    ],
    immediateFirstAid: [
      'Perform START triage (Simple Triage and Rapid Treatment)',
      'Prioritize immediate airway opening and arterial hemorrhage control',
      'Establish incident command post and safe zone'
    ],
    dispatchRecommendations: 'Trigger Disaster Mass Casualty Incident (MCI) Protocol; dispatch multiple ALS units.',
    clinicalNote: 'Requires field triage coordination and multi-hospital distribution.'
  }
};

export function matchEmergencyDomain(text: string): KnowledgeDomain {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let bestDomain: KnowledgeDomain = EMERGENCY_KNOWLEDGE_BASE.TRAUMA;

  for (const domainKey in EMERGENCY_KNOWLEDGE_BASE) {
    const domain = EMERGENCY_KNOWLEDGE_BASE[domainKey];
    let score = 0;

    for (const kw of domain.keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        score += 2;
      }
    }

    for (const rf of domain.redFlags) {
      const rfWords = rf.toLowerCase().split(' ').filter((w) => w.length > 4);
      for (const word of rfWords) {
        if (lowerText.includes(word)) {
          score += 1;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestDomain = domain;
    }
  }

  return bestDomain;
}
