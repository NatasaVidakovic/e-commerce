const photo = (kind: 'candle' | 'jewellery', id: number, caption: string) => ({
  image: `/brand/lumen/collections/${kind}-${id}.jpg`,
  title: `LUMEN.EDITORIAL.${caption}`,
  alt: `LUMEN.EDITORIAL.${caption}_ALT`,
});

// Collection photography from the supplied Figma export, separate from inventory.
export const LUMEN_COLLECTIONS = [
  {
    kind: 'candles',
    type: 'Mirisne svijeće',
    title: 'LUMEN.CANDLE_TITLE',
    subtitle: 'LUMEN.CANDLE_SUBTITLE',
    note: 'LUMEN.CANDLE_NOTE',
    detail: 'LUMEN.EDITORIAL.CANDLE_DETAIL',
    photos: [
      photo('candle', 1, 'QUIET_MORNINGS'),
      photo('candle', 2, 'WARMTH_OF_HOME'),
      photo('candle', 3, 'GIVEN_WITH_CARE'),
      photo('candle', 4, 'SOFT_MOMENTS'),
      photo('candle', 6, 'EVENING_GLOW'),
    ],
  },
  {
    kind: 'jewellery',
    type: 'Nakit',
    title: 'LUMEN.JEWELLERY_TITLE',
    subtitle: 'LUMEN.JEWELLERY_SUBTITLE',
    note: 'LUMEN.JEWELLERY_NOTE',
    detail: 'LUMEN.EDITORIAL.JEWELLERY_DETAIL',
    photos: [
      photo('jewellery', 1, 'YOUR_SIGNATURE'),
      photo('jewellery', 2, 'NATURAL_ELEGANCE'),
      photo('jewellery', 3, 'CLOSE_TO_YOU'),
      photo('jewellery', 4, 'NATURES_COLOUR'),
      photo('jewellery', 5, 'GOLDEN_DETAILS'),
    ],
  },
] as const;
