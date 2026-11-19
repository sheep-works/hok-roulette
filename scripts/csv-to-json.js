import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// English name & ID dictionary for Honor of Kings heroes
const HERO_DICTIONARY = {
  'アーサー': { id: 'arthur', nameEn: 'Arthur' },
  'アグド': { id: 'agudo', nameEn: 'Agudo' },
  'アタ': { id: 'ata', nameEn: 'Ata' },
  'アテナ': { id: 'athena', nameEn: 'Athena' },
  'アネット': { id: 'annette', nameEn: 'Annette' },
  'アレッシオ': { id: 'alessio', nameEn: 'Alessio' },
  'アレン': { id: 'allain', nameEn: 'Allain' },
  'アンジェラ': { id: 'angela', nameEn: 'Angela' },
  'イージス': { id: 'aegis', nameEn: 'Aegis' },
  'エリン': { id: 'erin', nameEn: 'Erin' },
  'カイザー': { id: 'kaizer', nameEn: 'Kaizer' },
  'カルラ': { id: 'garuda', nameEn: 'Garuda' },
  'シャルロット': { id: 'charlotte', nameEn: 'Charlotte' },
  'タイガー': { id: 'pei', nameEn: 'Pei' },
  'チーシャ': { id: 'qixia', nameEn: 'Qixia' },
  'デーヴァラ': { id: 'devara', nameEn: 'Devara' },
  'ドリア': { id: 'dolia', nameEn: 'Dolia' },
  'ナコルル': { id: 'nakoruru', nameEn: 'Nakoruru' },
  'ナタク': { id: 'nezha', nameEn: 'Nezha' },
  'ハイノ': { id: 'heino', nameEn: 'Heino' },
  'バイロン': { id: 'biron', nameEn: 'Biron' },
  'バタフライ': { id: 'butterfly', nameEn: 'Butterfly' },
  'ハロルド': { id: 'harold', nameEn: 'Harold' },
  'ファーティフ': { id: 'fatih', nameEn: 'Fatih' },
  'フロレンティーノ': { id: 'florentino', nameEn: 'Florentino' },
  'マルコ・ポーロ': { id: 'marco-polo', nameEn: 'Marco Polo' },
  'ミーユエ': { id: 'mi-yue', nameEn: 'Mi Yue' },
  'ミレディ': { id: 'milady', nameEn: 'Milady' },
  'ムーラン': { id: 'mulan', nameEn: 'Mulan' },
  'モンキ': { id: 'menki', nameEn: 'Menki' },
  'ユンエイ': { id: 'yun-ying', nameEn: 'Yun Ying' },
  'ラプール': { id: 'raphael', nameEn: 'Raphael' },
  'ルアンナ': { id: 'luara', nameEn: 'Luara' },
  'ルナ': { id: 'luna', nameEn: 'Luna' },
  'ロリアン': { id: 'lorion', nameEn: 'Lorion' },
  '阿軻': { id: 'ake', nameEn: 'Ake' },
  '雲中君': { id: 'cirrus', nameEn: 'Cirrus' },
  '影': { id: 'shadow', nameEn: 'Shadow' },
  '王維': { id: 'wang-wei', nameEn: 'Wang Wei' },
  '王昭君': { id: 'wang-zhaojun', nameEn: 'Wang Zhaojun' },
  '黄忠': { id: 'huang-zhong', nameEn: 'Huang Zhong' },
  '伽羅': { id: 'garo', nameEn: 'Garo' },
  '夏侯惇': { id: 'dun', nameEn: 'Dun' },
  '干将・莫耶': { id: 'gan-mo', nameEn: 'Gan & Mo' },
  '関羽': { id: 'guan-yu', nameEn: 'Guan Yu' },
  '韓信': { id: 'han-xin', nameEn: 'Han Xin' },
  '棋星': { id: 'yixing', nameEn: 'Yixing' },
  '鬼谷子': { id: 'guiguzi', nameEn: 'Guiguzi' },
  '橘右京': { id: 'ukyo-tachibana', nameEn: 'Ukyo Tachibana' },
  '宮本武蔵': { id: 'musashi', nameEn: 'Musashi' },
  '鏡': { id: 'jing', nameEn: 'Jing' },
  '虞美人': { id: 'consort-yu', nameEn: 'Consort Yu' },
  '啓': { id: 'sakeer', nameEn: 'Sakeer' },
  '元歌': { id: 'yuan-ge', nameEn: 'Yuan Ge' },
  '公孫離': { id: 'arli', nameEn: 'Arli' },
  '后羿': { id: 'hou-yi', nameEn: 'Hou Yi' },
  '孔子': { id: 'fuzi', nameEn: 'Fuzi' },
  '孔明': { id: 'kongming', nameEn: 'Kongming' },
  '項羽': { id: 'xiang-yu', nameEn: 'Xiang Yu' },
  '司馬懿': { id: 'sima-yi', nameEn: 'Sima Yi' },
  '周瑜': { id: 'zhou-yu', nameEn: 'Zhou Yu' },
  '女媧': { id: 'nuwa', nameEn: 'Nuwa' },
  '小喬': { id: 'xiao-qiao', nameEn: 'Xiao Qiao' },
  '少司縁': { id: 'dyadia', nameEn: 'Dyadia' },
  '鐘無艶': { id: 'zhong-wuyan', nameEn: 'Wuyan' },
  '鐘馗': { id: 'kui', nameEn: 'Kui' },
  '上官婉児': { id: 'shangguan', nameEn: 'Shangguan' },
  '仁傑': { id: 'di-renjie', nameEn: 'Di Renjie' },
  '西施': { id: 'shi', nameEn: 'Shi' },
  '漸離': { id: 'gao', nameEn: 'Gao' },
  '荘子': { id: 'zhuangzi', nameEn: 'Zhuangzi' },
  '蒼': { id: 'cang', nameEn: 'Cang' },
  '孫悟空': { id: 'wukong', nameEn: 'Wukong' },
  '孫策': { id: 'sun-ce', nameEn: 'Sun Ce' },
  '孫尚香': { id: 'lady-sun', nameEn: 'Lady Sun' },
  '孫臏': { id: 'sun-bin', nameEn: 'Sun Bin' },
  '太公望': { id: 'ziya', nameEn: 'Ziya' },
  '大喬': { id: 'da-qiao', nameEn: 'Da Qiao' },
  '大司命': { id: 'augran', nameEn: 'Augran' },
  '達磨': { id: 'dharma', nameEn: 'Dharma' },
  '張飛': { id: 'zhang-fei', nameEn: 'Zhang Fei' },
  '張良': { id: 'liang', nameEn: 'Liang' },
  '典韋': { id: 'dian-wei', nameEn: 'Dian Wei' },
  '東皇太一': { id: 'donghuang', nameEn: 'Donghuang' },
  '白起': { id: 'bai-qi', nameEn: 'Bai Qi' },
  '白龍': { id: 'loong', nameEn: 'Loong' },
  '姫小満': { id: 'mayene', nameEn: 'Mayene' },
  '百里玄策': { id: 'xuance', nameEn: 'Xuance' },
  '百里守約': { id: 'shouyue', nameEn: 'Shouyue' },
  '不知火舞': { id: 'mai-shiranui', nameEn: 'Mai Shiranui' },
  '墨子': { id: 'mozi', nameEn: 'Mozi' },
  '明世隠': { id: 'ming', nameEn: 'Ming' },
  '蒙牙': { id: 'meng-ya', nameEn: 'Meng Ya' },
  '曜': { id: 'yao-clash', nameEn: 'Yao' },
  '楊貴妃': { id: 'yuhuan', nameEn: 'Yuhuan' },
  '楊戩': { id: 'yang-jian', nameEn: 'Yang Jian' },
  '蘭陵王': { id: 'prince-of-lanling', nameEn: 'Prince of Lanling' },
  '李元芳': { id: 'fang', nameEn: 'Fang' },
  '李信': { id: 'li-xin', nameEn: 'Li Xin' },
  '李白': { id: 'li-bai', nameEn: 'Li Bai' },
  '劉禅': { id: 'liu-shan', nameEn: 'Liu Shan' },
  '劉備': { id: 'liu-bei', nameEn: 'Liu Bei' },
  '劉邦': { id: 'liu-bang', nameEn: 'Liu Bang' },
  '廉頗': { id: 'lian-po', nameEn: 'Lian Po' },
  '呂布': { id: 'lu-bu', nameEn: 'Lu Bu' },
  '魯班7号': { id: 'luban-no-7', nameEn: 'Luban No. 7' },
  '妲己': { id: 'daji', nameEn: 'Daji' },
  '扁鵲': { id: 'bian-que', nameEn: 'Dr. Bian' },
  '溟月': { id: 'haya', nameEn: 'Haya' },
  '瀾': { id: 'lam', nameEn: 'Lam' },
  '瑶': { id: 'yaria', nameEn: 'Yaria' },
  '甄姫': { id: 'zhen-ji', nameEn: 'Lady Zhen' },
  '蔡文姫': { id: 'cai-yan', nameEn: 'Cai Yan' },
  '貂蝉': { id: 'diaochan', nameEn: 'Diaochan' },
  '趙雲': { id: 'zilong', nameEn: 'Zilong' },
  '元流（タンク）': { id: 'flowborn-tank', nameEn: 'Flowborn (Tank)' },
  '元流（メイジ）': { id: 'flowborn-mage', nameEn: 'Flowborn (Mage)' },
  '元流（マークスマン）': { id: 'flowborn-marksman', nameEn: 'Flowborn (Marksman)' },
  '元流（アサシン）': { id: 'flowborn-assassin', nameEn: 'Flowborn (Assassin)' },
  '元流（サポート）': { id: 'flowborn-support', nameEn: 'Flowborn (Support)' },
};

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

export function convertCsvToJson(csvPath, outputPath) {
  const resolvedCsvPath = csvPath || (fs.existsSync(path.join(process.cwd(), 'HOK.csv'))
    ? path.join(process.cwd(), 'HOK.csv')
    : path.join(process.cwd(), 'heroes.csv'));

  const resolvedOutputPath = outputPath || path.join(process.cwd(), 'src', 'data', 'heroes.json');

  if (!fs.existsSync(resolvedCsvPath)) {
    throw new Error(`CSV file not found: ${resolvedCsvPath}`);
  }

  const rawContent = fs.readFileSync(resolvedCsvPath, 'utf8');
  // Strip BOM if present
  const content = rawContent.replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing data rows');
  }

  const headerLine = lines[0];
  const headerCols = parseCSVLine(headerLine).map(c => c.trim());

  // Map lane columns (columns 3 to 7 based on header or standard position)
  // Column names in HOK.csv: クラッシュ, ミドル, ファーム, ジャングル, ローム
  const laneKeyMap = {
    'クラッシュ': 'clash',
    'ミドル': 'mid',
    'ファーム': 'farm',
    'ジャングル': 'jungle',
    'ローム': 'roam',
    'clash': 'clash',
    'mid': 'mid',
    'farm': 'farm',
    'jungle': 'jungle',
    'roam': 'roam'
  };

  // Find column indices
  let laneIndices = {};
  headerCols.forEach((col, idx) => {
    const lower = col.toLowerCase();
    for (const [key, val] of Object.entries(laneKeyMap)) {
      if (key === col || key === lower) {
        laneIndices[val] = idx;
      }
    }
  });

  // Fallback default lane column indices if header didn't match
  if (Object.keys(laneIndices).length === 0) {
    laneIndices = {
      clash: 3,
      mid: 4,
      farm: 5,
      jungle: 6,
      roam: 7
    };
  }

  const heroes = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const nameJa = row[0] ? row[0].trim() : '';
    if (!nameJa) continue;

    const defaultTier = row[1] ? row[1].trim() : '';
    const role = row[2] ? row[2].trim() : '';

    const lanes = {};
    for (const [lane, colIdx] of Object.entries(laneIndices)) {
      const tierVal = row[colIdx] ? row[colIdx].trim() : '';
      if (tierVal) {
        lanes[lane] = tierVal;
      }
    }

    const dictEntry = HERO_DICTIONARY[nameJa] || {
      id: `hero-${i}`,
      nameEn: nameJa
    };

    heroes.push({
      no: i, // 1-based sequential immutable index for party share links
      id: dictEntry.id,
      nameJa: nameJa,
      nameEn: dictEntry.nameEn,
      role: role,
      defaultTier: defaultTier,
      lanes: lanes
    });
  }

  const outputDir = path.dirname(resolvedOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutputPath, JSON.stringify(heroes, null, 2), 'utf8');
  console.log(`Successfully converted ${heroes.length} heroes from ${path.basename(resolvedCsvPath)} to ${resolvedOutputPath}`);
  return heroes;
}

// Execute if run directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  convertCsvToJson();
}
