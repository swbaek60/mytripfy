/**
 * 기본 10벌 + 변형 조합 → 캐릭터당 50벌 OOTD 풀
 * @typedef {import('./sns-ootd-catalog.mjs').DayOutfit} DayOutfit
 */

/** @param {string[]} tags @returns {DayOutfit} */
function suaVariant(summaryKo, summaryEn, pieces, accessories, colorAccent, tags) {
  return { summaryKo, summaryEn, pieces, accessories, colorAccent, promptLock: '', weatherTags: tags }
}

/** @param {string[]} tags @returns {DayOutfit} */
function ethanVariant(summaryKo, summaryEn, pieces, accessories, colorAccent, tags) {
  return { summaryKo, summaryEn, pieces, accessories, colorAccent, promptLock: '', weatherTags: tags }
}

/** @param {DayOutfit[]} base @param {DayOutfit[]} extra @param {number} target */
function mergeToPool(base, extra, target) {
  const seen = new Set(base.map((o) => o.summaryKo))
  const out = [...base]
  for (const o of extra) {
    if (out.length >= target) break
    if (seen.has(o.summaryKo)) continue
    seen.add(o.summaryKo)
    out.push(o)
  }
  return out.slice(0, target)
}

/** @param {DayOutfit[]} base */
export function buildExpandedSuaOutfits(base) {
  const extra = [
    suaVariant(
      '코랄 뷔스티에 · 화이트 와이드 팬츠',
      'coral bustier top, white wide pants',
      [
        { item: 'coral linen bustier top', colors: 'coral orange' },
        { item: 'high-waist wide-leg pants', colors: 'white' },
        { item: 'tan flat sandals', colors: 'tan leather' },
      ],
      [
        { item: 'gold hoop earrings', colors: 'gold' },
        { item: 'straw crossbody bag', colors: 'natural tan' },
      ],
      'coral and white summer',
      ['hot', 'warm']
    ),
    suaVariant(
      '민트 티셔츠 · 데님 스커트',
      'mint tee, denim skirt',
      [
        { item: 'fitted mint green t-shirt', colors: 'mint green' },
        { item: 'A-line denim midi skirt', colors: 'medium blue denim' },
        { item: 'white sneakers', colors: 'white' },
      ],
      [
        { item: 'silver stud earrings', colors: 'silver' },
        { item: 'canvas tote bag', colors: 'natural ecru' },
      ],
      'mint denim casual',
      ['warm', 'mild']
    ),
    suaVariant(
      '라벤더 니트 · 크림 슬랙',
      'lavender knit, cream trousers',
      [
        { item: 'soft lavender knit top', colors: 'lavender purple' },
        { item: 'straight-leg trousers', colors: 'cream ivory' },
        { item: 'nude block heels', colors: 'nude beige' },
      ],
      [
        { item: 'pearl drop earrings', colors: 'white pearl' },
        { item: 'structured shoulder bag', colors: 'taupe leather' },
      ],
      'lavender cream soft',
      ['mild', 'cool']
    ),
    suaVariant(
      '블랙 터틀 · 체크 스커트',
      'black turtleneck, plaid skirt',
      [
        { item: 'black fitted turtleneck', colors: 'black' },
        { item: 'plaid wool midi skirt', colors: 'burgundy navy check' },
        { item: 'black ankle boots', colors: 'black leather' },
      ],
      [
        { item: 'black leather belt', colors: 'black silver buckle' },
        { item: 'black crossbody bag', colors: 'black leather' },
      ],
      'autumn plaid',
      ['cool', 'cold', 'rainy']
    ),
    suaVariant(
      '옐로우 린넨 셔츠 · 화이트 쇼츠',
      'yellow linen shirt, white shorts',
      [
        { item: 'oversized yellow linen shirt', colors: 'butter yellow' },
        { item: 'high-waist linen shorts', colors: 'white' },
        { item: 'espadrille wedges', colors: 'natural jute' },
      ],
      [
        { item: 'woven bucket hat', colors: 'natural straw' },
        { item: 'rattan shoulder bag', colors: 'natural tan' },
      ],
      'yellow summer bright',
      ['hot', 'warm']
    ),
    suaVariant(
      '네이비 블레이저 · 화이트 티 · 진',
      'navy blazer, white tee, jeans',
      [
        { item: 'fitted navy blazer', colors: 'navy blue' },
        { item: 'white crew-neck tee', colors: 'white' },
        { item: 'straight blue jeans', colors: 'medium wash denim' },
        { item: 'white sneakers', colors: 'white' },
      ],
      [
        { item: 'gold chain necklace', colors: 'gold' },
        { item: 'tan leather tote', colors: 'cognac brown' },
      ],
      'smart casual navy',
      ['mild', 'cool']
    ),
    suaVariant(
      '버건디 슬립 · 블랙 가디건',
      'burgundy slip, black cardigan',
      [
        { item: 'burgundy satin slip dress', colors: 'burgundy wine' },
        { item: 'cropped black cardigan', colors: 'black' },
        { item: 'black ankle boots', colors: 'black' },
      ],
      [
        { item: 'gold hoop earrings', colors: 'gold' },
        { item: 'black clutch', colors: 'black leather' },
      ],
      'evening burgundy',
      ['cool', 'mild', 'rainy']
    ),
    suaVariant(
      '스카이블루 원피스 · 화이트 샌들',
      'sky blue dress, white sandals',
      [
        { item: 'flowing sky blue midi dress', colors: 'sky blue' },
        { item: 'white strappy sandals', colors: 'white' },
      ],
      [
        { item: 'silver bangle', colors: 'silver' },
        { item: 'white woven clutch', colors: 'white' },
      ],
      'sky blue resort',
      ['hot', 'warm']
    ),
    suaVariant(
      '올리브 재킷 · 크림 티 · 카키 팬츠',
      'olive jacket, cream tee, khaki pants',
      [
        { item: 'lightweight olive utility jacket', colors: 'olive green' },
        { item: 'cream cotton tee', colors: 'cream' },
        { item: 'khaki cargo pants', colors: 'khaki tan' },
        { item: 'brown hiking sneakers', colors: 'brown tan' },
      ],
      [
        { item: 'canvas backpack', colors: 'olive green' },
        { item: 'sunglasses', colors: 'black frame' },
      ],
      'utility travel',
      ['mild', 'warm', 'rainy']
    ),
    suaVariant(
      '화이트 블라우스 · 테라코타 스커트',
      'white blouse, terracotta skirt',
      [
        { item: 'white puff-sleeve blouse', colors: 'white' },
        { item: 'terracotta A-line midi skirt', colors: 'terracotta rust' },
        { item: 'nude heels', colors: 'nude' },
      ],
      [
        { item: 'gold stud earrings', colors: 'gold' },
        { item: 'woven circle bag', colors: 'natural rattan' },
      ],
      'terracotta earth tone',
      ['warm', 'mild']
    ),
  ]

  const palette = [
    ['틸 원피스', 'teal wrap dress', 'teal', ['hot', 'warm']],
    ['로즈 셔츠드레스', 'rose shirt dress', 'dusty rose', ['warm', 'mild']],
    ['그레이 니트세트', 'grey knit co-ord', 'heather grey', ['cool', 'mild']],
    ['머스타드 가디건', 'mustard cardigan look', 'mustard yellow', ['mild', 'cool']],
    ['인디고 데님원피스', 'indigo denim dress', 'indigo blue', ['warm', 'mild', 'rainy']],
    ['피치 맥시원피스', 'peach maxi dress', 'soft peach', ['hot', 'warm']],
    ['차콜 블라우스·슬랙', 'charcoal blouse slacks', 'charcoal', ['mild', 'cool']],
    ['코발트 랩탑', 'cobalt wrap top', 'cobalt blue', ['warm', 'mild']],
    ['세이지 니트원피스', 'sage knit dress', 'sage green', ['mild', 'cool']],
    ['와인 벨벳탑·진', 'wine velvet top jeans', 'wine red', ['cool', 'cold']],
  ]

  for (const [ko, en, color, tags] of palette) {
    extra.push(
      suaVariant(
        `${ko} · 화이트 스니커즈`,
        `${en}, white sneakers`,
        [
          { item: `${en.split(',')[0]}`, colors: color },
          { item: 'comfortable white sneakers', colors: 'clean white' },
        ],
        [
          { item: 'minimal gold earrings', colors: 'gold' },
          { item: 'crossbody bag', colors: 'tan leather' },
        ],
        `${color} casual travel`,
        tags
      )
    )
  }

  const seasons = [
    ['캐시미어 코트', 'cashmere coat', 'camel', ['cold', 'cool']],
    ['패딩 베스트', 'puffer vest', 'navy', ['cool', 'cold', 'rainy']],
    ['레인코트', 'trench raincoat', 'beige', ['rainy', 'mild', 'cool']],
    ['퍼플 니트', 'purple knit', 'plum purple', ['cool', 'mild']],
    ['브라운 코듀로이', 'corduroy set', 'brown', ['cool', 'cold']],
  ]
  for (const [ko, en, color, tags] of seasons) {
    extra.push(
      suaVariant(
        `${ko} · 블랙 진`,
        `${en}, black jeans`,
        [
          { item: en, colors: color },
          { item: 'black skinny jeans', colors: 'black denim' },
          { item: 'black ankle boots', colors: 'black' },
        ],
        [{ item: 'leather tote', colors: 'black' }],
        `${color} layered`,
        tags
      )
    )
  }

  let i = 0
  while (extra.length < 45) {
    const hues = ['coral', 'teal', 'lavender', 'mustard', 'rust', 'forest', 'navy', 'blush']
    const h = hues[i % hues.length]
    extra.push(
      suaVariant(
        `${h} 트래블 세트 #${i + 1}`,
        `${h} travel set ${i + 1}`,
        [
          { item: 'relaxed travel top', colors: h },
          { item: 'comfortable travel pants', colors: 'neutral beige' },
          { item: 'white sneakers', colors: 'white' },
        ],
        [{ item: 'daypack', colors: 'grey nylon' }],
        `${h} travel neutral`,
        ['mild', 'warm']
      )
    )
    i++
  }

  return mergeToPool(base, extra, 50)
}

/** @param {DayOutfit[]} base */
export function buildExpandedEthanOutfits(base) {
  const extra = [
    ethanVariant(
      '네이비 퀼팅 · 그레이 티 · 블랙 진',
      'navy quilted jacket, grey tee, black jeans',
      [
        { item: 'navy quilted bomber jacket', colors: 'navy' },
        { item: 'heather grey t-shirt', colors: 'grey' },
        { item: 'black slim jeans', colors: 'black denim' },
        { item: 'white sneakers', colors: 'white' },
      ],
      [{ item: 'black backpack', colors: 'black' }],
      'navy casual',
      ['mild', 'cool', 'rainy']
    ),
    ethanVariant(
      '올리브 셔츠 · 베이지 치노',
      'olive shirt, beige chinos',
      [
        { item: 'olive green oxford shirt', colors: 'olive' },
        { item: 'beige chino pants', colors: 'beige' },
        { item: 'brown loafers', colors: 'brown leather' },
      ],
      [{ item: 'leather belt', colors: 'brown' }, { item: 'watch', colors: 'silver' }],
      'olive preppy',
      ['warm', 'mild']
    ),
    ethanVariant(
      '차콜 후디 · 네이비 조거',
      'charcoal hoodie, navy joggers',
      [
        { item: 'charcoal pullover hoodie', colors: 'charcoal' },
        { item: 'navy jogger pants', colors: 'navy' },
        { item: 'grey running shoes', colors: 'grey white' },
      ],
      [{ item: 'cap', colors: 'black' }],
      'street casual',
      ['mild', 'cool', 'rainy']
    ),
    ethanVariant(
      '버건디 플란넬 · 다크 진',
      'burgundy flannel, dark jeans',
      [
        { item: 'burgundy plaid flannel shirt', colors: 'burgundy check' },
        { item: 'dark indigo jeans', colors: 'dark blue' },
        { item: 'tan desert boots', colors: 'tan' },
      ],
      [{ item: 'canvas messenger', colors: 'olive' }],
      'autumn flannel',
      ['cool', 'mild', 'cold']
    ),
    ethanVariant(
      '화이트 폴로 · 네이비 쇼츠',
      'white polo, navy shorts',
      [
        { item: 'white polo shirt', colors: 'white' },
        { item: 'navy chino shorts', colors: 'navy' },
        { item: 'boat shoes', colors: 'brown white' },
      ],
      [{ item: 'sunglasses', colors: 'tortoise' }],
      'summer resort',
      ['hot', 'warm']
    ),
    ethanVariant(
      '그레이 블레이저 · 화이트 셔츠 · 슬랙',
      'grey blazer, white shirt, slacks',
      [
        { item: 'grey tailored blazer', colors: 'medium grey' },
        { item: 'white dress shirt', colors: 'white' },
        { item: 'charcoal dress pants', colors: 'charcoal' },
        { item: 'black oxford shoes', colors: 'black' },
      ],
      [{ item: 'leather briefcase', colors: 'dark brown' }],
      'business casual',
      ['mild']
    ),
    ethanVariant(
      '블랙 퍼퍼 · 그레이 스웨트',
      'black puffer, grey sweatshirt',
      [
        { item: 'black puffer jacket', colors: 'black' },
        { item: 'grey crew sweatshirt', colors: 'grey' },
        { item: 'black jeans', colors: 'black' },
        { item: 'black boots', colors: 'black' },
      ],
      [{ item: 'beanie', colors: 'charcoal' }],
      'winter warm',
      ['cold', 'cool']
    ),
    ethanVariant(
      '카키 필드재킷 · 헤니 · 카고',
      'khaki field jacket, henley, cargo',
      [
        { item: 'khaki field jacket', colors: 'khaki' },
        { item: 'white henley shirt', colors: 'white' },
        { item: 'olive cargo pants', colors: 'olive' },
        { item: 'brown boots', colors: 'brown' },
      ],
      [{ item: 'canvas backpack', colors: 'army green' }],
      'explorer',
      ['mild', 'warm', 'rainy']
    ),
    ethanVariant(
      '네이비 블레이저 · 스트라이프 티',
      'navy blazer, stripe tee',
      [
        { item: 'navy blazer', colors: 'navy' },
        { item: 'navy white stripe t-shirt', colors: 'navy white stripe' },
        { item: 'stone chinos', colors: 'stone beige' },
        { item: 'brown loafers', colors: 'brown' },
      ],
      [{ item: 'sunglasses', colors: 'gold aviator' }],
      'nautical smart',
      ['warm', 'mild']
    ),
    ethanVariant(
      '브라운 레더 · 블랙 티 · 진',
      'brown leather jacket, black tee, jeans',
      [
        { item: 'brown leather biker jacket', colors: 'cognac brown' },
        { item: 'black t-shirt', colors: 'black' },
        { item: 'medium wash jeans', colors: 'blue denim' },
        { item: 'black Chelsea boots', colors: 'black' },
      ],
      [{ item: 'silver watch', colors: 'silver' }],
      'leather edge',
      ['cool', 'mild']
    ),
  ]

  const palette = [
    ['테al 윈드브레이커', 'teal windbreaker', 'teal', ['warm', 'mild', 'rainy']],
    ['머스타드 스웨터', 'mustard sweater', 'mustard', ['cool', 'mild']],
    ['인디고 데님셋', 'indigo denim on denim', 'indigo', ['mild', 'warm']],
    ['그레이 오버셔츠', 'grey overshirt', 'grey', ['mild', 'cool']],
    ['포레스트 재킷', 'forest green jacket', 'forest green', ['cool', 'mild']],
    ['버건디 스웨터', 'burgundy sweater', 'burgundy', ['cool', 'cold']],
    ['샌드 린넨셋', 'sand linen set', 'sand beige', ['hot', 'warm']],
    ['네이비 레인코트', 'navy raincoat', 'navy', ['rainy', 'mild', 'cool']],
    ['차콜 코트', 'charcoal wool coat', 'charcoal', ['cold', 'cool']],
    ['코랄 폴로', 'coral polo', 'coral', ['hot', 'warm']],
  ]

  for (const [ko, en, color, tags] of palette) {
    extra.push(
      ethanVariant(
        `${ko} · 다크 진`,
        `${en}, dark jeans`,
        [
          { item: en, colors: color },
          { item: 'dark indigo jeans', colors: 'dark blue denim' },
          { item: 'white sneakers', colors: 'white' },
        ],
        [{ item: 'messenger bag', colors: 'black' }],
        `${color} travel`,
        tags
      )
    )
  }

  let i = 0
  while (extra.length < 45) {
    const hues = ['slate', 'rust', 'olive', 'navy', 'tan', 'graphite', 'copper', 'steel']
    const h = hues[i % hues.length]
    extra.push(
      ethanVariant(
        `${h} 트래블 룩 #${i + 1}`,
        `${h} travel look ${i + 1}`,
        [
          { item: 'travel jacket', colors: h },
          { item: 'neutral t-shirt', colors: 'white' },
          { item: 'travel pants', colors: 'khaki' },
          { item: 'brown shoes', colors: 'brown' },
        ],
        [{ item: 'backpack', colors: 'grey' }],
        `${h} neutral travel`,
        ['mild', 'warm']
      )
    )
    i++
  }

  return mergeToPool(base, extra, 50)
}
