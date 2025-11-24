export interface ParsedTitle {
  artist: string;
  title: string;
}

function cleanString(str: string): string {
  return str
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function removeParenthesesContent(str: string): string {
  return str.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export function parseMusicTitle(fullTitle: string, channelName: string): ParsedTitle[] {
  const variations: ParsedTitle[] = [];
  
  let cleaned = fullTitle
    .replace(/["'']/g, '"')
    .replace(/[‐‑‒–—]/g, '-');

  const metadataPatterns = [
    /\s*\|\s*dir\.?\s*@?\w+/gi,
    /\s*dir\.?\s*@?\w+/gi,
    /\(Official (?:Video|Audio|Music Video|Lyric Video|Visualizer)\)/gi,
    /\[Official (?:Video|Audio|Music Video|Lyric Video|Visualizer)\]/gi,
    /\((?:Official|Audio|Video|Visualizer)\)/gi,
    /\[(?:Official|Audio|Video|Visualizer)\]/gi,
    /\(HD Remaster(?:ed)?\)/gi,
    /\[HD Remaster(?:ed)?\]/gi,
    /\((?:HD|HQ|4K|1080p|720p)\)/gi,
    /\[(?:HD|HQ|4K|1080p|720p)\]/gi,
    /\(Lyrics?\)/gi,
    /\[Lyrics?\]/gi,
    /\(feat\.?\s+[^)]+\)/gi,
    /\[feat\.?\s+[^)]+\]/gi,
    /\(ft\.?\s+[^)]+\)/gi,
    /\[ft\.?\s+[^)]+\]/gi,
  ];

  for (const pattern of metadataPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  const dashSplit = cleaned.split(/\s*[-–—]\s*/);
  if (dashSplit.length >= 2) {
    const part1 = dashSplit[0].trim();
    const part2 = dashSplit.slice(1).join(' - ').trim();
    
    variations.push({ artist: part1, title: part2 });
    variations.push({ artist: cleanString(part1), title: cleanString(part2) });
    
    variations.push({ artist: part2, title: part1 });
    variations.push({ artist: cleanString(part2), title: cleanString(part1) });
    
    const part1NoParens = removeParenthesesContent(part1);
    const part2NoParens = removeParenthesesContent(part2);
    if (part1NoParens !== part1 || part2NoParens !== part2) {
      variations.push({ artist: part1NoParens, title: part2NoParens });
      variations.push({ artist: cleanString(part1NoParens), title: cleanString(part2NoParens) });
    }
  }

  const ampersandSplit = cleaned.split(/\s*&\s*/);
  if (ampersandSplit.length >= 2) {
    const firstArtist = ampersandSplit[0].trim();
    const quotesMatch = cleaned.match(/"([^"]+)"/);
    if (quotesMatch) {
      const songTitle = quotesMatch[1];
      variations.push({ artist: firstArtist, title: songTitle });
      variations.push({ artist: cleanString(firstArtist), title: cleanString(songTitle) });
    }
  }

  const colonSplit = cleaned.split(/\s*[:|•]\s*/);
  if (colonSplit.length >= 2) {
    const part1 = colonSplit[0].trim();
    const part2 = colonSplit.slice(1).join(' ').trim();
    
    variations.push({ artist: part1, title: part2 });
    variations.push({ artist: cleanString(part1), title: cleanString(part2) });
  }

  const quotesMatch = cleaned.match(/"([^"]+)"/);
  if (quotesMatch) {
    const titleInQuotes = quotesMatch[1];
    const artistPart = cleaned.replace(quotesMatch[0], '').replace(/\s*&.*$/, '').trim();
    if (artistPart) {
      variations.push({ artist: artistPart, title: titleInQuotes });
      variations.push({ artist: cleanString(artistPart), title: cleanString(titleInQuotes) });
    }
  }

  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    for (let i = 1; i < words.length; i++) {
      const artist = words.slice(0, i).join(' ');
      const title = words.slice(i).join(' ');
      
      variations.push({ artist, title });
      variations.push({ artist: cleanString(artist), title: cleanString(title) });
      variations.push({ artist: title, title: artist });
      variations.push({ artist: cleanString(title), title: cleanString(artist) });
    }
  }

  if (channelName && channelName.length > 0) {
    variations.push({ artist: channelName, title: cleaned });
    variations.push({ artist: cleanString(channelName), title: cleanString(cleaned) });
    
    if (words.length >= 1) {
      for (let i = 1; i < words.length; i++) {
        const titlePart = words.slice(i).join(' ');
        variations.push({ artist: channelName, title: titlePart });
        variations.push({ artist: cleanString(channelName), title: cleanString(titlePart) });
      }
      
      for (let i = 0; i < words.length - 1; i++) {
        const titlePart = words.slice(0, i + 1).join(' ');
        variations.push({ artist: channelName, title: titlePart });
        variations.push({ artist: cleanString(channelName), title: cleanString(titlePart) });
      }
    }
  }

  const uniqueVariations = Array.from(
    new Map(variations.map(v => [`${v.artist}|${v.title}`, v])).values()
  );

  return uniqueVariations;
}

