const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'messages');

const translations = {
  ja: {
    HomeSection: { privacyPolicy: 'プライバシーポリシー' },
    Companions: { filterByCountry: '国:', allCountries: 'すべての国', viewAllCountries: 'すべて表示', filterByPurpose: '目的:' },
    HallOfFame: { myRank: '私のランク #{rank}' },
    Privacy: {
      pageTitle: 'プライバシーポリシー', effectiveDate: '施行日: 2026年3月1日',
      intro: 'mytripfy（「当社」または「本サービス」）は、お客様の個人情報の保護に努めています。本プライバシーポリシーは、当社が収集する情報、その使用方法、およびお客様の選択肢について説明します。',
      s1Title: '収集する情報', s1Body: '当社は以下の種類の情報を収集します：\n• アカウント情報：名前、メールアドレス、プロフィール写真、パスワード。\n• プロフィール情報：国籍、旅行レベル、自己紹介など。\n• 旅行コンテンツ：同行者募集、ガイドリクエスト、旅行記録、レビュー、チャレンジ認定。\n• 利用データ：閲覧ページ、検索クエリ、サービス内でのやり取り。\n• デバイス情報：ブラウザの種類、OS、IPアドレス、言語設定。',
      s2Title: '情報の使用方法', s2Body: '収集した情報は以下の目的で使用します：\n• mytripfyプラットフォームの提供と運営。\n• 旅行仲間やローカルガイドとのマッチング。\n• サービス通知、申請更新、プラットフォーム内メッセージの送信。\n• 機能とユーザー体験の改善。\n• 不正行為の検出と防止。\n• 法的義務の遵守。',
      s3Title: '情報の共有', s3Body: '当社はお客様の個人情報を販売しません。以下の場合に情報を共有することがあります：\n• 他のユーザーと：公開プロフィール、投稿、レビューは他の登録ユーザーに表示されます。\n• サービスプロバイダーと：Supabase、Vercelなどのインフラプロバイダー。\n• 法的理由：法律で要求される場合。\n• 事業譲渡：合併や買収の場合。',
      s4Title: 'データの保持', s4Body: 'アカウントが有効である限り、またはサービス提供に必要な限り、個人データを保持します。アカウント削除を要求された場合、30日以内に個人情報を削除します。',
      s5Title: 'お客様の権利', s5Body: 'お客様には以下の権利があります：\n• 当社が保有する個人データへのアクセス。\n• 不正確または不完全なデータの修正。\n• アカウントと個人データの削除要求。\n• オプションのデータ使用に対する同意の撤回。\n\nこれらの権利を行使するには、swbaek60@gmail.comまでご連絡ください。',
      s6Title: 'クッキーとローカルストレージ', s6Body: 'mytripfyはセッション維持、言語・通貨設定の記憶、サイトパフォーマンスの向上のためにクッキーとローカルストレージを使用します。',
      s7Title: 'セキュリティ', s7Body: 'HTTPS暗号化、アクセス制御、安全なパスワードハッシュなど、業界標準のセキュリティ対策を実施しています。',
      s8Title: '第三者リンク', s8Body: '本サービスには第三者ウェブサイトへのリンクが含まれる場合があります。それらのプライバシー慣行について当社は責任を負いません。',
      contactTitle: 'お問い合わせ', contactBody: 'このプライバシーポリシーやデータの取り扱いについてご質問がある場合は、お問い合わせください：',
      backHome: 'ホームに戻る'
    }
  },
  zh: {
    Privacy: {
      pageTitle: '隐私政策', effectiveDate: '生效日期：2026年3月1日',
      intro: 'mytripfy（"我们"或"本服务"）致力于保护您的个人信息。本隐私政策说明了我们收集的信息、使用方式以及您的选择。',
      s1Title: '我们收集的信息', s1Body: '我们收集以下类型的信息：\n• 账户信息：姓名、电子邮件、头像、密码。\n• 个人资料：国籍、旅行等级、简介等。\n• 旅行内容：同伴帖子、导游请求、旅行记录、评价、挑战认证。\n• 使用数据：访问页面、搜索查询、互动记录。\n• 设备信息：浏览器类型、操作系统、IP地址、语言设置。',
      s2Title: '信息使用方式', s2Body: '我们使用收集的信息来：\n• 提供和运营mytripfy平台。\n• 匹配旅行伙伴和当地导游。\n• 发送通知和消息。\n• 改进功能和用户体验。\n• 检测和防止欺诈。\n• 遵守法律义务。',
      s3Title: '信息共享', s3Body: '我们不出售您的个人信息。\n• 与其他用户：您的公开资料对其他注册用户可见。\n• 与服务提供商：Supabase、Vercel等。\n• 法律原因。\n• 业务转让。',
      s4Title: '数据保留', s4Body: '在您的账户有效期间保留您的个人数据。如果您请求删除账户，我们将在30天内删除您的个人信息。',
      s5Title: '您的权利', s5Body: '您有权：\n• 访问我们持有的个人数据。\n• 更正不准确的数据。\n• 请求删除账户和个人数据。\n• 撤回同意。\n\n请联系swbaek60@gmail.com行使这些权利。',
      s6Title: 'Cookie和本地存储', s6Body: 'mytripfy使用Cookie和本地存储来维持会话、记住语言和货币偏好设置并改善网站性能。',
      s7Title: '安全性', s7Body: '我们实施行业标准的安全措施，包括HTTPS加密、访问控制和安全密码哈希。',
      s8Title: '第三方链接', s8Body: '本服务可能包含第三方网站的链接。我们不对这些网站的隐私做法负责。',
      contactTitle: '联系我们', contactBody: '如果您对本隐私政策有任何疑问，请联系我们：',
      backHome: '返回首页'
    },
    HomeSection: { privacyPolicy: '隐私政策' },
    Companions: { filterByCountry: '国家：', allCountries: '所有国家', viewAllCountries: '查看全部', filterByPurpose: '目的：' },
    HallOfFame: { myRank: '我的排名 #{rank}' }
  },
  'zh-TW': {
    Privacy: {
      pageTitle: '隱私權政策', effectiveDate: '生效日期：2026年3月1日',
      intro: 'mytripfy（「我們」或「本服務」）致力於保護您的個人資訊。本隱私權政策說明了我們收集的資訊、使用方式及您的選擇。',
      s1Title: '我們收集的資訊', s1Body: '我們收集以下類型的資訊：\n• 帳戶資訊：姓名、電子郵件、大頭照、密碼。\n• 個人資料：國籍、旅行等級、簡介等。\n• 旅行內容：同伴貼文、導遊請求、旅行記錄、評價、挑戰認證。\n• 使用數據：瀏覽頁面、搜尋查詢、互動記錄。\n• 裝置資訊：瀏覽器類型、作業系統、IP位址、語言設定。',
      s2Title: '資訊使用方式', s2Body: '我們使用收集的資訊來：\n• 提供和營運mytripfy平台。\n• 配對旅行夥伴和當地導遊。\n• 發送通知和訊息。\n• 改善功能和使用者體驗。\n• 偵測和防止詐騙。\n• 遵守法律義務。',
      s3Title: '資訊共享', s3Body: '我們不出售您的個人資訊。\n• 與其他使用者：您的公開資料對其他註冊使用者可見。\n• 與服務提供商：Supabase、Vercel等。\n• 法律原因。\n• 業務轉讓。',
      s4Title: '資料保留', s4Body: '在您的帳戶有效期間保留您的個人資料。如果您請求刪除帳戶，我們將在30天內刪除您的個人資訊。',
      s5Title: '您的權利', s5Body: '您有權：\n• 存取我們持有的個人資料。\n• 更正不準確的資料。\n• 請求刪除帳戶和個人資料。\n• 撤回同意。\n\n請聯繫swbaek60@gmail.com行使這些權利。',
      s6Title: 'Cookie和本地儲存', s6Body: 'mytripfy使用Cookie和本地儲存來維持工作階段、記住語言和貨幣偏好設定並改善網站效能。',
      s7Title: '安全性', s7Body: '我們實施業界標準的安全措施，包括HTTPS加密、存取控制和安全密碼雜湊。',
      s8Title: '第三方連結', s8Body: '本服務可能包含第三方網站的連結。我們不對這些網站的隱私做法負責。',
      contactTitle: '聯絡我們', contactBody: '如果您對本隱私權政策有任何疑問，請聯絡我們：',
      backHome: '返回首頁'
    },
    HomeSection: { privacyPolicy: '隱私權政策' },
    Companions: { filterByCountry: '國家：', allCountries: '所有國家', viewAllCountries: '查看全部', filterByPurpose: '目的：' },
    HallOfFame: { myRank: '我的排名 #{rank}' }
  },
  de: {
    HomeSection: { privacyPolicy: 'Datenschutzrichtlinie' },
    Companions: { filterByCountry: 'Land:', allCountries: 'Alle Länder', viewAllCountries: 'Alle anzeigen', filterByPurpose: 'Zweck:' },
    HallOfFame: { myRank: 'Mein Rang #{rank}' },
    Privacy: {
      pageTitle: 'Datenschutzrichtlinie', effectiveDate: 'Gültig ab: 1. März 2026',
      intro: 'mytripfy ("wir" oder "der Dienst") ist dem Schutz Ihrer persönlichen Daten verpflichtet. Diese Datenschutzrichtlinie erklärt, welche Informationen wir erheben und wie wir sie verwenden.',
      s1Title: 'Erhobene Informationen', s1Body: 'Wir erheben folgende Informationen:\n• Kontodaten: Name, E-Mail, Profilbild, Passwort.\n• Profildaten: Nationalität, Reisestufe, Biografie.\n• Reiseinhalte: Begleiterbeiträge, Guide-Anfragen, Reiseaufzeichnungen, Bewertungen, Challenge-Zertifizierungen.\n• Nutzungsdaten: besuchte Seiten, Suchanfragen, Interaktionen.\n• Gerätedaten: Browsertyp, Betriebssystem, IP-Adresse, Spracheinstellungen.',
      s2Title: 'Verwendung der Informationen', s2Body: 'Wir verwenden die gesammelten Informationen, um:\n• Die mytripfy-Plattform bereitzustellen und zu betreiben.\n• Reisepartner und lokale Guides zu vermitteln.\n• Benachrichtigungen und Nachrichten zu senden.\n• Funktionen und Nutzererfahrung zu verbessern.\n• Betrug zu erkennen und zu verhindern.\n• Gesetzliche Pflichten zu erfüllen.',
      s3Title: 'Weitergabe von Informationen', s3Body: 'Wir verkaufen Ihre persönlichen Daten nicht.\n• Mit anderen Nutzern: Ihr öffentliches Profil ist für registrierte Nutzer sichtbar.\n• Mit Dienstanbietern: Supabase, Vercel usw.\n• Aus rechtlichen Gründen.\n• Bei Geschäftsübertragungen.',
      s4Title: 'Datenspeicherung', s4Body: 'Wir speichern Ihre persönlichen Daten, solange Ihr Konto aktiv ist. Bei Kontolöschung löschen wir Ihre Daten innerhalb von 30 Tagen.',
      s5Title: 'Ihre Rechte', s5Body: 'Sie haben das Recht auf:\n• Zugang zu Ihren persönlichen Daten.\n• Berichtigung ungenauer Daten.\n• Löschung Ihres Kontos und Ihrer Daten.\n• Widerruf der Einwilligung.\n\nKontaktieren Sie swbaek60@gmail.com zur Ausübung dieser Rechte.',
      s6Title: 'Cookies & Lokaler Speicher', s6Body: 'mytripfy verwendet Cookies und lokalen Speicher zur Sitzungsverwaltung und Verbesserung der Website-Leistung.',
      s7Title: 'Sicherheit', s7Body: 'Wir setzen branchenübliche Sicherheitsmaßnahmen ein, darunter HTTPS-Verschlüsselung, Zugriffskontrollen und sicheres Passwort-Hashing.',
      s8Title: 'Links zu Drittanbietern', s8Body: 'Unser Dienst kann Links zu Drittanbieter-Websites enthalten. Wir sind nicht für deren Datenschutzpraktiken verantwortlich.',
      contactTitle: 'Kontakt', contactBody: 'Bei Fragen zu dieser Datenschutzrichtlinie kontaktieren Sie uns bitte:',
      backHome: 'Zurück zur Startseite'
    }
  },
  fr: {
    HomeSection: { privacyPolicy: 'Politique de confidentialité' },
    Companions: { filterByCountry: 'Pays :', allCountries: 'Tous les pays', viewAllCountries: 'Voir tout', filterByPurpose: 'Objectif :' },
    HallOfFame: { myRank: 'Mon rang #{rank}' },
    Privacy: {
      pageTitle: 'Politique de confidentialité', effectiveDate: 'Date d\'entrée en vigueur : 1er mars 2026',
      intro: 'mytripfy (« nous » ou « le Service ») s\'engage à protéger vos informations personnelles. Cette politique explique les informations que nous collectons et comment nous les utilisons.',
      s1Title: 'Informations collectées', s1Body: 'Nous collectons les types d\'informations suivants :\n• Informations de compte : nom, e-mail, photo de profil, mot de passe.\n• Informations de profil : nationalité, niveau de voyage, biographie.\n• Contenu de voyage : posts, demandes de guide, avis, certifications de défis.\n• Données d\'utilisation : pages visitées, requêtes de recherche, interactions.\n• Informations sur l\'appareil : type de navigateur, OS, adresse IP, paramètres de langue.',
      s2Title: 'Utilisation des informations', s2Body: 'Nous utilisons les informations collectées pour :\n• Fournir et exploiter la plateforme mytripfy.\n• Vous mettre en relation avec des compagnons de voyage et des guides locaux.\n• Envoyer des notifications et des messages.\n• Améliorer les fonctionnalités et l\'expérience utilisateur.\n• Détecter et prévenir la fraude.\n• Respecter les obligations légales.',
      s3Title: 'Partage des informations', s3Body: 'Nous ne vendons pas vos informations personnelles.\n• Avec d\'autres utilisateurs : votre profil public est visible par les utilisateurs inscrits.\n• Avec les prestataires de services : Supabase, Vercel, etc.\n• Pour des raisons légales.\n• En cas de transfert d\'entreprise.',
      s4Title: 'Conservation des données', s4Body: 'Nous conservons vos données tant que votre compte est actif. En cas de suppression, nous supprimerons vos informations dans les 30 jours.',
      s5Title: 'Vos droits', s5Body: 'Vous avez le droit de :\n• Accéder à vos données personnelles.\n• Corriger les données inexactes.\n• Demander la suppression de votre compte.\n• Retirer votre consentement.\n\nContactez swbaek60@gmail.com pour exercer ces droits.',
      s6Title: 'Cookies et stockage local', s6Body: 'mytripfy utilise des cookies et le stockage local pour maintenir votre session et améliorer les performances du site.',
      s7Title: 'Sécurité', s7Body: 'Nous mettons en œuvre des mesures de sécurité standard, notamment le chiffrement HTTPS, les contrôles d\'accès et le hachage sécurisé des mots de passe.',
      s8Title: 'Liens vers des tiers', s8Body: 'Notre service peut contenir des liens vers des sites tiers. Nous ne sommes pas responsables de leurs pratiques de confidentialité.',
      contactTitle: 'Nous contacter', contactBody: 'Pour toute question concernant cette politique de confidentialité, veuillez nous contacter :',
      backHome: 'Retour à l\'accueil'
    }
  },
  es: {
    HomeSection: { privacyPolicy: 'Política de privacidad' },
    Companions: { filterByCountry: 'País:', allCountries: 'Todos los países', viewAllCountries: 'Ver todos', filterByPurpose: 'Propósito:' },
    HallOfFame: { myRank: 'Mi rango #{rank}' },
    Privacy: {
      pageTitle: 'Política de privacidad', effectiveDate: 'Fecha de vigencia: 1 de marzo de 2026',
      intro: 'mytripfy ("nosotros" o "el Servicio") se compromete a proteger tu información personal. Esta política explica qué información recopilamos y cómo la utilizamos.',
      s1Title: 'Información que recopilamos', s1Body: 'Recopilamos los siguientes tipos de información:\n• Información de cuenta: nombre, correo electrónico, foto de perfil, contraseña.\n• Información de perfil: nacionalidad, nivel de viaje, biografía.\n• Contenido de viaje: publicaciones, solicitudes de guía, reseñas, certificaciones de desafíos.\n• Datos de uso: páginas visitadas, consultas de búsqueda, interacciones.\n• Información del dispositivo: tipo de navegador, SO, dirección IP, configuración de idioma.',
      s2Title: 'Uso de la información', s2Body: 'Utilizamos la información recopilada para:\n• Proporcionar y operar la plataforma mytripfy.\n• Conectarte con compañeros de viaje y guías locales.\n• Enviar notificaciones y mensajes.\n• Mejorar funciones y experiencia de usuario.\n• Detectar y prevenir fraude.\n• Cumplir con obligaciones legales.',
      s3Title: 'Compartir información', s3Body: 'No vendemos tu información personal.\n• Con otros usuarios: tu perfil público es visible para usuarios registrados.\n• Con proveedores de servicios: Supabase, Vercel, etc.\n• Por razones legales.\n• Transferencias de negocio.',
      s4Title: 'Retención de datos', s4Body: 'Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación, eliminaremos tus datos en un plazo de 30 días.',
      s5Title: 'Tus derechos', s5Body: 'Tienes derecho a:\n• Acceder a tus datos personales.\n• Corregir datos inexactos.\n• Solicitar la eliminación de tu cuenta.\n• Retirar tu consentimiento.\n\nContacta a swbaek60@gmail.com para ejercer estos derechos.',
      s6Title: 'Cookies y almacenamiento local', s6Body: 'mytripfy utiliza cookies y almacenamiento local para mantener tu sesión y mejorar el rendimiento del sitio.',
      s7Title: 'Seguridad', s7Body: 'Implementamos medidas de seguridad estándar, incluyendo cifrado HTTPS, controles de acceso y hash seguro de contraseñas.',
      s8Title: 'Enlaces de terceros', s8Body: 'Nuestro servicio puede contener enlaces a sitios de terceros. No somos responsables de sus prácticas de privacidad.',
      contactTitle: 'Contáctanos', contactBody: 'Si tienes preguntas sobre esta política de privacidad, contáctanos:',
      backHome: 'Volver al inicio'
    }
  },
  ru: {
    HomeSection: { privacyPolicy: 'Политика конфиденциальности' },
    Companions: { filterByCountry: 'Страна:', allCountries: 'Все страны', viewAllCountries: 'Показать все', filterByPurpose: 'Цель:' },
    HallOfFame: { myRank: 'Мой ранг #{rank}' },
    Privacy: {
      pageTitle: 'Политика конфиденциальности', effectiveDate: 'Дата вступления в силу: 1 марта 2026 г.',
      intro: 'mytripfy («мы» или «Сервис») стремится защищать вашу личную информацию. Настоящая политика объясняет, какую информацию мы собираем и как её используем.',
      s1Title: 'Собираемая информация', s1Body: 'Мы собираем следующие типы информации:\n• Данные аккаунта: имя, электронная почта, фото профиля, пароль.\n• Данные профиля: национальность, уровень путешествий, биография.\n• Контент о путешествиях: публикации, запросы на гида, отзывы, сертификации челленджей.\n• Данные использования: посещённые страницы, поисковые запросы, взаимодействия.\n• Данные устройства: тип браузера, ОС, IP-адрес, языковые настройки.',
      s2Title: 'Использование информации', s2Body: 'Мы используем собранную информацию для:\n• Предоставления и эксплуатации платформы mytripfy.\n• Подбора попутчиков и местных гидов.\n• Отправки уведомлений и сообщений.\n• Улучшения функций и пользовательского опыта.\n• Обнаружения и предотвращения мошенничества.\n• Соблюдения правовых обязательств.',
      s3Title: 'Передача информации', s3Body: 'Мы не продаём вашу личную информацию.\n• Другим пользователям: ваш публичный профиль виден зарегистрированным пользователям.\n• Поставщикам услуг: Supabase, Vercel и т.д.\n• По юридическим причинам.\n• При передаче бизнеса.',
      s4Title: 'Хранение данных', s4Body: 'Мы храним ваши данные, пока ваш аккаунт активен. При запросе удаления мы удалим ваши данные в течение 30 дней.',
      s5Title: 'Ваши права', s5Body: 'Вы имеете право:\n• На доступ к вашим персональным данным.\n• На исправление неточных данных.\n• На удаление аккаунта и данных.\n• На отзыв согласия.\n\nСвяжитесь с swbaek60@gmail.com для реализации этих прав.',
      s6Title: 'Файлы cookie и локальное хранилище', s6Body: 'mytripfy использует файлы cookie и локальное хранилище для поддержки сеанса и улучшения производительности сайта.',
      s7Title: 'Безопасность', s7Body: 'Мы применяем стандартные меры безопасности, включая шифрование HTTPS, контроль доступа и безопасное хеширование паролей.',
      s8Title: 'Ссылки на сторонние ресурсы', s8Body: 'Наш сервис может содержать ссылки на сторонние сайты. Мы не несём ответственности за их политику конфиденциальности.',
      contactTitle: 'Свяжитесь с нами', contactBody: 'Если у вас есть вопросы о данной политике конфиденциальности, свяжитесь с нами:',
      backHome: 'На главную'
    }
  },
  th: {
    HomeSection: { privacyPolicy: 'นโยบายความเป็นส่วนตัว' },
    Companions: { filterByCountry: 'ประเทศ:', allCountries: 'ทุกประเทศ', viewAllCountries: 'ดูทั้งหมด', filterByPurpose: 'วัตถุประสงค์:' },
    HallOfFame: { myRank: 'อันดับของฉัน #{rank}' },
    Privacy: { pageTitle: 'นโยบายความเป็นส่วนตัว', backHome: 'กลับหน้าหลัก', effectiveDate: 'วันที่มีผลบังคับใช้: 1 มีนาคม 2026', intro: 'mytripfy ("เรา" หรือ "บริการ") มุ่งมั่นที่จะปกป้องข้อมูลส่วนบุคคลของคุณ', s1Title: 'ข้อมูลที่เราเก็บรวบรวม', s2Title: 'การใช้ข้อมูล', s3Title: 'การแบ่งปันข้อมูล', s4Title: 'การเก็บรักษาข้อมูล', s5Title: 'สิทธิ์ของคุณ', s6Title: 'คุกกี้และที่เก็บข้อมูลในเครื่อง', s7Title: 'ความปลอดภัย', s8Title: 'ลิงก์ของบุคคลที่สาม', contactTitle: 'ติดต่อเรา' }
  },
  vi: {
    HomeSection: { privacyPolicy: 'Chính sách quyền riêng tư' },
    Companions: { filterByCountry: 'Quốc gia:', allCountries: 'Tất cả quốc gia', viewAllCountries: 'Xem tất cả', filterByPurpose: 'Mục đích:' },
    HallOfFame: { myRank: 'Xếp hạng của tôi #{rank}' },
    Privacy: { pageTitle: 'Chính sách quyền riêng tư', backHome: 'Về trang chủ', effectiveDate: 'Ngày hiệu lực: 1 tháng 3 năm 2026', intro: 'mytripfy ("chúng tôi" hoặc "Dịch vụ") cam kết bảo vệ thông tin cá nhân của bạn.', s1Title: 'Thông tin chúng tôi thu thập', s2Title: 'Cách sử dụng thông tin', s3Title: 'Chia sẻ thông tin', s4Title: 'Lưu giữ dữ liệu', s5Title: 'Quyền của bạn', s6Title: 'Cookie và bộ nhớ cục bộ', s7Title: 'Bảo mật', s8Title: 'Liên kết bên thứ ba', contactTitle: 'Liên hệ' }
  },
  id: {
    HomeSection: { privacyPolicy: 'Kebijakan Privasi' },
    Companions: { filterByCountry: 'Negara:', allCountries: 'Semua negara', viewAllCountries: 'Lihat semua', filterByPurpose: 'Tujuan:' },
    HallOfFame: { myRank: 'Peringkat saya #{rank}' },
    Privacy: { pageTitle: 'Kebijakan Privasi', backHome: 'Kembali ke beranda', effectiveDate: 'Tanggal berlaku: 1 Maret 2026', intro: 'mytripfy ("kami" atau "Layanan") berkomitmen untuk melindungi informasi pribadi Anda.', s1Title: 'Informasi yang Kami Kumpulkan', s2Title: 'Penggunaan Informasi', s3Title: 'Berbagi Informasi', s4Title: 'Penyimpanan Data', s5Title: 'Hak Anda', s6Title: 'Cookie dan Penyimpanan Lokal', s7Title: 'Keamanan', s8Title: 'Tautan Pihak Ketiga', contactTitle: 'Hubungi Kami' }
  },
  ms: {
    HomeSection: { privacyPolicy: 'Dasar Privasi' },
    Companions: { filterByCountry: 'Negara:', allCountries: 'Semua negara', viewAllCountries: 'Lihat semua', filterByPurpose: 'Tujuan:' },
    HallOfFame: { myRank: 'Kedudukan saya #{rank}' },
    Privacy: { pageTitle: 'Dasar Privasi', backHome: 'Kembali ke laman utama', effectiveDate: 'Tarikh berkuat kuasa: 1 Mac 2026', intro: 'mytripfy ("kami" atau "Perkhidmatan") komited untuk melindungi maklumat peribadi anda.', s1Title: 'Maklumat Yang Kami Kumpul', s2Title: 'Penggunaan Maklumat', s3Title: 'Perkongsian Maklumat', s4Title: 'Penyimpanan Data', s5Title: 'Hak Anda', s6Title: 'Kuki dan Storan Setempat', s7Title: 'Keselamatan', s8Title: 'Pautan Pihak Ketiga', contactTitle: 'Hubungi Kami' }
  },
  ar: {
    HomeSection: { privacyPolicy: 'سياسة الخصوصية' },
    Companions: { filterByCountry: 'البلد:', allCountries: 'جميع البلدان', viewAllCountries: 'عرض الكل', filterByPurpose: 'الغرض:' },
    HallOfFame: { myRank: 'ترتيبي #{rank}' },
    Privacy: { pageTitle: 'سياسة الخصوصية', backHome: 'العودة للرئيسية', effectiveDate: 'تاريخ السريان: 1 مارس 2026', intro: 'تلتزم mytripfy ("نحن" أو "الخدمة") بحماية معلوماتك الشخصية.', s1Title: 'المعلومات التي نجمعها', s2Title: 'كيف نستخدم المعلومات', s3Title: 'مشاركة المعلومات', s4Title: 'الاحتفاظ بالبيانات', s5Title: 'حقوقك', s6Title: 'ملفات تعريف الارتباط والتخزين المحلي', s7Title: 'الأمان', s8Title: 'روابط الطرف الثالث', contactTitle: 'اتصل بنا' }
  },
  hi: {
    HomeSection: { privacyPolicy: 'गोपनीयता नीति' },
    Companions: { filterByCountry: 'देश:', allCountries: 'सभी देश', viewAllCountries: 'सभी देखें', filterByPurpose: 'उद्देश्य:' },
    HallOfFame: { myRank: 'मेरा रैंक #{rank}' },
    Privacy: { pageTitle: 'गोपनीयता नीति', backHome: 'होम पर वापस जाएं', effectiveDate: 'प्रभावी तिथि: 1 मार्च 2026', intro: 'mytripfy ("हम" या "सेवा") आपकी व्यक्तिगत जानकारी की सुरक्षा के लिए प्रतिबद्ध है।', s1Title: 'हम कौन सी जानकारी एकत्र करते हैं', s2Title: 'जानकारी का उपयोग', s3Title: 'जानकारी साझा करना', s4Title: 'डेटा प्रतिधारण', s5Title: 'आपके अधिकार', s6Title: 'कुकीज़ और स्थानीय संग्रहण', s7Title: 'सुरक्षा', s8Title: 'तृतीय-पक्ष लिंक', contactTitle: 'संपर्क करें' }
  },
  bn: {
    HomeSection: { privacyPolicy: 'গোপনীয়তা নীতি' },
    Companions: { filterByCountry: 'দেশ:', allCountries: 'সব দেশ', viewAllCountries: 'সব দেখুন', filterByPurpose: 'উদ্দেশ্য:' },
    HallOfFame: { myRank: 'আমার র‍্যাঙ্ক #{rank}' },
    Privacy: { pageTitle: 'গোপনীয়তা নীতি', backHome: 'হোমে ফিরে যান', effectiveDate: 'কার্যকর তারিখ: ১ মার্চ ২০২৬', intro: 'mytripfy ("আমরা" বা "পরিষেবা") আপনার ব্যক্তিগত তথ্য সুরক্ষায় প্রতিশ্রুতিবদ্ধ।', s1Title: 'আমরা যে তথ্য সংগ্রহ করি', s2Title: 'তথ্যের ব্যবহার', s3Title: 'তথ্য ভাগ করা', s4Title: 'ডেটা সংরক্ষণ', s5Title: 'আপনার অধিকার', s6Title: 'কুকিজ ও লোকাল স্টোরেজ', s7Title: 'নিরাপত্তা', s8Title: 'তৃতীয়-পক্ষ লিঙ্ক', contactTitle: 'যোগাযোগ' }
  },
  fa: {
    HomeSection: { privacyPolicy: 'سیاست حفظ حریم خصوصی' },
    Companions: { filterByCountry: 'کشور:', allCountries: 'همه کشورها', viewAllCountries: 'مشاهده همه', filterByPurpose: 'هدف:' },
    HallOfFame: { myRank: 'رتبه من #{rank}' },
    Privacy: { pageTitle: 'سیاست حفظ حریم خصوصی', backHome: 'بازگشت به صفحه اصلی', effectiveDate: 'تاریخ اجرا: ۱ مارس ۲۰۲۶', intro: 'mytripfy ("ما" یا "خدمات") متعهد به حفاظت از اطلاعات شخصی شما است.', s1Title: 'اطلاعاتی که جمع‌آوری می‌کنیم', s2Title: 'نحوه استفاده از اطلاعات', s3Title: 'اشتراک‌گذاری اطلاعات', s4Title: 'نگهداری داده‌ها', s5Title: 'حقوق شما', s6Title: 'کوکی‌ها و حافظه محلی', s7Title: 'امنیت', s8Title: 'لینک‌های شخص ثالث', contactTitle: 'تماس با ما' }
  },
  tr: {
    HomeSection: { privacyPolicy: 'Gizlilik Politikası' },
    Companions: { filterByCountry: 'Ülke:', allCountries: 'Tüm ülkeler', viewAllCountries: 'Tümünü gör', filterByPurpose: 'Amaç:' },
    HallOfFame: { myRank: 'Sıralamam #{rank}' },
    Privacy: { pageTitle: 'Gizlilik Politikası', backHome: 'Ana sayfaya dön', effectiveDate: 'Yürürlük tarihi: 1 Mart 2026', intro: 'mytripfy ("biz" veya "Hizmet") kişisel bilgilerinizi korumayı taahhüt eder.', s1Title: 'Topladığımız Bilgiler', s2Title: 'Bilgilerin Kullanımı', s3Title: 'Bilgi Paylaşımı', s4Title: 'Veri Saklama', s5Title: 'Haklarınız', s6Title: 'Çerezler ve Yerel Depolama', s7Title: 'Güvenlik', s8Title: 'Üçüncü Taraf Bağlantıları', contactTitle: 'Bize Ulaşın' }
  },
  pl: {
    HomeSection: { privacyPolicy: 'Polityka prywatności' },
    Companions: { filterByCountry: 'Kraj:', allCountries: 'Wszystkie kraje', viewAllCountries: 'Pokaż wszystkie', filterByPurpose: 'Cel:' },
    HallOfFame: { myRank: 'Mój ranking #{rank}' },
    Privacy: { pageTitle: 'Polityka prywatności', backHome: 'Powrót do strony głównej', effectiveDate: 'Data wejścia w życie: 1 marca 2026', intro: 'mytripfy ("my" lub "Usługa") zobowiązuje się do ochrony Twoich danych osobowych.', s1Title: 'Zbierane informacje', s2Title: 'Wykorzystanie informacji', s3Title: 'Udostępnianie informacji', s4Title: 'Przechowywanie danych', s5Title: 'Twoje prawa', s6Title: 'Pliki cookie i pamięć lokalna', s7Title: 'Bezpieczeństwo', s8Title: 'Linki do stron trzecich', contactTitle: 'Kontakt' }
  },
  nl: {
    HomeSection: { privacyPolicy: 'Privacybeleid' },
    Companions: { filterByCountry: 'Land:', allCountries: 'Alle landen', viewAllCountries: 'Alles bekijken', filterByPurpose: 'Doel:' },
    HallOfFame: { myRank: 'Mijn rang #{rank}' },
    Privacy: { pageTitle: 'Privacybeleid', backHome: 'Terug naar home', effectiveDate: 'Ingangsdatum: 1 maart 2026', intro: 'mytripfy ("wij" of "de Service") zet zich in voor de bescherming van uw persoonlijke gegevens.', s1Title: 'Verzamelde informatie', s2Title: 'Gebruik van informatie', s3Title: 'Delen van informatie', s4Title: 'Gegevensbewaring', s5Title: 'Uw rechten', s6Title: 'Cookies en lokale opslag', s7Title: 'Beveiliging', s8Title: 'Links van derden', contactTitle: 'Contact' }
  },
  sv: {
    HomeSection: { privacyPolicy: 'Integritetspolicy' },
    Companions: { filterByCountry: 'Land:', allCountries: 'Alla länder', viewAllCountries: 'Visa alla', filterByPurpose: 'Syfte:' },
    HallOfFame: { myRank: 'Min rang #{rank}' },
    Privacy: { pageTitle: 'Integritetspolicy', backHome: 'Tillbaka till startsidan', effectiveDate: 'Gäller från: 1 mars 2026', intro: 'mytripfy ("vi" eller "Tjänsten") är engagerade i att skydda din personliga information.', s1Title: 'Information vi samlar in', s2Title: 'Användning av information', s3Title: 'Delning av information', s4Title: 'Datalagring', s5Title: 'Dina rättigheter', s6Title: 'Cookies och lokal lagring', s7Title: 'Säkerhet', s8Title: 'Tredjepartslänkar', contactTitle: 'Kontakta oss' }
  },
  uk: {
    HomeSection: { privacyPolicy: 'Політика конфіденційності' },
    Companions: { filterByCountry: 'Країна:', allCountries: 'Усі країни', viewAllCountries: 'Показати всі', filterByPurpose: 'Мета:' },
    HallOfFame: { myRank: 'Мій ранг #{rank}' },
    Privacy: { pageTitle: 'Політика конфіденційності', backHome: 'На головну', effectiveDate: 'Дата набуття чинності: 1 березня 2026', intro: 'mytripfy ("ми" або "Сервіс") зобов\'язується захищати вашу особисту інформацію.', s1Title: 'Інформація, яку ми збираємо', s2Title: 'Використання інформації', s3Title: 'Обмін інформацією', s4Title: 'Зберігання даних', s5Title: 'Ваші права', s6Title: 'Файли cookie та локальне сховище', s7Title: 'Безпека', s8Title: 'Посилання третіх сторін', contactTitle: 'Зв\'яжіться з нами' }
  },
  it: {
    HomeSection: { privacyPolicy: 'Informativa sulla privacy' },
    Companions: { filterByCountry: 'Paese:', allCountries: 'Tutti i paesi', viewAllCountries: 'Vedi tutti', filterByPurpose: 'Scopo:' },
    HallOfFame: { myRank: 'Mio rango #{rank}' },
    Privacy: { pageTitle: 'Informativa sulla privacy', backHome: 'Torna alla home', effectiveDate: 'Data di entrata in vigore: 1 marzo 2026', intro: 'mytripfy ("noi" o "il Servizio") si impegna a proteggere le tue informazioni personali.', s1Title: 'Informazioni raccolte', s2Title: 'Utilizzo delle informazioni', s3Title: 'Condivisione delle informazioni', s4Title: 'Conservazione dei dati', s5Title: 'I tuoi diritti', s6Title: 'Cookie e archiviazione locale', s7Title: 'Sicurezza', s8Title: 'Link di terze parti', contactTitle: 'Contattaci' }
  },
  pt: {
    HomeSection: { privacyPolicy: 'Política de Privacidade' },
    Companions: { filterByCountry: 'País:', allCountries: 'Todos os países', viewAllCountries: 'Ver todos', filterByPurpose: 'Finalidade:' },
    HallOfFame: { myRank: 'Meu rank #{rank}' },
    Privacy: { pageTitle: 'Política de Privacidade', backHome: 'Voltar ao início', effectiveDate: 'Data de vigência: 1 de março de 2026', intro: 'mytripfy ("nós" ou "o Serviço") está comprometido em proteger suas informações pessoais.', s1Title: 'Informações que coletamos', s2Title: 'Uso das informações', s3Title: 'Compartilhamento de informações', s4Title: 'Retenção de dados', s5Title: 'Seus direitos', s6Title: 'Cookies e armazenamento local', s7Title: 'Segurança', s8Title: 'Links de terceiros', contactTitle: 'Entre em contato' }
  },
  'pt-BR': {
    HomeSection: { privacyPolicy: 'Política de Privacidade' },
    Companions: { filterByCountry: 'País:', allCountries: 'Todos os países', viewAllCountries: 'Ver todos', filterByPurpose: 'Finalidade:' },
    HallOfFame: { myRank: 'Meu rank #{rank}' },
    Privacy: { pageTitle: 'Política de Privacidade', backHome: 'Voltar ao início', effectiveDate: 'Data de vigência: 1 de março de 2026', intro: 'mytripfy ("nós" ou "o Serviço") está comprometido em proteger suas informações pessoais.', s1Title: 'Informações que coletamos', s2Title: 'Uso das informações', s3Title: 'Compartilhamento de informações', s4Title: 'Retenção de dados', s5Title: 'Seus direitos', s6Title: 'Cookies e armazenamento local', s7Title: 'Segurança', s8Title: 'Links de terceiros', contactTitle: 'Entre em contato' }
  }
};

let count = 0;
for (const [lang, nss] of Object.entries(translations)) {
  if (Object.keys(nss).length === 0) continue;
  const filePath = path.join(dir, lang + '.json');
  if (!fs.existsSync(filePath)) continue;
  const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const [ns, keys] of Object.entries(nss)) {
    if (!locale[ns]) locale[ns] = {};
    for (const [k, v] of Object.entries(keys)) {
      locale[ns][k] = v;
      count++;
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(locale, null, 2) + '\n', 'utf8');
  console.log(lang + ': updated');
}
console.log('Total updates: ' + count);
