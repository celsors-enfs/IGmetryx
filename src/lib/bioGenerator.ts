// Bio generation logic
export const generateBios = (
  whatYouDo: string,
  whoYouHelp: string,
  differentiator: string
): string[] => {
  const bios: string[] = [];
  
  // Bio 1: Simple and direct
  bios.push(
    `${whatYouDo} | Helping ${whoYouHelp} ${differentiator ? `| ${differentiator}` : ''}`
  );
  
  // Bio 2: With emojis
  bios.push(
    `✨ ${whatYouDo}\n💡 Helping ${whoYouHelp}\n${differentiator ? `🌟 ${differentiator}` : ''}`
  );
  
  // Bio 3: Question format
  bios.push(
    `${whatYouDo}?\n\nI help ${whoYouHelp} ${differentiator ? `by ${differentiator.toLowerCase()}` : 'achieve their goals'}.\n\nLet's connect! 👇`
  );
  
  // Bio 4: Value-focused
  bios.push(
    `📍 ${whatYouDo}\n\nI specialize in helping ${whoYouHelp}.\n${differentiator ? `\nWhat sets me apart: ${differentiator}` : ''}\n\nDM for collaborations 💌`
  );
  
  // Bio 5: Story format
  bios.push(
    `${whatYouDo} | ${differentiator || 'Passionate about helping others'}\n\nI work with ${whoYouHelp} to create meaningful results.\n\n📧 Let's talk!`
  );
  
  return bios;
};

export const generateCTALines = (): string[] => {
  return [
    'Link in bio 👆',
    'Check out my latest post 👇',
    'New content every week!',
    'Follow for daily tips',
    'DM for inquiries',
    'Swipe up for more',
    'Tap the link below',
    'Visit my website',
    'Book a consultation',
    'Join my community'
  ];
};





