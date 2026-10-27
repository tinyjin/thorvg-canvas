// Generated from @thorvg/webcanvas@1.1.3 by scripts/generate-constants.mjs. Do not edit.

export const WEBCANVAS_VERSION = '1.1.3';

export enum BlendMethod {
  Normal = 0,
  Multiply = 1,
  Screen = 2,
  Overlay = 3,
  Darken = 4,
  Lighten = 5,
  ColorDodge = 6,
  ColorBurn = 7,
  HardLight = 8,
  SoftLight = 9,
  Difference = 10,
  Exclusion = 11,
  Hue = 12,
  Saturation = 13,
  Color = 14,
  Luminosity = 15,
  Add = 16,
  Composition = 255,
}

export enum StrokeCap {
  Butt = 0,
  Round = 1,
  Square = 2,
}

export enum StrokeJoin {
  Miter = 0,
  Round = 1,
  Bevel = 2,
}

export enum FillRule {
  Winding = 0,
  EvenOdd = 1,
}

export enum PathCommand {
  Close = 0,
  MoveTo = 1,
  LineTo = 2,
  CubicTo = 3,
}

export enum GradientSpread {
  Pad = 0,
  Reflect = 1,
  Repeat = 2,
}

export enum MaskMethod {
  None = 0,
  Alpha = 1,
  InvAlpha = 2,
  Luma = 3,
  InvLuma = 4,
  Add = 5,
  Subtract = 6,
  Intersect = 7,
  Difference = 8,
  Lighten = 9,
  Darken = 10,
}

export enum EngineOption {
  None = 0,
  Default = 1,
  SmartRender = 2,
}

export enum SceneEffect {
  ClearAll = 0,
  GaussianBlur = 1,
  DropShadow = 2,
  Fill = 3,
  Tint = 4,
  Tritone = 5,
  MotionBlur = 6,
}

export enum TextWrapMode {
  None = 0,
  Character = 1,
  Word = 2,
  Smart = 3,
  Ellipsis = 4,
}

export enum ColorSpace {
  ABGR8888 = 0,
  ARGB8888 = 1,
  ABGR8888S = 2,
  ARGB8888S = 3,
  Grayscale8 = 4,
  Unknown = 255,
}

export enum FilterMethod {
  Bilinear = 0,
  Nearest = 1,
}

export enum ThorVGResultCode {
  Success = 0,
  InvalidArguments = 1,
  InsufficientCondition = 2,
  FailedAllocation = 3,
  MemoryCorruption = 4,
  NotSupported = 5,
  SystemError = 6,
  Unknown = 255,
}
