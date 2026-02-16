/**
 * Générateur de noms de startup basé sur secteur, cible et mission
 */

// Préfixes par secteur
const SECTOR_PREFIXES: Record<string, string[]> = {
  fintech: ['Pay', 'Cash', 'Wallet', 'Finance', 'Coin', 'Credit', 'Money', 'Bank'],
  mobilite: ['Go', 'Move', 'Ride', 'Drive', 'Trip', 'Route', 'Way', 'Trans'],
  proptech: ['Home', 'Space', 'House', 'Nest', 'Roof', 'Room', 'Place', 'Live'],
  'e-commerce': ['Shop', 'Buy', 'Market', 'Store', 'Cart', 'Deal', 'Trade', 'Sell'],
  gaming: ['Play', 'Game', 'Fun', 'Quest', 'Level', 'Arena', 'Epic', 'Pro'],
  greentech: ['Eco', 'Green', 'Earth', 'Clean', 'Nature', 'Pure', 'Bio', 'Leaf'],
  foodtech: ['Food', 'Eat', 'Meal', 'Fresh', 'Taste', 'Cook', 'Dish', 'Yum'],
  'entertainment-media': ['Show', 'Play', 'Stream', 'Watch', 'View', 'Media', 'Live', 'Cast'],
  agritech: ['Agri', 'Farm', 'Crop', 'Grow', 'Harvest', 'Field', 'Seed', 'Plant'],
  cybersecurite: ['Secure', 'Safe', 'Guard', 'Shield', 'Lock', 'Protect', 'Vault', 'Cyber'],
  'energie-renouvelable': ['Power', 'Energy', 'Solar', 'Wind', 'Volt', 'Amp', 'Watt', 'Spark'],
  'sport-fitness': ['Fit', 'Sport', 'Active', 'Move', 'Train', 'Gym', 'Flex', 'Peak'],
  tourisme: ['Travel', 'Trip', 'Tour', 'Visit', 'Explore', 'Journey', 'Voyage', 'Go'],
  'mobile-telecommunications': ['Connect', 'Link', 'Call', 'Talk', 'Mobile', 'Net', 'Signal', 'Wave'],
  'logistique-supply-chain': ['Ship', 'Send', 'Deliver', 'Move', 'Track', 'Supply', 'Flow', 'Chain'],
  edtech: ['Learn', 'Teach', 'Study', 'Know', 'Skill', 'Edu', 'Smart', 'Brain'],
  'cleantech-environnement': ['Clean', 'Pure', 'Green', 'Eco', 'Fresh', 'Clear', 'Renew', 'Sustain'],
};

// Suffixes génériques
const SUFFIXES = [
  'ly', 'ify', 'hub', 'box', 'lab', 'pro', 'go', 'up',
  'link', 'wise', 'zone', 'spot', 'way', 'app', 'tech', 'ai',
];

/**
 * Génère un nom de startup basé sur le secteur
 * @param sectorId - ID du secteur
 * @returns Nom de startup généré
 */
export function generateStartupName(sectorId: string): string {
  const prefixes = SECTOR_PREFIXES[sectorId] || SECTOR_PREFIXES.fintech || ['Start'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)] || 'Start';
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)] || 'up';

  return `${prefix}${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`;
}

/**
 * Génère un ID unique pour une startup
 */
export function generateStartupId(): string {
  return `startup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Génère une idée complète de startup basée sur secteur, cible et mission
 */
export function generateStartupIdea(
  sectorId: string,
  sectorTitle: string,
  targetTitle: string,
  targetCategory: string,
  missionTitle: string,
  missionCategory: string
): { name: string; description: string; pitch: string } {
  const name = generateStartupName(sectorId);

  // Générer une description détaillée
  const description = `${name} est une startup ${sectorTitle.toLowerCase()} innovante qui cible ${targetTitle.toLowerCase()} (${targetCategory}). Notre mission est de ${missionTitle.toLowerCase()} dans le domaine ${missionCategory}.`;

  // Générer un pitch court et percutant
  const pitchTemplates = [
    `Révolutionnez ${targetCategory} avec ${name} : ${missionTitle.toLowerCase()} pour ${targetTitle.toLowerCase()}.`,
    `${name} - La solution ${sectorTitle.toLowerCase()} qui ${missionTitle.toLowerCase()} pour ${targetTitle.toLowerCase()}.`,
    `Transformez ${targetCategory} grâce à ${name} : ${missionTitle.toLowerCase()} de manière innovante.`,
    `${name} : ${missionTitle} ${targetTitle.toLowerCase()} dans l'univers ${sectorTitle.toLowerCase()}.`,
  ];

  const pitch = pitchTemplates[Math.floor(Math.random() * pitchTemplates.length)] || pitchTemplates[0]!;

  return { name, description, pitch };
}
