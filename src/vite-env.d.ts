/// <reference types = 'vite/client' />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module 'vue3-starry-sky';
declare module 'mark.js';

declare const __ANDROID__: boolean;
declare const __DEV__: boolean;