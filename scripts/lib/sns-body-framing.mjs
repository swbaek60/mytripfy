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
    avoidEn: 'NEVER dwarf proportions, NEVER short legs, NEVER compressed squat framing, NEVER identical standing pose in carousel',
  },
  sua: {
    heightEn: 'woman 168cm average height natural proportions',
    proportionsEn: 'balanced 7.5 head-height proportions, slim feminine build',
    cameraEn: '35mm natural perspective, varied framing per slide',
    avoidEn: 'avoid identical pose every slide',
  },
}

/** @param {'sua'|'ethan'} character */
export function getSubjectFramingBlock(character) {
  const f = SUBJECT_FRAMING[character]
  return `${f.heightEn}, ${f.proportionsEn}, ${f.cameraEn}, ${f.avoidEn}`
}

export const ETHAN_POSE_PRESETS = [
  'standing one foot on step hand on hip other hand holding coffee cup, 3/4 front full body showing long legs',
  'seated on stool leaning forward elbows on table eating, legs visible under table not cropped at waist',
  'walking mid-stride away from camera one hand in pocket, over-shoulder shot tall silhouette',
  'leaning shoulder against wall arms crossed looking up, low angle from knee height emphasizing height',
]

export const SUA_POSE_PRESETS = [
  'standing weight on one leg hand touching hair, casual 3/4 body',
  'seated at cafe table leaning in laughing, upper body and hands visible',
  'walking mid-step looking sideways at shop window, full body street shot',
  'standing at railing arms resting on rail looking at view, relaxed full body dusk',
]
