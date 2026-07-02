export interface ParsedReply {
  text: string;
  imagePrompt: string | null;
}

const IMAGE_KEYWORDS = ['照片', '图片', '自拍', '发张', '发一张', '拍一张', '看起来', '穿着', '在做', '场景'];

export const parseReply = (reply: string): ParsedReply => {
  const imageMatch = reply.match(/\[IMAGE:\s*(.+?)\]/);
  
  if (imageMatch) {
    const textContent = reply.replace(/\[IMAGE:\s*.+?\]/g, '').trim();
    return {
      text: textContent,
      imagePrompt: imageMatch[1],
    };
  }

  const hasImageKeyword = IMAGE_KEYWORDS.some(keyword => reply.includes(keyword));
  if (hasImageKeyword && reply.length > 10) {
    const sceneMatch = reply.match(/(穿着[^。，！？]*|在做[^。，！？]*|场景[^。，！？]*|照片[^。，！？]*|图片[^。，！？]*)/);
    if (sceneMatch) {
      return {
        text: reply.trim(),
        imagePrompt: sceneMatch[1].replace(/照片|图片/g, '').trim(),
      };
    }
  }

  return {
    text: reply.trim(),
    imagePrompt: null,
  };
};