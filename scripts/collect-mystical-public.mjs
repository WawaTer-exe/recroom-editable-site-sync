import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(process.cwd());
const outDir = resolve(root, 'seed/mystical');
const accountId = 79877956;
const username = 'Mystical.....';
const photoApi = (skip, take = 20) => `https://apim.recroom.network/apis/api/images/v4/player/${accountId}?skip=${skip}&take=${take}&sort=0`;
const imageUrl = name => `https://img.recroom.network/${name}?width=1920`;
const fetchJson = async url => {
  const response = await fetch(url, { headers: { 'user-agent': 'DreamRec-public-archive/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
};

await mkdir(outDir, { recursive: true });
const photos = [];
for (let skip = 0; skip <= 1000; skip += 20) {
  const page = await fetchJson(photoApi(skip));
  if (!Array.isArray(page) || page.length === 0) break;
  for (const item of page) {
    if (!item?.ImageName) continue;
    photos.push({
      username,
      accountId,
      imageId: item.Id,
      roomId: item.RoomId ?? null,
      imageName: item.ImageName,
      imageUrl: imageUrl(item.ImageName),
      createdAt: item.CreatedAt ?? null,
      cheerCount: item.CheerCount ?? 0,
      description: item.Description ?? null,
      taggedPlayerIds: item.TaggedPlayerIds ?? [],
      accessibility: item.Accessibility ?? null,
      sortOrder: photos.length,
    });
  }
  if (page.length < 20) break;
}
const unique = [...new Map(photos.map(item => [item.imageName, item])).values()];
await writeFile(resolve(outDir, 'photos.json'), JSON.stringify(unique, null, 2) + '\n');
await writeFile(resolve(outDir, 'rooms.json'), JSON.stringify({
  username,
  accountId,
  rooms: [
    'ReduxCon','FarewellRec-Room20162026','TerriecImaginationLobby','Lesson8FinalProject','TerriecImaginationHub','MTAGradution','ModernHouse2316','MTAGraduation','TerricImaginationGraduation','WDC-MainStage','TerricImaginationMPC','HillsideCliffs','TheFogRemember','TheMissionsOfWolfy','TerricImagination-INC','PluhsEpicCarSlide','CrystalMidnightDiner','TravelToTheTrain','ROZTeam','ROZTeamQNA','QualityQuote','WorldFreeMilitary-WFM','RockoTacoBand','CreatiiveTeam','RequestCoreMilitary-RCM','InkTasticWorkshop','RRCC_Event','CreativeLabE','HighLandMilitary-HLM','RangerClub','TeirrecImagination','WolfyDaWolfConcert','TheForeverTalkShowww','SantasNight','OrcaLineMilitary-OLM','Militaryiuu55ttGgngb','EmberSands','USEM-Military','Horizon-Force-Military','Teirrrc_military','WildlifeCreationsPodcast','WaterwoodCounty','Militarymiles','InkTasticProductions','MemoryIndex'
  ].map(slug => ({ slug, url: `https://recroom.network/room/${encodeURIComponent(slug)}` }))
}, null, 2) + '\n');
console.log(`Collected ${unique.length} unique public photos for ${username} and 45 public room links.`);
