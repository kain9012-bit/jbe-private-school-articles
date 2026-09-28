// lucide-react 를 npm 에서 받으면 타입 선언(dist/lucide-react.d.ts)이 빠져 오는 일이 있다.
// 아이콘은 그냥 컴포넌트라 실제 동작에는 지장이 없고, 빌드(vite)도 통과한다.
// tsc --noEmit 만 막히므로 여기서 모듈만 선언해 둔다.
declare module 'lucide-react';
