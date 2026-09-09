export interface VictoryQuote {
  title: string;
  message: string;
}

export const VICTORY_QUOTES: Record<string, VictoryQuote[]> = {
  en: [
    {
      title: 'Persevered',
      message: 'A tricky board, but you saw it through to the end!',
    },
    {
      title: 'Purr-fect Genius!',
      message: 'Your sharp feline intuition cracked this puzzle wide open!',
    },
    {
      title: 'Masterful Play!',
      message: 'Not a single whisker out of place — pure tactical brilliance!',
    },
    {
      title: 'Unstoppable!',
      message: 'You read the board like an open book. Outstanding solve!',
    },
    {
      title: 'Cat-tastic Triumph!',
      message: 'You made this look effortless. The kittens bow to your skill!',
    },
  ],
  hi: [
    {
      title: 'कमाल कर दिया!',
      message: 'मुश्किल पहेली थी, लेकिन आपने हार नहीं मानी और जीत दिखाई!',
    },
    {
      title: 'शाबाश उस्ताद!',
      message: 'बिल्लियों की तरह तेज दिमाग से आपने यह बाजी जीत ली!',
    },
    {
      title: 'लाजवाब जीत!',
      message: 'एक भी गलत कदम नहीं — यह है असली मास्टर का खेल!',
    },
    {
      title: 'अजेय खिलाड़ी!',
      message: 'पूरे बोर्ड पर आपका दबदबा रहा। अद्भुत प्रदर्शन!',
    },
    {
      title: 'शानदार उपलब्धि!',
      message: 'कठिन से कठिन चुनौती को भी आपने बहुत आसान बना दिया!',
    },
  ],
  es: [
    {
      title: '¡Perseverancia!',
      message: '¡Un tablero difícil, pero lo peleaste hasta el final!',
    },
    {
      title: '¡Mente Brillante!',
      message: '¡Tu astucia felina resolvió este misterio a la perfección!',
    },
    {
      title: '¡Jugada Maestra!',
      message: '¡Ni un solo error, dominaste el tablero como un auténtico líder!',
    },
    {
      title: '¡Imparable!',
      message: '¡Leíste la cuadrícula como nadie! Una victoria legendaria.',
    },
    {
      title: '¡Triunfo Total!',
      message: '¡Hiciste que pareciera fácil! Todos los michis celebran contigo.',
    },
  ],
  fr: [
    {
      title: 'Persévérance !',
      message: 'Un défi coriace, mais vous êtes allé jusqu’au bout !',
    },
    {
      title: 'Coup de Génie !',
      message: 'Votre intuition féline a déjoué tous les pièges du plateau !',
    },
    {
      title: 'Jeu de Maître !',
      message: 'Une précision chirurgicale, une démonstration tactique parfaite !',
    },
    {
      title: 'Inarrêtable !',
      message: 'Vous avez dompté la grille avec une classe magistrale !',
    },
    {
      title: 'Chapeau Bas !',
      message: 'Un triomphe éclatant, les petits chats sont fiers de vous !',
    },
  ],
  de: [
    {
      title: 'Durchgehalten!',
      message: 'Ein kniffliges Spielfeld, aber du hast es bis zum Ende geschafft!',
    },
    {
      title: 'Katzen-Genie!',
      message: 'Dein messerscharfer Spürsinn hat dieses Rätsel blitzschnell gelöst!',
    },
    {
      title: 'Meisterleistung!',
      message: 'Präzision auf den Punkt — das war absolute Spitzenklasse!',
    },
    {
      title: 'Unaufhaltsam!',
      message: 'Du hast das Feld perfekt gelesen und triumphierend dominiert!',
    },
    {
      title: 'Großer Sieg!',
      message: 'Du hast es mühelos aussehen lassen — königlich gelöst!',
    },
  ],
  ru: [
    {
      title: 'Непобедимый!',
      message: 'Хитрая головоломка, но ты проявил характер и победил!',
    },
    {
      title: 'Кошачий Гений!',
      message: 'Твоя острая интуиция разгадала эту тайну на высший балл!',
    },
    {
      title: 'Мастер Игры!',
      message: 'Ни единого шанса на ошибку — безупречный победный раунд!',
    },
    {
      title: 'Сквозь Преграды!',
      message: 'Ты прочитал поле как открытую книгу. Великолепная победа!',
    },
    {
      title: 'Триумф Котиков!',
      message: 'Справился играючи — все пушистики аплодируют твоему таланту!',
    },
  ],
  ja: [
    {
      title: '不屈の精神！',
      message: '難関パズルを見事な粘り強さで最後まで解き抜きました！',
    },
    {
      title: '神業クリア！',
      message: '鋭いひらめきと直感で、盤面を完全に見切りました！',
    },
    {
      title: 'パーフェクト！',
      message: '一糸乱れぬ完璧な手順、まさに名人級の妙技です！',
    },
    {
      title: '無敵の勝負師！',
      message: '次々と手が浮かぶ快進撃、圧倒的な完全勝利！',
    },
    {
      title: 'ニャンとも見事！',
      message: '鮮やかすぎる結末に、ネコちゃんたちも大感激です！',
    },
  ],
  zh: [
    {
      title: '坚持不懈！',
      message: '局势曲折复杂，你却凭借过人定力走到了最终胜利！',
    },
    {
      title: '绝妙通关！',
      message: '敏锐如猫，这一局解得干脆利落、无人能挡！',
    },
    {
      title: '大局在握！',
      message: '落子如神，全盘尽在掌控之中，尽显大师风采！',
    },
    {
      title: '势如破竹！',
      message: '势不可当的推理力，轻松攻克每一个难题关隘！',
    },
    {
      title: '猫神附体！',
      message: '举重若轻，化繁为简，所有小猫都为你欢呼雀跃！',
    },
  ],
};

export function getVictoryQuote(lang: string, levelNumber: number): VictoryQuote {
  const langKey = VICTORY_QUOTES[lang] ? lang : 'en';
  const quotes = VICTORY_QUOTES[langKey];
  const index = Math.abs(levelNumber - 1) % quotes.length;
  return quotes[index];
}
