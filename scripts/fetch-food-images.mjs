#!/usr/bin/env node
/**
 * 100 Foods 이미지를 Commons에서 다운로드하여 public/foods/에 저장
 * 실행: node scripts/fetch-food-images.mjs
 * 
 * Commons 권장: 다운로드 후 자체 서버에서 제공
 * @see https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/technical
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'public', 'foods')

function toSlug(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u201A\u201B\u2032']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function extFromUrl(url) {
  const m = url.match(/\/[^/]+\.(jpg|jpeg|png|gif|webp)(?:\?|$)/i)
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg'
}

/** 썸네일 URL → 원본(캐노니컬) URL. 다운로드 안정화 */
function thumbToCanonical(url) {
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

const FOODS = {
  'A5 Wagyu Beef': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Wagyu_beef_2.jpg/640px-Wagyu_beef_2.jpg',
  'Alaskan King Crab': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Paralithodes_camtschaticus_2.jpg/640px-Paralithodes_camtschaticus_2.jpg',
  'Arancini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Sicilian_arancini.jpg/640px-Sicilian_arancini.jpg',
  'Baklava': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Baklava_-_Turkish_special%2C_80-ply_Dough_Pastry_Layered_with_Walnuts_and_Honey.jpg/640px-Baklava_-_Turkish_special%2C_80-ply_Dough_Pastry_Layered_with_Walnuts_and_Honey.jpg',
  'Balut Duck Embryo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Balut_eggs.jpg/640px-Balut_eggs.jpg',
  'Beef Rendang': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Rendang_daging_sapi_asli_Padang.JPG/640px-Rendang_daging_sapi_asli_Padang.JPG',
  'Beluga Caviar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Caviar_oscetra.jpg/640px-Caviar_oscetra.jpg',
  'Bibimbap': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Dolsot-bibimbap.jpg/640px-Dolsot-bibimbap.jpg',
  "Bird's Nest Soup": 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Edible-birds-nest-bowl-shape.png/640px-Edible-birds-nest-bowl-shape.png',
  'Bouillabaisse': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Bouillabaisse.jpg/640px-Bouillabaisse.jpg',
  'Brazilian Churrasco': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Churrasco_brasileiro.jpg/640px-Churrasco_brasileiro.jpg',
  'Ceviche': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Ceviche_peruano.jpg/640px-Ceviche_peruano.jpg',
  'Char Siu BBQ Pork': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Char_siu_bbq_pork.jpg/640px-Char_siu_bbq_pork.jpg',
  'Chimichanga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Chimichanga_with_rice_and_beans.jpg/640px-Chimichanga_with_rice_and_beans.jpg',
  'Congee Jook': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cantonese_congee_with_lean_pork_and_century_egg.jpg/640px-Cantonese_congee_with_lean_pork_and_century_egg.jpg',
  'Coq au Vin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Coq_au_vin_1.jpg/640px-Coq_au_vin_1.jpg',
  'Cuy Roasted Guinea Pig': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Cuy_Peruvian_dish.jpg',
  'Doner Kebab': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/D%C3%B6ner_Kebab_%28fast_food%29.jpg/640px-D%C3%B6ner_Kebab_%28fast_food%29.jpg',
  'Durian King of Fruits': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Durian_open.jpg/640px-Durian_open.jpg',
  'Eggs Benedict': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Eggs_Benedict.jpg/640px-Eggs_Benedict.jpg',
  'Empanada': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Tapa_de_empanadillitas.JPG/640px-Tapa_de_empanadillitas.JPG',
  'Escargot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Escargots_%C3%A0_la_bourguignonne.jpg/640px-Escargots_%C3%A0_la_bourguignonne.jpg',
  'Fish and Chips': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Fish_and_chips_blackpool.jpg/640px-Fish_and_chips_blackpool.jpg',
  'Foie Gras': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Foie_gras_en_cocotte.jpg/640px-Foie_gras_en_cocotte.jpg',
  'French Croissant': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Croissant-Petr_Kratochvil.jpg/640px-Croissant-Petr_Kratochvil.jpg',
  'Fugu Puffer Fish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Fugu_sashimi.jpg/640px-Fugu_sashimi.jpg',
  'Full Turkish Breakfast': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Turkish_breakfast_spread.jpg/640px-Turkish_breakfast_spread.jpg',
  'Gelato': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Gelato_in_Florence.jpg/640px-Gelato_in_Florence.jpg',
  'Greek Mezze Spread': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Petra_metzes.jpg/640px-Petra_metzes.jpg',
  'Haggis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Haggis_with_neeps_and_tatties.jpg/640px-Haggis_with_neeps_and_tatties.jpg',
  'Hakarl Fermented Greenland Shark': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/H%C3%A1karl.jpg/640px-H%C3%A1karl.jpg',
  'Hakata Tonkotsu Ramen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Hakata_ramen.jpg/640px-Hakata_ramen.jpg',
  'Hungarian Goulash': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Gulyasleves.jpg/640px-Gulyasleves.jpg',
  'Iberico Ham': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Jamon_iberico_de_bellota_2_%28cinco_jotas%29.jpg/640px-Jamon_iberico_de_bellota_2_%28cinco_jotas%29.jpg',
  'Injera with Wat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Injera_with_wat.jpg/640px-Injera_with_wat.jpg',
  'Jerk Chicken': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Jerk_chicken_2.jpg/640px-Jerk_chicken_2.jpg',
  'Jollof Rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Jollof_Rice_With_Chicken.jpg/640px-Jollof_Rice_With_Chicken.jpg',
  'Khachapuri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Adjaruli_khachapuri.jpg/640px-Adjaruli_khachapuri.jpg',
  'Kimchi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Kimchi_%28김치%29.jpg/640px-Kimchi_%28김치%29.jpg',
  'Laksa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Laksa_lemak.jpg/640px-Laksa_lemak.jpg',
  'Maine Lobster Roll': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lobster_roll_from_Red%27s_Eats.jpg/640px-Lobster_roll_from_Red%27s_Eats.jpg',
  'Masala Dosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Rameshwaram_Cafe_Dosa.jpg/640px-Rameshwaram_Cafe_Dosa.jpg',
  'Matsutake Mushroom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Matsutake_mushroom.jpg/640px-Matsutake_mushroom.jpg',
  'Mole Negro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Mole_negro_con_pollo.jpg/640px-Mole_negro_con_pollo.jpg',
  'Momos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Momos_at_a_restaurant_in_Kathmandu.jpg/640px-Momos_at_a_restaurant_in_Kathmandu.jpg',
  'Moroccan Tagine': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Tagine_chicken_preserved_lemon_olives.jpg/640px-Tagine_chicken_preserved_lemon_olives.jpg',
  'Moules Frites': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Moules-frites.jpg/640px-Moules-frites.jpg',
  'Nasi Goreng': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Nasi_Goreng_with_chicken_satay.jpg/640px-Nasi_Goreng_with_chicken_satay.jpg',
  'New England Clam Chowder': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/New_England_clam_chowder.jpg/640px-New_England_clam_chowder.jpg',
  'Ortolan Bunting': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Ortolan_%C3%A0_la_proven%C3%A7ale.JPG',
  'Pad Thai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Pad_Thai.jpg/640px-Pad_Thai.jpg',
  'Paella Valenciana': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Paella_Valenciana.jpg/640px-Paella_Valenciana.jpg',
  'Pata Negra Jamon Bellota': 'https://upload.wikimedia.org/wikipedia/commons/9/94/Pata_Negra.jpg',
  'Perigord Black Truffle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Black_truffle_Tuber_melanosporum.jpg/640px-Black_truffle_Tuber_melanosporum.jpg',
  'Pho Bo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Pho-Beef-Noodles-2008.jpg/640px-Pho-Beef-Noodles-2008.jpg',
  'Pierogi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Pierogi_z_cebulk%C4%85.jpg/640px-Pierogi_z_cebulk%C4%85.jpg',
  'Pizza Napoletana': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/640px-Eq_it-na_pizza-margherita_sep2005_sml.jpg',
  'Poutine': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Poutine_%281%29.jpg/640px-Poutine_%281%29.jpg',
  'Ramen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Shoyu_ramen%2C_at_Kasukabe_Station_%282014.05.05%29.jpg/640px-Shoyu_ramen%2C_at_Kasukabe_Station_%282014.05.05%29.jpg',
  'Roti Canai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Roti_canai_at_Restaurant_Saravana_Bhavan.jpg/640px-Roti_canai_at_Restaurant_Saravana_Bhavan.jpg',
  'Saltimbocca alla Romana': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Saltimbocca_alla_romana.jpg/640px-Saltimbocca_alla_romana.jpg',
  'Samosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Samosas_Chaat.jpg/640px-Samosas_Chaat.jpg',
  'Satay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Sate_Ponorogo.jpg/640px-Sate_Ponorogo.jpg',
  'Seafood Paella': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Paella_Valenciana.jpg/640px-Paella_Valenciana.jpg',
  'Shark Fin Soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Shark_fin_soup_2.jpg/640px-Shark_fin_soup_2.jpg',
  'Som Tam Green Papaya Salad': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Som_tam_thai.jpg/640px-Som_tam_thai.jpg',
  'Swedish Smorgasbord': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sm%C3%B6rg%C3%A5sbord_2.jpg/640px-Sm%C3%B6rg%C3%A5sbord_2.jpg',
  'Sushi Omakase': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sushi_platter.jpg/640px-Sushi_platter.jpg',
  'Takoyaki': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Takoyaki.jpg/640px-Takoyaki.jpg',
  'Tamal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Tamales_olla.jpg/640px-Tamales_olla.jpg',
  'Tandoori Chicken': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Tandoori_chicken_laccha_piyaz_1.jpg/640px-Tandoori_chicken_laccha_piyaz_1.jpg',
  'Tom Yum Goong': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Tom_yum_kung.jpg/640px-Tom_yum_kung.jpg',
  'Truffle Pasta Alba': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Tajarin_with_white_truffle.jpg/640px-Tajarin_with_white_truffle.jpg',
  'Tsukemen Dipping Ramen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tsukemen_by_tonkotsu_in_Tokyo.jpg/640px-Tsukemen_by_tonkotsu_in_Tokyo.jpg',
  'Tzatziki': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tzatziki_%28cropped%29.jpg/640px-Tzatziki_%28cropped%29.jpg',
  'Unagi Kabayaki': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/%E5%B0%8F%E5%B7%9D%E8%8F%8A%E9%B0%BB%E9%AD%9A%E9%A3%AF_%2849287165332%29.jpg/640px-%E5%B0%8F%E5%B7%9D%E8%8F%8A%E9%B0%BB%E9%AD%9A%E9%A3%AF_%2849287165332%29.jpg',
  'Valrhona Chocolate': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Three_Bars_%281%29.jpg/640px-Three_Bars_%281%29.jpg',
  'Wiener Schnitzel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Wiener_Schnitzel_2.jpg/640px-Wiener_Schnitzel_2.jpg',
  'Witchetty Grub': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Witchetty_grub.jpg/640px-Witchetty_grub.jpg',
  'Xiaolongbao Soup Dumplings': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Xiaolongbao_steamed_buns.jpg/640px-Xiaolongbao_steamed_buns.jpg',
  'Yakitori': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Cooking_yakitori.jpg/640px-Cooking_yakitori.jpg',
  'Zaatar Manakish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Manakish_with_za%27atar.jpg/640px-Manakish_with_za%27atar.jpg',
  'Zongzi Dragon Boat Dumplings': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Zongzi.jpg/640px-Zongzi.jpg',
  'Acai Bowl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/A%C3%A7a%C3%AD_do_Par%C3%A1.jpg/640px-A%C3%A7a%C3%AD_do_Par%C3%A1.jpg',
  'Birria Tacos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Birria_tacos.jpg/640px-Birria_tacos.jpg',
  'Bunny Chow': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Quarter_Mutton_Bunny_Chow.jpg/640px-Quarter_Mutton_Bunny_Chow.jpg',
  'Currywurst': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Currywurst_mit_Pommes.jpg/640px-Currywurst_mit_Pommes.jpg',
  'Dom Perignon Champagne': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Dom_P%C3%A9rignon_2002.jpg/640px-Dom_P%C3%A9rignon_2002.jpg',
  'Feijoada': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Feijoada_1.jpg/640px-Feijoada_1.jpg',
  'Fresh Pacific Oysters': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Crassostrea_gigas_p1040848.jpg/640px-Crassostrea_gigas_p1040848.jpg',
  'Fugu Shirako': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Fugu_sashimi.jpg/640px-Fugu_sashimi.jpg',
  'Hu Tieu Nam Vang': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hu_tieu_nam_vang.jpg/640px-Hu_tieu_nam_vang.jpg',
  'Indomie Mi Goreng': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Indomie_Mi_Goreng.jpg/640px-Indomie_Mi_Goreng.jpg',
  'Katsudon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Katsudon_by_tonkatsu_in_Tokyo.jpg/640px-Katsudon_by_tonkatsu_in_Tokyo.jpg',
  'Khao Niao Mamuang (Mango Sticky Rice)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Khao_niao_mamuang.jpg/640px-Khao_niao_mamuang.jpg',
  'Kopi Luwak Civet Coffee': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Kopi_luwak_090910-0075_lamb.JPG/640px-Kopi_luwak_090910-0075_lamb.JPG',
  'Lamington': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Lamington_cake.jpg/640px-Lamington_cake.jpg',
  'Lomo Saltado': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Lomo_Saltado_-_Lima%2C_Peru_Miraflores_%28Tiendecita_Blanca%29.jpg/640px-Lomo_Saltado_-_Lima%2C_Peru_Miraflores_%28Tiendecita_Blanca%29.jpg',
  'Nasi Lemak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Nasi_lemak.jpg/640px-Nasi_lemak.jpg',
  'Peyote Cactus Ceremonial Meal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Lophophora_williamsii_2.jpg/640px-Lophophora_williamsii_2.jpg',
}

const USER_AGENT = 'MyTripfy/1.0 (https://mytripfy.com; food images fetch script)'

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      })
      if (res.ok) return await res.arrayBuffer()
      if (res.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)))
        continue
      }
      console.error(`  ✗ ${res.status} ${url}`)
      return null
    } catch (e) {
      console.error(`  ✗ ${e.message} ${url}`)
      if (i < retries) await new Promise(r => setTimeout(r, 1000))
      return null
    }
  }
  return null
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const seen = new Set()
  const map = {}
  const entries = Object.entries(FOODS)
  console.log(`Downloading ${entries.length} food images to public/foods/...`)

  for (let i = 0; i < entries.length; i++) {
    const [title, url] = entries[i]
    const slug = toSlug(title)
    if (seen.has(slug)) continue
    seen.add(slug)
    const ext = extFromUrl(url)
    const filename = `${slug}.${ext}`
    const filepath = path.join(OUT_DIR, filename)
    process.stdout.write(`[${i + 1}/${entries.length}] ${slug}... `)
    const buf = await fetchWithRetry(url)
    if (buf) {
      fs.writeFileSync(filepath, Buffer.from(buf))
      map[slug] = filename
      console.log('✓')
    } else {
      console.log('✗ (skipped)')
    }
    await new Promise(r => setTimeout(r, 300))
  }

  fs.writeFileSync(path.join(OUT_DIR, 'map.json'), JSON.stringify(map, null, 2))
  console.log(`\nDone. ${Object.keys(map).length} images saved. Run "npm run build" and update ChallengeImage to use /foods/*`)
}

main().catch(console.error)
