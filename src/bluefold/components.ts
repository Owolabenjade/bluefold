import { createComponent, Types } from '@iwsdk/core';

/** A pull tab on the cloth's edge; `slot` indexes the current fold choices. */
export const FoldHandle = createComponent('FoldHandle', {
  slot: { type: Types.Int8, default: 0 },
});

/** The raffia loop used to carry the bundle to the vat. */
export const LiftLoop = createComponent('LiftLoop', {});

/** The corner tab used to unfold the dyed cloth. */
export const UnfoldTab = createComponent('UnfoldTab', {});

/** The cloth surface, which takes ties where the player pinches. */
export const ClothSurface = createComponent('ClothSurface', {});

/** The wooden clamp block the player drops onto the bundle. */
export const ClampTool = createComponent('ClampTool', {});
