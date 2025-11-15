# Survey Sensei - Frontend

Progressive form intake, multi-pane retractable UI, and mock data generation for AI-powered survey simulation.

## Overview

**Phase 1 Complete** implementation featuring:
- 7-field progressive form with conditional logic
- Real-time Amazon product scraping via RapidAPI
- Multi-pane retractable UI (4 distinct states)
- MOCK_DATA_AGENT for synthetic data generation
- Complete Supabase database integration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase JS Client
- **APIs**: RapidAPI (Amazon data), native fetch
- **Validation**: Zod schemas

## Quick Start

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```

   Add your credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   RAPIDAPI_KEY=your-rapidapi-key  # Optional but recommended
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open application**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Test with: `https://www.amazon.com/dp/B0DCJ5NMV2`

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── scrape/route.ts         # Amazon product scraper with RapidAPI
│   │   └── mock-data/route.ts      # MOCK_DATA_AGENT (data generation)
│   ├── globals.css                 # Global styles + animations
│   ├── layout.tsx                  # Root layout with metadata
│   └── page.tsx                    # Main form orchestrator (multi-pane UI)
├── components/
│   ├── form/
│   │   ├── ProductUrlField.tsx              # Field 1: Amazon URL input
│   │   ├── ReviewStatusField.tsx            # Field 2: Has reviews? (Yes/No)
│   │   ├── SentimentSpreadField.tsx         # Field 3: Good/Neutral/Bad sliders
│   │   ├── SimilarProductsField.tsx         # Field 4: Similar products reviewed?
│   │   ├── UserPersonaField.tsx             # Field 5: Auto-generated user
│   │   ├── UserPurchaseHistoryField.tsx     # Field 6: Purchase history?
│   │   └── UserExactProductField.tsx        # Field 7: Bought this product?
│   └── SubmissionSummary.tsx       # Post-submit summary view
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── types.ts                    # TypeScript definitions + validation
│   └── utils.ts                    # Utilities (mock names, helpers)
└── [config files]
```

## Multi-Pane UI System

### 4 UI States

**State 1: Form Filling** (before submit)
- Survey Sensei pane: 100% width
- User fills out 7-field progressive form

**State 2: Submission Summary** (after submit)
- Survey Sensei pane: 10% width (minimized, clickable to expand)
- Simulation Summary: 90% width
- Click Survey Sensei pane → Transition to State 3

**State 3: Survey Pane Expanded**
- Survey Sensei pane: 90% width (expanded view)
- Simulation Summary: 10% width (minimized with vertical "Simulation Summary" text)
- Click Simulation Summary text → Back to State 2
- Click "Next: Start Survey" button → State 4

**State 4: Survey UI** (3-pane layout)
- Survey Sensei: 10% width
- Summary Stats: 10% width (compact metrics)
- Survey UI: 80% width
  - Top 65%: Current question with multiple choice options
  - Bottom 35%: Stacked Q&A history
  - "Generate Product Review" button at bottom

### UI Interactions

**Click Handlers**:
- Survey Sensei pane (State 2): Click to expand to 90%
- Simulation Summary (State 3): Click vertical text to expand back to 90%
- Next button: Proceed to Survey UI (State 4)

**Animations**:
- `transition-all duration-500` for smooth pane transitions
- Hover effects: `cursor-pointer hover:shadow-lg` when clickable
- Loading spinners during API calls

## Form Flow (7 Fields)

```
Product URL → Review Status → Sentiment/Similar Products →
User Persona → Purchase History → Exact Product → Submit
```

### Field Details

**Field 1: Product URL**
- Text input with URL validation
- "Fetch" button with loading spinner
- Intelligent ASIN extraction (supports all Amazon URL formats)
- Product preview card on success
- Displays: title, price, brand, rating, images, description
- RapidAPI integration with fallback to mock data

**Field 2: Review Status**
- Yes/No button selection
- Conditional logic:
  - **Yes**: Fetches reviews from RapidAPI → Field 3 (Sentiment Spread)
  - **No**: Skip review fetching → Field 4 (Similar Products)
- API optimization: Reviews only fetched when "Yes" selected

**Field 3: Sentiment Spread** (if Field 2 = Yes)
- 3 range sliders: Good (0-100%), Neutral (0-100%), Bad (0-100%)
- Real-time total calculation
- Validation: Must equal 100%
- Color-coded: green, yellow, red
- Generates 20-50 reviews with specified distribution

**Field 4: Similar Products** (if Field 2 = No)
- Yes/No button selection
- **Yes**: Generates 5-10 similar products + 50-100 users
- **No**: Flags product cold start

**Field 5: User Persona**
- Auto-generated on mount from preset list
- Includes: Name, Email, Age, Gender, Location (city, state, ZIP)
- "Regenerate" button for new persona
- Gradient card display

**Field 6: User Purchase History**
- Yes/No button selection
- **Yes**: Generates 8-15 products + 2 transactions + reviews
- **No**: Flags user cold start

**Field 7: Exact Product Purchase**
- Yes/No button selection
- **Yes**: Adds transaction for this exact product
- **No**: No additional transaction

**Submit Button**
- Appears after Field 7 completion
- Loading spinner during submission
- Triggers `POST /api/mock-data`
- Transitions to summary view (State 2)

## API Endpoints

### POST /api/scrape

Scrapes Amazon product data using RapidAPI with fallback to direct scraping.

**Request**:
```json
{
  "url": "https://www.amazon.com/dp/B0DCJ5NMV2",
  "fetchReviews": false  // Optional, defaults to false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "title": "Sony WH-1000XM4 Wireless Headphones",
    "price": 279.99,
    "images": ["url1", "url2"],
    "description": "Industry-leading noise canceling...",
    "brand": "Sony",
    "rating": 4.7,
    "reviewCount": 47891,
    "reviews": [],  // Only populated if fetchReviews=true
    "platform": "amazon"
  }
}
```

**Features**:
- **ASIN Extraction**: Supports all Amazon URL formats (`/dp/`, `/gp/product/`, `amzn.to/`, etc.)
- **RapidAPI Integration**: Tries RapidAPI first for reliable data
- **Fallback**: Direct scraping if RapidAPI not configured
- **Conditional Reviews**: Reviews only fetched when `fetchReviews=true`
- **Error Handling**: Returns mock data if both methods fail

**Extraction Patterns**:
```typescript
// ASIN extraction supports:
/\/dp\/([A-Z0-9]{10})/i              // Standard /dp/ format
/\/gp\/product\/([A-Z0-9]{10})/i     // Alternative /gp/product/
/\/([A-Z0-9]{10})\/ref=/i            // ASIN before /ref=
/[?&]asin=([A-Z0-9]{10})/i           // Query parameter
/amzn\.to\/([A-Z0-9]{10})/i          // Shortened links
```

### POST /api/mock-data

Generates synthetic data and inserts into Supabase.

**Request**: Complete `FormData` object (all 7 fields)

**Response**:
```json
{
  "success": true,
  "summary": {
    "products": 6,
    "users": 53,
    "transactions": 78,
    "reviews": 45,
    "scenario": "Product has 45 reviews with 60% positive, 25% neutral, 15% negative sentiment.",
    "coldStart": {
      "product": false,
      "user": false
    }
  }
}
```

**MOCK_DATA_AGENT Logic**:

1. **Product Generation**
   - Insert main scraped product
   - Generate similar products (Field 4 = Yes): 5-10 variants
   - Generate user-specific products (Field 6 = Yes): 8-15 products
   - Variations: Pro, Plus, Elite, Premium, Lite
   - Price variations: ±30% of base price

2. **User Generation**
   - Main user persona from Field 5
   - Review authors (Field 3): 20-50 users
   - Similar product purchasers (Field 4 = Yes): 50-100 users
   - Demographics: age (18-75), gender, location, credit_score (300-850), avg_monthly_expenses

3. **Transaction Generation**
   - 1-3 transactions per user
   - Random products from available pool
   - Statuses: delivered (70%), returned (10%), in_transit (20%)
   - Realistic dates: 1-365 days ago
   - Auto-computed discounts (80-95% of original price)
   - Populated fields: `expected_delivery_date`, `return_date` (nullable)

4. **Review Generation**
   - Based on sentiment spread from Field 3
   - 50% chance per delivered transaction
   - Natural language review text:
     - **Good (4-5 stars)**: "Absolutely love this...", "Great quality..."
     - **Neutral (3 stars)**: "It's okay...", "Average product..."
     - **Bad (1-2 stars)**: "Disappointed...", "Poor quality..."
   - Timestamps: 0-60 days ago
   - `manual_or_agent_generated`: "agent_generated"

5. **Embedding Generation**
   - Deterministic pseudo-random embeddings (1536-dimensional)
   - Based on content hash for consistency
   - **Production**: Replace with OpenAI `text-embedding-ada-002`

6. **Database Insertion**
   - Batch operations for efficiency
   - Tables: products, users, transactions, reviews
   - Error handling with rollback

## Design System

### Colors

```css
/* Primary (Blue) */
--primary-50: #f0f9ff
--primary-600: #0284c7  /* Main brand color */
--primary-900: #0c4a6e

/* Status Colors */
--success: #10b981  /* Green */
--warning: #f59e0b  /* Yellow */
--error: #ef4444    /* Red */
```

### Components

**Buttons**:
```css
.btn              /* Base: px-4 py-2 rounded-lg transition */
.btn-primary      /* Blue bg, white text, hover:shadow-lg */
.btn-secondary    /* Gray bg, gray text */
```

**Inputs**:
```css
.input            /* bg-white text-gray-900 placeholder:text-gray-400 */
```

**Cards**:
```css
.card             /* bg-white rounded-xl shadow-md p-6 */
```

### Animations

```css
/* Fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in from bottom */
@keyframes slide-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pane transitions */
transition: all 0.5s ease-in-out;
```

## Type Safety

### Core Types

```typescript
type FormStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface ProductData {
  url: string
  title: string
  price?: number
  images: string[]
  description: string
  brand?: string
  rating?: number
  reviewCount?: number
  reviews?: ScrapedReview[]
  platform: string
}

interface FormData {
  productUrl: string
  productData?: ProductData
  hasReviews?: 'yes' | 'no'
  sentimentSpread?: { good: number; neutral: number; bad: number }
  hasSimilarProductsReviewed?: 'yes' | 'no'
  userPersona?: UserPersona
  userHasPurchasedSimilar?: 'yes' | 'no'
  userHasPurchasedExact?: 'yes' | 'no'
}

interface MockDataSummary {
  products: number
  users: number
  transactions: number
  reviews: number
  scenario: string
  coldStart: {
    product: boolean
    user: boolean
  }
}

interface UserPersona {
  name: string
  email: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  location: string
  city: string
  state: string
  zipCode: string
}
```

### Validation Schemas (Zod)

```typescript
const productUrlSchema = z.string().url()

const sentimentSpreadSchema = z.object({
  good: z.number().min(0).max(100),
  neutral: z.number().min(0).max(100),
  bad: z.number().min(0).max(100),
}).refine(data => data.good + data.neutral + data.bad === 100)

const userPersonaSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  zipCode: z.string().regex(/^\d{5}$/),
})
```

## Development Commands

```bash
npm run dev         # Start dev server (http://localhost:3000)
npm run build       # Production build
npm start           # Production server
npm run lint        # ESLint
npm run type-check  # TypeScript validation
```

## Testing

### Test Amazon URLs

**Verified Working**:
```
https://www.amazon.com/dp/B0DCJ5NMV2
https://www.amazon.com/dp/B09XS7JWHH
https://www.amazon.com/Apple-iPhone-15-Pro/dp/B0DCJ5NMV2?th=1&psc=1
https://amzn.to/B0DCJ5NMV2
```

### Test Flow

1. **Paste product URL** → Click "Fetch"
2. **Select review status** (Yes/No)
   - If Yes: Adjust sentiment sliders (must total 100%)
   - If No: Select if similar products reviewed
3. **Review auto-generated user persona** → Optionally regenerate
4. **Select purchase history** (Yes/No)
5. **Select exact product purchase** (Yes/No)
6. **Click Submit** → Wait ~5-10 seconds
7. **View summary** in 90% right panel
8. **Click Survey Sensei pane** → Expands to 90%
9. **Click vertical "Simulation Summary"** → Returns to default
10. **Click "Next: Start Survey"** → 3-pane Survey UI

### Database Verification

```sql
-- Check inserted data
SELECT COUNT(*) FROM products;      -- Should increase by 1-15
SELECT COUNT(*) FROM users;         -- Should increase by 20-100+
SELECT COUNT(*) FROM transactions;  -- Should increase by 20-300
SELECT COUNT(*) FROM reviews;       -- Should increase by 0-50

-- Verify embeddings populated
SELECT item_id, title,
       vector_dims(embeddings) as dims,
       embeddings IS NOT NULL as has_embedding
FROM products
ORDER BY created_at DESC
LIMIT 5;
```

## Performance Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| Amazon scrape (RapidAPI) | 1-3s | With reviews: 2-5s |
| Mock data generation | 1-3s | Varies by complexity |
| Database insertion | 0.5-2s | Batch operations |
| UI transition | 0.5s | Smooth animations |
| **Total submission** | **5-10s** | End-to-end |

## Known Limitations

1. **Amazon-Only**: Only Amazon products supported (Walmart/Etsy/eBay removed for reliability)
2. **Mock Embeddings**: Using deterministic pseudo-random embeddings (Phase 2 will use OpenAI)
3. **Limited Preset Names**: 21 preset names for user personas
4. **No Authentication**: Open form (Phase 3 will add auth)
5. **RapidAPI Limit**: 100 requests/month on free tier (upgrade to Pro for more)

## Troubleshooting

### "RapidAPI not configured"
**Console**: `⚠️ RapidAPI not configured or failed, using direct scraping (may be blocked)`

**Solution**:
1. Add `RAPIDAPI_KEY=your_key` to `.env.local`
2. Restart dev server: `npm run dev`
3. Test with Amazon URL

### "Could not extract ASIN from URL"
**Error**: URL doesn't contain valid Amazon product ASIN

**Solution**:
- Use product detail page (not search/category)
- URL should contain `/dp/` or `/gp/product/` with 10-character ASIN
- Example: `https://www.amazon.com/dp/B0DCJ5NMV2`

### Build Errors
```bash
rm -rf node_modules .next
npm install
npm run dev
```

### Port 3000 in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Alternative: Use different port
npm run dev -- -p 3001
```

### Database Errors
- Verify Supabase credentials in `.env.local`
- Ensure database schema deployed (`database/migrations/001_initial_schema.sql`)
- Check Supabase logs in dashboard

### Browser Cache Issues
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear cache completely
- Check browser console (F12) for errors

## Security Considerations

- ✅ Input validation (URL, sentiment totals, age ranges)
- ✅ Supabase RLS policies active
- ✅ Environment variables for secrets (never committed)
- ✅ HTTPS-only URLs
- ⚠️ No rate limiting on frontend (add in Phase 3)
- ⚠️ No authentication (add in Phase 3)

## What Didn't Work (Archive)

### Multi-Platform Scraper (Removed)
**Attempt**: Support Walmart, Etsy, eBay alongside Amazon
- **Issue**: Each platform has different HTML structure, active anti-bot measures
- **Why Failed**: Maintenance overhead too high, unreliable across platforms
- **Solution**: Focus on Amazon-only with RapidAPI for reliability

### Cheerio Dependency (Removed)
**Attempt**: Use Cheerio for HTML parsing
- **Issue**: Added unnecessary dependency, required server-side rendering
- **Why Failed**: Next.js 14 App Router compatibility issues
- **Solution**: Pure regex-based extraction with native fetch

### Always-Fetch Reviews (Changed)
**Attempt**: Always fetch reviews with product details
- **Issue**: Wasted API calls when product had no reviews
- **Why Failed**: Hit RapidAPI free tier limits quickly
- **Solution**: Conditional review fetching based on Field 2 selection

### Modal-Based Summary (Removed)
**Attempt**: Show summary in modal overlay
- **Issue**: Required extra clicks, felt disjointed from form flow
- **Why Failed**: Poor UX, broke visual continuity
- **Solution**: Horizontal panel transition with minimized form

## Next Steps: Phase 2

### Planned Features
- Backend agentic system (Python FastAPI)
- LangChain/LangGraph workflow
- Real OpenAI embeddings
- Dynamic survey question generation
- Sentiment-aware follow-up questions
- Natural language review generation
- WebSocket for real-time surveys

### Files to Create
- `app/survey/[sessionId]/page.tsx`
- `components/survey/QuestionCard.tsx`
- `components/survey/ProgressBar.tsx`
- `app/api/survey/start/route.ts`
- `app/api/survey/answer/route.ts`

---

**Frontend Version**: 1.2.0
**Last Updated**: 2025-11-12
**Status**: Phase 1 Complete ✅
**Lines of Code**: ~3,000
**Components**: 11
**API Endpoints**: 2
