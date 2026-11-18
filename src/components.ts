import { defineComponents } from '@iwsdk/core';
import {
  ClampTool,
  ClothSurface,
  FoldHandle,
  LiftLoop,
  UnfoldTab,
} from './bluefold/components.js';

export default defineComponents([FoldHandle, LiftLoop, UnfoldTab, ClothSurface, ClampTool]);
