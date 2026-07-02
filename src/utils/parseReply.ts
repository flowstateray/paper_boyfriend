export interface ParsedReply {
  text: string;
  imagePrompt: string | null;
}

export const parseReply = (reply: string): ParsedReply => {
  const imageMatch = reply.match(/\[IMAGE:\s*(.+?)\]/);
  const textContent = reply.replace(/\[IMAGE:\s*.+?\]/g, '').trim();
  return {
    text: textContent,
    imagePrompt: imageMatch ? imageMatch[1] : null,
  };
};