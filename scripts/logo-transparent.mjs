import sharp from 'sharp';
import { join } from 'path';

const src = 'C:\\Users\\swbae\\.cursor\\projects\\c-Users-swbae-Documents-mytripfy\\assets\\c__Users_swbae_AppData_Roaming_Cursor_User_workspaceStorage_592f00f7ba525933f6ce15201746fb86_images_______2026-03-10_001644-387eb65f-f47c-4563-9538-433375338db6.png';
const dest = join(process.cwd(), 'public', 'logo-transparent.png');

const image = sharp(src);
const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const channels = 4;
const threshold = 50;

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r <= threshold && g <= threshold && b <= threshold) {
    data[i + 3] = 0;
  }
}
await sharp(Buffer.from(data), { raw: { width, height, channels } })
  .png()
  .toFile(dest);
console.log('Written', dest);
