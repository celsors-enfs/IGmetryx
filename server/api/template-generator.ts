/**
 * Simple template-based caption and hashtag generator
 * Used as fallback when DeepSeek API is not available or fails
 */

type Language = 'pt-BR' | 'en' | 'es' | 'fr';
type Tone = 'friendly' | 'professional' | 'fun' | 'inspirational';

interface TemplateResult {
  captions: {
    short: string;
    medium: string;
    long: string;
  };
  hashtags: {
    broad: string[];
    niche: string[];
    discovery: string[];
  };
}

/**
 * Generate captions using simple templates
 */
function generateTemplateCaptions(
  topic: string,
  language: Language,
  tone: Tone,
  length: 'short' | 'medium' | 'long'
): TemplateResult {
  const templates: Record<Language, Record<Tone, (t: string) => { short: string; medium: string; long: string }>> = {
    'en': {
      'friendly': (t) => ({
        short: `Just ${t}! ✨`,
        medium: `Had an amazing time exploring ${t}. There's something special about this place that just makes you feel alive. Definitely coming back soon! 🌟`,
        long: `Just got back from ${t} and I'm still processing everything. From the moment I arrived, I knew this was going to be unforgettable. The energy, the people, the experiences - everything came together perfectly. Sometimes the best adventures happen when you least expect them. Already planning my next visit! 💫 #memories #adventure #${t.replace(/\s+/g, '')}`,
      }),
      'professional': (t) => ({
        short: `Exploring ${t} — insights and opportunities.`,
        medium: `Recent visit to ${t} revealed several interesting developments worth noting. The combination of local expertise and emerging trends creates unique opportunities for engagement and growth. Looking forward to sharing more detailed observations.`,
        long: `Following a comprehensive analysis of ${t}, several key observations emerged. The regional market dynamics, combined with evolving consumer preferences, present distinct opportunities for strategic positioning. This visit provided valuable context that will inform future decision-making processes. Detailed findings will be shared in upcoming communications.`,
      }),
      'fun': (t) => ({
        short: `${t} = 🎉🎉🎉`,
        medium: `Okay so ${t} just happened and WOW. That was absolutely wild and I'm here for it. The vibes? Immaculate. The energy? Unmatched. This is why I do what I do. Can't wait to do it again! 🔥`,
        long: `So here's the thing about ${t} - it completely exceeded every expectation I had (and trust me, they were already pretty high). Every single moment was packed with genuine good times, unexpected discoveries, and those perfect little details that make an experience truly memorable. I'm still smiling thinking about it. If you haven't checked this out yet, what are you waiting for? Seriously, add it to your list NOW. You'll thank me later! 😄✨`,
      }),
      'inspirational': (t) => ({
        short: `${t} reminds us that every journey begins with a single step.`,
        medium: `There's something profound about ${t} that speaks to the power of exploration and discovery. It teaches us that growth happens when we step outside our comfort zones and embrace new experiences. This journey has been transformative, and I'm grateful for every moment of it.`,
        long: `Reflecting on my time in ${t}, I'm reminded of how transformative travel and new experiences can be. This place has a way of opening your eyes to new possibilities, challenging your perspectives, and reminding you of what truly matters. The connections I've made, the lessons I've learned, and the moments of pure joy - these are the things that shape us. ${t} isn't just a destination; it's a catalyst for personal growth and renewal.`,
      }),
    },
    'pt-BR': {
      'friendly': (t) => ({
        short: `Acabei de visitar ${t}! ✨`,
        medium: `Que experiência incrível em ${t}! Tem algo especial neste lugar que simplesmente te faz sentir vivo. Já estou pensando em voltar em breve! 🌟`,
        long: `Acabei de voltar de ${t} e ainda estou processando tudo. Desde o momento que cheguei, sabia que seria inesquecível. A energia, as pessoas, as experiências - tudo se encaixou perfeitamente. Às vezes as melhores aventuras acontecem quando menos esperamos. Já estou planejando minha próxima visita! 💫`,
      }),
      'professional': (t) => ({
        short: `Explorando ${t} — insights e oportunidades.`,
        medium: `Visita recente a ${t} revelou desenvolvimentos interessantes que merecem atenção. A combinação de expertise local e tendências emergentes cria oportunidades únicas para engajamento e crescimento. Aguardem mais detalhes em breve.`,
        long: `Após análise abrangente de ${t}, várias observações importantes surgiram. A dinâmica do mercado regional, combinada com preferências em evolução dos consumidores, apresenta oportunidades distintas para posicionamento estratégico. Esta visita forneceu contexto valioso para processos de tomada de decisão futuros.`,
      }),
      'fun': (t) => ({
        short: `${t} = 🎉🎉🎉`,
        medium: `Ok então ${t} acabou de acontecer e nossa. Isso foi absolutamente incrível e eu tô dentro! As vibes? Impecáveis. A energia? Incomparável. É por isso que eu faço o que faço. Mal posso esperar para fazer de novo! 🔥`,
        long: `Então, sobre ${t} - superou totalmente todas as minhas expectativas (e confiem em mim, elas já eram bem altas). Cada momento foi cheio de bons momentos genuínos, descobertas inesperadas e aqueles detalhes perfeitos que tornam uma experiência verdadeiramente memorável. Ainda estou sorrindo só de pensar. Se vocês ainda não conheceram, o que estão esperando? Sério, coloquem na lista AGORA. Vão me agradecer depois! 😄✨`,
      }),
      'inspirational': (t) => ({
        short: `${t} nos lembra que toda jornada começa com um único passo.`,
        medium: `Há algo profundo em ${t} que fala sobre o poder da exploração e descoberta. Ensina que o crescimento acontece quando saímos da zona de conforto e abraçamos novas experiências. Esta jornada foi transformadora e sou grato por cada momento.`,
        long: `Refletindo sobre meu tempo em ${t}, sou lembrado de quão transformadoras podem ser viagens e novas experiências. Este lugar tem uma forma de abrir seus olhos para novas possibilidades, desafiar suas perspectivas e lembrar do que realmente importa. As conexões que fiz, as lições que aprendi e os momentos de pura alegria - estas são as coisas que nos moldam. ${t} não é apenas um destino; é um catalisador para crescimento pessoal e renovação.`,
      }),
    },
    'es': {
      'friendly': (t) => ({
        short: `¡Acabo de visitar ${t}! ✨`,
        medium: `¡Qué experiencia increíble en ${t}! Hay algo especial en este lugar que simplemente te hace sentir vivo. ¡Ya estoy pensando en volver pronto! 🌟`,
        long: `Acabo de volver de ${t} y todavía estoy procesando todo. Desde el momento que llegué, supe que sería inolvidable. La energía, la gente, las experiencias - todo encajó perfectamente. A veces las mejores aventuras suceden cuando menos lo esperamos. ¡Ya estoy planeando mi próxima visita! 💫`,
      }),
      'professional': (t) => ({
        short: `Explorando ${t} — insights y oportunidades.`,
        medium: `Visita reciente a ${t} reveló desarrollos interesantes que merecen atención. La combinación de experiencia local y tendencias emergentes crea oportunidades únicas para engagement y crecimiento. Más detalles próximamente.`,
        long: `Tras un análisis exhaustivo de ${t}, surgieron varias observaciones clave. La dinámica del mercado regional, combinada con preferencias en evolución de los consumidores, presenta oportunidades distintas para posicionamiento estratégico. Esta visita proporcionó contexto valioso para procesos futuros de toma de decisiones.`,
      }),
      'fun': (t) => ({
        short: `${t} = 🎉🎉🎉`,
        medium: `Vale, así que ${t} acaba de pasar y VAYA. Eso fue absolutamente increíble y estoy dentro. ¿Las vibras? Impecables. ¿La energía? Inigualable. Por esto hago lo que hago. ¡No puedo esperar para hacerlo de nuevo! 🔥`,
        long: `Así que esto es lo de ${t} - superó totalmente todas mis expectativas (y créeme, ya eran bastante altas). Cada momento estuvo lleno de buenos tiempos genuinos, descubrimientos inesperados y esos detalles perfectos que hacen que una experiencia sea verdaderamente memorable. Todavía estoy sonriendo solo de pensarlo. Si aún no lo has visto, ¿qué estás esperando? En serio, añádelo a tu lista AHORA. ¡Me lo agradecerás después! 😄✨`,
      }),
      'inspirational': (t) => ({
        short: `${t} nos recuerda que todo viaje comienza con un solo paso.`,
        medium: `Hay algo profundo en ${t} que habla sobre el poder de la exploración y el descubrimiento. Nos enseña que el crecimiento sucede cuando salimos de nuestra zona de confort y abrazamos nuevas experiencias. Este viaje ha sido transformador y estoy agradecido por cada momento.`,
        long: `Reflexionando sobre mi tiempo en ${t}, me recuerdo de cuán transformadores pueden ser los viajes y nuevas experiencias. Este lugar tiene una forma de abrir tus ojos a nuevas posibilidades, desafiar tus perspectivas y recordarte lo que realmente importa. Las conexiones que hice, las lecciones que aprendí y los momentos de pura alegría - estas son las cosas que nos moldean. ${t} no es solo un destino; es un catalizador para crecimiento personal y renovación.`,
      }),
    },
    'fr': {
      'friendly': (t) => ({
        short: `Je viens de visiter ${t} ! ✨`,
        medium: `Quelle expérience incroyable à ${t} ! Il y a quelque chose de spécial dans cet endroit qui vous fait simplement vous sentir vivant. Je pense déjà à revenir bientôt ! 🌟`,
        long: `Je viens de rentrer de ${t} et je traite encore tout. Dès le moment où je suis arrivé, je savais que ce serait inoubliable. L'énergie, les gens, les expériences - tout s'est parfaitement aligné. Parfois, les meilleures aventures arrivent quand on s'y attend le moins. Je planifie déjà ma prochaine visite ! 💫`,
      }),
      'professional': (t) => ({
        short: `Exploration de ${t} — insights et opportunités.`,
        medium: `Une visite récente à ${t} a révélé plusieurs développements intéressants dignes d'attention. La combinaison d'expertise locale et de tendances émergentes crée des opportunités uniques d'engagement et de croissance. Détails à suivre.`,
        long: `Suite à une analyse approfondie de ${t}, plusieurs observations clés ont émergé. La dynamique du marché régional, combinée aux préférences évolutives des consommateurs, présente des opportunités distinctes pour le positionnement stratégique. Cette visite a fourni un contexte précieux pour les processus futurs de prise de décision.`,
      }),
      'fun': (t) => ({
        short: `${t} = 🎉🎉🎉`,
        medium: `Ok donc ${t} vient de se passer et WOW. C'était absolument génial et j'en suis totalement fan. L'ambiance ? Impeccable. L'énergie ? Inégalée. C'est pour ça que je fais ce que je fais. J'ai hâte de recommencer ! 🔥`,
        long: `Donc voilà le truc avec ${t} - ça a complètement dépassé toutes mes attentes (et croyez-moi, elles étaient déjà assez élevées). Chaque moment était rempli de bons moments authentiques, de découvertes inattendues et de ces petits détails parfaits qui rendent une expérience vraiment mémorable. Je souris encore en y pensant. Si vous ne l'avez pas encore vu, qu'est-ce que vous attendez ? Sérieusement, ajoutez-le à votre liste MAINTENANT. Vous me remercierez plus tard ! 😄✨`,
      }),
      'inspirational': (t) => ({
        short: `${t} nous rappelle que chaque voyage commence par un seul pas.`,
        medium: `Il y a quelque chose de profond dans ${t} qui parle du pouvoir de l'exploration et de la découverte. Cela nous enseigne que la croissance se produit quand nous sortons de notre zone de confort et embrassons de nouvelles expériences. Ce voyage a été transformateur et je suis reconnaissant pour chaque instant.`,
        long: `En réfléchissant à mon temps à ${t}, je me rappelle à quel point les voyages et les nouvelles expériences peuvent être transformateurs. Cet endroit a une façon d'ouvrir vos yeux à de nouvelles possibilités, de défier vos perspectives et de vous rappeler ce qui compte vraiment. Les connexions que j'ai faites, les leçons que j'ai apprises et les moments de pure joie - ce sont les choses qui nous façonnent. ${t} n'est pas juste une destination ; c'est un catalyseur pour la croissance personnelle et le renouvellement.`,
      }),
    },
  };

  const generator = templates[language]?.[tone] || templates['en']['friendly'];
  const captions = generator(topic);

  // Adjust length if needed (for now all templates generate all lengths)
  return { captions, hashtags: { broad: [], niche: [], discovery: [] } };
}

/**
 * Generate hashtags based on topic
 */
function generateTemplateHashtags(
  topic: string,
  language: Language,
  hashtagCount: number
): { broad: string[]; niche: string[]; discovery: string[] } {
  // Normalize topic for hashtag generation
  const normalizedTopic = topic
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '');

  const hashtags: { broad: string[]; niche: string[]; discovery: string[] } = {
    broad: [],
    niche: [],
    discovery: [],
  };

  // Generate topic-based hashtags
  const topicHashtags = [
    `#${normalizedTopic}`,
    `#${normalizedTopic}life`,
    `#${normalizedTopic}love`,
  ].filter(Boolean);

  // Language-specific generic hashtags (avoid spam)
  const genericHashtags: Record<Language, { broad: string[]; niche: string[]; discovery: string[] }> = {
    'en': {
      broad: ['#explore', '#adventure', '#travel', '#experience', '#discover'],
      niche: ['#local', '#community', '#authentic', '#story', '#moments'],
      discovery: ['#newplaces', '#wanderlust', '#exploremore', '#travelgram', '#adventures'],
    },
    'pt-BR': {
      broad: ['#explorar', '#aventura', '#viagem', '#experiencia', '#descobrir'],
      niche: ['#local', '#comunidade', '#autentico', '#historia', '#momentos'],
      discovery: ['#lugaresnovos', '#wanderlust', '#exploremais', '#viagem', '#aventuras'],
    },
    'es': {
      broad: ['#explorar', '#aventura', '#viaje', '#experiencia', '#descubrir'],
      niche: ['#local', '#comunidad', '#autentico', '#historia', '#momentos'],
      discovery: ['#lugaresnuevos', '#wanderlust', '#exploramas', '#viaje', '#aventuras'],
    },
    'fr': {
      broad: ['#explorer', '#aventure', '#voyage', '#experience', '#decouvrir'],
      niche: ['#local', '#communaute', '#authentique', '#histoire', '#moments'],
      discovery: ['#nouveauxlieux', '#wanderlust', '#explorerplus', '#voyage', '#aventures'],
    },
  };

  const generic = genericHashtags[language] || genericHashtags['en'];

  // Distribute hashtags: 40% broad, 30% niche, 30% discovery
  const broadCount = Math.max(1, Math.floor(hashtagCount * 0.4));
  const nicheCount = Math.max(1, Math.floor(hashtagCount * 0.3));
  const discoveryCount = hashtagCount - broadCount - nicheCount;

  // Add topic-specific hashtags to niche
  hashtags.niche.push(...topicHashtags.slice(0, Math.min(3, topicHashtags.length)));
  
  // Fill remaining slots
  hashtags.broad.push(...generic.broad.slice(0, broadCount));
  hashtags.niche.push(...generic.niche.slice(0, Math.max(0, nicheCount - hashtags.niche.length)));
  hashtags.discovery.push(...generic.discovery.slice(0, discoveryCount));

  // Trim to exact counts
  return {
    broad: hashtags.broad.slice(0, broadCount),
    niche: hashtags.niche.slice(0, nicheCount),
    discovery: hashtags.discovery.slice(0, discoveryCount),
  };
}

/**
 * Main template generator function
 */
export function generateTemplates(
  topic: string,
  language: Language,
  tone: Tone,
  length: 'short' | 'medium' | 'long',
  hashtagCount: number,
  type: 'captions' | 'hashtags' | 'both'
): TemplateResult {
  const result: TemplateResult = {
    captions: {
      short: '',
      medium: '',
      long: '',
    },
    hashtags: {
      broad: [],
      niche: [],
      discovery: [],
    },
  };

  if (type === 'captions' || type === 'both') {
    const captions = generateTemplateCaptions(topic, language, tone, length);
    result.captions = captions.captions;
  }

  if (type === 'hashtags' || type === 'both') {
    result.hashtags = generateTemplateHashtags(topic, language, hashtagCount);
  }

  return result;
}

