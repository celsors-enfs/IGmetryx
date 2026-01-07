"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.es = void 0;
exports.es = {
    locale: "es",
    stopwords: [
        "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "de la", "de los", "de las", "en", "en el", "en la", "en los", "en las",
        "para", "por", "con", "sin", "y", "o", "que", "se", "al", "a la", "a los", "a las", "es", "fue", "ser", "estar", "está",
        "mi", "mis", "tu", "tus", "su", "sus", "nuestro", "nuestra", "nuestros", "nuestras", "yo", "tú", "él", "ella", "nosotros", "nosotras", "ellos", "ellas",
        "esto", "esta", "ese", "esa", "aquí", "allí", "allá", "muy", "más", "menos", "bien", "también", "ya", "hoy", "ayer"
    ],
    ui: {
        variantA: "Variante A",
        variantB: "Variante B",
        variantC: "Variante C",
        groupBrand: "Marca",
        groupNiche: "Nicho",
        groupContext: "Contexto",
        groupMid: "Alcance medio",
    },
    hooks: {
        friendly: [
            "Hay días que solo necesitas capturar esto.",
            "¿Sabes cuando el momento habla por sí solo?",
            "Un recordatorio simple: disfruta el ahora.",
            "Esto me hizo feliz — y lo necesitaba.",
            "Déjame mostrarte un pedacito de mi día."
        ],
        professional: [
            "Algunos aprendizajes que vale la pena compartir.",
            "El punto principal aquí es simple y práctico:",
            "Una actualización rápida sobre lo que funcionó:",
            "Un recorte del proceso — con resultados reales.",
            "Lo que haría diferente la próxima vez:"
        ],
        funny: [
            "Yo intentando ser discreto(a)… fallé.",
            "Giro de trama: funcionó 😅",
            "Para cuando lo vi, ya era tarde.",
            "No estaba en los planes, pero pasó.",
            "Si esto no es una señal, no sé qué es."
        ],
        motivational: [
            "Los pasos pequeños también cuentan.",
            "Consistencia > perfección.",
            "Ve a tu ritmo — pero ve.",
            "El progreso vive en lo simple.",
            "Si necesitabas un empujón: aquí está."
        ],
        luxury: [
            "Detalles que lo cambian todo.",
            "La elegancia es sobre intención.",
            "Calidad que notas en el silencio.",
            "Menos ruido, más presencia.",
            "Un momento de estética y calma."
        ],
        educational: [
            "Consejo rápido que mejora mucho el resultado:",
            "3 puntos para que apliques hoy:",
            "Si quieres evolucionar en esto, hazlo así:",
            "El error más común aquí es este:",
            "Una guía simple, directo al grano:"
        ],
    },
    transitions: [
        "Y lo mejor:", "Lo que me gustó fue:", "El detalle es que:", "Al final:", "Para mí, quedó claro que:"
    ],
    closers: [
        "Cuéntame: ¿lo harías diferente?",
        "¿Qué parte te gustó más?",
        "Guarda esto para recordar después.",
        "Si te ayudó, compártelo con alguien.",
        "Dime en los comentarios qué pensaste."
    ],
    ctas: {
        engage: [
            "¿Cuál es tu opinión?",
            "¿También te gusta este tipo de contenido?",
            "Cuéntame tu experiencia 👇",
            "¿Lo harías de otra manera?",
            "¿Quieres parte 2?"
        ],
        sell: [
            "Si quieres, te ayudo con esto — escríbeme por DM.",
            "¿Quieres que haga una versión para ti?",
            "Link en bio con más detalles.",
            "¿Te interesó? Envíame un mensaje.",
            "¿Quieres un presupuesto? Háblame."
        ],
        inform: [
            "Si quieres el paso a paso, te explico.",
            "Puedo detallar los puntos si me pides.",
            "¿Quieres un checklist? Comenta \"CHECKLIST\".",
            "¿Quieres las referencias? Te las mando.",
            "Si tienes dudas, pregunta aquí."
        ],
        community: [
            "Etiqueta a alguien que le gustará.",
            "Vamos a intercambiar ideas en los comentarios.",
            "¿Qué perfil recomiendas sobre esto?",
            "¿Construimos esto juntos?",
            "Si también estás en esto, comenta 👇"
        ],
    },
    niche: {
        general: {
            id: "general",
            vocab: ["día", "momento", "rutina", "hoy", "vida", "feliz", "gratitud", "energía", "increíble", "especial"],
            hashtags: ["#creadordecontenido", "#contenido", "#instadaily", "#rutina", "#inspiración", "#consejos", "#comunidad", "#reels", "#feed", "#instagram"],
            midTags: ["#creatividad", "#contenidodigital", "#marcapersonal", "#redessociales", "#engagement", "#crecimiento", "#estrategia"],
            emojis: ["✨", "📌", "💬", "🤍", "🚀"]
        },
        travel: {
            id: "travel",
            vocab: ["viaje", "viajar", "turismo", "playa", "senderismo", "hotel", "aeropuerto", "ciudad", "río", "corcovado", "cristo", "mirador"],
            hashtags: ["#viaje", "#viajar", "#turismo", "#destinos", "#consejosdeviaje", "#viaje", "#lugaresincreibles", "#itinerario", "#trip", "#wanderlust"],
            midTags: ["#viajeenfamilia", "#viajebarato", "#viajedelosueños", "#viajero", "#atardecer", "#paisajes", "#turismo"],
            emojis: ["✈️", "🗺️", "🌤️", "🏝️", "📍"]
        },
        food: {
            id: "food",
            vocab: ["comida", "restaurante", "receta", "cocina", "almuerzo", "cena", "postre", "café", "pan", "dulce", "sabor"],
            hashtags: ["#comida", "#foodie", "#gastronomía", "#recetas", "#cocina", "#comidacasera", "#foodie", "#delicioso", "#instafood", "#culinaria"],
            midTags: ["#recetafácil", "#comidareal", "#consejosdecocina", "#comida", "#dulces", "#café"],
            emojis: ["🍝", "🍰", "☕", "🍋", "🥗"]
        },
        fitness: {
            id: "fitness",
            vocab: ["entrenamiento", "gimnasio", "correr", "fuerza", "cardio", "salud", "energía", "meta", "constancia"],
            hashtags: ["#entrenamiento", "#fitness", "#gimnasio", "#musculación", "#salud", "#correr", "#vidasaludable", "#enfoque", "#disciplina", "#bienestar"],
            midTags: ["#entrenamientodiario", "#hipertrofia", "#entrenamientoencasa", "#hábitos", "#rutinasaludable", "#nutrición"],
            emojis: ["💪", "🏃", "🔥", "🥤", "✅"]
        },
        beauty: {
            id: "beauty",
            vocab: ["maquillaje", "make", "skincare", "piel", "brillo", "belleza", "cabello", "hidratación", "labial", "delineador"],
            hashtags: ["#maquillaje", "#makeup", "#skincare", "#belleza", "#piel", "#glow", "#autocuidado", "#cabello", "#consejosdebelleza", "#beauty"],
            midTags: ["#rutinadeskincare", "#maquillajenatural", "#cuidadosdelapiel", "#productos", "#reseña", "#tutorial"],
            emojis: ["💄", "✨", "🧴", "💇", "🌸"]
        },
        fashion: {
            id: "fashion",
            vocab: ["look", "outfit", "estilo", "moda", "tendencia", "ropa", "accesorios", "street", "casual", "elegante"],
            hashtags: ["#moda", "#ootd", "#outfit", "#estilo", "#fashion", "#tendencias", "#streetstyle", "#inspo", "#ootd", "#styling"],
            midTags: ["#capsulewardrobe", "#looks", "#modafemenina", "#modamasculina", "#accesorios", "#estilominimalista"],
            emojis: ["🖤", "👟", "🧥", "✨", "👜"]
        },
        business: {
            id: "business",
            vocab: ["negocio", "clientes", "ventas", "marca", "branding", "estrategia", "empresa", "resultado", "proceso", "producto"],
            hashtags: ["#negocios", "#emprendimiento", "#branding", "#marketing", "#ventas", "#marca", "#estrategia", "#gestión", "#startup", "#business"],
            midTags: ["#posicionamiento", "#producto", "#crecimiento", "#comunicación", "#planificación", "#creacióndevalor"],
            emojis: ["📈", "🧠", "✅", "📌", "🚀"]
        },
        photography: {
            id: "photography",
            vocab: ["foto", "fotografía", "lente", "cámara", "disparo", "luz", "composición", "edición", "retrato", "paisaje"],
            hashtags: ["#fotografía", "#foto", "#photography", "#cámara", "#retrato", "#paisaje", "#fotógrafos", "#luznatural", "#sesión", "#edición"],
            midTags: ["#composición", "#fotodeldía", "#fotografía", "#portrait", "#streetphoto", "#fotógrafo"],
            emojis: ["📷", "🌤️", "🎞️", "✨", "🖼️"]
        },
        education: {
            id: "education",
            vocab: ["clase", "estudio", "aprender", "curso", "consejo", "explicación", "guía", "paso", "tutorial", "método"],
            hashtags: ["#aprendizaje", "#estudio", "#consejos", "#tutorial", "#curso", "#educación", "#aprender", "#conocimiento", "#profesor", "#estudiar"],
            midTags: ["#didáctica", "#estudiante", "#organización", "#productividad", "#método", "#notas"],
            emojis: ["📚", "✍️", "🧩", "💡", "✅"]
        },
        music: {
            id: "music",
            vocab: ["música", "sonido", "playlist", "show", "banda", "cantar", "voz", "guitarra", "beat", "ritmo"],
            hashtags: ["#música", "#playlist", "#show", "#bandas", "#cantante", "#instrumento", "#sonidos", "#musiclover", "#envivo", "#artista"],
            midTags: ["#nuevamúsica", "#covers", "#repertorio", "#estudio", "#composición", "#lanzamiento"],
            emojis: ["🎵", "🎤", "🎸", "🎧", "🔥"]
        },
        art: {
            id: "art",
            vocab: ["arte", "ilustración", "dibujo", "pintura", "creativo", "proceso", "estudio", "color", "textura", "estilo"],
            hashtags: ["#arte", "#ilustración", "#dibujo", "#artista", "#creatividad", "#pintura", "#procesocreativo", "#sketch", "#colores", "#arte"],
            midTags: ["#estudio", "#portafolio", "#artecontemporáneo", "#digitalart", "#tradicional", "#inspiración"],
            emojis: ["🎨", "🖌️", "✨", "🧡", "🧩"]
        },
        tech: {
            id: "tech",
            vocab: ["app", "sitio", "código", "diseño", "producto", "ui", "ux", "startup", "saas", "datos", "analytics"],
            hashtags: ["#tecnología", "#startup", "#saas", "#product", "#ux", "#ui", "#diseño", "#dev", "#nocode", "#datos"],
            midTags: ["#producto", "#experienciadeusuario", "#crecimiento", "#analytics", "#coding", "#herramientas"],
            emojis: ["💻", "⚡", "📊", "🧠", "🚀"]
        },
        realestate: {
            id: "realestate",
            vocab: ["inmueble", "casa", "apartamento", "alquiler", "venta", "corredor", "visita", "barrio", "renovación", "decoración"],
            hashtags: ["#inmuebles", "#corredor", "#casa", "#apartamento", "#mercadoinmobiliario", "#alquiler", "#comprar", "#vender", "#decoración", "#renovación"],
            midTags: ["#consejosinmobiliarios", "#inversión", "#arquitectura", "#interiores", "#home", "#inmueble"],
            emojis: ["🏠", "🔑", "📍", "✨", "📌"]
        },
        pets: {
            id: "pets",
            vocab: ["mascota", "perro", "gato", "cachorro", "jugar", "paseo", "ternura", "veterinario", "animal"],
            hashtags: ["#mascotas", "#perro", "#gato", "#petlover", "#doglover", "#catlover", "#tierno", "#paseo", "#vidamascota", "#amistad"],
            midTags: ["#mascotas", "#perrolindo", "#gatitos", "#petfriendly", "#cuidados", "#adiestramiento"],
            emojis: ["🐶", "🐱", "🦴", "🤍", "🐾"]
        },
        parenting: {
            id: "parenting",
            vocab: ["familia", "hijo", "niño", "mamá", "papá", "rutina", "escuela", "juego", "educar", "cuidado"],
            hashtags: ["#familia", "#maternidad", "#paternidad", "#niño", "#rutina", "#padresehijos", "#educación", "#vidaenfamilia", "#parenting", "#kids"],
            midTags: ["#rutinainfantil", "#consejosdemamá", "#consejosdepapá", "#familiafeliz", "#desarrollo", "#cariño"],
            emojis: ["👨‍👩‍👧‍👦", "🧸", "🤍", "✨", "🫶"]
        },
    }
};
