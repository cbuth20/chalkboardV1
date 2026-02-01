# Question Generation System Architecture

## 🏗️ System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      COACH UPLOADS PLAY                          │
│                  (Image or Built Play Data)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           BACKGROUND PROCESSING (15 min timeout)                 │
│                                                                   │
│  1. Analyze Play with GPT-4 Vision                              │
│     ├─ Extract assignments                                       │
│     ├─ Identify routes and depths                               │
│     └─ Categorize each assignment                               │
│                                                                   │
│  2. Generate AI Insights                                        │
│     └─ High-level play analysis                                 │
│                                                                   │
│  3. AI Question Generation (NEW!)                               │
│     ├─ Build context from play data                            │
│     ├─ Call GPT-4 with structured prompt                       │
│     ├─ Generate 10-12 varied questions                         │
│     └─ Transform to database format                            │
│                                                                   │
│  4. Save to Database                                            │
│     ├─ Update play record                                       │
│     ├─ Insert assignments                                       │
│     └─ Insert questions                                         │
│                                                                   │
│  [Fallback: Use basic template questions if AI fails]          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE STORAGE                            │
│                                                                   │
│  plays                          play_assignments                 │
│  ├─ id                         ├─ play_id                       │
│  ├─ name                       ├─ position                      │
│  ├─ concept                    ├─ alignment                     │
│  ├─ play_type                  ├─ assignment                    │
│  ├─ formation_name             ├─ key_read                      │
│  ├─ unit                       └─ category                      │
│  ├─ situation                                                    │
│  └─ content_status             flashcard_templates              │
│                                 ├─ play_id                       │
│                                 ├─ question_type ⭐ NEW          │
│                                 ├─ topic ⭐ NEW                  │
│                                 ├─ question_prompt               │
│                                 ├─ correct_answer                │
│                                 ├─ options ⭐ NEW                │
│                                 ├─ explanation ⭐ NEW            │
│                                 ├─ scenario_context ⭐ NEW       │
│                                 ├─ learning_objective ⭐ NEW     │
│                                 ├─ tags ⭐ NEW                   │
│                                 ├─ difficulty                    │
│                                 └─ is_active                     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       COACH INTERFACE                            │
│                                                                   │
│  Playbook Management                                            │
│  ├─ View all plays                                              │
│  ├─ Edit play details                                           │
│  ├─ Approve/Publish plays                                       │
│  └─ Regenerate Questions ⭐ NEW                                 │
│                                                                   │
│  Quiz Assignment (Phase 2)                                      │
│  ├─ Select plays                                                │
│  ├─ Filter questions (topic, difficulty, type)                 │
│  ├─ Preview questions                                           │
│  ├─ Set parameters (time, passing score)                       │
│  └─ Assign to players/positions/teams                          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PLAYER INTERFACE                            │
│                                                                   │
│  Take Quiz (Phase 2)                                            │
│  ├─ View assigned quizzes                                       │
│  ├─ Answer different question types                            │
│  │  ├─ Multiple Choice                                          │
│  │  ├─ True/False                                               │
│  │  ├─ Fill in the Blank                                        │
│  │  └─ Scenario Questions                                       │
│  ├─ See explanations                                            │
│  ├─ Track progress                                              │
│  └─ View results                                                │
│                                                                   │
│  Study Mode                                                      │
│  ├─ Browse questions by topic                                   │
│  ├─ Use hints                                                    │
│  └─ Review related concepts                                     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS & INSIGHTS                          │
│                                                                   │
│  Question Performance                                            │
│  ├─ Success rate by question                                    │
│  ├─ Time spent per question                                     │
│  └─ Most missed questions                                       │
│                                                                   │
│  Player Performance                                              │
│  ├─ Weak topics per player                                      │
│  ├─ Progress over time                                          │
│  └─ Mastery by difficulty level                                 │
│                                                                   │
│  Team Insights                                                   │
│  ├─ Common weak areas                                           │
│  ├─ Quiz completion rates                                       │
│  └─ Average scores by position                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Question Generation Pipeline

```
┌────────────────┐
│  Play Data     │
│  ─────────     │
│  • Name        │
│  • Concept     │
│  • Formation   │
│  • Unit        │
│  • Situation   │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  Assignments   │
│  ───────────   │
│  QB: Shotgun,  │
│       3-step   │
│  X: 15-yd dig  │
│  Z: 9-yd out   │
│  H: Mesh @ 5   │
└────────┬───────┘
         │
         ▼
┌──────────────────────────┐
│  AI Prompt Builder       │
│  ─────────────────       │
│  • Build context         │
│  • Set difficulty dist   │
│  • Choose question types │
│  • Add metadata hints    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  GPT-4o API Call         │
│  ────────────────         │
│  System: Question expert │
│  User: Generate 12 Qs    │
│  Response: JSON          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  AI Response             │
│  ────────────            │
│  {                       │
│    questions: [          │
│      {                   │
│        type: "scenario", │
│        topic: "coverage",│
│        difficulty: "adv",│
│        ...               │
│      }                   │
│    ]                     │
│  }                       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Transform for DB        │
│  ────────────────        │
│  • Map positions         │
│  • Convert formats       │
│  • Add metadata          │
│  • Set visibility        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Insert into Database    │
│  ────────────────────    │
│  flashcard_templates     │
│  ├─ 4 multiple choice    │
│  ├─ 3 true/false         │
│  ├─ 3 scenario           │
│  └─ 2 identification     │
└──────────────────────────┘
```

## 📊 Data Model Relationships

```
organizations
     │
     ├─── teams
     │      │
     │      └─── plays
     │            │
     │            ├─── play_assignments
     │            │         │
     │            │         └─── flashcard_templates
     │            │                    (assignment_id FK)
     │            │
     │            └─── flashcard_templates
     │                      (play_id FK)
     │
     └─── quiz_assignments
              │
              ├─── quiz_assignment_questions
              │         │
              │         └─── flashcard_templates
              │                    (flashcard_id FK)
              │
              └─── quiz_attempts
                        │
                        └─── quiz_attempt_answers
                                  │
                                  └─── flashcard_templates
                                           (flashcard_id FK)
```

## 🎯 Question Type Distribution

```
Input: Play with 8 assignments
       └─ Unit: Offense
       └─ Concept: Mesh
       └─ Situation: 3rd Down

Output: 12 Questions

Beginner (3)
├─ Multiple Choice: "Where does X line up?"
├─ True/False: "The H crosses at 5 yards"
└─ Multiple Choice: "What formation is this?"

Intermediate (7)
├─ Multiple Choice: "What's the Z's read vs Cover 2?"
├─ True/False: "Against man, X should stem inside"
├─ Scenario: "3rd and 7, what's the hot read?"
├─ Multiple Choice: "Which route breaks first?"
├─ Identification: "This coverage is..."
├─ True/False: "RB checks weak side LB"
└─ Scenario: "Safety rotates, who gets the ball?"

Advanced (2)
├─ Scenario: "Why does this work vs Cover 3?"
└─ Identification: "Coverage from these cues..."
```

## 🔧 Tech Stack

```
Frontend
├─ Next.js 14 (App Router)
├─ React + TypeScript
├─ Tailwind CSS
└─ SWR for data fetching

Backend
├─ Netlify Functions (Serverless)
├─ Supabase (PostgreSQL)
├─ OpenAI GPT-4o
└─ Node.js

Database
├─ PostgreSQL 15
├─ JSONB for flexibility
├─ ENUMs for type safety
└─ Views for common queries

AI/ML
├─ GPT-4o Vision for play analysis
├─ GPT-4o for question generation
├─ Structured prompts
└─ JSON response format
```

## 🚀 Deployment Architecture

```
┌──────────────────┐
│   Client/Browser │
│                  │
│  Next.js App     │
└────────┬─────────┘
         │
         │ HTTPS
         ▼
┌──────────────────┐
│  Netlify Edge    │
│                  │
│  • CDN           │
│  • Functions     │
│  • Auth          │
└────┬───────┬─────┘
     │       │
     │       └──────────┐
     │                  │
     ▼                  ▼
┌──────────┐    ┌──────────────┐
│ Supabase │    │  OpenAI API  │
│          │    │              │
│ • Auth   │    │  • GPT-4o    │
│ • DB     │    │  • Vision    │
│ • Storage│    │  • Chat      │
└──────────┘    └──────────────┘
```

## 🔐 Security Model

```
Authentication
├─ Supabase Auth (JWT)
├─ Organization scoping
└─ Role-based access (player/coach/admin)

Authorization Layers
├─ Netlify Functions: withOrgAuth() wrapper
├─ Database: Row Level Security (RLS)
└─ Frontend: Role-based UI rendering

Data Isolation
├─ org_id on all tables
├─ Queries filtered by orgId
└─ No cross-organization access

API Security
├─ Environment variables for keys
├─ Rate limiting (planned)
└─ Request validation
```

---

**This architecture supports:**
- ✅ Scalable question generation
- ✅ Flexible data model
- ✅ Real-time updates
- ✅ Multi-tenant isolation
- ✅ Extensible for future features
