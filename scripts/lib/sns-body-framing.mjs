/**
 * 캐릭터 신체 비율·키 (모든 이미지 프롬프트에 적용)
 */
export const SUBJECT_FRAMING = {
  ethan: {
    heightEn:
      'very tall man exactly 188cm 6 feet 2 inches, noticeably tall in every frame compared to doorways and crowds',
    proportionsEn:
      'fashion-model body ratio about 8 head-heights, long legs long torso, lean athletic NOT stocky NOT short',
    cameraEn:
      '50mm or 85mm natural perspective, no wide-angle distortion that shortens legs, frame must include enough body to read tall height',
    avoidEn: 'NEVER dwarf proportions, NEVER short legs, NEVER compressed squat framing, NEVER identical standing pose in carousel, NEVER holding coffee cup or drink',
  },
  sua: {
    heightEn:
      'woman exactly 168cm 5 feet 6 inches, naturally tall feminine proportions visible in every full-body frame',
    proportionsEn:
      'balanced 7.5 to 8 head-height proportions, long legs slim feminine build NOT squat NOT stocky NOT childlike NOT compressed',
    cameraEn:
      '50mm or 85mm natural perspective for full-body shots, camera at chest or waist height NOT overhead bird-eye, no wide-angle distortion that shortens legs, standing shots must show head to feet or at least ankles, subject fills 65-80% of frame height',
    avoidEn:
      'NEVER dwarf proportions, NEVER short legs, NEVER squat compressed framing, NEVER overhead downward angle making subject look small, NEVER crop at knees hiding leg length, avoid identical pose every slide, full-body shots must read natural height',
  },
}

/** @param {'sua'|'ethan'} character */
export function getSubjectFramingBlock(character) {
  const f = SUBJECT_FRAMING[character]
  return `${f.heightEn}, ${f.proportionsEn}, ${f.cameraEn}, ${f.avoidEn}`
}

export const ETHAN_POSE_PRESETS = [
  'standing one foot on step one hand in shorts pocket other hand holding folded navy umbrella at side, looking away at scenery, 3/4 front full body showing long legs, no coffee no drink',
  'seated on stool leaning forward elbows on table eating, legs visible under table not cropped at waist',
  'walking mid-stride away from camera one hand in pocket, over-shoulder shot tall silhouette',
  'leaning shoulder against wall arms crossed looking up, low angle from knee height emphasizing height',
]

export const ETHAN_POSE_PRESETS_DRY = [
  'standing one foot on step one hand in pants pocket other hand adjusting grey backpack strap, looking away at scenery, 3/4 front full body showing long legs, no coffee no drink no umbrella',
  'seated on stool leaning forward elbows on table eating, legs visible under table not cropped at waist',
  'walking mid-stride away from camera one hand in pocket, over-shoulder shot tall silhouette',
  'leaning shoulder against wall arms crossed looking up, low angle from knee height emphasizing height',
]

export const SUA_POSE_PRESETS = [
  'standing one foot forward pointing at landmark, bag under arm umbrella at side, off-camera gaze eye-level 3/4 full body head to feet',
  'seated at cafe table leaning in laughing, medium shot showing torso and table not cropped at waist',
  'walking mid-step looking sideways at shop window, full body street shot eye-level head to feet',
  'standing at viewpoint looking at city lights, relaxed full body dusk eye-level framing head to feet',
]

export const SUA_POSE_PRESETS_DRY = [
  'standing one foot forward pointing at landmark, bag strap on shoulder both hands relaxed at sides, off-camera gaze eye-level 3/4 full body head to feet, no umbrella',
  'seated at cafe table leaning in laughing, medium shot showing torso and table not cropped at waist',
  'walking mid-step looking sideways at shop window, full body street shot eye-level head to feet',
  'standing at viewpoint looking at city lights, relaxed full body dusk eye-level framing head to feet',
]

/** @param {boolean} [carryUmbrella=true] */
export function getEthanPosePresets(carryUmbrella = true) {
  return carryUmbrella ? ETHAN_POSE_PRESETS : ETHAN_POSE_PRESETS_DRY
}

/** @param {boolean} [carryUmbrella=true] */
export function getSuaPosePresets(carryUmbrella = true) {
  return carryUmbrella ? SUA_POSE_PRESETS : SUA_POSE_PRESETS_DRY
}

/** @param {number} i @param {boolean} [carryUmbrella=true] */
export function getEthanPosePreset(i, carryUmbrella = true) {
  const list = getEthanPosePresets(carryUmbrella)
  return list[i % list.length]
}

/** @param {number} i @param {boolean} [carryUmbrella=true] */
export function getSuaPosePreset(i, carryUmbrella = true) {
  const list = getSuaPosePresets(carryUmbrella)
  return list[i % list.length]
}

/** 우산 없는 날 itinerary pose 문구 정리 */
export function stripUmbrellaFromPose(pose) {
  return pose
    .replace(/\s*other hand holding folded navy umbrella at side,?\s*/gi, ' ')
    .replace(/\s*holding folded umbrella[^,]*,?\s*/gi, ' ')
    .replace(/\s*umbrella at side,?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
