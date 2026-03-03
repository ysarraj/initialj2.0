/**
 * Japanese text utilities shared between lessons and reviews.
 */

export const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'sa': 'さ', 'si': 'し', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'ta': 'た', 'ti': 'ち', 'chi': 'ち', 'tu': 'つ', 'tsu': 'つ', 'te': 'て', 'to': 'と',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wo': 'を', 'nn': 'ん',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'za': 'ざ', 'zi': 'じ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'da': 'だ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  '-': 'ー',
};

export function romajiToHiragana(input: string): string {
  let result = '';
  let i = 0;
  const lower = input.toLowerCase();

  while (i < lower.length) {
    let found = false;

    if (i < lower.length - 1 && lower[i] === lower[i + 1] && 'kstpgdbzcjfhmr'.includes(lower[i])) {
      result += 'っ';
      i++;
      continue;
    }

    for (let len = Math.min(4, lower.length - i); len > 0; len--) {
      const substr = lower.substring(i, i + len);
      if (ROMAJI_TO_HIRAGANA[substr]) {
        result += ROMAJI_TO_HIRAGANA[substr];
        i += len;
        found = true;
        break;
      }
    }

    if (!found && lower[i] === 'n') {
      const next = lower[i + 1];
      const nCombos = ['na', 'ni', 'nu', 'ne', 'no', 'ny'];
      const isNComboPossible = next && nCombos.some(c => c.startsWith('n' + next));

      if (next === 'n') {
        result += 'ん';
        i += 2;
        found = true;
      } else if (next && !isNComboPossible && !'aiueoy'.includes(next)) {
        result += 'ん';
        i++;
        found = true;
      }
    }

    if (!found) {
      result += lower[i];
      i++;
    }
  }

  return result;
}

export function containsKanji(str: string): boolean {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(str);
}

export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0x60);
  });
}

/** Compare a user answer against a kana reading (hiragana or katakana). */
export function matchesKanaReading(answer: string, reading: string): boolean {
  const cleanAnswer = answer.replace(/[.\s\-～〜]/g, '').toLowerCase();
  const cleanReading = reading.replace(/[.\s\-～〜]/g, '').toLowerCase();
  const hiraganaReading = katakanaToHiragana(cleanReading);

  if (cleanReading === cleanAnswer || hiraganaReading === cleanAnswer) return true;

  // Allow trailing single-n for ん
  if (hiraganaReading.endsWith('ん')) {
    const base = hiraganaReading.slice(0, -1);
    if (cleanAnswer.endsWith('n') && cleanAnswer.slice(0, -1) === base) return true;
    if (cleanAnswer.endsWith('ん') && cleanAnswer.slice(0, -1) === base) return true;
  }

  return false;
}

/** Compare a user answer against a romaji reading (used in kana lessons). */
export function matchesRomajiReading(answer: string, reading: string): boolean {
  const cleanAnswer = answer.toLowerCase().trim();
  const cleanReading = reading.toLowerCase().trim();

  if (cleanReading === cleanAnswer) return true;

  if (cleanReading.endsWith('nn') && cleanAnswer.endsWith('n')) {
    return cleanReading.slice(0, -2) === cleanAnswer.slice(0, -1);
  }
  if (cleanReading.endsWith('n') && cleanAnswer.endsWith('nn')) {
    return cleanReading.slice(0, -1) === cleanAnswer.slice(0, -2);
  }

  return false;
}
