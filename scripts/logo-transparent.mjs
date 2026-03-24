import sharp from 'sharp';
import { join } from 'path';

const src = 'C:\\Users\\swbae\\.cursor\\projects\\c-Users-swbae-Documents-mytripfy\\assets\\c__Users_swbae_AppData_Roaming_Cursor_User_workspaceStorage_592f00f7ba525933f6ce15201746fb86_images_mytripfy_logo-efae1c7d-3d22-4b48-a281-cdb3e3d78096.png';
const transparentDest = join(process.cwd(), 'public', 'logo-transparent.png');
const logoDest = join(process.cwd(), 'public', 'logo.png');

const image = sharp(src);
const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const channels = 4;

// 흰 배경(또는 거의 흰색)을 투명 처리
const whiteThreshold = 245;
for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
    data[i + 3] = 0;
  }
}

const out = sharp(Buffer.from(data), { raw: { width, height, channels } }).png();
await out.toFile(transparentDest);
await out.toFile(logoDest);

console.log('Written', transparentDest);
console.log('Written', logoDest);
