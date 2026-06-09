/**
 * Blog UI + article copy for pt, pt-BR, it, zh-TW, th, vi, id, ru.
 * Used by scripts/merge-blog-translations.mjs
 */

function buildLocale({ marketing, seo, blog }) {
  return {
    Marketing: marketing,
    SeoPages: seo,
    Blog: blog,
  }
}

function buildArticle(fields) {
  return fields
}

function applyPtBrOverrides(locale) {
  const clone = JSON.parse(JSON.stringify(locale))
  const replace = (s) =>
    s
      .replace(/Registar-se/g, 'Cadastre-se')
      .replace(/registe-se/g, 'cadastre-se')
      .replace(/Registe-se/g, 'Cadastre-se')
      .replace(/\bo seu\b/gi, (m) => (m[0] === 'O' ? 'Seu' : 'seu'))
      .replace(/\ba sua\b/gi, (m) => (m[0] === 'A' ? 'Sua' : 'sua'))
      .replace(/\bteu\b/g, 'seu')
      .replace(/\btua\b/g, 'sua')
  const walk = (obj) => {
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string') obj[k] = replace(obj[k])
      else if (obj[k] && typeof obj[k] === 'object') walk(obj[k])
    }
  }
  walk(clone)
  return clone
}

const pt = buildLocale({
  marketing: {
    navBlog: 'Guias de viagem',
    navCommunityBlogDesc: 'Companheiros, desafios e guias locais — gratuitamente',
    footerBlog: 'Guias de viagem',
  },
  seo: {
    blogIndexTitle: 'Guias e dicas de viagem | mytripfy',
    blogIndexDesc:
      'Como encontrar companheiros de viagem, o 100 Countries Challenge e tornar-se guia local — guias gratuitos no mytripfy.',
  },
  blog: {
    indexTitle: 'Guias de viagem',
    indexSubtitle: 'Companheiros, desafios e guias locais — dicas gratuitas no mytripfy',
    readMore: 'Ler artigo',
    backToBlog: 'Todos os guias',
    joinFree: 'Registar-se grátis',
    '100-countries-challenge': buildArticle({
      title: 'O que é o 100 Countries Challenge?',
      excerpt:
        '1.600 missões em 16 categorias — países, gastronomia, monumentos e muito mais, como uma lista de desejos gamificada.',
      readMin: '6 min de leitura',
      metaTitle: 'Guia 100 Countries Challenge | mytripfy',
      metaDesc:
        'Saiba como funciona o 100 Countries Challenge no mytripfy — 1.600 missões de viagem, verificação por foto, pontos e Hall of Fame.',
      keywords: '100 countries challenge, lista de viagens, mytripfy, gamificação de viagens',
      intro:
        'O 100 Countries Challenge no mytripfy é mais do que uma lista de verificação. É um jogo comunitário que transforma cada viagem em prova, pontos e histórias para partilhar.',
      section1Title: '16 categorias, 1.600 missões',
      section1Body:
        'Escolha entre países, atrações, restaurantes, pratos, bebidas, museus, natureza, ilhas, animais, festivais, golfe, pesca, surf, esqui, mergulho e galerias de arte. Cada categoria tem 100 missões selecionadas com destinos reais.',
      section2Title: 'Como funciona a verificação',
      section2Body:
        'Visite o local, tire uma foto no próprio sítio e envie como certificação. A revisão da comunidade e as regras de disputa mantêm tudo honesto. Certificações aprovadas somam pontos ao seu perfil e ao Hall of Fame global.',
      section3Title: 'Porque o ajuda a viajar mais',
      section3Body:
        'Os desafios levam-no para além do óbvio — um mercado local, uma praia escondida, um museu que teria ignorado. Muitos membros dizem que o desafio mudou a forma como planeiam viagens.',
      section4Title: 'Começar hoje',
      section4Body:
        'Registe-se gratuitamente, abra a categoria Countries e escolha o seu primeiro país. Não precisa de visitar 100 países de uma vez — o progresso é registado missão a missão.',
      ctaTitle: 'Comece a sua primeira missão',
      ctaBody: 'Explore o desafio Countries e envie a sua primeira certificação após a próxima viagem.',
      ctaButton: 'Abrir 100 Countries',
      ctaHref: '/challenges/countries',
    }),
    'find-travel-companion': buildArticle({
      title: 'Como encontrar um companheiro de viagem com segurança',
      excerpt: 'Guia prático para combinar por destino, datas e estilo de viagem no mytripfy.',
      readMin: '5 min de leitura',
      metaTitle: 'Encontrar companheiro de viagem | mytripfy',
      metaDesc:
        'Guia passo a passo para encontrar companheiros no mytripfy — pesquisar, candidatar-se, conversar e encontrar-se com segurança com pontuação de confiança e avaliações.',
      keywords: 'encontrar companheiro de viagem, parceiro de viagem, viagem a solo, mytripfy',
      intro:
        'Viajar com o companheiro certo pode reduzir custos, a solidão e abrir experiências que perderia sozinho. Eis como fazê-lo bem no mytripfy.',
      section1Title: 'Defina a sua viagem com clareza',
      section1Body:
        'Antes de pesquisar, saiba o destino, as datas, o orçamento e o ritmo (descontraído vs intenso). Use o quiz Trip Matcher no seu perfil para que outros o encontrem mais depressa.',
      section2Title: 'Pesquise e candidate-se com cuidado',
      section2Body:
        'Pesquise companheiros por país e cidade na página inicial ou em Companions. Leia a publicação completa, verifique a pontuação de confiança e as avaliações do anfitrião e envie uma candidatura breve explicando porque combina.',
      section3Title: 'Converse antes de se comprometer',
      section3Body:
        'Use as mensagens da app para alinhar planos diários, alojamento e divisão de custos. Faça uma videochamada se possível. Nunca partilhe palavras-passe nem envie dinheiro fora dos canais acordados.',
      section4Title: 'Encontre-se em segurança e avalie depois',
      section4Body:
        'O primeiro encontro deve ser em público. Partilhe o itinerário com alguém em casa. Após a viagem, deixe uma avaliação mútua honesta — ajuda toda a comunidade.',
      ctaTitle: 'Ver viagens abertas',
      ctaBody: 'Veja quem viaja para o seu destino ou publique a sua própria viagem e deixe que os companheiros o encontrem.',
      ctaButton: 'Encontrar companheiros',
      ctaHref: '/companions',
    }),
    'become-local-guide': buildArticle({
      title: 'Como tornar-se guia local no mytripfy',
      excerpt: 'Transforme o conhecimento da sua cidade em ligações significativas — configuração, preços e dicas para boas avaliações.',
      readMin: '5 min de leitura',
      metaTitle: 'Tornar-se guia local | mytripfy',
      metaDesc:
        'Registe-se como guia local no mytripfy — defina regiões, tarifa horária, responda a pedidos e ganhe confiança através de avaliações.',
      keywords: 'tornar-se guia local, guia turístico, rendimento extra, mytripfy',
      intro:
        'Se gosta de mostrar a sua cidade aos visitantes, o mytripfy permite-lhe ligar-se diretamente a viajantes — sem intermediários de agências.',
      section1Title: 'Configure o seu perfil de guia',
      section1Body:
        'Ative o modo guia nas definições do perfil. Adicione regiões e cidades que cobre, idiomas que fala e fotos que mostrem a sua personalidade. Perfis completos recebem mais pedidos.',
      section2Title: 'Preços e disponibilidade',
      section2Body:
        'Defina uma tarifa horária na sua moeda ou ofereça encontros gratuitos se estiver a construir reputação. Seja claro sobre o que está incluído — passeio a pé, recomendações gastronómicas, ajuda com transportes.',
      section3Title: 'Responda a pedidos de guia',
      section3Body:
        'Os viajantes publicam pedidos com datas e interesses. Candidate-se com uma mensagem pessoal referindo a viagem deles. Respostas rápidas e amigáveis ganham mais reservas.',
      section4Title: 'Ganhe confiança com avaliações',
      section4Body:
        'Após cada experiência, ambas as partes deixam avaliações. Pontuações de confiança elevadas aparecem mais alto nas pesquisas. Disputas são tratadas de forma justa se algo correr mal.',
      ctaTitle: 'Registar-se como guia',
      ctaBody: 'Atualize o seu perfil e comece a receber pedidos de guia de viajantes de todo o mundo.',
      ctaButton: 'Definições de guia',
      ctaHref: '/guides',
    }),
  },
})

const it = buildLocale({
  marketing: {
    navBlog: 'Guide di viaggio',
    navCommunityBlogDesc: 'Compagni, sfide e guide locali — gratuitamente',
    footerBlog: 'Guide di viaggio',
  },
  seo: {
    blogIndexTitle: 'Guide e consigli di viaggio | mytripfy',
    blogIndexDesc:
      'Come trovare compagni di viaggio, il 100 Countries Challenge e diventare guida locale — guide gratuite su mytripfy.',
  },
  blog: {
    indexTitle: 'Guide di viaggio',
    indexSubtitle: 'Compagni, sfide e guide locali — consigli gratuiti su mytripfy',
    readMore: 'Leggi l\'articolo',
    backToBlog: 'Tutte le guide',
    joinFree: 'Iscriviti gratis',
    '100-countries-challenge': buildArticle({
      title: 'Cos\'è il 100 Countries Challenge?',
      excerpt:
        '1.600 missioni in 16 categorie — paesi, gastronomia, monumenti e altro, come una bucket list gamificata.',
      readMin: '6 min di lettura',
      metaTitle: 'Guida 100 Countries Challenge | mytripfy',
      metaDesc:
        'Scopri come funziona il 100 Countries Challenge su mytripfy — 1.600 missioni di viaggio, verifica fotografica, punti e Hall of Fame.',
      keywords: '100 countries challenge, bucket list viaggi, mytripfy, gamification viaggi',
      intro:
        'Il 100 Countries Challenge su mytripfy è più di una semplice checklist. È un gioco comunitario che trasforma ogni viaggio in prova, punti e storie da condividere.',
      section1Title: '16 categorie, 1.600 missioni',
      section1Body:
        'Scegli tra paesi, attrazioni, ristoranti, piatti, bevande, musei, natura, isole, animali, festival, golf, pesca, surf, sci, immersioni e gallerie d\'arte. Ogni categoria ha 100 missioni curate con destinazioni reali.',
      section2Title: 'Come funziona la verifica',
      section2Body:
        'Visita il luogo, scatta una foto sul posto e inviala come certificazione. La revisione della community e le regole sulle contestazioni mantengono tutto autentico. Le certificazioni approvate aggiungono punti al profilo e alla Hall of Fame globale.',
      section3Title: 'Perché ti aiuta a viaggiare di più',
      section3Body:
        'Le sfide ti spingono oltre l\'ovvio — un mercato locale, una spiaggia nascosta, un museo che avresti saltato. Molti membri dicono che la sfida ha cambiato il modo in cui pianificano i viaggi.',
      section4Title: 'Inizia oggi',
      section4Body:
        'Iscriviti gratis, apri la categoria Countries e scegli la tua prima nazione. Non serve visitare 100 paesi in una volta — i progressi si registrano missione per missione.',
      ctaTitle: 'Inizia la tua prima missione',
      ctaBody: 'Esplora la sfida Countries e invia la tua prima certificazione dopo il prossimo viaggio.',
      ctaButton: 'Apri 100 Countries',
      ctaHref: '/challenges/countries',
    }),
    'find-travel-companion': buildArticle({
      title: 'Come trovare un compagno di viaggio in sicurezza',
      excerpt: 'Guida pratica per abbinarsi per destinazione, date e stile di viaggio su mytripfy.',
      readMin: '5 min di lettura',
      metaTitle: 'Trovare un compagno di viaggio | mytripfy',
      metaDesc:
        'Guida passo passo per trovare compagni di viaggio su mytripfy — cercare, candidarsi, chattare e incontrarsi in sicurezza con punteggi di fiducia e recensioni.',
      keywords: 'trovare compagno di viaggio, compagno di viaggio, viaggio da soli, mytripfy',
      intro:
        'Viaggiare con il compagno giusto può ridurre i costi, la solitudine e sbloccare esperienze che perderesti da solo. Ecco come farlo bene su mytripfy.',
      section1Title: 'Definisci chiaramente il tuo viaggio',
      section1Body:
        'Prima di cercare, conosci destinazione, date, budget e ritmo (rilassato vs intenso). Usa il quiz Trip Matcher sul profilo così gli altri ti trovano più in fretta.',
      section2Title: 'Cerca e candidati con attenzione',
      section2Body:
        'Cerca compagni per paese e città nella homepage o nella pagina Companions. Leggi il post completo, controlla punteggio di fiducia e recensioni dell\'host, poi invia una breve candidatura spiegando perché sei adatto.',
      section3Title: 'Chatta prima di impegnarti',
      section3Body:
        'Usa i messaggi in-app per allineare piani giornalieri, alloggio e spese condivise. Fai una videochiamata se possibile. Non condividere password né inviare denaro fuori dai canali concordati.',
      section4Title: 'Incontra in sicurezza e recensisci dopo',
      section4Body:
        'Il primo incontro in un luogo pubblico. Condividi l\'itinerario con qualcuno a casa. Dopo il viaggio, lascia una recensione reciproca onesta — aiuta tutta la community.',
      ctaTitle: 'Sfoglia viaggi aperti',
      ctaBody: 'Scopri chi viaggia verso la tua destinazione o pubblica il tuo viaggio e lascia che i compagni ti trovino.',
      ctaButton: 'Trova compagni',
      ctaHref: '/companions',
    }),
    'become-local-guide': buildArticle({
      title: 'Come diventare guida locale su mytripfy',
      excerpt: 'Trasforma la conoscenza della tua città in connessioni significative — setup, prezzi e consigli per ottime recensioni.',
      readMin: '5 min di lettura',
      metaTitle: 'Diventare guida locale | mytripfy',
      metaDesc:
        'Registrati come guida locale su mytripfy — imposta regioni, tariffa oraria, rispondi alle richieste e guadagna fiducia con le recensioni.',
      keywords: 'diventare guida locale, guida turistica, reddito extra, mytripfy',
      intro:
        'Se ami mostrare la tua città ai visitatori, mytripfy ti permette di connetterti direttamente con i viaggiatori — senza intermediari di agenzie.',
      section1Title: 'Configura il profilo guida',
      section1Body:
        'Attiva la modalità guida nelle impostazioni del profilo. Aggiungi regioni e città coperte, lingue parlate e foto che mostrano la tua personalità. I profili completi ricevono più richieste.',
      section2Title: 'Prezzi e disponibilità',
      section2Body:
        'Imposta una tariffa oraria nella tua valuta o offri incontri gratuiti se stai costruendo reputazione. Sii chiaro su cosa è incluso — tour a piedi, consigli gastronomici, aiuto con i trasporti.',
      section3Title: 'Rispondi alle richieste di guida',
      section3Body:
        'I viaggiatori pubblicano richieste con date e interessi. Candidati con un messaggio personale che fa riferimento al loro viaggio. Risposte rapide e cordiali vincono più prenotazioni.',
      section4Title: 'Guadagna fiducia con le recensioni',
      section4Body:
        'Dopo ogni esperienza, entrambe le parti lasciano recensioni. Punteggi di fiducia alti compaiono più in alto nelle ricerche. Le contestazioni sono gestite in modo equo se qualcosa va storto.',
      ctaTitle: 'Registrati come guida',
      ctaBody: 'Aggiorna il profilo e inizia a ricevere richieste di guida da viaggiatori di tutto il mondo.',
      ctaButton: 'Impostazioni guida',
      ctaHref: '/guides',
    }),
  },
})

const zhTW = buildLocale({
  marketing: {
    navBlog: '旅遊指南',
    navCommunityBlogDesc: '旅伴、挑戰與在地導覽免費指南',
    footerBlog: '旅遊指南',
  },
  seo: {
    blogIndexTitle: '旅遊指南與技巧 | mytripfy',
    blogIndexDesc: '如何找旅伴、100 Countries Challenge、成為在地導覽 — mytripfy 免費指南。',
  },
  blog: {
    indexTitle: '旅遊指南',
    indexSubtitle: '旅伴、挑戰與在地導覽 — mytripfy 免費技巧',
    readMore: '閱讀文章',
    backToBlog: '全部指南',
    joinFree: '免費加入',
    '100-countries-challenge': buildArticle({
      title: '什麼是 100 Countries Challenge？',
      excerpt: '16 類 1,600 項任務 — 國家、美食、地標，像遊戲一樣的願望清單。',
      readMin: '6 分鐘閱讀',
      metaTitle: '100 Countries Challenge 指南 | mytripfy',
      metaDesc: '了解 mytripfy 100 Countries Challenge — 1,600 項旅行任務、照片認證、積分與 Hall of Fame。',
      keywords: '100 countries challenge, 旅行清單, mytripfy, 旅行遊戲化',
      intro: 'mytripfy 的 100 Countries Challenge 不只是清單，而是把每次旅行變成認證、積分與故事的社群遊戲。',
      section1Title: '16 類，1,600 項任務',
      section1Body:
        '國家、景點、餐廳、美食、飲品、博物館、自然、島嶼、動物、節慶、高爾夫、釣魚、衝浪、滑雪、潛水、美術館 — 每類 100 個精選目的地。',
      section2Title: '認證如何運作',
      section2Body:
        '到場拍照並提交認證。社群審核與爭議規則保持真實。通過後積分計入個人檔案與全球 Hall of Fame。',
      section3Title: '讓你走得更遠',
      section3Body:
        '挑戰會帶你超越常規 — 在地市場、隱秘海灘、曾跳過的博物館。許多成員說改變了旅行規劃方式。',
      section4Title: '今天就開始',
      section4Body: '免費註冊，打開 Countries 類別，選擇第一個國家。不必一次去 100 國 — 逐項累積即可。',
      ctaTitle: '開始第一項任務',
      ctaBody: '瀏覽 Countries 挑戰，下次旅行後提交第一個認證。',
      ctaButton: '打開 100 Countries',
      ctaHref: '/challenges/countries',
    }),
    'find-travel-companion': buildArticle({
      title: '如何安全找到旅行夥伴',
      excerpt: '依目的地、日期與旅行風格配對 — mytripfy 實用指南。',
      readMin: '5 分鐘閱讀',
      metaTitle: '找旅行夥伴 | mytripfy 指南',
      metaDesc: '在 mytripfy 找旅伴 — 搜尋、申請、聊天、安全見面、信任分與評價。',
      keywords: '找旅伴, 旅行夥伴, 獨自旅行, mytripfy',
      intro: '合適的旅伴能省錢、減少孤單，還能獲得獨自旅行沒有的體驗。',
      section1Title: '明確你的行程',
      section1Body: '先確定目的地、日期、預算與節奏（悠閒或緊湊）。完成 Trip Matcher 測驗更容易被找到。',
      section2Title: '謹慎瀏覽與申請',
      section2Body:
        '在首頁或 Companions 依國家城市搜尋。讀完整貼文，查看發起人信任分與評價，用簡短申請說明為何合適。',
      section3Title: '見面前先聊天',
      section3Body: '用應用程式內訊息對齊日程、住宿與費用。盡量視訊通話一次。勿分享密碼或在約定外轉帳。',
      section4Title: '安全見面，事後評價',
      section4Body: '首次見面選公共場所。把行程告訴家人。旅行後誠實互評 — 幫助整個社群。',
      ctaTitle: '瀏覽開放行程',
      ctaBody: '找去你目的地的人，或自己發文招募夥伴。',
      ctaButton: '找旅伴',
      ctaHref: '/companions',
    }),
    'become-local-guide': buildArticle({
      title: '如何在 mytripfy 成為在地導覽',
      excerpt: '把城市知識變成連結 — 設定、定價與好評技巧。',
      readMin: '5 分鐘閱讀',
      metaTitle: '成為在地導覽 | mytripfy',
      metaDesc: '在 mytripfy 註冊導覽 — 設定區域、時薪、回應請求、用評價建立信任。',
      keywords: '在地導覽, 導遊, mytripfy',
      intro: '喜歡帶訪客認識你的城市？mytripfy 讓你直接與旅行者連結，無需仲介。',
      section1Title: '設定導覽檔案',
      section1Body: '在檔案中啟用導覽模式。新增區域、語言與照片。檔案越完整，請求越多。',
      section2Title: '定價與服務範圍',
      section2Body: '設定時薪，或免費見面建立口碑。明確包含步行導覽、美食推薦、交通協助等。',
      section3Title: '回應導覽請求',
      section3Body: '旅行者發布日期與興趣。用針對其行程的私訊申請。快速友善回覆更易獲預約。',
      section4Title: '用評價建立信任',
      section4Body: '體驗後雙方互評。信任分高者搜尋更靠前。有問題時有公正爭議處理。',
      ctaTitle: '註冊為導覽',
      ctaBody: '更新檔案，開始接收全球旅行者的請求。',
      ctaButton: '導覽設定',
      ctaHref: '/guides',
    }),
  },
})

const th = buildLocale({
  marketing: {
    navBlog: 'คู่มือท่องเที่ยว',
    navCommunityBlogDesc: 'เพื่อนร่วมทาง ชาเลนจ์ และไกด์ท้องถิ่น — ฟรี',
    footerBlog: 'คู่มือท่องเที่ยว',
  },
  seo: {
    blogIndexTitle: 'คู่มือและเคล็ดลับท่องเที่ยว | mytripfy',
    blogIndexDesc:
      'วิธีหาเพื่อนร่วมทาง 100 Countries Challenge และการเป็นไกด์ท้องถิ่น — คู่มือฟรีจาก mytripfy',
  },
  blog: {
    indexTitle: 'คู่มือท่องเที่ยว',
    indexSubtitle: 'เพื่อนร่วมทาง ชาเลนจ์ และไกด์ท้องถิ่น — เคล็ดลับฟรีจาก mytripfy',
    readMore: 'อ่านบทความ',
    backToBlog: 'คู่มือทั้งหมด',
    joinFree: 'สมัครฟรี',
    '100-countries-challenge': buildArticle({
      title: '100 Countries Challenge คืออะไร?',
      excerpt: 'ภารกิจ 1,600 รายการใน 16 หมวด — ประเทศ อาหาร สถานที่ และอื่น ๆ แบบเกม bucket list',
      readMin: 'อ่าน 6 นาที',
      metaTitle: 'คู่มือ 100 Countries Challenge | mytripfy',
      metaDesc:
        'เรียนรู้ 100 Countries Challenge บน mytripfy — ภารกิจท่องเที่ยว 1,600 รายการ ยืนยันด้วยรูป คะแนน และ Hall of Fame',
      keywords: '100 countries challenge, bucket list ท่องเที่ยว, mytripfy',
      intro:
        '100 Countries Challenge บน mytripfy ไม่ใช่แค่รายการเช็ค — เป็นเกมชุมชนที่เปลี่ยนทุกทริปให้เป็นหลักฐาน คะแนน และเรื่องราวที่แชร์ได้',
      section1Title: '16 หมวด 1,600 ภารกิจ',
      section1Body:
        'เลือกจากประเทศ สถานที่ ร้านอาหาร อาหาร เครื่องดื่ม พิพิธภัณฑ์ ธรรมชาติ เกาะ สัตว์ เทศกาล กอล์ฟ ตกปลา เซิร์ฟ สกี ดำน้ำ และหอศิลป์ — แต่ละหมวดมี 100 ภารกิจคัดสรร',
      section2Title: 'การยืนยันทำงานอย่างไร',
      section2Body:
        'ไปถึงสถานที่ ถ่ายรูปหน้างาน แล้วส่งเป็นหลักฐาน ชุมชนตรวจสอบและมีกฎโต้แย้งเพื่อความจริง ผ่านแล้วได้คะแนนในโปรไฟล์และ Hall of Fame ทั่วโลก',
      section3Title: 'ช่วยให้คุณเดินทางมากขึ้น',
      section3Body:
        'ชาเลนจ์พาคุณไปไกลกว่าที่เคย — ตลาดท้องถิ่น ชายหาดลับ พิพิธภัณฑ์ที่เคยข้าม สมาชิกหลายคนบอกว่าเปลี่ยนวิธีวางแผนทริป',
      section4Title: 'เริ่มวันนี้',
      section4Body:
        'สมัครฟรี เปิดหมวด Countries แล้วเลือกประเทศแรก ไม่ต้องไปครบ 100 ประเทศทีเดียว — คืบหน้าทีละภารกิจ',
      ctaTitle: 'เริ่มภารกิจแรก',
      ctaBody: 'ดูชาเลนจ์ Countries แล้วส่งหลักฐานแรกหลังทริปถัดไป',
      ctaButton: 'เปิด 100 Countries',
      ctaHref: '/challenges/countries',
    }),
    'find-travel-companion': buildArticle({
      title: 'หาเพื่อนร่วมทางอย่างปลอดภัย',
      excerpt: 'คู่มือจับคู่ตามจุดหมาย วันที่ และสไตล์การเดินทางบน mytripfy',
      readMin: 'อ่าน 5 นาที',
      metaTitle: 'หาเพื่อนร่วมทาง | mytripfy',
      metaDesc:
        'คู่มือทีละขั้น — ค้นหา สมัคร แชท และนัดพบอย่างปลอดภัยด้วยคะแนนความน่าเชื่อถือและรีวิว',
      keywords: 'หาเพื่อนร่วมทาง, เพื่อนเดินทาง, เที่ยวคนเดียว, mytripfy',
      intro:
        'เดินทางกับคนที่ใช่ช่วยลดค่าใช้จ่าย ความเหงา และเปิดประสบการณ์ที่เที่ยวคนเดียวไม่ได้ — นี่คือวิธีทำบน mytripfy',
      section1Title: 'กำหนดทริปให้ชัด',
      section1Body:
        'ก่อนค้นหา รู้จุดหมาย วันที่ งบ และจังหวะ (สบาย ๆ หรือแน่น) ทำแบบทดสอบ Trip Matcher ในโปรไฟล์เพื่อให้คนอื่นหาคุณได้เร็วขึ้น',
      section2Title: 'ค้นหาและสมัครอย่างรอบคอบ',
      section2Body:
        'ค้นหาเพื่อนร่วมทางตามประเทศและเมืองในหน้าแรกหรือ Companions อ่านโพสต์เต็ม ดูคะแนนความน่าเชื่อถือและรีวิวของโฮสต์ แล้วส่งใบสมัครสั้น ๆ ว่าทำไมคุณเหมาะ',
      section3Title: 'แชทก่อนตัดสินใจ',
      section3Body:
        'ใช้ข้อความในแอปจัดแผนรายวัน ที่พัก และแบ่งค่าใช้จ่าย วิดีโอคอลครั้งหนึ่งถ้าได้ อย่าแชร์รหัสผ่านหรือโอนเงินนอกช่องทางที่ตกลง',
      section4Title: 'นัดพบอย่างปลอดภัย รีวิวหลังจบ',
      section4Body:
        'นัดครั้งแรกในที่สาธารณะ แชร์แผนการกับคนที่บ้าน หลังทริปรีวิวกันอย่างตรงไปตรงมา — ช่วยทั้งชุมชน',
      ctaTitle: 'ดูทริปที่เปิดรับ',
      ctaBody: 'ดูว่าใครไปจุดหมายของคุณ หรือโพสต์ทริปของคุณแล้วรอเพื่อนร่วมทาง',
      ctaButton: 'หาเพื่อนร่วมทาง',
      ctaHref: '/companions',
    }),
    'become-local-guide': buildArticle({
      title: 'วิธีเป็นไกด์ท้องถิ่นบน mytripfy',
      excerpt: 'เปลี่ยนความรู้เมืองเป็นความสัมพันธ์ — ตั้งค่า ราคา และเคล็ดลับรีวิวดี',
      readMin: 'อ่าน 5 นาที',
      metaTitle: 'เป็นไกด์ท้องถิ่น | mytripfy',
      metaDesc: 'ลงทะเบียนไกด์บน mytripfy — ตั้งพื้นที่ ค่าจ้างรายชั่วโมง ตอบคำขอ และสร้างความน่าเชื่อถือด้วยรีวิว',
      keywords: 'ไกด์ท้องถิ่น, มัคคุเทศก์, mytripfy',
      intro: 'ชอบพานักท่องเที่ยวรู้จักเมืองของคุณ? mytripfy เชื่อมต่อกับนักเดินทางโดยตรง ไม่ต้องผ่านเอเจนซี่',
      section1Title: 'ตั้งค่าโปรไฟล์ไกด์',
      section1Body:
        'เปิดโหมดไกด์ในการตั้งค่าโปรไฟล์ เพิ่มพื้นที่ เมือง ภาษา และรูปที่แสดงบุคลิก โปรไฟล์ครบได้คำขอมากขึ้น',
      section2Title: 'ราคาและบริการ',
      section2Body:
        'ตั้งค่าจ้างรายชั่วโมงในสกุลเงินของคุณ หรือนัดฟรีถ้ากำลังสร้างชื่อเสียง ระบุให้ชัดว่ารวมอะไร — เดินชมเมือง แนะนำอาหาร ช่วยเรื่องการเดินทาง',
      section3Title: 'ตอบคำขอไกด์',
      section3Body:
        'นักเดินทางโพสต์คำขอพร้อมวันที่และความสนใจ สมัครด้วยข้อความส่วนตัวอ้างอิงทริปของเขา ตอบเร็วและเป็นมิตรได้จองมากขึ้น',
      section4Title: 'สร้างความน่าเชื่อถือด้วยรีวิว',
      section4Body:
        'หลังแต่ละครั้งทั้งสองฝ่ายรีวิว คะแนนความน่าเชื่อถือสูงขึ้นในผลค้นหา มีการจัดการข้อพิพาทอย่างยุติธรรมหากมีปัญหา',
      ctaTitle: 'ลงทะเบียนเป็นไกด์',
      ctaBody: 'อัปเดตโปรไฟล์แล้วเริ่มรับคำขอไกด์จากนักเดินทางทั่วโลก',
      ctaButton: 'ตั้งค่าไกด์',
      ctaHref: '/guides',
    }),
  },
})

const vi = buildLocale({
  marketing: {
    navBlog: 'Cẩm nang du lịch',
    navCommunityBlogDesc: 'Bạn đồng hành, thử thách và hướng dẫn viên địa phương — miễn phí',
    footerBlog: 'Cẩm nang du lịch',
  },
  seo: {
    blogIndexTitle: 'Cẩm nang và mẹo du lịch | mytripfy',
    blogIndexDesc:
      'Cách tìm bạn đồng hành, 100 Countries Challenge và trở thành hướng dẫn viên địa phương — cẩm nang miễn phí trên mytripfy.',
  },
  blog: {
    indexTitle: 'Cẩm nang du lịch',
    indexSubtitle: 'Bạn đồng hành, thử thách và hướng dẫn viên — mẹo miễn phí trên mytripfy',
    readMore: 'Đọc bài',
    backToBlog: 'Tất cả cẩm nang',
    joinFree: 'Tham gia miễn phí',
    '100-countries-challenge': buildArticle({
      title: '100 Countries Challenge là gì?',
      excerpt:
        '1.600 nhiệm vụ trong 16 hạng mục — quốc gia, ẩm thực, địa danh và hơn thế, như danh sách ước muốn có gamification.',
      readMin: 'Đọc 6 phút',
      metaTitle: 'Cẩm nang 100 Countries Challenge | mytripfy',
      metaDesc:
        'Tìm hiểu 100 Countries Challenge trên mytripfy — 1.600 nhiệm vụ du lịch, xác minh ảnh, điểm và Hall of Fame.',
      keywords: '100 countries challenge, bucket list du lịch, mytripfy',
      intro:
        '100 Countries Challenge trên mytripfy không chỉ là checklist. Đây là trò chơi cộng đồng biến mỗi chuyến đi thành bằng chứng, điểm số và câu chuyện bạn có thể chia sẻ.',
      section1Title: '16 hạng mục, 1.600 nhiệm vụ',
      section1Body:
        'Chọn từ quốc gia, điểm tham quan, nhà hàng, món ăn, đồ uống, bảo tàng, thiên nhiên, đảo, động vật, lễ hội, golf, câu cá, lướt sóng, trượt tuyết, lặn và phòng trưng bày — mỗi hạng mục 100 nhiệm vụ được tuyển chọn.',
      section2Title: 'Cách xác minh hoạt động',
      section2Body:
        'Đến nơi, chụp ảnh tại chỗ và gửi làm chứng nhận. Cộng đồng duyệt và quy tắc khiếu nại giữ tính trung thực. Chứng nhận được duyệt cộng điểm vào hồ sơ và Hall of Fame toàn cầu.',
      section3Title: 'Giúp bạn đi nhiều hơn',
      section3Body:
        'Thử thách đưa bạn đi xa hơn những gì quen thuộc — chợ địa phương, bãi biển ẩn, bảo tàng từng bỏ qua. Nhiều thành viên nói thử thách đã thay đổi cách họ lên kế hoạch.',
      section4Title: 'Bắt đầu hôm nay',
      section4Body:
        'Đăng ký miễn phí, mở hạng mục Countries và chọn quốc gia đầu tiên. Không cần đi đủ 100 quốc gia ngay — tiến độ được ghi từng nhiệm vụ.',
      ctaTitle: 'Bắt đầu nhiệm vụ đầu tiên',
      ctaBody: 'Duyệt thử thách Countries và gửi chứng nhận đầu tiên sau chuyến đi tiếp theo.',
      ctaButton: 'Mở 100 Countries',
      ctaHref: '/challenges/countries',
    }),
    'find-travel-companion': buildArticle({
      title: 'Cách tìm bạn đồng hành du lịch an toàn',
      excerpt: 'Cẩm nang ghép cặp theo điểm đến, ngày và phong cách du lịch trên mytripfy.',
      readMin: 'Đọc 5 phút',
      metaTitle: 'Tìm bạn đồng hành du lịch | mytripfy',
      metaDesc:
        'Hướng dẫn từng bước — tìm kiếm, ứng tuyển, trò chuyện và gặp gỡ an toàn với điểm tin cậy và đánh giá.',
      keywords: 'tìm bạn đồng hành, bạn du lịch, đi một mình, mytripfy',
      intro:
        'Đi cùng người phù hợp giúp tiết kiệm chi phí, giảm cô đơn và mở ra trải nghiệm bạn sẽ bỏ lỡ khi đi một mình.',
      section1Title: 'Xác định rõ chuyến đi',
      section1Body:
        'Trước khi tìm, biết điểm đến, ngày, ngân sách và nhịp độ (thư giãn hay dày đặc). Làm quiz Trip Matcher trên hồ sơ để người khác tìm bạn nhanh hơn.',
      section2Title: 'Duyệt và ứng tuyển cẩn thận',
      section2Body:
        'Tìm bạn đồng hành theo quốc gia và thành phố trên trang chủ hoặc Companions. Đọc bài đầy đủ, xem điểm tin cậy và đánh giá của chủ bài, rồi gửi đơn ngắn giải thích vì sao bạn phù hợp.',
      section3Title: 'Trò chuyện trước khi cam kết',
      section3Body:
        'Dùng tin nhắn trong app để thống nhất kế hoạch hàng ngày, chỗ ở và chia chi phí. Gọi video một lần nếu được. Không chia sẻ mật khẩu hay chuyển tiền ngoài kênh đã thỏa thuận.',
      section4Title: 'Gặp an toàn, đánh giá sau',
      section4Body:
        'Lần gặp đầu ở nơi công cộng. Chia sẻ lịch trình với người ở nhà. Sau chuyến đi, đánh giá lẫn nhau trung thực — giúp cả cộng đồng.',
      ctaTitle: 'Xem chuyến đi đang mở',
      ctaBody: 'Xem ai đang đi đến điểm đến của bạn, hoặc đăng chuyến đi và để bạn đồng hành tìm đến.',
      ctaButton: 'Tìm bạn đồng hành',
      ctaHref: '/companions',
    }),
    'become-local-guide': buildArticle({
      title: 'Cách trở thành hướng dẫn viên địa phương trên mytripfy',
      excerpt: 'Biến hiểu biết về thành phố thành kết nối — thiết lập, giá cả và mẹo đánh giá tốt.',
      readMin: 'Đọc 5 phút',
      metaTitle: 'Trở thành hướng dẫn viên địa phương | mytripfy',
      metaDesc:
        'Đăng ký hướng dẫn viên trên mytripfy — đặt khu vực, giá theo giờ, phản hồi yêu cầu và xây dựng tin cậy qua đánh giá.',
      keywords: 'hướng dẫn viên địa phương, tour guide, mytripfy',
      intro:
        'Bạn thích giới thiệu thành phố với du khách? mytripfy kết nối trực tiếp với du khách — không cần trung gian đại lý.',
      section1Title: 'Thiết lập hồ sơ hướng dẫn viên',
      section1Body:
        'Bật chế độ hướng dẫn viên trong cài đặt hồ sơ. Thêm khu vực, thành phố, ngôn ngữ và ảnh thể hiện cá tính. Hồ sơ đầy đủ nhận nhiều yêu cầu hơn.',
      section2Title: 'Giá cả và phạm vi dịch vụ',
      section2Body:
        'Đặt giá theo giờ bằng tiền tệ của bạn hoặc gặp miễn phí nếu đang xây dựng uy tín. Nêu rõ bao gồm gì — đi bộ tham quan, gợi ý ẩm thực, hỗ trợ di chuyển.',
      section3Title: 'Phản hồi yêu cầu hướng dẫn',
      section3Body:
        'Du khách đăng yêu cầu kèm ngày và sở thích. Ứng tuyển bằng tin nhắn cá nhân nhắc đến chuyến đi của họ. Trả lời nhanh và thân thiện giúp được đặt nhiều hơn.',
      section4Title: 'Xây dựng tin cậy qua đánh giá',
      section4Body:
        'Sau mỗi trải nghiệm, hai bên đánh giá lẫn nhau. Điểm tin cậy cao hiển thị cao hơn trong tìm kiếm. Tranh chấp được xử lý công bằng nếu có sự cố.',
      ctaTitle: 'Đăng ký làm hướng dẫn viên',
      ctaBody: 'Cập nhật hồ sơ và bắt đầu nhận yêu cầu hướng dẫn từ du khách trên toàn thế giới.',
      ctaButton: 'Cài đặt hướng dẫn viên',
      ctaHref: '/guides',
    }),
  },
})

const id = buildLocale({
  marketing: {
    navBlog: 'Panduan perjalanan',
    navCommunityBlogDesc: 'Teman perjalanan, tantangan & pemandu lokal — gratis',
    footerBlog: 'Panduan perjalanan',
  },
  seo: {
    blogIndexTitle: 'Panduan & tips perjalanan | mytripfy',
    blogIndexDesc:
      'Cara mencari teman perjalanan, 100 Countries Challenge, dan menjadi pemandu lokal — panduan gratis di mytripfy.',
  },
  blog: {
    indexTitle: 'Panduan perjalanan',
    indexSubtitle: 'Teman perjalanan, tantangan & pemandu lokal — tips gratis mytripfy',
    readMore: 'Baca artikel',
    backToBlog: 'Semua panduan',
    joinFree: 'Daftar gratis',
    '100-countries-challenge': buildArticle({
      title: 'Apa itu 100 Countries Challenge?',
      excerpt:
        '1.600 misi dalam 16 kategori — negara, kuliner, landmark, dan lainnya seperti bucket list bergamifikasi.',
      readMin: 'Baca 6 menit',
      metaTitle: 'Panduan 100 Countries Challenge | mytripfy',
      metaDesc:
        'Pelajari 100 Countries Challenge di mytripfy — 1.600 misi perjalanan, verifikasi foto, poin, dan Hall of Fame.',
      keywords: '100 countries challenge, bucket list perjalanan, mytripfy',
      intro:
        '100 Countries Challenge di mytripfy lebih dari sekadar checklist. Ini permainan komunitas yang mengubah setiap perjalanan menjadi bukti, poin, dan cerita yang bisa dibagikan.',
      section1Title: '16 kategori, 1.600 misi',
      section1Body:
        'Pilih dari negara, atraksi, restoran, makanan, minuman, museum, alam, pulau, hewan, festival, golf, memancing, surfing, ski, selam, dan galeri seni. Setiap kategori punya 100 misi kurasi dengan destinasi nyata.',
      section2Title: 'Cara verifikasi bekerja',
      section2Body:
        'Kunjungi tempatnya, ambil foto di lokasi, lalu kirim sebagai sertifikasi. Tinjauan komunitas dan aturan sengketa menjaga kejujuran. Sertifikasi yang disetujui menambah poin ke profil dan Hall of Fame global.',
      section3Title: 'Membantu Anda bepergian lebih banyak',
      section3Body:
        'Tantangan mendorong Anda melampaui yang biasa — pasar lokal, pantai tersembunyi, museum yang dulu dilewati. Banyak anggota bilang tantangan ini mengubah cara mereka merencanakan perjalanan.',
      section4Title: 'Mulai hari ini',
      section4Body:
        'Daftar gratis, buka kategori Countries, dan pilih negara pertama. Tidak perlu mengunjungi 100 negara sekaligus — progres dicatat per misi.',
      ctaTitle: 'Mulai misi pertama',
      ctaBody: 'Jelajahi tantangan Countries dan kirim sertifikasi pertama setelah perjalanan berikutnya.',
      ctaButton: 'Buka 100 Countries',
      ctaHref: '/challenges/countries',
    }),
    'find-travel-companion': buildArticle({
      title: 'Cara mencari teman perjalanan dengan aman',
      excerpt: 'Panduan praktis mencocokkan destinasi, tanggal, dan gaya perjalanan di mytripfy.',
      readMin: 'Baca 5 menit',
      metaTitle: 'Cari teman perjalanan | mytripfy',
      metaDesc:
        'Panduan langkah demi langkah — cari, lamar, obrol, dan temui dengan aman dengan skor kepercayaan dan ulasan.',
      keywords: 'cari teman perjalanan, teman jalan, solo travel, mytripfy',
      intro:
        'Bepergian dengan teman yang tepat bisa menghemat biaya, mengurangi kesepian, dan membuka pengalaman yang terlewat jika sendirian.',
      section1Title: 'Tentukan perjalanan dengan jelas',
      section1Body:
        'Sebelum mencari, ketahui destinasi, tanggal, anggaran, dan tempo (santai vs padat). Gunakan kuis Trip Matcher di profil agar orang lain menemukan Anda lebih cepat.',
      section2Title: 'Jelajahi dan lamar dengan cermat',
      section2Body:
        'Cari teman perjalanan menurut negara dan kota di beranda atau halaman Companions. Baca posting lengkap, periksa skor kepercayaan dan ulasan host, lalu kirim lamaran singkat mengapa Anda cocok.',
      section3Title: 'Obrol sebelum berkomitmen',
      section3Body:
        'Gunakan pesan dalam aplikasi untuk menyelaraskan rencana harian, akomodasi, dan pembagian biaya. Video call sekali jika memungkinkan. Jangan bagikan kata sandi atau kirim uang di luar saluran yang disepakati.',
      section4Title: 'Temui dengan aman, ulas setelahnya',
      section4Body:
        'Pertemuan pertama di tempat umum. Bagikan rencana perjalanan dengan seseorang di rumah. Setelah perjalanan, beri ulasan jujur satu sama lain — membantu seluruh komunitas.',
      ctaTitle: 'Lihat perjalanan terbuka',
      ctaBody: 'Lihat siapa yang bepergian ke destinasi Anda, atau posting perjalanan sendiri.',
      ctaButton: 'Cari teman perjalanan',
      ctaHref: '/companions',
    }),
    'become-local-guide': buildArticle({
      title: 'Cara menjadi pemandu lokal di mytripfy',
      excerpt: 'Ubah pengetahuan kota menjadi koneksi bermakna — pengaturan, harga, dan tips ulasan bagus.',
      readMin: 'Baca 5 menit',
      metaTitle: 'Menjadi pemandu lokal | mytripfy',
      metaDesc:
        'Daftar sebagai pemandu lokal di mytripfy — atur wilayah, tarif per jam, tanggapi permintaan, dan bangun kepercayaan lewat ulasan.',
      keywords: 'pemandu lokal, tour guide, mytripfy',
      intro:
        'Suka memperkenalkan kota kepada pengunjung? mytripfy menghubungkan Anda langsung dengan pelancong — tanpa perantara agensi.',
      section1Title: 'Siapkan profil pemandu',
      section1Body:
        'Aktifkan mode pemandu di pengaturan profil. Tambahkan wilayah, kota, bahasa, dan foto yang menunjukkan kepribadian. Profil lengkap mendapat lebih banyak permintaan.',
      section2Title: 'Harga dan layanan',
      section2Body:
        'Tetapkan tarif per jam dalam mata uang Anda atau tawarkan pertemuan gratis jika membangun reputasi. Jelaskan apa yang termasuk — tur jalan kaki, rekomendasi makanan, bantuan transportasi.',
      section3Title: 'Tanggapi permintaan pemandu',
      section3Body:
        'Pelancong memposting permintaan dengan tanggal dan minat. Lamar dengan pesan pribadi yang merujuk perjalanan mereka. Balasan cepat dan ramah menang lebih banyak pemesanan.',
      section4Title: 'Bangun kepercayaan lewat ulasan',
      section4Body:
        'Setelah setiap pengalaman, kedua pihak memberi ulasan. Skor kepercayaan tinggi tampil lebih atas di pencarian. Sengketa ditangani adil jika ada masalah.',
      ctaTitle: 'Daftar sebagai pemandu',
      ctaBody: 'Perbarui profil dan mulai menerima permintaan pemandu dari pelancong di seluruh dunia.',
      ctaButton: 'Pengaturan pemandu',
      ctaHref: '/guides',
    }),
  },
})

const ru = buildLocale({
  marketing: {
    navBlog: 'Путеводители',
    navCommunityBlogDesc: 'Попутчики, челленджи и местные гиды — бесплатно',
    footerBlog: 'Путеводители',
  },
  seo: {
    blogIndexTitle: 'Путеводители и советы | mytripfy',
    blogIndexDesc:
      'Как найти попутчика, 100 Countries Challenge и стать местным гидом — бесплатные гиды mytripfy.',
  },
  blog: {
    indexTitle: 'Путеводители',
    indexSubtitle: 'Попутчики, челленджи и местные гиды — бесплатные советы mytripfy',
    readMore: 'Читать статью',
    backToBlog: 'Все гиды',
    joinFree: 'Бесплатная регистрация',
    '100-countries-challenge': buildArticle({
      title: 'Что такое 100 Countries Challenge?',
      excerpt:
        '1 600 миссий в 16 категориях — страны, еда, достопримечательности и другое, как геймифицированный список желаний.',
      readMin: '6 мин чтения',
      metaTitle: 'Гид по 100 Countries Challenge | mytripfy',
      metaDesc:
        'Как работает 100 Countries Challenge на mytripfy — 1 600 миссий, фотоверификация, очки и Hall of Fame.',
      keywords: '100 countries challenge, список путешествий, mytripfy',
      intro:
        '100 Countries Challenge на mytripfy — это больше, чем чеклист. Это комьюнити-игра, превращающая каждую поездку в доказательство, очки и истории для sharing.',
      section1Title: '16 категорий, 1 600 миссий',
      section1Body:
        'Страны, достопримечательности, рестораны, блюда, напитки, музеи, природа, острова, животные, фестивали, гольф, рыбалка, сёрфинг, лыжи, дайвинг и галереи — в каждой категории 100 миссий с реальными местами.',
      section2Title: 'Как работает верификация',
      section2Body:
        'Посетите место, сделайте фото на локации и отправьте как сертификат. Проверка сообществом и правила споров сохраняют честность. Одобренные сертификаты дают очки профилю и глобальному Hall of Fame.',
      section3Title: 'Помогает путешествовать больше',
      section3Body:
        'Челленджи ведут дальше очевидного — местный рынок, скрытый пляж, музей, который вы бы пропустили. Многие говорят, что это изменило планирование поездок.',
      section4Title: 'Начните сегодня',
      section4Body:
        'Зарегистрируйтесь бесплатно, откройте категорию Countries и выберите первую страну. Не нужно посетить 100 стран сразу — прогресс идёт миссия за миссией.',
      ctaTitle: 'Начните первую миссию',
      ctaBody: 'Откройте челлендж Countries и отправьте первый сертификат после следующей поездки.',
      ctaButton: 'Открыть 100 Countries',
      ctaHref: '/challenges/countries',
    }),
    'find-travel-companion': buildArticle({
      title: 'Как безопасно найти попутчика',
      excerpt: 'Практический гид по подбору по направлению, датам и стилю путешествия на mytripfy.',
      readMin: '5 мин чтения',
      metaTitle: 'Найти попутчика | mytripfy',
      metaDesc:
        'Пошаговый гид — поиск, заявка, чат и безопасная встреча с рейтингом доверия и отзывами.',
      keywords: 'найти попутчика, попутчик, соло-путешествие, mytripfy',
      intro:
        'Правильный попутчик снижает расходы, одиночество и открывает опыт, который легко упустить в одиночку.',
      section1Title: 'Чётко определите поездку',
      section1Body:
        'Перед поиском знайте направление, даты, бюджет и темп (спокойный vs насыщенный). Пройдите квиз Trip Matcher в профиле — так вас быстрее найдут.',
      section2Title: 'Ищите и подавайте заявки вдумчиво',
      section2Body:
        'Ищите попутчиков по стране и городу на главной или в Companions. Читайте пост целиком, смотрите рейтинг доверия и отзывы организатора, отправляйте короткую заявку, почему вы подходите.',
      section3Title: 'Общайтесь до обязательств',
      section3Body:
        'Согласуйте планы, жильё и расходы в чате приложения. Видеозвонок по возможности. Не делитесь паролями и не переводите деньги вне согласованных каналов.',
      section4Title: 'Встречайтесь безопасно, оставляйте отзыв',
      section4Body:
        'Первая встреча в публичном месте. Поделитесь маршрутом с близкими. После поездки — честный взаимный отзыв, это помогает всему сообществу.',
      ctaTitle: 'Открытые поездки',
      ctaBody: 'Посмотрите, кто едет в ваше направление, или опубликуйте свою поездку.',
      ctaButton: 'Найти попутчиков',
      ctaHref: '/companions',
    }),
    'become-local-guide': buildArticle({
      title: 'Как стать местным гидом на mytripfy',
      excerpt: 'Превратите знание города в связи — настройка, цены и советы для хороших отзывов.',
      readMin: '5 мин чтения',
      metaTitle: 'Стать местным гидом | mytripfy',
      metaDesc:
        'Регистрация гида на mytripfy — регионы, почасовая ставка, ответы на запросы и доверие через отзывы.',
      keywords: 'местный гид, экскурсовод, mytripfy',
      intro:
        'Любите показывать город гостям? mytripfy связывает вас с путешественниками напрямую — без агентств.',
      section1Title: 'Настройте профиль гида',
      section1Body:
        'Включите режим гида в настройках профиля. Добавьте регионы, города, языки и фото с характером. Полные профили получают больше запросов.',
      section2Title: 'Цены и услуги',
      section2Body:
        'Укажите почасовую ставку в своей валюте или бесплатные встречи для репутации. Чётко опишите, что входит — пешая экскурсия, еда, помощь с транспортом.',
      section3Title: 'Отвечайте на запросы гидов',
      section3Body:
        'Путешественники публикуют запросы с датами и интересами. Откликайтесь личным сообщением о их поездке. Быстрые дружелюбные ответы дают больше бронирований.',
      section4Title: 'Доверие через отзывы',
      section4Body:
        'После каждого опыта обе стороны оставляют отзывы. Высокий рейтинг доверия — выше в поиске. Споры решаются справедливо при проблемах.',
      ctaTitle: 'Зарегистрироваться как гид',
      ctaBody: 'Обновите профиль и начните получать запросы от путешественников по всему миру.',
      ctaButton: 'Настройки гида',
      ctaHref: '/guides',
    }),
  },
})

export const BLOG_LOCALE_OVERRIDES_PART2 = {
  pt,
  'pt-BR': applyPtBrOverrides(pt),
  it,
  'zh-TW': zhTW,
  th,
  vi,
  id,
  ru,
}
