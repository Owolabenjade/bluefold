import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { BluefoldSystem } from './bluefold/game.js';
import { PanelSystem } from './panel.js';

World.create(
  document.getElementById('scene-container') as HTMLDivElement,
  projectOptions,
).then((world) => {
  world.registerSystem(BluefoldSystem);
  world.registerSystem(PanelSystem);
});
