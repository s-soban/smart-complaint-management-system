import dotenv from 'dotenv';
dotenv.config();

export interface CategoryPrediction {
  categoryId: number;
  categoryName: string;
  confidence: number;
  reasoning: string;
}

export interface PriorityUrgencyResult {
  priority: 'critical' | 'high' | 'medium' | 'low';
  urgencyScore: number;
  reason: string;
}

export interface DuplicateMatchResult {
  complaintId: string;
  title: string;
  similarityScore: number;
  categoryName: string;
  status: string;
  location: string;
  reason: string;
}

// Domain Category Map for NLP matching
const CATEGORY_KEYWORD_MAP: Record<string, { id: number; keywords: string[] }> = {
  'Electrical': {
    id: 1,
    keywords: ['fan', 'light', 'bulb', 'switch', 'socket', 'plug', 'wiring', 'power', 'fuse', 'spark', 'blackout', 'short circuit', 'current', 'ac', 'voltage', 'circuit breaker', 'lamp', 'generator', 'choke']
  },
  'Plumbing': {
    id: 2,
    keywords: ['water', 'leak', 'tap', 'faucet', 'pipe', 'drain', 'toilet', 'flush', 'sink', 'sewage', 'clog', 'overflow', 'shower', 'basin', 'leakage', 'pipeline', 'tank']
  },
  'Internet / Network': {
    id: 3,
    keywords: ['wifi', 'internet', 'network', 'router', 'connection', 'ethernet', 'lan', 'bandwidth', 'offline', 'signal', 'access point', 'port', 'speed', 'cable']
  },
  'Classroom': {
    id: 4,
    keywords: ['projector', 'blackboard', 'whiteboard', 'podium', 'marker', 'desk', 'bench', 'duster', 'stage', 'smart board', 'lecture hall', 'speaker']
  },
  'Laboratory': {
    id: 5,
    keywords: ['lab', 'microscope', 'chemical', 'equipment', 'oscilloscope', 'fume hood', 'bunsen', 'apparatus', 'computer lab', 'glassware', 'centrifuge', 'sensor']
  },
  'Hostel': {
    id: 6,
    keywords: ['bed', 'mattress', 'cupboard', 'lock', 'door', 'balcony', 'mess', 'dorm', 'geyser', 'curtain', 'key', 'wardrobe']
  },
  'Washroom': {
    id: 7,
    keywords: ['bathroom', 'restroom', 'washroom', 'soap', 'towel', 'mirror', 'urinal', 'toilet paper', 'hand dryer', 'smell', 'hygiene']
  },
  'Furniture': {
    id: 8,
    keywords: ['chair', 'table', 'bench', 'desk', 'broken leg', 'stool', 'cupboard', 'armrest', 'board', 'cushion', 'drawer', 'shelf']
  },
  'Security': {
    id: 9,
    keywords: ['guard', 'gate', 'camera', 'cctv', 'theft', 'unauthorized', 'stolen', 'broken lock', 'stranger', 'patrol', 'fence', 'intrusion', 'emergency']
  },
  'Cleaning / Sanitation': {
    id: 10,
    keywords: ['dustbin', 'garbage', 'trash', 'waste', 'dirty', 'sweep', 'mop', 'cobweb', 'dust', 'cleaning', 'stain', 'sanitize', 'trash can']
  },
  'Roads / Parking': {
    id: 11,
    keywords: ['pothole', 'parking', 'vehicle', 'speed bump', 'asphalt', 'pathway', 'bike', 'car', 'gate', 'lamp post', 'street light']
  },
  'Library': {
    id: 12,
    keywords: ['book', 'reading room', 'cubicle', 'bookshelf', 'catalog', 'quiet zone', 'scanner', 'printer']
  },
  'Sports Facilities': {
    id: 13,
    keywords: ['gym', 'court', 'field', 'net', 'turf', 'pool', 'racquet', 'ball', 'treadmill', 'track']
  },
  'Water Supply': {
    id: 14,
    keywords: ['drinking water', 'purifier', 'ro', 'water cooler', 'water tank', 'no water', 'dirty water', 'water supply']
  },
  'Air Conditioning': {
    id: 15,
    keywords: ['ac', 'air conditioner', 'cooling', 'hvac', 'chiller', 'freon', 'thermostat', 'hot air', 'no cooling']
  },
  'Other': {
    id: 16,
    keywords: []
  }
};

// Heuristic Priority hazard keywords
const CRITICAL_KEYWORDS = ['spark', 'fire', 'smoke', 'short circuit', 'exposed wire', 'burning', 'gas leak', 'major overflow', 'security breach', 'theft', 'structural collapse', 'hazard', 'emergency', 'electric shock'];
const HIGH_KEYWORDS = ['no water', 'blackout', 'wifi down', 'no power', 'broken lock', 'flooding', 'unusable', 'severely broken', 'sewage leak', 'exam room'];

/**
 * Predict complaint category based on description & title text
 */
export function predictCategory(title: string, description: string): CategoryPrediction {
  const text = `${title} ${description}`.toLowerCase();
  let bestCategory = 'Other';
  let bestId = 16;
  let maxMatches = 0;

  for (const [catName, config] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    if (catName === 'Other') continue;
    let matches = 0;
    for (const kw of config.keywords) {
      if (text.includes(kw)) {
        // Give higher weight if match occurs in title
        matches += title.toLowerCase().includes(kw) ? 2 : 1;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = catName;
      bestId = config.id;
    }
  }

  const confidence = maxMatches > 0 ? Math.min(65 + maxMatches * 10, 98) : 50;
  const reasoning = maxMatches > 0 
    ? `NLP detected keywords associated with ${bestCategory} infrastructure (confidence ${confidence}%).`
    : `General text classification assigned default category based on content.`;

  return {
    categoryId: bestId,
    categoryName: bestCategory,
    confidence,
    reasoning
  };
}

/**
 * Calculate Priority (Critical, High, Medium, Low) and Urgency Score (0-100)
 */
export function calculatePriorityAndUrgency(
  title: string,
  description: string,
  categoryId: number,
  buildingName?: string,
  roomArea?: string
): PriorityUrgencyResult {
  const text = `${title} ${description} ${buildingName || ''} ${roomArea || ''}`.toLowerCase();

  let score = 40; // Default baseline score for Medium priority
  let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  const reasons: string[] = [];

  // Check critical keywords
  let hasCritical = false;
  for (const kw of CRITICAL_KEYWORDS) {
    if (text.includes(kw)) {
      hasCritical = true;
      reasons.push(`Contains critical safety hazard keyword ("${kw}")`);
      break;
    }
  }

  if (hasCritical) {
    score = 92 + Math.floor(Math.random() * 8); // 92 - 100
    priority = 'critical';
  } else {
    // Check high keywords
    let hasHigh = false;
    for (const kw of HIGH_KEYWORDS) {
      if (text.includes(kw)) {
        hasHigh = true;
        reasons.push(`Contains high-impact operational issue keyword ("${kw}")`);
        break;
      }
    }

    if (hasHigh) {
      score = 75 + Math.floor(Math.random() * 12); // 75 - 87
      priority = 'high';
    } else {
      // Category specific weights
      if ([1, 2, 9, 14, 15].includes(categoryId)) { // Electrical, Plumbing, Security, Water, AC
        score += 15;
        reasons.push(`Category entails essential utility infrastructure`);
      }

      // Room criticality boost
      if (text.includes('exam') || text.includes('server') || text.includes('lab') || text.includes('auditorium')) {
        score += 15;
        reasons.push(`High impact location detected (Lab/Server/Exam area)`);
      }

      if (score >= 70) {
        priority = 'high';
      } else if (score >= 40) {
        priority = 'medium';
      } else {
        priority = 'low';
      }
    }
  }

  if (reasons.length === 0) {
    reasons.push(`Standard maintenance request rating based on facility category and reported symptoms.`);
  }

  return {
    priority,
    urgencyScore: Math.min(100, Math.max(10, score)),
    reason: reasons.join('; ')
  };
}

/**
 * Text Similarity helper using Word Set Intersection / Cosine Jaccard + Levenshtein distance
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const clean1 = text1.toLowerCase().replace(/[^\w\s]/g, '');
  const clean2 = text2.toLowerCase().replace(/[^\w\s]/g, '');

  if (clean1 === clean2) return 1.0;

  const words1 = new Set(clean1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(clean2.split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  const jaccard = intersection / union;

  return jaccard;
}

/**
 * Detect Duplicate and Similar Complaints
 */
export function detectDuplicatesAndSimilar(
  title: string,
  description: string,
  buildingId: number,
  roomArea: string,
  existingComplaints: any[]
): DuplicateMatchResult[] {
  const matches: DuplicateMatchResult[] = [];
  const currentText = `${title} ${description}`;
  const currentRoom = roomArea.toLowerCase().replace(/\s+/g, '');

  for (const item of existingComplaints) {
    // Skip resolved/closed complaints older than 30 days unless direct match
    if (item.status === 'closed' || item.status === 'rejected') continue;

    const existingText = `${item.title} ${item.description}`;
    const existingRoom = (item.room_area || '').toLowerCase().replace(/\s+/g, '');
    const isSameBuilding = item.building_id === buildingId;
    const isSameRoom = currentRoom && existingRoom && (currentRoom.includes(existingRoom) || existingRoom.includes(currentRoom));

    const textSim = calculateTextSimilarity(currentText, existingText);

    let compositeScore = textSim * 60; // Up to 60% from text match

    if (isSameBuilding) compositeScore += 20; // 20% for same building
    if (isSameRoom) compositeScore += 20; // 20% for same room

    // If similarity >= 45%, record as duplicate/similar match candidate
    if (compositeScore >= 45) {
      const matchScoreRounded = Math.min(99, Math.round(compositeScore));
      let matchReason = '';
      if (isSameBuilding && isSameRoom) {
        matchReason = `Identical location (${item.building_name || 'Building'} - ${item.room_area}) with ${Math.round(textSim * 100)}% text similarity`;
      } else if (isSameBuilding) {
        matchReason = `Same building with matching symptoms (${Math.round(textSim * 100)}% text similarity)`;
      } else {
        matchReason = `Semantically similar issue description (${Math.round(textSim * 100)}% text match)`;
      }

      matches.push({
        complaintId: item.id,
        title: item.title,
        similarityScore: matchScoreRounded,
        categoryName: item.category_name || 'General',
        status: item.status,
        location: `${item.building_name || 'Building'} - ${item.room_area}`,
        reason: matchReason
      });
    }
  }

  // Sort by highest similarity
  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Generate Smart Institutional Recommendations based on Complaint Clusters
 */
export function generateCampusInsights(complaints: any[]): Array<{
  type: 'warning' | 'alert' | 'info';
  title: string;
  description: string;
  location: string;
  recommendedAction: string;
}> {
  const buildingCounts: Record<string, { count: number; categories: Record<string, number>; critical: number }> = {};

  for (const c of complaints) {
    const bName = c.building_name || 'Unknown Building';
    if (!buildingCounts[bName]) {
      buildingCounts[bName] = { count: 0, categories: {}, critical: 0 };
    }
    buildingCounts[bName].count++;
    if (c.priority === 'critical') buildingCounts[bName].critical++;
    const cat = c.category_name || 'General';
    buildingCounts[bName].categories[cat] = (buildingCounts[bName].categories[cat] || 0) + 1;
  }

  const insights: Array<{
    type: 'warning' | 'alert' | 'info';
    title: string;
    description: string;
    location: string;
    recommendedAction: string;
  }> = [];

  for (const [bName, stats] of Object.entries(buildingCounts)) {
    if (stats.count >= 4) {
      // Find top category
      let topCat = '';
      let topCatCount = 0;
      for (const [cat, cnt] of Object.entries(stats.categories)) {
        if (cnt > topCatCount) {
          topCatCount = cnt;
          topCat = cat;
        }
      }

      if (topCatCount >= 3) {
        insights.push({
          type: topCatCount >= 5 ? 'alert' : 'warning',
          title: `Potential Recurring ${topCat} Infrastructure Defect`,
          description: `${bName} has registered ${topCatCount} ${topCat} complaints in the recent reporting period. This suggests an underlying systemic failure rather than isolated incidents.`,
          location: bName,
          recommendedAction: `Schedule a comprehensive maintenance audit for the ${topCat} system across ${bName}.`
        });
      }
    }

    if (stats.critical >= 2) {
      insights.push({
        type: 'alert',
        title: `High Density of Critical Safety Hazards`,
        description: `${bName} has ${stats.critical} active Critical priority complaints requiring immediate intervention.`,
        location: bName,
        recommendedAction: `Deploy emergency response maintenance team to ${bName} immediately.`
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Normal Operations Detected',
      description: 'Complaint distribution across campus facilities is balanced without abnormal cluster spikes.',
      location: 'Campus-wide',
      recommendedAction: 'Maintain standard routine maintenance inspection schedules.'
    });
  }

  return insights;
}

/**
 * Suggest technical resolution based on reported category & symptoms
 */
export function suggestResolution(title: string, description: string, categoryName: string): string {
  const text = `${title} ${description}`.toLowerCase();

  if (categoryName === 'Electrical' || text.includes('fan') || text.includes('light')) {
    return 'Inspected power supply line, replaced blown fuse / faulty capacitor, tested voltage output, and restored full operation.';
  }
  if (categoryName === 'Plumbing' || text.includes('water') || text.includes('leak')) {
    return 'Replaced damaged valve gasket, cleared pipe blockage, sealed joints with Teflon tape, and verified leak-free water pressure.';
  }
  if (categoryName === 'Internet / Network' || text.includes('wifi')) {
    return 'Rebooted access point switch, reconfigured IP subnet allocation, replaced crimped RJ-45 cable patch, and confirmed stable 100Mbps connection.';
  }
  if (categoryName === 'Air Conditioning' || text.includes('ac')) {
    return 'Cleaned evaporator air filter, recharged refrigerant levels, repaired thermostat sensor wiring, and checked cooling temperature.';
  }
  
  return 'Inspected reported site, executed necessary physical repairs/replacements, conducted quality testing, and confirmed complete operational status.';
}
