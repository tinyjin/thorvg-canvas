import { setGlobalErrorHandler } from './common/errors';
import * as constants from './common/constants';
import { getNative } from './native/binding';
import { Accessor } from './core/Accessor';
import { Animation } from './core/Animation';
import { Canvas } from './core/Canvas';
import { ConicGradient } from './core/ConicGradient';
import { Font } from './core/Font';
import { LinearGradient } from './core/LinearGradient';
import { LottieAnimation } from './core/LottieAnimation';
import { Paint } from './core/Paint';
import { Picture } from './core/Picture';
import { RadialGradient } from './core/RadialGradient';
import { Scene } from './core/Scene';
import { Shape } from './core/Shape';
import { Text } from './core/Text';

export const classes = {
  Paint,
  Canvas,
  Shape,
  Scene,
  Picture,
  Text,
  Animation,
  LottieAnimation,
  LinearGradient,
  RadialGradient,
  ConicGradient,
  Font,
  Accessor,
};

export function createNamespace(onTerm: () => void) {
  return {
    ...classes,
    BlendMethod: constants.BlendMethod,
    StrokeCap: constants.StrokeCap,
    StrokeJoin: constants.StrokeJoin,
    FillRule: constants.FillRule,
    PathCommand: constants.PathCommand,
    GradientSpread: constants.GradientSpread,
    MaskMethod: constants.MaskMethod,
    SceneEffect: constants.SceneEffect,
    TextWrapMode: constants.TextWrapMode,
    ColorSpace: constants.ColorSpace,
    FilterMethod: constants.FilterMethod,
    EngineOption: constants.EngineOption,
    version: getNative().version,
    term: () => {
      setGlobalErrorHandler(undefined);
      onTerm();
    },
  };
}

export type NamespaceImpl = ReturnType<typeof createNamespace>;
