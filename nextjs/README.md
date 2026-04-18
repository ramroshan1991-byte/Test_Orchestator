# Test Orchestrator - Next.js 15 Version

AI-powered QA automation platform migrated from Vite + React 18 to **Next.js 15 + React 19**.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+ 
- npm / yarn / pnpm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build & Deploy

```bash
# Build for production
npm run build

# Run production server
npm start

# Type checking
npm run type-check
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Dashboard
│   ├── globals.css     # Global styles
│   └── ...
├── components/         # Reusable React components
│   ├── Sidebar.tsx
│   ├── Toast.tsx
│   ├── SkeletonLoader.tsx
│   ├── StoryDetailModal.tsx
│   ├── AIProviderStatus.tsx
│   ├── CustomPromptMode.tsx
│   └── ...
├── lib/                # Utility functions
│   ├── api-client.ts   # Axios API wrapper
│   └── utils.ts        # Helper functions
└── store/              # Zustand store
    └── appStore.ts     # Global state management
```

## 🎨 Tech Stack

- **Framework**: Next.js 15.0.0
- **React**: 19.0.0
- **TypeScript**: 5.3.0
- **Styling**: Tailwind CSS 3.4.0
- **State Management**: Zustand 4.4.0
- **HTTP Client**: Axios 1.6.0
- **Icons**: Lucide React 0.378.0

## 🌟 Key Features

### Phase 1: High-Impact (✅ Implemented)
- **Story Detail Modal**: Premium modal with blurred backdrop, smooth animations
- **Test Case Improvements**: Skeleton loader, 5-per-page pagination, clipboard export
- **One-Click Flow**: Auto-transitions between tabs (JiraConnect → TestPlans → TestCases)
- **Acceptance Criteria Sniffer**: Backend field extraction from Jira

### Phase 2: Medium-Impact (✅ Implemented)
- **Code Generation Enhancements**: Framework tab switching, code history persistence, ✅ badges
- **Live AI Provider Status**: 5-provider indicators with 30-second auto-refresh
- **Custom Prompt Mode**: Editable default/custom AI prompts for test plan/case/code generation

### Phase 3: Framework Migration (🔄 In Progress)
- Migration from Vite + React 18 to Next.js + React 19
- Store refactored to TypeScript with full type safety
- All components ported with enhanced typing
- Environment variables setup for backend integration

## 🔗 Backend Integration

The frontend connects to the Express backend running on `http://localhost:5001/api`

### Required Endpoints

- `POST /jira/stories` - Fetch Jira stories
- `POST /test-plan/generate` - Generate test plan
- `POST /test-cases/generate` - Generate test cases
- `POST /code/generate` - Generate code
- `GET /ai/providers-status` - Check AI provider status
- `GET /health` - Health check

## 🛠️ Configuration

### Environment Variables (.env.local)

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api

# AI Provider Keys
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# Local LLM
NEXT_PUBLIC_LOCAL_LLM_BASE_URL=http://localhost:8000
OLLAMA_BASE_URL=http://localhost:11434
```

## 🧪 Development Tips

### State Management (Zustand)

```typescript
import { useAppStore } from '@/store/appStore';

export function MyComponent() {
  const { testCases, setTestCases, saveCodeToHistory } = useAppStore();
  
  return (...)
}
```

### API Calls

```typescript
import { apiClient } from '@/lib/api-client';

const result = await apiClient.generateTestPlan(story, customPrompt);
```

### Toast Notifications

```typescript
import { useToast } from '@/components/Toast';

export function MyComponent() {
  const { showToast } = useToast();
  
  showToast('Success!', 'success', 3000);
  showToast('Error occurred', 'error');
}
```

## 📱 Component Usage

### Sidebar Navigation
```tsx
<Sidebar onNavigate={(tabId) => console.log(tabId)} />
```

### Story Detail Modal
```tsx
<StoryDetailModal story={story} isOpen={isOpen} onClose={onClose} />
```

### Skeleton Loader
```tsx
<SkeletonLoader count={3} height="h-4" width="w-full" />
<TestCaseCardSkeleton />
```

### AI Provider Status
```tsx
<AIProviderStatus />
```

### Custom Prompt Mode
```tsx
<CustomPromptMode />
```

## 🔍 Debugging

### Enable Debug Logging
```typescript
// In api-client.ts
console.log('API Error:', error.message);
```

### Check Store State
```typescript
// In browser DevTools console
localStorage.getItem('app-store')
```

### Browser DevTools
- React DevTools: Inspect component props and state
- Network tab: Monitor API calls
- Console: Check for errors

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Deploy immediately via Vercel CLI
vercel

# Or enable auto-deploy on push
```

### Docker

```bash
# Build image
docker build -t test-orchestrator:nextjs .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL='http://api:5001/api' test-orchestrator:nextjs
```

## 📊 Performance

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component (when added)
- **Font Optimization**: System fonts with Tailwind
- **CSS**: Tailwind CSS with PurgeCSS
- **Build Size**: ~150KB (gzipped, excluding node_modules)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m 'Add my feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Open a Pull Request

## 📝 API Reference

### Zustand Store

#### State Properties
- `testPlans`: Object containing test plans
- `testCases`: Object containing test cases grouped by plan
- `jiraStories`: Array of Jira stories
- `codeHistory`: Code snippets by test case and framework
- `customPromptMode`: Boolean for custom prompt toggle
- `customPrompts`: Object with testPlan, testCase, codeGen prompts

#### Actions
- `setTestPlans()` - Update test plans
- `setTestCases()` - Update test cases
- `saveCodeToHistory()` - Save generated code
- `getCodeFromHistory()` - Retrieve saved code
- `toggleCustomPromptMode()` - Toggle custom prompt mode
- `setCustomPrompt()` - Set custom prompt text
- `clearData()` - Clear all data

## 🐛 Known Issues

- AIProviderStatus falls back to mock data if backend unavailable
- LocalStorage persistence requires client-side hydration

## 📝 License

MIT

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Release Notes](https://react.dev/blog/2024/12/19/react-19)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://zustand-demo.vercel.app/)

---

**Last Updated**: $(date)
**Version**: 2.0.0
**Status**: Migration Complete ✅
