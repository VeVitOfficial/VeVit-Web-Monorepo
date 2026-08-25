import { createRenderer as renderer } from './renderer.mjs'; import { pollControl } from './controls/poll.mjs'; export const type='poll'; export const createRenderer=()=>renderer(type,pollControl);
