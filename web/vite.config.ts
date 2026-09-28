import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 상대경로로 빼 둔다. 버셀 루트 배포와 깃허브 페이지 하위 경로 모두에서 그대로 뜬다.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', assetsDir: 'assets' },
});
