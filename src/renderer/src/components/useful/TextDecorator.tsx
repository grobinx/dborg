import { styled, Typography } from "@mui/material";

/* 1) Gradient (subtelny i nowoczesny) */
const GradientText = styled('span')(({ theme }) => ({
  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  fontWeight: 800,
  letterSpacing: '0.08em',
}));

/* 2) Neon (mocna poświata) */
const NeonText = styled('span')(({ }) => ({
  color: '#51A2FF',
  textShadow: `
    0 0 2px #51A2FF,
    0 0 6px #51A2FF,
    0 0 12px #155DFC,
    0 0 24px #155DFC
  `,
  fontWeight: 700,
  letterSpacing: '0.06em',
}));

/* 3) 3D/Extrude (warstwowy cień) */
const ExtrudedText = styled('span')(({ theme }) => ({
  color: theme.palette.grey[50],
  textShadow: Array.from({ length: 10 }, (_, i) =>
    `${i + 1}px ${i + 1}px 0 ${theme.palette.grey[800]}`
  ).join(','),
  fontWeight: 900,
  letterSpacing: '0.08em',
}));

/* 4) Shine/Sweep (animowany „połysk”) */
const ShineText = styled('span')(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  overflow: 'hidden',
  background: `linear-gradient(90deg, ${theme.palette.text.primary}, ${theme.palette.text.primary})`,
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  fontWeight: 800,
  letterSpacing: '0.08em',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-150%',
    width: '50%',
    height: '100%',
    background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
    animation: 'shine 2.2s ease-in-out infinite',
  },
  '@keyframes shine': {
    '0%': { left: '-150%' },
    '60%': { left: '150%' },
    '100%': { left: '150%' },
  },
}));

/* 5) Glitch (cyber vibe) */
const GlitchText = styled('span')(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  color: theme.palette.text.primary,
  fontWeight: 800,
  letterSpacing: '0.08em',
  '&::before, &::after': {
    content: 'attr(data-text)',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  '&::before': {
    color: '#f00',
    transform: 'translate(2px, 0)',
    mixBlendMode: 'screen',
    animation: 'glitch 2s infinite linear alternate-reverse',
  },
  '&::after': {
    color: '#0ff',
    transform: 'translate(-2px, 0)',
    mixBlendMode: 'screen',
    animation: 'glitch 1.8s infinite linear alternate-reverse',
  },
  '@keyframes glitch': {
    '0%': { clipPath: 'inset(0 0 85% 0)' },
    '10%': { clipPath: 'inset(0 0 40% 0)' },
    '20%': { clipPath: 'inset(0 0 70% 0)' },
    '30%': { clipPath: 'inset(0 0 30% 0)' },
    '40%': { clipPath: 'inset(0 0 60% 0)' },
    '50%': { clipPath: 'inset(0 0 20% 0)' },
    '60%': { clipPath: 'inset(0 0 80% 0)' },
    '70%': { clipPath: 'inset(0 0 10% 0)' },
    '80%': { clipPath: 'inset(0 0 50% 0)' },
    '90%': { clipPath: 'inset(0 0 30% 0)' },
    '100%': { clipPath: 'inset(0 0 90% 0)' },
  },
}));

/* 6) Stroke (kontur bez wypełnienia) */
const StrokeText = styled('span')(({ theme }) => ({
  color: 'transparent',
  WebkitTextStroke: `2px ${theme.palette.text.primary}`,
  fontWeight: 800,
  letterSpacing: '0.08em',
}));

/* 7) Rainbow (animowany gradient tęczowy) */
const RainbowText = styled('span')(() => ({
  background:
    'linear-gradient(90deg, #ff6b6b, #f8e71c, #7ed321, #50e3c2, #4a90e2, #bd10e0, #ff6b6b)',
  backgroundSize: '400% 100%',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  animation: 'rainbow-shift 6s linear infinite',
  fontWeight: 800,
  letterSpacing: '0.08em',
  '@keyframes rainbow-shift': {
    '0%': { backgroundPosition: '0% 50%' },
    '100%': { backgroundPosition: '100% 50%' },
  },
}));

/* 8) Metallic (efekt szczotkowanego metalu) */
const MetallicText = styled('span')(() => ({
  background:
    'linear-gradient(90deg, #bbb, #eee 25%, #bbb 50%, #eee 75%, #bbb)',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  textShadow: `
    0 1px 0 rgba(255,255,255,0.3),
    0 -1px 0 rgba(0,0,0,0.2)
  `,
  fontWeight: 900,
  letterSpacing: '0.08em',
  animation: 'metal-shift 5s ease-in-out infinite',
  '@keyframes metal-shift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

/* 9) Embossed (wytłoczenie) */
const EmbossedText = styled('span')(({ theme }) => ({
  color: theme.palette.text.primary,
  textShadow: `
    1px 1px 0 rgba(0,0,0,0.35),
   -1px -1px 0 rgba(255,255,255,0.6)
  `,
  fontWeight: 800,
  letterSpacing: '0.06em',
}));

/* 10) Underline (gradientowa kreska pod tekstem) */
const UnderlineText = styled('span')(({ theme }) => ({
  background: `linear-gradient(0deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.main} 0.18em, transparent 0.18em)`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '0 100%',
  paddingBottom: '0.05em',
  color: theme.palette.text.primary,
  fontWeight: 800,
  letterSpacing: '0.06em',
}));

/* 11) Flicker (migający neon) */
const FlickerText = styled('span')(({ theme }) => ({
  color: theme.palette.warning.main,
  textShadow: `
    0 0 6px ${theme.palette.warning.main},
    0 0 16px ${theme.palette.warning.light}
  `,
  animation: 'flicker 2.5s infinite step-end',
  '@keyframes flicker': {
    '0%': { opacity: 1 },
    '5%': { opacity: 0.4 },
    '10%': { opacity: 1 },
    '15%': { opacity: 0.2 },
    '20%': { opacity: 1 },
    '30%': { opacity: 0.8 },
    '100%': { opacity: 1 },
  },
  fontWeight: 700,
  letterSpacing: '0.06em',
}));

/* 12) RetroShadow (kolorowy cień kaskadowy) */
const RetroShadowText = styled('span')(({ theme }) => ({
  color: theme.palette.secondary.contrastText,
  textShadow: `
    1px 1px 0 #e91e63,
    2px 2px 0 #9c27b0,
    3px 3px 0 #3f51b5,
    4px 4px 0 #2196f3,
    5px 5px 0 #00bcd4
  `,
  fontWeight: 900,
  letterSpacing: '0.08em',
}));

/* 13) Fire (płonący tekst) */
const FireText = styled('span')(({ }) => ({
  color: '#ff4500',
  textShadow: `
    0 0 10px #ff4500,
    0 0 20px #ff8c00,
    0 0 30px #ffa500,
    0 0 40px #ff6347,
    0 0 70px #ff4500,
    0 0 80px #ff8c00,
    0 0 100px #ffa500
  `,
  animation: 'fire-flicker 1.5s ease-in-out infinite alternate',
  fontWeight: 800,
  letterSpacing: '0.08em',
  '@keyframes fire-flicker': {
    '0%': {
      textShadow: `
        0 0 10px #ff4500,
        0 0 20px #ff8c00,
        0 0 30px #ffa500
      `,
    },
    '50%': {
      textShadow: `
        0 0 20px #ff6347,
        0 0 30px #ff4500,
        0 0 40px #ff8c00,
        0 0 50px #ffa500
      `,
    },
    '100%': {
      textShadow: `
        0 0 15px #ff4500,
        0 0 25px #ff8c00,
        0 0 35px #ffa500,
        0 0 45px #ff6347
      `,
    },
  },
}));

/* 14) Outline (podwójny kontur) */
const OutlineText = styled('span')(({ theme }) => ({
  color: theme.palette.background.paper,
  textShadow: `
    -2px -2px 0 ${theme.palette.primary.main},
     2px -2px 0 ${theme.palette.primary.main},
    -2px  2px 0 ${theme.palette.primary.main},
     2px  2px 0 ${theme.palette.primary.main},
    -3px -3px 0 ${theme.palette.secondary.main},
     3px -3px 0 ${theme.palette.secondary.main},
    -3px  3px 0 ${theme.palette.secondary.main},
     3px  3px 0 ${theme.palette.secondary.main}
  `,
  fontWeight: 900,
  letterSpacing: '0.08em',
}));

/* 15) Wave (falujący tekst) */
const WaveText = styled('span')(() => ({
  display: 'inline-block',
  fontWeight: 800,
  letterSpacing: '0.08em',
  '& > span': {
    display: 'inline-block',
    animation: 'wave 1.2s ease-in-out infinite',
  },
  '& > span:nth-of-type(1)': { animationDelay: '0s' },
  '& > span:nth-of-type(2)': { animationDelay: '0.1s' },
  '& > span:nth-of-type(3)': { animationDelay: '0.2s' },
  '& > span:nth-of-type(4)': { animationDelay: '0.3s' },
  '& > span:nth-of-type(5)': { animationDelay: '0.4s' },
  '& > span:nth-of-type(6)': { animationDelay: '0.5s' },
  '@keyframes wave': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-15px)' },
  },
}));

/* 16) Pixelated (efekt pixelart) */
const PixelatedText = styled('span')(({ theme }) => ({
  fontFamily: 'monospace',
  color: theme.palette.success.main,
  textShadow: `
    2px 0 0 ${theme.palette.success.dark},
    -2px 0 0 ${theme.palette.success.dark},
    0 2px 0 ${theme.palette.success.dark},
    0 -2px 0 ${theme.palette.success.dark},
    2px 2px 0 ${theme.palette.success.light}
  `,
  fontWeight: 700,
  letterSpacing: '0.12em',
  imageRendering: 'pixelated',
}));

/* 17) Liquid (ciekły metal) */
const LiquidText = styled('span')(() => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
  backgroundSize: '300% 300%',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  animation: 'liquid-flow 4s ease infinite',
  fontWeight: 800,
  letterSpacing: '0.08em',
  '@keyframes liquid-flow': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

/* 18) Pulse (pulsujący tekst) */
const PulseText = styled('span')(({ theme }) => ({
  color: theme.palette.error.main,
  animation: 'pulse 1.5s ease-in-out infinite',
  fontWeight: 800,
  letterSpacing: '0.08em',
  '@keyframes pulse': {
    '0%, 100%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '50%': {
      transform: 'scale(1.05)',
      opacity: 0.8,
    },
  },
}));

/* 19) Hologram (holograficzny efekt) */
const HologramText = styled('span')(() => ({
  background: 'linear-gradient(90deg, #00ffff, #00ff00, #00ffff)',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
  animation: 'hologram-scan 3s linear infinite',
  fontWeight: 700,
  letterSpacing: '0.1em',
  opacity: 0.85,
  '@keyframes hologram-scan': {
    '0%': {
      backgroundPosition: '0% 50%',
      opacity: 0.7,
    },
    '50%': {
      backgroundPosition: '100% 50%',
      opacity: 1,
    },
    '100%': {
      backgroundPosition: '0% 50%',
      opacity: 0.7,
    },
  },
}));

/* 20) Chromatic (aberracja chromatyczna) */
const ChromaticText = styled('span')(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  color: theme.palette.text.primary,
  fontWeight: 800,
  letterSpacing: '0.08em',
  '&::before, &::after': {
    content: 'attr(data-text)',
    position: 'absolute',
    left: 0,
    top: 0,
    mixBlendMode: 'screen',
  },
  '&::before': {
    color: '#ff00ff',
    transform: 'translate(-2px, 0)',
  },
  '&::after': {
    color: '#00ffff',
    transform: 'translate(2px, 0)',
  },
}));

const TextDecoratorVariants: Record<
  | 'GradientText'
  | 'NeonText'
  | 'ExtrudedText'
  | 'ShineText'
  | 'GlitchText'
  | 'StrokeText'
  | 'RainbowText'
  | 'MetallicText'
  | 'EmbossedText'
  | 'UnderlineText'
  | 'FlickerText'
  | 'RetroShadowText'
  | 'FireText'
  | 'OutlineText'
  | 'WaveText'
  | 'PixelatedText'
  | 'LiquidText'
  | 'PulseText'
  | 'HologramText'
  | 'ChromaticText',
  React.ComponentType<{ children?: React.ReactNode }>
> = {
  GradientText,
  NeonText,
  ExtrudedText,
  ShineText,
  GlitchText,
  StrokeText,
  RainbowText,
  MetallicText,
  EmbossedText,
  UnderlineText,
  FlickerText,
  RetroShadowText,
  FireText,
  OutlineText,
  WaveText,
  PixelatedText,
  LiquidText,
  PulseText,
  HologramText,
  ChromaticText,
};

export const TextDecorator: React.FC<{
  variant: keyof typeof TextDecoratorVariants;
  children: React.ReactNode;
}> = ({ variant, children }) => {
  const TextComponent = TextDecoratorVariants[variant];
  return <TextComponent>{children}</TextComponent>;
};
