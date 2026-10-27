import type * as WebCanvas from '@thorvg/webcanvas';
import type { Accessor } from '../src/core/Accessor';
import type { Animation } from '../src/core/Animation';
import type { Canvas } from '../src/core/Canvas';
import type { ConicGradient } from '../src/core/ConicGradient';
import type { Font } from '../src/core/Font';
import type { LinearGradient } from '../src/core/LinearGradient';
import type { LottieAnimation } from '../src/core/LottieAnimation';
import type { Picture } from '../src/core/Picture';
import type { RadialGradient } from '../src/core/RadialGradient';
import type { Scene } from '../src/core/Scene';
import type { Shape } from '../src/core/Shape';
import type { Text } from '../src/core/Text';
import type { NamespaceImpl } from '../src/namespace';
import type { Canvas as PublicCanvas, ThorVGNamespace } from '../src/types';

type Missing<Web, Native> = Exclude<keyof Web, keyof Native>;
type Expect<T extends never> = T;

export type Parity = [
  Expect<Missing<WebCanvas.Shape, Shape>>,
  Expect<Missing<WebCanvas.Scene, Scene>>,
  Expect<Missing<WebCanvas.Picture, Picture>>,
  Expect<Missing<WebCanvas.Text, Text>>,
  Expect<Missing<WebCanvas.Animation, Animation>>,
  Expect<Missing<WebCanvas.LottieAnimation, LottieAnimation>>,
  Expect<Missing<WebCanvas.LinearGradient, LinearGradient>>,
  Expect<Missing<WebCanvas.RadialGradient, RadialGradient>>,
  Expect<Missing<WebCanvas.ConicGradient, ConicGradient>>,
  Expect<Missing<WebCanvas.Accessor, Accessor>>,
  Expect<Missing<WebCanvas.Canvas, Canvas>>,
  Expect<Missing<typeof WebCanvas.Font, typeof Font>>,
  Expect<Missing<typeof WebCanvas.Accessor, typeof Accessor>>,
  Expect<Missing<PublicCanvas, Canvas>>,
  Expect<Exclude<keyof ThorVGNamespace, keyof NamespaceImpl>>,
];
