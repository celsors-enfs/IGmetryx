import type { LocaleDict } from "./types";

export const en: LocaleDict = {
  locale: "en",
  stopwords: [
    "the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","up","about","into","through","during","including","against","among","throughout","despite","towards","upon","concerning","to","of","in","for","on","with","at","by","from","up","about","into","through","during","including","against","among","throughout","despite","towards","upon","concerning","i","you","he","she","it","we","they","me","him","her","us","them","my","your","his","her","its","our","their","this","that","these","those","is","am","are","was","were","be","been","being","have","has","had","having","do","does","did","doing","will","would","should","could","may","might","must","can","shall"
  ],
  ui: {
    variantA: "Variant A",
    variantB: "Variant B",
    variantC: "Variant C",
    groupBrand: "Brand",
    groupNiche: "Niche",
    groupContext: "Context",
    groupMid: "Mid-reach",
  },
  hooks: {
    friendly: [
      "Some days you just need to capture this.",
      "You know when the moment speaks for itself?",
      "A simple reminder: enjoy the now.",
      "This made me happy — and I needed that.",
      "Let me show you a little piece of my day."
    ],
    professional: [
      "Some learnings worth sharing.",
      "The main point here is simple and practical:",
      "A quick update on what worked:",
      "A snapshot of the process — with real results.",
      "What I'd do differently next time:"
    ],
    funny: [
      "Me trying to be subtle… failed.",
      "Plot twist: it worked 😅",
      "By the time I saw it, it was too late.",
      "Wasn't in the plans, but it happened.",
      "If this isn't a sign, I don't know what is."
    ],
    motivational: [
      "Small steps count too.",
      "Consistency > perfection.",
      "Go at your own pace — but go.",
      "Progress lives in the simple.",
      "If you needed a push: here it is."
    ],
    luxury: [
      "Details that change everything.",
      "Elegance is about intention.",
      "Quality you notice in the silence.",
      "Less noise, more presence.",
      "A moment of aesthetics and calm."
    ],
    educational: [
      "Quick tip that improves the result a lot:",
      "3 points for you to apply today:",
      "If you want to evolve in this, do it like this:",
      "The most common mistake here is this:",
      "A simple guide, straight to the point:"
    ],
  },
  transitions: [
    "And the best part:", "What I liked was:", "The detail is:", "In the end:", "For me, it became clear that:"
  ],
  closers: [
    "Tell me: would you do it differently?",
    "What part did you like most?",
    "Save this to remember later.",
    "If it helped you, share it with someone.",
    "Tell me in the comments what you thought."
  ],
  ctas: {
    engage: [
      "What's your opinion?",
      "Do you also like this type of content?",
      "Tell me your experience 👇",
      "Would you do it differently?",
      "Want part 2?"
    ],
    sell: [
      "If you want, I can help you with this — DM me.",
      "Want me to make a version for you?",
      "Link in bio with more details.",
      "Interested? Send me a message.",
      "Want a quote? Talk to me."
    ],
    inform: [
      "If you want the step-by-step, I'll explain.",
      "I can detail the points if you ask.",
      "Want a checklist? Comment \"CHECKLIST\".",
      "Want the references? I'll send them.",
      "If you have questions, ask here."
    ],
    community: [
      "Tag someone who will like this.",
      "Let's exchange ideas in the comments.",
      "What profile do you recommend about this?",
      "Let's build this together?",
      "If you're also in this, comment 👇"
    ],
  },
  niche: {
    general: {
      id: "general",
      vocab: ["day","moment","routine","today","life","happy","gratitude","energy","amazing","special"],
      hashtags: ["#contentcreator","#content","#instadaily","#routine","#inspiration","#tips","#community","#reels","#feed","#instagram"],
      midTags: ["#creativity","#digitalcontent","#personalbrand","#socialmedia","#engagement","#growth","#strategy"],
      emojis: ["✨","📌","💬","🤍","🚀"]
    },
    travel: {
      id: "travel",
      vocab: ["travel","trip","tourism","beach","hike","hotel","airport","city","rio","corcovado","christ","viewpoint"],
      hashtags: ["#travel","#trip","#tourism","#destinations","#traveltips","#travel","#amazingplaces","#itinerary","#trip","#wanderlust"],
      midTags: ["#familytravel","#budgettravel","#dreamtrip","#traveler","#sunset","#landscapes","#tourism"],
      emojis: ["✈️","🗺️","🌤️","🏝️","📍"]
    },
    food: {
      id: "food",
      vocab: ["food","restaurant","recipe","kitchen","lunch","dinner","dessert","coffee","bread","sweet","flavor"],
      hashtags: ["#food","#foodie","#gastronomy","#recipes","#kitchen","#homecooking","#foodie","#delicious","#instafood","#culinary"],
      midTags: ["#easyrecipe","#realfood","#cookingtips","#food","#sweets","#coffee"],
      emojis: ["🍝","🍰","☕","🍋","🥗"]
    },
    fitness: {
      id: "fitness",
      vocab: ["workout","gym","run","strength","cardio","health","energy","goal","consistency"],
      hashtags: ["#workout","#fitness","#gym","#bodybuilding","#health","#running","#healthylife","#focus","#discipline","#wellbeing"],
      midTags: ["#dailyworkout","#hypertrophy","#homeworkout","#habits","#healthyroutine","#nutrition"],
      emojis: ["💪","🏃","🔥","🥤","✅"]
    },
    beauty: {
      id: "beauty",
      vocab: ["makeup","make","skincare","skin","glow","beauty","hair","hydration","lipstick","eyeliner"],
      hashtags: ["#makeup","#makeup","#skincare","#beauty","#skin","#glow","#selfcare","#hair","#beautytips","#beauty"],
      midTags: ["#skincareroutine","#naturalmakeup","#skincare","#products","#review","#tutorial"],
      emojis: ["💄","✨","🧴","💇","🌸"]
    },
    fashion: {
      id: "fashion",
      vocab: ["look","outfit","style","fashion","trend","clothing","accessories","street","casual","elegant"],
      hashtags: ["#fashion","#ootd","#outfit","#style","#fashion","#trends","#streetstyle","#inspo","#ootd","#styling"],
      midTags: ["#capsulewardrobe","#looks","#womensfashion","#mensfashion","#accessories","#minimalstyle"],
      emojis: ["🖤","👟","🧥","✨","👜"]
    },
    business: {
      id: "business",
      vocab: ["business","clients","sales","brand","branding","strategy","company","result","process","product"],
      hashtags: ["#business","#entrepreneurship","#branding","#marketing","#sales","#brand","#strategy","#management","#startup","#business"],
      midTags: ["#positioning","#product","#growth","#communication","#planning","#valuecreation"],
      emojis: ["📈","🧠","✅","📌","🚀"]
    },
    photography: {
      id: "photography",
      vocab: ["photo","photography","lens","camera","shot","light","composition","editing","portrait","landscape"],
      hashtags: ["#photography","#photo","#photography","#camera","#portrait","#landscape","#photographers","#naturallight","#shoot","#editing"],
      midTags: ["#composition","#photooftheday","#photography","#portrait","#streetphoto","#photographer"],
      emojis: ["📷","🌤️","🎞️","✨","🖼️"]
    },
    education: {
      id: "education",
      vocab: ["class","study","learn","course","tip","explanation","guide","step","tutorial","method"],
      hashtags: ["#learning","#study","#tips","#tutorial","#course","#education","#learn","#knowledge","#teacher","#study"],
      midTags: ["#teaching","#student","#organization","#productivity","#method","#notes"],
      emojis: ["📚","✍️","🧩","💡","✅"]
    },
    music: {
      id: "music",
      vocab: ["music","sound","playlist","show","band","sing","voice","guitar","beat","rhythm"],
      hashtags: ["#music","#playlist","#show","#bands","#singer","#instrument","#sounds","#musiclover","#live","#artist"],
      midTags: ["#newmusic","#covers","#repertoire","#studio","#composition","#release"],
      emojis: ["🎵","🎤","🎸","🎧","🔥"]
    },
    art: {
      id: "art",
      vocab: ["art","illustration","drawing","painting","creative","process","studio","color","texture","style"],
      hashtags: ["#art","#illustration","#drawing","#artist","#creativity","#painting","#creativeprocess","#sketch","#colors","#art"],
      midTags: ["#study","#portfolio","#contemporaryart","#digitalart","#traditional","#inspiration"],
      emojis: ["🎨","🖌️","✨","🧡","🧩"]
    },
    tech: {
      id: "tech",
      vocab: ["app","site","code","design","product","ui","ux","startup","saas","data","analytics"],
      hashtags: ["#technology","#startup","#saas","#product","#ux","#ui","#design","#dev","#nocode","#data"],
      midTags: ["#product","#userexperience","#growth","#analytics","#coding","#tools"],
      emojis: ["💻","⚡","📊","🧠","🚀"]
    },
    realestate: {
      id: "realestate",
      vocab: ["property","house","apartment","rent","sale","realtor","visit","neighborhood","renovation","decoration"],
      hashtags: ["#realestate","#realtor","#house","#apartment","#realestatemarket","#rent","#buy","#sell","#decoration","#renovation"],
      midTags: ["#realestatetips","#investment","#architecture","#interiors","#home","#property"],
      emojis: ["🏠","🔑","📍","✨","📌"]
    },
    pets: {
      id: "pets",
      vocab: ["pet","dog","cat","puppy","play","walk","cuteness","vet","animal"],
      hashtags: ["#pets","#dog","#cat","#petlover","#doglover","#catlover","#cute","#walk","#petlife","#friendship"],
      midTags: ["#pets","#cutepuppy","#kittens","#petfriendly","#care","#training"],
      emojis: ["🐶","🐱","🦴","🤍","🐾"]
    },
    parenting: {
      id: "parenting",
      vocab: ["family","child","kid","mom","dad","routine","school","play","educate","care"],
      hashtags: ["#family","#motherhood","#fatherhood","#child","#routine","#parenting","#education","#familylife","#parenting","#kids"],
      midTags: ["#kidsroutine","#momtips","#dadtips","#happyfamily","#development","#love"],
      emojis: ["👨‍👩‍👧‍👦","🧸","🤍","✨","🫶"]
    },
  }
};




