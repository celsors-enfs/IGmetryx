import type { LocaleDict } from "./types";

export const ptBR: LocaleDict = {
  locale: "pt-BR",
  stopwords: [
    "a","o","os","as","um","uma","uns","umas","de","do","da","dos","das","em","no","na","nos","nas",
    "pra","para","por","com","sem","e","ou","que","se","ao","à","às","é","foi","ser","estar","tá",
    "meu","minha","meus","minhas","seu","sua","seus","suas","eu","você","vocês","ele","ela","eles","elas",
    "isso","essa","esse","aqui","ali","lá","muito","mais","menos","bem","também","já","hoje","ontem"
  ],
  ui: {
    variantA: "Variação A",
    variantB: "Variação B",
    variantC: "Variação C",
    groupBrand: "Marca",
    groupNiche: "Nicho",
    groupContext: "Contexto",
    groupMid: "Alcance médio",
  },
  hooks: {
    friendly: [
      "Tem dias que a gente só precisa registrar isso.",
      "Sabe quando o momento fala por si?",
      "Um lembrete simples: aproveita o agora.",
      "Isso aqui me deixou feliz — e eu precisava.",
      "Deixa eu te mostrar um pedacinho do meu dia."
    ],
    professional: [
      "Alguns aprendizados que valem compartilhar.",
      "O ponto principal aqui é simples e prático:",
      "Uma atualização rápida sobre o que funcionou:",
      "Um recorte do processo — com resultado real.",
      "O que eu faria diferente da próxima vez:"
    ],
    funny: [
      "Eu tentando ser discreto(a)… falhei.",
      "Plot twist: deu certo 😅",
      "Quando eu vi, já era tarde.",
      "Não estava nos planos, mas aconteceu.",
      "Se isso não é um sinal, eu não sei o que é."
    ],
    motivational: [
      "Pequenos passos também contam.",
      "Consistência > perfeição.",
      "Vai no seu ritmo — mas vai.",
      "O progresso mora no simples.",
      "Se você precisava de um empurrão: aqui está."
    ],
    luxury: [
      "Detalhes que mudam tudo.",
      "Elegância é sobre intenção.",
      "Qualidade que se percebe no silêncio.",
      "Menos ruído, mais presença.",
      "Um momento de estética e calma."
    ],
    educational: [
      "Dica rápida que melhora muito o resultado:",
      "3 pontos pra você aplicar hoje:",
      "Se você quer evoluir nisso, faça assim:",
      "O erro mais comum aqui é este:",
      "Um guia simples, direto ao ponto:"
    ],
  },
  transitions: [
    "E o melhor:", "O que eu gostei foi:", "O detalhe é que:", "No fim das contas:", "Pra mim, ficou claro que:"
  ],
  closers: [
    "Conta aqui: você faria diferente?",
    "Qual parte você mais curtiu?",
    "Salva pra lembrar depois.",
    "Se te ajudou, compartilha com alguém.",
    "Me diz nos comentários o que você achou."
  ],
  ctas: {
    engage: [
      "Qual a sua opinião?",
      "Você também curte esse tipo de conteúdo?",
      "Me conta sua experiência 👇",
      "Você faria de outro jeito?",
      "Quer parte 2?"
    ],
    sell: [
      "Se você quiser, eu te ajudo com isso — chama no direct.",
      "Quer que eu faça uma versão pra você?",
      "Tem link na bio com mais detalhes.",
      "Se interessou? Me manda uma mensagem.",
      "Quer orçamento? Fala comigo."
    ],
    inform: [
      "Se quiser o passo a passo, eu explico.",
      "Posso detalhar os pontos se você pedir.",
      "Quer um checklist? Comenta \"CHECKLIST\".",
      "Quer as referências? Eu mando.",
      "Se tiver dúvidas, pergunta aqui."
    ],
    community: [
      "Marca alguém que vai curtir.",
      "Vamos trocar ideia nos comentários.",
      "Qual perfil você recomenda sobre isso?",
      "Bora construir isso junto?",
      "Se você também tá nessa, comenta 👇"
    ],
  },
  niche: {
    general: {
      id: "general",
      vocab: ["dia","momento","rotina","hoje","vida","feliz","gratidão","energia","incrível","especial"],
      hashtags: ["#criadoresdeconteudo","#conteudo","#instadiario","#rotina","#inspiração","#dicas","#community","#reelsbr","#feed","#instagrambr"],
      midTags: ["#criatividade","#conteudodigital","#marcapessoal","#socialmedia","#engajamento","#crescimento","#estrategia"],
      emojis: ["✨","📌","💬","🤍","🚀"]
    },
    travel: {
      id: "travel",
      vocab: ["viagem","viajar","turismo","praia","trilha","hotel","aeroporto","cidade","rio","corcovado","cristo","mirante"],
      hashtags: ["#viagem","#viajar","#turismo","#destinos","#dicadeviagem","#viagembr","#lugaresincriveis","#roteiro","#trip","#wanderlust"],
      midTags: ["#viagememfamilia","#viagembarata","#viagemdossonhos","#viajante","#pordosol","#paisagens","#turismobrasil"],
      emojis: ["✈️","🗺️","🌤️","🏝️","📍"]
    },
    food: {
      id: "food",
      vocab: ["comida","restaurante","receita","cozinha","almoço","jantar","sobremesa","café","pão","doce","sabor"],
      hashtags: ["#comida","#food","#gastronomia","#receitas","#cozinha","#comidacaseira","#foodie","#delicia","#instafood","#culinaria"],
      midTags: ["#receitafacil","#comidadeverdade","#dicasdecozinha","#comidabrasileira","#doces","#cafezinho"],
      emojis: ["🍝","🍰","☕","🍋","🥗"]
    },
    fitness: {
      id: "fitness",
      vocab: ["treino","academia","corrida","força","cardio","saúde","energia","meta","constância"],
      hashtags: ["#treino","#fitness","#academia","#musculacao","#saude","#corrida","#vidasaudavel","#foco","#disciplina","#bemestar"],
      midTags: ["#treinodiario","#hipertrofia","#treinoemcasa","#habitos","#rotinasaudavel","#nutricao"],
      emojis: ["💪","🏃","🔥","🥤","✅"]
    },
    beauty: {
      id: "beauty",
      vocab: ["make","maquiagem","skincare","pele","glow","beleza","cabelo","hidratação","batom","delineado"],
      hashtags: ["#make","#maquiagem","#skincare","#beleza","#pele","#glow","#autocuidado","#cabelo","#dicasdebeleza","#beauty"],
      midTags: ["#rotinadeskincare","#maquiagemnatural","#cuidadoscomapele","#produtos","#resenha","#tutorial"],
      emojis: ["💄","✨","🧴","💇","🌸"]
    },
    fashion: {
      id: "fashion",
      vocab: ["look","outfit","estilo","moda","tendência","roupa","acessórios","street","casual","elegante"],
      hashtags: ["#moda","#lookdodia","#outfit","#estilo","#fashion","#tendencias","#streetstyle","#inspo","#ootd","#styling"],
      midTags: ["#capsulewardrobe","#looks","#modafeminina","#modamasculina","#acessorios","#minimalstyle"],
      emojis: ["🖤","👟","🧥","✨","👜"]
    },
    business: {
      id: "business",
      vocab: ["negócio","clientes","vendas","marca","branding","estratégia","empresa","resultado","processo","produto"],
      hashtags: ["#negocios","#empreendedorismo","#branding","#marketing","#vendas","#marca","#estrategia","#gestao","#startup","#business"],
      midTags: ["#posicionamento","#produto","#crescimento","#comunicacao","#planejamento","#criacaodevalor"],
      emojis: ["📈","🧠","✅","📌","🚀"]
    },
    photography: {
      id: "photography",
      vocab: ["foto","fotografia","lente","camera","clique","luz","composição","edição","retrato","paisagem"],
      hashtags: ["#fotografia","#foto","#photography","#camera","#retrato","#paisagem","#fotografos","#luznatural","#ensaio","#edicao"],
      midTags: ["#composicao","#fotododia","#fotografiabrasil","#portrait","#streetphoto","#fotografo"],
      emojis: ["📷","🌤️","🎞️","✨","🖼️"]
    },
    education: {
      id: "education",
      vocab: ["aula","estudo","aprender","curso","dica","explicação","guia","passo","tutorial","metodo"],
      hashtags: ["#aprendizado","#estudos","#dicas","#tutorial","#curso","#educacao","#aprender","#conhecimento","#professor","#estudar"],
      midTags: ["#didatica","#estudante","#organizacao","#produtividade","#metodo","#notas"],
      emojis: ["📚","✍️","🧩","💡","✅"]
    },
    music: {
      id: "music",
      vocab: ["música","som","playlist","show","banda","cantar","voz","violão","beat","ritmo"],
      hashtags: ["#musica","#playlist","#show","#bandas","#cantor","#instrumento","#sons","#musiclover","#aovivo","#artista"],
      midTags: ["#novamusica","#covers","#repertorio","#estudio","#composicao","#lancamento"],
      emojis: ["🎵","🎤","🎸","🎧","🔥"]
    },
    art: {
      id: "art",
      vocab: ["arte","ilustração","desenho","pintura","criativo","processo","atelier","cor","textura","estilo"],
      hashtags: ["#arte","#ilustracao","#desenho","#artista","#criatividade","#pintura","#processocriativo","#sketch","#colors","#artebrasileira"],
      midTags: ["#estudo","#portifolio","#artecontemporanea","#digitalart","#tradicional","#inspiracao"],
      emojis: ["🎨","🖌️","✨","🧡","🧩"]
    },
    tech: {
      id: "tech",
      vocab: ["app","site","código","design","produto","ui","ux","startup","saas","dados","analytics"],
      hashtags: ["#tecnologia","#startup","#saas","#product","#ux","#ui","#design","#dev","#nocode","#dados"],
      midTags: ["#produto","#experienciadousuario","#growth","#analytics","#vibecoding","#ferramentas"],
      emojis: ["💻","⚡","📊","🧠","🚀"]
    },
    realestate: {
      id: "realestate",
      vocab: ["imóvel","casa","apartamento","aluguel","venda","corretor","visita","bairro","reforma","decoração"],
      hashtags: ["#imoveis","#corretor","#casa","#apartamento","#mercadoimobiliario","#aluguel","#comprar","#vender","#decoracao","#reforma"],
      midTags: ["#dicasimobiliarias","#investimento","#arquitetura","#interiores","#home","#imovel"],
      emojis: ["🏠","🔑","📍","✨","📌"]
    },
    pets: {
      id: "pets",
      vocab: ["pet","cachorro","gato","dog","cat","filhote","brincar","passeio","fofura","veterinario"],
      hashtags: ["#pets","#cachorro","#gato","#petlover","#doglover","#catlover","#fofura","#passeio","#vidaempet","#amizade"],
      midTags: ["#petbr","#cachorrolindo","#gatinhos","#petfriendly","#cuidados","#adestramento"],
      emojis: ["🐶","🐱","🦴","🤍","🐾"]
    },
    parenting: {
      id: "parenting",
      vocab: ["família","filho","criança","mãe","pai","rotina","escola","brincadeira","educar","cuidado"],
      hashtags: ["#familia","#maternidade","#paternidade","#crianca","#rotina","#paisefilhos","#educacao","#vidaemfamilia","#parenting","#kids"],
      midTags: ["#rotinainfantil","#dicasdeMae","#dicasdePai","#familiafeliz","#desenvolvimento","#carinho"],
      emojis: ["👨‍👩‍👧‍👦","🧸","🤍","✨","🫶"]
    },
  }
};




