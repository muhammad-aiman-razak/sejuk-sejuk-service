# Sejuk Sejuk Service Portal

Internal operations system for Sejuk Sejuk Service Sdn Bhd, an air-conditioner installation, servicing, and repair company.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` with the following variables (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
4. Run the development server: `npm run dev`
5. Open http://localhost:3000

## What I Built

I have built the module 1 (Admin Portal + Order Submission), module 2 (Technician Portal + Service Job), module 3 (WhatsApp Notification Trigger), bonus module (KPI Dashboard), and AI module (Operations Query Window). I have also built the Manager Portal which allows the manager to review and close jobs since it is part of the workflow.

For the "Optional Advanced AI Challenges", I am not able to do these modules as the AI providers that I used were free tier plans of Gemini and Groq which have 20 Rate Per Day (RPD) and 250 RPD respectively:

**AI Workflow Supervisor**

To implement this, the LLM will need to be executed on page load or in the background for relevant pages. Using the free tier plan, since it has a daily rate limit, this will quickly use up all of the RPD. Moreover, as a suggestion, we can exclude AI integration from this as the implementation of this can be done without using AI since it is just simple comparisons. If we were to use AI for this, we would probably use the LLM to create a readable response to display to the user.

**AI Document Understanding**

I am familiar and have experience on this AI document data extraction integration, however, due to the limitations of the AI provider tier plan that I have, I was not able to undertake this task. Since this AI implementation requires the LLM to be able to extract data from documents such as PDFs, the free tier plan does not support this. Moreover, implementing this AI implementation will also mean that whenever we upload a document, it will need to extract the data and pre-fill the fields with the data that was extracted from the document which will use the limited rate limit quickly (We could also implement the AI extraction on submit. However, most users will want to manually approve the pre-filled data before submitting first, so implementing on submit would not be preferred unless the stakeholder wants it automated without human interference.).

**AI Operation Insight**

This module is similar to the "Operations Query Window" AI module which I have implemented and integrated into my system. The existing AI assistant can already answer questions like 'Which technician might be overloaded this week?' through the function calling.

## Tech Stack

I used Next.js as the framework, Typescript as the language, Tailwind as the CSS framework, Supabase as the database and storage, Gemini + Groq as AI providers, and Vercel for deployment.

## Architecture Decisions

- Modularity between each module. Each module is self-contained and can be developed and modified independently from each other. Each function will have only one functionality, making the code easier to maintain and test.
- Domain-separated database schema. This means that each role will write to their own respective tables and all roles will read from one view (`order_details`). We want to separate read and write from each other as the write operations will be specific for each role, while read operations can be joined together to display the data for all roles.
- Mock authentication using a role switcher to switch between admin, technician, and manager roles.
- Standardized the database view to use Malaysia time zone (MYT) to accurately display the correct time. This accuracy will also be reflected in the LLM response for the AI assistant.

## Challenges / Assumptions

- I used Gemini as my primary AI provider for the "Operations Query Window" module. However, since Gemini free tier only has 20 Rate Per Day (RPD), I decided on using Groq as the secondary AI provider that will execute if Gemini hits the daily rate limit. From the user point-of-view, the transition between these two AI providers will be unnoticeable.
- The KPI database view originally aggregated the weeks in UTC which caused jobs that were completed after midnight to be grouped into the wrong week. I updated the views in Supabase to use Malaysia time zone for aggregation.

## How AI Was Integrated

For the AI integration, I used function calling. Function calling allows the LLM to select from predefined functions which will query the database rather than writing raw SQL. The LLM can only call 5 predefined functions that will execute queries in the database. This means that there will be no risk of SQL injection since no raw SQL is involved (The LLM will not be writing the SQL query but rather will call the function that is relevant instead).

The 5 functions are:

- `getJobsByTechnician` - retrieve jobs for a specific technician with optional date/status filters
- `getJobCount` - count jobs matching given filters
- `getTechnicianPerformance` - retrieve weekly performance metrics from the KPI view
- `getDailySummary` - retrieve daily order counts
- `getOrderDetails` - retrieve full details for a specific order

Gemini is the primary AI provider used, while Groq is used as an automatic fallback. If Gemini hits the daily rate limit, the system will catch that error and will switch to Groq. From the user point-of-view, they will not see any difference.

## AI Queries Supported

- "What jobs did technician Ali complete last week?"
- "Which technician completed the most jobs this week?"
- "How many jobs were completed today?"
- "What is the status of order ORD-20260304-0001?"
- "How many orders are currently in progress?"

Some questions cannot be answered by the AI assistant such as "show me Ali's jobs that were rescheduled" and "Which technician is doing a good job?" due to limitations of the implementation itself. Some questions are not supported because the 5 predefined functions do not cover all possible query patterns. For example, reschedule history and subjective performance assessments would require additional functions to be added.

## AI Limitations

- AI providers used are free tier, which has a low daily rate limit.
- The AI assistant may be inaccurate if you ask questions such as "How many jobs were reviewed today?". This is because the AI assistant will call the function which will query and fetch data from the database. The issue is that my function calling implementation currently does not support historical status changes. The LLM is only able to count the current data status and create a response based on that. If we were to add support for this, it will require adding an audit trail table fetching function as well as improvements to the AI prompt.
- The AI assistant response accuracy may depend on how the LLM handles the date. For example, asking the AI assistant about "...last week" or "...this week", the LLM will determine the date range itself and might select a different date range than what we expected (For example, a one day difference).

## What Limitations Exist

- Once the admin creates an order, there is no edit functionality to edit the details. Only the technician assignment is allowed for admins if the order status is "new". In a real-world scenario, I will implement complete CRUD for orders, as well as integrating it with real authentication. The authentication will have RBAC with permissions, and the CRUD functionality will be tied to the permissions.
- Currently, there is no rescheduling UI and functionality in the system. The database supports reschedule history, but this is done so that we can use seed data that already has mock rescheduling data.
- Currently, the validation for file uploads is not strict. The client-side has a 10MB size limit, but there is no size limit validation for file uploads on the server. In a real-world scenario, size limits will be enforced on server-side, client-side, and the storage service to prevent accidental large documents from being uploaded.

## Self-Assessment

**Which module was easiest?**

Module 1 which is the admin portal and order submission. The implementation of this module is very familiar.

**Which module was hardest?**

AI module which is the operations query window is quite difficult. This is because for LLM integration, we need to control how the LLM should respond. This will require more testing which is a challenge as the AI provider used has a daily rate limit. However, given enough time and a better AI provider tier, this module can be implemented better.

## What I Would Improve

- I would implement real authentication using Supabase Auth with role-based access control (RBAC).
- I would also add unit testing for all the server actions and API routes to ensure that all server actions and API routes are working correctly.
- I would also suggest using WhatsApp Business API for actual automated message sending instead of using WhatsApp deep-links.
- I would also add pagination (with lazy loading, meaning that the data will be fetched by batch instead of all at once) if the data grows.

## How I Used AI Tools

My workflow uses Claude CLI as a tool to ensure high efficiency when developing. As a prerequisite, I will first create a project-specific markdown file for Claude which serves as a guideline covering do's and don'ts, formatting, linting, and standards. This ensures that the AI tool will not stray away or hallucinate during development. I will then create a progress markdown file which contains all the items that need to be done (This applies to large tasks and is usually separated by phases. Small tasks will not need this). Creating a progress markdown file will ensure that the AI tool used will not miss out on any items due to context loss. I will then start planning and developing the modules. During development, all changes need to be reviewed and approved by me before being committed. Moreover, I will monitor Claude's output to ensure that it stays on the right path. If it deviates, I will intervene and correct any logical misunderstandings that it may have.
