// OpenAI Service – GPT-4o-mini for startup idea generation

export interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY;
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

Réponds avec ce format JSON exact :
{"ideas":[{"title":"Nom court","description":"Description en 1-2 phrases"},{"title":"Nom court","description":"Description en 1-2 phrases"},{"title":"Nom court","description":"Description en 1-2 phrases"}]}`;

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

    return parsed.ideas.map((idea, index) => ({
      id: String(index + 1),
      title: idea.title,
      description: idea.description,
    }));
  } catch (error) {
    console.warn('[AI] Generation failed:', error);
    return null;
  }
}
