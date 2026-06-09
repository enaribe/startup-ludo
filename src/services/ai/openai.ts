// OpenAI Service – GPT-4o-mini for startup idea generation

export interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
}

export interface ValuationFactor {
  label: string;
  /** Effet du facteur (ex: "+25%", "-10%", "10 Ptw") */
  value: string;
}

export interface GeneratedValuation {
  /** Montant final, valeur interne en FCFA (1000 FCFA = 1 Ptw) */
  valorisation: number;
  /** Phrase courte expliquant le raisonnement */
  explanation: string;
  /** Détail des facteurs ayant contribué au calcul (3 à 5 lignes) */
  factors: ValuationFactor[];
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY;
}

/**
 * Nettoie un nom de projet généré par l'IA pour ne garder qu'un nom de marque
 * court, même si l'IA a renvoyé une expression explicative.
 * Ex: "EcoFarm : la solution agricole connectée" → "EcoFarm"
 *     "Payio - paiements mobiles" → "Payio"
 *     "AgriLink, votre partenaire" → "AgriLink"
 */
function sanitizeStartupName(rawTitle: string): string {
  let name = (rawTitle ?? '').trim();

  // Retire d'éventuels guillemets/markdown autour du nom
  name = name.replace(/^["'«»*`]+|["'«»*`]+$/g, '').trim();

  // Coupe au premier séparateur explicatif : deux-points, tiret entouré
  // d'espaces (- ou — ou –), ou virgule. On ne garde que la partie avant.
  const sepMatch = name.split(/\s*[:：]\s*|\s+[-—–]\s+|\s*,\s*/);
  if (sepMatch.length > 0 && sepMatch[0]) {
    name = sepMatch[0].trim();
  }

  // Limite à 3 mots maximum (garde-fou contre les slogans restants)
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > 3) {
    name = words.slice(0, 3).join(' ');
  }

  // Retire la ponctuation finale résiduelle
  name = name.replace(/[.!?…\-–—,;:]+$/g, '').trim();

  // Garde-fou longueur : tronque proprement à 24 caractères
  if (name.length > 24) {
    name = name.slice(0, 24).trim();
  }

  return name;
}

/**
 * Generate 3 startup ideas using GPT-4o-mini based on target, mission, and sector.
 * Returns null if the API call fails (caller should fallback to mock).
 */
export async function generateStartupIdeas(
  target?: string,
  mission?: string,
  sector?: string
): Promise<GeneratedIdea[] | null> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'sk-your-api-key-here') {
    console.warn('[AI] No valid OpenAI API key found, skipping generation');
    return null;
  }

  const t = target || 'un public large';
  const m = mission || 'résoudre un problème courant';
  const s = sector || 'technologie';

  const systemPrompt = `Tu es un expert en création de startups africaines innovantes. Tu génères des idées de startup créatives, réalistes et adaptées au marché africain. Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires.`;

  const userPrompt = `Génère exactement 3 idées de startup basées sur ces paramètres :
- Cible : ${t}
- Mission : ${m}
- Secteur : ${s}

RÈGLE IMPORTANTE sur le champ "title" :
- Ce doit être un VRAI NOM DE MARQUE : un seul mot, ou deux mots courts collés (ex: "AgriLink", "Payio", "EcoFarm", "Wari", "Sokoni").
- INTERDIT : phrases, slogans, descriptions, deux-points, tirets explicatifs. PAS de "Nom : description", PAS de "Nom - la solution qui...".
- Maximum 3 mots, 20 caractères. Le nom seul, rien d'autre.
- La description (1-2 phrases) va UNIQUEMENT dans le champ "description", jamais dans "title".

Réponds avec ce format JSON exact :
{"ideas":[{"title":"NomDeMarque","description":"Description en 1-2 phrases"},{"title":"NomDeMarque","description":"Description en 1-2 phrases"},{"title":"NomDeMarque","description":"Description en 1-2 phrases"}]}`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      console.warn('[AI] OpenAI API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[AI] Empty response from OpenAI');
      return null;
    }

    // Parse the JSON response
    const parsed = JSON.parse(content) as { ideas: { title: string; description: string }[] };
    if (!parsed.ideas || !Array.isArray(parsed.ideas) || parsed.ideas.length === 0) {
      console.warn('[AI] Invalid response structure');
      return null;
    }

    return parsed.ideas.map((idea, index) => {
      const cleaned = sanitizeStartupName(idea.title);
      return {
        id: String(index + 1),
        // Repli sur le titre brut si le nettoyage donne une chaîne vide
        title: cleaned || (idea.title ?? '').trim(),
        description: idea.description,
      };
    });
  } catch (error) {
    console.warn('[AI] Generation failed:', error);
    return null;
  }
}

/**
 * Generate an initial valuation for a startup using GPT-4o-mini.
 * Takes into account the cards chosen, name and description.
 * Returns null if the API call fails (caller should fallback to multiplier-based algo).
 *
 * Devise du jeu : le Petaw (Ptw), 1000 FCFA = 1 Ptw.
 * L'IA raisonne en Petaw (8 à 35 Ptw) ; on reconvertit en FCFA (valeur interne) au retour.
 */
export async function generateValuation(input: {
  target?: string;
  mission?: string;
  sector?: string;
  startupName: string;
  startupDescription?: string;
}): Promise<GeneratedValuation | null> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'sk-your-api-key-here') {
    console.warn('[AI] No valid OpenAI API key found, skipping valuation generation');
    return null;
  }

  const target = input.target || 'un public large';
  const mission = input.mission || 'résoudre un problème courant';
  const sector = input.sector || 'technologie';
  const description = input.startupDescription || 'aucune description fournie';

  const systemPrompt = `Tu es un analyste financier expert des startups africaines. Tu attribues des valorisations initiales réalistes adaptées au marché sénégalais. Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires.`;

  const userPrompt = `Analyse cette startup et propose une valorisation initiale en Petaw (Ptw), la devise du jeu.

Paramètres :
- Nom : ${input.startupName}
- Description : ${description}
- Cible : ${target}
- Mission : ${mission}
- Secteur : ${sector}

Règles :
- La valorisation doit être entre 8 et 35 Ptw
- Prends en compte la cohérence entre cible/mission/secteur, l'originalité, le potentiel marché au Sénégal
- Bonus pour les combinaisons cohérentes et originales, malus pour les combinaisons confuses
- Fournis 3 à 5 facteurs explicites (ex: "Cohérence cible/mission", "Secteur porteur", "Originalité")
- L'explication doit être en 1-2 phrases courtes, ton pédagogique, en français

Réponds avec ce format JSON exact (la valorisation est un nombre de Petaw) :
{
  "valorisation": 18.5,
  "explanation": "Phrase courte expliquant le raisonnement",
  "factors": [
    {"label": "Base", "value": "10 Ptw"},
    {"label": "Cohérence cible/mission", "value": "+30%"},
    {"label": "Secteur porteur", "value": "+25%"}
  ]
}`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      console.warn('[AI] OpenAI valuation API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[AI] Empty response from OpenAI (valuation)');
      return null;
    }

    const parsed = JSON.parse(content) as GeneratedValuation;
    if (
      typeof parsed.valorisation !== 'number' ||
      !parsed.explanation ||
      !Array.isArray(parsed.factors) ||
      parsed.factors.length === 0
    ) {
      console.warn('[AI] Invalid valuation response structure');
      return null;
    }

    // L'IA raisonne en Petaw (8 à 35 Ptw). On borne en Petaw puis on reconvertit
    // en FCFA (valeur interne, 1000 FCFA = 1 Ptw) pour rester compatible avec le stockage.
    const ptwClamped = Math.max(8, Math.min(35, parsed.valorisation));
    const valorisationFcfa = Math.round(ptwClamped * 1000);

    return {
      valorisation: valorisationFcfa,
      explanation: parsed.explanation,
      factors: parsed.factors.slice(0, 5),
    };
  } catch (error) {
    console.warn('[AI] Valuation generation failed:', error);
    return null;
  }
}
