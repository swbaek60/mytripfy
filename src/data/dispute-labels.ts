/**
 * Dispute (Red Flag) System — Locale-aware UI Labels
 *
 * Korean: 딴지걸기  (playful, community-vibe slang)
 * English & others: Red Flag  (universally understood metaphor)
 */

export interface DisputeLabels {
  /** Short button text shown on certification cards */
  buttonText: string
  /** Full system name shown in headings / banners */
  systemName: string
  /** One-line tagline for banners */
  tagline: string
  /** Verb: "Flag this certification" */
  actionVerb: string
  /** Success message after submitting */
  successMsg: string
  /** Stake warning in modal */
  stakeWarning: string
  /** Reason placeholder in modal */
  reasonPlaceholder: string
  /** Already flagged label */
  alreadyFlagged: string
  /** Status labels */
  status: {
    clean: string
    flagged: string
    reviewing: string
    invalidated: string
  }
  /** Jury page */
  jury: {
    title: string
    validBtn: string
    invalidBtn: string
    rewardNote: string
    alreadyVoted: string
    ownerNote: string
    reporterNote: string
  }
  /** Guide page section titles */
  guide: {
    heroTitle: string
    heroSub: string
    howItWorksTitle: string
    pointTableTitle: string
    repeatPenaltyTitle: string
    eligibilityTitle: string
    faqTitle: string
    ctaTitle: string
    ctaSub: string
  }
}

const labels: Record<string, DisputeLabels> = {
  /* ── KOREAN ────────────────────────────────────────────── */
  ko: {
    buttonText:        '🚩 딴지걸기',
    systemName:        '딴지걸기 시스템',
    tagline:           '커뮤니티가 직접 인증을 검증합니다',
    actionVerb:        '딴지걸기',
    successMsg:        '딴지가 접수되었습니다! 5pt가 예치되었습니다.',
    stakeWarning:      '⚠️ 포인트 5pt가 예치됩니다. 딴지가 기각되면 예치금을 잃습니다.',
    reasonPlaceholder: '예: 이 사진은 실제 장소가 아닙니다. 배경이 완전히 다릅니다.',
    alreadyFlagged:    '🚩 딴지 완료',
    status: {
      clean:       '✅ 인증됨',
      flagged:     '🚩 딴지 접수',
      reviewing:   '⚖️ 배심원 심사',
      invalidated: '❌ 무효 처리',
    },
    jury: {
      title:       '⚖️ 배심원 투표 참여',
      validBtn:    '✅ 정당한 인증',
      invalidBtn:  '❌ 무효 인증',
      rewardNote:  '투표 참여 시 +2pt 보상',
      alreadyVoted:'이미 투표하셨습니다',
      ownerNote:   '본인 인증에는 배심원으로 참여할 수 없습니다.',
      reporterNote:'딴지를 제기한 건에는 배심원으로 참여할 수 없습니다.',
    },
    guide: {
      heroTitle:          '인증을 지키는 커뮤니티 배심원 제도',
      heroSub:            '엉뚱한 사진이나 허위 인증을 발견하셨나요? 딴지걸기 버튼으로 신고하면 커뮤니티 배심원이 72시간 내 공정하게 판결합니다.',
      howItWorksTitle:    '어떻게 작동하나요?',
      pointTableTitle:    '판결 결과에 따른 포인트 정산',
      repeatPenaltyTitle: '반복 위반자 누적 패널티',
      eligibilityTitle:   '딴지걸기 자격 조건',
      faqTitle:           '자주 묻는 질문',
      ctaTitle:           '함께 만드는 신뢰할 수 있는 플랫폼',
      ctaSub:             '여러분의 참여가 mytripfy를 더 공정하고 가치 있게 만듭니다.',
    },
  },

  /* ── ENGLISH ───────────────────────────────────────────── */
  en: {
    buttonText:        '🚨 Dispute',
    systemName:        'Dispute System',
    tagline:           'Community-powered certification review',
    actionVerb:        'Dispute',
    successMsg:        'Dispute submitted! 5 pts have been staked.',
    stakeWarning:      '⚠️ 5 pts will be staked. If dismissed, you lose the stake.',
    reasonPlaceholder: 'e.g. This photo is not from the claimed location. The background is completely different.',
    alreadyFlagged:    '🚨 Disputed',
    status: {
      clean:       '✅ Verified',
      flagged:     '🚨 Disputed',
      reviewing:   '⚖️ Under Review',
      invalidated: '❌ Invalidated',
    },
    jury: {
      title:       '⚖️ Cast Your Jury Vote',
      validBtn:    '✅ Legit Cert',
      invalidBtn:  '❌ Fake Cert',
      rewardNote:  '+2 pts for voting',
      alreadyVoted:'You have already voted',
      ownerNote:   'You cannot vote on your own certification.',
      reporterNote:'Reporters cannot participate as jurors (conflict of interest).',
    },
    guide: {
      heroTitle:          'Community Jury — Keeping Certifications Honest',
      heroSub:            'Spotted a suspicious photo or fake certification? Hit Dispute and the community jury will deliver a fair verdict within 72 hours.',
      howItWorksTitle:    'How does it work?',
      pointTableTitle:    'Points Settlement by Verdict',
      repeatPenaltyTitle: 'Repeat Offender Penalties',
      eligibilityTitle:   'Who can Dispute?',
      faqTitle:           'Frequently Asked Questions',
      ctaTitle:           'Together We Build a Trustworthy Platform',
      ctaSub:             'Your participation makes mytripfy fairer and more valuable for everyone.',
    },
  },

  /* ── JAPANESE ──────────────────────────────────────────── */
  ja: {
    buttonText:        '🚩 異議あり',
    systemName:        'コミュニティ検証システム',
    tagline:           'コミュニティで認証を公正に検証します',
    actionVerb:        '異議を申し立てる',
    successMsg:        '異議が申し立てられました！5ptが預託されました。',
    stakeWarning:      '⚠️ 5ptが預託されます。申し立てが却下された場合、失います。',
    reasonPlaceholder: '例: この写真は申告された場所ではありません。背景が全く異なります。',
    alreadyFlagged:    '🚩 申立済み',
    status: {
      clean:       '✅ 認証済み',
      flagged:     '🚩 申立あり',
      reviewing:   '⚖️ 審査中',
      invalidated: '❌ 無効',
    },
    jury: {
      title:       '⚖️ 陪審員として投票',
      validBtn:    '✅ 正当な認証',
      invalidBtn:  '❌ 無効な認証',
      rewardNote:  '投票で +2pt 獲得',
      alreadyVoted:'投票済みです',
      ownerNote:   '自分の認証には陪審員として参加できません。',
      reporterNote:'申立人は陪審員として参加できません。',
    },
    guide: {
      heroTitle:          'コミュニティ陪審制度で認証を守る',
      heroSub:            '不正な写真や虚偽の認証を見つけたら？異議ありボタンで報告すれば、コミュニティ陪審員が72時間以内に公正な判決を下します。',
      howItWorksTitle:    'どのように機能しますか？',
      pointTableTitle:    '判決結果によるポイント精算',
      repeatPenaltyTitle: '繰り返し違反者への累積ペナルティ',
      eligibilityTitle:   '申立資格',
      faqTitle:           'よくある質問',
      ctaTitle:           '信頼できるプラットフォームを共に作る',
      ctaSub:             'あなたの参加がmytripfyをより公正で価値あるものにします。',
    },
  },

  /* ── CHINESE SIMPLIFIED ────────────────────────────────── */
  zh: {
    buttonText:        '🚩 质疑',
    systemName:        '社区核实系统',
    tagline:           '社区共同验证认证真实性',
    actionVerb:        '提出质疑',
    successMsg:        '质疑已提交！已预存5积分。',
    stakeWarning:      '⚠️ 将预存5积分。若质疑被驳回，您将失去预存积分。',
    reasonPlaceholder: '例：此照片并非来自所申报的地点，背景完全不同。',
    alreadyFlagged:    '🚩 已质疑',
    status: {
      clean:       '✅ 已验证',
      flagged:     '🚩 已标记',
      reviewing:   '⚖️ 审查中',
      invalidated: '❌ 已作废',
    },
    jury: {
      title:       '⚖️ 参与陪审团投票',
      validBtn:    '✅ 认证有效',
      invalidBtn:  '❌ 认证无效',
      rewardNote:  '投票获得 +2积分',
      alreadyVoted:'您已经投票',
      ownerNote:   '您不能对自己的认证进行投票。',
      reporterNote:'质疑者不能参与陪审团（利益冲突）。',
    },
    guide: {
      heroTitle:          '社区陪审制度 — 保护认证诚信',
      heroSub:            '发现可疑照片或虚假认证？点击质疑按钮，社区陪审团将在72小时内做出公正裁决。',
      howItWorksTitle:    '如何运作？',
      pointTableTitle:    '按裁决结果结算积分',
      repeatPenaltyTitle: '累犯处罚',
      eligibilityTitle:   '谁可以质疑？',
      faqTitle:           '常见问题',
      ctaTitle:           '共同建立值得信赖的平台',
      ctaSub:             '您的参与使mytripfy对每个人更公平、更有价值。',
    },
  },

  /* ── CHINESE TRADITIONAL ───────────────────────────────── */
  'zh-TW': {
    buttonText:        '🚩 質疑',
    systemName:        '社群核實系統',
    tagline:           '社群共同驗證認證真實性',
    actionVerb:        '提出質疑',
    successMsg:        '質疑已提交！已預存5積分。',
    stakeWarning:      '⚠️ 將預存5積分。若質疑被駁回，您將失去預存積分。',
    reasonPlaceholder: '例：此照片並非來自所申報的地點，背景完全不同。',
    alreadyFlagged:    '🚩 已質疑',
    status: {
      clean:       '✅ 已驗證',
      flagged:     '🚩 已標記',
      reviewing:   '⚖️ 審查中',
      invalidated: '❌ 已作廢',
    },
    jury: {
      title:       '⚖️ 參與陪審團投票',
      validBtn:    '✅ 認證有效',
      invalidBtn:  '❌ 認證無效',
      rewardNote:  '投票獲得 +2積分',
      alreadyVoted:'您已經投票',
      ownerNote:   '您不能對自己的認證進行投票。',
      reporterNote:'質疑者不能參與陪審團（利益衝突）。',
    },
    guide: {
      heroTitle:          '社群陪審制度 — 保護認證誠信',
      heroSub:            '發現可疑照片或虛假認證？點擊質疑按鈕，社群陪審團將在72小時內做出公正裁決。',
      howItWorksTitle:    '如何運作？',
      pointTableTitle:    '按裁決結果結算積分',
      repeatPenaltyTitle: '累犯處罰',
      eligibilityTitle:   '誰可以質疑？',
      faqTitle:           '常見問題',
      ctaTitle:           '共同建立值得信賴的平台',
      ctaSub:             '您的參與使mytripfy對每個人更公平、更有價值。',
    },
  },

  /* ── SPANISH ───────────────────────────────────────────── */
  es: {
    buttonText:        '🚩 Cuestionar',
    systemName:        'Verificación Comunitaria',
    tagline:           'La comunidad verifica las certificaciones',
    actionVerb:        'Cuestionar',
    successMsg:        '¡Cuestionamiento enviado! Se han reservado 5 pts.',
    stakeWarning:      '⚠️ Se reservarán 5 pts. Si es desestimado, los perderás.',
    reasonPlaceholder: 'Ej: Esta foto no corresponde al lugar declarado. El fondo es completamente diferente.',
    alreadyFlagged:    '🚩 Cuestionado',
    status: {
      clean:       '✅ Verificado',
      flagged:     '🚩 Marcado',
      reviewing:   '⚖️ En revisión',
      invalidated: '❌ Invalidado',
    },
    jury: {
      title:       '⚖️ Voto del Jurado',
      validBtn:    '✅ Certificación válida',
      invalidBtn:  '❌ Certificación falsa',
      rewardNote:  '+2 pts por votar',
      alreadyVoted:'Ya has votado',
      ownerNote:   'No puedes votar sobre tu propia certificación.',
      reporterNote:'Los denunciantes no pueden ser jurados (conflicto de interés).',
    },
    guide: {
      heroTitle:          'Jurado Comunitario — Protegiendo la Integridad',
      heroSub:            '¿Encontraste una foto sospechosa? Haz clic en Cuestionar y el jurado comunitario dará un veredicto justo en 72 horas.',
      howItWorksTitle:    '¿Cómo funciona?',
      pointTableTitle:    'Liquidación de puntos por veredicto',
      repeatPenaltyTitle: 'Penalizaciones por reincidencia',
      eligibilityTitle:   '¿Quién puede cuestionar?',
      faqTitle:           'Preguntas frecuentes',
      ctaTitle:           'Construyamos juntos una plataforma confiable',
      ctaSub:             'Tu participación hace que mytripfy sea más justo y valioso para todos.',
    },
  },

  /* ── FRENCH ────────────────────────────────────────────── */
  fr: {
    buttonText:        '🚩 Contester',
    systemName:        'Vérification Communautaire',
    tagline:           'La communauté vérifie les certifications',
    actionVerb:        'Contester',
    successMsg:        'Contestation soumise ! 5 pts ont été mis en gage.',
    stakeWarning:      '⚠️ 5 pts seront mis en gage. Si rejetée, vous les perdrez.',
    reasonPlaceholder: 'Ex : Cette photo ne correspond pas au lieu déclaré. L\'arrière-plan est complètement différent.',
    alreadyFlagged:    '🚩 Contesté',
    status: {
      clean:       '✅ Vérifié',
      flagged:     '🚩 Signalé',
      reviewing:   '⚖️ En cours d\'examen',
      invalidated: '❌ Invalidé',
    },
    jury: {
      title:       '⚖️ Vote du Jury',
      validBtn:    '✅ Certification valide',
      invalidBtn:  '❌ Certification fausse',
      rewardNote:  '+2 pts pour voter',
      alreadyVoted:'Vous avez déjà voté',
      ownerNote:   'Vous ne pouvez pas voter sur votre propre certification.',
      reporterNote:'Les plaignants ne peuvent pas être jurés (conflit d\'intérêts).',
    },
    guide: {
      heroTitle:          'Jury Communautaire — Protéger l\'Intégrité des Certifications',
      heroSub:            'Vous avez repéré une photo suspecte ? Cliquez sur Contester et le jury communautaire rendra un verdict équitable en 72 heures.',
      howItWorksTitle:    'Comment ça marche ?',
      pointTableTitle:    'Règlement des points selon le verdict',
      repeatPenaltyTitle: 'Pénalités pour récidive',
      eligibilityTitle:   'Qui peut contester ?',
      faqTitle:           'Questions fréquentes',
      ctaTitle:           'Construisons ensemble une plateforme de confiance',
      ctaSub:             'Votre participation rend mytripfy plus équitable et précieux pour tous.',
    },
  },

  /* ── GERMAN ────────────────────────────────────────────── */
  de: {
    buttonText:        '🚩 Anfechten',
    systemName:        'Community-Überprüfungssystem',
    tagline:           'Die Community überprüft Zertifizierungen',
    actionVerb:        'Anfechten',
    successMsg:        'Einspruch eingereicht! 5 Pkt. wurden hinterlegt.',
    stakeWarning:      '⚠️ 5 Pkt. werden hinterlegt. Bei Ablehnung verlierst du sie.',
    reasonPlaceholder: 'z.B.: Dieses Foto stammt nicht vom angegebenen Ort. Der Hintergrund ist völlig anders.',
    alreadyFlagged:    '🚩 Angefochten',
    status: {
      clean:       '✅ Verifiziert',
      flagged:     '🚩 Markiert',
      reviewing:   '⚖️ In Prüfung',
      invalidated: '❌ Ungültig',
    },
    jury: {
      title:       '⚖️ Abstimmung der Jury',
      validBtn:    '✅ Gültige Zertifizierung',
      invalidBtn:  '❌ Ungültige Zertifizierung',
      rewardNote:  '+2 Pkt. für die Abstimmung',
      alreadyVoted:'Sie haben bereits abgestimmt',
      ownerNote:   'Sie können nicht über Ihre eigene Zertifizierung abstimmen.',
      reporterNote:'Beschwerdeführer können nicht als Geschworene teilnehmen.',
    },
    guide: {
      heroTitle:          'Community-Jury — Zertifizierungen schützen',
      heroSub:            'Verdächtiges Foto entdeckt? Klicken Sie auf Anfechten und die Community-Jury fällt innerhalb von 72 Stunden ein faires Urteil.',
      howItWorksTitle:    'Wie funktioniert es?',
      pointTableTitle:    'Punkteabrechnung nach Urteil',
      repeatPenaltyTitle: 'Strafen für Wiederholungstäter',
      eligibilityTitle:   'Wer kann anfechten?',
      faqTitle:           'Häufig gestellte Fragen',
      ctaTitle:           'Gemeinsam eine vertrauenswürdige Plattform aufbauen',
      ctaSub:             'Ihre Teilnahme macht mytripfy fairer und wertvoller für alle.',
    },
  },

  /* ── PORTUGUESE (PT + PT-BR share same) ────────────────── */
  pt: {
    buttonText:        '🚩 Contestar',
    systemName:        'Verificação Comunitária',
    tagline:           'A comunidade verifica as certificações',
    actionVerb:        'Contestar',
    successMsg:        'Contestação enviada! 5 pts foram reservados.',
    stakeWarning:      '⚠️ 5 pts serão reservados. Se rejeitada, você os perde.',
    reasonPlaceholder: 'Ex: Esta foto não corresponde ao local declarado. O fundo é completamente diferente.',
    alreadyFlagged:    '🚩 Contestado',
    status: {
      clean:       '✅ Verificado',
      flagged:     '🚩 Marcado',
      reviewing:   '⚖️ Em revisão',
      invalidated: '❌ Invalidado',
    },
    jury: {
      title:       '⚖️ Voto do Júri',
      validBtn:    '✅ Certificação válida',
      invalidBtn:  '❌ Certificação falsa',
      rewardNote:  '+2 pts por votar',
      alreadyVoted:'Você já votou',
      ownerNote:   'Você não pode votar na sua própria certificação.',
      reporterNote:'Denunciantes não podem ser jurados (conflito de interesses).',
    },
    guide: {
      heroTitle:          'Júri Comunitário — Protegendo a Integridade',
      heroSub:            'Encontrou uma foto suspeita? Clique em Contestar e o júri comunitário dará um veredicto justo em 72 horas.',
      howItWorksTitle:    'Como funciona?',
      pointTableTitle:    'Liquidação de pontos por veredicto',
      repeatPenaltyTitle: 'Penalidades por reincidência',
      eligibilityTitle:   'Quem pode contestar?',
      faqTitle:           'Perguntas frequentes',
      ctaTitle:           'Juntos construímos uma plataforma confiável',
      ctaSub:             'Sua participação torna o mytripfy mais justo e valioso para todos.',
    },
  },

  /* ── ITALIAN ───────────────────────────────────────────── */
  it: {
    buttonText:        '🚩 Contesta',
    systemName:        'Verifica della Comunità',
    tagline:           'La comunità verifica le certificazioni',
    actionVerb:        'Contesta',
    successMsg:        'Contestazione inviata! 5 pt sono stati messi in pegno.',
    stakeWarning:      '⚠️ 5 pt verranno messi in pegno. Se respinta, li perderai.',
    reasonPlaceholder: 'Es: Questa foto non corrisponde al luogo dichiarato. Lo sfondo è completamente diverso.',
    alreadyFlagged:    '🚩 Contestato',
    status: {
      clean:       '✅ Verificato',
      flagged:     '🚩 Segnalato',
      reviewing:   '⚖️ In revisione',
      invalidated: '❌ Invalidato',
    },
    jury: {
      title:       '⚖️ Voto della Giuria',
      validBtn:    '✅ Certificazione valida',
      invalidBtn:  '❌ Certificazione falsa',
      rewardNote:  '+2 pt per votare',
      alreadyVoted:'Hai già votato',
      ownerNote:   'Non puoi votare sulla tua certificazione.',
      reporterNote:'I segnalatori non possono essere giurati (conflitto di interessi).',
    },
    guide: {
      heroTitle:          'Giuria Comunitaria — Proteggere l\'Integrità',
      heroSub:            'Hai trovato una foto sospetta? Clicca su Contesta e la giuria comunitaria emetterà un verdetto equo entro 72 ore.',
      howItWorksTitle:    'Come funziona?',
      pointTableTitle:    'Liquidazione punti per verdetto',
      repeatPenaltyTitle: 'Sanzioni per recidiva',
      eligibilityTitle:   'Chi può contestare?',
      faqTitle:           'Domande frequenti',
      ctaTitle:           'Costruiamo insieme una piattaforma affidabile',
      ctaSub:             'La tua partecipazione rende mytripfy più equo e prezioso per tutti.',
    },
  },

  /* ── RUSSIAN ───────────────────────────────────────────── */
  ru: {
    buttonText:        '🚩 Оспорить',
    systemName:        'Система проверки сообщества',
    tagline:           'Сообщество проверяет подлинность сертификатов',
    actionVerb:        'Оспорить',
    successMsg:        'Жалоба подана! 5 очков заложено.',
    stakeWarning:      '⚠️ Будет заложено 5 очков. При отклонении они будут потеряны.',
    reasonPlaceholder: 'Напр.: Это фото сделано не в заявленном месте. Фон совершенно другой.',
    alreadyFlagged:    '🚩 Оспорено',
    status: {
      clean:       '✅ Подтверждено',
      flagged:     '🚩 Отмечено',
      reviewing:   '⚖️ На рассмотрении',
      invalidated: '❌ Аннулировано',
    },
    jury: {
      title:       '⚖️ Голосование присяжных',
      validBtn:    '✅ Действительный',
      invalidBtn:  '❌ Недействительный',
      rewardNote:  '+2 очка за голосование',
      alreadyVoted:'Вы уже проголосовали',
      ownerNote:   'Вы не можете голосовать по своему сертификату.',
      reporterNote:'Заявители не могут быть присяжными (конфликт интересов).',
    },
    guide: {
      heroTitle:          'Суд присяжных — Защита целостности сертификатов',
      heroSub:            'Нашли подозрительное фото? Нажмите «Оспорить» и жюри вынесет справедливый вердикт в течение 72 часов.',
      howItWorksTitle:    'Как это работает?',
      pointTableTitle:    'Начисление очков по вердикту',
      repeatPenaltyTitle: 'Штрафы для рецидивистов',
      eligibilityTitle:   'Кто может оспорить?',
      faqTitle:           'Часто задаваемые вопросы',
      ctaTitle:           'Вместе строим надёжную платформу',
      ctaSub:             'Ваше участие делает mytripfy более справедливым и ценным для всех.',
    },
  },

  /* ── ARABIC ────────────────────────────────────────────── */
  ar: {
    buttonText:        '🚩 اعتراض',
    systemName:        'نظام التحقق المجتمعي',
    tagline:           'المجتمع يتحقق من صحة الشهادات',
    actionVerb:        'اعتراض',
    successMsg:        'تم تقديم الاعتراض! تم احتجاز 5 نقاط.',
    stakeWarning:      '⚠️ سيتم احتجاز 5 نقاط. إذا رُفض الاعتراض، ستخسرها.',
    reasonPlaceholder: 'مثال: هذه الصورة ليست من الموقع المُعلن. الخلفية مختلفة تمامًا.',
    alreadyFlagged:    '🚩 تم الاعتراض',
    status: {
      clean:       '✅ تم التحقق',
      flagged:     '🚩 مُبلَّغ عنه',
      reviewing:   '⚖️ قيد المراجعة',
      invalidated: '❌ ملغى',
    },
    jury: {
      title:       '⚖️ تصويت هيئة المحلفين',
      validBtn:    '✅ شهادة صحيحة',
      invalidBtn:  '❌ شهادة مزيفة',
      rewardNote:  '+2 نقطة للتصويت',
      alreadyVoted:'لقد صوّتَّ بالفعل',
      ownerNote:   'لا يمكنك التصويت على شهادتك الخاصة.',
      reporterNote:'لا يمكن للمبلِّغين المشاركة كمحلفين (تضارب مصالح).',
    },
    guide: {
      heroTitle:          'هيئة المحلفين المجتمعية — حماية نزاهة الشهادات',
      heroSub:            'وجدتَ صورة مشبوهة؟ انقر على اعتراض وستصدر هيئة المحلفين حكمًا عادلًا خلال 72 ساعة.',
      howItWorksTitle:    'كيف يعمل؟',
      pointTableTitle:    'تسوية النقاط حسب الحكم',
      repeatPenaltyTitle: 'عقوبات المخالفين المتكررين',
      eligibilityTitle:   'من يمكنه الاعتراض؟',
      faqTitle:           'الأسئلة الشائعة',
      ctaTitle:           'نبني معًا منصة موثوقة',
      ctaSub:             'مشاركتك تجعل mytripfy أكثر عدالة وقيمة للجميع.',
    },
  },

  /* ── HINDI ─────────────────────────────────────────────── */
  hi: {
    buttonText:        '🚩 आपत्ति',
    systemName:        'सामुदायिक सत्यापन प्रणाली',
    tagline:           'समुदाय प्रमाणपत्रों की जाँच करता है',
    actionVerb:        'आपत्ति दर्ज करें',
    successMsg:        'आपत्ति दर्ज हो गई! 5 अंक जमा किए गए।',
    stakeWarning:      '⚠️ 5 अंक जमा किए जाएंगे। खारिज होने पर ये खो जाएंगे।',
    reasonPlaceholder: 'उदा: यह फ़ोटो दावा किए गए स्थान की नहीं है। पृष्ठभूमि पूरी तरह अलग है।',
    alreadyFlagged:    '🚩 आपत्ति दर्ज',
    status: {
      clean:       '✅ सत्यापित',
      flagged:     '🚩 चिह्नित',
      reviewing:   '⚖️ समीक्षाधीन',
      invalidated: '❌ अमान्य',
    },
    jury: {
      title:       '⚖️ जूरी मतदान',
      validBtn:    '✅ वैध प्रमाणपत्र',
      invalidBtn:  '❌ अमान्य प्रमाणपत्र',
      rewardNote:  'मतदान पर +2 अंक',
      alreadyVoted:'आप पहले ही मत दे चुके हैं',
      ownerNote:   'आप अपने स्वयं के प्रमाणपत्र पर मत नहीं दे सकते।',
      reporterNote:'शिकायतकर्ता जूरर नहीं बन सकते (हितों का टकराव)।',
    },
    guide: {
      heroTitle:          'सामुदायिक जूरी — प्रमाणपत्रों की सत्यता की रक्षा',
      heroSub:            'संदिग्ध फ़ोटो मिली? आपत्ति दर्ज करें और सामुदायिक जूरी 72 घंटों में निष्पक्ष फैसला सुनाएगी।',
      howItWorksTitle:    'यह कैसे काम करता है?',
      pointTableTitle:    'फैसले के आधार पर अंकों का निपटान',
      repeatPenaltyTitle: 'बार-बार उल्लंघन पर दंड',
      eligibilityTitle:   'कौन आपत्ति दर्ज कर सकता है?',
      faqTitle:           'अक्सर पूछे जाने वाले प्रश्न',
      ctaTitle:           'मिलकर एक विश्वसनीय मंच बनाएं',
      ctaSub:             'आपकी भागीदारी mytripfy को सभी के लिए अधिक निष्पक्ष और मूल्यवान बनाती है।',
    },
  },

  /* ── TURKISH ───────────────────────────────────────────── */
  tr: {
    buttonText:        '🚩 İtiraz Et',
    systemName:        'Topluluk Doğrulama Sistemi',
    tagline:           'Topluluk sertifikaları doğrular',
    actionVerb:        'İtiraz Et',
    successMsg:        'İtiraz gönderildi! 5 puan teminat olarak yatırıldı.',
    stakeWarning:      '⚠️ 5 puan teminat olarak yatırılacak. Reddedilirse kaybedersiniz.',
    reasonPlaceholder: 'Örn: Bu fotoğraf iddia edilen yerden değil. Arka plan tamamen farklı.',
    alreadyFlagged:    '🚩 İtiraz Edildi',
    status: {
      clean:       '✅ Doğrulandı',
      flagged:     '🚩 İşaretlendi',
      reviewing:   '⚖️ İncelemede',
      invalidated: '❌ Geçersiz',
    },
    jury: {
      title:       '⚖️ Jüri Oylaması',
      validBtn:    '✅ Geçerli Sertifika',
      invalidBtn:  '❌ Sahte Sertifika',
      rewardNote:  'Oy için +2 puan',
      alreadyVoted:'Zaten oy kullandınız',
      ownerNote:   'Kendi sertifikanıza oy kullanamazsınız.',
      reporterNote:'İtiraz edenler jüri üyesi olamaz (çıkar çatışması).',
    },
    guide: {
      heroTitle:          'Topluluk Jürisi — Sertifika Bütünlüğünü Koruyoruz',
      heroSub:            'Şüpheli bir fotoğraf mı buldunuz? İtiraz Et\'e tıklayın ve topluluk jürisi 72 saat içinde adil bir karar verecek.',
      howItWorksTitle:    'Nasıl çalışır?',
      pointTableTitle:    'Karara Göre Puan Hesabı',
      repeatPenaltyTitle: 'Tekrar Suçlular İçin Cezalar',
      eligibilityTitle:   'Kim itiraz edebilir?',
      faqTitle:           'Sıkça Sorulan Sorular',
      ctaTitle:           'Birlikte Güvenilir Bir Platform İnşa Edelim',
      ctaSub:             'Katılımınız mytripfy\'yi herkes için daha adil ve değerli kılar.',
    },
  },

  /* ── INDONESIAN / MALAY (share base) ───────────────────── */
  id: {
    buttonText:        '🚩 Bantah',
    systemName:        'Sistem Verifikasi Komunitas',
    tagline:           'Komunitas memverifikasi sertifikasi bersama',
    actionVerb:        'Bantah',
    successMsg:        'Bantahan terkirim! 5 poin telah dijaminkan.',
    stakeWarning:      '⚠️ 5 poin akan dijaminkan. Jika ditolak, Anda kehilangannya.',
    reasonPlaceholder: 'Contoh: Foto ini bukan dari lokasi yang diklaim. Latar belakangnya sama sekali berbeda.',
    alreadyFlagged:    '🚩 Sudah Dibantah',
    status: {
      clean:       '✅ Terverifikasi',
      flagged:     '🚩 Ditandai',
      reviewing:   '⚖️ Sedang Ditinjau',
      invalidated: '❌ Tidak Valid',
    },
    jury: {
      title:       '⚖️ Suara Juri',
      validBtn:    '✅ Sertifikasi Valid',
      invalidBtn:  '❌ Sertifikasi Palsu',
      rewardNote:  '+2 poin untuk voting',
      alreadyVoted:'Anda sudah memberikan suara',
      ownerNote:   'Anda tidak dapat memberikan suara untuk sertifikasi Anda sendiri.',
      reporterNote:'Pelapor tidak dapat menjadi juri (konflik kepentingan).',
    },
    guide: {
      heroTitle:          'Juri Komunitas — Menjaga Integritas Sertifikasi',
      heroSub:            'Menemukan foto mencurigakan? Klik Bantah dan juri komunitas akan memberikan putusan adil dalam 72 jam.',
      howItWorksTitle:    'Bagaimana cara kerjanya?',
      pointTableTitle:    'Penyelesaian Poin Berdasarkan Putusan',
      repeatPenaltyTitle: 'Hukuman untuk Pelanggar Berulang',
      eligibilityTitle:   'Siapa yang bisa membantah?',
      faqTitle:           'Pertanyaan yang Sering Diajukan',
      ctaTitle:           'Bersama Membangun Platform yang Terpercaya',
      ctaSub:             'Partisipasi Anda membuat mytripfy lebih adil dan berharga bagi semua.',
    },
  },

  /* ── THAI ──────────────────────────────────────────────── */
  th: {
    buttonText:        '🚩 โต้แย้ง',
    systemName:        'ระบบตรวจสอบชุมชน',
    tagline:           'ชุมชนร่วมกันตรวจสอบการรับรอง',
    actionVerb:        'โต้แย้ง',
    successMsg:        'ส่งการโต้แย้งแล้ว! วางเดิมพัน 5 แต้ม',
    stakeWarning:      '⚠️ จะวางเดิมพัน 5 แต้ม หากถูกปฏิเสธ คุณจะเสียแต้มนั้น',
    reasonPlaceholder: 'เช่น: ภาพนี้ไม่ได้ถ่ายจากสถานที่ที่อ้าง พื้นหลังต่างกันอย่างสิ้นเชิง',
    alreadyFlagged:    '🚩 โต้แย้งแล้ว',
    status: {
      clean:       '✅ ยืนยันแล้ว',
      flagged:     '🚩 ถูกแจ้ง',
      reviewing:   '⚖️ กำลังตรวจสอบ',
      invalidated: '❌ ไม่ถูกต้อง',
    },
    jury: {
      title:       '⚖️ การลงคะแนนของคณะลูกขุน',
      validBtn:    '✅ การรับรองถูกต้อง',
      invalidBtn:  '❌ การรับรองปลอม',
      rewardNote:  '+2 แต้ม สำหรับการลงคะแนน',
      alreadyVoted:'คุณโหวตแล้ว',
      ownerNote:   'คุณไม่สามารถโหวตสำหรับการรับรองของตัวเอง',
      reporterNote:'ผู้แจ้งไม่สามารถเป็นลูกขุนได้ (ผลประโยชน์ขัดกัน)',
    },
    guide: {
      heroTitle:          'คณะลูกขุนชุมชน — รักษาความซื่อสัตย์ของการรับรอง',
      heroSub:            'พบภาพน่าสงสัยใช่ไหม? คลิกโต้แย้ง แล้วคณะลูกขุนชุมชนจะตัดสินอย่างยุติธรรมภายใน 72 ชั่วโมง',
      howItWorksTitle:    'ทำงานอย่างไร?',
      pointTableTitle:    'การชำระแต้มตามคำตัดสิน',
      repeatPenaltyTitle: 'บทลงโทษสำหรับผู้กระทำผิดซ้ำ',
      eligibilityTitle:   'ใครโต้แย้งได้บ้าง?',
      faqTitle:           'คำถามที่พบบ่อย',
      ctaTitle:           'ร่วมกันสร้างแพลตฟอร์มที่น่าเชื่อถือ',
      ctaSub:             'การมีส่วนร่วมของคุณทำให้ mytripfy ยุติธรรมและมีคุณค่ามากขึ้นสำหรับทุกคน',
    },
  },

  /* ── VIETNAMESE ────────────────────────────────────────── */
  vi: {
    buttonText:        '🚩 Phản đối',
    systemName:        'Hệ thống Xác minh Cộng đồng',
    tagline:           'Cộng đồng cùng xác minh chứng nhận',
    actionVerb:        'Phản đối',
    successMsg:        'Phản đối đã gửi! 5 điểm đã được đặt cược.',
    stakeWarning:      '⚠️ 5 điểm sẽ được đặt cược. Nếu bị bác, bạn sẽ mất số điểm đó.',
    reasonPlaceholder: 'Vd: Ảnh này không được chụp tại địa điểm được khai báo. Nền hoàn toàn khác.',
    alreadyFlagged:    '🚩 Đã phản đối',
    status: {
      clean:       '✅ Đã xác minh',
      flagged:     '🚩 Đã gắn cờ',
      reviewing:   '⚖️ Đang xem xét',
      invalidated: '❌ Không hợp lệ',
    },
    jury: {
      title:       '⚖️ Bỏ phiếu Bồi thẩm đoàn',
      validBtn:    '✅ Chứng nhận hợp lệ',
      invalidBtn:  '❌ Chứng nhận giả',
      rewardNote:  '+2 điểm khi bỏ phiếu',
      alreadyVoted:'Bạn đã bỏ phiếu rồi',
      ownerNote:   'Bạn không thể bỏ phiếu cho chứng nhận của chính mình.',
      reporterNote:'Người tố cáo không thể làm bồi thẩm (xung đột lợi ích).',
    },
    guide: {
      heroTitle:          'Bồi thẩm đoàn Cộng đồng — Bảo vệ tính trung thực',
      heroSub:            'Phát hiện ảnh đáng ngờ? Nhấn Phản đối và bồi thẩm đoàn cộng đồng sẽ đưa ra phán quyết công bằng trong 72 giờ.',
      howItWorksTitle:    'Hoạt động như thế nào?',
      pointTableTitle:    'Thanh toán điểm theo phán quyết',
      repeatPenaltyTitle: 'Hình phạt cho người vi phạm nhiều lần',
      eligibilityTitle:   'Ai có thể phản đối?',
      faqTitle:           'Câu hỏi thường gặp',
      ctaTitle:           'Cùng xây dựng nền tảng đáng tin cậy',
      ctaSub:             'Sự tham gia của bạn giúp mytripfy công bằng và có giá trị hơn cho tất cả.',
    },
  },
}

/* ── Fallback aliases ─────────────────────────────────────── */
labels['pt-BR'] = labels['pt']
labels['ms']    = labels['id']   // Malay ≈ Indonesian

/* Default languages not explicitly translated → English */
const SUPPORTED = new Set(Object.keys(labels))

/**
 * Returns locale-appropriate dispute labels.
 * Falls back to English for unsupported locales.
 */
export function getDisputeLabels(locale: string): DisputeLabels {
  return labels[locale] ?? labels['en']
}

export default labels
