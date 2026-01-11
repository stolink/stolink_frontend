#!/bin/bash
# stolink 공통 컴포넌트 패키지 생성 스크립트

set -e

SHARED_DIR="../stolink-shared"

echo "🚀 Creating Stolink shared components package..."

# 1. 디렉토리 생성
mkdir -p $SHARED_DIR/src/components/graph
mkdir -p $SHARED_DIR/src/types
mkdir -p $SHARED_DIR/src/hooks

# 2. package.json 생성
cat > $SHARED_DIR/package.json << 'EOF'
{
  "name": "@stolink/shared",
  "version": "1.0.0",
  "description": "Shared components between Stolink platforms",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "d3": "^7.9.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/d3": "^7.4.3",
    "typescript": "^5.0.0"
  }
}
EOF

# 3. tsconfig.json 생성
cat > $SHARED_DIR/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 4. 파일 복사
echo "📦 Copying files..."
cp src/components/graph/NetworkGraph.tsx $SHARED_DIR/src/components/graph/
cp src/types/publish.ts $SHARED_DIR/src/types/graph.ts

# 5. index.ts 생성
cat > $SHARED_DIR/src/index.ts << 'EOF'
// Components
export { default as NetworkGraph } from './components/graph/NetworkGraph';

// Types
export type {
  GraphNode,
  GraphLink,
  ProfileSnapshot,
} from './types/graph';
EOF

# 6. README 생성
cat > $SHARED_DIR/README.md << 'EOF'
# @stolink/shared

Stolink 플랫폼 간 공유 컴포넌트 패키지

## 설치

```bash
npm install @stolink/shared
```

## 사용

```tsx
import { NetworkGraph } from '@stolink/shared';

<NetworkGraph
  nodes={graphData.nodes}
  links={graphData.links}
  width={800}
  height={600}
/>
```
EOF

echo "✅ Shared package created at: $SHARED_DIR"
echo ""
echo "Next steps:"
echo "1. cd $SHARED_DIR && npm install"
echo "2. npm run build"
echo "3. In stolink_frontend: npm install $SHARED_DIR"
echo "4. In storead_frontend: npm install $SHARED_DIR"
