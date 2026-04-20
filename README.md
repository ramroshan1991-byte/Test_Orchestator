# Test_Orchestator

A comprehensive test orchestration platform with AI capabilities for automated test generation, management, and execution.

## 🚀 Features

- **AI-Powered Test Generation**: Generate test cases using AI (LLM integration)
- **Test Case Management**: Create, organize, and manage test cases
- **Test Plan Generation**: Automatically generate test plans from requirements
- **Code Generation**: Generate code snippets and test frameworks
- **Jira Integration**: Connect with Jira for issue tracking and test case management
- **Multiple Implementations**: Available in React (Vite), Next.js, and Express.js backends
- **Export Capabilities**: Export test cases and plans in multiple formats
- **Custom Prompts**: Support for custom AI prompts and templates

## 📁 Project Structure

```
Test_Orchestator/
├── backend/              # Node.js/Express backend server
│   ├── src/
│   │   ├── controllers/  # API endpoint handlers
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   └── server.js     # Main server file
│   ├── package.json
│   └── .env.example
│
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context for state management
│   │   ├── store/        # State management
│   │   └── utils/        # Utility functions
│   ├── package.json
│   └── vite.config.js
│
├── nextjs/               # Next.js alternative implementation
│   ├── src/
│   │   ├── app/          # Next.js app directory
│   │   │   ├── api/      # API routes
│   │   │   └── pages/    # Pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utility libraries
│   ├── package.json
│   └── next.config.js
│
└── Templates/            # Prompt templates and configurations
    ├── prompt.md
    ├── testPlan_template_clean.md
    └── CustomTestCaseGenerator.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Environment Configuration** - dotenv for configuration management

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management

### Alternative Frontend
- **Next.js** - Full-stack React framework with built-in API routes
- **TypeScript** - Type safety
- **Vercel** - Deployment ready

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- GitHub account (for Jira integration)
- AI Provider access (OpenAI, Anthropic, or compatible LLM)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ramroshan1991-byte/Test_Orchestator.git
cd Test_Orchestator
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm start
```

### 3. Frontend Setup (Choose one)

#### Option A: React + Vite
```bash
cd frontend
npm install
npm run dev
```

#### Option B: Next.js
```bash
cd nextjs
npm install
npm run dev
```

The application will be available at:
- React Frontend: http://localhost:5173
- Next.js Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## 🔧 Configuration

Create a `.env` file in the backend directory:

```env
PORT=4000
NODE_ENV=development

# AI Provider Configuration
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Jira Integration
JIRA_HOST=your_jira_instance.atlassian.net
JIRA_USERNAME=your_username
JIRA_API_TOKEN=your_api_token

# Database (if applicable)
DATABASE_URL=your_database_url
```

## 📚 Available Endpoints

### Test Plans
- `POST /api/test-plans/generate` - Generate test plans
- `GET /api/test-plans` - Retrieve test plans
- `PUT /api/test-plans/:id` - Update test plan
- `DELETE /api/test-plans/:id` - Delete test plan

### Test Cases
- `POST /api/test-cases/generate` - Generate test cases
- `GET /api/test-cases` - Retrieve test cases
- `PUT /api/test-cases/:id` - Update test case
- `DELETE /api/test-cases/:id` - Delete test case

### Code Generation
- `POST /api/code-generator/generate` - Generate code

### AI Providers
- `GET /api/ai/providers-status` - Check AI provider status

### Jira Integration
- `GET /api/jira/stories` - Fetch Jira stories
- `GET /api/jira/issue/:issueKey` - Get specific issue details

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### React Frontend
```bash
cd frontend
npm run build
# Serve the dist folder
```

### Next.js
```bash
cd nextjs
npm run build
npm start
```

## 🚀 Deployment

### Deploy to Vercel (Next.js)
```bash
vercel
```

### Deploy Backend to Heroku
```bash
heroku create your-app-name
git push heroku main
```

## 📝 Templates & Prompts

The `Templates/` directory contains:
- Custom prompt templates for test generation
- Test plan templates
- Test case generation templates
- AI system prompts

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m 'Add your feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Check existing issues for solutions
- Review the Templates directory for usage examples

## 🎯 Roadmap

- [ ] Enhanced AI model support
- [ ] Real-time test execution monitoring
- [ ] Advanced reporting and analytics
- [ ] Team collaboration features
- [ ] Mobile application
- [ ] Docker containerization
- [ ] Kubernetes support

---

**Last Updated**: April 2026
**Repository**: https://github.com/ramroshan1991-byte/Test_Orchestator
