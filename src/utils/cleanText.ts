export const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/\[IMAGE:\s*.+?\]/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[「」『』]/g, '')
    .trim();
};