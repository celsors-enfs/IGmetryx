import type { LocaleDict } from "./types";

export const fr: LocaleDict = {
  locale: "fr",
  stopwords: [
    "le","la","les","un","une","des","de","du","de la","des","en","dans","sur","sous","avec","sans","pour","par","vers","à","au","aux",
    "et","ou","que","qui","quoi","dont","où","ce","cette","ces","il","elle","ils","elles","je","tu","nous","vous","on",
    "mon","ma","mes","ton","ta","tes","son","sa","ses","notre","nos","votre","vos","leur","leurs",
    "ceci","cela","ici","là","très","plus","moins","bien","aussi","déjà","aujourd'hui","hier"
  ],
  ui: {
    variantA: "Variante A",
    variantB: "Variante B",
    variantC: "Variante C",
    groupBrand: "Marque",
    groupNiche: "Niche",
    groupContext: "Contexte",
    groupMid: "Portée moyenne",
  },
  hooks: {
    friendly: [
      "Il y a des jours où on a juste besoin de capturer ça.",
      "Tu sais quand le moment parle de lui-même ?",
      "Un simple rappel : profite du maintenant.",
      "Ça m'a rendu heureux — et j'en avais besoin.",
      "Laisse-moi te montrer un petit morceau de ma journée."
    ],
    professional: [
      "Quelques apprentissages qui valent la peine d'être partagés.",
      "Le point principal ici est simple et pratique :",
      "Une mise à jour rapide sur ce qui a fonctionné :",
      "Un aperçu du processus — avec de vrais résultats.",
      "Ce que je ferais différemment la prochaine fois :"
    ],
    funny: [
      "Moi qui essaie d'être discret(e)… j'ai échoué.",
      "Retournement de situation : ça a marché 😅",
      "Quand je l'ai vu, c'était trop tard.",
      "Ce n'était pas prévu, mais c'est arrivé.",
      "Si ce n'est pas un signe, je ne sais pas ce que c'est."
    ],
    motivational: [
      "Les petits pas comptent aussi.",
      "Cohérence > perfection.",
      "Va à ton rythme — mais va.",
      "Le progrès vit dans le simple.",
      "Si tu avais besoin d'un coup de pouce : le voilà."
    ],
    luxury: [
      "Des détails qui changent tout.",
      "L'élégance, c'est l'intention.",
      "Une qualité qu'on remarque dans le silence.",
      "Moins de bruit, plus de présence.",
      "Un moment d'esthétique et de calme."
    ],
    educational: [
      "Astuce rapide qui améliore beaucoup le résultat :",
      "3 points à appliquer aujourd'hui :",
      "Si tu veux évoluer là-dedans, fais-le comme ça :",
      "L'erreur la plus commune ici est celle-ci :",
      "Un guide simple, droit au but :"
    ],
  },
  transitions: [
    "Et le meilleur :", "Ce que j'ai aimé, c'était :", "Le détail, c'est que :", "En fin de compte :", "Pour moi, c'est devenu clair que :"
  ],
  closers: [
    "Dis-moi : tu le ferais différemment ?",
    "Quelle partie t'a le plus plu ?",
    "Garde ça pour te rappeler plus tard.",
    "Si ça t'a aidé, partage-le avec quelqu'un.",
    "Dis-moi dans les commentaires ce que tu en as pensé."
  ],
  ctas: {
    engage: [
      "Quelle est ton opinion ?",
      "Tu aimes aussi ce type de contenu ?",
      "Raconte-moi ton expérience 👇",
      "Tu le ferais autrement ?",
      "Tu veux la partie 2 ?"
    ],
    sell: [
      "Si tu veux, je peux t'aider avec ça — écris-moi en DM.",
      "Tu veux que je fasse une version pour toi ?",
      "Lien en bio avec plus de détails.",
      "Ça t'intéresse ? Envoie-moi un message.",
      "Tu veux un devis ? Parle-moi."
    ],
    inform: [
      "Si tu veux le pas à pas, je t'explique.",
      "Je peux détailler les points si tu demandes.",
      "Tu veux un checklist ? Commente \"CHECKLIST\".",
      "Tu veux les références ? Je te les envoie.",
      "Si tu as des questions, demande ici."
    ],
    community: [
      "Tague quelqu'un qui va aimer.",
      "Échangeons des idées dans les commentaires.",
      "Quel profil tu recommandes sur ça ?",
      "On construit ça ensemble ?",
      "Si tu es aussi dedans, commente 👇"
    ],
  },
  niche: {
    general: {
      id: "general",
      vocab: ["jour","moment","routine","aujourd'hui","vie","heureux","gratitude","énergie","incroyable","spécial"],
      hashtags: ["#créateurdecontenu","#contenu","#instadaily","#routine","#inspiration","#conseils","#communauté","#reels","#feed","#instagram"],
      midTags: ["#créativité","#contenudigital","#marquepersonnelle","#réseauxsociaux","#engagement","#croissance","#stratégie"],
      emojis: ["✨","📌","💬","🤍","🚀"]
    },
    travel: {
      id: "travel",
      vocab: ["voyage","voyager","tourisme","plage","randonnée","hôtel","aéroport","ville","rio","corcovado","christ","pointdevue"],
      hashtags: ["#voyage","#voyager","#tourisme","#destinations","#conseilsdevoyage","#voyage","#lieuxincroyables","#itinéraire","#trip","#wanderlust"],
      midTags: ["#voyageenfamille","#voyagepas cher","#voyagedesrêves","#voyageur","#coucherdesoleil","#paysages","#tourisme"],
      emojis: ["✈️","🗺️","🌤️","🏝️","📍"]
    },
    food: {
      id: "food",
      vocab: ["nourriture","restaurant","recette","cuisine","déjeuner","dîner","dessert","café","pain","sucré","saveur"],
      hashtags: ["#nourriture","#foodie","#gastronomie","#recettes","#cuisine","#cuisinemaison","#foodie","#délicieux","#instafood","#culinaire"],
      midTags: ["#recettefacile","#vraienourriture","#conseilsdecuisine","#nourriture","#sucreries","#café"],
      emojis: ["🍝","🍰","☕","🍋","🥗"]
    },
    fitness: {
      id: "fitness",
      vocab: ["entraînement","gym","courir","force","cardio","santé","énergie","objectif","constance"],
      hashtags: ["#entraînement","#fitness","#gym","#musculation","#santé","#course","#viesaine","#focus","#discipline","#bienêtre"],
      midTags: ["#entraînementquotidien","#hypertrophie","#entraînementàdomicile","#habitudes","#routinesaine","#nutrition"],
      emojis: ["💪","🏃","🔥","🥤","✅"]
    },
    beauty: {
      id: "beauty",
      vocab: ["maquillage","make","skincare","peau","éclat","beauté","cheveux","hydratation","rouge à lèvres","eyeliner"],
      hashtags: ["#maquillage","#makeup","#skincare","#beauté","#peau","#glow","#soindesoi","#cheveux","#conseilsdebeauté","#beauty"],
      midTags: ["#routinedeskincare","#maquillagenaturel","#soinsdelapeau","#produits","#avis","#tutoriel"],
      emojis: ["💄","✨","🧴","💇","🌸"]
    },
    fashion: {
      id: "fashion",
      vocab: ["look","tenue","style","mode","tendance","vêtements","accessoires","street","casual","élégant"],
      hashtags: ["#mode","#ootd","#outfit","#style","#fashion","#tendances","#streetstyle","#inspo","#ootd","#styling"],
      midTags: ["#capsulewardrobe","#looks","#modeféminine","#modemasculine","#accessoires","#styleminimaliste"],
      emojis: ["🖤","👟","🧥","✨","👜"]
    },
    business: {
      id: "business",
      vocab: ["business","clients","ventes","marque","branding","stratégie","entreprise","résultat","processus","produit"],
      hashtags: ["#business","#entrepreneuriat","#branding","#marketing","#ventes","#marque","#stratégie","#gestion","#startup","#business"],
      midTags: ["#positionnement","#produit","#croissance","#communication","#planification","#créationdevaleur"],
      emojis: ["📈","🧠","✅","📌","🚀"]
    },
    photography: {
      id: "photography",
      vocab: ["photo","photographie","objectif","appareil","prise","lumière","composition","édition","portrait","paysage"],
      hashtags: ["#photographie","#photo","#photography","#appareil","#portrait","#paysage","#photographes","#lumièrenaturelle","#séance","#édition"],
      midTags: ["#composition","#photodujour","#photographie","#portrait","#streetphoto","#photographe"],
      emojis: ["📷","🌤️","🎞️","✨","🖼️"]
    },
    education: {
      id: "education",
      vocab: ["cours","étude","apprendre","formation","conseil","explication","guide","étape","tutoriel","méthode"],
      hashtags: ["#apprentissage","#étude","#conseils","#tutoriel","#formation","#éducation","#apprendre","#connaissance","#professeur","#étudier"],
      midTags: ["#didactique","#étudiant","#organisation","#productivité","#méthode","#notes"],
      emojis: ["📚","✍️","🧩","💡","✅"]
    },
    music: {
      id: "music",
      vocab: ["musique","son","playlist","concert","groupe","chanter","voix","guitare","beat","rythme"],
      hashtags: ["#musique","#playlist","#concert","#groupes","#chanteur","#instrument","#sons","#musiclover","#en direct","#artiste"],
      midTags: ["#nouvellemusique","#covers","#répertoire","#studio","#composition","#sortie"],
      emojis: ["🎵","🎤","🎸","🎧","🔥"]
    },
    art: {
      id: "art",
      vocab: ["art","illustration","dessin","peinture","créatif","processus","atelier","couleur","texture","style"],
      hashtags: ["#art","#illustration","#dessin","#artiste","#créativité","#peinture","#processuscréatif","#sketch","#couleurs","#art"],
      midTags: ["#étude","#portfolio","#artcontemporain","#digitalart","#traditionnel","#inspiration"],
      emojis: ["🎨","🖌️","✨","🧡","🧩"]
    },
    tech: {
      id: "tech",
      vocab: ["app","site","code","design","produit","ui","ux","startup","saas","données","analytics"],
      hashtags: ["#technologie","#startup","#saas","#product","#ux","#ui","#design","#dev","#nocode","#données"],
      midTags: ["#produit","#expérienceutilisateur","#croissance","#analytics","#coding","#outils"],
      emojis: ["💻","⚡","📊","🧠","🚀"]
    },
    realestate: {
      id: "realestate",
      vocab: ["bien","maison","appartement","location","vente","agent","visite","quartier","rénovation","décoration"],
      hashtags: ["#immobilier","#agent","#maison","#appartement","#marchéimmobilier","#location","#acheter","#vendre","#décoration","#rénovation"],
      midTags: ["#conseilsimmobiliers","#investissement","#architecture","#intérieurs","#home","#bien"],
      emojis: ["🏠","🔑","📍","✨","📌"]
    },
    pets: {
      id: "pets",
      vocab: ["animal","chien","chat","chiot","jouer","promenade","mignon","vétérinaire","animal"],
      hashtags: ["#animaux","#chien","#chat","#petlover","#doglover","#catlover","#mignon","#promenade","#vieanimal","#amitié"],
      midTags: ["#animaux","#chiotmignon","#chaton","#petfriendly","#soins","#dressage"],
      emojis: ["🐶","🐱","🦴","🤍","🐾"]
    },
    parenting: {
      id: "parenting",
      vocab: ["famille","enfant","kid","maman","papa","routine","école","jeu","éduquer","soin"],
      hashtags: ["#famille","#maternité","#paternité","#enfant","#routine","#parentsenfants","#éducation","#vieenfamille","#parenting","#kids"],
      midTags: ["#routineenfant","#conseilsdemaman","#conseilsdepapa","#familleheureuse","#développement","#amour"],
      emojis: ["👨‍👩‍👧‍👦","🧸","🤍","✨","🫶"]
    },
  }
};



