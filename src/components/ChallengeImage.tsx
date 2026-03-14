'use client'

import { useState, useEffect, useRef } from 'react'
import {
  getCategoryImageConfig,
  CACHE_VERSION,
  getPersistentCacheKeys,
  getCategoryCacheKey,
  getPerItemCacheKey,
} from '@/lib/challenge-image/config'

/** 이미지 src. Wikimedia는 프록시 경유. foods는 Picsum 등 외부 URL만 사용 → 그대로 반환 */
function imageSrc(url: string, _useDirect: boolean, category: string): string {
  if (url.startsWith('/')) return url
  const isWiki = url.startsWith('https://upload.wikimedia.org/') || url.startsWith('https://commons.wikimedia.org/')
  if (isWiki) {
    const conf = getCategoryImageConfig(category)
    const proxyUrl =
      category === 'countries' ? url : (conf.useCanonicalProxy ? wikimediaThumbToCanonical(url) : url)
    return `/api/image-proxy?url=${encodeURIComponent(proxyUrl)}`
  }
  return url
}

function isWikimediaUrl(url: string): boolean {
  return url.startsWith('https://upload.wikimedia.org/') || url.startsWith('https://commons.wikimedia.org/')
}

/** Wikimedia 썸네일 URL을 원본(캐노니컬) URL로 변환. thumb 경로 404/변경 시 프록시 안정화 */
function wikimediaThumbToCanonical(url: string): string {
  try {
    const u = new URL(url)
    if (!u.pathname.includes('/thumb/')) return url
    const newPath = u.pathname.replace(/\/thumb\/(.+)\/\d+px-[^/]+$/, '/$1')
    if (newPath === u.pathname) return url
    return u.origin + newPath
  } catch {
    return url
  }
}

const CATEGORY_GRADIENTS: Record<string, { from: string; to: string; emoji: string }> = {
  attractions:  { from: '#f59e0b', to: '#d97706', emoji: '🏛️' },
  foods:        { from: '#ef4444', to: '#dc2626', emoji: '🍜' },
  restaurants:  { from: '#8b5cf6', to: '#7c3aed', emoji: '🍽️' },
  golf:         { from: '#10b981', to: '#059669', emoji: '⛳' },
  countries:    { from: '#3b82f6', to: '#2563eb', emoji: '🌍' },
  nature:       { from: '#14b8a6', to: '#0d9488', emoji: '🏔️' },
  animals:      { from: '#f97316', to: '#ea580c', emoji: '🦁' },
  festivals:    { from: '#ec4899', to: '#db2777', emoji: '🎭' },
  museums:      { from: '#6366f1', to: '#4f46e5', emoji: '🏺' },
  art_galleries:{ from: '#a855f7', to: '#9333ea', emoji: '🖼️' },
  drinks:       { from: '#f59e0b', to: '#b45309', emoji: '🍶' },
  islands:      { from: '#0ea5e9', to: '#0284c7', emoji: '🏝️' },
  fishing:      { from: '#06b6d4', to: '#0891b2', emoji: '🎣' },
  surfing:      { from: '#3b82f6', to: '#4f46e5', emoji: '🏄' },
  skiing:       { from: '#94a3b8', to: '#64748b', emoji: '⛷️' },
  scuba:        { from: '#1d4ed8', to: '#0f766e', emoji: '🤿' },
}

// Category-specific search hints for Wikipedia
const CATEGORY_HINTS: Record<string, string> = {
  // restaurants: 대표 음식·내부·전경 우선 (건물 외관·국기 회피)
  restaurants:  'restaurant dish food interior dining',
  golf:         'golf course',
  surfing:      'surfing wave',
  skiing:       'ski resort',
  scuba:        'scuba diving',
  fishing:      'fishing',
  animals:      'animal species',
  festivals:    'festival',
  museums:      'museum',
  art_galleries:'art gallery',
  islands:      'island',
  drinks:       'bottle label product drink beverage alcohol wine spirit whisky champagne beer',
  nature:       'nature',
  attractions:  'landmark',
  countries:    '',
  foods:        'food dish plate cuisine',
}

// ═══════════════════════════════════════════════════════════════════════════════
// 직접 이미지: 카테고리별 *_DIRECT_IMAGES 맵만 수정. 로딩 전략/캐시는 @/lib/challenge-image/config.ts
// ═══════════════════════════════════════════════════════════════════════════════

/** 100 Drinks 전용 직접 이미지. 키 = title_en(영문 제목), 값 = 이미지 URL 또는 로컬 경로(예: /drinks/파일명.jpg) */
const DRINKS_DIRECT_IMAGES: Record<string, string> = {
  'Absolut Elyx Single Estate Vodka': 'https://www.absolut.com/cdn-cgi/image/fit=cover,format=auto,height=414,quality=55,width=414/wp-content/uploads/product-in-situ_absolut-elyx_1000ml_1x1_.jpg',
  'Achaval-Ferrer Malbec Quimera': 'https://lacastellana.com/cdn/shop/products/Archivalferrerstock-03_1200x1200.jpg?v=1743118767',
  'Alois Kracher TBA Collection': 'https://www.jahrhundertweine.de/media/8d/d6/66/1743437668/20220628_110317.jpg?ts=1743601379',
  'Alvear Pedro Ximenez 1927 Solera': 'https://www.raincitywines.com/cdn/shop/products/IMG_1753_grande.JPG?v=1519945397',
  'Amarone della Valpolicella Classico': 'https://wineparadise.com.hk/wp-content/uploads/2024/12/Amarone-della-Valpolicella-Classico-2015.png',
  'Amarula Cream Liqueur': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThJdryPSQdxYJYyljAhLgyYVMnoFly7aeMgQ&s',
  'Amrut Fusion Single Malt': 'https://www.whiskymarketplace.hk/workspace/images/shops/www.thewhiskyexchange.com/india_amr9.jpg',
  'Andong Soju (Distilled Traditional)': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/%EC%95%88%EB%8F%99%EC%86%8C%EC%A3%BC_%EC%A0%84%EC%A0%9C%ED%92%88%28andongsoju_all_product%29.jpg',
  'Appleton Estate 50 Year Jamaica Rum': 'https://therumhowlerblog.com/wp-content/uploads/2012/06/appleton-estate-50.jpg?w=584',
  'Arak Chateau Ksara': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq5RE6dhEqJnOIieplkTyRugopqxH579rjLw&s',
  'Arak Sefid': 'https://media.cnn.com/api/v1/images/stellar/prod/230627082427-03-world-arak-day-muaddi.jpg',
  'Ararat 50 Year Nairi Brandy': 'https://royalbatch.com/upload/products/1/ararat-erebuni-50-years-old-armenian-brandy_RoyalBatch_dN7Nr5hxLgBt.jpg',
  'Avua Amburana Cachaca': 'https://happy-drinks.de/cdn/shop/files/Avua-Amburana_Cachaca_Cocktail.jpg?v=1718963352&width=1214',
  'Balvenie DoubleWood 17 Year': 'https://alcoholpleasehk.com/cdn/shop/files/balvenie-17-17yo-43percent-scotch-whisky-30344.jpg?v=1765400718&width=416',
  'Barbancourt 15 Year Reserve Speciale': 'https://bottleofitaly.com/cdn/shop/files/Barbancourt-Reserve-du-Domain-15-anni-70cl-Astucciato-Bottle-of-Italy.jpg?v=1706178780',
  'Barolo Monfortino Giacomo Conterno': 'https://winepassions-shop.com/cdn/shop/products/X6-GC2_07_compressed.jpg?v=1656062157',
  'Batavia Arrack van Oosten': 'https://www.blackwellswines.com/cdn/shop/products/Batavia-Arrack_Van_Oosten_Indonesian_Rum_1200x.jpg?v=1745280596',
  'Belvedere Vodka': 'https://www.belvederevodka.com/static/d5aeee159f163bcb4fc5be3b8ec6850d/1ac9c/home-push-duo-iconic.jpg',
  'Blandy 1920 Malmsey Madeira': 'https://nyc.flatiron-wines.com/cdn/shop/files/Blandys-Bual-1920-Madeira-1920-Fortified-Wine-Flatiron-Wines-Spirits-New-York-2_7d9e2a2c.jpg?v=1769540899',
  'Bols Genever 1820 Barrel-Aged': 'https://alchemy-asia.com/th/wp-content/uploads/sites/4/2017/10/Genever_2.png',
  'Bowmore 25 Year Old': 'https://secretbottleshop.co.uk/cdn/shop/files/308dab4b-39d5-4db3-ab2a-76c4a97ebd7a_700x700.jpg?v=1742294281',
  'Brennivin Black Death Schnapps': 'https://yourfriendinreykjavik.com/wp-content/uploads/2022/03/brennivin-mosi-1024x576.jpg',
  'Carmenere, Concha y Toro Don Melchor': 'https://cav.cl/storage/sku_images/31529.jpg',
  'Casamigos Reposado Tequila': 'https://d12mme3izkh884.cloudfront.net/product-media/3H0/511/768/Casamigos-Reposado-Tequila.jpg',
  'Chateau Margaux': 'https://static.millesima.com/s3/attachements/h1000px/1001_2016NM_c.png',
  'Clase Azul Reposado Tequila': 'https://winedeals.wineworld.com.hk/cdn/shop/files/ClaseAzulTequilaBrand_330e6561-26e1-4d61-bebb-dc1c6c7e2fa6.webp?v=1734367982',
  'Clase Azul Ultra Mezcal': 'https://vinesandterroirs.com/cdn/shop/files/Clase-Azul-Ultra-Extra-Anejo_jpg.webp?v=1710785202&width=1920',
  'Darroze Armagnac 40 Year': 'https://media.nicks.com.au/products/244eaaa6/45542012_1.jpg',
  'Dassai 23 Junmai Daiginjo': 'https://cove27.co.nz/cdn/shop/files/Dassai-23-Junmai-Daiginjo-Sake-720ml-nip.webp?v=1732241256',
  'Diplomático Reserva Exclusiva': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj2Ym_tS7XwW4Rk_x9p9e9w9J_z8z8z8z8z8&s',
  'Dom Perignon Champagne': 'https://upload.wikimedia.org/wikipedia/commons/7/76/Dom_Perignon_1999.jpg',
  'Domaine du Castel Grand Vin': 'https://kosherwinedirect.com/cdn/shop/products/DomaineDuCastelGrandVin2017_750ml_1000x.png?v=1592266322',
  'Dominio de Pingus, Ribera del Duero': 'https://solowine.es/wp-content/uploads/2025/01/23012025164744.PINGUS_2021_1_web-thumbnail-2000x2000-80-300x300.jpg',
  'Don Julio 1942': 'https://hkliquorstore.com/web/image/product.template/80983/image_1024?unique=5449b2b',
  'Egon Muller Scharzhofberger TBA': 'https://www.moselfinewines.com/2015-egon-muller-scharzhofberger-kabinett.jpg',
  'Elijah Craig Barrel Proof': 'https://elijahcraig.com/images/EC-barrel-proof.jpg',
  'Espiritu del Ecuador Cana': 'https://www.wine-searcher.com/images/labels/78/53/espiritu-del-ecuador-liqueur-ecuador-10437853.jpg',
  'Glenfiddich 21 Year Gran Reserva': 'https://img.shoplineapp.com/media/image_clips/67bd71cfe9b03c000c7e5ea0/original.jpeg?1740468687',
  'Graham 1963 Vintage Port': 'https://www.vintagewineandport.co.uk/images/products/large_Product_17500-1963-Grahams-Vintage-Port.jpg.0.jpg',
  'Grey Goose Vodka': 'https://www.craftginclub.co.uk/_next/image?url=https%3A%2F%2Fimages.prismic.io%2Fcgc-web%2FOTc0MDZmYTQtZmJmMC00ZmY5LWE4NWQtMDM0NjM0MTg4Nzdj_greygoosevodka.jpg%3Fauto%3Dcompress%2Cformat%26rect%3D0%2C0%2C640%2C400%26w%3D640%26h%3D400&w=2058&q=75',
  'Guinness Stout (at source)': 'https://www.a2zdrinks.com/pub/media/catalog/product/cache/9838dd690d7e56a9b6c5bd49a456e5a6/g/u/guiness_orginal.jpg',
  'Hakushu 18 Year Single Malt': 'https://secretbottleshop.co.uk/cdn/shop/files/1260c04a-b029-470a-85ee-0ee3f1253006_700x700.jpg?v=1753363744',
  'Hennessy XO Cognac': 'https://shoplineimg.com/5fdadd883dfe0c00189230da/66ce955a0ea9000016fe24a3/800x.png?',
  'Hibiki 21 Year Blended': 'https://hkliquorstore.com/web/image/product.template/81857/image_1024?unique=c68342d',
  'Inniskillin Vidal Icewine': 'https://88bamboo.co/cdn/shop/articles/photo_2025-09-06_05.37.50_0a38faad-9ad2-4078-80ae-e38fbd064ab1_1200x1200.jpg?v=1757630008',
  'Johnnie Walker Blue Label': 'https://www.watsonswine.com/medias/sys_master/front/prd/9023911755806.png',
  'Kanonkop Estate Pinotage': 'https://winenthingshk.com/wp-content/uploads/2021/02/KK-PT-18-BLAC-600-box.jpg',
  'Khokana Aila': 'https://www.bhaktapur.com/wp-content/uploads/2022/07/bimal-kusi-768x1024.jpg',
  'Koskenkorva Viina': 'https://images.alko.fi/images/cs_srgb,f_auto,t_medium/cdn/000132/koskenkorva-viina.jpg',
  'Krug Grande Cuvee Champagne': 'https://www.watsonswine.com/medias/sys_master/front/prd/9330388041758.png',
  'Lambanog Coconut Spirit': 'https://i0.wp.com/prohibitionuniversity.com/wp-content/uploads/2019/07/Lambanog.jpg?resize=584%2C328',
  'Lysholm Linie Aquavit 2 Year': 'https://www.raschvin.com/wp-content/uploads/2022/05/rSL000236-2.jpg',
  'Malawi Gin (Ndola)': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFsoaQNQo0c6azO0SoKRib8OoWaIr8Xrn2OQ&s',
  'Mekhong Original': 'https://i0.wp.com/mythailand.blog/wp-content/uploads/2019/05/Mehkong-9a.jpg?resize=1500%2C1500&ssl=1',
  'Mount Gay 1703 Rum': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzhl6mIvmLM9__X7CBQp4b2VS1KlTCJosxhA&s',
  'Moutai (Kweichow Maotai)': 'https://www.blackwellswines.com/cdn/shop/products/fullsizeoutput_621c_1024x1024.jpeg?v=1571274580',
  'Nikka Yoichi Single Malt': 'https://spades.com.mt/cdn/shop/products/Nikka_Yoichi_Single_Malt_45_70cl_600x600_crop_center.png?v=1727190434',
  'Nonino Grappa Monovitigno': 'https://montecristomagazine.com/wp-content/uploads/2018/05/g.jpg',
  'Okolehao Hawaiian Spirit': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkvBMhJ-o5_QdVV90pB6CwE2S9KQrmQsVKYA&s',
  'Opus One, Napa Valley': 'https://www.thewinecellarinsider.com/wp-content/uploads/2011/03/Opus-wines.jpg',
  'Ouzo 12': 'https://www.ouzo12.com/wp-content/uploads/2023/06/Frame-2.png',
  'Papalometl Ancestral Mezcal': 'https://espiritumontaraz.com/wp-content/uploads/2024/10/Mezcal-Cocktail-made-with-Papalometl-Esperanza-Ancestral-Mezcal-Espiritu-Montaraz.jpg',
  'Pappy Van Winkle 23 Year': 'https://arthurcantina.com/cdn/shop/files/Pappy_Van_Winkle_23Yr_750mL_-_Arthur_Cantina_Wine_Liquor_-_-_tag1_-_tag2_-2697471.jpg?v=1724550137',
  'Patron Gran Platinum Tequila': 'https://www.patrontequila.com/binaries/content/gallery/patrontequila/products/gran-platinum/v3/story-asset-3.jpg',
  'Paul John Mithuna': 'https://www.pauljohnwhisky.com/assets/images/brands/zoom/mithuna-by-paul-john.jpg',
  'Paulaner Oktoberfest Marzen': 'https://oregonshoppyplace.com/wp-content/uploads/2017/09/The_Hoppy_Brewer_Oktoberfest-M%C3%A4rzen_Original-M%C3%BCnchner-M%C3%A4rzen.jpg',
  'Peruvian Pisco Sour (original)': 'https://timskitchen.com.hk/wp-content/uploads/2025/02/pisco-sour-recipe-1739180754.jpg',
  'Petrus Pomerol': 'https://finewineasia.com/cdn/shop/products/X3-PT1_Petrus_1024x1024.jpg?v=1589368111',
  'Pheasant Tears Rkatsiteli Qvevri': 'https://gnarlyvines.co.uk/cdn/shop/files/IMG_5764_960x1280.jpg?v=1758540323',
  'Pilsner Urquell Original': 'https://www.winedispensary.com/cdn/shop/files/Pilsner_Urquell_Beer_Czech_Republic.png?v=1769294639',
  'Premium Makgeolli (Korean Rice Wine)': 'https://sg.everydayonsales.com/wp-content/uploads/2024/11/Chingu-Dining-20-Off-Makgeolli-Promotion.jpg',
  'Raki Yeni Raki': 'https://images.ctfassets.net/1gnrqferjasf/66gz0hsn1tM73HYmlApHL6/061f8ca18abc4a89621f0ce0882ac458/yeni-raki.webp',
  'Redbreast 21 Year Single Pot Still': 'https://hkliquorstore.com/web/image/product.template/83695/image_1024?unique=2d74129',
  'Remy Martin Louis XIII': 'https://cdn11.bigcommerce.com/s-e6b77/images/stencil/1280x1280/products/35531/50760/remy-martin-louis-xiii-cognac__27625.1742143294.jpg',
  'Rhum Clement XO Martinique': 'https://www.laroutedesrhums.com/2064-large_default/clement-xo-cuvee-speciale-rhum-vintage-44-70cl.jpg',
  'Rochefort 10 Trappist': 'https://www.capsandtaps.co.uk/cdn/shop/files/Screenshot2024-02-23at16.53.43.png?v=1708707301&width=480',
  'Romanee-Conti Grand Cru': 'https://wainscottmain.com/cdn/shop/products/image_4a9f6ef6-ee24-4d8e-91c8-34ed95d81124.jpg?v=1654212929',
  'Ron Santiago de Cuba 50 Years': 'https://rhumcubain.com/cdn/shop/files/11-0124-00684_OT9_santiago_de_cuba_extra_anejo_siglo_y_12.png?v=1746746895',
  'Royal Stag Barrel Select': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRB6o3lRFxPbLXicRudyNvKC-ticr37HmDVNQ&s',
  'Rujero Gran Reserva Singani': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaLCo7IMI_JX0e3SZQMj4M6m3vc9BoffkqPQ&s',
  'Ruou Nep Cam (Sticky Rice Wine)': 'https://exotrails.com/wp-content/uploads/2025/05/ruou-nep-cam_1.jpeg',
  'Sassicaia DOC Bolgheri': 'https://www.viniditoscana.com/ProductsResources/14670/TENUTASANGUIDO121_0_pr.jpeg',
  'Screaming Eagle Cabernet': 'https://images.benchmarkwine.com/uploads/winery/large_image/1945/1945-screaming-eagle.jpg',
  'Tanqueray No. Ten Gin': 'https://d12mme3izkh884.cloudfront.net/product-media/3A6/511/768/Tanqueray-No-Ten-Gin.jpg',
  'Tej Ethiopian Honey Wine': 'https://aemeromedia.com/storage/2024/04/tej.jpg',
  'Templeton Rye Whiskey': 'https://www.liquor.com/thmb/aSD-qTVE4FsuVCAKGtyNtnQm1XU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__liquor__2014__09__12110006__templeton-rye-720x720-brand-page-4bb6abb7df7b4ce7bad63ff7dab19a96.jpg',
  'The Glenlivet 18 Year': 'https://ik.imagekit.io/cvygf2xse/theglenlivet/wp-content/uploads/2021/10/SETUP3_Serve_18YO_6x7.png?tr=q-80,w-900',
  'The Macallan 18 Year': 'https://brand-assets.edrington.com/transform/dde8619f-4e19-4f41-9e98-b5e55db3816b/MAC-2023-SignatureTaste-Sherry-Oak-18YO-HighRes-WEB-initial?quality=100&io=transform%3Afill%2Cwidth%3A575%2Cheight%3A551',
  'Three Horses Beer Madagascar': 'https://musicafricawakemedia.wordpress.com/wp-content/uploads/2016/12/thb_verrebottle.jpg?w=723',
  'Tokaji Aszu 6 Puttonyos': 'https://www.wine-searcher.com/images/labels/89/17/toth-janos-tokaji-aszu-6-puttonyos-tokaj-hegyalja-10778917.jpg',
  'Tusker Lager Kenya': 'https://www.365drinks.co.uk/cdn/shop/files/tusk_1024x1024.jpg?v=1741125473',
  'Vana Tallinn Liqueur': 'https://liviko.ee/static/Nimetu-1.jpg',
  'Vega Sicilia Unico': 'https://spanishwinelover.com/galeria/foto/297/297_0_VS_Unico_2006.jpg',
  'Veuve Clicquot Brut': 'https://static.millesima.com/s3/attachements/h1000px/3611_NM_cc.png',
  'Vinsanto, Santorini': 'https://grecianpurveyor.com/cdn/shop/files/16-Santorini-holiday-villa-rental-sea-view-STR1004_1400x.jpg?v=1723143258',
  'Weihenstephan Hefeweissbier': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDzfd6bTXWTtZ8S7iF5uvVDThhqyhjUs6Otg&s',
  'Westmalle Tripel Trappist': 'https://cdn.accentuate.io/4740075421759/1714710190488/westmalle.png?v=1714710190488',
  'Wuliangye Baijiu': 'https://baijiuamerica.com/wp-content/uploads/2015/01/Wu-Liang-Ye.png',
  'Yamazaki 12 Year Single Malt': 'https://cdn.shoplightspeed.com/shops/607989/files/54613533/800x1024x2/image.jpg',
  'Zubrowka Bison Grass Vodka': 'https://liquorshop.hk/wp-content/uploads/2021/09/Zubrowka-Vodka.jpg'
}

// 100 Restaurants: 이 호스트들은 핫링크 차단(403) → 직접 URL 건너뛰고 위키 폴백 사용
const RESTAURANT_BLOCKING_HOSTS = [
  'tripadvisor.com',
  'dynamic-media-cdn.tripadvisor.com',
  'wbpstars.com',
  'media-cdn.tripadvisor.com',
]

/** 100 Restaurants 전용 직접 이미지. 키 = title_en(영문 제목), 값 = 이미지 URL */
const RESTAURANTS_DIRECT_IMAGES: Record<string, string> = {
  '8½ Otto e Mezzo Bombana':                'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/34ebd90453c74e88ac9aba9849a47138.jpg',
  'A Casa do Porco':                        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB7-PsvUVuxqE4v6gU45_c5WRwumC3kHKLIQ&s',
  'Akelarre':                               'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPUONDJKW1Ew82gB1EyUSK9RMAED3pdMiABQ&s',
  'Alain Ducasse at The Dorchester':        'https://starwinelist.com/storage/images/venue/2248/980x541/kVqV4miuF6CtXs2yZLsHjKR9G1T6qEw5pCcToTmi.jpeg',
  'Alchemist':                              'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/8062b4976023429fa5c89f6d1270b705.jpeg',
  'Alinea':                                 'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/43e5efd9196243128004f5a2e4df0132.jpeg',
  'Amber':                                  'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/8c1c334608694a889d17b1a9071cfc12.jpeg?w=300&h=300&org_if_sml=1',
  'Anne-Sophie Pic':                        'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2019/09/18/84ff89ba3d9a49cb96bdfc300addcfd0_Chef+Anne-Sophie+Pic_Raffles+Hotel+Singapore_La+Dame+De+Pic.jpg',
  'Aqua':                                   'https://www.placesandnotes.com/wp-content/uploads/2016/11/aqua.jpg',
  'Arashiyama Kitcho':                      'https://res.klook.com/images/w_1200,h_630,c_fill,q_65/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/vvaldkxrnk1saylitfrc/Kyoto%20Kitcho%20Arashiyama%2C%20Michelin%20three%20starred%20Kaiseki.jpg',
  'Arpège':                                 'https://cdn2.tuoitre.vn/471584752817336320/2025/7/26/4gmlllte7fjx5jlemsrvhlkdja-1753502643199777334324.jpg',
  'Arzak':                                  'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/5a613d0540e04b92b65a8616383b08bd.jpeg?w=300&h=300&org_if_sml=1',
  'Asador Etxebarri':                       'https://www.theluxurytrends.com/wp-content/uploads/2026/01/The_Luxury_Trends_Asador_Etxebarri.png',
  'Atelier Crenn':                          'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/09e532fbed35401a86bebf10b01dcd13.jpeg',
  'Atomix':                                 'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2021/10/12/5821f5bac63d4b8687e9728c5cb35a8d_Hero_Cote_credit-Gary_He.jpg',
  'Azurmendi':                              'https://azurmendi.restaurant/wp-content/uploads/2017/09/Eneko-atxa-azurmendi.jpg',
  'Belcanto':                               'https://pleasethepalate-bucket1.s3.us-west-1.amazonaws.com/wp-content/uploads/2018/12/11044558/Belcanto-Jose-Avillez-Lisbon-1.jpg',
  'Boragó':                                 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTXc6ShOJUhe2Ibun_Tn5Upccz4ScAMUBZnQ&s',
  'Bord\'Eau':                              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4hc4eyOMZ-G2_2aN4adTk7srT_QCruY8RLw&s',
  'Central':                                'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2019/05/22/2663f25a1f944b53808cde026e6432bf_ICHU_New+Lunch+Menu.jpg',
  'Core by Clare Smyth':                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQM_ZWJFf-H7JRYWmT9-21MWYeCmEkeasiZ3w&s',
  'Dal Pescatore':                          'https://lettresdubrassus.blancpain.com/sites/default/files/styles/chapter_layout_1_desktop/public/2021-03/ldb_19_cap_5_pag_6.png?itok=sseIQELe',
  'De Librije':                             'https://www.elizabethonfood.com/files/Liesbeth%20Auerbach/image/librije2015/librije.jpg',
  'Den':                                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI9SVgRSb9bS1uIbGl6_qgRUmeVdxKcHNQqQ&s',
  'Disfrutar':                              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdCtiZntnYzEDbFHnu0DLPPZ0-iUWSmild5w&s',
  'DiverXO':                                'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/aded2f86c58f4be099ced7dd705ebb83.jpeg',
  'Don Julio':                              'https://buenosairesherald.com/wp-content/uploads/2023/08/imagen-de-nota-7.png',
  'El Celler de Can Roca':                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiaFdScM-nsm7Nj_sFsjY3URL1K1KG01bgFQ&s',
  'El Invernadero':                         'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWf_gfGxeoVvS2RRSijjG7ziRjJPbWunOzrg&s',
  'Elkano':                                 'https://reportergourmet.com/upload/news/7479/d_copertina-Elkano.jpg',
  'Eleven Madison Park':                    'https://www.hongkongmadame.com/en/photo/art/grande/36940954-32800050.jpg?v=1567397564',
  'Enoteca Pinchiorri':                     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeGZRwUk6LlZldpHMgWNmu2XMM81uvCPbYfA&s',
  'Epicure (Le Bristol)':                   'https://media.cntraveler.com/photos/5cdb3297f2177802c6279622/16:9/w_2560,c_limit/Epicure-Le-Bristol.jpg',
  'Florilège':                              'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2025/11/07/3aaa535de8ae4fa484c7e837571f190c_THE_UPPER_Hero_F.jpg',
  'Frantzén':                               'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3Q04YLUL1b3zp2yd_4ZhEo7wuyLjQFa4pkw&s',
  'Gaggan Anand':                           'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2018/11/19/003c8dd7efd443b19a7ced36beb67d1f_Garima-Arora-Jimmy-Ophorst-Suhring%2C---.jpg',
  'Geranium':                               'https://i0.wp.com/eatweekguide.com/wp-content/uploads/2021/11/eatweekguide-24.jpg?fit=1600%2C1067&ssl=1',
  'Guy Savoy':                              'https://www.thetimes.com/imageserver/image/%2Fmethode%2Ftimes%2Fprod%2Fweb%2Fbin%2Fe2099b6e-b777-11ed-a513-158bcb2665eb.jpg',
  'Hiša Franko':                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQh0Q2RB1_mg7QrkjAA-4bXgySGAQjnw4U9Kw&s',
  'Hof van Cleve':                          'https://i0.wp.com/www.foodandwinegazette.com/wp-content/uploads/2023/02/Screenshot-2023-02-27-at-19.57.09.png?fit=1494%2C782&ssl=1',
  'Hyotei':                                 'https://res.cloudinary.com/dbm1qiew0/image/upload/blog-images/2024/09/OGP.jpg',
  'Jaan by Kirk Westaway':                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnDkZiMUaYd7tK3lo08DI0j2gkYVJ4C2niIg&s',
  'Jordnær':                                'https://honestcooking.com/wp-content/uploads/2020/02/Jordn%C3%A6r_RAISFOTO_3056-635x424.jpg',
  'Kadeau Copenhagen':                      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoDsImop7Qu6sTrlc2Zy1ugia4WIbezSwliA&s',
  'Kichisen':                               'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtXlOMOA5jcEiG8TvBq6Qx-JhvxMo6SDHZ4Q&s',
  'Kikunoi Honten':                         'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/f3d92388967c4b80b0671f722eeff633.jpeg',
  'Kjolle':                                 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT869QixwWQaKG51oSx427sfMQKroy3Iz8lqQ&s',
  'L\'Atelier de Joël Robuchon Hong Kong':  'https://tinyurbankitchen.com/wp-content/uploads/2021/01/IMG_20201002_200045-640x480.jpg',
  'L\'Enclume':                             'https://i0.wp.com/luxlifelondon.com/wp-content/uploads/2022/08/lenclume-cartmel-lake-district-1-1.jpg?fit=1200%2C675&ssl=1',
  'La Bouitte':                             'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNAVRYPg0nvkrTqER40M_HCVRVLePDK5sreQ&s',
  'La Pergola':                             'https://media.timeout.com/images/105163191/image.jpg',
  'La Yeon':                                'https://www.luxurytravelmagazine.com/files/593/6/76586/The_Shilla_Seoul_La_Yeon_Team_bu.jpg',
  'Le Bernardin':                           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS59GgMtkHy3Bc-rUBVHQYXQgPRFvrFPxLKBg&s',
  'Le Calandre':                            'https://venetosecrets.com/wp-content/uploads/2024/03/DSCF6771.jpg',
  'Le Du':                                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsVVnCoIElQYuzq_YYqLPqgz3WC4PlRD_ZaQ&s',
  'Le Meurice':                             'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToa6kDkvlSZt7DTyEuDnspk-np7-Ajd7W2YQ&s',
  'Le Pré Catelan':                         'https://www.experiencesluxe.com/cdn-cgi/imagedelivery/kJlAAqUqnbueqjYHlmNNpA/experiencesluxe/resources/posts/article309/image/w=1200',
  'Lido 84':                                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuLpIJFX3hFnVF5WL5aISy5-e4s_ZCiY9cWw&s',
  'Lung King Heen':                         'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/12d25d508f00457fa5ab034084cafcc3.jpeg',
  'Maido':                                  'https://www.auriperu.com/wp-content/uploads/2025/01/michelin-restaurants-in-lima-maido-restaurant.webp',
  'Maison Troisgros':                       'https://images.squarespace-cdn.com/content/v1/5cf423ac7eb1290001ede256/1612480963700-BREMTLDGH1U2SFI0MW68/Le_Bois_Sans_Feuilles.png',
  'Martín Berasategui':                     'https://reportergourmet.com/upload/multimedia/martin-berasategui_2023-11-08_23-39-00.jpg',
  'Mingles':                                'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2025/02/26/8a2f6908e3544e7b9e937a144da8e5fc_MG_250225_0117.jpg',
  'Mirazur':                                'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/dc613787e52a463c8cebfdf37f1534fe.jpeg',
  'Mizai':                                  'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/b90865e72b474fb7a3f854a79b226f50.jpeg?width=1000',
  'Mosu Seoul':                             'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2022/04/07/71a66ad4e4fc47a09266933540b55b27_Mosu+Hong+Kong_Team_Mar2022+%282%29-min.jpg',
  'Mugaritz':                               'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTFNNyR3f_-ArF-pwyXsakX-HWvi9UrGEWGA&s',
  'Narisawa':                               'https://res.cloudinary.com/dwhtazpfq/image/upload/w9vahqx2hq160jp06s0lfpcwhz2t.jpeg',
  'Nihonryori RyuGin':                      'https://prod-rte-static.rakutentravelxchange.com/74028c1d-70f0-45a3-8f49-d055fd203b63.png',
  'Odette':                                 'https://media.timeout.com/images/106367000/750/422/image.jpg',
  'Ossiano':                                'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/2a797c2837484d3ea43be03679cf81b7.jpeg',
  'Osteria Francescana':                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcl8pU97_sJpwYcVC-lBRkkCmJpCekekOPlw&s',
  'Pavillon Ledoyen':                       'https://cdn.prod.website-files.com/66daade3585c0d5f40bc4f5c/66e9a081e8aa7c71902e3f50_pavyllon-join-team.webp',
  'Per Se':                                 'https://upload.wikimedia.org/wikipedia/commons/5/52/PerSe.jpg',
  'Piazza Duomo':                           'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/73774b474b1740fa97b3a349544b4598.jpeg',
  'Pierre Gagnaire':                        'https://magazine.bellesdemeures.com/sites/default/files/styles/480x/public/edito_migrate/article/image/pierre_gagnaire_0.jpg',
  'Pujol':                                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQuyMv3Z3-2-20txuj5q6ZjT8WwiGirO1VUg&s',
  'Quince':                                 'https://static.prod.r53.tablethotels.com/media/ecs/global/michelin-articles/QuinceRedo/Quince-1.jpg',
  'Quintessence':                           'https://d267qvt8mf7rfa.cloudfront.net/restaurant/67/mainImage.jpg',
  'Quintonil':                              'https://foodpolice.mx/cdn/shop/articles/Quintonil_exterior.jpg?v=1750802236&width=1100',
  'Quique Dacosta':                         'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdLnFRqBOl6fbaL3YfQ2Z-7OJg1YApQcbqCw&s',
  'Reale':                                  'https://axwwgrkdco.cloudimg.io/v7/__gmpics__/ee3f0e06c518438391b2db01915d9de1',
  'Régis et Jacques Marcon':                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBjtesEo6l1y3MkJV3KTrmL3i0J-l9AlP-6w&s',
  'Restaurant de l\'Hôtel de Ville':        'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/daffe9d7f4d84f8e9e9364967e05860d.jpeg',
  'Restaurant Gordon Ramsay':               'https://www.caesars.com/content/empire/en/meetings/press/celebrated-multi-michelin-star-chef-gordon-ramsay-opens-his-firs/_jcr_content/root/image_261204372.img.jpg/1715963951552.jpg',
  'Saito':                                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkoFSDhuO_TG2qYVh9p5o4J1CN0BG7HvXTuQ&s',
  'Septime':                                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeMuPEJHSbg8AjnNANR_znc3tNEpdr1uSR8A&s',
  'SingleThread':                           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZJSJtOLSduaSZwQK6L9ckicSpJ_1DwJPb7w&s',
  'Sorn':                                   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCWV5e4SNamRMwUu9ThNet4bMj_qPkP8eHeg&s',
  'Steirereck':                             'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2025/01/15/9d3870d955764753bff10abed4598bed_Illustration_Image_Steirereck_Wien_kl.jpg',
  'Sukiyabashi Jiro Honten':                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFuGoF43lk_AWKA8-xFxN20Im-icgRrLg_1g&s',
  'Sushi Yoshitake':                        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScRZ1YlxDVI6m2JiGId47MbsXZX92h3Lrfig&s',
  'Table by Bruno Verjus':                  'https://b70f084e29f3f8faffb0-389fffc5b90936635d166a32fdb11b6a.ssl.cf3.rackcdn.com/andy-hayler-table-bruno-verjus-kitchen-w709-h532.jpg',
  'The Fat Duck':                           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTJfUfN-FkKZp3CVXv_6OkdmW2-ycFrQZN7g&s',
  'The French Laundry':                     'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2018/06/11/c44af8cd28c444b4a29510581908539d_TFL_TK_Kitchen_Pass_PhotoCreditMichaelGrimm_in_line.jpg',
  'The Inn at Little Washington':           'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2018/06/14/d16f07bbe7714d139306839550d04f54_inn_at_little_washington_credit_gordon_beall.jpg',
  'The Ledbury':                            'https://i.guim.co.uk/img/media/fcff4e2fa5a58b630dce808182c6b05fd3c347ea/40_453_3579_2148/master/3579.jpg?width=1200&quality=85&auto=format&fit=max&s=669dce07a82eed0015a45c2396b84032',
  'The Waterside Inn':                      'https://www.lavinton.com/wp-content/uploads/2015/07/waterside-inn.jpg',
  'Trèsind Studio':                         'https://img-cdn.publive.online/fit-in/1280x720/filters:format(webp)/elle-india/media/post_attachments/wp-content/uploads/2023/12/feature-2023-12-06T233210.260.jpg',
  'Vendôme':                                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAqQ3xPLheXvXk77BH9e00MaDXRTyCkNjtgw&s'
}

/** 100 Attractions 전용 직접 이미지. 키 = title_en, 값 = 이미지 URL (Wikipedia REST API로 검증된 Commons URL) - 100 Drinks처럼 완벽 매핑 */
const ATTRACTIONS_DIRECT_IMAGES: Record<string, string> = {
  'Angkor Wat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Buddhist_monks_in_front_of_the_Angkor_Wat.jpg/640px-Buddhist_monks_in_front_of_the_Angkor_Wat.jpg',
  'Bagan Temples': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bagan%2C_Burma.jpg/640px-Bagan%2C_Burma.jpg',
  'Great Wall of China': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/640px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg',
  'Machu Picchu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Machu_Picchu%2C_2023_%28012%29.jpg/640px-Machu_Picchu%2C_2023_%28012%29.jpg',
  'Petra': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Al_Deir_Petra.JPG/640px-Al_Deir_Petra.JPG',
  'Pyramids of Giza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Pyramids_of_the_Giza_Necropolis.jpg/640px-Pyramids_of_the_Giza_Necropolis.jpg',
  'Sistine Chapel & Vatican': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Sistina-interno.jpg/640px-Sistina-interno.jpg',
  'Zhangjiajie National Forest Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/1_tianzishan_wulingyuan_zhangjiajie_2012.jpg/640px-1_tianzishan_wulingyuan_zhangjiajie_2012.jpg',
  'Abu Simbel Temples': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Ramsis%2C_Aswan_Governorate%2C_Egypt_-_panoramio.jpg/640px-Ramsis%2C_Aswan_Governorate%2C_Egypt_-_panoramio.jpg',
  'Alhambra Palace': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg/640px-Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg',
  'Arashiyama Bamboo Grove': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Bamboo_Grove%2C_Arashiyama%2C_Kyoto%2C_Japan.jpg/640px-Bamboo_Grove%2C_Arashiyama%2C_Kyoto%2C_Japan.jpg',
  'Borobudur Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Pradaksina.jpg/640px-Pradaksina.jpg',
  'Cappadocia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Cappadocia_balloon_trip%2C_Ortahisar_Castle_%2811893715185%29.jpg/640px-Cappadocia_balloon_trip%2C_Ortahisar_Castle_%2811893715185%29.jpg',
  'Chichen Itza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza_3.jpg/640px-Chichen_Itza_3.jpg',
  'Great Barrier Reef': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg/640px-ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg',
  'Ha Long Bay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Ha_Long_Bay_in_2019.jpg/640px-Ha_Long_Bay_in_2019.jpg',
  'Hiroshima Peace Memorial (Genbaku Dome)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Genbaku_Dome04-r.JPG/640px-Genbaku_Dome04-r.JPG',
  'Jungfraujoch Top of Europe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Sphinx_et_Jungfrau_-_img_06980.jpg/640px-Sphinx_et_Jungfrau_-_img_06980.jpg',
  'Komodo National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Komodo_dragon_at_Komodo_National_Park.jpg/640px-Komodo_dragon_at_Komodo_National_Park.jpg',
  'Maasai Mara National Reserve': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Masai_Mara_at_Sunset.jpg/640px-Masai_Mara_at_Sunset.jpg',
  'Matterhorn': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Matterhorn_from_Domh%C3%BCtte_-_2.jpg/640px-Matterhorn_from_Domh%C3%BCtte_-_2.jpg',
  'Meteora Monasteries': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Meteora%27s_monastery_2.jpg/640px-Meteora%27s_monastery_2.jpg',
  'Sossusvlei & Namib Desert': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Sossusvlei.jpg/640px-Sossusvlei.jpg',
  'Torres del Paine Patagonia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Torres_del_Paine%2C_Chile_by_Karen_Chan_16.jpg/640px-Torres_del_Paine%2C_Chile_by_Karen_Chan_16.jpg',
  'Serengeti National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Serengeti-Landscape-2012.JPG/640px-Serengeti-Landscape-2012.JPG',
  'Sigiriya Rock Fortress': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Sigiriya_%28141688197%29.jpeg/640px-Sigiriya_%28141688197%29.jpeg',
  'Stone Forest Shilin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/%E7%9F%B3%E6%9E%97%E5%8E%BF%E5%9F%8E%E5%A4%A9%E9%99%85%E7%BA%BF05.jpg/640px-%E7%9F%B3%E6%9E%97%E5%8E%BF%E5%9F%8E%E5%A4%A9%E9%99%85%E7%BA%BF05.jpg',
  'Tanah Lot Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/TanahLot_2014.JPG/640px-TanahLot_2014.JPG',
  'Terracotta Army': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/51714-Terracota-Army.jpg/640px-51714-Terracota-Army.jpg',
  'Uluru (Ayers Rock)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/ULURU.jpg/640px-ULURU.jpg',
  'Victoria Falls': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg/640px-Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg',
  'Amalfi Coast': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Amalfi_Coast_%28Italy%2C_October_2020%29_-_75_%2850558355441%29.jpg/640px-Amalfi_Coast_%28Italy%2C_October_2020%29_-_75_%2850558355441%29.jpg',
  'Anne Frank House': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Amsterdam_%28NL%29%2C_Anne-Frank-Huis_--_2015_--_7185.jpg/640px-Amsterdam_%28NL%29%2C_Anne-Frank-Huis_--_2015_--_7185.jpg',
  'Jatiluwih Rice Terraces Bali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Batukaru1.JPG/640px-Batukaru1.JPG',
  'Sultan Ahmed Mosque (Blue Mosque)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Istanbul_%2834223582516%29_%28cropped%29.jpg/640px-Istanbul_%2834223582516%29_%28cropped%29.jpg',
  'Brandenburg Gate': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/640px-Brandenburger_Tor_abends.jpg',
  'Burj Khalifa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg/640px-Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg',
  'Chateau de Chambord': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Aerial_image_of_Ch%C3%A2teau_de_Chambord_%28view_from_the_southeast%29.jpg/640px-Aerial_image_of_Ch%C3%A2teau_de_Chambord_%28view_from_the_southeast%29.jpg',
  'Christ the Redeemer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christ_the_Redeemer_-_Cristo_Redentor.jpg/640px-Christ_the_Redeemer_-_Cristo_Redentor.jpg',
  'Colosseum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg',
  'Edinburgh Castle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Edinburgh_Castle_-_aerial_-_2025-04-19_03.jpg/640px-Edinburgh_Castle_-_aerial_-_2025-04-19_03.jpg',
  'Eiffel Tower': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/640px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
  'Ephesus Ancient City': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Ephesus_Celsus_Library_Fa%C3%A7ade.jpg/640px-Ephesus_Celsus_Library_Fa%C3%A7ade.jpg',
  'Forbidden City': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/The_Forbidden_City_-_View_from_Coal_Hill.jpg/640px-The_Forbidden_City_-_View_from_Coal_Hill.jpg',
  'Fushimi Inari Taisha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Torii_path_with_lantern_at_Fushimi_Inari_Taisha_Shrine%2C_Kyoto%2C_Japan.jpg/640px-Torii_path_with_lantern_at_Fushimi_Inari_Taisha_Shrine%2C_Kyoto%2C_Japan.jpg',
  'Golden Gate Bridge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Golden_Gate_Bridge_as_seen_from_Battery_East.jpg/640px-Golden_Gate_Bridge_as_seen_from_Battery_East.jpg',
  'Grand Canyon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Canyon_River_Tree_%28165872763%29.jpeg/640px-Canyon_River_Tree_%28165872763%29.jpeg',
  'Grand Palace Bangkok': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/0005574_-_Wat_Phra_Kaew_006.jpg/640px-0005574_-_Wat_Phra_Kaew_006.jpg',
  'Hagia Sophia': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=640&q=80',
  'Hoi An Ancient Town': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=640&q=80',
  'Kinkaku-ji Golden Pavilion': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=640&q=80',
  'Li River & Guilin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/87318-Li-River.jpg/640px-87318-Li-River.jpg',
  'Louvre Museum': 'https://images.unsplash.com/photo-1486247496048-cc4ed929f7cc?w=640&q=80',
  'Masada Fortress': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=640&q=80',
  'Moai Statues Easter Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/AhuTongariki.JPG/640px-AhuTongariki.JPG',
  'Mont Saint-Michel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mont-Saint-Michel_vu_du_ciel.jpg/640px-Mont-Saint-Michel_vu_du_ciel.jpg',
  'Mount Fuji': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg/640px-View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg',
  'Neuschwanstein Castle': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=640&q=80',
  'Niagara Falls': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/3Falls_Niagara.jpg/640px-3Falls_Niagara.jpg',
  'Notre Dame Cathedral': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=640&q=80',
  'Pamukkale Cotton Castle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Pamukkale_30.jpg/640px-Pamukkale_30.jpg',
  'Park Guell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Parc_guell_-_panoramio.jpg/640px-Parc_guell_-_panoramio.jpg',
  'Parthenon & Acropolis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/1029_Acropolis_of_Athens_in_Greece_at_night_Photo_by_Giles_Laurent.jpg/640px-1029_Acropolis_of_Athens_in_Greece_at_night_Photo_by_Giles_Laurent.jpg',
  'Piazza San Marco': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Piazza_San_Marco_%28Venice%29_at_night-msu-2021-6449-.jpg/640px-Piazza_San_Marco_%28Venice%29_at_night-msu-2021-6449-.jpg',
  'Pompeii': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Theathres_of_Pompeii.jpg/640px-Theathres_of_Pompeii.jpg',
  'Prague Old Town Square': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg/640px-Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg',
  'Sagrada Familia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/%CE%A3%CE%B1%CE%B3%CF%81%CE%AC%CE%B4%CE%B1_%CE%A6%CE%B1%CE%BC%CE%AF%CE%BB%CE%B9%CE%B1_2941.jpg/640px-%CE%A3%CE%B1%CE%B3%CF%81%CE%AC%CE%B4%CE%B1_%CE%A6%CE%B1%CE%BC%CE%AF%CE%BB%CE%B9%CE%B1_2941.jpg',
  'Santorini Caldera': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/2011_Dimos_Thiras.png/640px-2011_Dimos_Thiras.png',
  'Senso-ji Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sensoji_Temple_%28Asakusa%2C_Tokyo%2C_Japan%29_2023-07-02.jpg/640px-Sensoji_Temple_%28Asakusa%2C_Tokyo%2C_Japan%29_2023-07-02.jpg',
  'Sheikh Zayed Grand Mosque': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Sheikh_Zayed_Mosque_view.jpg/640px-Sheikh_Zayed_Mosque_view.jpg',
  'Shwedagon Pagoda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Shwedagon_Pagoda_2017.jpg/640px-Shwedagon_Pagoda_2017.jpg',
  'Great Sphinx of Giza': 'https://images.unsplash.com/photo-1547102629-04734a2499ac?w=640&q=80',
  'St Basil\'s Cathedral': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Saint_Basil%27s_Cathedral_in_Moscow.jpg/640px-Saint_Basil%27s_Cathedral_in_Moscow.jpg',
  'St Peter\'s Basilica': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg/640px-Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg',
  'Statue of Liberty': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Front_view_of_Statue_of_Liberty_%28cropped%29.jpg/640px-Front_view_of_Statue_of_Liberty_%28cropped%29.jpg',
  'Stonehenge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Stonehenge2007_07_30.jpg/640px-Stonehenge2007_07_30.jpg',
  'Sydney Opera House': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._%2821339175489%29.jpg/640px-Sydney_Australia._%2821339175489%29.jpg',
  'Taj Mahal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/640px-Taj_Mahal_%28Edited%29.jpeg',
  'Tanah Lot Sunset Tour': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/TanahLot_2014.JPG/640px-TanahLot_2014.JPG',
  'Temple of Heaven': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Temple_of_Heaven_20160323_01.jpg/640px-Temple_of_Heaven_20160323_01.jpg',
  'Tokyo Skytree': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Tokyo_Skytree%2C_view_from_Kuramae-bashi_bridge_on_Sumida-gawa_river._%2814555040147%29.jpg/640px-Tokyo_Skytree%2C_view_from_Kuramae-bashi_bridge_on_Sumida-gawa_river._%2814555040147%29.jpg',
  'Tower of London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Tower_of_London_from_the_Shard_%288515883950%29.jpg/640px-Tower_of_London_from_the_Shard_%288515883950%29.jpg',
  'Uffizi Gallery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Florence%2C_Italy_-_panoramio_%28125%29.jpg/640px-Florence%2C_Italy_-_panoramio_%28125%29.jpg',
  'Palace of Versailles': 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=640&q=80',
  'Victoria Peak Hong Kong': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/High_West_and_Victoria_Peak_from_Victoria_Gap_%28crop1%29.jpg/640px-High_West_and_Victoria_Peak_from_Victoria_Gap_%28crop1%29.jpg',
  'Western Wall Jerusalem': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Westernwall2.jpg/640px-Westernwall2.jpg',
  'Wat Pho Temple of Reclining Buddha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%9E%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B9%84%E0%B8%AA%E0%B8%A2%E0%B8%B2%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%8A%E0%B8%95%E0%B8%B8%E0%B8%9E%E0%B8%99.jpg/640px-%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%9E%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B9%84%E0%B8%AA%E0%B8%A2%E0%B8%B2%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%8A%E0%B8%95%E0%B8%B8%E0%B8%9E%E0%B8%99.jpg',
  'Yellowstone National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Grand_Canyon_of_yellowstone.jpg/640px-Grand_Canyon_of_yellowstone.jpg',
  'Iguazu Falls': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Iguazu_Cataratas2.jpg/640px-Iguazu_Cataratas2.jpg',
  'Angkor Thom Bayon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Angkor_Thom_%28II%29.jpg/640px-Angkor_Thom_%28II%29.jpg',
  'Batu Caves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Batu_Caves_stairs_2022-05.jpg/640px-Batu_Caves_stairs_2022-05.jpg',
  'Cat Ba Island Halong Bay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Cat_Ba_town.JPG/640px-Cat_Ba_town.JPG',
  'Jeju Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Jeju_Island.jpg/640px-Jeju_Island.jpg',
  'Khajuraho Temples': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/1_Khajuraho.jpg/640px-1_Khajuraho.jpg',
  'Mesa Verde National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Cliff_Palace-Colorado-Mesa_Verde_NP.jpg/640px-Cliff_Palace-Colorado-Mesa_Verde_NP.jpg',
  'Mont Blanc': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80',
  'Skellig Michael': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Skellig_Michael03%28js%29.jpg/640px-Skellig_Michael03%28js%29.jpg',
  'Salar de Uyuni': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Salar_Uyuni_au01.jpg/640px-Salar_Uyuni_au01.jpg',
  'Waitomo Glowworm Caves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Glowworm_Grotto%2C_Waitomo_Glowworm_Cave.jpg/640px-Glowworm_Grotto%2C_Waitomo_Glowworm_Cave.jpg',
  'Lascaux Cave Paintings': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Lascaux_painting.jpg/640px-Lascaux_painting.jpg',
}

/** 100 Museums 전용 직접 이미지. 키 = title_en, 값 = 이미지 URL.
 *  Wikimedia URL은 imageSrc()에서 프록시로 바뀌어 404/프록시 실패 시 깨질 수 있음.
 *  gstatic 등은 핫링크 차단으로 깨지므로, 가능한 한 Unsplash 등 직접 로드 가능 URL 사용. */
const MUSEUMS_DIRECT_IMAGES: Record<string, string> = {
  'Louvre Museum': 'https://images.unsplash.com/photo-1486247496048-cc4ed929f7cc?w=640&q=80',
  'British Museum': 'https://images.unsplash.com/photo-1545256483-1199c229af4f?w=640&q=80',
  'The Met (Metropolitan Museum of Art)': 'https://images.unsplash.com/photo-1759194772502-1e0d9b429c00?w=640&q=80',
  'Smithsonian National Museum of Natural History': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=640&q=80',
  'State Hermitage Museum': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
  'Vatican Museums': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=640&q=80',
  'National Palace Museum': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=640&q=80',
  'Egyptian Museum, Cairo': 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=640&q=80',
  'National Museum of India, New Delhi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/India_national_museum_01.jpg/640px-India_national_museum_01.jpg',
  'National Archaeological Museum Athens': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Arch%C3%A4ologisches_Nationalmuseum_Athen.jpg/640px-Arch%C3%A4ologisches_Nationalmuseum_Athen.jpg',
  'Pergamon Museum, Berlin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Pergamonmuseum_Front.jpg/640px-Pergamonmuseum_Front.jpg',
  'Prado Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Museo_del_Prado_2016_%2825185969599%29.jpg/640px-Museo_del_Prado_2016_%2825185969599%29.jpg',
  'Uffizi Gallery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Florence%2C_Italy_-_panoramio_%28125%29.jpg/640px-Florence%2C_Italy_-_panoramio_%28125%29.jpg',
  'Natural History Museum, London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Natural_History_Museum_London_logo_%28large%29.svg/640px-Natural_History_Museum_London_logo_%28large%29.svg.png',
  'Victoria and Albert Museum': 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/f9/27/b7/v-a-museum.jpg?w=900&h=500&s=1',
  'Tokyo National Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tokyo_National_Museum%2C_Honkan_2010.jpg/640px-Tokyo_National_Museum%2C_Honkan_2010.jpg',
  'National Museum of Korea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/National_Museum_of_Korea%2C_Seoul_%282%29_%2840236586235%29.jpg/640px-National_Museum_of_Korea%2C_Seoul_%282%29_%2840236586235%29.jpg',
  'National Museum of China': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/62684-Beijing-Tiananmen-Square_%2828609003992%29.jpg/640px-62684-Beijing-Tiananmen-Square_%2828609003992%29.jpg',
  'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Chhatrapati_Shivaji_Maharaj_Vastu_Sangrahalaya.jpg/640px-Chhatrapati_Shivaji_Maharaj_Vastu_Sangrahalaya.jpg',
  'Istanbul Archaeological Museums': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Istanbularcheology.jpg/640px-Istanbularcheology.jpg',
  'Grand Egyptian Museum (GEM)': 'https://images.unsplash.com/photo-1547102629-04734a2499ac?w=640&q=80',
  'Field Museum, Chicago': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Field_Museum_N.jpg/640px-Field_Museum_N.jpg',
  'American Museum of Natural History': 'https://now.fordham.edu/wp-content/uploads/2020/02/T-rex-group.jpg',
  'Smithsonian Air & Space Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Smithsonian_Air_and_Space_Museum.jpg/640px-Smithsonian_Air_and_Space_Museum.jpg',
  'Royal Ontario Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Royal_Ontario_Museum_in_Fall_2021.jpg/640px-Royal_Ontario_Museum_in_Fall_2021.jpg',
  'Australian Museum, Sydney': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&q=80',
  'de Young Museum, San Francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=640&q=80',
  'Rijksmuseum, Amsterdam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/South_facade_of_the_Rijksmuseum_Amsterdam_%28DSCF0528%29.jpg/640px-South_facade_of_the_Rijksmuseum_Amsterdam_%28DSCF0528%29.jpg',
  'Anne Frank House': 'https://media.tacdn.com/media/attractions-splice-spp-674x446/12/78/7f/18.jpg',
  'Auschwitz-Birkenau State Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Brama_Arbeit_Macht_frei.jpg/640px-Brama_Arbeit_Macht_frei.jpg',
  'Warsaw Rising Museum': 'https://photos.smugmug.com/Warsaw/Warsaw-POIs/i-2h6fCrk/0/afaf977f/L/warsaw-poi-warsaw-rising-exterior-L.jpg',
  'Reina Sofia Museum, Madrid': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=640&q=80',
  'Tate Modern, London': 'https://images.unsplash.com/photo-1560345839-efa7e20baa45?w=640&q=80',
  'Centre Pompidou, Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=640&q=80',
  'Oceanographic Museum of Monaco': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=640&q=80',
  'Natural History Museum Vienna': 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=640&q=80',
  'Gold Museum (Museo del Oro), Bogota': 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=640&q=80',
  'Larco Museum, Lima': 'https://images.unsplash.com/photo-1725222893823-65a752aa706d?w=640&q=80',
  'Acropolis Museum, Athens': 'https://images.unsplash.com/photo-1761334859733-b287539360dd?w=640&q=80',
  'Museo Nacional de Antropologia, Mexico City': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Musee_National_Anthropologie-Entree.jpg/640px-Musee_National_Anthropologie-Entree.jpg',
  'Palenque Archaeological Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Palenque_Collage.jpg/640px-Palenque_Collage.jpg',
  'MASP (Sao Paulo Museum of Art)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Novo_MASP.jpg/640px-Novo_MASP.jpg',
  'MALBA, Buenos Aires': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Buenos_Aires_-_Palermo_-_Malba.jpg/640px-Buenos_Aires_-_Palermo_-_Malba.jpg',
  'Sydney Jewish Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Sydney_Jewish_Museum_Darlinghurst_Road_-_Burton_Street_junction_view.jpg/640px-Sydney_Jewish_Museum_Darlinghurst_Road_-_Burton_Street_junction_view.jpg',
  'Picasso Museum, Barcelona': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Museu_Picasso_Barcelona.jpg/640px-Museu_Picasso_Barcelona.jpg',
  'Deutsches Museum, Munich': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Deutsches_Museum_Portrait_4.jpg/640px-Deutsches_Museum_Portrait_4.jpg',
  'Science Museum, London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Science_Museum%2C_Exhibition_Road_%28cropped%29.jpg/640px-Science_Museum%2C_Exhibition_Road_%28cropped%29.jpg',
  'Museum of Science and Industry, Chicago': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Museum_of_Science_and_Industry_%28Chicago%29.jpg/640px-Museum_of_Science_and_Industry_%28Chicago%29.jpg',
  'Getty Center, Los Angeles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Aerial_Getty_Museum.jpg/640px-Aerial_Getty_Museum.jpg',
  'Guggenheim Museum, New York': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Solomon_R._Guggenheim_Museum_%2848059131351%29.jpg/640px-Solomon_R._Guggenheim_Museum_%2848059131351%29.jpg',
  'Guggenheim Museum Bilbao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Museo_Guggenheim%2C_Bilbao_%2831273245344%29.jpg/640px-Museo_Guggenheim%2C_Bilbao_%2831273245344%29.jpg',
  'Vasa Museum, Stockholm': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Stockholm_Vasa_Museum_and_Nordic_Museum_09.jpg/640px-Stockholm_Vasa_Museum_and_Nordic_Museum_09.jpg',
  'Viking Ship Museum, Oslo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Mus%C3%A9e_des_navires_vikings_%28Oslo%29_%284874556533%29.jpg/640px-Mus%C3%A9e_des_navires_vikings_%28Oslo%29_%284874556533%29.jpg',
  'National Museum of Denmark': 'https://images.unsplash.com/photo-1743164574207-00476d35e046?w=640&q=80',
  'National Museum of Finland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Kansallismuseo_Helsinki.jpg/640px-Kansallismuseo_Helsinki.jpg',
  'Kunsthistorisches Museum Vienna': 'https://www.khm.at/fileadmin/_processed_/9/f/csm_Stiegenaufgang_Neu-ausschnitt_040ecae444.webp',
  'Dresden State Art Collections': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Residenzschloss_Dresden.jpg/640px-Residenzschloss_Dresden.jpg',
  'Bargello Museum, Florence': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Florence%2C_Bargello%2C_Sala_di_Donatello_%28detail%29.jpg/640px-Florence%2C_Bargello%2C_Sala_di_Donatello_%28detail%29.jpg',
  'Borghese Gallery, Rome': 'https://cdn-imgix.headout.com/media/images/b9c43eefc416fe8e126dcd553ff1ec64-_Borghese-Gallery-Front.jpg',
  'National Museum of Iran, Tehran': 'https://images.unsplash.com/photo-1753458610508-cc99aceeba3e?w=640&q=80',
  'Topkapi Palace Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Topkapi_Palace%2C_Istanbul_%2852115692887%29.jpg/640px-Topkapi_Palace%2C_Istanbul_%2852115692887%29.jpg',
  'Coptic Museum, Cairo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Kairo_-_Altkairo_05.jpg/640px-Kairo_-_Altkairo_05.jpg',
  'National Museum of Ghana': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Museum_Ground_floor_from_1st_floor.jpg/640px-Museum_Ground_floor_from_1st_floor.jpg',
  'Iziko South African Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Iziko_South_African_Museum.JPG/640px-Iziko_South_African_Museum.JPG',
  'National Museum of Kenya': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/The_National_Museums_of_Kenya_-_Nairobi_02.jpg/640px-The_National_Museums_of_Kenya_-_Nairobi_02.jpg',
  'National Museum of Tanzania': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/TZ_DarEsSalaam_National_museum.JPG/640px-TZ_DarEsSalaam_National_museum.JPG',
  'National Museum Bangkok': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Bangkok_National_Museum_-_Joy_of_Museums.jpg/640px-Bangkok_National_Museum_-_Joy_of_Museums.jpg',
  'Vietnam National Museum of History': 'https://images.unsplash.com/photo-1741317375127-1c2fab33bb78?w=640&q=80',
  'National Museum of Singapore': 'https://www.nhb.gov.sg/nationalmuseum/-/media/nms2024/about-us/our-building/national-museum-neo-palladian-building.jpg',
  'Islamic Arts Museum Malaysia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Islamic_Arts_Museum_Malaysia_Exterior_%28May_2022%29_-_img_02.jpg/640px-Islamic_Arts_Museum_Malaysia_Exterior_%28May_2022%29_-_img_02.jpg',
  'National Museum of Indonesia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Front_facade_-_National_Museum_Indonesia%2C_Jakarta_%282025%29_-_img_07.jpg/640px-Front_facade_-_National_Museum_Indonesia%2C_Jakarta_%282025%29_-_img_07.jpg',
  'National Museum of the Philippines': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/The_Philippine_National_Museum_%28of_Fine_Arts%29.jpg/640px-The_Philippine_National_Museum_%28of_Fine_Arts%29.jpg',
  'Palace Museum (Forbidden City)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/The_Forbidden_City_-_View_from_Coal_Hill.jpg/640px-The_Forbidden_City_-_View_from_Coal_Hill.jpg',
  'Shanghai Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Shanghai_Museum_exterior_1.jpg/640px-Shanghai_Museum_exterior_1.jpg',
  'Hong Kong Museum of History': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/HongKongMuseumOfHistory.png/640px-HongKongMuseumOfHistory.png',
  'National Taiwan Museum': 'https://file.moc.gov.tw/001/Upload/OldFiles/AdminUploads/Content/original/4f7a4d4b-4756-4173-9d36-13d58bd53615.jpg',
  'National Folk Museum of Korea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Main_entrance_of_the_National_Folk_Museum_of_Korea_in_April_2025.jpg/640px-Main_entrance_of_the_National_Folk_Museum_of_Korea_in_April_2025.jpg',
  'Jewish Museum Berlin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Jewish_Museum_Berlin_logo.svg/640px-Jewish_Museum_Berlin_logo.svg.png',
  'Powerhouse Museum, Sydney': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Powerhouse_Museum_Logo.jpeg/640px-Powerhouse_Museum_Logo.jpeg',
  'Te Papa Tongarewa, Wellington': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Te_Papa_%28National_Museum%29%2C_Wellington.jpg/640px-Te_Papa_%28National_Museum%29%2C_Wellington.jpg',
  'Museo Soumaya, Mexico City': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Museo_Soumaya%2C_Ciudad_de_M%C3%A9xico%2C_M%C3%A9xico%2C_2015-07-18%2C_DD_12.JPG/640px-Museo_Soumaya%2C_Ciudad_de_M%C3%A9xico%2C_M%C3%A9xico%2C_2015-07-18%2C_DD_12.JPG',
  'Botero Museum, Bogota': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Patio_Museo_Botero_Bogota.JPG/640px-Patio_Museo_Botero_Bogota.JPG',
  'Musee de la Civilisation, Quebec': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Musee_de_la_Civilisation.JPG/640px-Musee_de_la_Civilisation.JPG',
  'Canadian War Museum, Ottawa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/WarMuseum2022.jpg/640px-WarMuseum2022.jpg',
  'US Holocaust Memorial Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/U.S._Holocaust_Memorial_Museum.jpg/640px-U.S._Holocaust_Memorial_Museum.jpg',
  '9/11 Memorial & Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/9-11_Memorial_and_Museum_%2828815276064%29.jpg/640px-9-11_Memorial_and_Museum_%2828815276064%29.jpg',
  'Wien Museum, Vienna': 'https://www.wienmuseum.at/items/uploads/images/1750421487_Tjhmw9ImGVn.jpg',
  'Amsterdam Museum': 'https://www.dutchamsterdam.nl/i/aa/2022/04/Amsterdam-Museum.jpg',
  'Barcelona History Museum (MUHBA)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Casa_Padellas_20130905_11.JPG/640px-Casa_Padellas_20130905_11.JPG',
  'Nordic Museum, Stockholm': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/Nordiska_Museet_Logo.svg/640px-Nordiska_Museet_Logo.svg.png',
  'National Museum of Scotland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Museum_of_Scotland.jpg/640px-Museum_of_Scotland.jpg',
  'NGMA New Delhi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/National_Gallery_of_Modern_Art_logo_%282025%29.png/640px-National_Gallery_of_Modern_Art_logo_%282025%29.png',
  'Museum of Turkish and Islamic Arts': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Turkish_and_Islamic_Museum_1432_%28cropped%29.jpg/640px-Turkish_and_Islamic_Museum_1432_%28cropped%29.jpg',
  // 수동 추가 (Wikipedia API로 미발견)
  'Melbourne Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Melbourne_museum_exterior_panorama.jpg/640px-Melbourne_museum_exterior_panorama.jpg',
  'Leonardo da Vinci Museum of Science': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Galleria_Leonardo_da_Vinci_-_Museo_scienza_e_tecnologia_Milano.jpg/640px-Galleria_Leonardo_da_Vinci_-_Museo_scienza_e_tecnologia_Milano.jpg',
  'Thyssen-Bornemisza Museum, Madrid': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Fontana_Thyssen-Bornemisza_Museum.jpg/640px-Fontana_Thyssen-Bornemisza_Museum.jpg',
  'National Archaeological Museum Naples': 'https://images.ng.ondaplatform.com/article/1248/gallery/AdobeStock-83317463.jpeg/w632_h440_csmart_d1.6_u1674553312.jpeg',
  'Bardo National Museum, Tunis': 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=640&q=80',
  'Museum of Black Civilizations, Dakar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mus%C3%A9e_des_civilisations_noires_2022.jpg/640px-Mus%C3%A9e_des_civilisations_noires_2022.jpg',
  'Musee d Orsay, Paris': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Paris_Exterieur_du_Mus%C3%A9e_d%27Orsay_%281%29.jpg/640px-Paris_Exterieur_du_Mus%C3%A9e_d%27Orsay_%281%29.jpg',
}

/** 100 Art Galleries: 직접 URL. MUSEUMS에 이미 있는 건물은 여기 중복 정의하지 않음 — getDirectImageUrl에서 MUSEUMS 폴백. */
const ART_GALLERIES_DIRECT_IMAGES: Record<string, string> = {
  'Calouste Gulbenkian Museum, Lisbon': 'https://media.timeout.com/images/106255446/750/422/image.jpg',
  '21_21 Design Sight, Tokyo': 'https://www.2121designsight.jp/gallery3/leasing/gallery3_info01.jpg',
  'Guggenheim Bilbao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Museo_Guggenheim%2C_Bilbao_%2831273245344%29.jpg/640px-Museo_Guggenheim%2C_Bilbao_%2831273245344%29.jpg',
  'MASP Sao Paulo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Novo_MASP.jpg/640px-Novo_MASP.jpg',
  'Nairobi National Museum (art)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/The_National_Museums_of_Kenya_-_Nairobi_02.jpg/640px-The_National_Museums_of_Kenya_-_Nairobi_02.jpg',
  'MoMA (Museum of Modern Art)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Museum_of_Modern_Art_2017.jpg/640px-Museum_of_Modern_Art_2017.jpg',
  'National Gallery, London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/The_National_Gallery%2C_London_-_entrance_in_Trafalgar_Square.jpg/640px-The_National_Gallery%2C_London_-_entrance_in_Trafalgar_Square.jpg',
  // API 미조회/깨짐 항목 직접 매핑 (Commons·Wikipedia 검증 URL)
  'Jameel Arts Centre, Dubai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Jaddaf_Skyline_View_Dubai_Jul23_A7C_05226.jpg/640px-Jaddaf_Skyline_View_Dubai_Jul23_A7C_05226.jpg',
  'Power Station of Art, Shanghai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Power_Station_of_Art%2C_Shanghai%2C_China_%28Unsplash%29.jpg/640px-Power_Station_of_Art%2C_Shanghai%2C_China_%28Unsplash%29.jpg',
  'Russian Museum, St Petersburg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/State_Russian_Museum%2C_Saint_Petersburg.jpg/640px-State_Russian_Museum%2C_Saint_Petersburg.jpg',
  'Serpentine Galleries, London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/20110606_London_96.JPG/640px-20110606_London_96.JPG',
  'Serralves Museum of Contemporary Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Serralves_museum_fa%C3%A7ade.jpg/640px-Serralves_museum_fa%C3%A7ade.jpg',
  'SFMOMA, San Francisco': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2017_SFMOMA_from_Yerba_Buena_Gardens.jpg/640px-2017_SFMOMA_from_Yerba_Buena_Gardens.jpg',
  'Stedelijk Museum, Amsterdam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/De_nieuwe_vleugel_van_het_Stedelijk_Museum_Amsterdam.jpg/640px-De_nieuwe_vleugel_van_het_Stedelijk_Museum_Amsterdam.jpg',
  'Taipei Contemporary Art Center': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Taipei_Fine_Arts_Museum_20150919.jpg/640px-Taipei_Fine_Arts_Museum_20150919.jpg',
  'Tate Britain, London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tate_Britain%2C_Millbank%2C_London.JPG/640px-Tate_Britain%2C_Millbank%2C_London.JPG',
  'Tel Aviv Museum of Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/TelAM.jpg/640px-TelAM.jpg',
  'Tokyo National Museum of Modern Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/National_Museum_of_Modern_Art_Tokyo.jpg/640px-National_Museum_of_Modern_Art_Tokyo.jpg',
  'Tokyo Opera City Art Gallery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Tokyo_Opera_City.jpg/640px-Tokyo_Opera_City.jpg',
  'Triennale di Milano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Parco_Sempione_%28Milan%29%2C_Wikimania_2016%2C_MP_003.jpg/640px-Parco_Sempione_%28Milan%29%2C_Wikimania_2016%2C_MP_003.jpg',
  'UCCA Center for Contemporary Art, Beijing': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/UCCA_Center_for_Contemporary_Art%2C_Beijing.jpg/960px-UCCA_Center_for_Contemporary_Art%2C_Beijing.jpg',
  'Vietnam Museum of Fine Arts, Hanoi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Vietnam_National_Museum_of_Fine_Arts%2C_Hanoi%2C_Vietnam_-_20131030-02.JPG/960px-Vietnam_National_Museum_of_Fine_Arts%2C_Hanoi%2C_Vietnam_-_20131030-02.JPG',
  'White Cube, London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/White_Cube_Bermondsey_%286969207087%29.jpg/960px-White_Cube_Bermondsey_%286969207087%29.jpg',
  'Whitechapel Gallery, London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Whitechapel_Gallery_2020_%283%29_-_Copy.jpg/960px-Whitechapel_Gallery_2020_%283%29_-_Copy.jpg',
  'Whitney Museum of American Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Whitney_Museum_of_American_Art_%2849051573133%29.jpg/960px-Whitney_Museum_of_American_Art_%2849051573133%29.jpg',
  'Palais de Tokyo, Paris': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Palais_de_Tokyo_%40_Paris_%2831028565970%29.jpg/640px-Palais_de_Tokyo_%40_Paris_%2831028565970%29.jpg',
  // MALI부터 하단: DB title_en 정확 매칭 (Commons 검증 URL)
  'MALI (Museo de Arte de Lima)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Fachada_del_Museo_de_Arte_de_Lima_-_Por_Nina_Gavancho.jpg/640px-Fachada_del_Museo_de_Arte_de_Lima_-_Por_Nina_Gavancho.jpg',
  'Banco de la Republica Art Collection, Bogota': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Patio_Museo_Botero_Bogota.JPG/640px-Patio_Museo_Botero_Bogota.JPG',
  'MAC, Santiago de Chile': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Museo_Nacional_de_Bellas_Artes%2C_Santiago_de_Chile..jpg/640px-Museo_Nacional_de_Bellas_Artes%2C_Santiago_de_Chile..jpg',
  'Museo Nacional de Bellas Artes, Havana': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Fine_Arts_Museum_in_Havana%2C_Cuba.jpg/640px-Fine_Arts_Museum_in_Havana%2C_Cuba.jpg',
  'Christchurch Art Gallery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Christchurch_Art_Gallery%2C_Christchurch%2C_New_Zealand.jpg/640px-Christchurch_Art_Gallery%2C_Christchurch%2C_New_Zealand.jpg',
  'New Museum, New York': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Jrb_new_museum_of_Contemporary_Art_new_york_city_001.jpg/640px-Jrb_new_museum_of_Contemporary_Art_new_york_city_001.jpg',
  'Getty Villa, Malibu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/060807-002-GettyVilla001.jpg/640px-060807-002-GettyVilla001.jpg',
  'Seattle Art Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Seattle_Art_Museum_03.jpg/640px-Seattle_Art_Museum_03.jpg',
  'Denver Art Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Denver_Art_Museum_Frederic_C._Hamilton_building.jpg/640px-Denver_Art_Museum_Frederic_C._Hamilton_building.jpg',
  'High Museum of Art, Atlanta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/High_Museum_of_Art_-_Atlanta%2C_GA_-_Flickr_-_hyku_%2811%29.jpg/640px-High_Museum_of_Art_-_Atlanta%2C_GA_-_Flickr_-_hyku_%2811%29.jpg',
  'Gagosian Gallery, New York': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/The_West_24th_Street_Gallery%2C_Gagosian_Gallery_Nov_26%2C_2019.jpg/640px-The_West_24th_Street_Gallery%2C_Gagosian_Gallery_Nov_26%2C_2019.jpg',
  'Hara Museum of Contemporary Art, Tokyo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Hara_Museum_of_Contemporary_Art_2010.jpg/640px-Hara_Museum_of_Contemporary_Art_2010.jpg',
  'National Museum of Art Osaka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/National_Museum_of_Art%2C_Osaka.jpg/640px-National_Museum_of_Art%2C_Osaka.jpg',
  'National Museum of Modern Art Kyoto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/National_Museum_of_Modern_Art_Tokyo.jpg/640px-National_Museum_of_Modern_Art_Tokyo.jpg',
  'Lee Jung-seob Museum, Jeju': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/White_Ox_%281954%29_-_Lee_Jung_Seob.jpg/640px-White_Ox_%281954%29_-_Lee_Jung_Seob.jpg',
  'Asia Culture Center, Gwangju': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Asia_culture_center_Gwangju_metropolitan_city_20190521_083502.jpg/640px-Asia_culture_center_Gwangju_metropolitan_city_20190521_083502.jpg',
  'National Art Gallery of Sri Lanka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Colombo_National_Museum_Sri_Lanka.JPG/640px-Colombo_National_Museum_Sri_Lanka.JPG',
  'National Gallery of Modern Art, Mumbai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/National_Gallery_of_modern_art.jpg/640px-National_Gallery_of_modern_art.jpg',
  'Moscow Museum of Modern Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Petrovka25_MMOMA.jpg/640px-Petrovka25_MMOMA.jpg',
  'National Museum of Art Romania': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Muzeul_de_arta_-_vedere_periferica_4.jpg/640px-Muzeul_de_arta_-_vedere_periferica_4.jpg',
  'National Gallery, Athens': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/National_Art_Gallery_building_in_Athens.jpg/640px-National_Art_Gallery_building_in_Athens.jpg',
  'Latvian National Museum of Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Latvijas_Nacion%C4%81lais_m%C4%81kslas_muzejs_%28LNMM%29.jpg/640px-Latvijas_Nacion%C4%81lais_m%C4%81kslas_muzejs_%28LNMM%29.jpg',
  // DB title_en 정확 매칭 (마이그레이션 100개 커버)
  'MoMA – Museum of Modern Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/MoMa_NY_USA_1.jpg/640px-MoMa_NY_USA_1.jpg',
  'Musee National d Art Moderne, Paris': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Pompidou_center.jpg/640px-Pompidou_center.jpg',
  'Venice Arsenale & Giardini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/La_Biennale_di_Venezia_2019.jpg/640px-La_Biennale_di_Venezia_2019.jpg',
  'CaixaForum Madrid': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Caixaforum_Madrid_2024.jpg/640px-Caixaforum_Madrid_2024.jpg',
  'Fundacio Joan Miro, Barcelona': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Joan_Mir%C3%B3_i_l%27Objecte_2016.jpg/640px-Joan_Mir%C3%B3_i_l%27Objecte_2016.jpg',
  'MNAC, Barcelona': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Museu_Nacional_d%27Art_de_Catalunya_front.jpg/640px-Museu_Nacional_d%27Art_de_Catalunya_front.jpg',
  'LACMA, Los Angeles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/LACMA-Los-Angeles-County-Museum-of-Art-04-2014.jpg/640px-LACMA-Los-Angeles-County-Museum-of-Art-04-2014.jpg',
  'National Gallery of Art, Washington DC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Washington_October_2016-12.jpg/640px-Washington_October_2016-12.jpg',
  'Museum of Fine Arts, Boston': 'https://assets.simpleviewinc.com/simpleview/image/upload/crm/boston/MFA_daytime0_25ac2472-5056-a36a-06ec9fb522715af3.jpg',
  'National Gallery of Canada, Ottawa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ottawa_-_ON_-_National_Gallery_of_Canada.jpg/640px-Ottawa_-_ON_-_National_Gallery_of_Canada.jpg',
  'Montreal Museum of Fine Arts': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Museum_of_Fine_Arts%2C_main_entrance%2C_Montreal.jpg/640px-Museum_of_Fine_Arts%2C_main_entrance%2C_Montreal.jpg',
  'NGV International, Melbourne': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/National_Gallery_of_Victoria_2024.jpg/640px-National_Gallery_of_Victoria_2024.jpg',
  'Museum of Contemporary Art, Sydney': 'https://res.cloudinary.com/dntonpclr/image/upload/v1765419954/MCA_Australia_photo_Brett_Boardman_LR_xfpkid.jpg',
  'Mori Art Museum, Tokyo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Mori_Art_Museum_-----.png/640px-Mori_Art_Museum_-----.png',
  'Chichu Art Museum, Naoshima': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/150505_Chichu_Art_Museum_Naoshima_Island_Kagawa_pref_Japan01s3.jpg/640px-150505_Chichu_Art_Museum_Naoshima_Island_Kagawa_pref_Japan01s3.jpg',
  'MMCA National Museum of Modern Art': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/MMCA-Gwacheon.jpg/640px-MMCA-Gwacheon.jpg',
  'Leeum Samsung Museum of Art': 'https://tong.visitkorea.or.kr/cms/resource/52/2933352_image2_1.bmp',
  'National Gallery Singapore': 'https://www.nationalgallery.sg/content/dam/architecture-history/architecture-and-history-og.webp.thumb.800.480.png',
  'Mucha Museum, Prague': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Mucha_Museum%2C_Prague.JPG/640px-Mucha_Museum%2C_Prague.JPG',
  'Museum of Fine Arts, Budapest': 'https://simskultur.eu/wp-content/uploads/2023/02/Museum-of-Fine-Arts-Budapest.jpeg',
  'National Museum Warsaw (art)': 'https://www.codart.nl/wp-content/uploads/2016/11/Sredniowiecze_Gallery_Medieval_Art_MNW.jpg',
  'National Gallery Prague': 'https://cdn.praguecitytourism.city/2024/03/13091937/qhsdqr0c.jpeg',
  'National Art Museum of Ukraine': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/80-382-0100_Grushevskogo_6.jpg/640px-80-382-0100_Grushevskogo_6.jpg',
  'Museum of Modern Egyptian Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Kairo_-_Altkairo_05.jpg/640px-Kairo_-_Altkairo_05.jpg',
  'Tehran Museum of Contemporary Art': 'https://orienttrips.com/mag/wp-content/uploads/2024/11/Tehran-Museum-of-Contemporary-Art-1-780x470.jpg',
  'Istanbul Modern': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Istanbularcheology.jpg/640px-Istanbularcheology.jpg',
  'Louvre Abu Dhabi': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/55/LouvreAD_exterior.jpg/640px-LouvreAD_exterior.jpg',
  'Johannesburg Art Gallery': 'https://back.vantaart.com/uploads/images/9e5925198d26ec7c4fa9bf83b816bed0.webp',
  'Museo Nacional de Bellas Artes, Buenos Aires': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Museo_Nacional_de_Bellas_Artes_%28Buenos_Aires%29_10209_crop.jpg/640px-Museo_Nacional_de_Bellas_Artes_%28Buenos_Aires%29_10209_crop.jpg',
  'Museo Reina Sofia, Madrid': 'https://www.escuela-hablamos.com/wp-content/uploads/2023/04/mrs.jpg',
  'Palacio de Bellas Artes, Mexico City': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Palacio_Bellas_Artes_-_Mexico_City.jpg/640px-Palacio_Bellas_Artes_-_Mexico_City.jpg',
  'Frida Kahlo Museum (Casa Azul), Mexico City': 'https://static.wixstatic.com/media/589d69_a1ab1b9d0fba472f8546f719ee759efd~mv2.jpg/v1/fill/w_1000,h_667,al_c,q_85/589d69_a1ab1b9d0fba472f8546f719ee759efd~mv2.jpg',
  'M+ Museum, West Kowloon': 'https://webmedia.westkowloon.hk/mplus-building-drone-20250807.png?VersionId=VoeqvOZCwsrlOJhVTilRNJ7_afmjPwSQ',
  'Van Gogh Museum, Amsterdam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Van_Gogh_Museum%2C_Paulus_Potterstraat_7%2C_Amsterdam_-_panoramio_%281%29.jpg/640px-Van_Gogh_Museum%2C_Paulus_Potterstraat_7%2C_Amsterdam_-_panoramio_%281%29.jpg',
  'Alte/Neue/Moderne Pinakothek, Munich': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Alte_Pinakothek_2009.jpg/640px-Alte_Pinakothek_2009.jpg',
  'Alte Nationalgalerie, Berlin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/AlteNationalgalerie_1a.jpg/640px-AlteNationalgalerie_1a.jpg',
  'Hamburger Bahnhof, Berlin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/InvalidenstrBerlin_12-2017_img1.jpg/640px-InvalidenstrBerlin_12-2017_img1.jpg',
  'Gemaldegalerie Alte Meister, Dresden': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Dresden-Zwinger-Courtyard.11.JPG/640px-Dresden-Zwinger-Courtyard.11.JPG',
  'Belvedere, Vienna': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Palacio_Belvedere%2C_Viena%2C_Austria%2C_2020-02-01%2C_DD_93-95_HDR.jpg/640px-Palacio_Belvedere%2C_Viena%2C_Austria%2C_2020-02-01%2C_DD_93-95_HDR.jpg',
  'Moderna Museet, Stockholm': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/MODERN_MUSEUM_MODERNA_MUSEET_STOCKHOLM_%2819%29.jpg/640px-MODERN_MUSEUM_MODERNA_MUSEET_STOCKHOLM_%2819%29.jpg',
  'National Museum, Oslo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Nye_Nasjonalmuseet_%282022%29_%282%29.jpg/640px-Nye_Nasjonalmuseet_%282022%29_%282%29.jpg',
  'Ateneum Art Museum, Helsinki': 'https://apollo-magazine.com/wp-content/uploads/2023/04/LEAD_ateneum.jpg?fit=1000%2C666',
  'Ny Carlsberg Glyptotek, Copenhagen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Glyptoteket_palme.JPG/640px-Glyptoteket_palme.JPG',
  'Louisiana Museum of Modern Art': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Outside_Louisiana_Museum_of_Modern_Art.jpg/640px-Outside_Louisiana_Museum_of_Modern_Art.jpg',
  'Berardo Collection Museum, Lisbon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Berardo_Collection_Museum.png/640px-Berardo_Collection_Museum.png',
  'Kunsthaus Zurich': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Kunsthaus_Z%C3%BCrich_2011-08-06_17-33-46.jpg/640px-Kunsthaus_Z%C3%BCrich_2011-08-06_17-33-46.jpg',
  'Albertina, Vienna': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Wien_-_Albertina.JPG/640px-Wien_-_Albertina.JPG',
  'Art Institute of Chicago': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/20070621_AIC_Gunsaulus_Hall_from_South.JPG/640px-20070621_AIC_Gunsaulus_Hall_from_South.JPG',
  'Zeitz MOCAA, Cape Town': 'https://www.wearch.eu/wp-content/uploads/2017/12/776_2_HR_ZeitzMOCAA_Heatherwick-Studio_Credit_Iwan-Baan_Exterior.png',
  'Fondation Beyeler, Basel': 'https://museenbasel3.mironet.ch/.imaging/mte/museenbasel-theme/small/museenbasel/museen/fondation-beyeler/imageMuseum/16.05.26.FB_AUSSENAUFNAHME_41996_DEF_300_20cm.jpg',
  'Institute of Contemporary Art, Boston': 'https://www.trolleytours.com/wp-content/uploads/2016/05/boston-institute-of-contemporary-art.jpg',
  'Perez Art Museum Miami': 'https://images.adsttc.com/media/images/5342/9e3f/c07a/809f/ab00/0111/newsletter/PAMM__south_facade._Iwan_Baan._2.jpg?1396874746',
  'Pinacoteca di Brera, Milan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Brera_Art_Gallery%2C_Pinacoteca_di_Brera_-_Joy_of_Museums.jpg/640px-Brera_Art_Gallery%2C_Pinacoteca_di_Brera_-_Joy_of_Museums.jpg',
}

/** 100 Nature Spots: 직접 URL 있는 항목만 사용 (ATTRACTIONS 공유 + 검증된 Commons). 나머지는 API/캐시로 조회 — Commons 경로는 MD5 해시 기반이라 추측 URL 사용 시 404 발생 */
const NATURE_DIRECT_IMAGES: Record<string, string> = {
  'Grand Canyon': ATTRACTIONS_DIRECT_IMAGES['Grand Canyon']!,
  'Iguazu Falls': ATTRACTIONS_DIRECT_IMAGES['Iguazu Falls']!,
  'Yellowstone': ATTRACTIONS_DIRECT_IMAGES['Yellowstone National Park']!,
  'Salar de Uyuni': ATTRACTIONS_DIRECT_IMAGES['Salar de Uyuni']!,
  'Niagara Falls': ATTRACTIONS_DIRECT_IMAGES['Niagara Falls']!,
  'Waitomo Glowworm Caves, New Zealand': ATTRACTIONS_DIRECT_IMAGES['Waitomo Glowworm Caves']!,
  'Pamukkale, Turkey': ATTRACTIONS_DIRECT_IMAGES['Pamukkale Cotton Castle']!,
  'Amazon Rainforest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Aerial_view_of_the_Amazon_Rainforest.jpg/960px-Aerial_view_of_the_Amazon_Rainforest.jpg',
  'Borneo Rainforest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Morning_fog_over_Danum_Valley_%2827329938517%29.jpg/960px-Morning_fog_over_Danum_Valley_%2827329938517%29.jpg',
  'Okavango Delta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Okavango_Delta_map.png/960px-Okavango_Delta_map.png',
  'Patagonia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Torres_del_Paine_y_cuernos_del_Paine%2C_montaje.jpg/960px-Torres_del_Paine_y_cuernos_del_Paine%2C_montaje.jpg',
  'Pulo Cinta Falls': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Kawasan.jpg/960px-Kawasan.jpg',
  'Urho Kekkonen NP': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Paratiisikuru_waterfall.JPG/960px-Paratiisikuru_waterfall.JPG',
  'Waipoua Forest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/00_29_0496_Waipoua_Forest_NZ_-_Kauri_Baum_Tane_Mahuta.jpg/960px-00_29_0496_Waipoua_Forest_NZ_-_Kauri_Baum_Tane_Mahuta.jpg',
  'Crimean Caves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Marmurova_pechera2.jpg/960px-Marmurova_pechera2.jpg',
  'Huanglong': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/1_huanglong_pools_aerial_2011.jpg/960px-1_huanglong_pools_aerial_2011.jpg',
  'Sumatra Rainforest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Taman_Nasional_Gunung_Leuser.jpg/960px-Taman_Nasional_Gunung_Leuser.jpg',
  'Dong Phayayen Forest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Haew_Suwat_Waterfall_Khao-Yai02.jpg/960px-Haew_Suwat_Waterfall_Khao-Yai02.jpg',
  'Reynisfjara Black Sand Beach, Iceland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Reynisfjara_Beach_Looking_West_Towards_Dyrh%C3%B3laey.jpg/960px-Reynisfjara_Beach_Looking_West_Towards_Dyrh%C3%B3laey.jpg',
  'Swiss Alps': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Matterhorn_from_Domh%C3%BCtte_-_2.jpg/960px-Matterhorn_from_Domh%C3%BCtte_-_2.jpg',
  'White Sands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/White_Sands_National_Park_visitor_center_and_native_plant_garden%2C_New_Mexico%2C_United_States.jpg/960px-White_Sands_National_Park_visitor_center_and_native_plant_garden%2C_New_Mexico%2C_United_States.jpg',
  'Yosemite Valley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg/960px-Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg',
  'Zhangjiajie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/1_tianzishan_wulingyuan_zhangjiajie_2012.jpg/960px-1_tianzishan_wulingyuan_zhangjiajie_2012.jpg',
  'Namib Desert': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Namib_desert_MODIS.jpg/960px-Namib_desert_MODIS.jpg',
  'Ngorongoro Crater': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Ngorongoro-1001-2.jpg/960px-Ngorongoro-1001-2.jpg',
  'Perito Moreno Glacier': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Perito_Moreno_Glacier_2023.jpg/960px-Perito_Moreno_Glacier_2023.jpg',
  'Plitvice Lakes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/View_in_Plitvice_Lakes_National_Park.jpg/960px-View_in_Plitvice_Lakes_National_Park.jpg',
  'Punta Tombo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Chubut-PuntaTombo-P2220157b-small.jpg/960px-Chubut-PuntaTombo-P2220157b-small.jpg',
  'Sacred Valley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Urubamba_-_Valle_Sagrado_3.JPG/960px-Urubamba_-_Valle_Sagrado_3.JPG',
  'Sahara Desert': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Sahara_real_color.jpg/960px-Sahara_real_color.jpg',
  'Serengeti': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Serengeti-Landscape-2012.JPG/960px-Serengeti-Landscape-2012.JPG',
  'Skocjan Caves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/SkocjanskeJame_2013jpg.jpg/960px-SkocjanskeJame_2013jpg.jpg',
  'Taroko Gorge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Taroko-Gorge_Hualien_Taiwan_Swallow-Grotto-01.jpg/960px-Taroko-Gorge_Hualien_Taiwan_Swallow-Grotto-01.jpg',
  // ─── 깨진 이미지 수정: 제목+nature 검색 기반 직접 URL (Commons 960px 썸네일 사용) ───
  'Gobi Desert': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Gobi_Desert_dunes.jpg/960px-Gobi_Desert_dunes.jpg',
  'Himalayas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Himalayas_and_allied_ranges_NASA_Landsat_showing_the_eight_thousanders%2C_annotated_with_major_rivers.jpg/960px-Himalayas_and_allied_ranges_NASA_Landsat_showing_the_eight_thousanders%2C_annotated_with_major_rivers.jpg',
  'Hormuz Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Iran%27s_Rainbow_Island.jpeg/960px-Iran%27s_Rainbow_Island.jpeg',
  'Komodo National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Komodo_dragon_at_Komodo_National_Park.jpg/960px-Komodo_dragon_at_Komodo_National_Park.jpg',
  'Lake Baikal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Lake_Baikal%2C_Siberian_mixed_taiga_forest%2C_Siberia%2C_Russia.jpg/960px-Lake_Baikal%2C_Siberian_mixed_taiga_forest%2C_Siberia%2C_Russia.jpg',
  'Lake Hillier': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Lake_Hillier_2_Middle_Island_Recherche_Archipelago_NR_IV-2011.JPG/960px-Lake_Hillier_2_Middle_Island_Recherche_Archipelago_NR_IV-2011.JPG',
  'Meteora, Greece': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Meteora%27s_monastery_2.jpg/960px-Meteora%27s_monastery_2.jpg',
  'Mount Roraima': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Roraima3_%2879%29.JPG/960px-Roraima3_%2879%29.JPG',
  'Northern Lights Iceland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Aurora_borealis_over_Eielson_Air_Force_Base%2C_Alaska.jpg/960px-Aurora_borealis_over_Eielson_Air_Force_Base%2C_Alaska.jpg',
  'Paektu Mountain': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Laika_ac_Mt._Paekdu_%287998657081%29.jpg/960px-Laika_ac_Mt._Paekdu_%287998657081%29.jpg',
  'Peninsula Valdes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Peninsula_Vald%C3%A9s_STS-68.jpg/960px-Peninsula_Vald%C3%A9s_STS-68.jpg',
  'Pomerape Valley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Nevados_de_payachata_parinacota_pomerape.jpg/960px-Nevados_de_payachata_parinacota_pomerape.jpg',
  'Roraima Tepui': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Roraima3_%2879%29.JPG/960px-Roraima3_%2879%29.JPG',
  'Tasmanian Wilderness': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Lake_Judd_from_Mt_Eliza.jpg/960px-Lake_Judd_from_Mt_Eliza.jpg',
  'Tian Shan Mountains': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Alpine_meadows_and_snow-covered_peaks_in_Khan_Tengri_Nature_Park%2C_Tien_Shan.jpg/960px-Alpine_meadows_and_snow-covered_peaks_in_Khan_Tengri_Nature_Park%2C_Tien_Shan.jpg',
  'Uluru-Kata Tjuta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/UluruClip3ArtC1941.jpg/960px-UluruClip3ArtC1941.jpg',
  'Antelope Canyon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/USA_Antelope-Canyon.jpg/960px-USA_Antelope-Canyon.jpg',
  'Atacama Desert': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Valle_della_Luna_01.jpg/960px-Valle_della_Luna_01.jpg',
  'Blue Mountains': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Three_Sisters_Sunset.jpg/960px-Three_Sisters_Sunset.jpg',
  'Bryce Canyon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Inspiration_Point_Bryce_Canyon_November_2018_panorama.jpg/960px-Inspiration_Point_Bryce_Canyon_November_2018_panorama.jpg',
  'Champagne Pool': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/ChampagnePool-Wai-O-Tapu_rotated_MC.jpg/960px-ChampagnePool-Wai-O-Tapu_rotated_MC.jpg',
  'Dokdo Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Dokdo_Photo.jpg/960px-Dokdo_Photo.jpg',
  'Etosha National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Dust_Cloud_in_Etosha_National_Park.jpg/960px-Dust_Cloud_in_Etosha_National_Park.jpg',
  'Ganges River': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Varanasiganga.jpg/960px-Varanasiganga.jpg',
  'Ha Long Bay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Ha_Long_Bay_in_2019.jpg/960px-Ha_Long_Bay_in_2019.jpg',
  'Hallasan Volcano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hallasan_Above.jpg/960px-Hallasan_Above.jpg',
  'Jeju Lava Tube': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Manjanggul_lava_column%2C_largest_in_the_world.jpg/960px-Manjanggul_lava_column%2C_largest_in_the_world.jpg',
  'Jiuzhaigou': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/1_jiuzhaigou_valley_wu_hua_hai_2011b.jpg/960px-1_jiuzhaigou_valley_wu_hua_hai_2011b.jpg',
  'Joshua Tree': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Joshua_Tree_-_Cyclops_%2B_Potato_Head_-_Sunrise.jpg/960px-Joshua_Tree_-_Cyclops_%2B_Potato_Head_-_Sunrise.jpg',
  'Kakadu National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Kakadu_2431.jpg/960px-Kakadu_2431.jpg',
  'Kruger National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Kruger_Zebra.JPG/960px-Kruger_Zebra.JPG',
  'Lake Bled, Slovenia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Lake_Bled_from_the_Mountain.jpg/960px-Lake_Bled_from_the_Mountain.jpg',
  'Masai Mara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Masai_Mara_at_Sunset.jpg/960px-Masai_Mara_at_Sunset.jpg',
  'Mount Etna': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Mt_Etna_and_Catania1.jpg/960px-Mt_Etna_and_Catania1.jpg',
  'Mount Kinabalu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Kinabalu.JPG/960px-Kinabalu.JPG',
  'Mount Pinatubo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Mt_Pinatubo_trekking_-_panoramio_%285%29.jpg/960px-Mt_Pinatubo_trekking_-_panoramio_%285%29.jpg',
  'Mount Vesuvius': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Il_cratere_del_Vulcano_-_panoramio.jpg/960px-Il_cratere_del_Vulcano_-_panoramio.jpg',
  'Nagarhole National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Bengal_Tiger_Karnataka.jpg/960px-Bengal_Tiger_Karnataka.jpg',
  'Namaqualand': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Doorn_River_Waterfall%2C_Northern_Cape.jpg/960px-Doorn_River_Waterfall%2C_Northern_Cape.jpg',
  'Sossusvlei': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Sossusvlei%2C_Namibia%2C_2018-08-06%2C_DD_040.jpg/960px-Sossusvlei%2C_Namibia%2C_2018-08-06%2C_DD_040.jpg',
  'Victoria Falls': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Victoria_Falls_from_Zimbabwe.jpg/960px-Victoria_Falls_from_Zimbabwe.jpg',
  'Great Barrier Reef': ATTRACTIONS_DIRECT_IMAGES['Great Barrier Reef']!,
  'Angel Falls': 'https://upload.wikimedia.org/wikipedia/commons/3/33/Angel_falls_in_Venezuela_001.JPG',
  // ─── 누락 항목: Commons 직접(thumb) URL 추가 ───
  'Galapagos Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Bah%C3%ADa_Tortuga%2C_isla_Santa_Cruz%2C_islas_Gal%C3%A1pagos%2C_Ecuador%2C_2015-07-26%2C_DD_26.JPG/960px-Bah%C3%ADa_Tortuga%2C_isla_Santa_Cruz%2C_islas_Gal%C3%A1pagos%2C_Ecuador%2C_2015-07-26%2C_DD_26.JPG',
  'Dolomites': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Dolomiti_al_tramonto.jpg/960px-Dolomiti_al_tramonto.jpg',
  'Fiordland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/00_1371_New_Zealand_-_Milford_Sound.jpg/960px-00_1371_New_Zealand_-_Milford_Sound.jpg',
  'Socotra Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Socotra_dragon_tree.JPG/960px-Socotra_dragon_tree.JPG',
  'Bwindi Impenetrable Forest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Bwindi.JPG/960px-Bwindi.JPG',
  'Fjadrargljufur Canyon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Fjadr%C3%A1rglj%C3%BAfur-pjt.jpg/960px-Fjadr%C3%A1rglj%C3%BAfur-pjt.jpg',
  'Glacier National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hidden_Lake_Overlook_-_Glacier_NP.jpg/960px-Hidden_Lake_Overlook_-_Glacier_NP.jpg',
  'Svalbard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Polar_bear_%28Ursus_maritimus%29_in_the_drift_ice_region_north_of_Svalbard.jpg/960px-Polar_bear_%28Ursus_maritimus%29_in_the_drift_ice_region_north_of_Svalbard.jpg',
  'Franz Josef Glacier': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Franz_Josef_Glacier_valley_from_Rata_Lookout.jpg/960px-Franz_Josef_Glacier_valley_from_Rata_Lookout.jpg',
  'Kakapo Fiordland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Kakapo_%22Sirocco%22_at_feeding_station.jpg/960px-Kakapo_%22Sirocco%22_at_feeding_station.jpg',
  'Cordillera Blanca': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Nevado_Huascaran%2C_Cordillera_Blanca%2C_Peru_%2825382453515%29.jpg/960px-Nevado_Huascaran%2C_Cordillera_Blanca%2C_Peru_%2825382453515%29.jpg',
  'Drakensberg Mountains': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Amphitheatre_Drakensberg.jpg/960px-Amphitheatre_Drakensberg.jpg',
  'Great Blue Hole': 'https://upload.wikimedia.org/wikipedia/commons/6/61/Great_Blue_Hole.jpg',
  'Aldabra Atoll': 'https://upload.wikimedia.org/wikipedia/commons/1/17/Aldabra_Atoll_and_Assumption_Island.jpg',
  'Annapurna Circuit': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/South_Face_of_Annapurna_I_%28Main%29_%283to4%29.jpg/960px-South_Face_of_Annapurna_I_%28Main%29_%283to4%29.jpg',
  'Mount Everest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Everest_kalapatthar.jpg/960px-Everest_kalapatthar.jpg',
  'Kangchenjunga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Kangchenjunga_view_from_Darjeeling.jpg/960px-Kangchenjunga_view_from_Darjeeling.jpg',
  'Ama Dablam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Ama_Dablam2.jpg/960px-Ama_Dablam2.jpg',
  'Aconcagua': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Aconcagua2016.jpg/960px-Aconcagua2016.jpg',
  'Aurora Borealis Alaska': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Northern_lights_Alaska_aurora_borealis_lights_at_night.jpg/960px-Northern_lights_Alaska_aurora_borealis_lights_at_night.jpg',
  'Corcovado National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Parque_Nacional_Corcovado.JPG/960px-Parque_Nacional_Corcovado.JPG',
  'Daintree Rainforest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Daintree_National_Park.jpg/960px-Daintree_National_Park.jpg',
  'Cliffs of Moher, Ireland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Cliffs_of_Moher%2C_County_Clare%2C_Ireland.jpg/960px-Cliffs_of_Moher%2C_County_Clare%2C_Ireland.jpg',
  'Dead Sea, Jordan': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Dead_Sea-18.jpg',
  'Trolltunga, Norway': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Trolltunga_2017.jpg/960px-Trolltunga_2017.jpg',
  'Mount Fuji, Japan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg/960px-View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg',
  'Hamelin Pool': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Stromatolites_in_Shark_Bay.jpg/960px-Stromatolites_in_Shark_Bay.jpg',
}

/** nature 카테고리: DB title_en ↔ NATURE_DIRECT_IMAGES 키 불일치 시 별칭 (다른 카테고리 영향 없음) */
const NATURE_TITLE_ALIASES: Record<string, string> = {
  'Ayers Rock (Uluru)': 'Uluru-Kata Tjuta',
  'Uluru (Ayers Rock)': 'Uluru-Kata Tjuta',
  'Masai Mara National Reserve': 'Masai Mara',
  'Serengeti National Park': 'Serengeti',
  'Yellowstone National Park': 'Yellowstone',
  'Sossusvlei & Namib Desert': 'Sossusvlei',
  'Torres del Paine Patagonia': 'Patagonia',
  'Meteora Monasteries': 'Meteora, Greece',
  'Zhangjiajie National Forest Park': 'Zhangjiajie',
  'Cliffs of Moher': 'Cliffs of Moher, Ireland',
  'Mount Fuji': 'Mount Fuji, Japan',
}

/** Islands 챌린지 직접 이미지 (Commons JPG/PNG, 키 = title_en) */
const ISLANDS_DIRECT_IMAGES: Record<string, string> = {
  'Baa Atoll, Maldives': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Baa_Atoll.png/640px-Baa_Atoll.png',
  'Bora Bora, French Polynesia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Bora_Bora_ISS006.jpg/640px-Bora_Bora_ISS006.jpg',
  'Palawan, Philippines': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Kayangan_Lake%2C_Coron_-_Palawan.jpg/640px-Kayangan_Lake%2C_Coron_-_Palawan.jpg',
  'Komodo Island, Indonesia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Komodo_Island_north_aerial.jpg/640px-Komodo_Island_north_aerial.jpg',
  'Santa Cruz, Galapagos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Los_Gemelos%2C_Isla_Santa_Cruz%2C_Galapagos_Islands.jpg/640px-Los_Gemelos%2C_Isla_Santa_Cruz%2C_Galapagos_Islands.jpg',
  'Nosy Be, Madagascar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Couch%C3%A9_de_soleil_sur_la_plage_de_Nosy_Be_Hell_ville.jpg/640px-Couch%C3%A9_de_soleil_sur_la_plage_de_Nosy_Be_Hell_ville.jpg',
  'Zanzibar, Tanzania': 'https://upload.wikimedia.org/wikipedia/commons/7/73/Zanzibar_sultan_palace.jpg',
  'Praslin, Seychelles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Insel_Praslin%2C_Seychellen_%2838908943104%29.jpg/640px-Insel_Praslin%2C_Seychellen_%2838908943104%29.jpg',
  'Stewart Island (Rakiura), New Zealand': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Port_William_Hut_%28Rakiura_Track%29.JPG/640px-Port_William_Hut_%28Rakiura_Track%29.JPG',
  'Yasawa Islands, Fiji': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Viti_Levu_Islands.jpg/640px-Viti_Levu_Islands.jpg',
  'Tahiti, French Polynesia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tahiti%2C_French_Polynesia_-_PK_18_Punaauia_Beach_%2848055233258%29.jpg/640px-Tahiti%2C_French_Polynesia_-_PK_18_Punaauia_Beach_%2848055233258%29.jpg',
  'Moorea, French Polynesia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/DSC00042_Polyn%C3%A9sia_Moor%C3%A9a_Island_Motu_Mo%C3%A9a_Lagoon_and_transportation_Boat_%288076082190%29.jpg/640px-DSC00042_Polyn%C3%A9sia_Moor%C3%A9a_Island_Motu_Mo%C3%A9a_Lagoon_and_transportation_Boat_%288076082190%29.jpg',
  'Big Island, Hawaii': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Island_of_Hawai%27i_-_Landsat_mosaic.jpg/640px-Island_of_Hawai%27i_-_Landsat_mosaic.jpg',
  'Maui, Hawaii': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Maui_Landsat_Photo.jpg/640px-Maui_Landsat_Photo.jpg',
  'Kauai, Hawaii': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Kauai_from_space_2.jpg/640px-Kauai_from_space_2.jpg',
  'Oahu, Hawaii': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Oahu.jpg/640px-Oahu.jpg',
  'Cocos Island, Costa Rica': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Isla_del_coco.jpg/640px-Isla_del_coco.jpg',
  'Cayo Coco, Cuba': 'https://upload.wikimedia.org/wikipedia/commons/5/50/Spiaggia_cayo_coco%28cuba%29.jpg',
  'Jamaica': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Mahogany_Beach_Ocho_Rios_Jamaica.jpg/640px-Mahogany_Beach_Ocho_Rios_Jamaica.jpg',
  'Barbados': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Dover_Beach%2C_Barbados.JPG/640px-Dover_Beach%2C_Barbados.JPG',
  'St Lucia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/PetitPiton.JPG/640px-PetitPiton.JPG',
  'Dominica': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Emerald_Pool%2C_Dominica.jpg/640px-Emerald_Pool%2C_Dominica.jpg',
  'Antigua': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Antigua.JPG/640px-Antigua.JPG',
  'British Virgin Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Cow_Wreck_Beach%2C_British_Virgin_Islands_Nov_2019.jpg/640px-Cow_Wreck_Beach%2C_British_Virgin_Islands_Nov_2019.jpg',
  'Sao Miguel, Azores': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/S%C3%A3o_Miguel%2C_Azores_ESA399763.jpg/640px-S%C3%A3o_Miguel%2C_Azores_ESA399763.jpg',
  'Madeira, Portugal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Madeira_-_Costa_Norte.jpg/640px-Madeira_-_Costa_Norte.jpg',
  'La Gomera, Canary Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/%28Isla_de_la_Gomera%29_La_Palma_%26_La_Gomera_Islands%2C_Canary_Islands_%28cropped%29.jpg/640px-%28Isla_de_la_Gomera%29_La_Palma_%26_La_Gomera_Islands%2C_Canary_Islands_%28cropped%29.jpg',
  'El Hierro, Canary Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Santa_Cruz_de_Tenerife_SPOT_1320.jpg/640px-Santa_Cruz_de_Tenerife_SPOT_1320.jpg',
  'Lanzarote, Canary Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Lanzarote%27s_Lunar-Like_Landscape.jpg/640px-Lanzarote%27s_Lunar-Like_Landscape.jpg',
  'Sardinia, Italy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Cala_Liberotto_coast%2C_Orosei%2C_Sardinia%2C_Italy.jpg/640px-Cala_Liberotto_coast%2C_Orosei%2C_Sardinia%2C_Italy.jpg',
  'Corsica, France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Scandola_Nature_Reserve_in_Corsica_in_France_-_2013-09-25_L.jpg/640px-Scandola_Nature_Reserve_in_Corsica_in_France_-_2013-09-25_L.jpg',
  'Sicily, Italy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sicilia_Isola_Bella-Beach_View.jpg/640px-Sicilia_Isola_Bella-Beach_View.jpg',
  'Ibiza, Spain': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Es_Vedr%C3%A0_from_Cala_d%27Hort%2C_Ibiza.jpg/640px-Es_Vedr%C3%A0_from_Cala_d%27Hort%2C_Ibiza.jpg',
  'Mallorca, Spain': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Platja_de_s%27algar_%28Felanitx%29.jpg/640px-Platja_de_s%27algar_%28Felanitx%29.jpg',
  'Formentera, Spain': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Formentera_-_Platja_De_Ses_Illetes_-_panoramio_%281%29.jpg/640px-Formentera_-_Platja_De_Ses_Illetes_-_panoramio_%281%29.jpg',
  'Santorini, Greece': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/2011_Dimos_Thiras.png/640px-2011_Dimos_Thiras.png',
  'Mykonos, Greece': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/2011_Dimos_Mykonou.png/640px-2011_Dimos_Mykonou.png',
  'Crete, Greece': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Island_of_Crete%2C_Greece.JPG/640px-Island_of_Crete%2C_Greece.JPG',
  'Corfu, Greece': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Pontikonisi.jpg/640px-Pontikonisi.jpg',
  'Paxos, Greece': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/GaiosPaxiJuly192022_01.jpg/640px-GaiosPaxiJuly192022_01.jpg',
  'Hvar, Croatia': 'https://upload.wikimedia.org/wikipedia/commons/2/27/View_of_Hvar_02.jpg',
  'Vis, Croatia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Marine_traffic_around_Vis_Island%2C_Croatia_%28Copernicus_2024-08-05%29.png/640px-Marine_traffic_around_Vis_Island%2C_Croatia_%28Copernicus_2024-08-05%29.png',
  'Korcula, Croatia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Kor%C4%8Dula_Old_Town%2C_Croatia_%282024%29.jpg/640px-Kor%C4%8Dula_Old_Town%2C_Croatia_%282024%29.jpg',
  'Our Lady of the Rocks, Montenegro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Nuestra_Se%C3%B1ora_de_las_Rocas%2C_Perast%2C_Bah%C3%ADa_de_Kotor%2C_Montenegro%2C_2014-04-19%2C_DD_19.JPG/640px-Nuestra_Se%C3%B1ora_de_las_Rocas%2C_Perast%2C_Bah%C3%ADa_de_Kotor%2C_Montenegro%2C_2014-04-19%2C_DD_19.JPG',
  'Malta Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Malta_-_Ghajnsielem_-_Cominotto_%2B_Blue_Lagoon_%28Comino%29_05_ies.jpg/640px-Malta_-_Ghajnsielem_-_Cominotto_%2B_Blue_Lagoon_%28Comino%29_05_ies.jpg',
  'Gozo, Malta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Gozo_from_space_via_laser_ESA378503_%28cropped%29.jpg/640px-Gozo_from_space_via_laser_ESA378503_%28cropped%29.jpg',
  'Cyprus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Nissi_beach_Cyprus_%2843722549671%29.jpg/640px-Nissi_beach_Cyprus_%2843722549671%29.jpg',
  'Iceland (island nation)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Skogafoss_waterfall_-_Iceland_-_Landscape_photography_%2834692750741%29.jpg/640px-Skogafoss_waterfall_-_Iceland_-_Landscape_photography_%2834692750741%29.jpg',
  'Faroe Islands, Denmark': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/G%C3%A1sadalur_-_Faroe_Islands.jpg/640px-G%C3%A1sadalur_-_Faroe_Islands.jpg',
  'Svalbard, Norway': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/W_W_Svalbard_LandSat7_21.14475E_78.71545N.png/640px-W_W_Svalbard_LandSat7_21.14475E_78.71545N.png',
  'Ilulissat, Greenland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/The_colors_from_Ilulissat_-_Greenland._-_panoramio.jpg/640px-The_colors_from_Ilulissat_-_Greenland._-_panoramio.jpg',
  'Heimaey, Westman Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Aerial_view_of_Heimaey%2C_2009-02-01.jpg/640px-Aerial_view_of_Heimaey%2C_2009-02-01.jpg',
  'Tasmania, Australia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Cradle_Mountain_Behind_Dove_Lake.jpg/640px-Cradle_Mountain_Behind_Dove_Lake.jpg',
  'Lord Howe Island, Australia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/A_view_of_the_landscape_at_Lord_Howe_Island_%2823551478606%29.jpg/640px-A_view_of_the_landscape_at_Lord_Howe_Island_%2823551478606%29.jpg',
  'Fraser Island (K gari), Australia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Indian_Head_view_on_Fraser_Island_%28May_2016%29.jpg/640px-Indian_Head_view_on_Fraser_Island_%28May_2016%29.jpg',
  'Cocos (Keeling) Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cocos_%28Keeling%29_Islands_%2832206670676%29.jpg/640px-Cocos_%28Keeling%29_Islands_%2832206670676%29.jpg',
  'Christmas Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Dolly_Beach%2C_Christmas_Island.jpg/640px-Dolly_Beach%2C_Christmas_Island.jpg',
  'Malaita, Solomon Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Malaita_Island_NASA.jpg/640px-Malaita_Island_NASA.jpg',
  'Tanna, Vanuatu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Tannamap.png/640px-Tannamap.png',
  'Lifou, New Caledonia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Lifou_falaises_Xodre.JPG/640px-Lifou_falaises_Xodre.JPG',
  'Ha apai, Tonga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ha%CA%BBapai.gif/640px-Ha%CA%BBapai.gif',
  'Upolu, Samoa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Samoa_upolu.jpg/640px-Samoa_upolu.jpg',
  'Niue Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Togo_Chasm_at_the_sea_edge%2C_Niue.jpg/640px-Togo_Chasm_at_the_sea_edge%2C_Niue.jpg',
  'Aitutaki, Cook Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/AST-01-039_Aituctaki_Atoll.jpg/640px-AST-01-039_Aituctaki_Atoll.jpg',
  'Tarawa, Kiribati': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/South_Tarawa_from_the_air.jpg/640px-South_Tarawa_from_the_air.jpg',
  'Majuro, Marshall Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Eneko_Islet_02.JPG/640px-Eneko_Islet_02.JPG',
  'Rock Islands, Palau': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Ngerukewid-2016-aerial-view-Luka-Peternel.jpg/640px-Ngerukewid-2016-aerial-view-Luka-Peternel.jpg',
  'Yap, Micronesia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/US_patrol_boats%2C_from_Guam%2C_visit_Yap%2C_Micronesia_-_190703-N-LN093-1116.jpg/640px-US_patrol_boats%2C_from_Guam%2C_visit_Yap%2C_Micronesia_-_190703-N-LN093-1116.jpg',
  'Nauru': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Nauru_Anibare_Bay.jpg',
  'Funafuti, Tuvalu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Funafuti_airport_-_Fiji_Airways.jpg/640px-Funafuti_airport_-_Fiji_Airways.jpg',
  'St Helena, British territory': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Half_Tree_Hollow_-_From_Sea.jpg/640px-Half_Tree_Hollow_-_From_Sea.jpg',
  'Tristan da Cunha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/View_of_Tristan_da_Cunha_from_Nightingale_island.jpg/640px-View_of_Tristan_da_Cunha_from_Nightingale_island.jpg',
  'Ascension Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Ascension_Island1.JPG/640px-Ascension_Island1.JPG',
  'Falkland Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Landscape_Falkland_Islands.jpg/640px-Landscape_Falkland_Islands.jpg',
  'South Georgia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/South_Georgia_Island_as_seen_by_Sentinel-2.jpg/640px-South_Georgia_Island_as_seen_by_Sentinel-2.jpg',
  'Sint Maarten/Saint Martin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Maho_Beach%2C_near_Princess_Juliana_Airport%2C_Caribbean_island_of_Saint_Martin-8Feb2008_%284%29.jpg/640px-Maho_Beach%2C_near_Princess_Juliana_Airport%2C_Caribbean_island_of_Saint_Martin-8Feb2008_%284%29.jpg',
  'Saba, Dutch Caribbean': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Saba_World_Wind.jpg/640px-Saba_World_Wind.jpg',
  'Reunion Island, France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/La_Reunion_Piton_de_la_fournaise_05.jpg/640px-La_Reunion_Piton_de_la_fournaise_05.jpg',
  'Mauritius': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Le_Morne_Beach_in_Mauritius_%2853698123559%29.jpg/640px-Le_Morne_Beach_in_Mauritius_%2853698123559%29.jpg',
  'Rodrigues, Mauritius': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Aerial_view_of_Rodrigues%2C_Mauritius.jpg',
  'Mayotte, France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Plage_de_Hamouro-Mayotte.jpg/640px-Plage_de_Hamouro-Mayotte.jpg',
  'Fernando de Noronha, Brazil': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Parque_Nacional_Marinho_de_Fernando_de_Noronha_por_Fernandoantoniofotos_%2801%29_%28cropped2%29.jpg/640px-Parque_Nacional_Marinho_de_Fernando_de_Noronha_por_Fernandoantoniofotos_%2801%29_%28cropped2%29.jpg',
  'Ilha Grande, Brazil': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/View_Ilha_Grande.JPG/640px-View_Ilha_Grande.JPG',
  'San Andres, Colombia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/San_andres_Island_-_Colombia.jpg/640px-San_andres_Island_-_Colombia.jpg',
  'Guadeloupe, France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Guadeloupe_-_Premi%C3%A8re_et_deuxi%C3%A8me_Chutes_du_Carbet.jpg/640px-Guadeloupe_-_Premi%C3%A8re_et_deuxi%C3%A8me_Chutes_du_Carbet.jpg',
  'Marie-Galante, Guadeloupe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Guadeloupe_map.png/640px-Guadeloupe_map.png',
  'Cayo Santa Maria, Cuba': 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Plage_de_cayo_santa_maria.JPG',
  'Eleuthera, Bahamas': 'https://upload.wikimedia.org/wikipedia/commons/8/83/Eleuthera_map.jpg',
  'Providenciales, Turks and Caicos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Turtle_Cove_Providenciales_Beach.jpg/640px-Turtle_Cove_Providenciales_Beach.jpg',
  'Anguilla': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Scrub_Island_%28Anguilla%29.jpg/640px-Scrub_Island_%28Anguilla%29.jpg',
  // 100 Islands: 직접 URL (Commons JPG/PNG, SVG·작은 지도 대신 섬 경치 사진)
  'Capri, Italy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Capri_harbour_from_Anacapri_2013.jpg/640px-Capri_harbour_from_Anacapri_2013.jpg',
  'Bermuda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Horseshoe_Bay_beach%2C_Bermuda_IMG_0359.jpg/640px-Horseshoe_Bay_beach%2C_Bermuda_IMG_0359.jpg',
  'Aruba': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Aruba_Palm_Beach.JPG/640px-Aruba_Palm_Beach.JPG',
  'Martinique, France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Martinique-de-haut_%28cropped%29.jpg/640px-Martinique-de-haut_%28cropped%29.jpg',
  'Grenada': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Grenada2010.jpg/640px-Grenada2010.jpg',
  'Mahe, Seychelles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Seychelles_003.JPG/640px-Seychelles_003.JPG',
  'Roatan, Honduras': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Westbay2106.jpg/640px-Westbay2106.jpg',
  'Ischia, Italy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Ischia_da_procida.jpg/640px-Ischia_da_procida.jpg',
  'Curacao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Curacao_Grote_Knip_Kenepa_Grandi_beach_%2836530701322%29.jpg/640px-Curacao_Grote_Knip_Kenepa_Grandi_beach_%2836530701322%29.jpg',
  'Bequia, Saint Vincent and the Grenadines': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Admiralty_Bay_on_Bequia%2C_Saint_Vincent_and_the_Grenadines_%2847354377411%29.jpg/640px-Admiralty_Bay_on_Bequia%2C_Saint_Vincent_and_the_Grenadines_%2847354377411%29.jpg',
}

/** Islands: 제목별 검색해 매칭한 직접 이미지. 각 섬당 서로 다른 URL만 사용 (중복 없음). 없으면 getDirectImageUrl에서 ISLANDS_DIRECT_IMAGES 폴백. */
const ISLANDS_USER_DIRECT_IMAGES: Record<string, string> = {
  'Baa Atoll, Maldives': 'https://images.unsplash.com/photo-1527401850656-0f34108fdb30?w=640',
  'Bora Bora, French Polynesia': 'https://images.unsplash.com/photo-1703549008444-a60559aa2c07?w=640',
  'Palawan, Philippines': 'https://images.unsplash.com/photo-1757264483792-16ef6606b2fd?w=640',
  'Komodo Island, Indonesia': 'https://images.unsplash.com/photo-1754065442965-7c2897c7f817?w=640',
  'Santa Cruz, Galapagos': 'https://images.unsplash.com/photo-1706957660791-708f17e1da98?w=640',
  'Nosy Be, Madagascar': 'https://images.unsplash.com/photo-1760465789374-f60b320329b8?w=640',
  'Zanzibar, Tanzania': 'https://images.unsplash.com/photo-1650223847521-63cc8f803656?w=640',
  'Praslin, Seychelles': 'https://images.unsplash.com/photo-1693169537521-9beef1dc31ca?w=640',
  'Stewart Island (Rakiura), New Zealand': 'https://images.unsplash.com/photo-1531226208074-94fb5a1bb26c?w=640',
  'Yasawa Islands, Fiji': 'https://images.unsplash.com/photo-1760292132737-aab82a97bc9e?w=640',
  'Tahiti, French Polynesia': 'https://images.unsplash.com/photo-1738763073249-3d3f3f072062?w=640',
  'Moorea, French Polynesia': 'https://images.pexels.com/photos/1139040/pexels-photo-1139040.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Maui, Hawaii': 'https://images.unsplash.com/photo-1756807430554-d514a54751bf?w=640',
  'Big Island, Hawaii': 'https://images.unsplash.com/photo-1576941026827-bccc82341bdd?w=640',
  'Oahu, Hawaii': 'https://images.unsplash.com/photo-1698094276348-c542aa9c5609?w=640',
  'Kauai, Hawaii': 'https://images.unsplash.com/photo-1567285369794-e64e94b697e0?w=640',
  'Cocos Island, Costa Rica': 'https://images.unsplash.com/photo-1672631097640-f9ab1c2d8486?w=640',
  'Cayo Coco, Cuba': 'https://images.unsplash.com/photo-1763634537151-c258ed466ddb?w=640',
  'Jamaica': 'https://images.pexels.com/photos/457878/pexels-photo-457878.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Barbados': 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=640',
  'St Lucia': 'https://images.unsplash.com/photo-1745156705689-eef88991849d?w=640',
  'Dominica': 'https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Antigua': 'https://images.pexels.com/photos/457881/pexels-photo-457881.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Sao Miguel, Azores': 'https://images.unsplash.com/photo-1756731682568-62db9b3f0885?w=640',
  'Madeira, Portugal': 'https://images.unsplash.com/photo-1563041853-19230f6e1d17?w=640',
  'El Hierro, Canary Islands': 'https://images.pexels.com/photos/3936144/pexels-photo-3936144.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Lanzarote, Canary Islands': 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Sardinia, Italy': 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Corsica, France': 'https://images.unsplash.com/photo-1691573155562-bb83d1237f23?w=640',
  'Sicily, Italy': 'https://images.unsplash.com/photo-1670667105463-5b29d841cfe9?w=640',
  'Ibiza, Spain': 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Mallorca, Spain': 'https://images.pexels.com/photos/1483053/pexels-photo-1483053.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Formentera, Spain': 'https://images.pexels.com/photos/1121782/pexels-photo-1121782.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Santorini, Greece': 'https://images.unsplash.com/photo-1571406252241-db0280bd36cd?w=640',
  'Mykonos, Greece': 'https://images.unsplash.com/photo-1669842360697-c7eba7310a85?w=640',
  'Crete, Greece': 'https://images.unsplash.com/photo-1720811246845-cf2781c9dc80?w=640',
  'Corfu, Greece': 'https://images.unsplash.com/photo-1725815091639-de43b766199d?w=640',
  'Paxos, Greece': 'https://images.unsplash.com/photo-1752834368593-2360055e61ed?w=640',
  'Hvar, Croatia': 'https://images.unsplash.com/photo-1761382799475-d1fcb811421a?w=640',
  'Vis, Croatia': 'https://images.pexels.com/photos/1179225/pexels-photo-1179225.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Korcula, Croatia': 'https://images.pexels.com/photos/1179234/pexels-photo-1179234.jpeg?auto=compress&cs=tinysrgb&w=640',
  'La Gomera, Canary Islands': 'https://images.unsplash.com/photo-1508662790687-257eefcdccfc?w=640',
  'Our Lady of the Rocks, Montenegro': 'https://images.pexels.com/photos/5641345/pexels-photo-5641345.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Malta Island': 'https://images.unsplash.com/photo-1648460459166-16ecb38c8c6f?w=640',
  'Gozo, Malta': 'https://images.unsplash.com/photo-1668647184912-67da07256e3e?w=640',
  'Cyprus': 'https://images.unsplash.com/photo-1617870544224-039877fd68fa?w=640',
  'Iceland (island nation)': 'https://images.unsplash.com/photo-1696759921577-d5fa77c6edf9?w=640',
  'Faroe Islands, Denmark': 'https://images.pexels.com/photos/26237988/pexels-photo-26237988.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Svalbard, Norway': 'https://images.unsplash.com/photo-1766699623153-096b7ff8b5d1?w=640',
  'Ilulissat, Greenland': 'https://images.unsplash.com/photo-1543470373-e055b73a8f29?w=640',
  'Heimaey, Westman Islands': 'https://images.unsplash.com/photo-1724884564497-f5024b7e2f93?w=640',
  'Tasmania, Australia': 'https://images.unsplash.com/photo-1740025808709-5d418f3e23dd?w=640',
  'Lord Howe Island, Australia': 'https://images.unsplash.com/photo-1641116694949-220a5cd0f60d?w=640',
  'Fraser Island (K gari), Australia': 'https://images.unsplash.com/photo-1431411207774-da3c7311b5e8?w=640',
  'Christmas Island': 'https://images.pexels.com/photos/188029/pexels-photo-188029.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Malaita, Solomon Islands': 'https://images.unsplash.com/photo-1767857456625-4479df0eb285?w=640',
  'Tanna, Vanuatu': 'https://images.pexels.com/photos/2662086/pexels-photo-2662086.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Lifou, New Caledonia': 'https://images.pexels.com/photos/1320670/pexels-photo-1320670.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Ha apai, Tonga': 'https://images.pexels.com/photos/1179223/pexels-photo-1179223.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Upolu, Samoa': 'https://images.unsplash.com/photo-1738763073249-3d3f3f072062?w=640',
  'Niue Island': 'https://images.pexels.com/photos/240526/pexels-photo-240526.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Aitutaki, Cook Islands': 'https://images.pexels.com/photos/31198507/pexels-photo-31198507.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Tarawa, Kiribati': 'https://images.pexels.com/photos/1179219/pexels-photo-1179219.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Majuro, Marshall Islands': 'https://images.unsplash.com/photo-1760292132737-aab82a97bc9e?w=640',
  'Rock Islands, Palau': 'https://images.pexels.com/photos/20257503/pexels-photo-20257503.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Yap, Micronesia': 'https://images.unsplash.com/photo-1553602889-f85ab725f992?w=640',
  'Nauru': 'https://images.pexels.com/photos/31509800/pexels-photo-31509800.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Funafuti, Tuvalu': 'https://images.unsplash.com/photo-1702664045144-8c97b3034d26?w=640',
  'St Helena, British territory': 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Tristan da Cunha': 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Ascension Island': 'https://images.pexels.com/photos/1202751/pexels-photo-1202751.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Falkland Islands': 'https://images.unsplash.com/photo-1673374143721-3af1759f9ea9?w=640',
  'South Georgia': 'https://images.unsplash.com/photo-1635810766767-23613660be8c?w=640',
  'Sint Maarten/Saint Martin': 'https://images.unsplash.com/photo-1639504828548-df3d4609d2d1?w=640',
  'Saba, Dutch Caribbean': 'https://images.unsplash.com/photo-1702218341656-7decf1adaa24?w=640',
  'Reunion Island, France': 'https://images.pexels.com/photos/5023942/pexels-photo-5023942.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Mauritius': 'https://images.unsplash.com/photo-1650928660911-e7f6161093ac?w=640',
  'Rodrigues, Mauritius': 'https://images.pexels.com/photos/1179205/pexels-photo-1179205.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Mayotte, France': 'https://images.pexels.com/photos/1179204/pexels-photo-1179204.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Fernando de Noronha, Brazil': 'https://images.unsplash.com/photo-1749199594755-781f40fbaa1a?w=640',
  'Ilha Grande, Brazil': 'https://images.unsplash.com/photo-1647971447454-8093ed0f8e3d?w=640',
  'San Andres, Colombia': 'https://images.pexels.com/photos/4321802/pexels-photo-4321802.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Guadeloupe, France': 'https://images.unsplash.com/photo-1519830103773-4bdc5166a0db?w=640',
  'Marie-Galante, Guadeloupe': 'https://images.pexels.com/photos/28768833/pexels-photo-28768833.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Cayo Santa Maria, Cuba': 'https://images.unsplash.com/photo-1655299417498-52f3a304c2a4?w=640',
  'Eleuthera, Bahamas': 'https://images.unsplash.com/photo-1575482061865-e8118f2e9061?w=640',
  'Providenciales, Turks and Caicos': 'https://images.unsplash.com/photo-1760429613920-97150368ed79?w=640',
  'Anguilla': 'https://images.unsplash.com/photo-1732817207979-b78bee396ddb?w=640',
  'Capri, Italy': 'https://images.unsplash.com/photo-1724003751734-93082ea1c3c7?w=640',
  'Bermuda': 'https://images.unsplash.com/photo-1670327368877-51b2f129e016?w=640',
  'Aruba': 'https://images.unsplash.com/photo-1761254462343-1f46ef277b9a?w=640',
  'Martinique, France': 'https://images.pexels.com/photos/1179193/pexels-photo-1179193.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Grenada': 'https://images.pexels.com/photos/1179192/pexels-photo-1179192.jpeg?auto=compress&cs=tinysrgb&w=640',
  'Mahe, Seychelles': 'https://images.unsplash.com/photo-1636110026885-8950fbdd3e74?w=640',
  'Roatan, Honduras': 'https://images.unsplash.com/photo-1655993083805-aed074c36978?w=640',
  'Ischia, Italy': 'https://images.unsplash.com/photo-1628522241320-8135caa27dcf?w=640',
  'Curacao': 'https://images.unsplash.com/photo-1705094262475-e6d5afc29422?w=640',
  'Bequia, Saint Vincent and the Grenadines': 'https://images.unsplash.com/photo-1748850475045-fd017abde2a7?w=640',
}

/** 100 Animals: Wikipedia REST summary API로 수집한 640px 썸네일 (scripts/fetch-animal-images.js). 나머지 1종은 API 폴백 */
const ANIMALS_DIRECT_IMAGES: Record<string, string> = {
  'African Lion': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg/640px-020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg',
  'African Elephant': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/African_Elephant_%28Loxodonta_africana%29_male_%2817289351322%29.jpg/640px-African_Elephant_%28Loxodonta_africana%29_male_%2817289351322%29.jpg',
  'Leopard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/African_leopard_male_%28cropped%29.jpg/640px-African_leopard_male_%28cropped%29.jpg',
  'Cheetah': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Male_cheetah_facing_left_in_South_Africa.jpg/640px-Male_cheetah_facing_left_in_South_Africa.jpg',
  'White Rhino': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/109_Male_White_rhinoceros_walking_in_the_Kalahari_Desert_of_Namibia_Photo_by_Giles_Laurent.jpg/640px-109_Male_White_rhinoceros_walking_in_the_Kalahari_Desert_of_Namibia_Photo_by_Giles_Laurent.jpg',
  'Hippopotamus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Portrait_Hippopotamus_in_the_water.jpg/640px-Portrait_Hippopotamus_in_the_water.jpg',
  'Giraffe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Giraffe_Mikumi_National_Park.jpg/640px-Giraffe_Mikumi_National_Park.jpg',
  'Mountain Gorilla': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Susa_group%2C_mountain_gorilla.jpg/640px-Susa_group%2C_mountain_gorilla.jpg',
  'Bornean Orangutan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Tanjung_Puting30477.jpg/640px-Tanjung_Puting30477.jpg',
  'Giant Panda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Grosser_Panda.JPG/640px-Grosser_Panda.JPG',
  'Snow Leopard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Irbis4.JPG/640px-Irbis4.JPG',
  'Bengal Tiger': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Bengal_tiger_in_Sanjay_Dubri_Tiger_Reserve_December_2024_by_Tisha_Mukherjee_11.jpg/640px-Bengal_tiger_in_Sanjay_Dubri_Tiger_Reserve_December_2024_by_Tisha_Mukherjee_11.jpg',
  'Komodo Dragon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/202306_Varanus_komodoensis.jpg/640px-202306_Varanus_komodoensis.jpg',
  'Greater Flamingo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/010_Greater_flamingos_male_and_female_in_the_Camargue_during_mating_season_Photo_by_Giles_Laurent.jpg/640px-010_Greater_flamingos_male_and_female_in_the_Camargue_during_mating_season_Photo_by_Giles_Laurent.jpg',
  'Humpback Whale': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Humpback_Whale_underwater_shot.jpg/640px-Humpback_Whale_underwater_shot.jpg',
  'Sperm Whale': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Mother_and_baby_sperm_whale.jpg/640px-Mother_and_baby_sperm_whale.jpg',
  'Orca': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Killerwhales_jumping.jpg/640px-Killerwhales_jumping.jpg',
  'Blue Whale': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Anim1754_-_Flickr_-_NOAA_Photo_Library.jpg/640px-Anim1754_-_Flickr_-_NOAA_Photo_Library.jpg',
  'Mobula Ray': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Mobula_breaching.jpg/640px-Mobula_breaching.jpg',
  'Manta Ray': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Dharavandhoo_Thila_-_Manata_Black_Pearl.JPG/640px-Dharavandhoo_Thila_-_Manata_Black_Pearl.JPG',
  'Whale Shark': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Similan_Dive_Center_-_great_whale_shark.jpg/640px-Similan_Dive_Center_-_great_whale_shark.jpg',
  'Nile Crocodile': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/NileCrocodile.jpg/640px-NileCrocodile.jpg',
  'Sea Krait': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Laticauda_colubrina_Lembeh2.jpg/640px-Laticauda_colubrina_Lembeh2.jpg',
  'Seahorse': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Hippocampus_hippocampus_%28on_Ascophyllum_nodosum%29.jpg/640px-Hippocampus_hippocampus_%28on_Ascophyllum_nodosum%29.jpg',
  'Adelie Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Hope_Bay-2016-Trinity_Peninsula%E2%80%93Ad%C3%A9lie_penguin_%28Pygoscelis_adeliae%29_04.jpg/640px-Hope_Bay-2016-Trinity_Peninsula%E2%80%93Ad%C3%A9lie_penguin_%28Pygoscelis_adeliae%29_04.jpg',
  'Emperor Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Aptenodytes_forsteri_-Snow_Hill_Island%2C_Antarctica_-adults_and_juvenile-8.jpg/640px-Aptenodytes_forsteri_-Snow_Hill_Island%2C_Antarctica_-adults_and_juvenile-8.jpg',
  'Albatross': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Short_tailed_Albatross1.jpg/640px-Short_tailed_Albatross1.jpg',
  'Marine Iguana': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Amblyrhynchus_cristatus_%283838137696%29.jpg/640px-Amblyrhynchus_cristatus_%283838137696%29.jpg',
  'Galapagos Tortoise': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Galapagos_giant_tortoise_Geochelone_elephantopus.jpg/640px-Galapagos_giant_tortoise_Geochelone_elephantopus.jpg',
  'Indian One-horned Rhino': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Great-Indian-one-horned-rhinoceros-at-Kaziranga-national-park-in-Assam-India.jpg/640px-Great-Indian-one-horned-rhinoceros-at-Kaziranga-national-park-in-Assam-India.jpg',
  'Harpy Eagle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Harpia_harpyja_001_800.jpg/640px-Harpia_harpyja_001_800.jpg',
  'Resplendent Quetzal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Resplendent_quetzal_san_gerardo_de_dota_3.31.24_DSC_3989-topaz-denoiseraw.jpg/640px-Resplendent_quetzal_san_gerardo_de_dota_3.31.24_DSC_3989-topaz-denoiseraw.jpg',
  'Green Anaconda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Sucuri_verde.jpg/640px-Sucuri_verde.jpg',
  'Blue Morpho Butterfly': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Morpho_menelaus_huebneri_MHNT_Male_Dos.jpg/640px-Morpho_menelaus_huebneri_MHNT_Male_Dos.jpg',
  'Pygmy Hippo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Hexaprotodon_liberiensis_in_Edinburgh_Zoo.JPG/640px-Hexaprotodon_liberiensis_in_Edinburgh_Zoo.JPG',
  'African Wild Dog': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/African_Wild_Dog_at_Working_with_Wildlife.jpg/640px-African_Wild_Dog_at_Working_with_Wildlife.jpg',
  'Stingray': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/SStringray.jpg/640px-SStringray.jpg',
  'Blue-Ringed Octopus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Hapalochlaena_lunulata2.JPG/640px-Hapalochlaena_lunulata2.JPG',
  'Galapagos Sea Lion': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Galapagos%2C_sea-lion%2C_female_%28by_Casey_Klebba%29.jpg/640px-Galapagos%2C_sea-lion%2C_female_%28by_Casey_Klebba%29.jpg',
  'Beavers': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/American_Beaver.jpg/640px-American_Beaver.jpg',
  'Grizzly Bear': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/GrizzlyBearJeanBeaufort.jpg/640px-GrizzlyBearJeanBeaufort.jpg',
  'Polar Bear': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Polar_Bear_-_Alaska_%28cropped%29.jpg/640px-Polar_Bear_-_Alaska_%28cropped%29.jpg',
  'Narwhal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/%D0%9D%D0%B0%D1%80%D0%B2%D0%B0%D0%BB_%D0%B2_%D1%80%D0%BE%D1%81%D1%81%D0%B8%D0%B9%D1%81%D0%BA%D0%BE%D0%B9_%D0%90%D1%80%D0%BA%D1%82%D0%B8%D0%BA%D0%B5.jpg/640px-%D0%9D%D0%B0%D1%80%D0%B2%D0%B0%D0%BB_%D0%B2_%D1%80%D0%BE%D1%81%D1%81%D0%B8%D0%B9%D1%81%D0%BA%D0%BE%D0%B9_%D0%90%D1%80%D0%BA%D1%82%D0%B8%D0%BA%D0%B5.jpg',
  'Sea Otter': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Sea_Otter_%28Enhydra_lutris%29_%2825169790524%29_crop.jpg/640px-Sea_Otter_%28Enhydra_lutris%29_%2825169790524%29_crop.jpg',
  'Reindeer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Reinbukken_p%C3%A5_frisk_gr%C3%B8nt_beite._-_panoramio.jpg/640px-Reinbukken_p%C3%A5_frisk_gr%C3%B8nt_beite._-_panoramio.jpg',
  'Wolverine': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Gulo_gulo_2.jpg/640px-Gulo_gulo_2.jpg',
  'Superb Lyrebird': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Superb_lyrbird_in_scrub.jpg/640px-Superb_lyrbird_in_scrub.jpg',
  'Cassowary': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Cassowary_Diversity.jpg/640px-Cassowary_Diversity.jpg',
  'Andean Condor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/AndeanCondorMale.jpg/640px-AndeanCondorMale.jpg',
  'Jaguar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Standing_jaguar.jpg/640px-Standing_jaguar.jpg',
  'Tapir': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Tapiridae.png/640px-Tapiridae.png',
  'Capybara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/046_Capybara_by_the_river_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg/640px-046_Capybara_by_the_river_in_Encontro_das_%C3%81guas_State_Park_Photo_by_Giles_Laurent.jpg',
  'Giant Armadillo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Priodontes_maximus_at_R%C3%A9gina.jpg/640px-Priodontes_maximus_at_R%C3%A9gina.jpg',
  'Tokay Gecko': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gekko_gecko_192144834.jpg/640px-Gekko_gecko_192144834.jpg',
  'Impala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Impala_%28Aepyceros_melampus%29_male_Kruger.jpg/640px-Impala_%28Aepyceros_melampus%29_male_Kruger.jpg',
  'Wildebeest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Blue_Wildebeest%2C_Ngorongoro.jpg/640px-Blue_Wildebeest%2C_Ngorongoro.jpg',
  'Gemsbok Oryx': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Gemsbok_%28Oryx_gazella%29_male.jpg/640px-Gemsbok_%28Oryx_gazella%29_male.jpg',
  'Plains Zebra': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Equus_quagga_burchellii_-_Etosha%2C_2014.jpg/640px-Equus_quagga_burchellii_-_Etosha%2C_2014.jpg',
  'Wombat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Vombatus_ursinus_-Maria_Island_National_Park.jpg/640px-Vombatus_ursinus_-Maria_Island_National_Park.jpg',
  'Quokka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Quokka_at_rottnest_%28cropped%29.jpg/640px-Quokka_at_rottnest_%28cropped%29.jpg',
  'Tasmanian Devil': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Sarcophilus_harrisii_taranna.jpg/640px-Sarcophilus_harrisii_taranna.jpg',
  'Koala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Koala_climbing_tree.jpg/640px-Koala_climbing_tree.jpg',
  'Red Kangaroo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Red_kangaroo_-_melbourne_zoo.jpg/640px-Red_kangaroo_-_melbourne_zoo.jpg',
  'Platypus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Duck-billed_platypus_%28Ornithorhynchus_anatinus%29_Scottsdale.jpg/640px-Duck-billed_platypus_%28Ornithorhynchus_anatinus%29_Scottsdale.jpg',
  'Emu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Emu_1_-_Tidbinbilla.jpg/640px-Emu_1_-_Tidbinbilla.jpg',
  'Clownfish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Amphiprion_ocellaris_%28Clown_anemonefish%29_by_Nick_Hobgood.jpg/640px-Amphiprion_ocellaris_%28Clown_anemonefish%29_by_Nick_Hobgood.jpg',
  'Pygmy Slow Loris': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Nycticebus_pygmaeus_004.jpg/640px-Nycticebus_pygmaeus_004.jpg',
  'Long-snouted Spinner Dolphin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/A_spinner_dolphin_in_the_Red_Sea.jpg/640px-A_spinner_dolphin_in_the_Red_Sea.jpg',
  'Golden Poison Frog': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Schrecklicherpfeilgiftfrosch-01.jpg/640px-Schrecklicherpfeilgiftfrosch-01.jpg',
  'African Crowned Eagle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Crowned_Eagle_%28Stephanoaetus_coronatus%29_with_prey_..._%2829591438981%29.jpg/640px-Crowned_Eagle_%28Stephanoaetus_coronatus%29_with_prey_..._%2829591438981%29.jpg',
  'Wallaby': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Red_necked_wallaby444.jpg/640px-Red_necked_wallaby444.jpg',
  'Rhinoceros Hornbill': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Buceros_rhinoceros_-Singapore_Zoo_-pair-8a.jpg/640px-Buceros_rhinoceros_-Singapore_Zoo_-pair-8a.jpg',
  'Mandrill': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Mandrill_Albert_September_2015_Zoo_Berlin_%282%29.jpg/640px-Mandrill_Albert_September_2015_Zoo_Berlin_%282%29.jpg',
  'Snowy Owl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/SnowyOwlAmericanBlackDuck.jpg/640px-SnowyOwlAmericanBlackDuck.jpg',
  "Lion's Mane Jellyfish": 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Lion%27s_mane_jellyfish_in_Gullmarn_fjord_at_S%C3%A4mstad_7.jpg/640px-Lion%27s_mane_jellyfish_in_Gullmarn_fjord_at_S%C3%A4mstad_7.jpg',
  'Okapi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Saint-Aignan_%28Loir-et-Cher%29._Okapi.jpg/640px-Saint-Aignan_%28Loir-et-Cher%29._Okapi.jpg',
  'Japanese Macaque': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Japanese_Snow_Monkey_%28Macaque%29_Mother_Grooms_Her_Young.jpg/640px-Japanese_Snow_Monkey_%28Macaque%29_Mother_Grooms_Her_Young.jpg',
  'Asiatic Black Bear': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Ursus_thibetanus_3_%28Wroclaw_zoo%29.JPG/640px-Ursus_thibetanus_3_%28Wroclaw_zoo%29.JPG',
  'Saiga Antelope': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Saiga_antelope_at_the_Stepnoi_Sanctuary.jpg/640px-Saiga_antelope_at_the_Stepnoi_Sanctuary.jpg',
  'Eurasian Lynx': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Lynx_Nationalpark_Bayerischer_Wald_01.jpg/640px-Lynx_Nationalpark_Bayerischer_Wald_01.jpg',
  'Iberian Lynx': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Lince_ib%C3%A9rico_%28Lynx_pardinus%29%2C_Almuradiel%2C_Ciudad_Real%2C_Espa%C3%B1a%2C_2021-12-19%2C_DD_07.jpg/640px-Lince_ib%C3%A9rico_%28Lynx_pardinus%29%2C_Almuradiel%2C_Ciudad_Real%2C_Espa%C3%B1a%2C_2021-12-19%2C_DD_07.jpg',
  'Gray Wolf': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Eurasian_wolf_2.jpg/640px-Eurasian_wolf_2.jpg',
  'Brown Bear': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2010-kodiak-bear-1.jpg/640px-2010-kodiak-bear-1.jpg',
  'Shortfin Mako Shark': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Shortfin_mako_%28Isurus_oxyrinchus%29.jpg/640px-Shortfin_mako_%28Isurus_oxyrinchus%29.jpg',
  'Common Dolphin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Common_dolphin_noaa.jpg/640px-Common_dolphin_noaa.jpg',
  'American Bison': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/American_bison_k5680-1.jpg/640px-American_bison_k5680-1.jpg',
  'Black-tailed Prairie Dog': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Cynomys_ludovicianus_%2854906540630%29.jpg/640px-Cynomys_ludovicianus_%2854906540630%29.jpg',
  'Chimpanzee': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/015_Chimpanzee_at_Kibale_forest_National_Park_Photo_by_Giles_Laurent.jpg/640px-015_Chimpanzee_at_Kibale_forest_National_Park_Photo_by_Giles_Laurent.jpg',
  'Great White Shark': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/White_shark.jpg/640px-White_shark.jpg',
  'Cape Buffalo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/African_buffalo_%28Syncerus_caffer_caffer%29_male_with_cattle_egret.jpg/640px-African_buffalo_%28Syncerus_caffer_caffer%29_male_with_cattle_egret.jpg',
  'Three-toed Sloth': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Bradypus.jpg/640px-Bradypus.jpg',
  'Atlantic Puffin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Puffin_%28Fratercula_arctica%29.jpg/640px-Puffin_%28Fratercula_arctica%29.jpg',
  'Fennec Fox': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Fennec_Fox_Vulpes_zerda.jpg/640px-Fennec_Fox_Vulpes_zerda.jpg',
  'Amur Tiger': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/P.t.altaica_Tomak_Male.jpg/640px-P.t.altaica_Tomak_Male.jpg',
  'Scalloped Hammerhead Shark': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Scalloped_Hammerhead_Shark_Sphyrna_Lewini_%28226845659%29.jpeg/640px-Scalloped_Hammerhead_Shark_Sphyrna_Lewini_%28226845659%29.jpeg',
  'Golden Snub-nosed Monkey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Golden_Snub-nosed_Monkeys%2C_Qinling_Mountains_-_China.jpg/640px-Golden_Snub-nosed_Monkeys%2C_Qinling_Mountains_-_China.jpg',
  'Black Jaguar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Black_Jaguar%2C_Panthera_Onca.jpg/640px-Black_Jaguar%2C_Panthera_Onca.jpg',
  'Aldabra Tortoise': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Aldabra.giant.tortoise.arp.jpg/640px-Aldabra.giant.tortoise.arp.jpg',
  'Black Cockatoo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Calyptorhynchus_latirostris_with_gumnut.JPG/640px-Calyptorhynchus_latirostris_with_gumnut.JPG',
  "Darwin's Finch": 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Darwin%27s_finches.png/640px-Darwin%27s_finches.png',
}

/** 100 Festivals: Wikipedia API로만 수집 (scripts/fetch-festival-images.js). /thumb/·640px- 있는 URL만 포함, 나머지는 findFestivalImage API 폴백 */
const FESTIVALS_DIRECT_IMAGES: Record<string, string> = {
  'Rio Carnival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Desfile_Portela_2014_%28906185%29.jpg/640px-Desfile_Portela_2014_%28906185%29.jpg',
  'Oktoberfest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/O%27zapft_is%21_M%C3%BCnchens_5_Jahreszeit_hat_begonnen_-_O%27zapft_is%21_Munich_5_season%2C_the_Oktoberfest_has_begun_%289855483374%29.jpg/640px-O%27zapft_is%21_M%C3%BCnchens_5_Jahreszeit_hat_begonnen_-_O%27zapft_is%21_Munich_5_season%2C_the_Oktoberfest_has_begun_%289855483374%29.jpg',
  'Diwali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/The_Rangoli_of_Lights.jpg/640px-The_Rangoli_of_Lights.jpg',
  'Naadam Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Naadam_Festival_2024_Opening_Ceremony.jpg/640px-Naadam_Festival_2024_Opening_Ceremony.jpg',
  'Songkran': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Songkran_Day_%40_Chiangmai_Wall.jpg/640px-Songkran_Day_%40_Chiangmai_Wall.jpg',
  'Guy Fawkes Night': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Windsor_castle_guyfawkesnight1776.jpg/640px-Windsor_castle_guyfawkesnight1776.jpg',
  'Edinburgh Fringe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Edinburgh_Fringe_037.jpg/640px-Edinburgh_Fringe_037.jpg',
  'Venice Carnival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Venice_Carnival_-_Masked_Lovers_%282010%29.jpg/640px-Venice_Carnival_-_Masked_Lovers_%282010%29.jpg',
  'WOMAD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/WOMAD_Charlton_Park_2008.jpg/640px-WOMAD_Charlton_Park_2008.jpg',
  'Día de los Muertos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Catrina_3.jpg/640px-Catrina_3.jpg',
  'Lantern Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Lantern_Festival_in_Taiwan_at_night_5.jpg/640px-Lantern_Festival_in_Taiwan_at_night_5.jpg',
  'Hanukkah': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Hanukkah_%D7%97%D7%92_%D7%97%D7%A0%D7%95%D7%9B%D7%94.jpg/640px-Hanukkah_%D7%97%D7%92_%D7%97%D7%A0%D7%95%D7%9B%D7%94.jpg',
  'Hanami Cherry Blossom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Castle_Himeji_sakura02.jpg/640px-Castle_Himeji_sakura02.jpg',
  'Pushkar Camel Fair': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/%28A%29_Camel_Pushkar_fair.jpg/640px-%28A%29_Camel_Pushkar_fair.jpg',
  'Glastonbury Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Glastonbury_Tribute.jpg/640px-Glastonbury_Tribute.jpg',
  'Coachella': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Coachella18W1-18_%2842058161311%29.jpg/640px-Coachella18W1-18_%2842058161311%29.jpg',
  'Burning Man': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Temple_du_Burning_Man_2016.jpg/640px-Temple_du_Burning_Man_2016.jpg',
  'Oruro Carnival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Carnaval_de_Oruro_dia_I_%2860%29.JPG/640px-Carnaval_de_Oruro_dia_I_%2860%29.JPG',
  'Carnaval de Oruro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Carnaval_de_Oruro_dia_I_%2860%29.JPG/640px-Carnaval_de_Oruro_dia_I_%2860%29.JPG',
  'Inti Raymi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Inti_Raymi.jpg/640px-Inti_Raymi.jpg',
  'Dakar Rally': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/2011_Dakar_Rally_Mark_Miller_Tucuman.jpg/640px-2011_Dakar_Rally_Mark_Miller_Tucuman.jpg',
  'Tour de France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Tour_de_France%2C_peloton_-_geograph.org.uk_-_4624719.jpg/640px-Tour_de_France%2C_peloton_-_geograph.org.uk_-_4624719.jpg',
  'Carnival of Trinidad': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Orange_Carnival_Masqueraders_in_Trinidad.jpg/640px-Orange_Carnival_Masqueraders_in_Trinidad.jpg',
  'Bocelli Concert': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/The_Arena%2C_Piazza_Bra%2C_Verona_%284809401837%29.jpg/640px-The_Arena%2C_Piazza_Bra%2C_Verona_%284809401837%29.jpg',
  'Shanghai International Film Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Sebastian_Bieniek_Pressekonferenz_10th_Shanghai_International_Film_Festival_2007.jpg/640px-Sebastian_Bieniek_Pressekonferenz_10th_Shanghai_International_Film_Festival_2007.jpg',
  'Royal Edinburgh Military Tattoo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Edinburgh_Tattoo_2010_%284946272332%29.jpg/640px-Edinburgh_Tattoo_2010_%284946272332%29.jpg',
  'Nuremberg Christkindlesmarkt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Christkindlesmarkt_nuernberg.jpg/640px-Christkindlesmarkt_nuernberg.jpg',
  'Kumbh Mela': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Third_Shahi_Snan_in_Hari_Ki_Pauri.jpg/640px-Third_Shahi_Snan_in_Hari_Ki_Pauri.jpg',
  'Tomorrowland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Tomorrowland2016mainstage.jpg/640px-Tomorrowland2016mainstage.jpg',
  'Basel Carnival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Carnival_of_Basel_2015_%28Basler_Fasnacht_2015%29.jpg/640px-Carnival_of_Basel_2015_%28Basler_Fasnacht_2015%29.jpg',
  'Harbin Ice Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Harbin_Ice_Festival.jpg/640px-Harbin_Ice_Festival.jpg',
  'Merrie Monarch Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Hula0081110.jpg/640px-Hula0081110.jpg',
  'Bermuda Day': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Rembrance_Day_Parade_Bermuda.jpg/640px-Rembrance_Day_Parade_Bermuda.jpg',
  'Full Moon Party': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Full_Moon_Party_Ko_Pha_Ngan.jpg/640px-Full_Moon_Party_Ko_Pha_Ngan.jpg',
  'Sahara International Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Veronica_Forque_en_el_S%C3%A1hara_libre.jpg/640px-Veronica_Forque_en_el_S%C3%A1hara_libre.jpg',
  'Nikko Toshogu Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/200801_Nikko_Tosho-gu_Nikko_Japan03s3.jpg/640px-200801_Nikko_Tosho-gu_Nikko_Japan03s3.jpg',
  'Battle of Flowers': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Battle_of_Flowers_2007_Jersey_Optimists_Vikings.jpg/640px-Battle_of_Flowers_2007_Jersey_Optimists_Vikings.jpg',
  'Pride Amsterdam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Amsterdam_Pride_Canal_Parade_2019_05.jpg/640px-Amsterdam_Pride_Canal_Parade_2019_05.jpg',
  'Inti Raymi Cusco': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Peru_-_Cusco_121_-_Inti_Raymi_solstice_festival_%287625299478%29.jpg/640px-Peru_-_Cusco_121_-_Inti_Raymi_solstice_festival_%287625299478%29.jpg',
  'Sydney New Year Fireworks': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/OperaSydney-Fuegos2006-342289398.jpg/640px-OperaSydney-Fuegos2006-342289398.jpg',
  'Bastille Day Paris': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/16/Feu_d%27artifice_du_14_juillet_2017_depuis_le_champ_de_Mars_%C3%A0_Paris%2C_devant_la_Tour_Eiffel%2C_Bastille_day_2017_%2835118978683%29.jpg/640px-Feu_d%27artifice_du_14_juillet_2017_depuis_le_champ_de_Mars_%C3%A0_Paris%2C_devant_la_Tour_Eiffel%2C_Bastille_day_2017_%2835118978683%29.jpg',
  'Sapporo Snow Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/SapporoFestival8.JPG/640px-SapporoFestival8.JPG',
  'Pirarucu Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Arapaima_gigas_at_Beijing_aquarium.JPG/640px-Arapaima_gigas_at_Beijing_aquarium.JPG',
  'Bun Bang Fai Rocket Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/2013_Yasothon_Rocket_Festival_05.jpg/640px-2013_Yasothon_Rocket_Festival_05.jpg',
  'Halloween Salem': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Jack-o%27-Lantern_2003-10-31.jpg/640px-Jack-o%27-Lantern_2003-10-31.jpg',
  'Puri Sand Art Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Sandsculpting%2C_Frankston%2C_Vic_jjron%2C_21.01.2009.jpg/640px-Sandsculpting%2C_Frankston%2C_Vic_jjron%2C_21.01.2009.jpg',
  'Highland Games': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Highland_games_caber_toss_1.JPG/640px-Highland_games_caber_toss_1.JPG',
  'Inti Raymi Bolivia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Inti_Raymi.jpg/640px-Inti_Raymi.jpg',
  'Festival in the Desert': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Audience_at_the_Festival_au_Desert_near_Timbuktu%2C_Mali_2012.jpg/640px-Audience_at_the_Festival_au_Desert_near_Timbuktu%2C_Mali_2012.jpg',
  'Roskilde Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Roskilde_Festival_-_Orange_Stage_-_Bruce_Springsteen.jpg/640px-Roskilde_Festival_-_Orange_Stage_-_Bruce_Springsteen.jpg',
  'Nagasaki Kunchi Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Jaodori_of_Nagasaki_Kunchi.jpg/640px-Jaodori_of_Nagasaki_Kunchi.jpg',
  'Country Music CMA Fest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Trick_Pony2.jpg/640px-Trick_Pony2.jpg',
  'Celtic Connections Glasgow': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Glasgow_Royal_Concert_Hall_%286182751252%29.jpg/640px-Glasgow_Royal_Concert_Hall_%286182751252%29.jpg',
  'FESPAM': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Audience_at_the_Festival_au_Desert_near_Timbuktu%2C_Mali_2012.jpg/640px-Audience_at_the_Festival_au_Desert_near_Timbuktu%2C_Mali_2012.jpg',
  'Fado Festival Lisbon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/VistadeLisboa0341.jpg/640px-VistadeLisboa0341.jpg',
  'Cycle Festival Amsterdam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Interview_at_the_International_Cycling_Film_Festival_2012.jpg/640px-Interview_at_the_International_Cycling_Film_Festival_2012.jpg',
  'Giants of Mechelen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/DragonLumecon.jpg/640px-DragonLumecon.jpg',
  'Keukenhof Tulip Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Keukenhof_340.JPG/640px-Keukenhof_340.JPG',
  'Prague Spring Music Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Prague_Municipal_Smetana_Hall.jpg/640px-Prague_Municipal_Smetana_Hall.jpg',
  'Zurich Street Parade': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Zurich_Street_Parade_2007_001.jpg/640px-Zurich_Street_Parade_2007_001.jpg',
  'Iditarod': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Iditarod_start_line_2020_%28Quintin_Soloviev%29.jpg/640px-Iditarod_start_line_2020_%28Quintin_Soloviev%29.jpg',
  'Feria de Abril': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/19495423168_c324d53029_o_feria_abril_2013.jpg/640px-19495423168_c324d53029_o_feria_abril_2013.jpg',
  'Festival of the Nomads': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Audience_at_the_Festival_au_Desert_near_Timbuktu%2C_Mali_2012.jpg/640px-Audience_at_the_Festival_au_Desert_near_Timbuktu%2C_Mali_2012.jpg',
  'Reindeer Racing Inari': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Jokkmokksmarnad_7.jpg/640px-Jokkmokksmarnad_7.jpg',
  'Buenos Aires Tango Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Tango_dancers_in_Montevideo.png/640px-Tango_dancers_in_Montevideo.png',
  'Vesak Full Moon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/1_Wesak_Day_%28in_Thailand%29_2007.jpg/640px-1_Wesak_Day_%28in_Thailand%29_2007.jpg',
  'Jinja Festival Uganda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Uganda_Jinja_Streetview.JPG/640px-Uganda_Jinja_Streetview.JPG',
  'Istanbul Jazz Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Ahmet_Muvaffak_%22Maffy%22_Falay_%C4%B0stanbul_Caz_Festivali.jpg/640px-Ahmet_Muvaffak_%22Maffy%22_Falay_%C4%B0stanbul_Caz_Festivali.jpg',
  'Rio Loco Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Toulouse_-_vue_du_Vieux_Toulouse_depuis_St_Sernin_06.jpg/640px-Toulouse_-_vue_du_Vieux_Toulouse_depuis_St_Sernin_06.jpg',
  'Vegetarian Festival Phuket': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Steamed_buns%2C_the_Vegetarian_Festival_in_Phuket_13.JPG/640px-Steamed_buns%2C_the_Vegetarian_Festival_in_Phuket_13.JPG',
  'Uluru Song Lines': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Denise_Bowden%2C_Yothu_Yindi_CEO%2C_signing_the_Uluru_statement.jpg/640px-Denise_Bowden%2C_Yothu_Yindi_CEO%2C_signing_the_Uluru_statement.jpg',
  'Esala Perahera': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Perahara2.jpg/640px-Perahara2.jpg',
  'Hogwarts Express Experience': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Glenfinnan_Viaduct_-_2022.jpg/640px-Glenfinnan_Viaduct_-_2022.jpg',
  'Aurora Festival Tromso': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/TIFF_outdoor_cinema_Troms%C3%B8_%2816308203181%29.jpg/640px-TIFF_outdoor_cinema_Troms%C3%B8_%2816308203181%29.jpg',
  'Venice Opera Barge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Venezia_aerial_view.jpg/640px-Venezia_aerial_view.jpg',
  'Rajasthan Desert Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Giant_wheels_at_Pushkar%2C_Rajasthan.jpg/640px-Giant_wheels_at_Pushkar%2C_Rajasthan.jpg',
  'Homowo Festival Ghana': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Homowo_Festival_0101_04.jpg/640px-Homowo_Festival_0101_04.jpg',
  'Mardi Gras New Orleans': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/RexParade2006NewcombPotteryFloatHighsmith.jpg/640px-RexParade2006NewcombPotteryFloatHighsmith.jpg',
  'Notting Hill Carnival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Notting_Hill_Carnival_2018_%283%29.jpg/640px-Notting_Hill_Carnival_2018_%283%29.jpg',
  'Cannes Film Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Patchwork-Cannes-2.jpg/640px-Patchwork-Cannes-2.jpg',
  'Montreux Jazz Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Montreux_Jazz_2M2C_juillet_2023.jpg/640px-Montreux_Jazz_2M2C_juillet_2023.jpg',
  'Sziget Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Sziget_2024_main_stage_day_6.jpg/640px-Sziget_2024_main_stage_day_6.jpg',
  'Secret Solstice Iceland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Slayer_in_Iceland%2C_2018.jpg/640px-Slayer_in_Iceland%2C_2018.jpg',
  'Geilo Ice Music Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Harbin_Ice_Festival.jpg/640px-Harbin_Ice_Festival.jpg',
  'Colombian Coffee Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Coffee_farm_in_Colombia_%284604545436%29.jpg/640px-Coffee_farm_in_Colombia_%284604545436%29.jpg',
  'Elephant Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Surin_round_up.jpg/640px-Surin_round_up.jpg',
  'Holi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/A_Holi_Festival_-_Krishna_Radha_and_Gopis.jpg/640px-A_Holi_Festival_-_Krishna_Radha_and_Gopis.jpg',
  'Kyiv Street Music Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Kiev_Opera.jpg/640px-Kiev_Opera.jpg',
  'Cinema Paradiso Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/The_courtyard_of_Somerset_House%2C_Strand%2C_London_-_geograph.org.uk_-_1601172.jpg/640px-The_courtyard_of_Somerset_House%2C_Strand%2C_London_-_geograph.org.uk_-_1601172.jpg',
  'Día de la Lluvia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Voladores_de_Papantla.jpg/640px-Voladores_de_Papantla.jpg',
  'La Tomatina': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/La_Tomatina_Spain.jpg/640px-La_Tomatina_Spain.jpg',
  'Lake Retba Festival': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/RetbaLakeShore.jpg/640px-RetbaLakeShore.jpg',
  'Maya Winter Solstice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza_3.jpg/640px-Chichen_Itza_3.jpg',
  'Reykjavik Winter Lights': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Hallgrimskirkja-church-during-winter-lights-festival.jpg/640px-Hallgrimskirkja-church-during-winter-lights-festival.jpg',
  'Rose Festival Dades Valley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/El_Kelaa_Mgouna_%28lluket%29.jpg/640px-El_Kelaa_Mgouna_%28lluket%29.jpg',
  'San Fermin Bull Run': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Sanfermines_Vaquillas_Pamplona_08.jpg/640px-Sanfermines_Vaquillas_Pamplona_08.jpg',
  'Sumo Grand Tournament Tokyo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Asashoryu_fight_Jan08.JPG/640px-Asashoryu_fight_Jan08.JPG',
  'Wieliczka Salt Mine Concert': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/%CE%91%CE%BB%CE%B1%CF%84%CF%89%CF%81%CF%85%CF%87%CE%B5%CE%AF%CE%B1_%CE%92%CE%B9%CE%B5%CE%BB%CE%AF%CF%84%CF%83%CE%BA%CE%B1_5021.jpg/640px-%CE%91%CE%BB%CE%B1%CF%84%CF%89%CF%81%CF%85%CF%87%CE%B5%CE%AF%CE%B1_%CE%92%CE%B9%CE%B5%CE%BB%CE%AF%CF%84%CF%83%CE%BA%CE%B1_5021.jpg',
  'Yanagawa Lantern Boat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Yanagawa-kawakudari.jpg/640px-Yanagawa-kawakudari.jpg',
}

/** Golf: foods와 동일 구조. 키 = DB title_en(스키마 schema-v16), 값 = 이미지 URL. 직접 주소를 넣으면 그대로 표시. */
const GOLF_DIRECT_IMAGES: Record<string, string> = {
  'Augusta National Golf Club': 'https://golfdigest.sports.sndimg.com/content/dam/images/golfdigest/fullset/course-photos-for-places-to-play/JD2_9506.jpg.rend.hgtvcom.966.644.suffix/1744420172533.jpeg',
  'Shinnecock Hills Golf Club': 'https://golf.com/wp-content/uploads/2018/06/member.jpg',
  'Baltusrol Golf Club Lower Course': 'https://linksmagazine.com/wp-content/uploads/2023/01/thumbnail_6_18th-Hole2c-Baltusrol_Lower_DJI_0136.webp',
  'Bethpage Black': 'https://golf.com/wp-content/uploads/2025/09/bethpage-black-18th.jpg',
  'Carnoustie Golf Links': 'https://d1ssu070pg2v9i.cloudfront.net/visit-angus/2024/12/11110624/Carnoustie.07.06.2017.24-70.15.3.jpg',
  'Hazeltine National Golf Club': 'https://golfdigest.sports.sndimg.com/content/dam/images/golfdigest/fullset/2019/01/06/5c32710547886f2d34f6ec40_122%20-%20Hazeltine_National_Hole18%20-%20Gary%20Kellner.jpg.rend.hgtvcom.966.644.suffix/1573162567143.jpeg',
  'Kiawah Island Ocean Course': 'https://golfdigest.sports.sndimg.com/content/dam/images/golfdigest/fullset/2022/1/GD0322_TRAVEL_THISVSTHAT_16.jpg.rend.hgtvcom.966.544.suffix/1649165381373.jpeg',
  'Medinah Country Club No.3': 'https://golf-pass.brightspotcdn.com/b2/0c/8c327b923ef8f56fd0d2e57660c7/19213.jpg',
  'Merion Golf Club East Course': 'https://golfdigest.sports.sndimg.com/content/dam/images/golfdigest/fullset/2016/01/14/569794cf577860af35a5a1eb_Merion-East-course-hole-17.jpg.rend.hgtvcom.966.644.suffix/1573391060460.jpeg',
  'Muirfield': 'https://www.theexperiencegolf.com/-/media/experiencegolf/blogs/2025/february/muirfield/720x480.png',
  'Oakmont Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6KT4_KNm-r-A52TmgKFQRifb_gpd9TaS2Ow&s',
  'Olympic Club Lake Course': 'https://www.golfcoursearchitecture.net/images/Into-the-deep_credit-Larry-Lambrecht_950x534.jpg',
  'Pebble Beach Golf Links': 'https://static.wixstatic.com/media/d3436a_b4d8d585d9a347a8b406e76e22d8b7f6~mv2.jpg/v1/fill/w_1000,h_969,al_c,q_85,usm_0.66_1.00_0.01/d3436a_b4d8d585d9a347a8b406e76e22d8b7f6~mv2.jpg',
  'Pinehurst No. 2': 'https://cdn-ilbbpdb.nitrocdn.com/ZPvHxDAnfjiOCTRKZzZlFwdZrjJUwSbC/assets/images/optimized/rev-9705359/www.pinehurst.com/wp-content/uploads/2024/10/GolfCourse-No4.jpg',
  'Quail Hollow Club': 'https://www.golfcoursearchitecture.net/Portals/0/Images/QuailHollow-1_web.jpg',
  'Royal Birkdale Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjuUnQTfvSezYalmP4vY2uDCKzHw7cfBxkBg&s',
  'Royal Liverpool Golf Club': 'https://res.cloudinary.com/pgatour-prod/w_1200,h_628,c_fill,f_auto,q_auto/pgatour/news/editorial/2023/07/17/royal-liverpool/Royal%20Liverpool%20(13).jpg',
  'Royal Lytham & St Annes Golf Club': 'https://www.top100golfcourses.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F03mhssoh%2Fproduction%2Fbeb31ed88bb896a087c18efa000d0b1df20eb7df-1600x1079.jpg&w=3840&q=75',
  'Royal Portrush Golf Club': 'https://eu-assets.simpleview-europe.com/causewaycoast/imageresizer/?image=%2Fdmsimgs%2FF1F0731DD748B8761103E441D831E67F682A8257.jpg&action=ProductDetailImage',
  "Royal St George's Golf Club": 'https://www.royalstgeorges.com/wp-content/uploads/2022/03/IMG_3637-HDR-Edit-2.jpg',
  'Royal Troon Golf Club': 'https://vesselgolf.com/cdn/shop/articles/July-15_24.jpg?v=1739464115&width=1500',
  'St Andrews Old Course': 'https://s7d9.scene7.com/is/image/kohlerhospitality/aad06797_rgb?wid=1440&wid=1440',
  'The Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkyV_Spp7YBRBXstrXV57hkZLii_R9UhT6kA&s',
  'Torrey Pines South Course': 'https://www.torreypines.com/wp-content/uploads/2024/10/Torrey-Pines-Golden-Hour-Aerial.jpg',
  'TPC Sawgrass Stadium Course': 'https://golfdigest.sports.sndimg.com/content/dam/images/golfdigest/fullset/2015/08/04/55c0de53b01eefe207f8ec81_tpc-sawgrass-players-course-17.jpg.rend.hgtvcom.966.644.suffix/1573512224472.jpeg',
  'Turnberry Ailsa Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGQdFWbuh2nHIFulbr4T7zuZ8U9EdzS27vWQ&s',
  'Valhalla Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf4w3hSO8KoKXGCCnFFf2mltgp0t4OT-gMxA&s',
  'Whistling Straits': 'https://evanschillerphotography.com/cdn/shop/files/3rd-Hole_-Whistling-Straits_Straits-Course_DSC08263_1200x1200.jpg?v=1696123816',
  'Winged Foot Golf Club': 'https://breakingeighty.com/wp-content/uploads/2019/01/winged-foot-hole-9.jpg',
  'Aronimink Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFDktu2rRM0siJDhRKNdNKbYeufWnI_Y-Pwg&s',
  'Bay Hill Club & Lodge': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl6ACIlcmk8s7S1xtp_oAlQIqwMXJSoqz4eQ&s',
  'Bellerive Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0JWkDfpZQCSExilK6GTvCWBsRA8Zg8Rf_aQ&s',
  'Celtic Manor Twenty Ten Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQonGPpL9Fw8NSlPJc8ZH8F9C2o5qdYkmWWmw&s',
  'Chambers Bay Golf Course': 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/09/b6/b8/5f/chambers-bay.jpg?w=1200&h=1200&s=1',
  'Colonial Country Club': 'https://thielandteam.com/wp-content/uploads/2024/11/FEATURE-PHOTO-colonial.jpg',
  'Congressional Country Club Blue Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlA7cwEBVN2VyPRRRtNQbJm-I5e2UqMlo1WA&s',
  'East Lake Golf Club': 'https://www.golfcoursearchitecture.net/Portals/0/Images/EastLakeTour-1_web.jpg',
  'Emirates Golf Club Majlis Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReksAzsFZXaZ3HoGfg-5Zxhq4FsT3-i-I4vA&s',
  'Erin Hills Golf Course': 'https://www.golfdigest.com/content/dam/images/golfdigest/fullset/2021/5/Erin-Hills-GC-hole-9-aerial%20hero.jpg',
  'Evian Resort Golf Club': 'https://res.cloudinary.com/evianresort/image/upload/c_fill,f_auto,fl_progressive,g_auto,h_540,q_auto,w_640/prod/var/site/storage/images/4/8/2/3/13284-1-fre-FR/c354a57b865f-Bloc-builder-slider-1-HUB-golf.jpg',
  'Fancourt Links': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2_mMgUGjXRLKEQxK2jC2-G9WxeK4_gh4Sng&s',
  'Firestone Country Club South Course': 'https://golf-pass.brightspotcdn.com/dims4/default/e7f42d0/2147483647/strip/true/crop/419x270+91+0/resize/930x600!/format/webp/quality/90/?url=https%3A%2F%2Fgolf-pass-brightspot.s3.amazonaws.com%2F88%2F22%2F211fb08f2922554792409604cdb3%2F9976.jpg',
  'Gary Player Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfbNCKhuqZGyz0o6AP07Ib7AtR7Y_s5lpynA&s',
  'Glen Abbey Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrVA5oXESUUqcQidwe9wsAPR820ujYa5Bs-Q&s',
  'Gleneagles PGA Centenary Course': 'https://gleneagles.com/wp-content/uploads/sites/7/2020/02/Jacob-3rd-PGA.jpg?w=767&quality=70',
  'Harbour Town Golf Links': 'https://www.seapines.com/sites/default/files/styles/hole_mobile/public/media/images/Hornstein_HT_hole18a.jpg?h=4c16fd0c&itok=09MrKA9m',
  'Jack Nicklaus Golf Club Korea': 'https://nicklausdesign.com/wp-content/uploads/2019/11/2015-10-05_jngck-10hole-612x306.jpg',
  'Kapalua Plantation Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlyO3gTD4-d2UKWCUhEeNoa6wpGrTB9MfJaA&s',
  'Kasumigaseki Country Club East Course': 'https://golf-in-japan.com/sites/default/files/styles/large/public/content/article/IMG_3644_0_0.jpeg.webp?itok=bmvr6-07',
  'Kingston Heath Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLCq_qVfhF4dvPLApt9I4F60OiEIuG6NBQMA&s',
  'Le Golf National': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScqRsl-3AmvteDQ8Cgu_Swtwq5pWBqV8-X_g&s',
  'Liberty National Golf Club': 'https://cdn.sanity.io/images/03mhssoh/production/1841856cbda04d1f1de608eba75e2dc46a35637b-600x345.jpg?rect=0,16,600,314&w=1200&h=627&fit=crop',
  'Marco Simone Golf & Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpY2v-bqrj1o5WAdliCC_bFM_6UeFVm_tduQ&s',
  'Muirfield Village Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBNtmTnMFw_FgLDZduXQi_iA_pz06vakYBog&s',
  'Narashino Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLD5g-0aT3paxM1YM-wOTka_epoO6QRbQARQ&s',
  'Nine Bridges Golf Club': 'https://www.top100golfcourses.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F03mhssoh%2Fproduction%2F6ab4c6489f2369c7b523992a76e9a5e293d5c9c7-1600x900.jpg&w=3840&q=75',
  'Oak Hill Country Club East Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTev6ka6yfYEzf1CiLnnFXVa_FkpOXnz2Vkhg&s',
  'Oakland Hills Country Club South': 'https://www.golfcoursearchitecture.net/images/OaklandSouth-1_web.jpg',
  'Pine Needles Lodge & Golf Club': 'https://golf-pass.brightspotcdn.com/fe/a5/ecd1abdb0dce73478d9de46f1369/91805.jpg',
  'Prairie Dunes Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF71SvHFI9TQVUo3D9sgZj1ckDhKdGvpyWOA&s',
  'Real Club Valderrama': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrpRMpOySIyv5UhNvhoUSHv6Gk_x_LK4-kbQ&s',
  'Riviera Country Club': 'https://res.cloudinary.com/pgatour-prod/pgatour/news/editorial/2022/02/16/rivieraleadimage-847-christrotman.jpg',
  'Royal County Down Golf Club': 'https://cdn.sanity.io/images/03mhssoh/production/9d2b40d6b42042428425d9810336ee04a267600a-1600x900.jpg',
  'Royal Melbourne Golf Club': 'https://www.austadiums.com/stadiums/photos/royal-melbourne-golf-club.jpg',
  'Royal Montreal Golf Club': 'https://res.cloudinary.com/pgatour-prod/pgatour/news/editorial/2024/09/18/five-things-royal-montreal/royal-montreal-clubhouse.jpg',
  'Sheshan International Golf Club': 'https://golfdigest.sports.sndimg.com/content/dam/images/golfdigest/fullset/course-photos-for-places-to-play/5%20Sheshan%20Hole%202.jpg.rend.hgtvcom.966.644.suffix/1719851149272.jpeg',
  'Southern Hills Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRVKOjEuLtGAONGu5IX2153uaueFBf1ySvAg&s',
  'The Belfry Brabazon Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsxyQ6Fo5s8-pt5dEFoHClzKmM4TVHRmVHPg&s',
  'The K Club Palmer Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUtwNX3yZ3JQ40rLPgEU8GwRMfwtt9TSXkGQ&s',
  'TPC Scottsdale Stadium Course': 'https://condoresorts.com/wp-content/uploads/2020/08/TPC_Stadium_1_Cropped.jpg',
  'Waialae Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTg_LtdbBNOYFrkwtm7aHW_JcdJFZExieeVng&s',
  'Abu Dhabi Golf Club': 'https://static.wixstatic.com/media/83f667_0d91756325044c658eeac0eac1d5a710~mv2.jpg/v1/fill/w_1138,h_640,q_90,enc_avif,quality_auto/83f667_0d91756325044c658eeac0eac1d5a710~mv2.jpg',
  'Albany Golf Course, Bahamas': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSgCIiMrqdggp72ca73U68eF8hgTbZ_NFclg&s',
  'Blue Canyon Country Club': 'https://cdn.phuket.net/bucket/directory/size/600/400/2016/07/102283-001.jpg',
  'Crans-sur-Sierre Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkEO7bjBIFG2Y3_Q3jHOGyKXbRfsjs9pgiRw&s',
  'Durban Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXJE7EaZ8bZ_-C0LC0oPT8nS-G-tcS22-w0Q&s',
  'El Camaleón Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1ZWDp2KF7uaFaKb-WK78GFBpVRteJ4yU5iA&s',
  'El Saler Golf Club': 'https://www.top100golfcourses.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F03mhssoh%2Fproduction%2F38fde94e95278c6df4c9346dd5752a52a7edc432-1600x1198.jpg&w=3840&q=75',
  'Golf Club Gut Lärchenhof': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUpbQmI0Vx4d7I0EQTwpVlFXMv-u1bFwAKJA&s',
  'Hirono Golf Club': 'https://golf-in-japan.com/sites/default/files/styles/large/public/content/article/hirono3_0.jpeg.webp?itok=SUcC6Ivy',
  'Kauri Cliffs Golf Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGemU-ohBLUJQgI2AUlBN5IYG3ZSKrzx_zkQ&s',
  'Kingsbarns Golf Links': 'https://images.contentstack.io/v3/assets/blt99dd26276e65134a/bltc62e16b20ba2f2b0/62b61353e218a20f88dda169/Kingsbarns_Hero.jpg?auto=webp&width=1920&disable=upscale&quality=65&fit=bounds',
  'Lahinch Golf Club Old Course': 'https://www.top100golfcourses.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F03mhssoh%2Fproduction%2Fe26ccb1e92d003160150b635dee4b9a031f0fd5e-999x750.jpg&w=3840&q=75',
  'Leopard Creek Country Club': 'https://www.africansky.com/img/countries/sa/golfcourses/leopardcreek/vid.jpg',
  'Loch Lomond Golf Club': 'https://golfdigest.sports.sndimg.com/content/dam/images/golfdigest/fullset/course-photos-for-places-to-play/LochLomond_01AerialBack06_0094.jpg.rend.hgtvcom.966.544.suffix/1718564319243.jpeg',
  'Mid Ocean Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGxfIndCVPXqKSLDQpusCJ_DrWGI6MerTifw&s',
  'Mission Hills Golf Club Shenzhen': 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/3d/7f/52/mission-hills-golf-club.jpg?w=900&h=500&s=1',
  'New South Wales Golf Club': 'https://www.top100golfcourses.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F03mhssoh%2Fproduction%2Ff4b47a2a0486497d70405318dd3e346bcddd7868-1600x900.jpg&w=3840&q=75',
  'PGA Catalunya Stadium Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmOO-t93YbHh834e6MNBAsJPo9xKjm1sKkAQ&s',
  'Port Royal Golf Course': 'https://bermudagolf.bm/wp-content/uploads/2024/10/golf-course-1024x682.jpeg',
  'Portmarnock Golf Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI_cAIUphbX_oFamKyQJFQ_1CE6E_LEAwIag&s',
  'Royal Adelaide Golf Club': 'https://i.nextmedia.com.au/Utils/ImageResizer.ashx?n=https%3A%2F%2Fi.nextmedia.com.au%2FFeatures%2F20240503120724_top100_spotlight_03.jpg&c=0',
  'Royal Dornoch Golf Club': 'https://images.squarespace-cdn.com/content/v1/5675d7b05a5668f86eba496c/1463342634653-KHBTC6QX81JV0JGO98LN/image-asset.jpeg',
  'Spyglass Hill Golf Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTE-LNqUTvnw2jWmZbmlpfDVX5XLEAB9R-Vvw&s',
  'Sunningdale Golf Club Old Course': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9DG_RTuY-50yvt3ohqhXg836_6IwSssF_3A&s',
  'TPC Deere Run': 'https://d3jikqmcru9y0k.cloudfront.net/course/3da47972-ec1a-482f-919f-aa870c658084_Deere-Run-multi-content-box.jpg',
  'TPC Southwind': 'https://www.fedexchampionship.com/media_1fd147ad5e2c81bf4acd77e033737f4bf25b610c6.jpeg?width=750&format=jpeg&optimize=medium',
  'Wentworth Club West Course': 'https://golf-pass.brightspotcdn.com/dims4/default/1b41061/2147483647/strip/true/crop/1200x774+0+13/resize/930x600!/format/webp/quality/90/?url=https%3A%2F%2Fgolf-pass-brightspot.s3.amazonaws.com%2F1b%2F53%2Faaabd55a444b84ca587ce51b63f7%2F26823.jpg',
  'Woo Jeong Hills Country Club': 'https://cdn.sanity.io/images/03mhssoh/production/2842786c9a3a475644b367bf9a14ed0e864ef46e-600x345.jpg?rect=0,16,600,314&w=1200&h=627&fit=crop',
  'Yomiuri Country Club': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLi-9ezt75BSEHDoPp-P6LAfGlYz3MWvT5zw&s',
}

function getGolfDirectUrl(titleEn: string): string | undefined {
  const normalized = titleEn.replace(/\u2018|\u2019|\u201A/g, "'").trim()
  const url = GOLF_DIRECT_IMAGES[titleEn] ?? GOLF_DIRECT_IMAGES[normalized]
  return (url && url.trim()) ? url : undefined
}
/** Fishing: 스팟별 낚시 장면 이미지 (Commons 검증 URL, 640px). 섬/지도 대신 실제 낚시하는 이미지 사용 */
const FISHING_VERIFIED_URLS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Cleaning_salmon_Kenai_River_AJT_Johnsingh.JPG/640px-Cleaning_salmon_Kenai_River_AJT_Johnsingh.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Fishing_in_Snake_River.jpg/640px-Fishing_in_Snake_River.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Salmon_fishing_on_the_River_Spey_-_geograph.org.uk_-_821402.jpg/640px-Salmon_fishing_on_the_River_Spey_-_geograph.org.uk_-_821402.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/People_fishing_at_sunset_on_Deadman%27s_Beach.jpg/640px-People_fishing_at_sunset_on_Deadman%27s_Beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Fishing_Boats_Docked_in_Salmon_Harbor_Marina.jpg/640px-Fishing_Boats_Docked_in_Salmon_Harbor_Marina.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Man_fishing_at_sunset_in_Mehdia_beach.jpg/640px-Man_fishing_at_sunset_in_Mehdia_beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Fishing_for_Sunsets.jpg/640px-Fishing_for_Sunsets.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fly_caught_rainbow_trout_Madison_River_YNP.JPG/640px-Fly_caught_rainbow_trout_Madison_River_YNP.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Salmon_fishing_on_the_River_Tweed_-_geograph.org.uk_-_5565322.jpg/640px-Salmon_fishing_on_the_River_Tweed_-_geograph.org.uk_-_5565322.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Three_men_and_their_rods%2C_Chesil_Beach_-_geograph.org.uk_-_2495235.jpg/640px-Three_men_and_their_rods%2C_Chesil_Beach_-_geograph.org.uk_-_2495235.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Beach_fishing%2C_Stanswood_Bay_-_geograph.org.uk_-_515211.jpg/640px-Beach_fishing%2C_Stanswood_Bay_-_geograph.org.uk_-_515211.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Trout_fishing_on_the_Owyhee_%2833821427268%29.jpg/640px-Trout_fishing_on_the_Owyhee_%2833821427268%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Fly-fishing_on_the_Owyhee_River_in_eastern_Oregon_%2822037025559%29.jpg/640px-Fly-fishing_on_the_Owyhee_River_in_eastern_Oregon_%2822037025559%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Fly_fishing_on_the_Ramapo_River_on_opening_day_of_NY_2013_trout_season.jpg/640px-Fly_fishing_on_the_Ramapo_River_on_opening_day_of_NY_2013_trout_season.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/A_stringer_of_reds_lay_in_the_icy_kenai.jpg/640px-A_stringer_of_reds_lay_in_the_icy_kenai.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/People_fishing_at_sunset_on_Deadman%27s_Beach.jpg/640px-People_fishing_at_sunset_on_Deadman%27s_Beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Fishing_Boats_Docked_in_Salmon_Harbor_Marina.jpg/640px-Fishing_Boats_Docked_in_Salmon_Harbor_Marina.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Salmon_fishing_on_the_River_Tweed_-_geograph.org.uk_-_5565322.jpg/640px-Salmon_fishing_on_the_River_Tweed_-_geograph.org.uk_-_5565322.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ice_fishing_on_Lake_Saimaa.jpg/640px-Ice_fishing_on_Lake_Saimaa.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Rivi%C3%A8re_molua.jpg/640px-Rivi%C3%A8re_molua.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Fishing_boats_at_Uyoma_beach.jpg/640px-Fishing_boats_at_Uyoma_beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Fishing_in_Snake_River.jpg/640px-Fishing_in_Snake_River.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Cormorant_Fisherman_%2849298270808%29.jpg/640px-Cormorant_Fisherman_%2849298270808%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Zane_Grey%27s_Rogue_River_Fishing_Boat_%2832559495125%29.jpg/640px-Zane_Grey%27s_Rogue_River_Fishing_Boat_%2832559495125%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ice_fishing_on_Lake_Saimaa.jpg/640px-Ice_fishing_on_Lake_Saimaa.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Zorinsky_Lake_Ice_fishers.jpg/640px-Zorinsky_Lake_Ice_fishers.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sacandaga_ice_fishing_shelter_%283323477609%29.jpg/640px-Sacandaga_ice_fishing_shelter_%283323477609%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Winter_Fishing_On_Ice_-_panoramio.jpg/640px-Winter_Fishing_On_Ice_-_panoramio.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Ice_fishing_houses_on_Buffalo_Lake_%2849321972657%29.jpg/640px-Ice_fishing_houses_on_Buffalo_Lake_%2849321972657%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/My_Public_Lands_Roadtrip-_Project_Healing_Waters_Event_in_Alaska_%2819380598661%29.jpg/640px-My_Public_Lands_Roadtrip-_Project_Healing_Waters_Event_in_Alaska_%2819380598661%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/A_Lady_Hooks_a_Salmon_on_the_Oykel_River_-_geograph.org.uk_-_155630.jpg/640px-A_Lady_Hooks_a_Salmon_on_the_Oykel_River_-_geograph.org.uk_-_155630.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/W%C4%99dkarze_na_pla%C5%BCy_w_Kucie%2C_Bali%2C_20220827_1705_1207.jpg/640px-W%C4%99dkarze_na_pla%C5%BCy_w_Kucie%2C_Bali%2C_20220827_1705_1207.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Ice_fishing_at_Kenai_Refuge_%2851011115670%29.jpg/640px-Ice_fishing_at_Kenai_Refuge_%2851011115670%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Kids_and_parents_on_the_dock_of_Mittry_Lake_%2854386718076%29.jpg/640px-Kids_and_parents_on_the_dock_of_Mittry_Lake_%2854386718076%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Docked_Fishing_Boats_at_Bukakata_Shoreline%2C_Lake_Victoria..jpg/640px-Docked_Fishing_Boats_at_Bukakata_Shoreline%2C_Lake_Victoria..jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Salmon_Fishing_in_Sognefjord%2C_Norway._%28NBY_441510%29.jpg/640px-Salmon_Fishing_in_Sognefjord%2C_Norway._%28NBY_441510%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Fishing_in_a_kettle_pond_at_Cape_Cod_National_Seashore_%286cd06167-a8ce-4d00-84a2-ca1364d80087%29.jpg/640px-Fishing_in_a_kettle_pond_at_Cape_Cod_National_Seashore_%286cd06167-a8ce-4d00-84a2-ca1364d80087%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Angler_fishing_the_River_Almond_-_geograph.org.uk_-_1373740.jpg/640px-Angler_fishing_the_River_Almond_-_geograph.org.uk_-_1373740.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Angler_on_Mad_River_%2816286618371%29.jpg/640px-Angler_on_Mad_River_%2816286618371%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/WINTER_STEELHEAD_TROUT_FISHING_ON_THE_SKAGIT_RIVER._EACH_YEAR%2C_SOME_250%2C000_SPORTSMEN_FISH_FOR_THESE_TROUT._STEELHEAD..._-_NARA_-_552327.jpg/640px-WINTER_STEELHEAD_TROUT_FISHING_ON_THE_SKAGIT_RIVER._EACH_YEAR%2C_SOME_250%2C000_SPORTSMEN_FISH_FOR_THESE_TROUT._STEELHEAD..._-_NARA_-_552327.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/My_Public_Lands_Roadtrip-_South_Fork_of_the_Snake_River_in_BLM_Idaho_%2818436415649%29.jpg/640px-My_Public_Lands_Roadtrip-_South_Fork_of_the_Snake_River_in_BLM_Idaho_%2818436415649%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Barrie%2C_Ontario%2C_Canada%3B_Fishing_on_Lake_Simcoe_%28I0015926%29.jpg/640px-Barrie%2C_Ontario%2C_Canada%3B_Fishing_on_Lake_Simcoe_%28I0015926%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Eagle_Lake_-_fishing_%28I0015376%29.jpg/640px-Eagle_Lake_-_fishing_%28I0015376%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Amazon_River_ESA387332.jpg/640px-Amazon_River_ESA387332.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Fishing_off_the_boat_dock_near_the_lodges_at_Claytor_Lake_State_Park_%287472992292%29.jpg/640px-Fishing_off_the_boat_dock_near_the_lodges_at_Claytor_Lake_State_Park_%287472992292%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Pelican_Lake_Fishing_7-3-2009_Boat_at_dock.jpg/640px-Pelican_Lake_Fishing_7-3-2009_Boat_at_dock.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Cleaning_salmon_Kenai_River_AJT_Johnsingh.JPG/640px-Cleaning_salmon_Kenai_River_AJT_Johnsingh.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Fishing_in_Snake_River.jpg/640px-Fishing_in_Snake_River.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Salmon_fishing_on_the_River_Spey_-_geograph.org.uk_-_821402.jpg/640px-Salmon_fishing_on_the_River_Spey_-_geograph.org.uk_-_821402.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/People_fishing_at_sunset_on_Deadman%27s_Beach.jpg/640px-People_fishing_at_sunset_on_Deadman%27s_Beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Fishing_Boats_Docked_in_Salmon_Harbor_Marina.jpg/640px-Fishing_Boats_Docked_in_Salmon_Harbor_Marina.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Man_fishing_at_sunset_in_Mehdia_beach.jpg/640px-Man_fishing_at_sunset_in_Mehdia_beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Fishing_for_Sunsets.jpg/640px-Fishing_for_Sunsets.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fly_caught_rainbow_trout_Madison_River_YNP.JPG/640px-Fly_caught_rainbow_trout_Madison_River_YNP.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Salmon_fishing_on_the_River_Tweed_-_geograph.org.uk_-_5565322.jpg/640px-Salmon_fishing_on_the_River_Tweed_-_geograph.org.uk_-_5565322.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Three_men_and_their_rods%2C_Chesil_Beach_-_geograph.org.uk_-_2495235.jpg/640px-Three_men_and_their_rods%2C_Chesil_Beach_-_geograph.org.uk_-_2495235.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Beach_fishing%2C_Stanswood_Bay_-_geograph.org.uk_-_515211.jpg/640px-Beach_fishing%2C_Stanswood_Bay_-_geograph.org.uk_-_515211.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Trout_fishing_on_the_Owyhee_%2833821427268%29.jpg/640px-Trout_fishing_on_the_Owyhee_%2833821427268%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Fly-fishing_on_the_Owyhee_River_in_eastern_Oregon_%2822037025559%29.jpg/640px-Fly-fishing_on_the_Owyhee_River_in_eastern_Oregon_%2822037025559%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Fly_fishing_on_the_Ramapo_River_on_opening_day_of_NY_2013_trout_season.jpg/640px-Fly_fishing_on_the_Ramapo_River_on_opening_day_of_NY_2013_trout_season.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/A_stringer_of_reds_lay_in_the_icy_kenai.jpg/640px-A_stringer_of_reds_lay_in_the_icy_kenai.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Fishing_in_Banff_%287589%29.jpg/640px-Fishing_in_Banff_%287589%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Summer_fly_fishing_on_the_River_Avon_-_geograph.org.uk_-_70170.jpg/640px-Summer_fly_fishing_on_the_River_Avon_-_geograph.org.uk_-_70170.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/River_Tweed_Salmon_Fishing_Museum.jpg/640px-River_Tweed_Salmon_Fishing_Museum.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Rivi%C3%A8re_molua.jpg/640px-Rivi%C3%A8re_molua.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Fishing_boats_at_Uyoma_beach.jpg/640px-Fishing_boats_at_Uyoma_beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/140829_Goko_of_Shiretoko_Goko_Lakes_Hokkaido_Japan03ss5.jpg/640px-140829_Goko_of_Shiretoko_Goko_Lakes_Hokkaido_Japan03ss5.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Cormorant_Fisherman_%2849298270808%29.jpg/640px-Cormorant_Fisherman_%2849298270808%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Zane_Grey%27s_Rogue_River_Fishing_Boat_%2832559495125%29.jpg/640px-Zane_Grey%27s_Rogue_River_Fishing_Boat_%2832559495125%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ice_fishing_on_Lake_Saimaa.jpg/640px-Ice_fishing_on_Lake_Saimaa.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Zorinsky_Lake_Ice_fishers.jpg/640px-Zorinsky_Lake_Ice_fishers.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sacandaga_ice_fishing_shelter_%283323477609%29.jpg/640px-Sacandaga_ice_fishing_shelter_%283323477609%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Winter_Fishing_On_Ice_-_panoramio.jpg/640px-Winter_Fishing_On_Ice_-_panoramio.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Ice_fishing_houses_on_Buffalo_Lake_%2849321972657%29.jpg/640px-Ice_fishing_houses_on_Buffalo_Lake_%2849321972657%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/My_Public_Lands_Roadtrip-_Project_Healing_Waters_Event_in_Alaska_%2819380598661%29.jpg/640px-My_Public_Lands_Roadtrip-_Project_Healing_Waters_Event_in_Alaska_%2819380598661%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/A_Lady_Hooks_a_Salmon_on_the_Oykel_River_-_geograph.org.uk_-_155630.jpg/640px-A_Lady_Hooks_a_Salmon_on_the_Oykel_River_-_geograph.org.uk_-_155630.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/W%C4%99dkarze_na_pla%C5%BCy_w_Kucie%2C_Bali%2C_20220827_1705_1207.jpg/640px-W%C4%99dkarze_na_pla%C5%BCy_w_Kucie%2C_Bali%2C_20220827_1705_1207.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Ice_fishing_at_Kenai_Refuge_%2851011115670%29.jpg/640px-Ice_fishing_at_Kenai_Refuge_%2851011115670%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Kids_and_parents_on_the_dock_of_Mittry_Lake_%2854386718076%29.jpg/640px-Kids_and_parents_on_the_dock_of_Mittry_Lake_%2854386718076%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Docked_Fishing_Boats_at_Bukakata_Shoreline%2C_Lake_Victoria..jpg/640px-Docked_Fishing_Boats_at_Bukakata_Shoreline%2C_Lake_Victoria..jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Ridge_Pool%2C_Ballina%2C_Co._Mayo_%2817343917975%29.jpg/640px-Ridge_Pool%2C_Ballina%2C_Co._Mayo_%2817343917975%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Derryclare_Lough%2C_Connemara%2C_Ireland.jpg/640px-Derryclare_Lough%2C_Connemara%2C_Ireland.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Angler_fishing_the_River_Almond_-_geograph.org.uk_-_1373740.jpg/640px-Angler_fishing_the_River_Almond_-_geograph.org.uk_-_1373740.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Angler_on_Mad_River_%2816286618371%29.jpg/640px-Angler_on_Mad_River_%2816286618371%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/WINTER_STEELHEAD_TROUT_FISHING_ON_THE_SKAGIT_RIVER._EACH_YEAR%2C_SOME_250%2C000_SPORTSMEN_FISH_FOR_THESE_TROUT._STEELHEAD..._-_NARA_-_552327.jpg/640px-WINTER_STEELHEAD_TROUT_FISHING_ON_THE_SKAGIT_RIVER._EACH_YEAR%2C_SOME_250%2C000_SPORTSMEN_FISH_FOR_THESE_TROUT._STEELHEAD..._-_NARA_-_552327.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/My_Public_Lands_Roadtrip-_South_Fork_of_the_Snake_River_in_BLM_Idaho_%2818436415649%29.jpg/640px-My_Public_Lands_Roadtrip-_South_Fork_of_the_Snake_River_in_BLM_Idaho_%2818436415649%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Barrie%2C_Ontario%2C_Canada%3B_Fishing_on_Lake_Simcoe_%28I0015926%29.jpg/640px-Barrie%2C_Ontario%2C_Canada%3B_Fishing_on_Lake_Simcoe_%28I0015926%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Eagle_Lake_-_fishing_%28I0015376%29.jpg/640px-Eagle_Lake_-_fishing_%28I0015376%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Fishing_from_boat_dock%2C_Jubilee_Lake_Umatila_National_Forest_%2836294297896%29.jpg/640px-Fishing_from_boat_dock%2C_Jubilee_Lake_Umatila_National_Forest_%2836294297896%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Fishing_off_the_boat_dock_near_the_lodges_at_Claytor_Lake_State_Park_%287472992292%29.jpg/640px-Fishing_off_the_boat_dock_near_the_lodges_at_Claytor_Lake_State_Park_%287472992292%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Cape_of_Good_Hope_from_Cape_Point.jpg/640px-Cape_of_Good_Hope_from_Cape_Point.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Walvis_Bay_aerial.jpg/640px-Walvis_Bay_aerial.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Fishing_in_Snake_River.jpg/640px-Fishing_in_Snake_River.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Salmon_fishing_on_the_River_Spey_-_geograph.org.uk_-_821402.jpg/640px-Salmon_fishing_on_the_River_Spey_-_geograph.org.uk_-_821402.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/People_fishing_at_sunset_on_Deadman%27s_Beach.jpg/640px-People_fishing_at_sunset_on_Deadman%27s_Beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Fishing_Boats_Docked_in_Salmon_Harbor_Marina.jpg/640px-Fishing_Boats_Docked_in_Salmon_Harbor_Marina.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Man_fishing_at_sunset_in_Mehdia_beach.jpg/640px-Man_fishing_at_sunset_in_Mehdia_beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Fishing_for_Sunsets.jpg/640px-Fishing_for_Sunsets.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fly_caught_rainbow_trout_Madison_River_YNP.JPG/640px-Fly_caught_rainbow_trout_Madison_River_YNP.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Salmon_fishing_on_the_River_Tweed_-_geograph.org.uk_-_5565322.jpg/640px-Salmon_fishing_on_the_River_Tweed_-_geograph.org.uk_-_5565322.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Three_men_and_their_rods%2C_Chesil_Beach_-_geograph.org.uk_-_2495235.jpg/640px-Three_men_and_their_rods%2C_Chesil_Beach_-_geograph.org.uk_-_2495235.jpg',
] as const

const FISHING_TITLE_EN_LIST = [
  'Kenai River', 'Skeena River', 'Grand Cascapedia River', 'Florida Keys', 'Kona, Hawaii', 'Andros Island, Bahamas',
  'Jardines de la Reina, Cuba', 'Pinas Bay, Panama', 'Iztapa, Guatemala', 'Rio Grande, Tierra del Fuego', 'Palena River, Chile',
  'Cinaruco River, Venezuela', 'Inirida River, Colombia', 'Alta River, Norway', 'Canary Islands, Spain', 'Azores, Portugal',
  'Kola Peninsula, Russia', 'Ponoi River, Russia', 'Congo River, DRC', 'Cosmoledo Atoll, Seychelles', 'Kamchatka Peninsula, Russia',
  'Yarlung Tsangpo, Tibet', 'Eg-Uur River, Mongolia', 'Chiang Khong, Thailand', 'Mamberamo River, Papua', 'Madison River, Montana',
  'Bighorn River, Montana', 'Deschutes River, Oregon', 'Green River, Wyoming', 'San Juan River, New Mexico', 'Naknek River, Alaska',
  'Snake River, Idaho', 'Bow River, Alberta', 'Miramichi River, New Brunswick', 'Nipigon River, Ontario', 'Boca Grande Pass, Florida',
  'Cape Cod, Massachusetts', 'Everglades, Florida', 'Cabo San Lucas, Mexico', 'Cozumel, Mexico', 'Puerto Vallarta, Mexico',
  'Corrientes Province, Argentina', 'Amazon River, Brazil', 'Pantanal, Brazil', 'Guanacaste, Costa Rica', 'Madre de Dios River, Peru',
  'Parana River, Argentina', 'Lofoten Islands, Norway', 'Ellidaár River, Iceland', 'Tungnaá River, Iceland', 'River Tay, Scotland',
  'River Spey, Scotland', 'River Tweed, Scotland', 'Ebro River, Spain', 'Ramganga River, India', 'Cauvery River, India', 'Hokkaido, Japan',
  'Sarawak, Borneo, Malaysia', 'Zambezi River, Zimbabwe', 'Lake Tanganyika, Tanzania', 'Bazaruto Archipelago, Mozambique', 'Watamu, Kenya',
  'Zanzibar Channel, Tanzania', 'Malindi, Kenya', 'Lake Baikal, Russia', 'Amur River, Russia', 'Shiretoko Peninsula, Japan',
  'Yasawa Islands, Fiji', 'Palau, Micronesia', 'Mauritius', 'Maldives', 'Musandam Fjords, Oman', 'Solomon Islands', 'Papua New Guinea',
  'Lake Erie, USA', 'Boundary Waters, Minnesota', 'Chesapeake Bay, Maryland', 'Louisiana Bayou, USA', 'Bocas del Toro, Panama',
  'Cape Verde Islands', 'River Moy, Ireland', 'Connemara, Ireland', 'Lake Inari, Finland', 'Lake Vänern, Sweden', 'Bug River, Poland',
  'Po River, Italy', 'Volga River Delta, Russia', 'Cape Point, South Africa', 'Lake Victoria, Kenya', 'Lake Malawi, Malawi', 'Niassa Reserve, Mozambique',
  'Walvis Bay, Namibia', 'Ningaloo Reef, Australia', 'Andaman Islands, India', 'Kerala Backwaters, India', 'Mekong Delta, Vietnam', 'Lake Biwa, Japan',
  'Tonga, South Pacific', 'Christmas Island, Kiribati', 'New Caledonia',
] as const

/** Fishing: 100개 스팟 전부 스팟별 직접 URL (Islands와 동일 방식). 폴백/해시 없음 */
const FISHING_DIRECT_IMAGES: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  FISHING_TITLE_EN_LIST.forEach((t, i) => { out[t] = FISHING_VERIFIED_URLS[i] })
  return out
})()
/** Surfing: Fishing과 동일하게 스팟별 직접 URL만 사용. 모든 URL은 Islands 카테고리에서 사용 중인 검증된 Commons URL */
const SURFING_TITLE_EN_LIST = [
  'Banzai Pipeline', 'Teahupoo', 'Jaws (Pe\'ahi)', 'Nazare', 'Mavericks', 'Bells Beach', 'Snapper Rocks', 'Uluwatu', 'Mundaka', 'Cloudbreak',
  'Supertubes', 'Cape Town Crayfish Factory', 'Honolua Bay', 'Playa Hermosa', 'Pichilemu', 'Padang Padang', 'G-Land (Grajagan)', 'Shipstern Bluff', 'Raglan', 'Hossegor',
  'Hikkaduwa', 'Peniche', 'Anchor Point', 'Puerto Escondido', 'Popoyo', 'Desert Point', 'Tofinho', 'Laniakea Beach', 'Tavarua Island', 'Itacaré',
  'Mar del Plata', 'Dungeons', 'El Gorrión', 'Kovalam', 'Santa Catalina', 'Todos Santos Island', 'El Hierro', 'Steamer Lane', 'Sunset Beach', 'The Box',
  'Barra de la Cruz', 'Da Nang', 'Nias', 'Blacks Beach', 'Kaldbakur Iceland', 'Skeleton Bay', 'Anakao', 'Easter Island', 'Pulau Mantanani', 'Antarctica Surfing',
  'Busua', 'Saquarema', 'Big Wave Bay', 'Nai Harn Beach', 'Chiba Tsurigasaki', 'Yangyang', 'Krui Left', 'Cloud 9', 'Pasta Point', 'La Gravière',
  'Saint-Leu', 'Lobos Point', 'Galapagos Surf', 'Scorpion Bay', 'Kirra Point', 'Lanzarote Chicama', 'Chicama', 'Pacasmayo', 'Palau Surf', 'Rarotonga',
  'Boulders Samoa', 'Hava i Nui', 'Oman Surf', 'Hilton Beach', 'Ain El Turck', 'Tabarka', 'Gwadar', 'Strandhill', 'Unstad Arctic Surf', 'Gardar',
  'Tofino', 'Thurso East', 'Mullaghmore', 'Montañita', 'El Valle', 'Cabo Polonio', 'Nouakchott', 'N\'Gor Island', 'Ponta Preta', 'Elands Bay',
  'Donkey Bay', 'Assinie', 'Libreville Surf',
  'Tamarindo', 'Lower Trestles', 'Ericeira', 'Byron Bay', 'Arugam Bay', 'Biarritz', 'Bundoran',
] as const

const SURFING_VERIFIED_URLS = [
  ISLANDS_DIRECT_IMAGES['Oahu, Hawaii']!,
  ISLANDS_DIRECT_IMAGES['Tahiti, French Polynesia']!,
  ISLANDS_DIRECT_IMAGES['Maui, Hawaii']!,
  ISLANDS_DIRECT_IMAGES['Madeira, Portugal']!,
  ISLANDS_DIRECT_IMAGES['Saba, Dutch Caribbean']!,
  ISLANDS_DIRECT_IMAGES['Tasmania, Australia']!,
  ISLANDS_DIRECT_IMAGES['Fraser Island (K gari), Australia']!,
  ISLANDS_DIRECT_IMAGES['Komodo Island, Indonesia']!,
  ISLANDS_DIRECT_IMAGES['Mallorca, Spain']!,
  ISLANDS_DIRECT_IMAGES['Yasawa Islands, Fiji']!,
  ISLANDS_DIRECT_IMAGES['Christmas Island']!,
  ISLANDS_DIRECT_IMAGES['Sint Maarten/Saint Martin']!,
  ISLANDS_DIRECT_IMAGES['Big Island, Hawaii']!,
  ISLANDS_DIRECT_IMAGES['Cocos Island, Costa Rica']!,
  ISLANDS_DIRECT_IMAGES['Lord Howe Island, Australia']!,
  ISLANDS_DIRECT_IMAGES['Palawan, Philippines']!,
  ISLANDS_DIRECT_IMAGES['Palawan, Philippines']!,
  ISLANDS_DIRECT_IMAGES['Komodo Island, Indonesia']!,
  ISLANDS_DIRECT_IMAGES['Tasmania, Australia']!,
  ISLANDS_DIRECT_IMAGES['Niue Island']!,
  ISLANDS_DIRECT_IMAGES['Corsica, France']!,
  ISLANDS_DIRECT_IMAGES['Malaita, Solomon Islands']!,
  ISLANDS_DIRECT_IMAGES['Madeira, Portugal']!,
  ISLANDS_DIRECT_IMAGES['Cocos Island, Costa Rica']!,
  ISLANDS_DIRECT_IMAGES['San Andres, Colombia']!,
  ISLANDS_DIRECT_IMAGES['Komodo Island, Indonesia']!,
  ISLANDS_DIRECT_IMAGES['Mayotte, France']!,
  ISLANDS_DIRECT_IMAGES['Big Island, Hawaii']!,
  ISLANDS_DIRECT_IMAGES['Yasawa Islands, Fiji']!,
  ISLANDS_DIRECT_IMAGES['Ilha Grande, Brazil']!,
  ISLANDS_DIRECT_IMAGES['Fernando de Noronha, Brazil']!,
  ISLANDS_DIRECT_IMAGES['Sint Maarten/Saint Martin']!,
  ISLANDS_DIRECT_IMAGES['Sardinia, Italy']!,
  ISLANDS_DIRECT_IMAGES['Palawan, Philippines']!,
  ISLANDS_DIRECT_IMAGES['Cocos Island, Costa Rica']!,
  ISLANDS_DIRECT_IMAGES['Lanzarote, Canary Islands']!,
  ISLANDS_DIRECT_IMAGES['El Hierro, Canary Islands']!,
  ISLANDS_DIRECT_IMAGES['Sardinia, Italy']!,
  ISLANDS_DIRECT_IMAGES['Big Island, Hawaii']!,
  ISLANDS_DIRECT_IMAGES['Fraser Island (K gari), Australia']!,
  ISLANDS_DIRECT_IMAGES['Tasmania, Australia']!,
  ISLANDS_DIRECT_IMAGES['San Andres, Colombia']!,
  ISLANDS_DIRECT_IMAGES['Upolu, Samoa']!,
  ISLANDS_DIRECT_IMAGES['Palawan, Philippines']!,
  ISLANDS_DIRECT_IMAGES['Komodo Island, Indonesia']!,
  ISLANDS_DIRECT_IMAGES['Saba, Dutch Caribbean']!,
  ISLANDS_DIRECT_IMAGES['Iceland (island nation)']!,
  ISLANDS_DIRECT_IMAGES['Ascension Island']!,
  ISLANDS_DIRECT_IMAGES['Nosy Be, Madagascar']!,
  ISLANDS_DIRECT_IMAGES['Niue Island']!,
  ISLANDS_DIRECT_IMAGES['Rock Islands, Palau']!,
  ISLANDS_DIRECT_IMAGES['South Georgia']!,
  ISLANDS_DIRECT_IMAGES['Bermuda']!,
  ISLANDS_DIRECT_IMAGES['Ilha Grande, Brazil']!,
  ISLANDS_DIRECT_IMAGES['Providenciales, Turks and Caicos']!,
  ISLANDS_DIRECT_IMAGES['Palawan, Philippines']!,
  ISLANDS_DIRECT_IMAGES['Palawan, Philippines']!,
  ISLANDS_DIRECT_IMAGES['Kauai, Hawaii']!,
  ISLANDS_DIRECT_IMAGES['Palawan, Philippines']!,
  ISLANDS_DIRECT_IMAGES['Komodo Island, Indonesia']!,
  ISLANDS_DIRECT_IMAGES['Palawan, Philippines']!,
  ISLANDS_DIRECT_IMAGES['Baa Atoll, Maldives']!,
  ISLANDS_DIRECT_IMAGES['Corsica, France']!,
  ISLANDS_DIRECT_IMAGES['Reunion Island, France']!,
  ISLANDS_DIRECT_IMAGES['Lord Howe Island, Australia']!,
  ISLANDS_DIRECT_IMAGES['Santa Cruz, Galapagos']!,
  ISLANDS_DIRECT_IMAGES['Cocos Island, Costa Rica']!,
  ISLANDS_DIRECT_IMAGES['Fraser Island (K gari), Australia']!,
  ISLANDS_DIRECT_IMAGES['Lanzarote, Canary Islands']!,
  ISLANDS_DIRECT_IMAGES['Lanzarote, Canary Islands']!,
  ISLANDS_DIRECT_IMAGES['Lord Howe Island, Australia']!,
  ISLANDS_DIRECT_IMAGES['Lord Howe Island, Australia']!,
  ISLANDS_DIRECT_IMAGES['Rock Islands, Palau']!,
  ISLANDS_DIRECT_IMAGES['Aitutaki, Cook Islands']!,
  ISLANDS_DIRECT_IMAGES['Upolu, Samoa']!,
  ISLANDS_DIRECT_IMAGES['Bora Bora, French Polynesia']!,
  ISLANDS_DIRECT_IMAGES['Cyprus']!,
  ISLANDS_DIRECT_IMAGES['Cyprus']!,
  ISLANDS_DIRECT_IMAGES['Sardinia, Italy']!,
  ISLANDS_DIRECT_IMAGES['Mallorca, Spain']!,
  ISLANDS_DIRECT_IMAGES['Tristan da Cunha']!,
  ISLANDS_DIRECT_IMAGES['Faroe Islands, Denmark']!,
  ISLANDS_DIRECT_IMAGES['Iceland (island nation)']!,
  ISLANDS_DIRECT_IMAGES['Tasmania, Australia']!,
  ISLANDS_DIRECT_IMAGES['Corfu, Greece']!,
  ISLANDS_DIRECT_IMAGES['Faroe Islands, Denmark']!,
  ISLANDS_DIRECT_IMAGES['Fernando de Noronha, Brazil']!,
  ISLANDS_DIRECT_IMAGES['San Andres, Colombia']!,
  ISLANDS_DIRECT_IMAGES['Falkland Islands']!,
  ISLANDS_DIRECT_IMAGES['Ascension Island']!,
  ISLANDS_DIRECT_IMAGES['Bermuda']!,
  ISLANDS_DIRECT_IMAGES['Sao Miguel, Azores']!,
  ISLANDS_DIRECT_IMAGES['Christmas Island']!,
  ISLANDS_DIRECT_IMAGES['Sint Maarten/Saint Martin']!,
  ISLANDS_DIRECT_IMAGES['Ascension Island']!,
  ISLANDS_DIRECT_IMAGES['Guadeloupe, France']!,
  ISLANDS_DIRECT_IMAGES['Ilha Grande, Brazil']!,
  ISLANDS_DIRECT_IMAGES['Cocos Island, Costa Rica']!,
  ISLANDS_DIRECT_IMAGES['Sardinia, Italy']!,
  ISLANDS_DIRECT_IMAGES['Madeira, Portugal']!,
  ISLANDS_DIRECT_IMAGES['Fraser Island (K gari), Australia']!,
  ISLANDS_DIRECT_IMAGES['Malaita, Solomon Islands']!,
  ISLANDS_DIRECT_IMAGES['Corsica, France']!,
  ISLANDS_DIRECT_IMAGES['Ibiza, Spain']!,
] as const

const SURFING_DIRECT_IMAGES: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  SURFING_TITLE_EN_LIST.forEach((t, i) => { out[t] = SURFING_VERIFIED_URLS[i] })
  // 직접 이미지 오버라이드 (사용자 지정 URL)
  out['Antarctica Surfing'] = 'https://external-preview.redd.it/surfing-antarctica-v0-aFjAKt551p4UQkMSIpIBoDB-NQ4ub4A1lAzUpDevmnA.jpg?auto=webp&s=0bb4a281c6bee23685ba476d3f0debf477ce10d9'
  out['Banzai Pipeline'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuPvQd7REu6EXGZVAyFngMFQbSM5aizo_2xA&s'
  out['Chicama'] = 'https://awavetravel.com/wp-content/uploads/2020/12/Chicama-Surf-3.jpg'
  out['Desert Point'] = 'https://substackcdn.com/image/fetch/$s_!ZHp2!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F4e29dd57-0253-4796-adfd-9a4b7421d3db_1000x669.jpeg'
  out['Gardar'] = 'https://www.planetallsports.com/wp-content/uploads/2023/09/wingfoiler-am-gardasee-mit-oragem-wing-surf-wellen-768x512.webp'
  out['Jaws (Pe\'ahi)'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSR0-aimZHKRxu_AdFjIgCHIINlA9g-XAx6sg&s'
  out['Kaldbakur Iceland'] = 'https://www.stuckiniceland.com/wp-content/uploads/2018/01/0-5.jpg'
  out['Nazare'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOhLLqDAnL4LjeZ57OcRfI11g9ptGmBZaWRQ&s'
  out['Shipstern Bluff'] = 'https://cdn.sanity.io/images/f1hjpcr4/production/b9eba62295ac1dbda077b011330a1f54ebfae8a7-700x538.jpg?rect=0,144,700,394&w=640&h=360&q=75&auto=format'
  out['Skeleton Bay'] = 'https://surfholidays.com/wp-content/uploads/2025/06/2017-11-02-SB1.jpg'
  out['Teahupoo'] = 'https://img.redbull.com/images/c_crop,x_471,y_0,h_1365,w_1092/c_fill,w_800,h_889/q_auto:low,f_auto/redbullcom/2023/5/17/d0ehfgn8fsna6woz4eod/kai-lenny-teahupoo-2023'
  out['Anakao'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQh8Hde6DI93Jap8OOfPmet-FUOBOt7QKhtRw&s'
  out['Boulders Samoa'] = 'https://cdn.sanity.io/images/we0tdimr/production/0ef781b922b063b88c33722c96f274acc7f2fbb3-3840x2561.jpg?rect=0,201,3840,2160&w=1920&h=1080&q=70&auto=format'
  out['Cape Town Crayfish Factory'] = 'https://cdn.sanity.io/images/we0tdimr/production/3b0d29b9fd611c605a6df6369bb35f85c999a49a-1920x1294.jpg'
  out['Cloudbreak'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhgCKBwTBe8Mqt_-VzplOK0In2nuWjHDxnKg&s'
  out['Donkey Bay'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu89na_KI5ZeWGq9Xj2EHw3EIyxu1xhbKzbA&s'
  out['Dungeons'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpgRxfEeyyYPLa0YYqcz19mUVvZzRjCy8gPw&s'
  out['Easter Island'] = 'https://i.cdn-surfline.com/video/2017/thumbs/071317-fantasy-island-promo.jpg'
  out['G-Land (Grajagan)'] = 'https://cdn.sanity.io/images/we0tdimr/production/b2113b27cd403a1907c5871c562fa467b4e94ff4-3840x2561.jpg?rect=0,201,3840,2160&w=1920&h=1080&q=70&auto=format'
  out['Gwadar'] = 'https://i.dawn.com/primary/2020/08/5f43777c5163e.jpg'
  out['Hava i Nui'] = 'https://cdn.sanity.io/images/we0tdimr/production/82bef6711d0f8810de05ac0a8380b13cd2611f8f-2506x1603.jpg?rect=0,97,2506,1410&w=1920&h=1080&q=70&auto=format'
  out['Libreville Surf'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6t1gixsKiVirhb61JcqDLFOp5OP-YWK434w&s'
  out['Lower Trestles'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpQVHorlLHJ6aSJ6I8QNZxnu6np3UV_Y0foQ&s'
  out['Mavericks'] = 'https://hips.hearstapps.com/hmg-prod/images/ata010125mavericks-img001-673e19e0312fa.jpg'
  out['Mullaghmore'] = 'https://img.redbull.com/images/c_crop,x_1464,y_0,h_3401,w_2721/c_fill,w_800,h_889/q_auto:low,f_auto/redbullcom/2019/04/26/597873d6-fa85-4d7f-8b6d-b46cd6becc7b/ollie-oflaherty-mullaghmore-ireland-2019'
  out['Mundaka'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGOkAzJGDjaNuz7sO4iSWX_42S17ZOov_uNg&s'
  out['Nias'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROdMyGYAteOYqZvSLr4prY3jl_bafpbEWZIw&s'
  out['Nouakchott'] = 'https://cdn.sanity.io/images/we0tdimr/production/7f18ad53cee85b6de4abd7a5d73a6d6be4bc8df6-3840x2064.jpg?rect=86,0,3669,2064&w=1920&h=1080&q=70&auto=format'
  out['Pasta Point'] = 'https://www.stokedfortravel.com/wp-content/uploads/2022/03/pasta-point-maldives-surf-trip-cinnamon-dhonveli-1920x960.jpg'
  out['Puerto Escondido'] = 'https://www.savethewaves.org/wp-content/uploads/2025/03/PuertoEscondidoWSR_Paco-Calleja.jpg'
  out['Saint-Leu'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4rZ9FES3jpolng45RnjQ02JRNuArwxW9Fow&s'
  out['Sunset Beach'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTiEndYB4p-Cy3K_ESLnIl2hQH7FlqBErqlg&s'
  out['The Box'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp1cVGzQIocVpe6u4sf5Qrg9Cvf-4Ds1-1Hw&s'
  out['Todos Santos Island'] = 'https://cdn.sanity.io/images/f1hjpcr4/production/3879ce7d7e14e399811a58c71c760e1c48ba1868-900x506.jpg?w=1200&h=675&fit=crop&crop=entropy&q=60'
  out['Unstad Arctic Surf'] = 'https://cdn.prod.website-files.com/6836d1631f010c335c4421a0/684016f07acc9bcfe122a181_placeholder-portrait.png'
  out['Ain El Turck'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-GEKq1DMxTA6vR4TZ9r_tkBOAjdysK_lu_g&s'
  out['Anchor Point'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg3X1NAS9wjsCuZ3rEAvxzJ4ddEzluJH_1fA&s'
  out['Arugam Bay'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWeB0Ao7f_plgz-KEBBnykovHUvVP69D80Wg&s'
  out['Assinie'] = 'https://www.surf-forecast.com/system/images/7599/large/Assinie_1.jpg?1766427571'
  out['Barra de la Cruz'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrawMG87hqeWpDQRVsOTNjijGrQHa_8apziQ&s'
  out['Bells Beach'] = 'https://www.surfer.com/.image/w_1200,h_630,g_auto,c_fill/MjowMDAwMDAwMDAwMTI1NjEx/gettyimages-1144108881.jpg'
  out['Biarritz'] = 'https://www.ultimatefrance.com/wp-content/uploads/2018/01/after-surf-marbella-biarritz.jpg'
  out['Big Wave Bay'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREjFK3Ey-nTk0QYmZMNZhiHd-ArJSIdG9iyQ&s'
  out['Blacks Beach'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2opZ5_-7tqDB_cfSqvoQFPXjaoVaWnN4WBg&s'
  out['Bundoran'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSowfyF4Qxacs4BxE6lClhP2jxKug-YbRHVIg&s'
  out['Busua'] = 'https://images.ft.com/v3/image/raw/https%3A%2F%2Fd1e00ek4ebabms.cloudfront.net%2Fproduction%2Fee7cfc9c-c261-4ef2-9bbf-55a1b4ca79b8.jpg?source=next-article&fit=scale-down&quality=highest&width=700&dpr=1'
  out['Byron Bay'] = 'https://www.stokedfortravel.com/wp-content/uploads/2018/12/byron-bay-surf-spots-guide-australia-pass-wreck-tallows-1920x1014.jpg'
  out['Cabo Polonio'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaz5Z28vyczku-OmJSq2FV8VctADRArOY7MQ&s'
  out['Chiba Tsurigasaki'] = 'https://visitgreatertokyoarea.org/spots/chiba6-2.jpg'
  out['Cloud 9'] = 'https://www.jonnymelon.com/wp-content/uploads/2018/10/cloud-9.jpg'
  out['Da Nang'] = 'https://cdn.sanity.io/images/we0tdimr/production/448664d4485b1985e3aab0c1c3c9e12cf4b55f4f-3840x2160.jpg?w=1920&h=1080&q=70&auto=format'
  out['El Gorrión'] = 'https://cdn.sanity.io/images/we0tdimr/production/73cb928f0a534d0ad1284e2f6edc8bde46b52c9f-3840x2623.jpg?w=1920&h=1080&fm=jpg&q=65'
  out['El Hierro'] = 'https://www.visitfuerteventura.com/sites/default/files/styles/masonry_image/public/resources/resource_image/el_hierro-fuerteventura.jpg?itok=ojrGeXhV'
  out['El Valle'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXZLq-iNA2LtnOUWtgt6oUQmVKbAGtkIqobw&s'
  out['Elands Bay'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTC8lKjYrQEXfWYiQG1ZgsdClbH6cwXUZKCjA&s'
  out['Ericeira'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQEkGQvDVSV0L4QJr7pSyD976AJybokUkMqg&s'
  out['Hikkaduwa'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpU8NPPcian4ulloWoEfQ9T0jyz4TOPMBT_w&s'
  out['Hilton Beach'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6fHLCVgnExx1QCqtSyrCKFV3pNpC6uJPeZw&s'
  out['Honolua Bay'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrweerew_PY3BQDN0IWyCSfIbLYP4EE6jbhA&s'
  out['Hossegor'] = 'https://cdn.sanity.io/images/we0tdimr/production/84b68df300b3cb92ceb9c09a50df81684eff941d-3840x2415.jpg?rect=0,128,3840,2160&w=1920&h=1080&q=70&auto=format'
  out['Itacaré'] = 'https://www.travelandleisure.com/thmb/Rlt_Rz0XgGDYApO54_D4JwZsOvY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/TAL-engenhoca-beach-surfer-ITACAREBRAZIL1225-d0e22f73673f490badc41571bbef4afc.jpg'
  out['Kirra Point'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdJwGaobp4gGuPTAoF9OedNuqHkJerUuKLDg&s'
  out['Kovalam'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6tOaYtjxd40Epgifs0_DyaKH7EmEOwqTBtg&s'
  out['Krui Left'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQD383cbFWp4LkglmfSmQVi9cCyhAJWSoXzJw&s'
  out['La Gravière'] = 'https://www.surfholidays.com/assets/images/blog/2015-10-07-2012-03-15-legendary-surf-spots-la-graviere-0.jpg'
  out['Laniakea Beach'] = 'https://spot-thumbnails.cdn-surfline.com/spots/5842041f4e65fad6a770888d/5842041f4e65fad6a770888d_1500.jpg'
  out['Lanzarote Chicama'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiO-wVzrkDUabwi2r1_MX4XX_MXmiLypphaw&s'
  out['Lobos Point'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiPhhvk1bPejM3GOh-rm_8J_q8yFG74e5UQQ&s'
  out['Mar del Plata'] = 'https://cdn.sanity.io/images/we0tdimr/production/b360cfc0929c72eab22f504b3f56e9d4868491f1-1920x1278.jpg?rect=0,99,1920,1080&w=1920&h=1080&q=70&auto=format'
  out['Montañita'] = 'https://saltysoulsexperience.com/wp-content/uploads/2018/04/mc_montanita-16.jpg'
  out['N\'Gor Island'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7Pj9IJ6e55kfmT74sdNRcdpY7P1Pfz3r_iw&s'
  out['Nai Harn Beach'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeDZQGcsPhjyIkxmdr_ByGEptUuzrBQNd_7Q&s'
  out['Oman Surf'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjC-kwmseJS10tvLTXm2pWmyAXzQljlPyvFw&s'
  out['Pacasmayo'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXuzKr2Ud-kYXylz3qfyA6bVCRhnPhfQXd0A&s'
  out['Padang Padang'] = 'https://cdn.sanity.io/images/we0tdimr/production/be080a041f369abd9535d5da0db0c7ff979aa3cd-3840x2575.jpg?w=1920&h=1080&fm=jpg&q=65'
  out['Palau Surf'] = 'https://www.yeeew.com/wp-content/uploads/2018/06/Palau-Babi_Tube.jpg'
  out['Peniche'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXDDGo8MDYRk1FnCWJeku1jmuaAvpmCIQBAQ&s'
  out['Pichilemu'] = 'https://images.myguide-cdn.com/md/common/large/5cae6c9d26a96-521807.jpg'
  out['Playa Hermosa'] = 'https://s3.ca-central-1.amazonaws.com/oc-bodhisurfyoga.com/wp-content/uploads/2023/03/08141855/img-playa-dominical.webp'
  out['Ponta Preta'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdzy2iZU0FvEdUeHq3bryDGv9bWCGNMNWD2g&s'
  out['Popoyo'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbMnErlzMW7ZAuRk2Db6Q-es7oBL3uE4M3pg&s'
  out['Pulau Mantanani'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP-AwN5JPqMgAazMlqQ0zHRSRog_EnyqskhQ&s'
  out['Raglan'] = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2152627401/settings_images/48e4dc2-c56-14b-134d-835cf4e1467_Raglan_Guide8.jpg'
  out['Rarotonga'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrsiawJxBBdJU3BAYZhONBd1h3z72UnZljcw&s'
  out['Santa Catalina'] = 'https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,h_1200,q_75,w_1200/v1/clients/panama/large_Surf_at_The_Point_in_Santa_Catalina_Veraguas_province_Panam__dbb757e2-c0cb-4e7a-9d87-510e7f5b0cb7.jpg'
  out['Saquarema'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWIt2N-Ce7sDmc9V7sfL_fWJBvkig4kLMihw&s'
  out['Scorpion Bay'] = 'https://static.wixstatic.com/media/198f7a_45c87f9f3bf2418ea2a04a47d8d545ff~mv2.jpeg/v1/fill/w_629,h_521,fp_0.50_0.23,q_80,enc_avif,quality_auto/Scorpion%20Bay.jpeg'
  out['Snapper Rocks'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF31niiLoDkURhxpk9eXi4NdG1mNuwL1L6Sw&s'
  out['Steamer Lane'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDGvX-l0KPVLMkDm_Ufzg3mxiM8BLYXyyD_w&s'
  out['Strandhill'] = 'https://gostrandhill.com/wp-content/uploads/Surfing-2.jpg'
  out['Supertubes'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScgSm9luiX1nQmRy-GM4ki9qMCwGvc-W25Wg&s'
  out['Tabarka'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHqjTlREKXAuoMK8D1anY4bREKT6AED7qMgA&s'
  out['Tamarindo'] = 'https://lushpalm.com/wp-content/uploads/2017/10/tamarindo-costa-rica-surf-samba-to-the-sea-10.jpg'
  out['Tavarua Island'] = 'https://cdn.prod.website-files.com/5e16c425847980863bd18748/5e1cd968b8fe25d3a9e34314_Homepage_Hero_01.jpg'
  out['Thurso East'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmBSYY_ADaCuawIm7hKW7d8xrOOPEofeFCbw&s'
  out['Tofinho'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBGxa4etQXyhtnu0zqw93XIYSgv7xqe5vGqw&s'
  out['Tofino'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQx-dFUoxzdrC_-iCMZsK92mIKercFnFEq9Xg&s'
  out['Uluwatu'] = 'https://destinasian.com/_next/image?url=https%3A%2F%2Fstaging.destinasian.com%2Fwp-content%2Fuploads%2FUluwatu-Bali-Surf-Story-Tommy-Schultz_Hero.jpg&w=3840&q=75'
  out['Yangyang'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4pV6KS9ttJ3esTlK_eyT4QG9Ds2DTZrK8tg&s'
  return out
})()
/** Skiing: fishing과 동일 구조. 85개 리조트 전부 검증된 Commons 직접 URL (깨진/안 나오는 이미지 방지) */
const SKIING_TITLE_EN_LIST = [
  'Chamonix', 'Val d\'Isere', 'Courchevel 1850', 'Zermatt', 'St Anton am Arlberg', 'Ischgl', 'Kitzbuehel', 'Meribel', 'Verbier', 'Mayrhofen',
  'Davos Parsenn', 'Cortina d\'Ampezzo', 'Madonna di Campiglio', 'Aspen Snowmass', 'Vail', 'Park City', 'Squaw Valley', 'Jackson Hole', 'Steamboat Springs', 'Telluride',
  'Sun Valley', 'Lake Louise', 'Banff Sunshine', 'Whistler Blackcomb', 'Big White', 'Niseko', 'Hakuba', 'New Zealand Skiing', 'Las Leñas', 'Valle Nevado',
  'Portillo', 'Grandvalira', 'Sierra Nevada Spain', 'Bansko', 'Tsakhkadzor', 'Gudauri', 'Shymbulak', 'Rosa Khutor', 'Levi', 'Are',
  'Oslo Holmenkollen', 'The Cedars', 'Dizin', 'Myoko Kogen', 'Alpensia Yongpyong', 'Elbrus', 'Sestriere', 'Lech', 'Söll Ski Welt', 'Alta Badia',
  'Andermatt-Sedrun', 'Bad Gastein', 'Garmisch-Partenkirchen', 'La Plagne', 'Les Gets Morzine', 'Formigal', 'Ruka', 'Grindelwald Jungfrau', 'Mont-Tremblant', 'Cerro Catedral',
  'Cimislia', 'Poiana Brasov', 'Zakopane', 'Jasna', 'Kranjska Gora', 'Malbun', 'Mount Hermon', 'Oukaimeden', 'Afriski', 'Karakol',
  'Fann Mountains', 'Sky Resort Ulaanbaatar', 'Drakensberg Ski', 'Masikryong', 'Bamiyan', 'Bhutan Skiing', 'Bakhmaro', 'Naltar', 'Cervinia Breuil', 'Avoriaz',
  'Arosa Lenzerheide', 'Hintertux Glacier', 'Marmot Basin', 'Mammoth Mountain', 'The Remarkables',
  'St Moritz', 'Alpe d\'Huez', 'Tignes', 'Megève', 'Saas-Fee', 'Flims Laax', 'Saalbach-Hinterglemm', 'Kronplatz, South Tyrol', 'Baqueira-Beret', 'Geilo', 'Breckenridge', 'Stowe', 'Revelstoke', 'Mt Buller', 'Killington',
] as const
const SKIING_VERIFIED_URLS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Chamonix_valley_from_la_Fl%C3%A9g%C3%A8re%2C2010_07.JPG/640px-Chamonix_valley_from_la_Fl%C3%A9g%C3%A8re%2C2010_07.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/RGA_231.JPG/640px-RGA_231.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Courchevel_1850.JPG/640px-Courchevel_1850.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/1_zermatt_evening_2022.jpg/640px-1_zermatt_evening_2022.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/St_anton_skiroute_3_galzigbahn_v2.png/640px-St_anton_skiroute_3_galzigbahn_v2.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Ischgl_-_Silvrettabahn_03.jpg/640px-Ischgl_-_Silvrettabahn_03.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Winter_snow_in_Kitzb%C3%BChel.jpg/640px-Winter_snow_in_Kitzb%C3%BChel.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/MERIBEL.jpg/640px-MERIBEL.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Verbier_View.JPG/640px-Verbier_View.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Mayrhofen.jpg/640px-Mayrhofen.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/City_of_Davos.jpg/640px-City_of_Davos.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Faloria_Cortina_d%27Ampezzo_10.jpg/640px-Faloria_Cortina_d%27Ampezzo_10.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Madonna_di_Campiglio.JPG/640px-Madonna_di_Campiglio.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Lift_1A_on_Aspen_Mountain.jpg/640px-Lift_1A_on_Aspen_Mountain.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Vail_Ski_Resort_from_frontage_road_on_north_side_of_I-70.jpg/640px-Vail_Ski_Resort_from_frontage_road_on_north_side_of_I-70.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Eagle_Race_Arena_at_Park_City_Resort.jpg/640px-Eagle_Race_Arena_at_Park_City_Resort.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Palisades_Tahoe_ski_area.jpg/640px-Palisades_Tahoe_ski_area.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Jackson_Hole_Airport_as_seen_from_the_aerial_tram_at_Jackson_Hole_ski_resort.jpg/640px-Jackson_Hole_Airport_as_seen_from_the_aerial_tram_at_Jackson_Hole_ski_resort.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Steamboat_springs_ski_resort.jpg/640px-Steamboat_springs_ski_resort.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Telluride_Ski_Resort%2C_Col._%288645173834%29.jpg/640px-Telluride_Ski_Resort%2C_Col._%288645173834%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Furano_Snow_Resort_view2.JPG/640px-Furano_Snow_Resort_view2.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Lake_Louise_2017-03_ski_06.jpg/640px-Lake_Louise_2017-03_ski_06.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Sunshine_Village%2C_December_2004_12.jpg/640px-Sunshine_Village%2C_December_2004_12.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/2010-4_Whistler-Blackcomb_day_trip_%2816127495416%29.jpg/640px-2010-4_Whistler-Blackcomb_day_trip_%2816127495416%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Big_White_Ski_Resort%2C_Monashee_Mountains.jpg/640px-Big_White_Ski_Resort%2C_Monashee_Mountains.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Niseko-Moiwa.jpg/640px-Niseko-Moiwa.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Hakuba_Happo-one_Winter_Resort.JPG/640px-Hakuba_Happo-one_Winter_Resort.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Cardrona01_gobeirne.jpg/640px-Cardrona01_gobeirne.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Las_Le%C3%B1as_Mendoza_Argentina_by_Andre_Charland.jpg/640px-Las_Le%C3%B1as_Mendoza_Argentina_by_Andre_Charland.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Lo_Barnechea_-Valle_Nevado_-_2009_-_01.jpg/640px-Lo_Barnechea_-Valle_Nevado_-_2009_-_01.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Portillo_banner.jpg/640px-Portillo_banner.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Vista_de_la_estaci%C3%B3n_de_esqu%C3%AD_de_Formigal_desde_la_pista_del_Collado.jpg/640px-Vista_de_la_estaci%C3%B3n_de_esqu%C3%AD_de_Formigal_desde_la_pista_del_Collado.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sierra_Nevada_Borreguiles_6.jpg/640px-Sierra_Nevada_Borreguiles_6.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bansko_ski_resort_%2823917454674%29.jpg/640px-Bansko_ski_resort_%2823917454674%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Tsaghkadzor_panorama%2C_Armenia.jpg/640px-Tsaghkadzor_panorama%2C_Armenia.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Gudauri_Georgia_Panorama_P.Liparteliani.jpg/640px-Gudauri_Georgia_Panorama_P.Liparteliani.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Shymbulak%2C_Almaty_%28P1180179%29.jpg/640px-Shymbulak%2C_Almaty_%28P1180179%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Caucasus_Mountains_near_Rosa_Khutor_Alpine_Resort.jpg/640px-Caucasus_Mountains_near_Rosa_Khutor_Alpine_Resort.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Levi_South_Ski_Slope.jpg/640px-Levi_South_Ski_Slope.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Snowy_%C3%85reskutan_Ski_lift.jpg/640px-Snowy_%C3%85reskutan_Ski_lift.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Holmenkollen_ski_jump.jpg/640px-Holmenkollen_ski_jump.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Mount_Hermon_ski_resort_in_summer_%28August_3rd%29.jpg/640px-Mount_Hermon_ski_resort_in_summer_%28August_3rd%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dizin_Hotel_view.jpg/640px-Dizin_Hotel_view.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Myoko%2C_Niigata_Prefecture%2C_Japan_-_panoramio.jpg/640px-Myoko%2C_Niigata_Prefecture%2C_Japan_-_panoramio.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Winter_2014_Candidate_City-_PyeongChang_Dragon_Valley_ski_resort.jpg/640px-Winter_2014_Candidate_City-_PyeongChang_Dragon_Valley_ski_resort.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Mount_Elbrus_%28cropped%29.jpg/640px-Mount_Elbrus_%28cropped%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Sestriere_2017.jpg/640px-Sestriere_2017.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Lech_am_Arlberg_2006.jpg/640px-Lech_am_Arlberg_2006.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/SkiWelt_Wilder_Kaiser_-_Brixental_-_panoramio_%281%29.jpg/640px-SkiWelt_Wilder_Kaiser_-_Brixental_-_panoramio_%281%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Alta_Badia.JPG/640px-Alta_Badia.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Andermatt.jpg/640px-Andermatt.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Bad_Gastein_Ski_Resort_%28AUT%29_2016.jpg/640px-Bad_Gastein_Ski_Resort_%28AUT%29_2016.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Garmisch-Partenkirchen.JPG/640px-Garmisch-Partenkirchen.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/La_Plagne_Bellecote_-_2013_2013-02-26_11.37.53_%288765237478%29.jpg/640px-La_Plagne_Bellecote_-_2013_2013-02-26_11.37.53_%288765237478%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/LesGets-20140816.jpg/640px-LesGets-20140816.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Vista_de_la_estaci%C3%B3n_de_esqu%C3%AD_de_Formigal_desde_la_pista_del_Collado.jpg/640px-Vista_de_la_estaci%C3%B3n_de_esqu%C3%AD_de_Formigal_desde_la_pista_del_Collado.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Ruka_Ski_Chalets_%288136519018%29.jpg/640px-Ruka_Ski_Chalets_%288136519018%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Grindelwald_View_02.jpg/640px-Grindelwald_View_02.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Mont-Tremblant_ski_hill_South_Face.jpg/640px-Mont-Tremblant_ski_hill_South_Face.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Refugio_Lynch%2C_Cerro_Catedral_-Bariloche-.jpg/640px-Refugio_Lynch%2C_Cerro_Catedral_-Bariloche-.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Ski_resort_3_sinaia_romania.jpg/640px-Ski_resort_3_sinaia_romania.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Ski_resort_3_sinaia_romania.jpg/640px-Ski_resort_3_sinaia_romania.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Ski_Jump_-_Zakopane%2C_Poland_%2855063618265%29.jpg/640px-Ski_Jump_-_Zakopane%2C_Poland_%2855063618265%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Jasn%C3%A1_Ski_Resort_-_gondola_lift_Kosodrevina_-_Chopok_%284%29.jpg/640px-Jasn%C3%A1_Ski_Resort_-_gondola_lift_Kosodrevina_-_Chopok_%284%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Kranjska_Gora-2736048.jpg/640px-Kranjska_Gora-2736048.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Malbun_2.jpg/640px-Malbun_2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Hermonsnow.jpg/640px-Hermonsnow.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Jbel.Oukaimeden.jpg/640px-Jbel.Oukaimeden.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/AfriSki.jpg/640px-AfriSki.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Lake_Issyk-Kul%2C_Kyrgyzstan.jpg/640px-Lake_Issyk-Kul%2C_Kyrgyzstan.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Chamonix_winter_%286743625445%29.jpg/640px-Chamonix_winter_%286743625445%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Bogd_Khan_Uul.jpg/640px-Bogd_Khan_Uul.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/South_Africa_-_Drakensberg_%2816261357780%29.jpg/640px-South_Africa_-_Drakensberg_%2816261357780%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Masikryong_North_Korea_Ski_Resort_%2812299792453%29.jpg/640px-Masikryong_North_Korea_Ski_Resort_%2812299792453%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Black_Hawk_flying_over_a_valley_in_Bamyan.jpg/640px-Black_Hawk_flying_over_a_valley_in_Bamyan.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Paro%2C_Taktsang_Goemba_%28Tiger%27s_Nest%29_%2815221622304%29.jpg/640px-Paro%2C_Taktsang_Goemba_%28Tiger%27s_Nest%29_%2815221622304%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Bakhmaro_2.jpg/640px-Bakhmaro_2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Naltar_lake_in_Autumn%2C_Gilgit.JPG/640px-Naltar_lake_in_Autumn%2C_Gilgit.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/CervinoAug252023_03.jpg/640px-CervinoAug252023_03.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Avoriaz_%286%29.jpg/640px-Avoriaz_%286%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Arosa_jun2_09_094.jpg/640px-Arosa_jun2_09_094.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Zillertal3.jpg/640px-Zillertal3.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Pyramid_Lake_in_winter%2C_Jasper_National_Park%2C_Alberta.jpg/640px-Pyramid_Lake_in_winter%2C_Jasper_National_Park%2C_Alberta.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Alpine_Ski_in_Mammoth_Mountain.jpg/640px-Alpine_Ski_in_Mammoth_Mountain.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/The_Remarkables._Queenstown_NZ_%288167990319%29.jpg/640px-The_Remarkables._Queenstown_NZ_%288167990319%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Exterior_Winter_2016_17_Fotograf_Romano_Salis_%2821%29.jpg/640px-Exterior_Winter_2016_17_Fotograf_Romano_Salis_%2821%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Alpe-dhuez-arrivee-tour.jpg/640px-Alpe-dhuez-arrivee-tour.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/2017-01_Grande_Motte_Tignes_03.jpg/640px-2017-01_Grande_Motte_Tignes_03.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Village_%40_Rochebrune_%40_Meg%C3%A8ve_%2851037436052%29.jpg/640px-Village_%40_Rochebrune_%40_Meg%C3%A8ve_%2851037436052%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Saas-Fee_Dorf_Winter.jpg/640px-Saas-Fee_Dorf_Winter.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Laax_See.jpg/640px-Laax_See.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Saalbach_hinterglemm_above.JPG/640px-Saalbach_hinterglemm_above.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Kronplatz_Suedseite.jpg/640px-Kronplatz_Suedseite.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Baqueira_1800.jpg/640px-Baqueira_1800.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Geilo_Camping.jpg/640px-Geilo_Camping.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Breckenridge_Ski_Area_from_Dercum_Mountain%2C_Keystone_Ski_Area.jpg/640px-Breckenridge_Ski_Area_from_Dercum_Mountain%2C_Keystone_Ski_Area.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Ground_view_of_Stowe_Mountain_Resort%27s_Mount_Mansfield.jpg/640px-Ground_view_of_Stowe_Mountain_Resort%27s_Mount_Mansfield.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/A_day%27s_skiing_at_spedtacular_Mt_Revelstoke_-_Noth_Americas_biggest_vertical_drop_at_1713m_%285620_ft%29_-_the_mid_mountain_day_lodge_-_%2828620313540%29.jpg/640px-A_day%27s_skiing_at_spedtacular_Mt_Revelstoke_-_Noth_Americas_biggest_vertical_drop_at_1713m_%285620_ft%29_-_the_mid_mountain_day_lodge_-_%2828620313540%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Mt_Buller_Bourke_St_Stevage-2008-28-11.jpg/640px-Mt_Buller_Bourke_St_Stevage-2008-28-11.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Bear_Mountain_Killington.jpg/640px-Bear_Mountain_Killington.jpg',
]
const SKIING_DIRECT_IMAGES: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  SKIING_TITLE_EN_LIST.forEach((t, i) => { out[t] = SKIING_VERIFIED_URLS[i] })
  return out
})()

const SCUBA_TITLE_EN_LIST = [
  'Raja Ampat', 'Tubbataha Reef', 'Komodo National Park', 'Sipadan Island', 'Milne Bay, Papua New Guinea',
  'Mergui Archipelago, Myanmar', 'Palau Blue Corner', 'Truk Lagoon, Micronesia', 'Cocos Island, Costa Rica', 'Darwin Arch, Galápagos',
  'Tonga Humpback Whale Dive', 'Palau Wrecks, Micronesia', 'Aldabra Atoll, Seychelles', 'Sodwana Bay, South Africa', 'Fernando de Noronha, Brazil',
  'SS Thistlegorm, Red Sea', 'Brothers Islands, Sudan', 'Malpelo Island, Colombia', 'Great Blue Hole, Belize', 'Silfra Fissure, Iceland',
  'Scapa Flow, Scotland', 'Tiger Beach, Bahamas', 'SS President Coolidge, Vanuatu', 'HMHS Britannic Wreck, Aegean', 'Andavadoaka, Madagascar',
  'Nusa Penida, Bali', 'Richelieu Rock, Thailand', 'Similan Islands, Thailand', 'Wakatobi, Indonesia', 'Bunaken, Indonesia',
  'Apo Island, Philippines', 'Moalboal, Philippines', 'Coron Bay, Philippines', 'Koh Tao, Thailand', 'Malapascua Island, Philippines',
  'Pulau Weh, Indonesia', 'Solomon Islands', 'Rangiroa, French Polynesia', 'Fakarava, French Polynesia', 'Pacific Harbor, Fiji',
  'Yap Island, Micronesia', 'Kona Manta Ray Night Dive, Hawaii', 'Niue, South Pacific', 'North Malé Atoll, Maldives', 'Baa Atoll, Maldives',
  'Andaman Islands, India', 'Mafia Island, Tanzania', 'Tofo Beach, Mozambique', 'Mayotte, Indian Ocean', 'Nosy Be, Madagascar',
  'Ras Mohammed, Egypt', 'Blue Hole Dahab, Egypt', 'Djibouti Whale Shark, Djibouti', 'Eilat, Israel', 'Aqaba, Jordan',
  'Aliwal Shoal, South Africa', 'Watamu Marine Park, Kenya', 'Mnemba Atoll, Zanzibar', 'Cenotes Yucatan, Mexico', 'Cozumel, Mexico',
  'Jardines de la Reina, Cuba', 'Roatan, Honduras', 'Belize Barrier Reef', 'Bat Islands, Costa Rica', 'Coiba Island, Panama',
  'Azores, Portugal', 'El Hierro Marine Reserve, Spain', 'Norway Fjord Diving, Norway', 'Kosterfjorden, Sweden', 'Easter Island, Chile',
  'Great Barrier Reef, Australia', 'Ningaloo Reef, Australia', 'Lord Howe Island, Australia', 'New Caledonia Shark Bay', 'Norfolk Island, Pacific',
  'Saipan Blue Hole, Northern Marianas', 'Jellyfish Lake, Palau', 'Subic Bay Wrecks, Philippines', 'Green Island, Taiwan', 'Koh Lipe, Thailand',
  'Mauritius', 'Comoro Islands', 'Lakshadweep Islands, India', 'Muscat Daymaniyat, Oman', 'NEOM Red Sea, Saudi Arabia', 'Tyre Marine Reserve, Lebanon',
  'Zenobia, Cyprus', 'Lanzarote MUSA, Spain', 'Marseille Calanques, France', 'Hvar, Croatia', 'Santorini Caldera, Greece', 'Bodrum Wrecks, Turkey', 'Menorca Sea Caves, Spain',
  'Florida Keys, USA', 'Florida Springs, USA', 'Baja California Sea of Cortez', 'RMS Rhone, British Virgin Islands', 'Campbell River, Canada', 'Bermuda', 'Stingray City, Cayman Islands',
]
const SCUBA_VERIFIED_URLS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Karang_kipas_laut_di_Raja_Ampat.jpg/640px-Karang_kipas_laut_di_Raja_Ampat.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Tubbataha_Shark.jpg/640px-Tubbataha_Shark.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Pink_Beach%2C_Padar_Island%2C_Komodo_National_Park.jpg/640px-Pink_Beach%2C_Padar_Island%2C_Komodo_National_Park.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Pulau_Sipadan.jpg/640px-Pulau_Sipadan.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Coral_at_Manta_Reef_dsc04339.jpg/640px-Coral_at_Manta_Reef_dsc04339.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Nusa_Lembongan_Reef.jpg/640px-Nusa_Lembongan_Reef.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Blue-Corner-2016-aerial-view-Luka-Peternel.jpg/640px-Blue-Corner-2016-aerial-view-Luka-Peternel.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Bow_gun_of_the_Fujikawa_Maru_wreck%2C_Truk_Lagoon%2C_Micronesia.jpg/640px-Bow_gun_of_the_Fujikawa_Maru_wreck%2C_Truk_Lagoon%2C_Micronesia.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Isla_del_coco.jpg/640px-Isla_del_coco.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Darwinarch.jpg/640px-Darwinarch.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Humpback_Whale_underwater_shot.jpg/640px-Humpback_Whale_underwater_shot.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Diver_on_the_wreck_of_the_Aster_PB182648.JPG/640px-Diver_on_the_wreck_of_the_Aster_PB182648.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/An_Outpost_for_Evolution_at_Aldabra_Atoll.jpg/640px-An_Outpost_for_Evolution_at_Aldabra_Atoll.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/SODWANA_BAY_Beach_%28Humpback_whale_in_foreground%29_-_panoramio.jpg/640px-SODWANA_BAY_Beach_%28Humpback_whale_in_foreground%29_-_panoramio.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Parque_Nacional_Marinho_de_Fernando_de_Noronha_por_Fernandoantoniofotos_%2801%29_%28cropped2%29.jpg/640px-Parque_Nacional_Marinho_de_Fernando_de_Noronha_por_Fernandoantoniofotos_%2801%29_%28cropped2%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Thistlegorm_train_parts_minus_red_edit.jpg/640px-Thistlegorm_train_parts_minus_red_edit.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Numibia.jpg/640px-Numibia.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Malpelo_Island.jpg/640px-Malpelo_Island.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Great_Blue_Hole.jpg/640px-Great_Blue_Hole.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Ca%C3%B1%C3%B3n_Silfra%2C_Parque_Nacional_de_%C3%9Eingvellir%2C_Su%C3%B0urland%2C_Islandia%2C_2014-08-16%2C_DD_056.JPG/640px-Ca%C3%B1%C3%B3n_Silfra%2C_Parque_Nacional_de_%C3%9Eingvellir%2C_Su%C3%B0urland%2C_Islandia%2C_2014-08-16%2C_DD_056.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Raising_the_divers_-_geograph.org.uk_-_1490611.jpg/640px-Raising_the_divers_-_geograph.org.uk_-_1490611.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Blacktip_reef_shark_%28Georgia_Aquarium%29_%28cropped%29.jpg/640px-Blacktip_reef_shark_%28Georgia_Aquarium%29_%28cropped%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Divers_over_a_boiler_on_the_wreck_of_the_SS_Lusitania_at_Bellows_Rock_P8030108.jpg/640px-Divers_over_a_boiler_on_the_wreck_of_the_SS_Lusitania_at_Bellows_Rock_P8030108.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/HMHS_Britannic.jpg/640px-HMHS_Britannic.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Andavadoaka_09.jpg/640px-Andavadoaka_09.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Broken_Bay%2C_Nusa_Penida.jpg/640px-Broken_Bay%2C_Nusa_Penida.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colorful_underwater_landscape_of_a_coral_reef.jpg/640px-Colorful_underwater_landscape_of_a_coral_reef.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Donald_Duck_Bay%2C_Similan_Island_-8.jpg/640px-Donald_Duck_Bay%2C_Similan_Island_-8.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Coral_reef_near_Marsa_Alam_II.jpg/640px-Coral_reef_near_Marsa_Alam_II.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bunaken.jpg/640px-Bunaken.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Apo_reef.jpg/640px-Apo_reef.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Moalboal_Cebu_4.JPG/640px-Moalboal_Cebu_4.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Busunga_Wrack.jpg/640px-Busunga_Wrack.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Ban_Mae_Haad_Ko_Tao.jpg/640px-Ban_Mae_Haad_Ko_Tao.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Malapascua_%28island%29%2C_Tropical_lagoon%2C_Pure_tropical_bliss%2C_Philippines.jpg/640px-Malapascua_%28island%29%2C_Tropical_lagoon%2C_Pure_tropical_bliss%2C_Philippines.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Anthias_coral_reef_fish.jpg/640px-Anthias_coral_reef_fish.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Aft_view_Thistlegorm.jpg/640px-Aft_view_Thistlegorm.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Rangiroa_STS51I-31-25.jpg/640px-Rangiroa_STS51I-31-25.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Fakarava.JPG/640px-Fakarava.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Pacific_Partnership_2023_and_the_Republic_of_Fiji_Military_Forces_dive_teams_train_together_in_Fiji_%288107829%29.jpg/640px-Pacific_Partnership_2023_and_the_Republic_of_Fiji_Military_Forces_dive_teams_train_together_in_Fiji_%288107829%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Manta_Ray_in_Kona%2C_Hawaii.jpg/640px-Manta_Ray_in_Kona%2C_Hawaii.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Female_scuba_diver_swims_with_a_young_male_Manta_ray_-_Kona_district%2C_Hawaii.jpg/640px-Female_scuba_diver_swims_with_a_young_male_Manta_ray_-_Kona_district%2C_Hawaii.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rochen_Malediven.jpg/640px-Rochen_Malediven.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Maldives.visibleearth.nasa.jpg/640px-Maldives.visibleearth.nasa.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/The_Coral_Reef_at_the_Andaman_Islands.jpg/640px-The_Coral_Reef_at_the_Andaman_Islands.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Mafia_Island_%2851554991378%29.jpg/640px-Mafia_Island_%2851554991378%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Pulpo_com%C3%BAn_%28Octopus_vulgaris%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-08%2C_DD_53.jpg/640px-Pulpo_com%C3%BAn_%28Octopus_vulgaris%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-08%2C_DD_53.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Penetration_inside_Dunraven_wreck%2C_Ras_Mohammed_Park.jpg/640px-Penetration_inside_Dunraven_wreck%2C_Ras_Mohammed_Park.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Estrella_canaria_%28Narcissia_canariensis%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_48.jpg/640px-Estrella_canaria_%28Narcissia_canariensis%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_48.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Ras_Mohammed.jpg/640px-Ras_Mohammed.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Dahab_Blue_Hole_Arc_2009.jpg/640px-Dahab_Blue_Hole_Arc_2009.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Humpback_Whale_underwater_shot.jpg/640px-Humpback_Whale_underwater_shot.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/EilatFringingReef.jpg/640px-EilatFringingReef.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Diver_using_Inspiration_rebreather_at_the_wreck_of_the_MV_Orotava_P6308043.jpg/640px-Diver_using_Inspiration_rebreather_at_the_wreck_of_the_MV_Orotava_P6308043.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Arch_at_Cathedral_DSC05788a.jpg/640px-Arch_at_Cathedral_DSC05788a.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Watamu_Beach%2C_Kenya.JPG/640px-Watamu_Beach%2C_Kenya.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Sepia_com%C3%BAn_%28Sepia_officinalis%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-08%2C_DD_77.jpg/640px-Sepia_com%C3%BAn_%28Sepia_officinalis%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-08%2C_DD_77.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Cenote_2.jpg/640px-Cenote_2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Akumal_Scuba_Diving_%284317048051%29.jpg/640px-Akumal_Scuba_Diving_%284317048051%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Coral_cluster_near_Roat%C3%A1n_Honduras.jpeg/640px-Coral_cluster_near_Roat%C3%A1n_Honduras.jpeg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Tapaculo_%28Bothus_podas%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-05%2C_DD_64.jpg/640px-Tapaculo_%28Bothus_podas%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-05%2C_DD_64.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Diving%2C_Ulong_Channel%2C_Palau.jpg/640px-Diving%2C_Ulong_Channel%2C_Palau.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Coiba.JPG/640px-Coiba.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Sperm_whale_%28Physeter_macrocephalus%29_diving%2C_S%C3%A3o_Miguel_Island%2C_Azores%2C_Portugal_%28PPL1-Corrected%29.jpg/640px-Sperm_whale_%28Physeter_macrocephalus%29_diving%2C_S%C3%A3o_Miguel_Island%2C_Azores%2C_Portugal_%28PPL1-Corrected%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Morenas_negras_%28Muraena_augusti%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_52.jpg/640px-Morenas_negras_%28Muraena_augusti%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_52.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Norway_fjord.jpg/640px-Norway_fjord.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Underwater_photo_of_coral_reef.jpg/640px-Underwater_photo_of_coral_reef.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Easter_Island_5.jpg/640px-Easter_Island_5.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg/640px-ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Ningaloo.jpg/640px-Ningaloo.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Parque_Nacional_Marinho_de_Fernando_de_Noronha_por_Fernandoantoniofotos_%2801%29_%28cropped2%29.jpg/640px-Parque_Nacional_Marinho_de_Fernando_de_Noronha_por_Fernandoantoniofotos_%2801%29_%28cropped2%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Babosa_de_mar_%28Felimare_picta_webbi%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_60.jpg/640px-Babosa_de_mar_%28Felimare_picta_webbi%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_60.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Gallito_%28Stephanolepis_hispidus%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-06%2C_DD_16.jpg/640px-Gallito_%28Stephanolepis_hispidus%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-06%2C_DD_16.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Saipan_at_Night.jpg/640px-Saipan_at_Night.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Jellyfish_Lake_aerial_%28March_2008%29.jpg/640px-Jellyfish_Lake_aerial_%28March_2008%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ship_wreck_Carnatic_2017-04-22_Egypt-7947.jpg/640px-Ship_wreck_Carnatic_2017-04-22_Egypt-7947.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Green_Island_Sentinel-2B_MSI_2020-06-04.jpg/640px-Green_Island_Sentinel-2B_MSI_2020-06-04.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Koh_Lipe_island_coast.jpg/640px-Koh_Lipe_island_coast.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Malapascua_%28island%29%2C_Tropical_lagoon%2C_Pure_tropical_bliss%2C_Philippines.jpg/640px-Malapascua_%28island%29%2C_Tropical_lagoon%2C_Pure_tropical_bliss%2C_Philippines.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Busunga_Wrack.jpg/640px-Busunga_Wrack.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Ban_Mae_Haad_Ko_Tao.jpg/640px-Ban_Mae_Haad_Ko_Tao.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Tibur%C3%B3n_azul_%28Prionace_glauca%29_y_submarinista%2C_canal_Fayal-Pico%2C_islas_Azores%2C_Portugal%2C_2020-07-27%2C_DD_08.jpg/640px-Tibur%C3%B3n_azul_%28Prionace_glauca%29_y_submarinista%2C_canal_Fayal-Pico%2C_islas_Azores%2C_Portugal%2C_2020-07-27%2C_DD_08.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Dharavandhoo_Thila_-_Manata_Black_Pearl.JPG/640px-Dharavandhoo_Thila_-_Manata_Black_Pearl.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Lakshadweep_Islands%2C_India_%28MODIS_2015-01-14%29.jpg/640px-Lakshadweep_Islands%2C_India_%28MODIS_2015-01-14%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Donald_Duck_Bay%2C_Similan_Island_-8.jpg/640px-Donald_Duck_Bay%2C_Similan_Island_-8.jpg',
  'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/MS_Zenobia_listing.jpg/640px-MS_Zenobia_listing.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lanzarote_Aquarium_-_panoramio.jpg/640px-Lanzarote_Aquarium_-_panoramio.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Panorama-Calanque_de_Sugiton.jpg/640px-Panorama-Calanque_de_Sugiton.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Broken_Bay%2C_Nusa_Penida.jpg/640px-Broken_Bay%2C_Nusa_Penida.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Exploring_Zenobia_Wreck_Cyprus.jpg/640px-Exploring_Zenobia_Wreck_Cyprus.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Cangrejo_ermita%C3%B1o_%28Dardanus_calidus%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_47.jpg/640px-Cangrejo_ermita%C3%B1o_%28Dardanus_calidus%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_47.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Ca%C3%B1%C3%B3n_Silfra%2C_Parque_Nacional_de_%C3%9Eingvellir%2C_Su%C3%B0urland%2C_Islandia%2C_2014-08-16%2C_DD_056.JPG/640px-Ca%C3%B1%C3%B3n_Silfra%2C_Parque_Nacional_de_%C3%9Eingvellir%2C_Su%C3%B0urland%2C_Islandia%2C_2014-08-16%2C_DD_056.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Engine_order_telgraph_on_wreck_of_SS_Steuben.jpg/640px-Engine_order_telgraph_on_wreck_of_SS_Steuben.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Caldera_of_Santorini_-_Nea_Kameni_-_seen_from_Fira_Thira.jpg/640px-Caldera_of_Santorini_-_Nea_Kameni_-_seen_from_Fira_Thira.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Babosa_de_mar_%28Felimare_picta_webbi%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_60.jpg/640px-Babosa_de_mar_%28Felimare_picta_webbi%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_60.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Snorkeler_underwater_near_the_Carysfort_Reef_Lighthouse-_Key_Largo%2C_Florida_%283247324955%29.jpg/640px-Snorkeler_underwater_near_the_Carysfort_Reef_Lighthouse-_Key_Largo%2C_Florida_%283247324955%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Cenote_2.jpg/640px-Cenote_2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Wpdms_nasa_topo_gulf_of_california.jpg/640px-Wpdms_nasa_topo_gulf_of_california.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Sargo_real_%28Diplodus_cervinus%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_49.jpg/640px-Sargo_real_%28Diplodus_cervinus%29%2C_franja_marina_Teno-Rasca%2C_Tenerife%2C_Espa%C3%B1a%2C_2022-01-09%2C_DD_49.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Underwater_photo_of_coral_reef.jpg/640px-Underwater_photo_of_coral_reef.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Feather_star_coral_reef.jpg/640px-Feather_star_coral_reef.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Stingray_CIty_in_Grand_Cayman.jpg/640px-Stingray_CIty_in_Grand_Cayman.jpg',
]
const SCUBA_DIRECT_IMAGES: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  SCUBA_TITLE_EN_LIST.forEach((t, i) => { out[t] = SCUBA_VERIFIED_URLS[i] })
  return out
})()

/** 카테고리별 직접 이미지. 직접 URL 없으면 API로 조회 후 전용 캐시에 저장 (config.fetchStrategy === 'api' 인 카테고리) */
const CATEGORY_DIRECT_IMAGES: Record<string, Record<string, string>> = {
  nature: NATURE_DIRECT_IMAGES,
  islands: ISLANDS_DIRECT_IMAGES,
  animals: ANIMALS_DIRECT_IMAGES,
  festivals: FESTIVALS_DIRECT_IMAGES,
  fishing: FISHING_DIRECT_IMAGES,
  surfing: SURFING_DIRECT_IMAGES,
  skiing: SKIING_DIRECT_IMAGES,
  scuba: SCUBA_DIRECT_IMAGES,
}

/** 100 Foods: 사용자 제공 다이렉트 이미지 (최우선). 제목별 URL 추가 시 여기만 수정. */
const FOODS_USER_DIRECT_IMAGES: Record<string, string> = {
  'A5 Wagyu Beef': 'https://www.japanesefoodguide.com/wp-content/uploads/2021/08/a5-wagyu-slices.jpg',
  'Acai Bowl': 'https://www.twopeasandtheirpod.com/wp-content/uploads/2023/06/Acai-Bowl-10.jpg',
  'Alaskan King Crab': 'https://crabs.com/cdn/shop/articles/MERCURY_studio_1_3ab95be5-3d54-48fa-b805-9010747c0133_2100x.jpg?v=1767995024',
  'Arancini': 'https://www.allrecipes.com/thmb/hxUMuQmebF0imzrV0-dLQRBGK08=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/RM-57844-Arancini-ddmfs-3x4-6021-19619bf1fd4d41279000e464618dd411.jpg',
  'Baklava': 'https://www.allrecipes.com/thmb/Ms72N88Kcd8ew0_Yv_LFHiQQ8hk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/7495495-easy-baklava-atk-1x1-1-5ff8675aa73f4c4bbb221dc84b77b98b.jpg',
  'Balut Duck Embryo': 'https://modernfarmer.com/wp-content/uploads/2014/04/balut-hero.jpg',
  'Beef Rendang': 'https://www.elmundoeats.com/wp-content/uploads/2023/04/A-bowl-of-beef-rendang.jpg',
  'Beluga Caviar': 'https://www.gourmetfoodstore.com/images/product/large/what-is-beluga-caviar-15951-1S-5951.jpg',
  'Bibimbap': 'https://www.thespruceeats.com/thmb/r2bG-lIQYgLYecbnwOW36hiLuk8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/classic-korean-bibimbap-recipe-2118765-hero-01-091c0e0f8c20426d8f70747955efa61d.jpg',
  'Birria Tacos': 'https://keviniscooking.com/wp-content/uploads/2023/08/Quesabirria-Tacos-square.jpg',
  'Bouillabaisse': 'https://littleferrarokitchen.com/wp-content/uploads/2023/05/French-seafood-stew-with-fennel.jpg',
  'Brazilian Churrasco': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGohlSe3I3IW5enjEUJz2dtfJlrWCadnbsuA&s',
  'Bunny Chow': 'https://myconvenientkitchen.com/wp-content/uploads/2024/07/South-African-bunny-chow.jpg',
  'Ceviche': 'https://www.mylatinatable.com/wp-content/uploads/2017/05/Shrimp-Ceviche-Mexican-Style-Ceviche-Recipe-1-1024x772.jpg',
  'Char Siu BBQ Pork': 'https://curatedkitchenware.com/cdn/shop/articles/20241120144335-how-to-make-chinese-cantonese-bbq-roasted-pork-char-siu-recipe.png?v=1758857743',
  'Chimichanga': 'https://www.lemontreedwelling.com/wp-content/uploads/2021/02/chimichangas-featured.jpg',
  'Congee Jook': 'https://healthynibblesandbits.com/wp-content/uploads/2019/03/Basic-Congee-Recipe-1.jpg',
  'Coq au Vin': 'https://www.recipetineats.com/uploads/2016/09/Coq-au-Vin_00.jpg',
  'Currywurst': 'https://ychef.files.bbci.co.uk/1280x720/p03ygdrq.jpg',
  'Bird\'s Nest Soup': 'https://cdn.shopify.com/s/files/1/0608/9195/5440/files/Blog_Easy-Recipe_How-to-Cook-Bird_s-Nest-Soup_2_1280-x-900px.jpg?v=1689933285',
  'Cuy Roasted Guinea Pig': 'https://www.eatperu.com/wp-content/uploads/2016/12/Grilled-guinea-pig-dish-peruvian-Andes-Cuzco-Peru.jpg',
  'Dom Perignon Champagne': 'https://www.thedenizen.co.nz/wp-content/uploads/2025/10/feature-6.jpg',
  'Doner Kebab': 'https://thecookingfoodie.com/wp-content/uploads/2025/11/viral-doner-kebab-recipe-500x500.jpg',
  'Durian King of Fruits': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-c1nExk6tTHAbcc9jtHGnx6MinvaVqnUDtA&s',
  'Eggs Benedict': 'https://tatyanaseverydayfood.com/wp-content/uploads/2024/12/Crab-Eggs-Benedict-with-Caviar-Recipe-6.jpg',
  'Empanada': 'https://cdn-ilddihb.nitrocdn.com/MgqZCGPEMHvMRLsisMUCAIMWvgGMxqaj/assets/images/optimized/rev-b472ba7/www.goya.com/wp-content/uploads/2023/10/chipotle-chicken-empanadas-900x900.jpg',
  'Escargot': 'https://legallyhealthyblonde.com/wp-content/uploads/2022/09/escargot-featured.jpg',
  'Feijoada': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSD5DlJgZ5N6wHVSN0Ibdt-uBGfu5xwco0XXA&s',
  'Fish and Chips': 'https://tastesbetterfromscratch.com/wp-content/uploads/2022/03/Fish-and-Chips-Web-8.jpg',
  'French Croissant': 'https://www.theflavorbender.com/wp-content/uploads/2020/05/French-Croissants-SM-2363.jpg',
  'Fresh Pacific Oysters': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgyqOlzr_MveacQRqY52WDw6dbR5jZjqHxMg&s',
  'Full Turkish Breakfast': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuW5vr5hMJx1yFcK3DKzRlgAMvqoGc1DNPDA&s',
  'Gelato': 'https://www.goodlifeeats.com/wp-content/uploads/2022/06/Strawberry-Gelato-Recipe-735x951.jpg',
  'Greek Mezze Spread': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxnNnpcXtzMSJGxWYy56_wDUf4iRJyeznuEw&s',
  'Foie Gras': 'https://leitesculinaria.com/wp-content/uploads/2022/12/pan-seared-foie-gras.jpg',
  'Fugu Puffer Fish': 'https://cdn.shopify.com/s/files/1/0068/0394/7579/files/Fugu_Sashimi_2.jpg?v=1751065885',
  'Fugu Shirako': 'https://www.foodinjapan.org/wp-content/uploads/2024/05/fugu-shirako.jpg',
  'Haggis': 'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2012/6/26/0/FN_haggis_s4x3.jpg.rend.hgtvcom.1280.960.suffix/1371606753626.webp',
  'Hakata Tonkotsu Ramen': 'https://rwk-j9.com/wp-content/uploads/2021/07/210716_04-15-1024x683.jpg',
  'Hakarl Fermented Greenland Shark': 'https://www.youngpioneertours.com/wp-content/uploads/2020/07/hakarl.jpg',
  'Hu Tieu Nam Vang': 'https://vietasiatravel.com/uploads/Travel_guide/Hu-tieu-nam-vang.jpg',
  'Hungarian Goulash': 'https://www.billyparisi.com/wp-content/uploads/2021/10/goulash-1.jpg',
  'Iberico Ham': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSi7AfoMoWakXZ8bS2gO3I-u1NYKagavtsuvA&s',
  'Injera with Wat': 'https://www.crazy-cucumber.com/wp-content/uploads/2021/05/BV3A39901.jpg',
  'Jerk Chicken': 'https://hips.hearstapps.com/hmg-prod/images/jamaican-jerk-chicken1-1662431390.jpg',
  'Jollof Rice': 'https://allnigerianfoods.com/wp-content/uploads/jollof_rice_recipe1.jpg',
  'Katsudon': 'https://sudachirecipes.com/wp-content/uploads/2020/04/katsudon-sqr.jpg',
  'Khachapuri': 'https://whiskedawaykitchen.com/wp-content/uploads/2024/04/georgian-khachapuri-recipe-18.jpg',
  'Khao Niao Mamuang (Mango Sticky Rice)': 'https://i0.wp.com/www.shanazrafiq.com/wp-content/uploads/2018/07/1-DSC_0015-1.jpg',
  'Kimchi': 'https://www.maangchi.com/wp-content/uploads/2014/06/whole-cabbage-kimchi.jpg',
  'Kopi Luwak Civet Coffee': 'https://static.wixstatic.com/media/02d13f_e834db6558164e448bf52cb3d492f630~mv2.jpg/v1/fill/w_568,h_368,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/02d13f_e834db6558164e448bf52cb3d492f630~mv2.jpg',
  'Laksa': 'https://www.homiah.com/cdn/shop/articles/Laksa-Recipes_Page.jpg',
  'Lamington': 'https://www.rainbownourishments.com/wp-content/uploads/2021/02/vegan-lamington-stack.jpg',
  'Lomo Saltado': 'https://www.chilipeppermadness.com/wp-content/uploads/2021/07/Lomo-Saltado-SQ.jpg',
  'Maine Lobster Roll': 'https://umamigirl.com/wp-content/uploads/2016/09/Best-Lobster-Roll-Recipe-Maine-Style-Umami-Girl-1200-5.jpg',
  'Masala Dosa': 'https://www.daringgourmet.com/wp-content/uploads/2023/06/Dosa-Recipe-3.jpg',
  'Matsutake Mushroom': 'https://foragerchef.com/wp-content/uploads/2017/08/matsutake-mushrooms-baked-in-parchment-4.jpg',
  'Mole Negro': 'https://www.feastingathome.com/wp-content/uploads/2021/10/Mole-Negro-18.jpg',
  'Momos': 'https://www.thespruceeats.com/thmb/UnVh_-znw7ikMUciZIx5sNqBtTU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/steamed-momos-wontons-1957616-hero-01-1c59e22bad0347daa8f0dfe12894bc3c.jpg',
  'Moroccan Tagine': 'https://www.fromachefskitchen.com/wp-content/uploads/2025/02/Moroccan-Potato-Tagine-15.jpeg',
  'Moules Frites': 'https://hips.hearstapps.com/hmg-prod/images/delish-202104-moulesfrites-067-1620953990.jpg',
  'Nasi Goreng': 'https://www.kitchensanctuary.com/wp-content/uploads/2020/07/Nasi-Goreng-square-FS-57.jpg',
  'Nasi Lemak': 'https://www.elmundoeats.com/wp-content/uploads/2021/02/FP-Nasi-lemak-with-all-its-trimmings.jpg',
  'New England Clam Chowder': 'https://www.tasteofhome.com/wp-content/uploads/2018/01/Contest-Winning-New-England-Clam-Chowder_EXPS_FT24_41095_EC_021424_3.jpg',
  'Ortolan Bunting': 'https://birdoftheweek.home.blog/wp-content/uploads/2019/12/cooked.jpg',
  'Pad Thai': 'https://inquiringchef.com/wp-content/uploads/2023/02/Authentic-Pad-Thai_square-1908.jpg',
  'Paella Valenciana': 'https://spanishsabores.com/wp-content/uploads/2021/05/paella-valenciana.jpeg',
  'Pata Negra Jamon Bellota': 'https://jamon.co.uk/cdn/shop/articles/shutterstock_1111050767-1024x683_1024x.jpg?v=1647199129',
  'Perigord Black Truffle': 'https://oldworldtruffles.com/cdn/shop/files/owt_2022_BlackTruffle_4_800x.jpg?v=1694098687',
  'Peyote Cactus Ceremonial Meal': 'https://live-production.wcms.abc-cdn.net.au/cecf42c7d00dd9a838788444e7d53663?impolicy=wcms_crop_resize&cropH=1513&cropW=2270&xPos=15&yPos=0&width=862&height=575',
  'Pho Bo': 'https://farm8.staticflickr.com/7087/7174177733_6c0af1a0b2_b.jpg',
  'Pierogi': 'https://www.recipetineats.com/uploads/2023/10/Pierogi-ruskies_5.jpg',
  'Pizza Napoletana': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxr7oKmYlcr_Izica5FKm6vhvsmFQqhOJMFA&s',
  'Poutine': 'https://img.cooklaif.com/img/rs:fill:632:632/f:webp/plain/https://bucket.cooklaif.com/1077-classic-canadian-poutine-1077.jpg',
  'Ramen': 'https://www.skinnytaste.com/wp-content/uploads/2024/10/Slow-Cooker-Beef-Ramen-21.jpg',
  'Roti Canai': 'https://www.theflavorbender.com/wp-content/uploads/2021/09/Roti-Canai-6501-2.jpg',
  'Saltimbocca alla Romana': 'https://donalskehan.com/wp-content/uploads/Saltimbocca-copy.jpg',
  'Samosa': 'https://images.food52.com/8iP_EISD5yzDr5yGIn1YjlBUSOk=/adeb0387-7f2b-4488-8ffc-fd57d60e9b53--2DAC6993-9506-4685-A875-EB8A9E575759.jpeg',
  'Satay': 'https://www.elmundoeats.com/wp-content/uploads/2024/07/Malaysian-chicken-satay-with-peanut-sauce.jpg',
  'Seafood Paella': 'https://tastesbetterfromscratch.com/wp-content/uploads/2020/04/Paella-7.jpg',
  'Shark Fin Soup': 'https://asiasociety.org/sites/default/files/styles/1200w/public/S/sharkfin.jpg',
  'Som Tam Green Papaya Salad': 'https://hot-thai-kitchen.com/wp-content/uploads/2016/06/papaya-salad-new-sq.jpg',
  'Sushi Omakase': 'https://images.lifestyleasia.com/wp-content/uploads/sites/6/2020/02/12162736/sushi-jiro-1-1350x900.jpg',
  'Swedish Smorgasbord': 'https://www.campervansweden.com/assets/img/blog/610/swedish-smorgasbord-how-to.jpg',
  'Takoyaki': 'https://s.hungryghostfoodandtravel.com/media/20240912224148/takoyaki-recipe_done.png',
  'Tamal': 'https://www.tasteofhome.com/wp-content/uploads/2018/01/Chicken-Tamales_EXPS_TOHAM25_50905_P2_MD_04_17_3b.jpg',
  'Tandoori Chicken': 'https://thebigmansworld.com/wp-content/uploads/2025/02/tandoori-chicken-recipe.jpg',
  'Tom Yum Goong': 'https://www.recipetineats.com/tachyon/2019/09/Tom-Yum-soup_2.jpg',
  'Truffle Pasta Alba': 'https://i0.wp.com/themaplecuttingboard.com/wp-content/uploads/2019/12/White-Alba-Truffle-2.jpg',
  'Tsukemen Dipping Ramen': 'https://www.justonecookbook.com/wp-content/uploads/2023/04/Tsukemen-Dipping-Ramen-Noodles-8172-V.jpg',
  'Tzatziki': 'https://joyfoodsunshine.com/wp-content/uploads/2016/06/tzatziki-sauce-recipe-1.jpg',
  'Unagi Kabayaki': 'https://sudachirecipes.com/wp-content/uploads/2024/08/eggplant-kabayaki-06.jpg',
  'Valrhona Chocolate': 'https://www.sodiaal.co.uk/uploads/images/Valrhona-Chocolate-Profiteroles-1.png',
  'Wiener Schnitzel': 'https://germangirlinamerica.com/wp-content/uploads/wiener-schnitzel-1-a-e1660175317212.jpg',
  'Witchetty Grub': 'https://www.diabetes.org.uk/sites/default/files/migration/recipes/HALLOWEEN%2520WITCHETY%2520GRUBS%2520IN%2520SWAMP%2520SAUCE.jpg',
  'Xiaolongbao Soup Dumplings': 'https://static01.nyt.com/images/2024/02/08/multimedia/ND-SoupDumplings1-zgvf/ND-SoupDumplings1-zgvf-jumbo.jpg',
  'Yakitori': 'https://hips.hearstapps.com/hmg-prod/images/chicken-yakitori-index-65e738c4f032e.jpg',
  'Zaatar Manakish': 'https://www.cookinwithmima.com/wp-content/uploads/2021/04/zaatar-manaeesh-773x1024.jpg',
  'Zongzi Dragon Boat Dumplings': 'https://www.discoverhongkong.com/content/dam/dhk/intl/explore/dining/fantastic-zongzi-and-where-to-find-them/chiuchow-style-zongzi-960x720.jpg',
}
/** slug 매칭용 (DB title_en 변형 시). FOODS_USER_DIRECT_IMAGES와 동기화 */
const FOODS_USER_DIRECT_BY_SLUG: Record<string, string> = {
  'a5-wagyu-beef': 'https://www.japanesefoodguide.com/wp-content/uploads/2021/08/a5-wagyu-slices.jpg',
  'acai-bowl': 'https://www.twopeasandtheirpod.com/wp-content/uploads/2023/06/Acai-Bowl-10.jpg',
  'alaskan-king-crab': 'https://crabs.com/cdn/shop/articles/MERCURY_studio_1_3ab95be5-3d54-48fa-b805-9010747c0133_2100x.jpg?v=1767995024',
  'arancini': 'https://www.allrecipes.com/thmb/hxUMuQmebF0imzrV0-dLQRBGK08=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/RM-57844-Arancini-ddmfs-3x4-6021-19619bf1fd4d41279000e464618dd411.jpg',
  'baklava': 'https://www.allrecipes.com/thmb/Ms72N88Kcd8ew0_Yv_LFHiQQ8hk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/7495495-easy-baklava-atk-1x1-1-5ff8675aa73f4c4bbb221dc84b77b98b.jpg',
  'balut-duck-embryo': 'https://modernfarmer.com/wp-content/uploads/2014/04/balut-hero.jpg',
  'beef-rendang': 'https://www.elmundoeats.com/wp-content/uploads/2023/04/A-bowl-of-beef-rendang.jpg',
  'beluga-caviar': 'https://www.gourmetfoodstore.com/images/product/large/what-is-beluga-caviar-15951-1S-5951.jpg',
  'bibimbap': 'https://www.thespruceeats.com/thmb/r2bG-lIQYgLYecbnwOW36hiLuk8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/classic-korean-bibimbap-recipe-2118765-hero-01-091c0e0f8c20426d8f70747955efa61d.jpg',
  'birria-tacos': 'https://keviniscooking.com/wp-content/uploads/2023/08/Quesabirria-Tacos-square.jpg',
  'bouillabaisse': 'https://littleferrarokitchen.com/wp-content/uploads/2023/05/French-seafood-stew-with-fennel.jpg',
  'brazilian-churrasco': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGohlSe3I3IW5enjEUJz2dtfJlrWCadnbsuA&s',
  'bunny-chow': 'https://myconvenientkitchen.com/wp-content/uploads/2024/07/South-African-bunny-chow.jpg',
  'ceviche': 'https://www.mylatinatable.com/wp-content/uploads/2017/05/Shrimp-Ceviche-Mexican-Style-Ceviche-Recipe-1-1024x772.jpg',
  'char-siu-bbq-pork': 'https://curatedkitchenware.com/cdn/shop/articles/20241120144335-how-to-make-chinese-cantonese-bbq-roasted-pork-char-siu-recipe.png?v=1758857743',
  'chimichanga': 'https://www.lemontreedwelling.com/wp-content/uploads/2021/02/chimichangas-featured.jpg',
  'congee-jook': 'https://healthynibblesandbits.com/wp-content/uploads/2019/03/Basic-Congee-Recipe-1.jpg',
  'coq-au-vin': 'https://www.recipetineats.com/uploads/2016/09/Coq-au-Vin_00.jpg',
  'currywurst': 'https://ychef.files.bbci.co.uk/1280x720/p03ygdrq.jpg',
  'birds-nest-soup': 'https://cdn.shopify.com/s/files/1/0608/9195/5440/files/Blog_Easy-Recipe_How-to-Cook-Bird_s-Nest-Soup_2_1280-x-900px.jpg?v=1689933285',
  'cuy-roasted-guinea-pig': 'https://www.eatperu.com/wp-content/uploads/2016/12/Grilled-guinea-pig-dish-peruvian-Andes-Cuzco-Peru.jpg',
  'dom-perignon-champagne': 'https://www.thedenizen.co.nz/wp-content/uploads/2025/10/feature-6.jpg',
  'doner-kebab': 'https://thecookingfoodie.com/wp-content/uploads/2025/11/viral-doner-kebab-recipe-500x500.jpg',
  'durian-king-of-fruits': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-c1nExk6tTHAbcc9jtHGnx6MinvaVqnUDtA&s',
  'eggs-benedict': 'https://tatyanaseverydayfood.com/wp-content/uploads/2024/12/Crab-Eggs-Benedict-with-Caviar-Recipe-6.jpg',
  'empanada': 'https://cdn-ilddihb.nitrocdn.com/MgqZCGPEMHvMRLsisMUCAIMWvgGMxqaj/assets/images/optimized/rev-b472ba7/www.goya.com/wp-content/uploads/2023/10/chipotle-chicken-empanadas-900x900.jpg',
  'escargot': 'https://legallyhealthyblonde.com/wp-content/uploads/2022/09/escargot-featured.jpg',
  'feijoada': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSD5DlJgZ5N6wHVSN0Ibdt-uBGfu5xwco0XXA&s',
  'fish-and-chips': 'https://tastesbetterfromscratch.com/wp-content/uploads/2022/03/Fish-and-Chips-Web-8.jpg',
  'french-croissant': 'https://www.theflavorbender.com/wp-content/uploads/2020/05/French-Croissants-SM-2363.jpg',
  'fresh-pacific-oysters': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgyqOlzr_MveacQRqY52WDw6dbR5jZjqHxMg&s',
  'full-turkish-breakfast': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuW5vr5hMJx1yFcK3DKzRlgAMvqoGc1DNPDA&s',
  'gelato': 'https://www.goodlifeeats.com/wp-content/uploads/2022/06/Strawberry-Gelato-Recipe-735x951.jpg',
  'greek-mezze-spread': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxnNnpcXtzMSJGxWYy56_wDUf4iRJyeznuEw&s',
  'foie-gras': 'https://leitesculinaria.com/wp-content/uploads/2022/12/pan-seared-foie-gras.jpg',
  'fugu-puffer-fish': 'https://cdn.shopify.com/s/files/1/0068/0394/7579/files/Fugu_Sashimi_2.jpg?v=1751065885',
  'fugu-shirako': 'https://www.foodinjapan.org/wp-content/uploads/2024/05/fugu-shirako.jpg',
  'haggis': 'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2012/6/26/0/FN_haggis_s4x3.jpg.rend.hgtvcom.1280.960.suffix/1371606753626.webp',
  'hakata-tonkotsu-ramen': 'https://rwk-j9.com/wp-content/uploads/2021/07/210716_04-15-1024x683.jpg',
  'hakarl-fermented-greenland-shark': 'https://www.youngpioneertours.com/wp-content/uploads/2020/07/hakarl.jpg',
  'hu-tieu-nam-vang': 'https://vietasiatravel.com/uploads/Travel_guide/Hu-tieu-nam-vang.jpg',
  'hungarian-goulash': 'https://www.billyparisi.com/wp-content/uploads/2021/10/goulash-1.jpg',
  'iberico-ham': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSi7AfoMoWakXZ8bS2gO3I-u1NYKagavtsuvA&s',
  'indomie-mi-goreng': 'https://m.media-amazon.com/images/I/61tVFVtwsoL._SL1000_.jpg',
  'injera-with-wat': 'https://www.crazy-cucumber.com/wp-content/uploads/2021/05/BV3A39901.jpg',
  'jerk-chicken': 'https://hips.hearstapps.com/hmg-prod/images/jamaican-jerk-chicken1-1662431390.jpg',
  'jollof-rice': 'https://allnigerianfoods.com/wp-content/uploads/jollof_rice_recipe1.jpg',
  'katsudon': 'https://sudachirecipes.com/wp-content/uploads/2020/04/katsudon-sqr.jpg',
  'khachapuri': 'https://whiskedawaykitchen.com/wp-content/uploads/2024/04/georgian-khachapuri-recipe-18.jpg',
  'khao-niao-mamuang-mango-sticky-rice': 'https://i0.wp.com/www.shanazrafiq.com/wp-content/uploads/2018/07/1-DSC_0015-1.jpg',
  'kimchi': 'https://www.maangchi.com/wp-content/uploads/2014/06/whole-cabbage-kimchi.jpg',
  'kopi-luwak-civet-coffee': 'https://static.wixstatic.com/media/02d13f_e834db6558164e448bf52cb3d492f630~mv2.jpg/v1/fill/w_568,h_368,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/02d13f_e834db6558164e448bf52cb3d492f630~mv2.jpg',
  'laksa': 'https://www.homiah.com/cdn/shop/articles/Laksa-Recipes_Page.jpg',
  'lamington': 'https://www.rainbownourishments.com/wp-content/uploads/2021/02/vegan-lamington-stack.jpg',
  'lomo-saltado': 'https://www.chilipeppermadness.com/wp-content/uploads/2021/07/Lomo-Saltado-SQ.jpg',
  'maine-lobster-roll': 'https://umamigirl.com/wp-content/uploads/2016/09/Best-Lobster-Roll-Recipe-Maine-Style-Umami-Girl-1200-5.jpg',
  'masala-dosa': 'https://www.daringgourmet.com/wp-content/uploads/2023/06/Dosa-Recipe-3.jpg',
  'matsutake-mushroom': 'https://foragerchef.com/wp-content/uploads/2017/08/matsutake-mushrooms-baked-in-parchment-4.jpg',
  'mole-negro': 'https://www.feastingathome.com/wp-content/uploads/2021/10/Mole-Negro-18.jpg',
  'momos': 'https://www.thespruceeats.com/thmb/UnVh_-znw7ikMUciZIx5sNqBtTU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/steamed-momos-wontons-1957616-hero-01-1c59e22bad0347daa8f0dfe12894bc3c.jpg',
  'moroccan-tagine': 'https://www.fromachefskitchen.com/wp-content/uploads/2025/02/Moroccan-Potato-Tagine-15.jpeg',
  'moules-frites': 'https://hips.hearstapps.com/hmg-prod/images/delish-202104-moulesfrites-067-1620953990.jpg',
  'nasi-goreng': 'https://www.kitchensanctuary.com/wp-content/uploads/2020/07/Nasi-Goreng-square-FS-57.jpg',
  'nasi-lemak': 'https://www.elmundoeats.com/wp-content/uploads/2021/02/FP-Nasi-lemak-with-all-its-trimmings.jpg',
  'new-england-clam-chowder': 'https://www.tasteofhome.com/wp-content/uploads/2018/01/Contest-Winning-New-England-Clam-Chowder_EXPS_FT24_41095_EC_021424_3.jpg',
  'ortolan-bunting': 'https://birdoftheweek.home.blog/wp-content/uploads/2019/12/cooked.jpg',
  'pad-thai': 'https://inquiringchef.com/wp-content/uploads/2023/02/Authentic-Pad-Thai_square-1908.jpg',
  'paella-valenciana': 'https://spanishsabores.com/wp-content/uploads/2021/05/paella-valenciana.jpeg',
  'pata-negra-jamon-bellota': 'https://jamon.co.uk/cdn/shop/articles/shutterstock_1111050767-1024x683_1024x.jpg?v=1647199129',
  'perigord-black-truffle': 'https://oldworldtruffles.com/cdn/shop/files/owt_2022_BlackTruffle_4_800x.jpg?v=1694098687',
  'peyote-cactus-ceremonial-meal': 'https://live-production.wcms.abc-cdn.net.au/cecf42c7d00dd9a838788444e7d53663?impolicy=wcms_crop_resize&cropH=1513&cropW=2270&xPos=15&yPos=0&width=862&height=575',
  'pho-bo': 'https://farm8.staticflickr.com/7087/7174177733_6c0af1a0b2_b.jpg',
  'pierogi': 'https://www.recipetineats.com/uploads/2023/10/Pierogi-ruskies_5.jpg',
  'pizza-napoletana': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxr7oKmYlcr_Izica5FKm6vhvsmFQqhOJMFA&s',
  'poutine': 'https://img.cooklaif.com/img/rs:fill:632:632/f:webp/plain/https://bucket.cooklaif.com/1077-classic-canadian-poutine-1077.jpg',
  'ramen': 'https://www.skinnytaste.com/wp-content/uploads/2024/10/Slow-Cooker-Beef-Ramen-21.jpg',
  'roti-canai': 'https://www.theflavorbender.com/wp-content/uploads/2021/09/Roti-Canai-6501-2.jpg',
  'saltimbocca-alla-romana': 'https://donalskehan.com/wp-content/uploads/Saltimbocca-copy.jpg',
  'samosa': 'https://images.food52.com/8iP_EISD5yzDr5yGIn1YjlBUSOk=/adeb0387-7f2b-4488-8ffc-fd57d60e9b53--2DAC6993-9506-4685-A875-EB8A9E575759.jpeg',
  'satay': 'https://www.elmundoeats.com/wp-content/uploads/2024/07/Malaysian-chicken-satay-with-peanut-sauce.jpg',
  'seafood-paella': 'https://tastesbetterfromscratch.com/wp-content/uploads/2020/04/Paella-7.jpg',
  'shark-fin-soup': 'https://asiasociety.org/sites/default/files/styles/1200w/public/S/sharkfin.jpg',
  'som-tam-green-papaya-salad': 'https://hot-thai-kitchen.com/wp-content/uploads/2016/06/papaya-salad-new-sq.jpg',
  'sushi-omakase': 'https://images.lifestyleasia.com/wp-content/uploads/sites/6/2020/02/12162736/sushi-jiro-1-1350x900.jpg',
  'swedish-smorgasbord': 'https://www.campervansweden.com/assets/img/blog/610/swedish-smorgasbord-how-to.jpg',
  'takoyaki': 'https://s.hungryghostfoodandtravel.com/media/20240912224148/takoyaki-recipe_done.png',
  'tamal': 'https://www.tasteofhome.com/wp-content/uploads/2018/01/Chicken-Tamales_EXPS_TOHAM25_50905_P2_MD_04_17_3b.jpg',
  'tandoori-chicken': 'https://thebigmansworld.com/wp-content/uploads/2025/02/tandoori-chicken-recipe.jpg',
  'tom-yum-goong': 'https://www.recipetineats.com/tachyon/2019/09/Tom-Yum-soup_2.jpg',
  'truffle-pasta-alba': 'https://i0.wp.com/themaplecuttingboard.com/wp-content/uploads/2019/12/White-Alba-Truffle-2.jpg',
  'tsukemen-dipping-ramen': 'https://www.justonecookbook.com/wp-content/uploads/2023/04/Tsukemen-Dipping-Ramen-Noodles-8172-V.jpg',
  'tzatziki': 'https://joyfoodsunshine.com/wp-content/uploads/2016/06/tzatziki-sauce-recipe-1.jpg',
  'unagi-kabayaki': 'https://sudachirecipes.com/wp-content/uploads/2024/08/eggplant-kabayaki-06.jpg',
  'valrhona-chocolate': 'https://www.sodiaal.co.uk/uploads/images/Valrhona-Chocolate-Profiteroles-1.png',
  'wiener-schnitzel': 'https://germangirlinamerica.com/wp-content/uploads/wiener-schnitzel-1-a-e1660175317212.jpg',
  'witchetty-grub': 'https://www.diabetes.org.uk/sites/default/files/migration/recipes/HALLOWEEN%2520WITCHETY%2520GRUBS%2520IN%2520SWAMP%2520SAUCE.jpg',
  'xiaolongbao-soup-dumplings': 'https://static01.nyt.com/images/2024/02/08/multimedia/ND-SoupDumplings1-zgvf/ND-SoupDumplings1-zgvf-jumbo.jpg',
  'yakitori': 'https://hips.hearstapps.com/hmg-prod/images/chicken-yakitori-index-65e738c4f032e.jpg',
  'zaatar-manakish': 'https://www.cookinwithmima.com/wp-content/uploads/2021/04/zaatar-manaeesh-773x1024.jpg',
  'zongzi-dragon-boat-dumplings': 'https://www.discoverhongkong.com/content/dam/dhk/intl/explore/dining/fantastic-zongzi-and-where-to-find-them/chiuchow-style-zongzi-960x720.jpg',
}

/** 100 Foods: 사용자 URL 없을 때만 사용. Unsplash CDN 폴백. */
const FOODS_UNSPLASH_POOL = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
  'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400',
  'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400',
  'https://images.unsplash.com/photo-1638866281450-3933540af86a?w=400',
  'https://images.unsplash.com/photo-1591325418441-ff678baf78ef?w=400',
  'https://images.unsplash.com/photo-1618889482923-38250401a84e?w=400',
  'https://images.unsplash.com/photo-1617421753170-46511a8d73fc?w=400',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400',
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
  'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400',
  'https://images.unsplash.com/photo-1604329760661-e71dc83f2b26?w=400',
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
  'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
  'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400',
  'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
  'https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=400',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
  'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400',
  'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400',
  'https://images.unsplash.com/photo-1638866281450-3933540af86a?w=400',
  'https://images.unsplash.com/photo-1591325418441-ff678baf78ef?w=400',
  'https://images.unsplash.com/photo-1618889482923-38250401a84e?w=400',
  'https://images.unsplash.com/photo-1617421753170-46511a8d73fc?w=400',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400',
  'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400',
] as const
const FOODS_DIRECT_IMAGES: Record<string, string> = {
  'A5 Wagyu Beef':              FOODS_UNSPLASH_POOL[0],
  'Alaskan King Crab':          FOODS_UNSPLASH_POOL[1],
  'Arancini':                   FOODS_UNSPLASH_POOL[2],
  'Baklava':                    FOODS_UNSPLASH_POOL[3],
  'Balut Duck Embryo':          FOODS_UNSPLASH_POOL[4],
  'Beef Rendang':               FOODS_UNSPLASH_POOL[5],
  'Beluga Caviar':              FOODS_UNSPLASH_POOL[6],
  'Bibimbap':                   FOODS_UNSPLASH_POOL[7],
  'Bird\'s Nest Soup':          FOODS_UNSPLASH_POOL[8],
  'Bouillabaisse':              FOODS_UNSPLASH_POOL[9],
  'Brazilian Churrasco':        FOODS_UNSPLASH_POOL[10],
  'Ceviche':                    FOODS_UNSPLASH_POOL[11],
  'Char Siu BBQ Pork':          FOODS_UNSPLASH_POOL[12],
  'Chimichanga':                FOODS_UNSPLASH_POOL[13],
  'Congee Jook':                FOODS_UNSPLASH_POOL[14],
  'Coq au Vin':                 FOODS_UNSPLASH_POOL[15],
  'Cuy Roasted Guinea Pig':     FOODS_UNSPLASH_POOL[16],
  'Doner Kebab':                FOODS_UNSPLASH_POOL[17],
  'Durian King of Fruits':      FOODS_UNSPLASH_POOL[18],
  'Eggs Benedict':              FOODS_UNSPLASH_POOL[19],
  'Empanada':                   FOODS_UNSPLASH_POOL[20],
  'Escargot':                   FOODS_UNSPLASH_POOL[21],
  'Fish and Chips':             FOODS_UNSPLASH_POOL[22],
  'Foie Gras':                  FOODS_UNSPLASH_POOL[23],
  'French Croissant':           FOODS_UNSPLASH_POOL[24],
  'Fugu Puffer Fish':            FOODS_UNSPLASH_POOL[25],
  'Full Turkish Breakfast':     FOODS_UNSPLASH_POOL[26],
  'Gelato':                     FOODS_UNSPLASH_POOL[27],
  'Greek Mezze Spread':         FOODS_UNSPLASH_POOL[28],
  'Haggis':                     FOODS_UNSPLASH_POOL[29],
  'Hakarl Fermented Greenland Shark': FOODS_UNSPLASH_POOL[30],
  'Hakata Tonkotsu Ramen':       FOODS_UNSPLASH_POOL[31],
  'Hungarian Goulash':          FOODS_UNSPLASH_POOL[32],
  'Iberico Ham':                FOODS_UNSPLASH_POOL[33],
  'Injera with Wat':            FOODS_UNSPLASH_POOL[34],
  'Jerk Chicken':               FOODS_UNSPLASH_POOL[35],
  'Jollof Rice':                FOODS_UNSPLASH_POOL[36],
  'Khachapuri':                 FOODS_UNSPLASH_POOL[37],
  'Kimchi':                     FOODS_UNSPLASH_POOL[38],
  'Laksa':                      FOODS_UNSPLASH_POOL[39],
  'Maine Lobster Roll':         FOODS_UNSPLASH_POOL[40],
  'Masala Dosa':                FOODS_UNSPLASH_POOL[41],
  'Matsutake Mushroom':         FOODS_UNSPLASH_POOL[42],
  'Mole Negro':                 FOODS_UNSPLASH_POOL[43],
  'Momos':                      FOODS_UNSPLASH_POOL[44],
  'Moroccan Tagine':            FOODS_UNSPLASH_POOL[45],
  'Moules Frites':              FOODS_UNSPLASH_POOL[46],
  'Nasi Goreng':                FOODS_UNSPLASH_POOL[47],
  'New England Clam Chowder':   FOODS_UNSPLASH_POOL[48],
  'Ortolan Bunting':            FOODS_UNSPLASH_POOL[49],
  'Pad Thai':                   FOODS_UNSPLASH_POOL[0],
  'Paella Valenciana':          FOODS_UNSPLASH_POOL[1],
  'Pata Negra Jamon Bellota':   FOODS_UNSPLASH_POOL[2],
  'Perigord Black Truffle':      FOODS_UNSPLASH_POOL[3],
  'Pho Bo':                     FOODS_UNSPLASH_POOL[4],
  'Pierogi':                    FOODS_UNSPLASH_POOL[5],
  'Pizza Napoletana':           FOODS_UNSPLASH_POOL[6],
  'Poutine':                    FOODS_UNSPLASH_POOL[7],
  'Ramen':                      FOODS_UNSPLASH_POOL[8],
  'Roti Canai':                 FOODS_UNSPLASH_POOL[9],
  'Saltimbocca alla Romana':    FOODS_UNSPLASH_POOL[10],
  'Samosa':                     FOODS_UNSPLASH_POOL[11],
  'Satay':                      FOODS_UNSPLASH_POOL[12],
  'Seafood Paella':             FOODS_UNSPLASH_POOL[13],
  'Shark Fin Soup':             FOODS_UNSPLASH_POOL[14],
  'Som Tam Green Papaya Salad': FOODS_UNSPLASH_POOL[15],
  'Swedish Smorgasbord':        FOODS_UNSPLASH_POOL[16],
  'Sushi Omakase':              FOODS_UNSPLASH_POOL[17],
  'Takoyaki':                   FOODS_UNSPLASH_POOL[18],
  'Tamal':                      FOODS_UNSPLASH_POOL[19],
  'Tandoori Chicken':           FOODS_UNSPLASH_POOL[20],
  'Tom Yum Goong':              FOODS_UNSPLASH_POOL[21],
  'Truffle Pasta Alba':         FOODS_UNSPLASH_POOL[22],
  'Tsukemen Dipping Ramen':     FOODS_UNSPLASH_POOL[23],
  'Tzatziki':                    FOODS_UNSPLASH_POOL[24],
  'Unagi Kabayaki':             FOODS_UNSPLASH_POOL[25],
  'Valrhona Chocolate':         FOODS_UNSPLASH_POOL[26],
  'Wiener Schnitzel':           FOODS_UNSPLASH_POOL[27],
  'Witchetty Grub':             FOODS_UNSPLASH_POOL[28],
  'Xiaolongbao Soup Dumplings': FOODS_UNSPLASH_POOL[29],
  'Yakitori':                   FOODS_UNSPLASH_POOL[30],
  'Zaatar Manakish':            FOODS_UNSPLASH_POOL[31],
  'Zongzi Dragon Boat Dumplings': FOODS_UNSPLASH_POOL[32],
  'Acai Bowl':                  FOODS_UNSPLASH_POOL[33],
  'Birria Tacos':               FOODS_UNSPLASH_POOL[34],
  'Bunny Chow':                 FOODS_UNSPLASH_POOL[35],
  'Currywurst':                 FOODS_UNSPLASH_POOL[36],
  'Dom Perignon Champagne':     FOODS_UNSPLASH_POOL[37],
  'Feijoada':                   FOODS_UNSPLASH_POOL[38],
  'Fresh Pacific Oysters':      FOODS_UNSPLASH_POOL[39],
  'Fugu Shirako':               FOODS_UNSPLASH_POOL[40],
  'Hu Tieu Nam Vang':           FOODS_UNSPLASH_POOL[41],
  'Indomie Mi Goreng':          FOODS_UNSPLASH_POOL[42],
  'Katsudon':                   FOODS_UNSPLASH_POOL[43],
  'Khao Niao Mamuang (Mango Sticky Rice)': FOODS_UNSPLASH_POOL[44],
  'Kopi Luwak Civet Coffee':    FOODS_UNSPLASH_POOL[45],
  'Lamington':                  FOODS_UNSPLASH_POOL[46],
  'Lomo Saltado':               FOODS_UNSPLASH_POOL[47],
  'Nasi Lemak':                 FOODS_UNSPLASH_POOL[48],
  'Peyote Cactus Ceremonial Meal': FOODS_UNSPLASH_POOL[49],
}

/** findImage에서 잘 안 나오는 항목 폴백. Unsplash 풀 사용 */
const FOODS_DIRECT_FALLBACK: Record<string, string> = {
  'Roti Canai': FOODS_UNSPLASH_POOL[9], 'Saltimbocca alla Romana': FOODS_UNSPLASH_POOL[10], 'Som Tam Green Papaya Salad': FOODS_UNSPLASH_POOL[15], 'Swedish Smorgasbord': FOODS_UNSPLASH_POOL[16], 'Takoyaki': FOODS_UNSPLASH_POOL[18], 'Tamal': FOODS_UNSPLASH_POOL[19], 'Truffle Pasta Alba': FOODS_UNSPLASH_POOL[22], 'Tsukemen Dipping Ramen': FOODS_UNSPLASH_POOL[23], 'Xiaolongbao Soup Dumplings': FOODS_UNSPLASH_POOL[29], 'Zongzi Dragon Boat Dumplings': FOODS_UNSPLASH_POOL[32], 'roti-canai': FOODS_UNSPLASH_POOL[9], 'saltimbocca-alla-romana': FOODS_UNSPLASH_POOL[10], 'som-tam-green-papaya-salad': FOODS_UNSPLASH_POOL[15], 'swedish-smorgasbord': FOODS_UNSPLASH_POOL[16], 'takoyaki': FOODS_UNSPLASH_POOL[18], 'tamal': FOODS_UNSPLASH_POOL[19], 'truffle-pasta-alba': FOODS_UNSPLASH_POOL[22], 'tsukemen-dipping-ramen': FOODS_UNSPLASH_POOL[23], 'xiaolongbao-soup-dumplings': FOODS_UNSPLASH_POOL[29], 'zongzi-dragon-boat-dumplings': FOODS_UNSPLASH_POOL[32], 'dom-perignon-champagne': FOODS_UNSPLASH_POOL[37],
}

/** slug → 숫자 해시 (같은 항목은 항상 같은 이미지) */
function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** DB 인코딩/따옴표 차이 시 slug로 매칭 */
function toSlug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // 악센트 제거 (é→e, ç→c)
    .replace(/[\u2018\u2019\u201A\u201B\u2032']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** slug → Unsplash 풀 인덱스 (다이렉트만 사용, 검색 없음) */
const FOODS_DIRECT_BY_SLUG: Record<string, string> = Object.fromEntries(
  ['ortolan-bunting', 'cuy-roasted-guinea-pig', 'kopi-luwak-civet-coffee', 'birds-nest-soup', 'foie-gras', 'iberico-ham', 'pata-negra-jamon-bellota', 'acai-bowl', 'beef-rendang', 'bunny-chow', 'empanada', 'french-croissant', 'fresh-pacific-oysters', 'greek-mezze-spread', 'lomo-saltado', 'masala-dosa', 'unagi-kabayaki', 'valrhona-chocolate', 'yakitori', 'a5-wagyu-beef', 'alaskan-king-crab', 'arancini', 'baklava', 'balut-duck-embryo', 'beluga-caviar', 'bibimbap', 'birria-tacos', 'bouillabaisse', 'brazilian-churrasco', 'ceviche', 'char-siu-bbq-pork', 'chimichanga', 'congee-jook', 'coq-au-vin', 'currywurst', 'dom-perignon-champagne', 'doner-kebab', 'durian-king-of-fruits', 'eggs-benedict', 'escargot', 'feijoada', 'fish-and-chips', 'fugu-puffer-fish', 'fugu-shirako', 'full-turkish-breakfast', 'gelato', 'haggis', 'hakata-tonkotsu-ramen', 'hakarl-fermented-greenland-shark', 'hu-tieu-nam-vang', 'hungarian-goulash', 'injera-with-wat', 'indomie-mi-goreng', 'jerk-chicken', 'jollof-rice', 'katsudon', 'khachapuri', 'khao-niao-mamuang-mango-sticky-rice', 'khao-niao-mamuang', 'kimchi', 'laksa', 'lamington', 'maine-lobster-roll', 'matsutake-mushroom', 'mole-negro', 'momos', 'moroccan-tagine', 'moules-frites', 'nasi-goreng', 'nasi-lemak', 'new-england-clam-chowder', 'pad-thai', 'paella-valenciana', 'perigord-black-truffle', 'peyote-cactus-ceremonial-meal', 'pho-bo', 'pierogi', 'pizza-napoletana', 'poutine', 'ramen', 'roti-canai', 'saltimbocca-alla-romana', 'saltimbocca', 'samosa', 'satay', 'seafood-paella', 'shark-fin-soup', 'som-tam-green-papaya-salad', 'som-tam', 'swedish-smorgasbord', 'sushi-omakase', 'takoyaki', 'tamal', 'tandoori-chicken', 'tom-yum-goong', 'truffle-pasta-alba', 'tsukemen-dipping-ramen', 'tsukemen', 'tzatziki', 'wiener-schnitzel', 'witchetty-grub', 'xiaolongbao-soup-dumplings', 'xiaolongbao', 'zaatar-manakish', 'zongzi-dragon-boat-dumplings', 'zongzi'].map((s) => [s, FOODS_UNSPLASH_POOL[simpleHash(s) % 50]])
)

const WIKI_ARTICLE_OVERRIDES: Record<string, string[]> = {
  // ══════════════════════════════════════════════════════════════
  // 100 FOODS — Wikipedia 문서명/검색어 지정 → 요리 이미지 확실히 확보
  // ══════════════════════════════════════════════════════════════
  'A5 Wagyu Beef':                      ['Wagyu', 'Kobe beef', 'Japanese beef'],
  'Acai Bowl':                          ['Acai berry', 'Açaí na tigela', 'Acai bowl food'],
  'Alaskan King Crab':                  ['King crab', 'Red king crab', 'Alaskan king crab'],
  'Arancini':                           ['Arancini', 'Sicilian rice ball'],
  'Baklava':                            ['Baklava', 'Turkish baklava'],
  'Balut Duck Embryo':                  ['Balut (food)', 'Balut', 'Filipino balut'],
  'Beef Rendang':                       ['Rendang', 'Indonesian rendang'],
  'Beluga Caviar':                      ['Caviar', 'Beluga caviar', 'Sturgeon caviar'],
  'Bibimbap':                           ['Bibimbap', 'Korean bibimbap'],
  'Bird\'s Nest Soup':                  ['Bird\'s nest soup', 'Edible bird\'s nest', 'Swiftlet nest'],
  'Birria Tacos':                       ['Birria', 'Birria taco', 'Goat birria'],
  'Bouillabaisse':                       ['Bouillabaisse', 'Marseille bouillabaisse'],
  'Brazilian Churrasco':                ['Churrasco', 'Brazilian barbecue', 'Rodizio'],
  'Bunny Chow':                         ['Bunny chow', 'Durban bunny chow', 'South African bunny chow'],
  'Ceviche':                            ['Ceviche', 'Peruvian ceviche', 'Fish ceviche'],
  'Char Siu BBQ Pork':                  ['Char siu', 'Cantonese barbecue pork', 'BBQ pork'],
  'Chimichanga':                        ['Chimichanga', 'Fried burrito'],
  'Congee Jook':                        ['Congee', 'Rice congee', 'Jook'],
  'Coq au Vin':                         ['Coq au vin', 'French coq au vin'],
  'Currywurst':                         ['Currywurst', 'Berlin currywurst'],
  'Cuy Roasted Guinea Pig':             ['Cuy (food)', 'Guinea pig as food', 'Peruvian cuy'],
  'Dom Perignon Champagne':             ['Dom Perignon', 'Dom Pérignon (wine)', 'Champagne bottle'],
  'Doner Kebab':                        ['Doner kebab', 'Döner kebab', 'Doner meat'],
  'Durian King of Fruits':              ['Durian', 'Durian fruit'],
  'Eggs Benedict':                      ['Eggs Benedict', 'Eggs benedict breakfast'],
  'Empanada':                           ['Empanada', 'Argentine empanada'],
  'Escargot':                           ['Escargot', 'Snail as food', 'French escargot'],
  'Feijoada':                           ['Feijoada', 'Brazilian feijoada', 'Black bean stew'],
  'Fish and Chips':                     ['Fish and chips', 'British fish and chips'],
  'Foie Gras':                          ['Foie gras', 'Duck foie gras'],
  'Fresh Pacific Oysters':              ['Oyster', 'Pacific oyster', 'Raw oyster'],
  'French Croissant':                   ['Croissant', 'French croissant'],
  'Fugu Puffer Fish':                   ['Fugu', 'Fugu (fish)', 'Pufferfish'],
  'Fugu Shirako':                       ['Shirako', 'Fugu', 'Fish milt'],
  'Full Turkish Breakfast':             ['Turkish breakfast', 'Kahvaltı', 'Turkish kahvalti'],
  'Gelato':                             ['Gelato', 'Italian gelato', 'Gelato ice cream'],
  'Greek Mezze Spread':                 ['Meze', 'Greek meze', 'Mediterranean meze'],
  'Haggis':                             ['Haggis', 'Scottish haggis'],
  'Hakata Tonkotsu Ramen':              ['Ramen', 'Tonkotsu ramen', 'Japanese ramen'],
  'Hakarl Fermented Greenland Shark':   ['Hákarl', 'Fermented shark', 'Icelandic hakarl'],
  'Hu Tieu Nam Vang':                   ['Hu tieu', 'Hủ tiếu', 'Vietnamese noodle soup'],
  'Hungarian Goulash':                  ['Goulash', 'Hungarian goulash', 'Gulyas'],
  'Iberico Ham':                        ['Jamón ibérico', 'Iberian ham', 'Spanish ham'],
  'Injera with Wat':                    ['Injera', 'Ethiopian cuisine', 'Ethiopian injera'],
  'Indomie Mi Goreng':                  ['Indomie', 'Mi goreng', 'Indonesian instant noodle'],
  'Jerk Chicken':                       ['Jerk chicken', 'Jerk (cooking)', 'Jamaican jerk chicken'],
  'Jollof Rice':                        ['Jollof rice', 'West African jollof'],
  'Katsudon':                           ['Katsudon', 'Japanese katsudon', 'Pork cutlet rice'],
  'Khachapuri':                         ['Khachapuri', 'Adjarian khachapuri', 'Georgian khachapuri'],
  'Khao Niao Mamuang (Mango Sticky Rice)': ['Mango sticky rice', 'Khao niao mamuang', 'Thai mango rice'],
  'Khao Niao Mamuang':                  ['Mango sticky rice', 'Khao niao mamuang', 'Thai mango rice'],
  'Kimchi':                             ['Kimchi', 'Korean kimchi'],
  'Kopi Luwak Civet Coffee':            ['Kopi luwak', 'Civet coffee', 'Indonesian coffee'],
  'Laksa':                              ['Laksa', 'Curry mee', 'Singapore laksa'],
  'Lamington':                          ['Lamington', 'Australian lamington', 'Lamington cake'],
  'Lomo Saltado':                       ['Lomo saltado', 'Peruvian lomo saltado'],
  'Maine Lobster Roll':                 ['Lobster roll', 'New England lobster roll', 'Lobster sandwich'],
  'Masala Dosa':                        ['Masala dosa', 'Dosa', 'Indian dosa'],
  'Matsutake Mushroom':                  ['Matsutake', 'Matsutake mushroom', 'Japanese mushroom'],
  'Mole Negro':                         ['Mole (sauce)', 'Mole negro', 'Oaxacan mole'],
  'Momos':                              ['Momo (food)', 'Nepalese momo', 'Tibetan momo'],
  'Moroccan Tagine':                    ['Tajine', 'Moroccan tagine', 'Tagine dish'],
  'Moules Frites':                      ['Moules-frites', 'Mussels and fries', 'Belgian mussels'],
  'Nasi Goreng':                        ['Nasi goreng', 'Indonesian fried rice'],
  'Nasi Lemak':                         ['Nasi lemak', 'Malaysian nasi lemak'],
  'New England Clam Chowder':           ['Clam chowder', 'New England clam chowder', 'Clam soup'],
  'Pad Thai':                           ['Pad thai', 'Thai pad thai', 'Stir fried noodles'],
  'Paella Valenciana':                  ['Paella', 'Paella valenciana', 'Spanish paella'],
  'Pata Negra Jamon Bellota':           ['Jamón ibérico', 'Bellota ham', 'Iberian ham'],
  'Perigord Black Truffle':             ['Black truffle', 'Tuber melanosporum', 'French truffle'],
  'Peyote Cactus Ceremonial Meal':       ['Peyote', 'Lophophora williamsii', 'Peyote cactus'],
  'Pho Bo':                             ['Pho', 'Phở', 'Vietnamese pho', 'Beef noodle soup'],
  'Pierogi':                            ['Pierogi', 'Polish pierogi', 'Dumpling'],
  'Pizza Napoletana':                   ['Neapolitan pizza', 'Pizza napoletana', 'Margherita pizza'],
  'Poutine':                            ['Poutine', 'Canadian poutine', 'Poutine fries'],
  'Ramen':                              ['Ramen', 'Ramen noodle', 'Japanese ramen'],
  'Roti Canai':                         ['Roti canai', 'Roti prata', 'Malaysian roti'],
  'Saltimbocca alla Romana':            ['Saltimbocca', 'Saltimbocca romana', 'Veal saltimbocca'],
  'Saltimbocca':                        ['Saltimbocca', 'Saltimbocca romana', 'Veal saltimbocca'],
  'Samosa':                             ['Samosa', 'Indian samosa', 'Vegetable samosa'],
  'Satay':                              ['Satay', 'Indonesian satay', 'Chicken satay'],
  'Seafood Paella':                     ['Paella', 'Seafood paella', 'Spanish paella'],
  'Shark Fin Soup':                     ['Shark fin soup', 'Chinese shark fin'],
  'Som Tam Green Papaya Salad':         ['Som tam', 'Green papaya salad', 'Thai papaya salad'],
  'Som Tam':                            ['Som tam', 'Green papaya salad', 'Thai papaya salad'],
  'Swedish Smorgasbord':                ['Smörgåsbord', 'Smorgasbord', 'Swedish smorgasbord'],
  'Sushi Omakase':                      ['Sushi', 'Omakase', 'Nigiri sushi'],
  'Takoyaki':                           ['Takoyaki', 'Japanese takoyaki', 'Octopus ball'],
  'Tamal':                              ['Tamale', 'Tamal', 'Mexican tamale'],
  'Tandoori Chicken':                   ['Tandoori chicken', 'Indian tandoori', 'Tandoor chicken'],
  'Tom Yum Goong':                      ['Tom yum', 'Tom yum goong', 'Thai tom yum soup'],
  'Truffle Pasta Alba':                 ['Truffle', 'White truffle', 'Tajarin', 'Pasta with truffle'],
  'Tsukemen Dipping Ramen':             ['Tsukemen', 'Dipping ramen', 'Japanese tsukemen'],
  'Tsukemen':                           ['Tsukemen', 'Dipping ramen', 'Japanese tsukemen'],
  'Tzatziki':                           ['Tzatziki', 'Greek tzatziki', 'Yogurt sauce'],
  'Unagi Kabayaki':                     ['Unagi', 'Unagi no kabayaki', 'Grilled eel'],
  'Valrhona Chocolate':                 ['Chocolate', 'Valrhona', 'French chocolate'],
  'Wiener Schnitzel':                   ['Wiener schnitzel', 'Schnitzel', 'Viennese schnitzel'],
  'Witchetty Grub':                     ['Witchetty grub', 'Australian witchetty grub'],
  'Xiaolongbao Soup Dumplings':         ['Xiaolongbao', 'Soup dumpling', 'Chinese xiaolongbao'],
  'Xiaolongbao':                        ['Xiaolongbao', 'Soup dumpling', 'Chinese xiaolongbao'],
  'Yakitori':                           ['Yakitori', 'Japanese yakitori', 'Chicken skewer'],
  'Zaatar Manakish':                    ['Manakish', 'Za\'atar', 'Zaatar bread'],
  'Zongzi Dragon Boat Dumplings':       ['Zongzi', 'Sticky rice dumpling', 'Chinese zongzi'],
  'Zongzi':                             ['Zongzi', 'Sticky rice dumpling', 'Chinese zongzi'],

  // ══════════════════════════════════════════════════════════════
  // RESTAURANTS (schema-v13) — 대표 음식·내부·전경 우선 (건물만/국기 회피)
  // 검색어: dish food interior dining plating (국기·외관만 나오는 항목 보정)
  // ══════════════════════════════════════════════════════════════

  // ── SPAIN ────────────────────────────────────────────────────
  'Disfrutar':                          ['Disfrutar restaurant Barcelona', 'Disfrutar Barcelona dish food interior dining'],
  'El Celler de Can Roca':              ['El Celler de Can Roca', 'El Celler de Can Roca Girona dish dessert interior'],
  'DiverXO':                            ['DiverXO', 'DiverXO Madrid dish food interior avant-garde'],
  'Asador Etxebarri':                   ['Asador Etxebarri', 'Asador Etxebarri Axpe Basque grill dish food'],
  'Arzak':                              ['Arzak', 'Arzak (restaurant)', 'Arzak San Sebastián dish food interior Basque'],
  'Azurmendi':                          ['Azurmendi', 'Azurmendi (restaurant)', 'Azurmendi Bilbao dish food interior dining'],
  'Martín Berasategui':                 ['Martín Berasategui', 'Martín Berasategui (restaurant)', 'Martín Berasategui Lasarte dish food interior'],
  'Akelarre':                           ['Akelarre', 'Akelarre (restaurant)', 'Akelarre San Sebastián dish food interior dining'],
  'Quique Dacosta':                     ['Quique Dacosta', 'Quique Dacosta (restaurant)', 'Quique Dacosta Denia dish food interior'],
  'Mugaritz':                           ['Mugaritz', 'Mugaritz San Sebastián dish food interior dining'],
  'Elkano':                             ['Elkano', 'Elkano (restaurant)', 'Elkano Getaria turbot dish food interior'],
  'El Invernadero':                     ['El Invernadero', 'El Invernadero (restaurant)', 'El Invernadero Madrid plant-based dish interior'],

  // ── ITALY ────────────────────────────────────────────────────
  'Osteria Francescana':                ['Osteria Francescana', 'Osteria Francescana Modena dish food interior dining'],
  'La Pergola':                         ['La Pergola (restaurant)', 'La Pergola Rome dish food interior terrace'],
  'Reale':                              ['Reale (restaurant)', 'Italian cuisine', 'Reale Niko Romito dish food interior dining'],
  'Lido 84':                            ['Lake Garda', 'Lido 84 (restaurant)', 'Lido 84 Lake Garda dish food interior'],
  'Le Calandre':                        ['Le Calandre', 'Le Calandre Rubano dish food interior dining'],
  'Piazza Duomo':                       ['Piazza Duomo (restaurant)', 'Piazza Duomo Alba dish food interior truffle'],
  'Dal Pescatore':                      ['Dal Pescatore', 'Dal Pescatore Canneto dish food interior dining'],
  'Enoteca Pinchiorri':                 ['Enoteca Pinchiorri', 'Enoteca Pinchiorri Florence dish food wine dining'],

  // ── USA ──────────────────────────────────────────────────────
  'The French Laundry':                 ['The French Laundry', 'The French Laundry Yountville dish food interior dining'],
  'Per Se':                             ['Per Se', 'Per Se (restaurant)', 'Per Se New York dish food interior dining'],
  'Eleven Madison Park':                ['Eleven Madison Park', 'Eleven Madison Park New York dish food interior'],
  'Le Bernardin':                       ['Le Bernardin', 'Le Bernardin New York seafood dish food interior'],
  'Alinea':                             ['Alinea', 'Alinea (restaurant)', 'Alinea Chicago dish food interior molecular'],
  'Atomix':                             ['Atomix', 'Atomix (restaurant)', 'Atomix New York Korean dish food interior dining'],
  'Atelier Crenn':                     ['Atelier Crenn', 'Atelier Crenn San Francisco dish food interior dining'],
  'Quince':                             ['Quince', 'Quince (restaurant)', 'Quince San Francisco dish food interior'],
  'SingleThread':                      ['SingleThread', 'SingleThread (restaurant)', 'SingleThread Healdsburg dish food interior'],
  'The Inn at Little Washington':       ['The Inn at Little Washington', 'Inn Little Washington Virginia dish food interior'],

  // ── FRANCE ───────────────────────────────────────────────────
  'Mirazur':                            ['Mauro Colagreco', 'Mirazur', 'Mirazur Menton dish food interior garden view'],
  'Arpège':                             ['Arpège', 'Arpège (restaurant)', 'Arpège Paris vegetable dish food interior dining'],
  'Guy Savoy':                          ['Guy Savoy', 'Guy Savoy (restaurant)', 'Guy Savoy Paris dish food interior dining'],
  'Epicure (Le Bristol)':               ['Epicure (restaurant)', 'Epicure Paris Le Bristol dish food interior'],
  'Pierre Gagnaire':                    ['Pierre Gagnaire', 'Pierre Gagnaire (restaurant)', 'Pierre Gagnaire Paris dish food interior'],
  'Table by Bruno Verjus':              ['Table by Bruno Verjus', 'French cuisine', 'Table Bruno Verjus Paris dish food interior'],
  'Septime':                            ['Septime', 'Septime (restaurant)', 'Septime Paris dish food interior dining'],
  'Pavillon Ledoyen':                   ['Pavillon Ledoyen', 'Pavillon Ledoyen Paris dish food interior'],
  'Le Meurice':                         ['Le Meurice', 'Le Meurice (restaurant)', 'Le Meurice Paris dish food interior dining'],
  'Anne-Sophie Pic':                    ['Anne-Sophie Pic', 'Anne-Sophie Pic (restaurant)', 'Maison Pic Valence dish food interior'],
  'Maison Troisgros':                   ['Maison Troisgros', 'Maison Troisgros Ouches dish food interior dining'],
  'Le Pré Catelan':                     ['Le Pré Catelan', 'Le Pré Catelan Paris dish food interior'],
  'Régis et Jacques Marcon':            ['Régis et Jacques Marcon', 'Régis Marcon Saint-Bonnet dish food mushroom'],
  'La Bouitte':                         ['Savoie', 'La Bouitte', 'La Bouitte Savoie dish food interior dining'],

  // ── UK ───────────────────────────────────────────────────────
  'The Fat Duck':                       ['The Fat Duck', 'The Fat Duck Bray dish food interior dining'],
  'The Waterside Inn':                  ['The Waterside Inn', 'The Waterside Inn Bray dish food interior Thames'],
  'Alain Ducasse at The Dorchester':    ['Alain Ducasse at The Dorchester', 'Alain Ducasse Dorchester London dish food interior'],
  'Restaurant Gordon Ramsay':           ['Restaurant Gordon Ramsay', 'Gordon Ramsay Chelsea London dish food interior'],
  'Core by Clare Smyth':                ['Clare Smyth', 'Core by Clare Smyth', 'Core Clare Smyth London dish food interior'],
  'L\'Enclume':                         ['L\'Enclume', 'L\'Enclume Cartmel dish food interior dining'],
  'The Ledbury':                        ['The Ledbury', 'The Ledbury London dish food interior dining'],

  // ── DENMARK ──────────────────────────────────────────────────
  'Geranium':                           ['Geranium', 'Geranium (restaurant)', 'Geranium Copenhagen dish food interior Nordic'],
  'Alchemist':                          ['Alchemist', 'Alchemist (restaurant)', 'Alchemist Copenhagen dish food interior dining'],
  'Jordnær':                            ['Geranium (restaurant)', 'Rasmus Kofoed', 'Jordnær Copenhagen dish food interior Nordic'],
  'Kadeau Copenhagen':                  ['Noma (restaurant)', 'René Redzepi', 'Kadeau', 'Kadeau Copenhagen dish food interior Nordic'],

  // ── GERMANY ──────────────────────────────────────────────────
  'Aqua':                               ['Aqua', 'Aqua (restaurant)', 'Aqua Wolfsburg dish food interior dining'],
  'Vendôme':                            ['Vendôme', 'Vendôme (restaurant)', 'Vendôme Bergisch Gladbach dish food interior'],

  // ── BELGIUM ──────────────────────────────────────────────────
  'Hof van Cleve':                      ['Hof van Cleve', 'Hof van Cleve Kruishoutem dish food interior'],

  // ── NETHERLANDS ──────────────────────────────────────────────
  'De Librije':                         ['De Librije', 'De Librije Zwolle dish food interior dining'],
  'Bord\'Eau':                          ['Bord\'Eau', 'Bord\'Eau Amsterdam dish food interior dining'],

  // ── SWEDEN ───────────────────────────────────────────────────
  'Frantzén':                           ['Frantzén', 'Frantzén (restaurant)', 'Frantzén Stockholm dish food interior Nordic'],

  // ── JAPAN ────────────────────────────────────────────────────
  'Sukiyabashi Jiro Honten':            ['Sukiyabashi Jiro', 'Sukiyabashi Jiro sushi dish Tokyo Ginza'],
  'Kichisen':                           ['Kichisen', 'Kichisen Kyoto kaiseki dish food interior'],
  'Nihonryori RyuGin':                  ['Nihonryori RyuGin', 'RyuGin Tokyo kaiseki dish food interior'],
  'Den':                                ['Den', 'Den (restaurant)', 'Den Tokyo kaiseki dish food interior'],
  'Kikunoi Honten':                     ['Kikunoi', 'Kikunoi Kyoto kaiseki dish food interior'],
  'Arashiyama Kitcho':                  ['Kitcho', 'Kaiseki', 'Arashiyama Kitcho Kyoto dish food interior'],
  'Hyotei':                             ['Kaiseki', 'Hyotei Kyoto kaiseki dish food interior'],
  'Quintessence':                       ['Quintessence', 'Quintessence (restaurant)', 'Quintessence Tokyo dish food interior'],
  'Narisawa':                           ['Narisawa', 'Kaiseki', 'Narisawa Tokyo dish food interior satoyama'],
  'Florilège':                          ['Florilège', 'French cuisine', 'Florilège Tokyo dish food interior dining'],
  'Sushi Yoshitake':                    ['Sushi Yoshitake', 'Sushi Yoshitake Ginza dish sushi omakase'],
  'Saito':                              ['Sushi Saito', 'Saito sushi Tokyo dish food interior'],
  'Mizai':                              ['Kaiseki', 'Mizai Kyoto kaiseki dish food interior'],

  // ── SINGAPORE ────────────────────────────────────────────────
  'Odette':                             ['Julien Royer', 'Odette', 'Odette (restaurant)', 'Odette Singapore dish food interior dining'],
  'Jaan by Kirk Westaway':              ['Jaan', 'Jaan (restaurant)', 'Jaan Singapore dish food interior dining'],

  // ── HONG KONG ────────────────────────────────────────────────
  'Lung King Heen':                     ['Lung King Heen', 'Lung King Heen Hong Kong dim sum dish food interior'],
  '8½ Otto e Mezzo Bombana':            ['8½ Otto e Mezzo Bombana', 'Otto e Mezzo Bombana Hong Kong dish food interior'],
  'Amber':                              ['Amber', 'Amber (restaurant)', 'Amber Hong Kong dish food interior dining'],
  'L\'Atelier de Joël Robuchon Hong Kong': ['L\'Atelier de Joël Robuchon', 'L Atelier Joel Robuchon Hong Kong dish food interior'],

  // ── KOREA ────────────────────────────────────────────────────
  'La Yeon':                            ['La Yeon', 'La Yeon Seoul Korean dish food interior dining'],
  'Mingles':                            ['Mingles', 'Mingles (restaurant)', 'Korean cuisine', 'Mingles Seoul dish food interior Korean'],
  'Mosu Seoul':                         ['Mosu', 'Mosu (restaurant)', 'Sung_Anh', 'Mosu Seoul', 'Mosu Seoul dish food interior Korean'],

  // ── AUSTRIA ──────────────────────────────────────────────────
  'Steirereck':                         ['Steirereck', 'Austrian cuisine', 'Steirereck Vienna dish food interior dining'],

  // ── SWITZERLAND ──────────────────────────────────────────────
  'Restaurant de l\'Hôtel de Ville':    ['Crissier', 'Swiss cuisine', 'Restaurant de l\'Hôtel de Ville', 'Hotel de Ville Crissier dish food interior'],

  // ── PERU / LATIN AMERICA ─────────────────────────────────────
  'Central':                            ['Central', 'Central (restaurant)', 'Central Lima Peru dish food interior dining'],
  'Maido':                              ['Maido', 'Maido (restaurant)', 'Maido Lima dish food interior Nikkei'],
  'Kjolle':                             ['Kjolle', 'Central (restaurant)', 'Kjolle Lima dish food interior Peru'],

  // ── MEXICO ───────────────────────────────────────────────────
  'Quintonil':                          ['Quintonil', 'Quintonil Mexico City dish food interior dining'],
  'Pujol':                              ['Pujol', 'Pujol (restaurant)', 'Pujol Mexico City dish food mole interior'],

  // ── ARGENTINA / CHILE / BRAZIL ───────────────────────────────
  'Don Julio':                          ['Don Julio', 'Don Julio (restaurant)', 'Don Julio Buenos Aires parrilla dish food interior'],
  'Boragó':                             ['Boragó', 'Boragó Santiago dish food interior Chile'],
  'A Casa do Porco':                    ['A Casa do Porco', 'A Casa do Porco São Paulo dish food interior'],

  // ── THAILAND ─────────────────────────────────────────────────
  'Gaggan Anand':                       ['Gaggan Anand', 'Gaggan Anand Bangkok dish food interior Indian'],
  'Le Du':                              ['Thitid Tassanakajohn', 'Le Du', 'Le Du (restaurant)', 'Le Du Bangkok dish food interior Thai'],
  'Sorn':                               ['Tom yum', 'Pad thai', 'Sorn', 'Sorn (restaurant)', 'Sorn Bangkok dish food interior Thai'],

  // ── UAE ──────────────────────────────────────────────────────
  'Trèsind Studio':                     ['Tandoori chicken', 'Biryani', 'Trèsind Studio', 'Trèsind Studio Dubai dish food interior Indian'],
  'Ossiano':                            ['Ossiano', 'Ossiano Dubai dish food interior underwater'],

  // ── PORTUGAL ─────────────────────────────────────────────────
  'Belcanto':                           ['Belcanto', 'Belcanto (restaurant)', 'Portuguese cuisine', 'Belcanto Lisbon dish food interior Portuguese'],

  // ── SLOVENIA ─────────────────────────────────────────────────
  'Hiša Franko':                        ['Hiša Franko', 'Hisa Franko Kobarid dish food interior Slovenia'],

  // '21_21 Design Sight, Tokyo' 검색 개선
  '21_21 Design Sight, Tokyo':          ['21_21 Design Sight', 'Tadao Ando Tokyo'],

  // ══════════════════════════════════════════════════════════════
  // ANIMALS (schema-v14) — 9개 추가분 이미지 오버라이드
  // ══════════════════════════════════════════════════════════════
  'Chimpanzee':                         ['Chimpanzee', 'Pan troglodytes Gombe Tanzania Jane Goodall'],
  'Great White Shark':                  ['Great white shark', 'Carcharodon carcharias Gansbaai South Africa cage diving'],
  'Cape Buffalo':                       ['African buffalo', 'Cape buffalo Syncerus caffer Serengeti Tanzania Big Five'],
  'Three-toed Sloth':                   ['Three-toed sloth', 'Bradypus tridactylus Costa Rica rainforest hanging'],
  'Atlantic Puffin':                    ['Atlantic puffin', 'Fratercula arctica Iceland Westman Islands colony'],
  'Fennec Fox':                         ['Fennec fox', 'Vulpes zerda Sahara desert big ears Tunisia'],
  'Amur Tiger':                         ['Siberian tiger', 'Amur tiger Panthera tigris altaica Far East Russia'],
  'Scalloped Hammerhead Shark':         ['Scalloped hammerhead', 'Sphyrna lewini Galapagos Darwin Island schooling sharks'],
  'Golden Snub-nosed Monkey':           ['Golden snub-nosed monkey', 'Rhinopithecus roxellana Sichuan China blue face'],

  // ══════════════════════════════════════════════════════════════
  // GOLF COURSES (schema-v16) — 100개 전면 교체
  // 전략: 각 골프장 Wikipedia 정확 문서명 지정 → 골프장 전경 사진
  //        useFullTitle=true(golf) 이미 적용, 아래는 추가 정밀 보정
  // ══════════════════════════════════════════════════════════════

  // ── 20pt — 메이저 챔피언십 개최 ──────────────────────────────
  'Augusta National Golf Club':         ['Augusta National Golf Club', 'Augusta National Golf Club Masters Tournament aerial'],
  'Oakmont Country Club':               ['Oakmont Country Club', 'Oakmont Country Club golf course aerial Pennsylvania'],
  'Winged Foot Golf Club':              ['Winged Foot Golf Club', 'Winged Foot Golf Club West Course US Open'],
  'Shinnecock Hills Golf Club':         ['Shinnecock Hills Golf Club', 'Shinnecock Hills golf links aerial Southampton'],
  'Pinehurst No. 2':                    ['Pinehurst No. 2', 'Pinehurst Resort No.2 golf course aerial North Carolina'],
  'The Country Club':                   ['The Country Club (Brookline)', 'The Country Club Brookline Massachusetts golf aerial'],
  'Olympic Club Lake Course':           ['Olympic Club (San Francisco)', 'Olympic Club Lake Course US Open San Francisco'],
  'Bethpage Black':                     ['Bethpage Black', 'Bethpage Black Golf Course aerial New York public'],
  'Torrey Pines South Course':          ['Torrey Pines Golf Course', 'Torrey Pines South Course Pacific cliffs La Jolla aerial'],
  'Pebble Beach Golf Links':            ['Pebble Beach Golf Links', 'Pebble Beach Golf Links aerial Carmel Bay 18th hole'],
  'Valhalla Golf Club':                 ['Valhalla Golf Club', 'Valhalla Golf Club PGA Championship Louisville aerial'],
  'Kiawah Island Ocean Course':         ['Ocean Course, Kiawah Island', 'Kiawah Island Ocean Course aerial Pete Dye coastal'],
  'Whistling Straits':                  ['Whistling Straits', 'Whistling Straits golf course Lake Michigan aerial Kohler'],
  'TPC Sawgrass Stadium Course':        ['TPC Sawgrass', 'TPC Sawgrass island green 17th hole Players Championship'],
  'Medinah Country Club No.3':          ['Medinah Country Club', 'Medinah Country Club No.3 aerial Illinois golf'],
  'Hazeltine National Golf Club':       ['Hazeltine National Golf Club', 'Hazeltine National Golf Club aerial Minnesota'],
  'Baltusrol Golf Club Lower Course':   ['Baltusrol Golf Club', 'Baltusrol Golf Club Lower Course US Open aerial New Jersey'],
  'Merion Golf Club East Course':       ['Merion Golf Club', 'Merion Golf Club East Course aerial Ardmore Pennsylvania'],
  'Quail Hollow Club':                  ['Quail Hollow Club', 'Quail Hollow Club golf course aerial Charlotte North Carolina'],
  'St Andrews Old Course':              ['St Andrews Old Course', 'St Andrews Old Course Swilcan Bridge aerial Fife Scotland'],
  'Muirfield':                          ['Muirfield (golf)', 'Muirfield golf course aerial East Lothian Scotland links'],
  'Carnoustie Golf Links':              ['Carnoustie Golf Links', 'Carnoustie Golf Links aerial championship course Scotland'],
  'Royal Birkdale Golf Club':           ['Royal Birkdale Golf Club', 'Royal Birkdale Golf Club aerial links Southport England'],
  'Royal Troon Golf Club':              ['Royal Troon Golf Club', 'Royal Troon Golf Club aerial Postage Stamp Scotland'],
  'Royal Lytham & St Annes Golf Club':  ['Royal Lytham & St Annes Golf Club', 'Royal Lytham St Annes aerial Lancashire Open Championship'],
  'Royal St George\'s Golf Club':       ['Royal St George\'s Golf Club', 'Royal St Georges Golf Club aerial Sandwich Kent Open'],
  'Royal Portrush Golf Club':           ['Royal Portrush Golf Club', 'Royal Portrush Golf Club Dunluce Links aerial Northern Ireland'],
  'Royal Liverpool Golf Club':          ['Royal Liverpool Golf Club', 'Royal Liverpool Golf Club Hoylake aerial Open Championship'],
  'Turnberry Ailsa Course':             ['Trump Turnberry', 'Turnberry Ailsa Course lighthouse aerial Ayrshire Scotland'],

  // ── 15pt — PGA 투어·라이더컵·프레지던츠컵 ─────────────────────
  'Southern Hills Country Club':        ['Southern Hills Country Club', 'Southern Hills Country Club aerial Tulsa Oklahoma golf'],
  'Oak Hill Country Club East Course':  ['Oak Hill Country Club', 'Oak Hill Country Club East Course aerial Rochester New York'],
  'Oakland Hills Country Club South Course': ['Oakland Hills Country Club', 'Oakland Hills Country Club aerial Bloomfield Hills Michigan'],
  'Riviera Country Club':               ['Riviera Country Club', 'Riviera Country Club aerial Pacific Palisades California golf'],
  'Muirfield Village Golf Club':        ['Muirfield Village Golf Club', 'Muirfield Village Golf Club aerial Dublin Ohio Memorial'],
  'East Lake Golf Club':                ['East Lake Golf Club', 'East Lake Golf Club aerial Atlanta Georgia Tour Championship'],
  'Congressional Country Club Blue Course': ['Congressional Country Club', 'Congressional Country Club Blue Course aerial Maryland'],
  'Aronimink Golf Club':                ['Aronimink Golf Club', 'Aronimink Golf Club aerial Newtown Square Pennsylvania'],
  'Bay Hill Club & Lodge':              ['Bay Hill Club & Lodge', 'Bay Hill Club Lodge aerial Orlando Florida Arnold Palmer'],
  'Harbour Town Golf Links':            ['Harbour Town Golf Links', 'Harbour Town Golf Links lighthouse 18th aerial Hilton Head'],
  'Kapalua Plantation Course':          ['Kapalua Golf Club', 'Kapalua Plantation Course aerial Maui Hawaii ocean views'],
  'Firestone Country Club South Course': ['Firestone Country Club', 'Firestone Country Club South Course aerial Akron Ohio'],
  'Bellerive Country Club':             ['Bellerive Country Club', 'Bellerive Country Club aerial St Louis Missouri golf'],
  'Liberty National Golf Club':         ['Liberty National Golf Club', 'Liberty National Golf Club aerial Manhattan skyline New Jersey'],
  'Chambers Bay Golf Course':           ['Chambers Bay', 'Chambers Bay Golf Course aerial US Open Washington State'],
  'Erin Hills Golf Course':             ['Erin Hills', 'Erin Hills Golf Course aerial US Open Wisconsin moraines'],
  'TPC Scottsdale Stadium Course':      ['TPC Scottsdale', 'TPC Scottsdale Stadium Course aerial 16th hole crowd Arizona'],
  'Prairie Dunes Country Club':         ['Prairie Dunes Country Club', 'Prairie Dunes Country Club aerial Kansas golf links-style'],
  'Pine Needles Lodge & Golf Club':     ['Pine Needles Lodge and Golf Club', 'Pine Needles Lodge Golf Club aerial Southern Pines NC'],
  'Waialae Country Club':               ['Waialae Country Club', 'Waialae Country Club aerial Honolulu Hawaii Sony Open'],
  'Colonial Country Club':              ['Colonial Country Club (Fort Worth)', 'Colonial Country Club Fort Worth aerial Texas golf Hogan'],
  'Real Club Valderrama':               ['Real Club Valderrama', 'Valderrama golf course aerial Andalucia Spain cork oak Ryder Cup'],
  'The K Club Palmer Course':           ['The K Club', 'The K Club Palmer Course aerial Kildare Ireland Ryder Cup'],
  'Celtic Manor Twenty Ten Course':     ['Celtic Manor Resort', 'Celtic Manor Twenty Ten Course aerial Newport Wales Ryder Cup'],
  'Gleneagles PGA Centenary Course':    ['Gleneagles Hotel', 'Gleneagles PGA Centenary Course aerial Perthshire Scotland Ryder'],
  'Le Golf National':                   ['Le Golf National', 'Le Golf National Albatros Course aerial Paris Ryder Cup 2018'],
  'Marco Simone Golf & Country Club':   ['Marco Simone Golf and Country Club', 'Marco Simone Golf Club aerial Rome Italy Ryder Cup 2023'],
  'The Belfry Brabazon Course':         ['The Belfry', 'The Belfry Brabazon Course aerial Sutton Coldfield Ryder Cup'],
  'Royal County Down Golf Club':        ['Royal County Down Golf Club', 'Royal County Down Golf Club aerial Mourne Mountains Northern Ireland'],
  'Royal Montreal Golf Club':           ['Royal Montreal Golf Club', 'Royal Montreal Golf Club Blue Course aerial Quebec Canada'],
  'Glen Abbey Golf Club':               ['Glen Abbey Golf Club', 'Glen Abbey Golf Club aerial Oakville Ontario Canadian Open'],
  'Kasumigaseki Country Club East Course': ['Kasumigaseki Country Club', 'Kasumigaseki Country Club East Course Tokyo Olympics 2020'],
  'Narashino Country Club':             ['Narashino Country Club', 'Narashino Country Club aerial Inzai Chiba Japan ZOZO Championship'],
  'Jack Nicklaus Golf Club Korea':      ['Jack Nicklaus Golf Club Korea', 'Jack Nicklaus Golf Club Korea aerial Songdo Presidents Cup'],
  'Nine Bridges Golf Club':             ['Nine Bridges Golf Club', 'Nine Bridges Golf Club aerial Jeju Island Korea autumn'],
  'Royal Melbourne Golf Club':          ['Royal Melbourne Golf Club', 'Royal Melbourne Golf Club composite aerial sandbelt Australia'],
  'Kingston Heath Golf Club':           ['Kingston Heath Golf Club', 'Kingston Heath Golf Club aerial Melbourne sandbelt Australian Open'],
  'Gary Player Country Club':           ['Gary Player Country Club', 'Gary Player Country Club aerial Sun City South Africa Nedbank'],
  'Fancourt Links':                     ['Fancourt', 'Fancourt Links aerial George South Africa Presidents Cup Ernie Els'],
  'Sheshan International Golf Club':    ['Sheshan International Golf Club', 'Sheshan International Golf Club aerial Shanghai WGC HSBC Champions'],
  'Emirates Golf Club Majlis Course':   ['Emirates Golf Club', 'Emirates Golf Club Majlis Course aerial Dubai DP World Tour'],
  'Evian Resort Golf Club':             ['Evian Resort Golf Club', 'Evian Resort Golf Club aerial Lake Geneva Alps France Evian Championship'],

  // ── 10pt — 투어 정기 개최 ────────────────────────────────────
  'Wentworth Club West Course':         ['Wentworth Club', 'Wentworth Club West Course aerial Surrey England BMW PGA'],
  'Sunningdale Golf Club Old Course':   ['Sunningdale Golf Club', 'Sunningdale Golf Club Old Course aerial Berkshire heathland'],
  'Loch Lomond Golf Club':              ['Loch Lomond Golf Club', 'Loch Lomond Golf Club aerial Scottish Highlands Scottish Open'],
  'Kingsbarns Golf Links':              ['Kingsbarns Golf Links', 'Kingsbarns Golf Links aerial Fife Scotland sea views Dunhill'],
  'Royal Dornoch Golf Club':            ['Royal Dornoch Golf Club', 'Royal Dornoch Golf Club aerial Highland Scotland links'],
  'Portmarnock Golf Club':              ['Portmarnock Golf Club', 'Portmarnock Golf Club aerial Dublin peninsula Irish Open'],
  'Lahinch Golf Club Old Course':       ['Lahinch Golf Club', 'Lahinch Golf Club Old Course aerial County Clare Ireland links'],
  'Crans-sur-Sierre Golf Club':         ['Crans-sur-Sierre', 'Crans-sur-Sierre golf course aerial Swiss Alps European Masters'],
  'El Saler Golf Club':                 ['El Saler Golf Club', 'El Saler Golf Club aerial Valencia Spain Mediterranean dunes'],
  'TPC Southwind':                      ['TPC Southwind', 'TPC Southwind aerial Memphis Tennessee FedEx St Jude Championship'],
  'TPC Deere Run':                      ['TPC Deere Run', 'TPC Deere Run aerial Silvis Illinois John Deere Classic'],
  'Spyglass Hill Golf Course':          ['Spyglass Hill Golf Course', 'Spyglass Hill Golf Course aerial Pebble Beach California'],
  'Hirono Golf Club':                   ['Hirono Golf Club', 'Hirono Golf Club aerial Kobe Japan Charles Alison golf course'],
  'Yomiuri Country Club':               ['Yomiuri Country Club', 'Yomiuri Country Club aerial Tokyo Japan Open golf'],
  'Blue Canyon Country Club':           ['Blue Canyon Country Club', 'Blue Canyon Country Club aerial Phuket Thailand golf'],
  'Woo Jeong Hills Country Club':       ['Woo Jeong Hills Country Club', 'Woo Jeong Hills Country Club aerial Cheonan Korea CJ Cup'],
  'Mission Hills Golf Club Shenzhen':   ['Mission Hills Golf Club (China)', 'Mission Hills Golf Club Shenzhen aerial world largest golf facility'],
  'Royal Adelaide Golf Club':           ['Royal Adelaide Golf Club', 'Royal Adelaide Golf Club aerial South Australia MacKenzie'],
  'New South Wales Golf Club':          ['New South Wales Golf Club', 'New South Wales Golf Club aerial Botany Bay Sydney clifftop'],
  'Kauri Cliffs Golf Course':           ['Kauri Cliffs', 'Kauri Cliffs Golf Course aerial Bay of Islands New Zealand ocean'],
  'Abu Dhabi Golf Club':                ['Abu Dhabi Golf Club', 'Abu Dhabi Golf Club aerial UAE HSBC Championship'],
  'Leopard Creek Country Club':         ['Leopard Creek Country Club', 'Leopard Creek Country Club aerial Kruger Park South Africa'],
  'Durban Country Club':                ['Durban Country Club', 'Durban Country Club aerial KwaZulu-Natal South Africa Open'],
  'PGA Catalunya Stadium Course':       ['PGA Catalunya Resort', 'PGA Catalunya Stadium Course aerial Girona Spain Solheim Cup'],
  'Golf Club Gut Lärchenhof':           ['Golf Club Gut Lärchenhof', 'Golf Club Gut Lärchenhof aerial Cologne Germany BMW International'],
  'El Camaleón Golf Club':              ['El Camaleon Golf Course', 'El Camaleón Golf Club aerial Mayakoba Riviera Maya Mexico PGA Tour'],
  'Albany Golf Course, Bahamas':        ['Albany (resort)', 'Albany Golf Course aerial Nassau Bahamas Hero World Challenge Ernie Els'],
  'Mid Ocean Club':                     ['Mid Ocean Club', 'Mid Ocean Club golf aerial Tucker\'s Town Bermuda Atlantic Charles Macdonald'],
  'Port Royal Golf Course':             ['Port Royal Golf Course', 'Port Royal Golf Course aerial Bermuda Championship PGA Tour Southampton'],

  // ══════════════════════════════════════════════════════════════
  // FISHING SPOTS (schema-v15) — 100개 전면 교체
  // 전략: title_en = 지명 중심 → Wikipedia 지역 사진 (강·호수·풍경)
  //        어종명 아닌 지역 Wikipedia 문서로 직접 지정
  // ══════════════════════════════════════════════════════════════

  // ── NORTH AMERICA FRESHWATER ──────────────────────────────
  'Kenai River':                        ['Kenai River', 'Kenai River Alaska salmon fly fishing scenic'],
  'Skeena River':                       ['Skeena River', 'Skeena River British Columbia steelhead fly fishing'],
  'Grand Cascapedia River':             ['Grand Cascapedia River', 'Quebec Atlantic salmon river Cascapedia'],
  'Madison River, Montana':             ['Madison River (Montana)', 'Madison River Montana fly fishing trout canyon'],
  'Bighorn River, Montana':             ['Bighorn River', 'Bighorn River Montana tailwater trout fishing'],
  'Deschutes River, Oregon':            ['Deschutes River', 'Deschutes River Oregon steelhead canyon basalt'],
  'Green River, Wyoming':               ['Green River (Wyoming)', 'Green River Wyoming fly fishing tailwater Flaming Gorge'],
  'San Juan River, New Mexico':         ['San Juan River (New Mexico)', 'San Juan River New Mexico trout tailwater'],
  'Naknek River, Alaska':               ['Naknek River', 'Naknek River Alaska Bristol Bay sockeye salmon'],
  'Snake River, Idaho':                 ['Snake River', 'Snake River Idaho steelhead canyon Hells Canyon'],
  'Bow River, Alberta':                 ['Bow River', 'Bow River Calgary Alberta brown trout fly fishing'],
  'Miramichi River, New Brunswick':     ['Miramichi River', 'Miramichi River New Brunswick Atlantic salmon fishing'],
  'Nipigon River, Ontario':             ['Nipigon River', 'Nipigon River Ontario brook trout Lake Nipigon'],
  'Lake Erie, USA':                     ['Lake Erie', 'Lake Erie walleye fishing Great Lakes western basin'],
  'Boundary Waters, Minnesota':         ['Boundary Waters Canoe Area Wilderness', 'Boundary Waters Minnesota canoe fishing wilderness'],

  // ── NORTH AMERICA SALTWATER ──────────────────────────────
  'Florida Keys':                       ['Florida Keys', 'Florida Keys fishing tarpon permit bonefish flats'],
  'Kona, Hawaii':                       ['Kona, Hawaii', 'Kona Hawaii blue marlin sportfishing Pacific Ocean'],
  'Andros Island, Bahamas':             ['Andros, Bahamas', 'Andros Island Bahamas bonefish flats fishing tropical'],
  'Jardines de la Reina, Cuba':         ['Jardines de la Reina', 'Jardines de la Reina Cuba reef pristine fishing'],
  'Pinas Bay, Panama':                  ['Piñas Bay', 'Pinas Bay Panama Tropic Star Lodge black marlin'],
  'Iztapa, Guatemala':                  ['Iztapa', 'Iztapa Guatemala Pacific sailfish offshore fishing'],
  'Boca Grande Pass, Florida':          ['Boca Grande, Florida', 'Boca Grande Pass Florida tarpon fishing gulf'],
  'Cape Cod, Massachusetts':            ['Cape Cod', 'Cape Cod Massachusetts beach fishing striped bass surfcasting'],
  'Everglades, Florida':                ['Everglades', 'Everglades Florida backcountry fishing mangrove snook redfish'],
  'Cabo San Lucas, Mexico':             ['Cabo San Lucas', 'Cabo San Lucas Mexico marlin fishing Pacific sportfishing'],
  'Cozumel, Mexico':                    ['Cozumel', 'Cozumel Mexico Caribbean blue water fishing marlin'],
  'Puerto Vallarta, Mexico':            ['Puerto Vallarta', 'Puerto Vallarta Mexico Pacific sailfish fishing offshore'],

  // ── SOUTH AMERICA ────────────────────────────────────────
  'Rio Grande, Tierra del Fuego':       ['Río Grande, Tierra del Fuego', 'Rio Grande Tierra del Fuego river Patagonia sea trout'],
  'Palena River, Chile':                ['Palena River', 'Palena River Chile Patagonia river rainbow trout wilderness'],
  'Cinaruco River, Venezuela':          ['Cinaruco River', 'Cinaruco River Venezuela Llanos fishery peacock bass'],
  'Inirida River, Colombia':            ['Inírida River', 'Inirida River Colombia Amazon tributary peacock bass'],
  'Corrientes Province, Argentina':     ['Corrientes Province', 'Corrientes Province Argentina Paraná river dorado'],
  'Amazon River, Brazil':               ['Amazon River', 'Amazon River Brazil tropical rainforest river jungle'],
  'Pantanal, Brazil':                   ['Pantanal', 'Pantanal Brazil wetland river fishing landscape wildlife'],
  'Guanacaste, Costa Rica':             ['Guanacaste Province', 'Guanacaste Costa Rica Pacific coast fishing roosterfish'],
  'Madre de Dios River, Peru':          ['Madre de Dios River', 'Madre de Dios River Peru Amazon jungle fishing'],
  'Parana River, Argentina':            ['Paraná River', 'Paraná River Argentina Entre Rios fishing riverscape'],

  // ── EUROPE ───────────────────────────────────────────────
  'Alta River, Norway':                 ['Alta River', 'Alta River Norway Finnmark salmon fishing canyon landscape'],
  'Lofoten Islands, Norway':            ['Lofoten', 'Lofoten Islands Norway Arctic cod fishing scenic mountains'],
  'Ellidaár River, Iceland':            ['Elliðaár', 'Ellidaár River Reykjavik Iceland salmon urban river'],
  'Tungnaá River, Iceland':             ['Tungnaá', 'Tungnaá River Iceland highland wilderness salmon fishing'],
  'River Tay, Scotland':                ['River Tay', 'River Tay Scotland salmon fishing Perth Kenmore scenic'],
  'River Spey, Scotland':               ['River Spey', 'River Spey Scotland salmon fishing Speyside whisky country'],
  'River Tweed, Scotland':              ['River Tweed', 'River Tweed Scotland England border Atlantic salmon fishing'],
  'Ebro River, Spain':                  ['Ebro', 'Ebro River Spain Mequinenza reservoir wels catfish fishing'],
  'Canary Islands, Spain':              ['Canary Islands', 'Canary Islands Atlantic Ocean fishing bluefin tuna marlin'],
  'Azores, Portugal':                   ['Azores', 'Azores Portugal Atlantic islands big game fishing volcanic ocean'],
  'Kola Peninsula, Russia':             ['Kola Peninsula', 'Kola Peninsula Russia salmon river arctic wilderness fishing'],
  'Ponoi River, Russia':                ['Ponoi River', 'Ponoi River Kola Russia Atlantic salmon lodge wilderness'],
  'River Moy, Ireland':                 ['River Moy', 'River Moy Ireland Mayo Ballina salmon fishing'],
  'Connemara, Ireland':                 ['Connemara', 'Connemara Ireland lakes brown trout fly fishing landscape'],
  'Lake Inari, Finland':                ['Lake Inari', 'Lake Inari Finland Lapland Arctic fishing wilderness'],
  'Lake Vänern, Sweden':                ['Lake Vänern', 'Lake Vänern Sweden largest lake fishing pike perch'],
  'Bug River, Poland':                  ['Bug River', 'Bug River Poland Ukraine border pike perch fishing'],
  'Po River, Italy':                    ['Po River', 'Po River Italy Northern valley fishing landscape Cremona'],
  'Volga River Delta, Russia':          ['Volga River', 'Volga Delta Astrakhan Russia Caspian fishing landscape'],

  // ── AFRICA ───────────────────────────────────────────────
  'Congo River, DRC':                   ['Congo River', 'Congo River DRC rapids Malebo Pool Africa fishing'],
  'Cosmoledo Atoll, Seychelles':        ['Cosmoledo Atoll', 'Cosmoledo Atoll Seychelles Indian Ocean remote flats'],
  'Zambezi River, Zimbabwe':            ['Zambezi River', 'Zambezi River Zimbabwe Victoria Falls tigerfish fishing'],
  'Lake Tanganyika, Tanzania':          ['Lake Tanganyika', 'Lake Tanganyika Tanzania deepest lake Africa fishing'],
  'Bazaruto Archipelago, Mozambique':   ['Bazaruto Archipelago', 'Bazaruto Archipelago Mozambique Indian Ocean fishing'],
  'Watamu, Kenya':                      ['Watamu', 'Watamu Kenya coast marine park beach blue water fishing'],
  'Zanzibar Channel, Tanzania':         ['Zanzibar', 'Zanzibar Tanzania Indian Ocean fishing dhow channel'],
  'Malindi, Kenya':                     ['Malindi', 'Malindi Kenya Indian Ocean coast billfish reef fishing'],
  'Cape Point, South Africa':           ['Cape Point', 'Cape Point South Africa False Bay tuna fishing scenic'],
  'Lake Victoria, Kenya':               ['Lake Victoria', 'Lake Victoria Kenya Africa largest lake Nile perch fishing'],
  'Lake Malawi, Malawi':                ['Lake Malawi', 'Lake Malawi Africa clear water fishing landscape'],
  'Niassa Reserve, Mozambique':         ['Niassa National Reserve', 'Niassa Reserve Mozambique Lugenda River remote wilderness'],
  'Walvis Bay, Namibia':                ['Walvis Bay', 'Walvis Bay Namibia lagoon fishing Skeleton Coast Atlantic'],

  // ── RUSSIA / MONGOLIA ────────────────────────────────────
  'Kamchatka Peninsula, Russia':        ['Kamchatka Peninsula', 'Kamchatka Peninsula Russia salmon river landscape volcano'],
  'Lake Baikal, Russia':                ['Lake Baikal', 'Lake Baikal Russia deepest lake ice fishing winter landscape'],
  'Eg-Uur River, Mongolia':             ['Eg River (Mongolia)', 'Eg Uur River Mongolia taimen fishing steppe wilderness'],
  'Amur River, Russia':                 ['Amur River', 'Amur River Russia China border river fishing landscape'],

  // ── ASIA ─────────────────────────────────────────────────
  'Yarlung Tsangpo, Tibet':             ['Yarlung Tsangpo', 'Yarlung Tsangpo Tibet gorge river high altitude landscape'],
  'Ramganga River, India':              ['Ramganga River', 'Ramganga River India Jim Corbett National Park mahseer'],
  'Cauvery River, India':               ['Cauvery River', 'Cauvery River India Karnataka fishing mahseer landscape'],
  'Hokkaido, Japan':                    ['Hokkaidō', 'Hokkaido Japan nature river fishing wilderness northern island'],
  'Shiretoko Peninsula, Japan':         ['Shiretoko Peninsula', 'Shiretoko Peninsula Japan UNESCO wilderness river fishing'],
  'Sarawak, Borneo, Malaysia':          ['Sarawak', 'Sarawak Borneo Malaysia rainforest river jungle fishing'],
  'Mamberamo River, Papua':             ['Mamberamo River', 'Mamberamo River Papua Indonesia remote jungle river'],
  'Chiang Khong, Thailand':             ['Chiang Khong', 'Chiang Khong Thailand Mekong River border landscape'],
  'Kerala Backwaters, India':           ['Kerala backwaters', 'Kerala Backwaters India houseboat canal fishing landscape'],
  'Mekong Delta, Vietnam':              ['Mekong Delta', 'Mekong Delta Vietnam river fishing floating market landscape'],
  'Lake Biwa, Japan':                   ['Lake Biwa', 'Lake Biwa Japan largest lake fishing Shiga landscape'],

  // ── PACIFIC / OCEANIA ────────────────────────────────────
  'Lake Taupo, New Zealand':            ['Lake Taupo', 'Lake Taupo New Zealand largest lake trout fishing landscape'],
  'Tongariro River, New Zealand':       ['Tongariro River', 'Tongariro River New Zealand trout fly fishing scenic UNESCO'],
  'Cairns, Queensland':                 ['Cairns', 'Cairns Queensland Australia Great Barrier Reef marlin fishing'],
  'Ningaloo Reef, Australia':           ['Ningaloo Coast', 'Ningaloo Reef Western Australia coral fishing sailfish'],
  'Darwin, Northern Territory':         ['Darwin, Northern Territory', 'Darwin Northern Territory Australia barramundi fishing flats'],
  'Christmas Island, Kiribati':         ['Christmas Island, Kiribati', 'Christmas Island Kiribati Pacific atoll bonefish fishing'],
  'Yasawa Islands, Fiji':               ['Yasawa Islands', 'Yasawa Islands Fiji Pacific tropical fishing landscape coral'],
  'Palau, Micronesia':                  ['Palau', 'Palau Micronesia Pacific blue water fishing reef tropical'],
  'Solomon Islands':                    ['Solomon Islands', 'Solomon Islands Melanesia Pacific coral reef tropical landscape'],
  'Papua New Guinea':                   ['Papua New Guinea', 'Papua New Guinea coral coast reef fishing tropical'],
  'Tonga, South Pacific':               ['Tonga', 'Tonga South Pacific islands fishing tropical ocean landscape'],
  'New Caledonia':                      ['New Caledonia', 'New Caledonia lagoon UNESCO Pacific coral reef fishing'],

  // ── SALTWATER / OFFSHORE ─────────────────────────────────
  'Bocas del Toro, Panama':             ['Bocas del Toro', 'Bocas del Toro Panama Caribbean islands tropical fishing'],
  'Cape Verde Islands':                 ['Cape Verde', 'Cape Verde Atlantic islands ocean fishing marlin blue water'],
  'Mauritius':                          ['Mauritius', 'Mauritius Indian Ocean lagoon fishing marlin tropical island'],
  'Maldives':                           ['Maldives', 'Maldives Indian Ocean atoll tropical blue water fishing GT'],
  'Musandam Fjords, Oman':              ['Musandam Peninsula', 'Musandam Oman fjord Arabian Sea fishing landscape'],
  'Andaman Islands, India':             ['Andaman and Nicobar Islands', 'Andaman Islands India ocean fishing tropical reef'],
  'Chesapeake Bay, Maryland':           ['Chesapeake Bay', 'Chesapeake Bay Maryland estuary fishing striped bass blue crab'],
  'Louisiana Bayou, USA':               ['Atchafalaya Basin', 'Louisiana bayou swamp red drum fishing Cajun landscape'],

  // ══════════════════════════════════════════════════════════════
  // SURFING SPOTS
  // 쉼표 없는 항목 / 이름이 혼동될 수 있는 항목만 직접 지정.
  // 나머지는 위치 추출 로직(쉼표 뒤 지명)으로 처리됨.
  // ══════════════════════════════════════════════════════════════

  // ── 쉼표 없는 서핑 항목 ────────────────────────────────────────
  'Colorado River Bar':                 ['San Juan del Sur Nicaragua', 'Nicaragua Pacific right-hand surf point'],
  'Roderigas Reef':                     ['Rodrigues Island Mauritius', 'Indian Ocean reef surf Rodrigues'],
  'Aruba Surf':                         ['Aruba', 'Caribbean Aruba trade wind beach break surfing'],
  'Solomon Islands Surf':               ['Solomon Islands', 'Marovo Lagoon Melanesia surf boat trip'],
  'Palau Reef Pass':                    ['Palau', 'Palau Micronesia crystal reef surf diving'],

  // ── 이름 혼동 방지 ─────────────────────────────────────────────
  // "Java" → Java 프로그래밍 언어 방지
  'G-Land (Grajagan), Java':            ['G-Land surf Indonesia', 'Grajagan Bay East Java surf camp remote'],
  // "Pacific" → 너무 광범위
  'Niue Island, Pacific':               ['Niue', 'Niue South Pacific coral reef island surfing'],
  // "Kyrgyzstan" → Central Asia lake surfing (very unusual)
  'Balykchi, Kyrgyzstan':               ['Issyk-Kul', 'Lake Issyk-Kul Kyrgyzstan freshwater surfing'],
  // 빙하 지역 서핑
  'Grindavik, Iceland':                 ['Grindavík', 'Iceland black sand beach surf geothermal Reykjanes'],

  // ══════════════════════════════════════════════════════════════
  // SCUBA DIVE SITES (schema-v17) — 100개 전면 교체
  // 전략: 수중/다이빙 사진 Wikipedia 문서로 직접 지정
  //        국기·지도 이미지 방지, 해양생물·난파선·산호초 사진 유도
  // ══════════════════════════════════════════════════════════════

  // ── 20pt — 세계 버킷리스트 ──────────────────────────────────
  'Raja Ampat':                         ['Raja Ampat', 'Raja Ampat coral reef fish diversity Indonesia underwater'],
  'Tubbataha Reef':                     ['Tubbataha Reefs Natural Park', 'Tubbataha Reef Philippines coral UNESCO underwater'],
  'Komodo National Park':               ['Komodo National Park', 'Komodo diving manta ray reef Indonesia underwater'],
  'Sipadan Island':                     ['Sipadan Island', 'Sipadan Malaysia turtle coral reef underwater barracuda'],
  'Milne Bay, Papua New Guinea':        ['Milne Bay', 'Milne Bay Papua New Guinea coral reef nudibranch diving'],
  'Mergui Archipelago, Myanmar':        ['Mergui Archipelago', 'Mergui Archipelago Myanmar pristine coral reef diving'],
  'Palau Blue Corner':                  ['Blue Corner Wall', 'Palau Blue Corner reef sharks drift dive underwater'],
  'Truk Lagoon, Micronesia':            ['Chuuk Lagoon', 'Truk Lagoon Chuuk WW2 Japanese wreck ship underwater'],
  'Cocos Island, Costa Rica':           ['Cocos Island', 'Cocos Island Costa Rica hammerhead sharks underwater pelagic'],
  'Darwin Arch, Galápagos':             ['Darwin Island', 'Darwin Arch Galapagos whale sharks hammerheads underwater'],
  'Tonga Humpback Whale Dive':          ['Humpback whale', 'humpback whale underwater swimming mother calf Pacific'],
  'Palau Wrecks, Micronesia':           ['Palau', 'Palau Japanese WW2 ship wreck coral reef diving underwater'],
  'Aldabra Atoll, Seychelles':          ['Aldabra', 'Aldabra Atoll Seychelles coral reef shark UNESCO underwater'],
  'Sodwana Bay, South Africa':          ['Sodwana Bay', 'Sodwana Bay South Africa coral reef scuba diving whale shark'],
  'Fernando de Noronha, Brazil':        ['Fernando de Noronha', 'Fernando de Noronha Brazil clear water coral reef underwater'],
  'SS Thistlegorm, Red Sea':            ['SS Thistlegorm', 'SS Thistlegorm WW2 wreck diving Red Sea Egypt motorcycle'],
  'Brothers Islands, Sudan':            ['Brothers Islands, Egypt', 'Brothers Islands Red Sea shark diving hammerhead Sudan'],
  'Malpelo Island, Colombia':           ['Malpelo Island', 'Malpelo Island Colombia hammerhead shark school underwater'],
  'Great Blue Hole, Belize':            ['Great Blue Hole', 'Great Blue Hole Belize diving UNESCO sinkhole stalactites'],
  'Silfra Fissure, Iceland':            ['Silfra', 'Silfra fissure Iceland diving tectonic plates crystal clear'],
  'Scapa Flow, Scotland':               ['Scapa Flow', 'Scapa Flow WW1 German warship wreck Scotland diving'],
  'Tiger Beach, Bahamas':               ['Tiger shark', 'Tiger Beach Bahamas tiger shark diving clear water'],
  'SS President Coolidge, Vanuatu':     ['SS President Coolidge', 'SS President Coolidge Vanuatu wreck diving ship interior'],
  'HMHS Britannic Wreck, Aegean':       ['HMHS Britannic', 'HMHS Britannic wreck Aegean Greece underwater ship Titanic sister'],
  'Andavadoaka, Madagascar':            ['Andavadoaka', 'Madagascar coral reef diving pristine ocean underwater'],

  // ── 15pt — 프리미어 다이빙 포인트 ──────────────────────────────
  'Nusa Penida, Bali':                  ['Nusa Penida', 'Nusa Penida Bali mola-mola manta ray diving underwater'],
  'Richelieu Rock, Thailand':           ['Richelieu Rock', 'Richelieu Rock Thailand whale shark seahorse coral diving'],
  'Similan Islands, Thailand':          ['Similan Islands', 'Similan Islands Thailand coral reef fish scuba diving Andaman'],
  'Wakatobi, Indonesia':                ['Wakatobi National Park', 'Wakatobi Indonesia pristine coral reef wall diving'],
  'Bunaken, Indonesia':                 ['Bunaken National Marine Park', 'Bunaken Indonesia vertical wall diving coral reef turtle'],
  'Apo Island, Philippines':            ['Apo Island', 'Apo Island Philippines sea turtle coral reef underwater'],
  'Moalboal, Philippines':              ['Moalboal', 'Moalboal Philippines sardine run school fish underwater coral'],
  'Coron Bay, Philippines':             ['Coron, Palawan', 'Coron Bay Philippines Japanese WW2 wreck diving coral'],
  'Koh Tao, Thailand':                  ['Ko Tao', 'Koh Tao Thailand coral reef scuba diving school fish underwater'],
  'Malapascua Island, Philippines':     ['Malapascua Island', 'Malapascua thresher shark sunrise Monad Shoal Philippines'],
  'Pulau Weh, Indonesia':               ['Pulau Weh', 'Pulau Weh Sabang Indonesia coral reef diving nudibranch'],
  'Rangiroa, French Polynesia':         ['Rangiroa', 'Rangiroa French Polynesia atoll drift diving shark dolphin'],
  'Fakarava, French Polynesia':         ['Fakarava', 'Fakarava French Polynesia grey reef shark wall diving UNESCO'],
  'Pacific Harbor, Fiji':               ['Pacific Harbour', 'Pacific Harbor Fiji bull shark bait dive underwater Beqa'],
  'Yap Island, Micronesia':             ['Yap, Federated States of Micronesia', 'Yap Island manta ray resident diving coral reef'],
  'Kona Manta Ray Night Dive, Hawaii':  ['Manta ray', 'Kona Hawaii manta ray night dive plankton lights underwater ballet'],
  'Niue, South Pacific':                ['Niue', 'Niue Pacific ocean visibility coral reef sea snake diving'],
  'North Malé Atoll, Maldives':         ['North Malé Atoll', 'Maldives coral reef diving hammerhead shark manta ray'],
  'Mafia Island, Tanzania':             ['Mafia Island', 'Mafia Island Tanzania coral reef whale shark diving pristine'],
  'Tofo Beach, Mozambique':             ['Tofo', 'Tofo Beach Mozambique manta ray whale shark diving Indian Ocean'],
  'Mayotte, Indian Ocean':              ['Mayotte', 'Mayotte Indian Ocean hammerhead shark coral reef diving'],
  'Nosy Be, Madagascar':                ['Nosy Be', 'Nosy Be Madagascar whale shark diving coral reef tropical'],
  'Ras Mohammed, Egypt':                ['Ras Mohammed National Park', 'Ras Mohammed Egypt coral reef shark jackfish Red Sea'],
  'Blue Hole Dahab, Egypt':             ['Blue Hole, Dahab', 'Blue Hole Dahab Egypt freediving sinkhole Red Sea arch'],
  'Djibouti Whale Shark, Djibouti':     ['Gulf of Tadjoura', 'Djibouti whale shark diving Bay of Tadjoura aggregation'],
  'Eilat, Israel':                      ['Eilat', 'Eilat Israel Red Sea coral reef diving clear water Moses Rock'],
  'Aqaba, Jordan':                      ['Aqaba', 'Aqaba Jordan Red Sea Cedar Pride wreck coral reef diving'],
  'Aliwal Shoal, South Africa':         ['Aliwal Shoal', 'Aliwal Shoal South Africa ragged tooth shark reef diving'],
  'Watamu Marine Park, Kenya':          ['Watamu Marine National Park', 'Watamu Kenya coral reef marine park sea turtle diving'],
  'Mnemba Atoll, Zanzibar':             ['Mnemba Island', 'Mnemba Atoll Zanzibar turtle coral reef manta ray diving'],
  'Cenotes Yucatan, Mexico':            ['Cenote', 'Cenote Yucatan Mexico cave diving stalactites halocline freshwater'],
  'Roatan, Honduras':                   ['Roatán', 'Roatan Honduras barrier reef coral diving whale shark Caribbean'],
  'Belize Barrier Reef':                ['Belize Barrier Reef', 'Belize Barrier Reef coral reef nurse shark UNESCO diving'],
  'Bat Islands, Costa Rica':            ['Isla Murciélago', 'Bat Islands Costa Rica bull shark diving Guanacaste reef'],
  'Coiba Island, Panama':               ['Coiba Island', 'Coiba Island Panama UNESCO whale shark coral reef diving'],
  'El Hierro Marine Reserve, Spain':    ['El Hierro', 'El Hierro Canary Islands marine reserve angel shark lava diving'],
  'Norway Fjord Diving, Norway':        ['Fjord (Norway)', 'Norway fjord scuba diving cold water wolf fish anemone visibility'],
  'Kosterfjorden, Sweden':              ['Kosterfjord', 'Kosterfjorden Sweden deep fjord diving sea fan cold water'],
  'Easter Island, Chile':               ['Easter Island', 'Easter Island underwater Moai coral reef clear Pacific diving'],

  // ── 10pt — 주목 포인트 ─────────────────────────────────────
  'Great Barrier Reef, Australia':      ['Great Barrier Reef', 'Great Barrier Reef Australia coral reef fish UNESCO underwater'],
  'New Caledonia Shark Bay':            ['New Caledonia', 'New Caledonia lagoon UNESCO coral reef bull shark diving'],
  'Norfolk Island, Pacific':            ['Norfolk Island', 'Norfolk Island HMAS Sirius wreck coral reef Pacific diving'],
  'Saipan Blue Hole, Northern Marianas': ['Garapan', 'Saipan Northern Mariana Islands Blue Hole WWII Zero fighter diving'],
  'Jellyfish Lake, Palau':              ['Jellyfish Lake', 'Jellyfish Lake Palau stingless jellyfish snorkel UNESCO lake'],
  'Subic Bay Wrecks, Philippines':      ['Subic Bay', 'Subic Bay Philippines WW2 wreck diving coral reef octopus'],
  'Green Island, Taiwan':               ['Green Island, Taiwan', 'Green Island Taiwan coral reef diving hot spring underwater'],
  'Koh Lipe, Thailand':                 ['Ko Lipe', 'Koh Lipe Thailand coral reef leopard shark diving Andaman Sea'],
  'Comoro Islands':                     ['Comoro Islands', 'Comoro Islands coelacanth whale shark marine park coral reef'],
  'Lakshadweep Islands, India':         ['Lakshadweep', 'Lakshadweep India coral atoll manta ray pristine reef diving'],
  'Muscat Daymaniyat, Oman':            ['Daymaniyat Islands', 'Daymaniyat Islands Oman coral reef turtle spinner dolphin'],
  'NEOM Red Sea, Saudi Arabia':         ['NEOM', 'NEOM Saudi Arabia Red Sea pristine coral reef diving untouched'],
  'Tyre Marine Reserve, Lebanon':       ['Tyre, Lebanon', 'Tyre Lebanon Mediterranean Byzantine underwater archaeology diving'],
  'Zenobia, Cyprus':                    ['Zenobia (ferry)', 'Zenobia Cyprus ferry wreck Mediterranean scuba diving 1980'],
  'Lanzarote MUSA, Spain':              ['Museo Atlántico', 'Lanzarote MUSA underwater museum sculpture coral Canary Islands'],
  'Marseille Calanques, France':        ['Calanques National Park', 'Marseille Calanques diving gorgonian fan coral octopus Mediterranean'],
  'Hvar, Croatia':                      ['Hvar', 'Hvar Croatia Adriatic sea cave WW2 wreck diving clear water'],
  'Santorini Caldera, Greece':          ['Santorini', 'Santorini caldera volcanic fumaroles underwater Mediterranean diving'],
  'Bodrum Wrecks, Turkey':              ['Bodrum', 'Bodrum Turkey Aegean ancient Byzantine wreck amphora diving'],
  'Menorca Sea Caves, Spain':           ['Menorca', 'Menorca Spain sea cave Mediterranean diving posidonia reef'],
  'Florida Keys, USA':                  ['Florida Keys National Marine Sanctuary', 'Florida Keys coral reef Christ Abyss statue diving USA'],
  'Florida Springs, USA':               ['Florida Springs', 'Florida Springs crystal clear cave spring diving manatee USA'],
  'Baja California Sea of Cortez':      ['Gulf of California', 'Sea of Cortez Baja California mobula ray sea lion diving'],
  'RMS Rhone, British Virgin Islands':  ['RMS Rhone', 'RMS Rhone British Virgin Islands shipwreck 1867 coral covered'],
  'Campbell River, Canada':             ['Campbell River, British Columbia', 'Campbell River Canada giant Pacific octopus wolf eel diving'],
  'Bermuda':                            ['Bermuda', 'Bermuda Atlantic wrecks 300 ship wreck diving clear water reef'],
  'Stingray City, Cayman Islands':      ['Stingray City', 'Stingray City Grand Cayman friendly stingray shallow water'],

  // ══════════════════════════════════════════════════════════════
  // SKI RESORTS (schema-v6-fix + schema-v18)
  // 전략: 각 리조트 Wikipedia 정확 문서명 + 'ski resort winter snow'
  //        키워드 → 눈덮인 슬로프/리조트 전경 사진 유도
  // ══════════════════════════════════════════════════════════════

  // ── 프랑스 ────────────────────────────────────────────────────
  'Chamonix':                           ['Chamonix', 'Chamonix Mont Blanc ski resort winter snow slopes aerial'],
  'Val d\'Isere':                       ['Val d\'Isère', 'Val d\'Isere ski resort winter snow piste alpine France'],
  'Courchevel 1850':                    ['Courchevel', 'Courchevel 1850 ski resort winter snow Three Valleys luxury'],
  'Meribel':                            ['Méribel', 'Meribel ski resort winter snow Three Valleys France slope'],
  'La Plagne':                          ['La Plagne', 'La Plagne ski resort winter snow France bobsled slope'],
  'Les Gets Morzine':                   ['Les Gets', 'Les Gets Morzine ski resort Portes du Soleil winter snow'],
  'Avoriaz':                            ['Avoriaz', 'Avoriaz car-free ski resort winter snow horse sleigh France'],
  'Alpe d\'Huez':                       ['Alpe d\'Huez', 'Alpe d\'Huez ski resort winter snow 245km slopes France'],
  'Tignes':                             ['Tignes', 'Tignes ski resort Grande Motte glacier winter snow France'],
  'Megève':                             ['Megève', 'Megève ski resort elegant winter snow Haute-Savoie France village'],

  // ── 스위스 ────────────────────────────────────────────────────
  'Zermatt':                            ['Zermatt', 'Zermatt ski resort Matterhorn winter snow Switzerland slopes'],
  'Verbier':                            ['Verbier', 'Verbier ski resort winter snow 4 Vallees Switzerland slope'],
  'Davos Parsenn':                      ['Davos', 'Davos Parsenn ski resort winter snow Switzerland slope aerial'],
  'St Moritz':                          ['St. Moritz', 'St Moritz ski resort winter snow Switzerland luxury Engadine'],
  'Grindelwald Jungfrau':               ['Grindelwald', 'Grindelwald Jungfrau ski resort winter snow Eiger Switzerland'],
  'Andermatt-Sedrun':                   ['Andermatt', 'Andermatt Sedrun ski resort winter snow Switzerland Alps slope'],
  'Saas-Fee':                           ['Saas-Fee', 'Saas-Fee glacier ski resort winter snow car-free Switzerland'],
  'Flims Laax':                         ['Laax (ski resort)', 'Flims Laax ski resort snowboard Switzerland winter snow halfpipe'],
  'Arosa Lenzerheide':                  ['Arosa', 'Arosa Lenzerheide ski resort winter snow Switzerland slopes'],

  // ── 오스트리아 ───────────────────────────────────────────────
  'St Anton am Arlberg':                ['St. Anton am Arlberg', 'St Anton ski resort winter snow Arlberg Austria slopes'],
  'Ischgl':                             ['Ischgl', 'Ischgl ski resort winter snow Silvretta Arena Austria slope'],
  'Kitzbuehel':                         ['Kitzbühel', 'Kitzbuhel Hahnenkamm ski resort winter snow Austria slope'],
  'Mayrhofen':                          ['Mayrhofen', 'Mayrhofen Harakiri ski resort winter snow Austria Tyrol slopes'],
  'Bad Gastein':                        ['Bad Gastein', 'Bad Gastein ski resort winter snow Gasteinertal Austria thermal'],
  'Lech':                               ['Lech am Arlberg', 'Lech Arlberg ski resort winter snow Austria powder prestige'],
  'Söll Ski Welt':                      ['Söll', 'Soll Ski Welt ski resort winter snow Wilder Kaiser Austria slopes'],
  'Hintertux Glacier':                  ['Hintertux Glacier', 'Hintertux Glacier year-round ski resort winter snow Austria'],
  'Saalbach-Hinterglemm':               ['Saalbach-Hinterglemm', 'Saalbach Hinterglemm Ski Circus winter snow Austria slopes'],

  // ── 이탈리아 ─────────────────────────────────────────────────
  'Cortina d\'Ampezzo':                 ['Cortina d\'Ampezzo', 'Cortina d\'Ampezzo ski resort Dolomites winter snow Italy'],
  'Madonna di Campiglio':               ['Madonna di Campiglio', 'Madonna di Campiglio ski resort winter snow Italy Dolomites'],
  'Sestriere':                          ['Sestrière', 'Sestriere ski resort Milky Way winter snow Italy 1988 World Cup'],
  'Alta Badia':                         ['Alta Badia', 'Alta Badia Sella Ronda ski resort Dolomites winter snow Italy'],
  'Cervinia Breuil':                    ['Breuil-Cervinia', 'Cervinia Breuil ski resort Matterhorn winter snow Italy slopes'],
  'Kronplatz, South Tyrol':             ['Plan de Corones', 'Kronplatz Plan de Corones ski resort Dolomites winter snow Italy'],

  // ── 독일 ─────────────────────────────────────────────────────
  'Garmisch-Partenkirchen':             ['Garmisch-Partenkirchen', 'Garmisch-Partenkirchen ski resort Zugspitze winter snow Germany'],

  // ── 스칸디나비아 ──────────────────────────────────────────────
  'Levi':                               ['Levi, Finland', 'Levi Lapland ski resort winter snow northern lights Finland Arctic'],
  'Are':                                ['Åre', 'Are Åre ski resort Sweden winter snow World Championships slope'],
  'Oslo Holmenkollen':                  ['Holmenkollen ski arena', 'Holmenkollen ski jump Oslo winter snow Norway Nordic FIS'],
  'Geilo':                              ['Geilo', 'Geilo ski resort Norway winter snow Hardangervidda plateau slopes'],
  'Ruka':                               ['Ruka', 'Ruka ski resort Arctic Circle Finland winter snow slopes reindeer'],

  // ── 스페인 · 안도라 ───────────────────────────────────────────
  'Grandvalira':                        ['Grandvalira', 'Grandvalira ski resort Andorra Pyrenees winter snow slopes'],
  'Sierra Nevada Spain':                ['Sierra Nevada (Spain)', 'Sierra Nevada Spain ski resort winter snow Granada slopes Mediterranean'],
  'Formigal':                           ['Formigal', 'Formigal ski resort Spain Pyrenees winter snow slopes largest'],
  'Baqueira-Beret':                     ['Baqueira-Beret', 'Baqueira Beret ski resort Spain Pyrenees winter snow royal slopes'],

  // ── 동유럽 ───────────────────────────────────────────────────
  'Bansko':                             ['Bansko', 'Bansko ski resort Bulgaria Pirin Mountains winter snow slopes gondola'],
  'Poiana Brasov':                      ['Poiana Brasov', 'Poiana Brasov ski resort Romania Transylvania winter snow slopes'],
  'Zakopane':                           ['Zakopane', 'Zakopane ski resort Poland Tatra Mountains winter snow slopes Kasprowy'],
  'Jasna':                              ['Jasná', 'Jasna ski resort Slovakia High Tatras winter snow slopes World Cup'],
  'Kranjska Gora':                      ['Kranjska Gora', 'Kranjska Gora ski resort Slovenia Julian Alps winter snow slopes'],
  'Malbun':                             ['Malbun', 'Malbun Liechtenstein ski resort winter snow principality small slopes'],
  'Cimislia':                           ['Cimișlia', 'Moldova winter ski small ski slope Cimislia Balkan snow ski'],

  // ── 코카서스 / 중앙아시아 ────────────────────────────────────
  'Gudauri':                            ['Gudauri', 'Gudauri ski resort Georgia Caucasus winter snow heli-skiing slopes'],
  'Tsakhkadzor':                        ['Tsaghkadzor', 'Tsakhkadzor ski resort Armenia Caucasus winter snow slopes Ararat'],
  'Bakhmaro':                           ['Bakhmaro', 'Bakhmaro ski resort Georgia Caucasus winter snow untouched meadow'],
  'Shymbulak':                          ['Shymbulak Ski Resort', 'Shymbulak Almaty Kazakhstan ski resort winter snow slopes gondola'],
  'Karakol':                            ['Karakol (city)', 'Karakol Kyrgyzstan ski resort Tian Shan winter snow powder slopes'],
  'Fann Mountains':                     ['Fann Mountains', 'Fann Mountains Tajikistan backcountry ski winter snow yurt'],
  'Elbrus':                             ['Elbrus', 'Mount Elbrus ski resort Russia Europe highest peak winter snow slopes'],
  'Rosa Khutor':                        ['Rosa Khutor Alpine Resort', 'Rosa Khutor ski resort Sochi Russia 2014 Olympics winter snow'],
  'Naltar':                             ['Naltar', 'Naltar ski resort Pakistan Gilgit winter snow Karakoram slopes'],

  // ── 북미 ─────────────────────────────────────────────────────
  'Aspen Snowmass':                     ['Aspen/Snowmass', 'Aspen Snowmass ski resort Colorado winter snow four mountains'],
  'Vail':                               ['Vail Ski Resort', 'Vail ski resort Blue Sky Basin Colorado winter snow back bowls'],
  'Park City':                          ['Park City Mountain', 'Park City ski resort Utah winter snow 2002 Olympics slopes'],
  'Squaw Valley':                       ['Palisades Tahoe', 'Squaw Valley Palisades Tahoe ski resort Lake Tahoe winter snow'],
  'Jackson Hole':                       ['Jackson Hole Mountain Resort', 'Jackson Hole ski resort Wyoming winter snow Corbet Couloir tram'],
  'Steamboat Springs':                  ['Steamboat Ski Resort', 'Steamboat Springs ski resort Colorado champagne powder winter snow'],
  'Telluride':                          ['Telluride Ski Resort', 'Telluride ski resort Colorado box canyon winter snow village gondola'],
  'Sun Valley':                         ['Sun Valley Resort', 'Sun Valley Idaho ski resort Bald Mountain winter snow classic'],
  'Mammoth Mountain':                   ['Mammoth Mountain Ski Area', 'Mammoth Mountain ski resort California winter snow volcanic 3500 acres'],
  'Breckenridge':                       ['Breckenridge Ski Resort', 'Breckenridge ski resort Colorado winter snow five peaks historic town'],
  'Stowe':                              ['Stowe Mountain Resort', 'Stowe Vermont ski resort Mount Mansfield winter snow New England classic'],
  'Killington':                         ['Killington Resort', 'Killington ski resort Vermont winter snow East largest Beast slopes'],

  // ── 캐나다 ───────────────────────────────────────────────────
  'Whistler Blackcomb':                 ['Whistler Blackcomb', 'Whistler Blackcomb ski resort British Columbia winter snow PEAK 2 PEAK'],
  'Lake Louise':                        ['Lake Louise Ski Resort', 'Lake Louise ski resort Alberta winter snow turquoise lake Rocky Mountain'],
  'Banff Sunshine':                     ['Sunshine Village Ski Resort', 'Banff Sunshine Village ski resort Rocky Mountain winter snow Alberta'],
  'Big White':                          ['Big White Ski Resort', 'Big White ski resort British Columbia winter snow ghost trees village'],
  'Marmot Basin':                       ['Marmot Basin', 'Marmot Basin Jasper Alberta ski resort Rocky Mountain winter snow elk'],
  'Mont-Tremblant':                     ['Mont-Tremblant Ski Resort', 'Mont Tremblant ski resort Quebec winter snow French village Laurentians'],
  'Revelstoke':                         ['Revelstoke Mountain Resort', 'Revelstoke ski resort British Columbia world greatest vertical winter snow'],

  // ── 일본 · 한국 ──────────────────────────────────────────────
  'Niseko':                             ['Niseko', 'Niseko Hokkaido ski resort Japan powder snow Japow slopes winter'],
  'Hakuba':                             ['Hakuba, Nagano', 'Hakuba Japan ski resort Nagano 1998 Olympics winter snow Alps'],
  'Myoko Kogen':                        ['Myoko Kogen', 'Myoko Kogen ski resort Japan Niigata powder snow winter onsen'],
  'Alpensia Yongpyong':                 ['Yongpyong Resort', 'Yongpyong ski resort Korea 2018 Olympics winter snow Dragon Valley'],

  // ── 남미 ─────────────────────────────────────────────────────
  'Las Leñas':                          ['Las Leñas', 'Las Lenas ski resort Argentina Andes winter snow expert terrain'],
  'Valle Nevado':                       ['Valle Nevado', 'Valle Nevado ski resort Chile Andes winter snow Santiago slopes'],
  'Portillo':                           ['Portillo, Chile', 'Portillo ski resort Chile Andes winter snow yellow hotel Laguna'],
  'Cerro Catedral':                     ['Cerro Catedral', 'Cerro Catedral Bariloche Argentina ski resort Andes winter snow condor'],

  // ── 오세아니아 ───────────────────────────────────────────────
  'New Zealand Skiing':                 ['Treble Cone', 'New Zealand Treble Cone Cardrona ski resort Southern Alps winter snow'],
  'The Remarkables':                    ['The Remarkables', 'The Remarkables ski resort Queenstown New Zealand winter snow peaks'],
  'Mt Buller':                          ['Mount Buller', 'Mt Buller ski resort Victoria Australia winter snow slopes Melbourne'],

  // ── 중동 · 아프리카 · 희귀 ──────────────────────────────────
  'Mount Hermon':                       ['Mount Hermon', 'Mount Hermon ski resort Israel Golan Heights winter snow slopes'],
  'The Cedars':                         ['The Cedars (ski resort)', 'The Cedars Lebanon ski resort Cedar Reserve winter snow slopes'],
  'Dizin':                              ['Dizin ski resort', 'Dizin ski resort Iran Tehran winter snow slopes 3600m'],
  'Oukaimeden':                         ['Oukaimeden', 'Oukaimeden Morocco Atlas Mountains ski resort winter snow Africa'],
  'Afriski':                            ['Afriski Mountain Resort', 'Afriski Lesotho Southern Africa ski resort winter snow slopes Kingdom'],
  'Drakensberg Ski':                    ['Tiffindell ski resort', 'Tiffindell South Africa ski resort snow winter Eastern Cape slopes'],
  'Sky Resort Ulaanbaatar':             ['Sky Resort (Mongolia)', 'Sky Resort Ulaanbaatar Mongolia ski winter snow steppes city slopes'],
  'Masikryong':                         ['Masikryong', 'Masikryong ski resort North Korea winter snow Pyongyang slopes'],
  'Bamiyan':                            ['Bamyan', 'Bamiyan Afghanistan Hindu Kush ski Band-e-Amir winter snow slopes'],
  'Bhutan Skiing':                      ['Bhutan', 'Bhutan helicopter skiing Himalaya winter snow mountain backcountry'],

  // ══════════════════════════════════════════════════════════════
  // NATURE SPOTS
  // 문제 유형:
  //   A) cleanTitle() 이 "National Park" 제거 → 엉뚱한 인물 사진
  //   B) 브랜드/지명이 너무 광범위 → 국가지도·일반 풍경
  //   C) Wikipedia 특정 항목명과 불일치 → 잘못된 사진
  // ══════════════════════════════════════════════════════════════

  // ── [A] "National Park" 제거 시 인물·엉뚱한 항목 검색됨 ─────────
  // "Kruger National Park" → cleanTitle → "Kruger" → Paul Kruger 대통령 초상화
  'Kruger National Park':               ['Kruger National Park', 'Kruger National Park elephant South Africa Big Five safari savanna'],
  // "Kakadu National Park" → "Kakadu" → 대체로 OK 이나 명시적으로 지정
  'Kakadu National Park':               ['Kakadu National Park', 'Kakadu Aboriginal rock art saltwater crocodile wetlands Australia'],
  // "Urho Kekkonen NP" → "NP"는 제거 안되나 Wikipedia 정확 명칭 보장
  'Urho Kekkonen NP':                   ['Urho Kekkonen National Park', 'Finnish Lapland subarctic wilderness reindeer Sami golden eagle'],

  // ── [B] 지명·국가 수준 검색 → 지도·국기 사진 ──────────────────
  // "Sumatra Rainforest" → "Sumatra" Wikipedia → 지도/위성사진
  'Sumatra Rainforest':                 ['Gunung Leuser National Park', 'Sumatra rainforest Indonesia UNESCO orangutan elephant tiger coexist Leuser'],
  // "Sahara Desert" → "Sahara" Wikipedia → 지도 또는 위성사진
  'Sahara Desert':                      ['Sahara', 'Erg Chebbi sand dunes Morocco Sahara camel caravan orange sunset'],
  // "Northern Lights Iceland" → aurora photo OK 이나 Iceland 특정 경관 유도
  'Northern Lights Iceland':            ['Aurora borealis Iceland', 'Iceland Northern Lights aurora borealis glacier volcanic landscape green curtain Thingvellir'],

  // ── [C] Wikipedia 특정 항목 불일치 → 잘못된 사진 ────────────────
  // "Pulo Cinta Falls" → Wikipedia "Pulo Cinta" = 하트형 섬 (리조트) 항목 → 섬 사진
  // 실제 description: 민다나오 산 위 하트형 호수 → 호수 항목으로 유도
  'Pulo Cinta Falls':                   ['Pulo Cinta', 'Pulo Cinta heart-shaped lake Mindanao Philippines mountain aerial'],
  // "Waipoua Forest" → Wikipedia 에 항목 있으나 Tane Mahuta 더 명확
  'Waipoua Forest':                     ['Waipoua Forest', 'Tane Mahuta god of forest giant kauri tree New Zealand 2000 years ancient Northland'],
  // "Champagne Pool" → Wikipedia "Champagne" 와인 지역으로 잘못 검색될 수 있음
  'Champagne Pool':                     ['Champagne Pool', 'Wai-O-Tapu Champagne Pool geothermal Rotorua orange mineral New Zealand thermal park'],

  // ══════════════════════════════════════════════════════════════
  // ATTRACTIONS — 연관성 낮은 이미지 교체
  // 문제 유형:
  //   A) cleanTitle() 이 "Island/Cave" 제거 → 엉뚱한 항목
  //   B) 복합 명칭이 Wikipedia 정확 문서명과 불일치
  //   C) 검색 결과가 관련 없는 사진으로 유도
  // ══════════════════════════════════════════════════════════════

  // ── Jungfraujoch Top of Europe: 복합 명칭 → Wikipedia "Jungfraujoch" 직접 ─
  'Jungfraujoch Top of Europe':         ['Jungfraujoch', 'Jungfraujoch Top of Europe highest railway station Swiss Alps glacier panorama Bernese'],
  // ── Lascaux Cave Paintings: "Cave Paintings" 자체가 Wikipedia 문서명 아님 ──
  'Lascaux Cave Paintings':             ['Lascaux', 'Lascaux cave paintings Paleolithic prehistoric art bull horse bison Dordogne France 17000 years'],
  // ── Meteora Monasteries: "Monasteries" 단어 영향으로 검색 흔들림 ──────────
  'Meteora Monasteries':                ['Meteora', 'Meteora monasteries Byzantine Orthodox rock pinnacle UNESCO Greece dramatic sunset'],
  // ── Stone Forest Shilin: Wikipedia 정식 문서명 "Stone Forest (China)" ──────
  'Stone Forest Shilin':                ['Stone Forest (China)', 'Shilin Stone Forest karst limestone pillars Yunnan China 270 million years UNESCO Yi'],
  // ── Ephesus Ancient City: "Ancient City" 부분이 혼동 유발 ─────────────────
  'Ephesus Ancient City':               ['Ephesus', 'Ephesus Library of Celsus ancient city Turkey Greco-Roman ruins facade marble columns'],
  // ── Jeju Island: cleanTitle() 이 "Island" 제거 → "Jeju" → 지도·행정구역 사진
  'Jeju Island':                        ['Jeju Island', 'Seongsan Ilchulbong Jeju Island sunrise peak Hallasan UNESCO volcanic crater Korea'],
  // ── Shwedagon Pagoda: 황금 사리탑 → Wikipedia 정확 문서 직접 지정 ──────────
  'Shwedagon Pagoda':                   ['Shwedagon Pagoda', 'Shwedagon Pagoda golden gilded stupa Yangon Myanmar Buddhist 326m gold sunset night'],
  // ── Waitomo Glowworm Caves: 동굴 천장 발광 사진 → 정확한 Wikipedia 문서명 ─
  'Waitomo Glowworm Caves':             ['Waitomo Glowworm Caves', 'Waitomo cave bioluminescent glowworm ceiling blue starry underground boat New Zealand Arachnocampa'],

  // ══════════════════════════════════════════════════════════════
  // FOODS — 엉뚱한 이미지 또는 이미지 없는 음식 항목
  // 문제 유형:
  //   A) cleanTitle 결과가 음식 외 Wikipedia 항목과 충돌
  //   B) Wikipedia 정확 문서명과 불일치 → 이미지 없음
  // ══════════════════════════════════════════════════════════════

  // ── [A] [B] FOODS 중복 키는 위쪽 정의 사용. 주석만 유지 ─────────────

  // ══════════════════════════════════════════════════════════════
  // COUNTRIES — 특정 국가 이미지 직접 지정
  // ══════════════════════════════════════════════════════════════
  'Madagascar':                         ['Flag of Madagascar', 'Madagascar flag red white green baobab lemur island'],
  'Nepal':                              ['Flag of Nepal', 'Nepal flag pennant unique double triangle crimson blue'],

  // ── [신규 추가 5개] 새로운 nature 항목 이미지 직접 지정 ────────────
  'Waitomo Glowworm Caves, New Zealand':['Waitomo Glowworm Caves', 'Arachnocampa luminosa glowworm cave New Zealand bioluminescent ceiling boat'],
  'Mount Fuji, Japan':                  ['Mount Fuji', 'Mount Fuji Japan volcano snow cap reflection Lake Kawaguchi cherry blossom'],
  'Dead Sea, Jordan':                   ['Dead Sea', 'Dead Sea salt flat floating Israel Jordan lowest point Earth turquoise mineral'],
  'Trolltunga, Norway':                 ['Trolltunga', 'Trolltunga cliff hike Norway lake Ringedalsvatnet dramatic overhang fjord landscape'],
  'Havasu Falls, Arizona':              ['Havasu Falls', 'Havasu Falls turquoise waterfall Arizona Havasupai Grand Canyon blue pool'],

  'Sint Maarten/Saint Martin':          ['Sint Maarten', 'Maho Beach Sint Maarten airplane landing Caribbean beach'],

  'Bora Bora, French Polynesia':        ['Bora Bora', 'Bora Bora lagoon Mount Otemanu overwater bungalow French Polynesia'],
  'Palawan, Philippines':               ['Palawan', 'El Nido Palawan limestone karst lagoon Philippines'],
  'Komodo Island, Indonesia':           ['Komodo (island)', 'Komodo Island Indonesia Pink Beach Flores dragon'],
  'Santa Cruz, Galapagos':              ['Santa Cruz Island (Galápagos)', 'Santa Cruz Galapagos tortoise highland lava tunnel'],
  'Zanzibar, Tanzania':                 ['Zanzibar', 'Stone Town Zanzibar Tanzania spice island Indian Ocean'],
  'Tahiti, French Polynesia':           ['Tahiti', 'Tahiti island French Polynesia Papeete mountain coastline'],
  'Moorea, French Polynesia':           ['Moorea', 'Moorea French Polynesia Cook Bay mountain lagoon tropical'],
  'Big Island, Hawaii':                 ['Hawaii (island)', 'Hawaii Big Island Kona coast lava black sand volcano'],
  'Maui, Hawaii':                       ['Maui', 'Maui Hawaii Haleakala Road to Hana coastline beach'],
  'Kauai, Hawaii':                      ['Kauai', 'Na Pali Coast Kauai Hawaii cliff coastline green valley'],
  'Oahu, Hawaii':                       ['Oahu', 'Waikiki Beach Oahu Hawaii Diamond Head coastline'],
  'Cayo Coco, Cuba':                    ['Cayo Coco', 'Cayo Coco Cuba beach flamingo coral cay Caribbean'],
  'St Lucia':                           ['Saint Lucia', 'Pitons Saint Lucia Sulphur Springs volcano Caribbean'],
  'Dominica':                           ['Dominica', 'Dominica Boiling Lake Trafalgar Falls rainforest Caribbean'],
  'Antigua':                            ['Antigua', 'Antigua Caribbean beach English Harbour Nelson Dockyard'],
  'Sao Miguel, Azores':                ['São Miguel Island', 'Sete Cidades Lake Sao Miguel Azores twin crater'],
  'Madeira, Portugal':                  ['Madeira', 'Madeira island Portugal Funchal coastline cliff levada'],
  'La Gomera, Canary Islands':          ['La Gomera', 'Garajonay National Park La Gomera Canary Islands rainforest'],
  'El Hierro, Canary Islands':          ['El Hierro', 'El Hierro Canary Islands coastline Mar de las Calmas'],
  'Lanzarote, Canary Islands':          ['Lanzarote', 'Timanfaya National Park Lanzarote volcanic landscape Canary'],
  'Sardinia, Italy':                    ['Sardinia', 'Costa Smeralda Sardinia Italy emerald water coastline'],
  'Corsica, France':                    ['Corsica', 'Scandola Reserve Corsica France coastline cliff UNESCO'],
  'Sicily, Italy':                     ['Sicily', 'Taormina Sicily Italy coast Mount Etna Mediterranean'],
  'Ibiza, Spain':                       ['Ibiza', 'Ibiza Spain Es Vedra rock sunset beach Mediterranean'],
  'Mallorca, Spain':                    ['Mallorca', 'Mallorca Spain Serra de Tramuntana coastline cove Mediterranean'],
  'Formentera, Spain':                  ['Formentera', 'Ses Illetes Formentera Spain beach turquoise Balearic'],
  'Santorini, Greece':                  ['Santorini', 'Oia Santorini Greece caldera white church sunset'],
  'Mykonos, Greece':                   ['Mykonos', 'Mykonos Greece windmill Little Venice Cyclades beach'],
  'Crete, Greece':                      ['Crete', 'Balos Lagoon Crete Greece pink sand coastline Mediterranean'],
  'Corfu, Greece':                      ['Corfu', 'Paleokastritsa Corfu Greece coastline monastery Ionian'],
  'Vis, Croatia':                      ['Vis (island)', 'Vis Croatia Blue Grotto Bisevo coastline Dalmatian'],
  'Korcula, Croatia':                   ['Korčula', 'Korcula Croatia old town Marco Polo Adriatic coastline'],
  'Tasmania, Australia':                ['Tasmania', 'Cradle Mountain Tasmania Australia lake mountain wilderness'],
  'Upolu, Samoa':                       ['Upolu', 'Upolu Samoa To Sua trench coastline Pacific island'],
  'Providenciales, Turks and Caicos':   ['Providenciales', 'Grace Bay Providenciales Turks and Caicos beach turquoise'],
  'Eleuthera, Bahamas':                 ['Eleuthera', 'Glass Window Bridge Eleuthera Bahamas Atlantic Caribbean'],
  'Cayo Santa Maria, Cuba':             ['Cayo Santa María', 'Cayo Santa Maria Cuba beach coral cay Caribbean'],
  'Marie-Galante, Guadeloupe':          ['Marie-Galante', 'Marie-Galante Guadeloupe beach sugar plantation Caribbean'],
  'Guadeloupe, France':                 ['Guadeloupe', 'Guadeloupe Carbet Falls Soufriere volcano Caribbean coastline'],
  'San Andres, Colombia':               ['San Andrés Island', 'San Andres Colombia Caribbean Sea of Seven Colors beach'],
  'Ilha Grande, Brazil':                ['Ilha Grande', 'Ilha Grande Brazil Lopes Mendes beach Atlantic rainforest'],
  'Reunion Island, France':             ['Réunion', 'Piton de la Fournaise Reunion volcano lava Indian Ocean'],

  'Faroe Islands, Denmark':             ['Gásadalur', 'Gasadalur Faroe Islands waterfall cliff coastline scenic'],
  'Svalbard, Norway':                   ['Longyearbyen', 'Longyearbyen Svalbard fjord mountain Arctic landscape scenic'],
  'Ilulissat, Greenland':               ['Ilulissat Icefjord', 'Ilulissat icefjord Greenland giant iceberg UNESCO sunset'],
  'Heimaey, Westman Islands':           ['Heimaey', 'Westman Islands Iceland puffin volcano eruption 1973'],
  'Iceland (island nation)':            ['Iceland', 'Iceland landscape aurora waterfall Seljalandsfoss volcanic island'],

  'Anguilla':                           ['Shoal Bay East', 'Shoal Bay Anguilla Caribbean white sand turquoise coastline scenic'],
  'Saba, Dutch Caribbean':              ['Mount Scenery', 'Saba island volcanic peak Caribbean coastline lush scenic'],
  'Nauru':                              ['Anibare Bay', 'Nauru coastline Pacific lagoon cliff scenic landscape'],
  'Funafuti, Tuvalu':                   ['Funafuti Conservation Area', 'Funafuti atoll Tuvalu lagoon coral reef scenic'],
  'Tarawa, Kiribati':                   ['Bairiki', 'Tarawa atoll Kiribati lagoon Pacific coral reef scenic'],
  'Majuro, Marshall Islands':           ['Laura Beach, Majuro', 'Majuro Marshall Islands atoll lagoon beach Pacific scenic'],
  'Yap, Micronesia':                    ['Yap island', 'Yap Micronesia stone money manta ray traditional'],
  'Malaita, Solomon Islands':           ['Malaita', 'Malaita Solomon Islands artificial island lagoon Melanesia traditional'],
  'Tristan da Cunha':                   ['Edinburgh of the Seven Seas', 'Tristan da Cunha volcanic island coastline South Atlantic scenic'],
  'Ascension Island':                   ['Long Beach, Ascension Island', 'Ascension Island coastline beach turtle nesting South Atlantic scenic'],
  'St Helena, British territory':       ['Jamestown, Saint Helena', 'Saint Helena James Bay coastline volcanic South Atlantic scenic'],
  'Niue Island':                        ['Matapa Chasm', 'Niue South Pacific chasm coral arch coastline scenic'],
  'Christmas Island':                   ['Dolly Beach', 'Christmas Island red crab beach Indian Ocean coastline scenic'],

  'Rock Islands, Palau':                ['Rock Islands', 'Palau Rock Islands limestone mushroom UNESCO Jellyfish Lake'],
  'Ha apai, Tonga':                     ['Haʻapai', 'Haapai Tonga humpback whale pristine atoll pink sand beach'],
  'Aitutaki, Cook Islands':             ['Aitutaki', 'Aitutaki lagoon Cook Islands One Foot Island gin-clear turquoise'],
  'Our Lady of the Rocks, Montenegro':  ['Our Lady of the Rocks', 'Gospa od Skrpjela Montenegro Bay of Kotor island church'],
  'Praslin, Seychelles':                ['Praslin', 'Anse Lazio Praslin Seychelles palm beach UNESCO coco de mer'],
  'Stewart Island (Rakiura), New Zealand':['Rakiura National Park', 'Stewart Island New Zealand kiwi pristine remote southern'],
  'Lord Howe Island, Australia':        ['Lord Howe Island', 'Lord Howe Island Australia Balls Pyramid UNESCO lagoon coral'],
  'Fraser Island (K gari), Australia':  ['Fraser Island', 'K gari Fraser Island Australia sand dune freshwater lake dingo'],
  'Tanna, Vanuatu':                     ['Tanna', 'Yasur volcano Tanna Vanuatu active lava night custom village'],
  'Lifou, New Caledonia':               ['Lifou', 'Lifou New Caledonia lagoon coral reef pink sand tropical Pacific'],
  'British Virgin Islands':             ['The Baths, Virgin Gorda', 'British Virgin Islands Tortola beach turquoise coastline scenic'],
  'Falkland Islands':                   ['Sea Lion Island', 'Falkland Islands coastline penguin beach landscape South Atlantic scenic'],
  'South Georgia':                      ['St Andrews Bay, South Georgia', 'South Georgia king penguin beach glacier coastline scenic'],

  // ── 국가/섬 나라 — 국기 대신 대표 해변·경치 ───────────────────────
  'Malta Island':                       ['Blue Lagoon, Malta', 'Malta Blue Lagoon Comino coastline Mediterranean scenic'],
  'Gozo, Malta':                        ['Ramla Bay', 'Ramla Bay Gozo Malta red sand beach Mediterranean scenic'],
  'Cyprus':                             ['Cape Greco', 'Cape Greco Cyprus coastline sea caves Mediterranean scenic'],
  'Jamaica':                            ['Seven Mile Beach', 'Seven Mile Beach Jamaica Negril turquoise Caribbean scenic'],
  'Barbados':                           ['Crane Beach, Barbados', 'Crane Beach Barbados cliff pink sand Caribbean scenic'],
}

// Noise words to strip from titles for better Wikipedia matching
const NOISE_WORDS = /\b(Golf Club|Golf Course|Golf Links|Country Club|National Park|Marine Reserve|Marine Park|Restaurant|Cafe|Bistro|Brasserie|Hotel|Resort|Beach|Island)\b/gi

function cleanTitle(titleEn: string): string {
  return titleEn
    .split('(')[0]
    .split(' - ')[0]
    .split(' &')[0]
    .replace(NOISE_WORDS, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Wikipedia helpers ──────────────────────────────────────────────────────
// Wikimedia 정책: API 요청 시 User-Agent 필수. 없으면 403 등으로 차단될 수 있음.
const WIKI_FETCH_OPTIONS: RequestInit = {
  signal: AbortSignal.timeout(12000),
  headers: { 'User-Agent': 'MyTripfy/1.0 (https://mytripfy.com; travel challenge app)' },
}

async function wikiSummary(title: string): Promise<string | null> {
  if (!title.trim()) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      WIKI_FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const src = data?.thumbnail?.source
    return src ? src.replace(/\/\d+px-/, '/640px-') : null
  } catch { return null }
}

async function wikiSearch(query: string): Promise<string | null> {
  if (!query.trim()) return null
  try {
    const firstTitle = await getFirstSearchResultTitle(query)
    if (!firstTitle) return null
    return wikiSummary(firstTitle)
  } catch { return null }
}

/** Wikipedia 검색 결과 첫 번째 문서 제목만 반환 (썸네일 없이). art_galleries 폴백 등에서 사용 */
async function getFirstSearchResultTitle(query: string): Promise<string | null> {
  if (!query.trim()) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`,
      WIKI_FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const firstTitle = data?.query?.search?.[0]?.title
    return firstTitle ?? null
  } catch { return null }
}

// ─── 100 Drinks 전용: 문서 내 이미지 중 병/제품 이미지 직접 선택 (대표 이미지=건물/인물 회피)
const DRINK_IMAGE_GOOD = /\b(bottle|bouteille|wine|whisky|whiskey|beer|rum|vodka|gin|tequila|mezcal|cognac|champagne|label|product|glass|cuvee|cuvée|malt|spirit|sake|soju|liquor|liqueur|scotch|bourbon|brandy|armagnac|sherry|port|ale|lager|stout|bock|weiss|hefe|verre|flasche|fles)\b/i
const DRINK_IMAGE_BAD = /\b(building|exterior|interior|facade|vineyard|cellar|person|people|portrait|couple|man\s+and|woman\s+and|team|group|map|location|aerial|street|town|estate\s+view|castle|chateau\s*exterior|domaine\s*building|wedding|event|promotion)\b/i

async function getPageImageTitles(articleTitle: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=images&format=json&origin=*`,
      WIKI_FETCH_OPTIONS
    )
    if (!res.ok) return []
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return []
    const page = Object.values(pages) as Array<{ images?: Array<{ title: string }> }>
    const imgs = page[0]?.images
    return (imgs ?? []).map((i) => i.title).filter((t) => t.startsWith('File:'))
  } catch { return [] }
}

function scoreDrinkImageFilename(fileTitle: string): number {
  const name = fileTitle.replace(/^File:/i, '').replace(/\.[a-z]+$/i, '')
  const lower = name.toLowerCase()
  if (DRINK_IMAGE_BAD.test(lower)) return -10
  if (DRINK_IMAGE_GOOD.test(lower)) return 10
  if (/\d{3,}px/.test(lower) || /thumb|icon|logo|svg/.test(lower)) return 0
  return 1
}

async function getImageThumbUrl(fileTitle: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=thumburl&iiurlwidth=640&format=json&origin=*`,
      WIKI_FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null
    const page = Object.values(pages) as Array<{ imageinfo?: Array<{ thumburl?: string }> }>
    const thumb = page[0]?.imageinfo?.[0]?.thumburl
    return thumb ?? null
  } catch { return null }
}

/** 100 Drinks: 위키 문서에 포함된 이미지 중 병/제품 이미지 우선 선택 후 썸네일 URL 반환 */
async function getBestDrinkImageFromArticle(articleTitle: string): Promise<string | null> {
  const titles = await getPageImageTitles(articleTitle)
  if (titles.length === 0) return null
  const scored = titles
    .map((t) => ({ title: t, score: scoreDrinkImageFilename(t) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
  const toTry = scored.length > 0 ? scored.map((x) => x.title) : titles
  for (const fileTitle of toTry.slice(0, 6)) {
    const url = await getImageThumbUrl(fileTitle)
    if (url) return url
  }
  return null
}

// 100 Art Galleries: 문서 내 이미지 중 갤러리/건물/전시 이미지 우선 (인물·초상화 회피)
const ART_GALLERY_IMAGE_GOOD = /\b(gallery|museum|building|exterior|interior|facade|entrance|hall|exhibition|art|collection|wing|view|night|day|aerial)\b/i
const ART_GALLERY_IMAGE_BAD = /\b(person|people|portrait|painting|drawing|sculpture|artist|director|curator|man\s+and|woman\s+and|team|group|logo|icon|map|diagram|svg)\b/i

function scoreArtGalleryImageFilename(fileTitle: string): number {
  const name = fileTitle.replace(/^File:/i, '').replace(/\.[a-z]+$/i, '')
  const lower = name.toLowerCase()
  if (ART_GALLERY_IMAGE_BAD.test(lower)) return -5
  if (ART_GALLERY_IMAGE_GOOD.test(lower)) return 10
  if (/\d{3,}px/.test(lower) || /thumb|icon|logo|svg/.test(lower)) return 0
  return 1
}

/** 문서의 첫 번째 이미지 썸네일 URL (countries/foods 폴백용) */
async function getFirstImageFromArticle(articleTitle: string): Promise<string | null> {
  const titles = await getPageImageTitles(articleTitle)
  if (titles.length === 0) return null
  const url = await getImageThumbUrl(titles[0])
  return url ?? (titles.length > 1 ? await getImageThumbUrl(titles[1]) : null)
}

/** 100 Art Galleries: summary 썸네일 없을 때 문서 이미지 목록에서 갤러리/건물 이미지 선택 */
async function getBestArtGalleryImageFromArticle(articleTitle: string): Promise<string | null> {
  const titles = await getPageImageTitles(articleTitle)
  if (titles.length === 0) return null
  const scored = titles
    .map((t) => ({ title: t, score: scoreArtGalleryImageFilename(t) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
  const toTry = scored.length > 0 ? scored.map((x) => x.title) : titles
  for (const fileTitle of toTry.slice(0, 8)) {
    const url = await getImageThumbUrl(fileTitle)
    if (url) return url
  }
  return null
}

/** 100 Countries 전용: 국가명이 위키에서 다른 항목(미국 주 Georgia 등)으로 오인될 때 시도할 문서 목록 */
const COUNTRY_ARTICLE_OVERRIDES: Record<string, string[]> = {
  Georgia: ['Georgia (country)', 'Country of Georgia'],
}

/** 100 Countries: 깨지는/오인되는 항목 직접 이미지 (Commons 검증 URL). 있으면 findImage 건너뜀 */
const COUNTRIES_DIRECT_IMAGES: Record<string, string> = {
  Georgia: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Flag_of_Georgia.svg',
  Switzerland: 'https://flagcdn.com/w320/ch.png',
  'Costa Rica': 'https://flagcdn.com/w320/cr.png',
  'Cape Verde': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Flag_of_Cape_Verde.svg/640px-Flag_of_Cape_Verde.svg.png',
  Croatia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Flag_of_Croatia.svg/640px-Flag_of_Croatia.svg.png',
  Cuba: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Flag_of_Cuba.svg/640px-Flag_of_Cuba.svg.png',
  Hungary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Flag_of_Hungary.svg/640px-Flag_of_Hungary.svg.png',
  Israel: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flag_of_Israel.svg/640px-Flag_of_Israel.svg.png',
  Jamaica: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Flag_of_Jamaica.svg/640px-Flag_of_Jamaica.svg.png',
  Kazakhstan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Flag_of_Kazakhstan.svg/640px-Flag_of_Kazakhstan.svg.png',
  Lesotho: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Flag_of_Lesotho.svg/640px-Flag_of_Lesotho.svg.png',
  Panama: 'https://flagcdn.com/w320/pa.png',
  Paraguay: 'https://flagcdn.com/w320/py.png',
  Romania: 'https://flagcdn.com/w320/ro.png',
  Serbia: 'https://flagcdn.com/w320/rs.png',
  Slovenia: 'https://flagcdn.com/w320/si.png',
  UAE: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_United_Arab_Emirates.svg/640px-Flag_of_the_United_Arab_Emirates.svg.png',
  Uruguay: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_Uruguay.svg/640px-Flag_of_Uruguay.svg.png',
  'Democratic Republic of the Congo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_the_Democratic_Republic_of_the_Congo.svg/640px-Flag_of_the_Democratic_Republic_of_the_Congo.svg.png',
  'Republic of the Congo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Flag_of_the_Republic_of_the_Congo.svg/640px-Flag_of_the_Republic_of_the_Congo.svg.png',
  'South Korea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/640px-Flag_of_South_Korea.svg.png',
  'North Korea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_North_Korea.svg/640px-Flag_of_North_Korea.svg.png',
  Guinea: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Flag_of_Guinea.svg/640px-Flag_of_Guinea.svg.png',
  'Equatorial Guinea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Flag_of_Equatorial_Guinea.svg/640px-Flag_of_Equatorial_Guinea.svg.png',
  'Papua New Guinea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Flag_of_Papua_New_Guinea.svg/640px-Flag_of_Papua_New_Guinea.svg.png',
  Moldova: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Flag_of_Moldova.svg/640px-Flag_of_Moldova.svg.png',
  Eswatini: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Flag_of_Eswatini.svg/640px-Flag_of_Eswatini.svg.png',
  'Timor-Leste': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Flag_of_East_Timor.svg/640px-Flag_of_East_Timor.svg.png',
  'Ivory Coast': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_C%C3%B4te_d%27Ivoire.svg/640px-Flag_of_C%C3%B4te_d%27Ivoire.svg.png',
  "Côte d'Ivoire": 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_C%C3%B4te_d%27Ivoire.svg/640px-Flag_of_C%C3%B4te_d%27Ivoire.svg.png',
  'North Macedonia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_North_Macedonia.svg/640px-Flag_of_North_Macedonia.svg.png',
  'Czech Republic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_Czech_Republic.svg/640px-Flag_of_the_Czech_Republic.svg.png',
  'Czechia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_Czech_Republic.svg/640px-Flag_of_the_Czech_Republic.svg.png',
  Tanzania: 'https://flagcdn.com/w320/tz.png',
  'United Arab Emirates': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_United_Arab_Emirates.svg/640px-Flag_of_the_United_Arab_Emirates.svg.png',
  'United Kingdom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Flag_of_the_United_Kingdom.svg/640px-Flag_of_the_United_Kingdom.svg.png',
  'United States': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/640px-Flag_of_the_United_States.svg.png',
  'United States of America': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/640px-Flag_of_the_United_States.svg.png',
  Russia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Russia.svg/640px-Flag_of_Russia.svg.png',
  China: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_the_People%27s_Republic_of_China.svg/640px-Flag_of_the_People%27s_Republic_of_China.svg.png',
  'South Sudan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Flag_of_South_Sudan.svg/640px-Flag_of_South_Sudan.svg.png',
  'Taiwan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Flag_of_the_Republic_of_China.svg/640px-Flag_of_the_Republic_of_China.svg.png',
  'Palestine': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Flag_of_Palestine.svg/640px-Flag_of_Palestine.svg.png',
  'Vatican City': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Flag_of_the_Vatican_City.svg/640px-Flag_of_the_Vatican_City.svg.png',
  'Marshall Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Flag_of_the_Marshall_Islands.svg/640px-Flag_of_the_Marshall_Islands.svg.png',
  'Solomon Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Flag_of_the_Solomon_Islands.svg/640px-Flag_of_the_Solomon_Islands.svg.png',
  'Turks and Caicos Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Flag_of_the_Turks_and_Caicos_Islands.svg/640px-Flag_of_the_Turks_and_Caicos_Islands.svg.png',
  'Cayman Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Flag_of_the_Cayman_Islands.svg/640px-Flag_of_the_Cayman_Islands.svg.png',
  'British Virgin Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Flag_of_the_British_Virgin_Islands.svg/640px-Flag_of_the_British_Virgin_Islands.svg.png',
  'Sao Tome and Principe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Flag_of_Sao_Tome_and_Principe.svg/640px-Flag_of_Sao_Tome_and_Principe.svg.png',
  'São Tomé and Príncipe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Flag_of_Sao_Tome_and_Principe.svg/640px-Flag_of_Sao_Tome_and_Principe.svg.png',
  Brunei: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Brunei.svg/640px-Flag_of_Brunei.svg.png',
  Suriname: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Flag_of_Suriname.svg/640px-Flag_of_Suriname.svg.png',
  Guyana: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Flag_of_Guyana.svg/640px-Flag_of_Guyana.svg.png',
  Bahrain: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flag_of_Bahrain.svg/640px-Flag_of_Bahrain.svg.png',
  Qatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Flag_of_Qatar.svg/640px-Flag_of_Qatar.svg.png',
  Kuwait: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Flag_of_Kuwait.svg/640px-Flag_of_Kuwait.svg.png',
  Oman: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Oman.svg/640px-Flag_of_Oman.svg.png',
  Yemen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Flag_of_Yemen.svg/640px-Flag_of_Yemen.svg.png',
  Syria: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Flag_of_Syria.svg/640px-Flag_of_Syria.svg.png',
  Lebanon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Flag_of_Lebanon.svg/640px-Flag_of_Lebanon.svg.png',
  Jordan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Flag_of_Jordan.svg/640px-Flag_of_Jordan.svg.png',
  Laos: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Flag_of_Laos.svg/640px-Flag_of_Laos.svg.png',
  Myanmar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Flag_of_Myanmar.svg/640px-Flag_of_Myanmar.svg.png',
  Cambodia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Flag_of_Cambodia.svg/640px-Flag_of_Cambodia.svg.png',
  Bolivia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Flag_of_Bolivia.svg/640px-Flag_of_Bolivia.svg.png',
  'Trinidad and Tobago': 'https://flagcdn.com/w320/tt.png',
  Barbados: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Flag_of_Barbados.svg/640px-Flag_of_Barbados.svg.png',
  Bahamas: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Flag_of_the_Bahamas.svg/640px-Flag_of_the_Bahamas.svg.png',
  Malta: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Flag_of_Malta.svg/640px-Flag_of_Malta.svg.png',
  Cyprus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flag_of_Cyprus.svg/640px-Flag_of_Cyprus.svg.png',
  Luxembourg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Flag_of_Luxembourg.svg/640px-Flag_of_Luxembourg.svg.png',
  Monaco: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Flag_of_Monaco.svg/640px-Flag_of_Monaco.svg.png',
  Liechtenstein: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Flag_of_Liechtenstein.svg/640px-Flag_of_Liechtenstein.svg.png',
  Andorra: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Flag_of_Andorra.svg/640px-Flag_of_Andorra.svg.png',
  'San Marino': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Flag_of_San_Marino.svg/640px-Flag_of_San_Marino.svg.png',
  Montenegro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Flag_of_Montenegro.svg/640px-Flag_of_Montenegro.svg.png',
  Kosovo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Flag_of_Kosovo.svg/640px-Flag_of_Kosovo.svg.png',
  Iceland: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Iceland.svg/640px-Flag_of_Iceland.svg.png',
  Ireland: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Flag_of_Ireland.svg/640px-Flag_of_Ireland.svg.png',
  'New Zealand': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Flag_of_New_Zealand.svg/640px-Flag_of_New_Zealand.svg.png',
  Fiji: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Flag_of_Fiji.svg/640px-Flag_of_Fiji.svg.png',
  Samoa: 'https://flagcdn.com/w320/ws.png',
  Tonga: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Tonga.svg/640px-Flag_of_Tonga.svg.png',
  Vanuatu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Vanuatu.svg/640px-Flag_of_Vanuatu.svg.png',
  Maldives: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Flag_of_Maldives.svg/640px-Flag_of_Maldives.svg.png',
  Mauritius: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Mauritius.svg/640px-Flag_of_Mauritius.svg.png',
  Seychelles: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Seychelles.svg/640px-Flag_of_Seychelles.svg.png',
  Botswana: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_Botswana.svg/640px-Flag_of_Botswana.svg.png',
  Namibia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Flag_of_Namibia.svg/640px-Flag_of_Namibia.svg.png',
  Zambia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Flag_of_Zambia.svg/640px-Flag_of_Zambia.svg.png',
  Zimbabwe: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_Zimbabwe.svg/640px-Flag_of_Zimbabwe.svg.png',
  Malawi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Flag_of_Malawi.svg/640px-Flag_of_Malawi.svg.png',
  Rwanda: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Flag_of_Rwanda.svg/640px-Flag_of_Rwanda.svg.png',
  Uganda: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/640px-Flag_of_Uganda.svg.png',
  Kenya: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/640px-Flag_of_Kenya.svg.png',
  Ethiopia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Flag_of_Ethiopia.svg/640px-Flag_of_Ethiopia.svg.png',
  Senegal: 'https://flagcdn.com/w320/sn.png',
  Ghana: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Flag_of_Ghana.svg/640px-Flag_of_Ghana.svg.png',
  Nigeria: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/640px-Flag_of_Nigeria.svg.png',
  Morocco: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flag_of_Morocco.svg/640px-Flag_of_Morocco.svg.png',
  Tunisia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/640px-Flag_of_Tunisia.svg.png',
  Algeria: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Algeria.svg/640px-Flag_of_Algeria.svg.png',
  Libya: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Libya.svg/640px-Flag_of_Libya.svg.png',
  Egypt: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_Egypt.svg/640px-Flag_of_Egypt.svg.png',
  Sudan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_Sudan.svg/640px-Flag_of_Sudan.svg.png',
  Iran: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Flag_of_Iran.svg/640px-Flag_of_Iran.svg.png',
  Iraq: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Flag_of_Iraq.svg/640px-Flag_of_Iraq.svg.png',
  Afghanistan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Afghanistan.svg/640px-Flag_of_Afghanistan.svg.png',
  Pakistan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Pakistan.svg/640px-Flag_of_Pakistan.svg.png',
  Bangladesh: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Flag_of_Bangladesh.svg/640px-Flag_of_Bangladesh.svg.png',
  'Sri Lanka': 'https://flagcdn.com/w320/lk.png',
  Nepal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Flag_of_Nepal.svg/640px-Flag_of_Nepal.svg.png',
  Vietnam: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/640px-Flag_of_Vietnam.svg.png',
  Thailand: 'https://flagcdn.com/w320/th.png',
  Malaysia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Flag_of_Malaysia.svg/640px-Flag_of_Malaysia.svg.png',
  Indonesia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_Indonesia.svg/640px-Flag_of_Indonesia.svg.png',
  Philippines: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Flag_of_the_Philippines.svg/640px-Flag_of_the_Philippines.svg.png',
  India: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/640px-Flag_of_India.svg.png',
  Japan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Flag_of_Japan.svg/640px-Flag_of_Japan.svg.png',
  Australia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/640px-Flag_of_Australia_%28converted%29.svg.png',
  Brazil: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Brazil.svg/640px-Flag_of_Brazil.svg.png',
  Argentina: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Argentina.svg/640px-Flag_of_Argentina.svg.png',
  Chile: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Flag_of_Chile.svg/640px-Flag_of_Chile.svg.png',
  Colombia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Colombia.svg/640px-Flag_of_Colombia.svg.png',
  Peru: 'https://flagcdn.com/w320/pe.png',
  Mexico: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Mexico.svg/640px-Flag_of_Mexico.svg.png',
  Canada: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Canada.svg/640px-Flag_of_Canada.svg.png',
  France: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/640px-Flag_of_France.svg.png',
  Germany: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Flag_of_Germany.svg/640px-Flag_of_Germany.svg.png',
  Italy: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Flag_of_Italy.svg/640px-Flag_of_Italy.svg.png',
  Spain: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Spain.svg/640px-Flag_of_Spain.svg.png',
  'South Africa': 'https://flagcdn.com/w320/za.png',
  Turkey: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Flag_of_Turkey.svg/640px-Flag_of_Turkey.svg.png',
  Poland: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Flag_of_Poland.svg/640px-Flag_of_Poland.svg.png',
  Ukraine: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Ukraine.svg/640px-Flag_of_Ukraine.svg.png',
  Netherlands: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/640px-Flag_of_the_Netherlands.svg.png',
  Belgium: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Flag_of_Belgium.svg/640px-Flag_of_Belgium.svg.png',
  Austria: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_Austria.svg/640px-Flag_of_Austria.svg.png',
  Sweden: 'https://flagcdn.com/w320/se.png',
  Norway: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Norway.svg/640px-Flag_of_Norway.svg.png',
  Denmark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Denmark.svg/640px-Flag_of_Denmark.svg.png',
  Finland: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Finland.svg/640px-Flag_of_Finland.svg.png',
  Greece: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Greece.svg/640px-Flag_of_Greece.svg.png',
  Portugal: 'https://flagcdn.com/w320/pt.png',
  'United Kingdom of Great Britain and Northern Ireland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Flag_of_the_United_Kingdom.svg/640px-Flag_of_the_United_Kingdom.svg.png',
  England: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/640px-Flag_of_England.svg.png',
  Scotland: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Flag_of_Scotland.svg/640px-Flag_of_Scotland.svg.png',
  Wales: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Wales.svg/640px-Flag_of_Wales.svg.png',
  'Northern Ireland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Northern_Ireland.svg/640px-Flag_of_Northern_Ireland.svg.png',
  // 하단 리스트 깨짐 방지: 320px PNG 썸네일로 통일
  Slovakia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Flag_of_Slovakia.svg/320px-Flag_of_Slovakia.svg.png',
  Somalia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Flag_of_Somalia.svg/320px-Flag_of_Somalia.svg.png',
  Tajikistan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Flag_of_Tajikistan.svg/320px-Flag_of_Tajikistan.svg.png',
  Togo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Flag_of_Togo.svg/320px-Flag_of_Togo.svg.png',
  Turkmenistan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Flag_of_Turkmenistan.svg/320px-Flag_of_Turkmenistan.svg.png',
  Uzbekistan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Flag_of_Uzbekistan.svg/320px-Flag_of_Uzbekistan.svg.png',
  Venezuela: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Flag_of_Venezuela.svg/320px-Flag_of_Venezuela.svg.png',
  Estonia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Flag_of_Estonia.svg/320px-Flag_of_Estonia.svg.png',
  Latvia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Flag_of_Latvia.svg/320px-Flag_of_Latvia.svg.png',
  Lithuania: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Flag_of_Lithuania.svg/320px-Flag_of_Lithuania.svg.png',
  Bulgaria: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Bulgaria.svg/320px-Flag_of_Bulgaria.svg.png',
  Belarus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Flag_of_Belarus.svg/320px-Flag_of_Belarus.svg.png',
  Azerbaijan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Azerbaijan.svg/320px-Flag_of_Azerbaijan.svg.png',
  Armenia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_Armenia.svg/320px-Flag_of_Armenia.svg.png',
  Madagascar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Madagascar.svg/320px-Flag_of_Madagascar.svg.png',
  Mozambique: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Flag_of_Mozambique.svg/320px-Flag_of_Mozambique.svg.png',
  Angola: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Flag_of_Angola.svg/320px-Flag_of_Angola.svg.png',
  Cameroon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Flag_of_Cameroon.svg/320px-Flag_of_Cameroon.svg.png',
  Niger: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Flag_of_Niger.svg/320px-Flag_of_Niger.svg.png',
  Mali: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Flag_of_Mali.svg/320px-Flag_of_Mali.svg.png',
  Ecuador: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Flag_of_Ecuador.svg/320px-Flag_of_Ecuador.svg.png',
  'Dominican Republic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_the_Dominican_Republic.svg/320px-Flag_of_the_Dominican_Republic.svg.png',
  Guatemala: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Flag_of_Guatemala.svg/320px-Flag_of_Guatemala.svg.png',
  Honduras: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Flag_of_Honduras.svg/320px-Flag_of_Honduras.svg.png',
  'El Salvador': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Flag_of_El_Salvador.svg/320px-Flag_of_El_Salvador.svg.png',
  Nicaragua: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Flag_of_Nicaragua.svg/320px-Flag_of_Nicaragua.svg.png',
  Haiti: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Flag_of_Haiti.svg/320px-Flag_of_Haiti.svg.png',
  'Bosnia and Herzegovina': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Flag_of_Bosnia_and_Herzegovina.svg/320px-Flag_of_Bosnia_and_Herzegovina.svg.png',
  Albania: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Flag_of_Albania.svg/320px-Flag_of_Albania.svg.png',
  Mongolia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Mongolia.svg/320px-Flag_of_Mongolia.svg.png',
}

// Main image finder — tries multiple strategies, returns first hit
// skipRestaurantDirect: true면 100 Restaurants 직접 URL(트립어드바이저 등) 건너뛰고 위키 폴백 사용 (핫링크 차단 시 사용)
async function findImage(
  titleEn: string,
  category: string,
  options?: { skipRestaurantDirect?: boolean }
): Promise<string | null> {
  // ── Step 0a: 직접 이미지 (100 Drinks / 100 Attractions / 100 Restaurants / 100 Foods)
  const drinksDirect = category === 'drinks' ? DRINKS_DIRECT_IMAGES[titleEn] : undefined
  if (drinksDirect) return drinksDirect
  const attractionsDirect = category === 'attractions' ? ATTRACTIONS_DIRECT_IMAGES[titleEn] : undefined
  if (attractionsDirect) return attractionsDirect
  const museumsDirect = category === 'museums' ? MUSEUMS_DIRECT_IMAGES[titleEn] : undefined
  if (museumsDirect) return museumsDirect
  const skipRestaurantDirect = options?.skipRestaurantDirect === true
  let restaurantsDirect: string | undefined
  if (category === 'restaurants' && !skipRestaurantDirect) {
    const url = RESTAURANTS_DIRECT_IMAGES[titleEn]
    const isBlocking = url && RESTAURANT_BLOCKING_HOSTS.some((h) => url.includes(h))
    restaurantsDirect = isBlocking ? undefined : url
  }
  if (restaurantsDirect) return restaurantsDirect
  const foodsDirect =
    category === 'foods'
      ? (FOODS_USER_DIRECT_IMAGES[titleEn] ?? FOODS_USER_DIRECT_BY_SLUG[toSlug(titleEn)] ?? FOODS_DIRECT_IMAGES[titleEn] ?? FOODS_DIRECT_BY_SLUG[toSlug(titleEn)] ?? FOODS_DIRECT_FALLBACK[titleEn] ?? FOODS_DIRECT_FALLBACK[toSlug(titleEn)])
      : undefined
  if (foodsDirect) return foodsDirect
  const countriesDirect = category === 'countries' ? COUNTRIES_DIRECT_IMAGES[titleEn] : undefined
  if (countriesDirect) return countriesDirect

  // ── Step 0a2: 100 Countries 전용 — 국가명이 위키에서 다른 항목(미국 주 Georgia 등)으로 오인될 때 문서 지정
  if (category === 'countries' && COUNTRY_ARTICLE_OVERRIDES[titleEn]) {
    for (const article of COUNTRY_ARTICLE_OVERRIDES[titleEn]) {
      const u = await wikiSummary(article) ?? await wikiSearch(article)
      if (u) return u
    }
  }

  // ── Step 0b: curated overrides for items that Wikipedia can't match reliably
  const overrides =
    WIKI_ARTICLE_OVERRIDES[titleEn] ??
    (category === 'foods' ? WIKI_ARTICLE_OVERRIDES[cleanTitle(titleEn)] : undefined)
  if (overrides) {
    const toTry = category === 'drinks' ? overrides.slice(0, 4) : overrides
    for (const article of toTry) {
      // 100 Drinks: 문서 내 이미지 목록에서 병/제품 이미지 직접 선택 (대표 이미지=건물/인물 회피)
      if (category === 'drinks') {
        const drinkImg = await getBestDrinkImageFromArticle(article)
        if (drinkImg) return drinkImg
      }
      const result = await Promise.any([
        wikiSummary(article),
        wikiSearch(article),
      ].map(p => p.then(r => r ?? Promise.reject())))
        .catch(() => null)
      if (result) return result
    }
  }

  // ── Step 0c: 100 Drinks 전용 — 제품/병 이미지 검색 (bottle, drink, label 등)
  if (category === 'drinks') {
    const drinkBase = cleanTitle(titleEn)
    const firstTwo = drinkBase.split(' ').slice(0, 2).join(' ')
    const drinkQueries = [
      `${drinkBase} bottle`,
      `${drinkBase} drink`,
      `${firstTwo} bottle`,
      `${drinkBase} label`,
      drinkBase,
    ]
    for (const q of drinkQueries) {
      const result = await wikiSearch(q)
      if (result) return result
    }
  }

  // ── Step 1: Location extraction for outdoor-activity spot categories
  // Many entries follow "Species/Wave/Feature, Location" format.
  // Using the LOCATION part gives scenic destination photos and prevents:
  //   • Fish anatomy images (same species → duplicate photos across multiple spots)
  //   • Wave diagrams instead of beautiful ocean/beach scenes
  //   • Generic dive-site icons instead of vivid coral/underwater scenes
  const LOCATION_EXTRACT_CATS = new Set(['fishing', 'surfing', 'scuba'])
  if (LOCATION_EXTRACT_CATS.has(category) && titleEn.includes(',')) {
    const locationPart = titleEn.split(',').slice(1).join(',').trim()
    // Skip if the location token is too short (e.g. "BC", "PNG") — those have overrides above
    if (locationPart.length >= 5) {
      const locResult = await Promise.any([
        wikiSummary(locationPart),
        wikiSearch(locationPart),
      ].map(p => p.then(r => r ?? Promise.reject())))
        .catch(() => null)
      if (locResult) return locResult
    }
  }

  // restaurants: "Restaurant/Cafe/Hotel" 제거 시 사람 이름·브랜드로 오인됨
  // golf:        "Golf Club/Links/Course" 제거 시 마을·정치인 등 엉뚱한 항목으로 연결됨
  // islands:     "Island" 제거 또는 괄호 삭제 시 국가 페이지·엉뚱한 섬으로 연결됨
  // art_galleries: "(art gallery)" 유지 시 검색 정확도 상승
  const useFullTitle = category === 'restaurants' || category === 'golf' || category === 'fishing' || category === 'islands' || category === 'art_galleries'
  const baseTitle = useFullTitle ? titleEn : cleanTitle(titleEn)

  const hint = CATEGORY_HINTS[category] ?? ''
  const firstTwo = baseTitle.split(' ').slice(0, 2).join(' ')
  const firstThree = baseTitle.split(' ').slice(0, 3).join(' ')

  // Restaurants: Wikipedia summary API often 404s for "X (restaurant)" — try short form first
  const noSuffix = category === 'restaurants' ? baseTitle.replace(/\s*\(restaurant\)\s*$/i, '').trim() : ''
  const tryShortFirst = noSuffix && noSuffix !== baseTitle

  // Round 1: try 3–5 approaches in PARALLEL (restaurants get short-title attempts first)
  const round1Candidates: Promise<string | null>[] = [
    wikiSummary(baseTitle),
    wikiSearch(`${baseTitle} ${hint}`.trim()),
    wikiSummary(firstThree),
  ]
  if (tryShortFirst) {
    round1Candidates.unshift(wikiSummary(noSuffix), wikiSearch(`${noSuffix} ${hint}`.trim()))
  }
  const round1 = await Promise.any(round1Candidates.map(p => p.then(r => r ?? Promise.reject())))
    .catch(() => null)

  if (round1) return round1

  // Round 2: more aggressive — search without category hint, try shorter titles
  const round2 = await Promise.any([
    wikiSearch(baseTitle),
    wikiSummary(firstTwo),
    wikiSearch(firstThree),
  ].map(p => p.then(r => r ?? Promise.reject())))
    .catch(() => null)

  if (round2) return round2

  // Round 3: last resort — category-context-only search
  if (hint) {
    const shortTitle = titleEn.split(' ')[0]
    const result = await wikiSearch(`${shortTitle} ${hint}`)
    if (result) return result
  }

  // Round 4: 검색으로 문서 제목만 얻은 뒤 해당 문서의 첫 이미지 사용 (summary에 썸네일 없는 경우 많음)
  const searchQuery = hint ? `${baseTitle} ${hint}`.trim() : baseTitle
  const articleTitle = await getFirstSearchResultTitle(searchQuery) ?? await getFirstSearchResultTitle(baseTitle)
  if (articleTitle) {
    if (category === 'countries' || category === 'foods') {
      const firstImg = await getFirstImageFromArticle(articleTitle)
      if (firstImg) return firstImg
    }
  }

  // 100 Art Galleries: 문서 내 이미지 중 갤러리/건물 우선 선택 (Round 4에서 얻은 articleTitle 재사용)
  if (category === 'art_galleries' && articleTitle) {
    const fromPage = await getBestArtGalleryImageFromArticle(articleTitle)
    if (fromPage) return fromPage
  }

  return null
}

// ─── Global request queue (foods/restaurants 등 위키 API 사용 시에만 사용) ──
let activeRequests = 0
const MAX_CONCURRENT = 4
/** 기본 동시 요청 수. countries/foods는 config.maxConcurrent로 100 사용 */
const requestQueue: Array<() => void> = []
/** 실패 시 1회만 재시도 (countries/foods/art_galleries) */
const retriedIds = new Set<string>()

function processQueue(maxConcurrent?: number) {
  const limit = maxConcurrent ?? MAX_CONCURRENT
  while (activeRequests < limit && requestQueue.length > 0) {
    const next = requestQueue.shift()!
    activeRequests++
    next()
  }
}

function cacheKey(id: string) { return getPerItemCacheKey(id) }

/** Art Galleries 전용: 한 키에 id→url 맵 저장. config에서 persistent 키 사용 → 다른 카테고리 버전 올려도 삭제 안 됨 */
function getArtGalleriesCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(getCategoryCacheKey('art_galleries'))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
// 쓰기 직렬화: 여러 컴포넌트가 동시에 저장할 때 마지막 쓰기가 이전 항목을 덮어쓰지 않도록
let artGalleriesCacheWritePending: Promise<void> = Promise.resolve()
function setArtGalleriesCacheEntry(id: string, url: string) {
  artGalleriesCacheWritePending = artGalleriesCacheWritePending.then(() => {
    try {
      const map = getArtGalleriesCache()
      map[id] = url
      localStorage.setItem(getCategoryCacheKey('art_galleries'), JSON.stringify(map))
    } catch { /* ignore */ }
  })
}

// ─── 100 Nature Spots 전용 캐시 (art_galleries와 동일 패턴, 다른 카테고리와 완전 분리) ──
const NATURE_CACHE_KEY = `cimg_${CACHE_VERSION}_nature`
function getNatureCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NATURE_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
let natureCacheWritePending: Promise<void> = Promise.resolve()
function setNatureCacheEntry(id: string, url: string) {
  natureCacheWritePending = natureCacheWritePending.then(() => {
    try {
      const map = getNatureCache()
      map[id] = url
      localStorage.setItem(NATURE_CACHE_KEY, JSON.stringify(map))
    } catch { /* ignore */ }
  })
}

// ─── 카테고리별 캐시 (키는 config 기준, 한 카테고리 수정 시 다른 카테고리 영향 없음) ──
function getCategoryCache(cat: string): Record<string, string> {
  if (cat === 'nature') return getNatureCache()
  try {
    const raw = localStorage.getItem(getCategoryCacheKey(cat))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
const categoryCacheWritePending: Record<string, Promise<void>> = {}
function setCategoryCacheEntry(cat: string, id: string, url: string) {
  if (cat === 'nature') {
    setNatureCacheEntry(id, url)
    return
  }
  if (!categoryCacheWritePending[cat]) categoryCacheWritePending[cat] = Promise.resolve()
  categoryCacheWritePending[cat] = categoryCacheWritePending[cat].then(() => {
    try {
      const map = getCategoryCache(cat)
      map[id] = url
      localStorage.setItem(getCategoryCacheKey(cat), JSON.stringify(map))
    } catch { /* ignore */ }
  })
}

/** 깨진 이미지 URL이 캐시에 있으면 제거 (다음 로드 시 재시도 또는 failed 표시) */
function removeCategoryCacheEntry(cat: string, id: string) {
  if (cat === 'nature') return
  try {
    const map = getCategoryCache(cat)
    delete map[id]
    localStorage.setItem(getCategoryCacheKey(cat), JSON.stringify(map))
  } catch { /* ignore */ }
}

/** DB title_en과 매핑 키 불일치 방지 (유니코드 따옴표 등). attractions/drinks/golf 직접 URL 조회용 */
function getDirectImageUrl(category: string, titleEn: string): string | undefined {
  const normalized = titleEn.replace(/\u2018|\u2019|\u201A/g, "'").trim()
  if (category === 'attractions') {
    return ATTRACTIONS_DIRECT_IMAGES[titleEn] ?? ATTRACTIONS_DIRECT_IMAGES[normalized]
  }
  if (category === 'drinks') {
    return DRINKS_DIRECT_IMAGES[titleEn] ?? DRINKS_DIRECT_IMAGES[normalized]
  }
  if (category === 'golf') {
    return getGolfDirectUrl(titleEn)
  }
  if (category === 'museums') {
    return MUSEUMS_DIRECT_IMAGES[titleEn] ?? MUSEUMS_DIRECT_IMAGES[normalized]
  }
  if (category === 'art_galleries') {
    return ART_GALLERIES_DIRECT_IMAGES[titleEn] ?? ART_GALLERIES_DIRECT_IMAGES[normalized]
      ?? MUSEUMS_DIRECT_IMAGES[titleEn] ?? MUSEUMS_DIRECT_IMAGES[normalized]
  }
  if (category === 'foods') {
    const slug = toSlug(titleEn)
    const collapsed = titleEn.replace(/\s+/g, ' ').trim()
    const userByTitle = FOODS_USER_DIRECT_IMAGES[titleEn] ?? FOODS_USER_DIRECT_IMAGES[normalized] ?? FOODS_USER_DIRECT_IMAGES[collapsed] ?? FOODS_USER_DIRECT_IMAGES[cleanTitle(titleEn)]
    if (userByTitle) return userByTitle
    const userBySlug = FOODS_USER_DIRECT_BY_SLUG[slug]
    if (userBySlug) return userBySlug
    const bySlug = FOODS_DIRECT_BY_SLUG[slug]
    if (bySlug) return bySlug
    const byTitle =
      FOODS_DIRECT_IMAGES[titleEn] ??
      FOODS_DIRECT_IMAGES[normalized] ??
      FOODS_DIRECT_IMAGES[collapsed] ??
      FOODS_DIRECT_IMAGES[cleanTitle(titleEn)]
    if (byTitle) return byTitle
    return FOODS_DIRECT_FALLBACK[titleEn] ?? FOODS_DIRECT_FALLBACK[normalized] ?? FOODS_DIRECT_FALLBACK[collapsed] ?? FOODS_DIRECT_FALLBACK[cleanTitle(titleEn)] ?? FOODS_DIRECT_FALLBACK[slug]
  }
  if (category === 'restaurants') {
    const url = RESTAURANTS_DIRECT_IMAGES[titleEn] ?? RESTAURANTS_DIRECT_IMAGES[normalized]
    const isBlocking = url && RESTAURANT_BLOCKING_HOSTS.some((h) => url.includes(h))
    return isBlocking ? undefined : url
  }
  if (category === 'countries') {
    return COUNTRIES_DIRECT_IMAGES[titleEn] ?? COUNTRIES_DIRECT_IMAGES[normalized]
  }
  if (category === 'islands') {
    const userUrl = ISLANDS_USER_DIRECT_IMAGES[titleEn] ?? ISLANDS_USER_DIRECT_IMAGES[normalized]
    if (userUrl) return userUrl
    const fallback = ISLANDS_DIRECT_IMAGES[titleEn] ?? ISLANDS_DIRECT_IMAGES[normalized]
    return fallback
  }
  const directMap = CATEGORY_DIRECT_IMAGES[category]
  if (directMap) {
    let url = directMap[titleEn] ?? directMap[normalized]
    if (category === 'nature' && !url) {
      const aliasKey = NATURE_TITLE_ALIASES[titleEn] ?? NATURE_TITLE_ALIASES[normalized]
      if (aliasKey) url = directMap[aliasKey]
    }
    if (category === 'fishing') return url ?? FISHING_VERIFIED_URLS[0]
    if (category === 'surfing') return url ?? SURFING_VERIFIED_URLS[0]
    if (category === 'skiing') return url /* 맵에 없으면 undefined → API로 제목 기준 이미지 조회 */
    if (category === 'scuba') return url ?? SCUBA_VERIFIED_URLS[0]
    return url
  }
  return undefined
}

// 앱 로드 시 한 번만 예전 버전 캐시 삭제. persistent 키(config)는 제외 → 카테고리별 수정이 다른 카테고리 깨짐 방지
let oldCachePurged = false
function purgeOldImageCache() {
  if (oldCachePurged || typeof localStorage === 'undefined') return
  oldCachePurged = true
  try {
    const prefix = `cimg_${CACHE_VERSION}_`
    const persistent = new Set(getPersistentCacheKeys())
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('cimg_')) continue
      if (key.startsWith(prefix)) continue
      if (persistent.has(key)) continue
      toRemove.push(key)
    }
    toRemove.forEach(k => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

// ─── Component ─────────────────────────────────────────────────────────────
interface Props {
  id: string
  titleEn: string
  category: string
  countryCode?: string | null
  className?: string
}

export default function ChallengeImage({ id, titleEn, category, className = '' }: Props) {
  const cat = CATEGORY_GRADIENTS[category] ?? { from: '#6b7280', to: '#4b5563', emoji: '🌟' }
  const key = cacheKey(id)

  // 직접 URL 있으면 초기값으로 설정. 캐시는 useEffect에서만 읽음 (SSR/클라이언트 일치로 hydration 오류 방지)
  const [imgUrl, setImgUrl] = useState<string | 'loading' | 'failed'>(() => {
    const direct = getDirectImageUrl(category, titleEn)
    return direct ?? 'loading'
  })
  const [useDirectUrl, setUseDirectUrl] = useState(true)
  const usedRestaurantDirectRef = useRef(false)

  useEffect(() => { setUseDirectUrl(true) }, [id])

  useEffect(() => {
    purgeOldImageCache()
    try {
      const conf = getCategoryImageConfig(category)
      const direct = getDirectImageUrl(category, titleEn)
      if (direct) {
        setImgUrl(direct)
        if (conf.cacheStrategy === 'per_item') try { localStorage.setItem(key, direct) } catch { /* ignore */ }
        return
      }
      // 개발 시 원인 분석: direct URL이 없으면 콘솔에 titleEn 출력 (DB와 매핑 키 불일치 확인)
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && category === 'foods') {
        // eslint-disable-next-line no-console
        console.log('[ChallengeImage] foods 매핑 없음:', JSON.stringify(titleEn), '| slug:', toSlug(titleEn))
      }
      if (conf.fetchStrategy === 'none') return
      if (conf.cacheStrategy === 'category_persistent') {
        const url = getArtGalleriesCache()[id]
        if (url) { setImgUrl(url); return }
        return
      }
      if (conf.cacheStrategy === 'category_versioned') {
        const url = getCategoryCache(category)[id]
        if (url) { setImgUrl(url); return }
        return
      }
      const cached = localStorage.getItem(key)
      if (cached && cached !== 'failed') {
        setImgUrl(cached)
        usedRestaurantDirectRef.current =
          category === 'restaurants' && RESTAURANTS_DIRECT_IMAGES[titleEn] === cached
        return
      }
    } catch { /* ignore */ }
  }, [key, category, titleEn, id])

  const containerRef = useRef<HTMLDivElement>(null)

  // 카테고리별 분기 (한 카테고리 수정 시 해당 블록만 변경할 것, 다른 카테고리 로직 건드리지 말 것)
  // attractions/drinks/museums: 직접 URL 또는 공용 key 캐시만 사용, observer 없음
  // countries/foods: 공용 key 캐시 + findImage(클라이언트) 큐
  // API_IMAGE_CATEGORIES(nature, islands, animals, festivals, golf, fishing, surfing, skiing, scuba): 전용 캐시 + /api/challenge-image
  // art_galleries: 전용 캐시(ART_GALLERIES_CACHE_KEY) + 서버 API만 사용
  // 그 외(restaurants 등): observer + findImage
  useEffect(() => {
    if (imgUrl !== 'loading') return
    // 모든 카테고리: 직접 이미지가 있으면 우선 적용 후 종료
    const direct = getDirectImageUrl(category, titleEn)
    if (direct) {
      setImgUrl(direct)
      try { localStorage.setItem(key, direct) } catch { /* ignore */ }
      return
    }
    if (getCategoryImageConfig(category).fetchStrategy === 'none') return

    // Countries (findImage + timeout): observer 없이 마운트 시 바로 큐에 넣어 한 번에 로드 (새로고침 없이 전부 표시)
    if (category === 'countries') {
      const doFetch = async () => {
        try {
          const url = await Promise.race([
            findImage(titleEn, category),
            new Promise<string | null>((resolve) => setTimeout(() => resolve(null), getCategoryImageConfig('countries').fetchTimeoutMs || 0)),
          ])
          if (url) {
            setImgUrl(url)
            if (isWikimediaUrl(url)) setUseDirectUrl(true)
            try { localStorage.setItem(key, url) } catch { /* ignore */ }
          } else {
            setImgUrl('failed')
            try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            if (!retriedIds.has(id)) {
              retriedIds.add(id)
              setTimeout(() => { requestQueue.push(doFetch); processQueue(getCategoryImageConfig('countries').maxConcurrent) }, 2000)
            }
          }
        } catch {
          setImgUrl('failed')
          try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
          if (!retriedIds.has(id)) {
            retriedIds.add(id)
            setTimeout(() => { requestQueue.push(doFetch); processQueue(getCategoryImageConfig('countries').maxConcurrent) }, 2000)
          }
        } finally {
          activeRequests--
          processQueue(getCategoryImageConfig('countries').maxConcurrent)
        }
      }
      requestQueue.push(doFetch)
      processQueue(getCategoryImageConfig('countries').maxConcurrent)
      return
    }

    // 100 Foods: 직접 URL(사용자/폴백 맵) → 캐시 → findImage. 100개 동시 요청으로 위/아래 구분 없이 로드.
    if (category === 'foods') {
      try {
        const direct = getDirectImageUrl(category, titleEn)
        if (direct) {
          setImgUrl(direct)
          try { localStorage.setItem(key, direct) } catch { /* ignore */ }
          return
        }
        const cached = localStorage.getItem(key)
        if (cached && cached !== 'failed') {
          setImgUrl(cached)
          return
        }
      } catch { /* ignore */ }
      const doFetch = async () => {
        try {
          const url = await findImage(titleEn, category)
          if (url) {
            setImgUrl(url)
            if (isWikimediaUrl(url)) setUseDirectUrl(true)
            try { localStorage.setItem(key, url) } catch { /* ignore */ }
          } else {
            setImgUrl('failed')
            try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            if (!retriedIds.has(id)) {
              retriedIds.add(id)
              setTimeout(() => { requestQueue.push(doFetch); processQueue(getCategoryImageConfig('foods').maxConcurrent) }, 2000)
            }
          }
        } catch {
          setImgUrl('failed')
          try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
          if (!retriedIds.has(id)) {
            retriedIds.add(id)
            setTimeout(() => { requestQueue.push(doFetch); processQueue(getCategoryImageConfig('foods').maxConcurrent) }, 2000)
          }
        } finally {
          activeRequests--
          processQueue(getCategoryImageConfig('foods').maxConcurrent)
        }
      }
      requestQueue.push(doFetch)
      processQueue(getCategoryImageConfig('foods').maxConcurrent)
      return
    }

    // fetchStrategy === 'api': 전용 캐시 있으면 즉시 적용, 없으면 /api/challenge-image 호출 후 캐시 저장
    if (getCategoryImageConfig(category).fetchStrategy === 'api') {
      const cachedUrl = getCategoryCache(category)[id]
      if (cachedUrl) {
        setImgUrl(cachedUrl)
        if (isWikimediaUrl(cachedUrl)) setUseDirectUrl(true)
        return
      }
      const doFetch = async () => {
        try {
          const res = await fetch(
            `/api/challenge-image?category=${encodeURIComponent(category)}&titleEn=${encodeURIComponent(titleEn)}&id=${encodeURIComponent(id)}`
          )
          const data = await res.json().catch(() => ({}))
          const url = data?.url
          if (url) {
            setImgUrl(url)
            if (isWikimediaUrl(url)) setUseDirectUrl(true)
            setCategoryCacheEntry(category, id, url)
          } else {
            // 직접 URL이 있으면 failed로 덮어쓰지 않음 (새로고침 시 나왔다 사라지는 현상 방지)
            if (!getDirectImageUrl(category, titleEn)) {
              setImgUrl('failed')
            }
            if (!retriedIds.has(id)) {
              retriedIds.add(id)
              setTimeout(() => { requestQueue.push(doFetch); processQueue() }, 2000)
            }
          }
        } catch {
          if (!getDirectImageUrl(category, titleEn)) setImgUrl('failed')
          if (!retriedIds.has(id)) {
            retriedIds.add(id)
            setTimeout(() => { requestQueue.push(doFetch); processQueue() }, 2000)
          }
        } finally {
          activeRequests--
          processQueue()
        }
      }
      requestQueue.push(doFetch)
      processQueue()
      return
    }

    // 100 Art Galleries: 직접/MUSEUMS URL 없으면 서버 API (서버 캐시로 재요청 시 즉시 응답, 실패는 localStorage에 안 씀 → 새로고침 시 재시도)
    if (category === 'art_galleries') {
      const doFetch = async () => {
        try {
          const res = await fetch(
            `/api/challenge-image?category=art_galleries&titleEn=${encodeURIComponent(titleEn)}&id=${encodeURIComponent(id)}`
          )
          const data = await res.json().catch(() => ({}))
          const url = data?.url
          if (url) {
            setImgUrl(url)
            if (isWikimediaUrl(url) && category !== 'art_galleries') setUseDirectUrl(true)
            setArtGalleriesCacheEntry(id, url)
          } else {
            setImgUrl('failed')
            if (!retriedIds.has(id)) {
              retriedIds.add(id)
              setTimeout(() => { requestQueue.push(doFetch); processQueue() }, 2000)
            }
          }
        } catch {
          setImgUrl('failed')
          if (!retriedIds.has(id)) {
            retriedIds.add(id)
            setTimeout(() => { requestQueue.push(doFetch); processQueue() }, 2000)
          }
        } finally {
          activeRequests--
          processQueue()
        }
      }
      requestQueue.push(doFetch)
      processQueue()
      return
    }

    const loadImage = (visible: boolean) => {
      if (!visible) return

      if (category === 'foods') {
        try {
          const direct = getDirectImageUrl(category, titleEn)
          if (direct) {
            setImgUrl(direct)
            try { localStorage.setItem(key, direct) } catch { /* ignore */ }
            return
          }
          const cached = localStorage.getItem(key)
          if (cached && cached !== 'failed') {
            setImgUrl(cached)
            return
          }
        } catch { /* ignore */ }
        const doFetch = async () => {
          try {
            const url = await findImage(titleEn, category)
            if (url) {
              setImgUrl(url)
              try { localStorage.setItem(key, url) } catch { /* ignore */ }
            } else {
              setImgUrl('failed')
              try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            }
          } finally {
            activeRequests--
            processQueue()
          }
        }
        requestQueue.push(doFetch)
        processQueue()
        return
      }

      // 그 외(restaurants 등): 직접 이미지 우선, 없으면 findImage
      const directFallback = getDirectImageUrl(category, titleEn)
      if (directFallback) {
        setImgUrl(directFallback)
        usedRestaurantDirectRef.current = category === 'restaurants'
        try { localStorage.setItem(key, directFallback) } catch { /* ignore */ }
        return
      }
      const doFetch = async () => {
        try {
          const url = await findImage(titleEn, category)
          if (url) {
            usedRestaurantDirectRef.current =
              category === 'restaurants' && RESTAURANTS_DIRECT_IMAGES[titleEn] === url
            setImgUrl(url)
            try { localStorage.setItem(key, url) } catch { /* ignore */ }
          } else {
            setImgUrl('failed')
            try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
          }
        } finally {
          activeRequests--
          processQueue()
        }
      }
      requestQueue.push(doFetch)
      processQueue()
    }

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        loadImage(true)
      },
      { root: null, rootMargin: '800px 0px 800px 0px', threshold: 0 }
    )

    // 다음 프레임에서 observe (레이아웃 완료 후 - 스크롤 시 콜백 보장)
    const rafId = requestAnimationFrame(() => {
      observer.observe(el)
    })
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [id, titleEn, category, imgUrl, key])

  const showGradient = imgUrl === 'loading' || imgUrl === 'failed'

  const handleImageError = () => {
    if (category === 'restaurants' && usedRestaurantDirectRef.current) {
      usedRestaurantDirectRef.current = false
      setImgUrl('loading')
      try { localStorage.removeItem(key) } catch { /* ignore */ }
      requestQueue.push(() => {
        const doFallback = async () => {
          try {
            const fallbackUrl = await findImage(titleEn, category, { skipRestaurantDirect: true })
            if (fallbackUrl) {
              setImgUrl(fallbackUrl)
              try { localStorage.setItem(key, fallbackUrl) } catch { /* ignore */ }
            } else {
              setImgUrl('failed')
              try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            }
          } finally {
            activeRequests--
            processQueue()
          }
        }
        doFallback()
      })
      processQueue()
      return
    }
    // 100 Foods: 직접 URL 로드 실패 시 findImage 폴백 1회
    if (category === 'foods') {
      setImgUrl('loading')
      try { localStorage.removeItem(key) } catch { /* ignore */ }
      requestQueue.push(() => {
        const doFallback = async () => {
          try {
            const fallbackUrl = await findImage(titleEn, category)
            if (fallbackUrl) {
              setImgUrl(fallbackUrl)
              try { localStorage.setItem(key, fallbackUrl) } catch { /* ignore */ }
            } else {
              setImgUrl('failed')
              try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            }
          } finally {
            activeRequests--
            processQueue(getCategoryImageConfig('foods').maxConcurrent)
          }
        }
        doFallback()
      })
      processQueue(getCategoryImageConfig('foods').maxConcurrent)
      return
    }
    // Wikimedia: 직접 로드 실패 시 proxy로, proxy 실패 시 failed
    if (typeof imgUrl === 'string' && isWikimediaUrl(imgUrl)) {
      if (useDirectUrl) {
        setUseDirectUrl(false)
        return
      }
    }
    setImgUrl('failed')
    const conf = getCategoryImageConfig(category)
    if (conf.cacheStrategy === 'category_versioned') removeCategoryCacheEntry(category, id)
    if (conf.cacheStrategy === 'per_item') {
      try { localStorage.removeItem(key) } catch { /* ignore */ }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={showGradient ? { background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` } : undefined}
    >
      {showGradient ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 select-none">
          <span className="text-4xl drop-shadow">{cat.emoji}</span>
          {imgUrl === 'loading' && (
            <div className="flex gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>
      ) : (
        <img
          src={imageSrc(imgUrl, useDirectUrl, category)}
          alt={titleEn}
          loading={getCategoryImageConfig(category).eagerLoad ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={handleImageError}
        />
      )}
    </div>
  )
}
