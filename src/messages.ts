// Messages shown in the panel are written in both languages and picked by the panel.
// The plugin code does not know the panel language, so a message carries both: "ja\u0001en".

const SEP = '\u0001';

export const bi = (ja: string, en: string): string => `${ja}${SEP}${en}`;

export function pick(message: string, ja: boolean): string {
  const [j, e] = message.split(SEP);
  return ja ? j : (e ?? j);
}
