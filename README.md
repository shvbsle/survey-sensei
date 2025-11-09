# Survey Sensei

AI-powered survey builder that adapts questions to each user's unique experience.

## Overview

Survey Sensei is a **GenAI-powered agentic survey system** that generates hyper-personalized survey questions based on user profiles, purchase history, and real-time sentiment analysis. This project showcases advanced ML/AI engineering with a focus on building production-ready agentic backend systems.

### Key Features

- **Agentic Question Generation**: LLM-powered agents dynamically create contextual survey questions
- **Semantic Search**: Vector embeddings for product recommendations and user clustering
- **Sentiment Analysis**: Real-time review sentiment and toxicity detection
- **Explainable AI**: Agent reasoning and confidence scoring for each question
- **Adaptive Surveys**: Multi-turn conversational flows that adapt to user responses
- **Production-Ready Architecture**: Scalable database schema, RLS policies, and performance optimization

## Tech Stack

### Database (Phase 0 - ✅ Complete)
- **Supabase** (PostgreSQL + pgvector)
- Vector embeddings for semantic search
- Row Level Security (RLS)
- Auto-generated timestamps and constraints

### Frontend (Phase 1 - Coming Soon)
- React / Next.js
- Tailwind CSS
- Real-time survey interface

### Backend (Phase 2 - Coming Soon)
- Python (FastAPI / Flask)
- LangChain / LangGraph for agentic workflows
- OpenAI / Anthropic LLMs
- Vector database integration

### APIs (Phase 3 - Coming Soon)
- RESTful APIs
- Real-time WebSocket connections
- Supabase client libraries

### Deployment (Phase 4 - Coming Soon)
- Vercel / Railway
- Supabase cloud
- CI/CD pipelines

## Development Roadmap

- [x] **Phase 0**: Database Setup (Supabase schema with vector embeddings)
- [ ] **Phase 1**: Frontend UI (Survey interface and user dashboard)
- [ ] **Phase 2**: Agentic Backend (LLM-powered question generation)
- [ ] **Phase 3**: API Integration (Frontend ↔ Backend communication)
- [ ] **Phase 4**: Production Deployment (Go live!)

## Getting Started

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)
- Supabase account
- OpenAI API key (for GenAI features)

### Phase 0: Database Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Configure Supabase credentials**
   Edit `.env` with your Supabase project details:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```

3. **Run database setup**

   Option A: Using Supabase SQL Editor (Recommended)
   - Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
   - Copy contents of [database/migrations/001_initial_schema.sql](database/migrations/001_initial_schema.sql)
   - Execute in SQL Editor

   Option B: Using Python script
   ```bash
   pip install requests python-dotenv
   python database/setup.py
   ```

4. **(Optional) Load sample data**
   - Copy contents of [database/seed/001_sample_data.sql](database/seed/001_sample_data.sql)
   - Execute in Supabase SQL Editor

5. **Verify setup**
   ```bash
   python database/setup.py
   ```

### Database Schema

See [database/README.md](database/README.md) for detailed schema documentation.

**Core Tables:**
- `products` - Product catalog with embeddings
- `users` - User profiles and demographics
- `transactions` - Purchase and delivery tracking
- `reviews` - User reviews with sentiment analysis
- `survey` - AI-generated survey questions (core agentic system)
- `survey_sessions` - Survey session tracking and analytics

Quick reference: [docs/SCHEMA_REFERENCE.md](docs/SCHEMA_REFERENCE.md)

## Project Structure

```
survey-sensei/
├── database/           # Phase 0: Database schema and migrations
│   ├── migrations/     # SQL migration files
│   ├── seed/          # Sample data for testing
│   ├── setup.py       # Cross-platform setup script
│   └── README.md      # Database documentation
├── frontend/          # Phase 1: React/Next.js UI (coming soon)
├── backend/           # Phase 2: Python GenAI backend (coming soon)
├── docs/              # Documentation
│   └── SCHEMA_REFERENCE.md
├── .env.example       # Environment template
├── .gitignore
└── README.md
```

## Architecture Highlights

### Agentic Survey System

The core innovation is the `survey` table, which powers dynamic question generation:

1. **Context Awareness**: Agent analyzes user profile, purchase history, and product details
2. **Adaptive Questioning**: Questions adapt based on previous answers
3. **Explainability**: Each question includes agent reasoning and confidence score
4. **Learning Loop**: Ground truth labels enable continuous model improvement

### Vector Embeddings

All text data is converted to vector embeddings for:
- **Product recommendations**: Semantic product search
- **User clustering**: Find similar user profiles
- **Review analysis**: Sentiment clustering and insights

### Performance Optimization

- IVFFlat indexes for fast vector similarity search
- Auto-maintained aggregate fields (review counts)
- Materialized views for analytics (coming in Phase 3)
- Row Level Security for multi-tenant isolation

## Contributing

This is a portfolio/demonstration project showcasing GenAI engineering expertise.

For questions or collaboration opportunities, please open an issue.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Supabase](https://supabase.com) for database and auth
- Powered by [OpenAI](https://openai.com) for LLM capabilities
- Vector search via [pgvector](https://github.com/pgvector/pgvector)

---

**Project Status**: Phase 0 Complete ✅ | Phase 1 In Progress
**Last Updated**: 2025-01-08
