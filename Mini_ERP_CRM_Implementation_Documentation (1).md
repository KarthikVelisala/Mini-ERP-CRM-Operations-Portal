# Mini ERP + CRM Operations Portal

## Full Stack Developer Case Study — Implementation Documentation

---

## 1. Project Overview

### Project

**Mini ERP + CRM Operations Portal**

### Business Context

The application is a small ERP/CRM system for a wholesale/distribution company.

The company manages:

- Customers
- Products
- Stock
- Purchase orders
- Sales challans
- Invoices
- CRM follow-ups

The application is intended for internal employees such as:

- Sales
- Warehouse
- Accounts
- Admin

The objective is to demonstrate practical full-stack development, including:

- Backend APIs
- Database design
- Frontend UI
- Authentication
- Role-based access
- Business logic
- Validation
- Error handling
- Deployment
- Documentation

The application should remain focused and should not be expanded into a large ERP beyond the requirements of the case study.

---

# 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend Language | JavaScript / TypeScript |
| Frontend Styling | HTML + CSS |
| Backend | Node.js |
| Backend Language | TypeScript |
| Backend Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| API Style | REST APIs |
| Authentication | JWT-based authentication |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | Neon |
| Version Control | Git + GitHub |
| API Testing | Postman |
| Bonus | Docker |
| Bonus | GitHub Actions |

---

# 3. Required Core Modules

The application will contain the following required modules:

1. Authentication and Roles
2. Customer CRM
3. Product and Inventory
4. Sales Challan
5. REST API layer
6. Responsive React frontend
7. PostgreSQL database
8. Deployment
9. Documentation

---

# 4. Authentication and Roles

## 4.1 Authentication

Implement login functionality using JWT-based authentication.

The system must support the following roles:

- Admin
- Sales
- Warehouse
- Accounts

## 4.2 Authentication Requirements

- Users must be able to log in.
- Protected APIs must require authentication.
- Invalid authentication must be rejected.
- Passwords must not be stored as plain text.
- JWT authentication must be used for authenticated API access.

## 4.3 Role-Based Access

API access and application actions must be controlled according to the authenticated user's role.

The frontend should also provide role-appropriate navigation and actions.

Backend authorization remains the final security layer.

---

# 5. Customer CRM Module

## 5.1 Customer Fields

Each customer must contain:

- Customer name
- Mobile number
- Email
- Business name
- GST number — optional
- Customer type
  - Retail
  - Wholesale
  - Distributor
- Address
- Status
  - Lead
  - Active
  - Inactive
- Follow-up date
- Notes

## 5.2 Required Customer Features

The application must support:

- Add customer
- Edit customer
- Search customer
- View customer detail page
- Add follow-up notes

## 5.3 Customer API Requirements

The backend must provide REST APIs for the required customer operations.

APIs must support:

- Input validation
- Proper HTTP status codes
- Error messages
- Search where required
- Pagination where required

---

# 6. Product and Inventory Module

## 6.1 Product Fields

Each product must contain:

- Product name
- SKU/code
- Category
- Unit price
- Current stock
- Minimum stock alert quantity
- Location/warehouse

## 6.2 Required Product Features

The application must support:

- Add product
- Edit product

## 6.3 Stock Movement Log

Stock movement must track:

- Product
- Quantity changed
- Movement type
  - IN
  - OUT
- Reason
- Created by
- Timestamp

The stock movement history should be available for tracking inventory changes.

---

# 7. Sales Challan Module

## 7.1 Sales Challan Flow

A Sales user must be able to:

1. Select a customer.
2. Add multiple products.
3. Enter quantity for each product.
4. Generate a challan number automatically.
5. Save the challan as Draft or Confirmed.

## 7.2 Challan Fields

Each challan must contain:

- Challan number
- Customer
- Products
- Total quantity
- Status
  - Draft
  - Confirmed
  - Cancelled
- Created by
- Created date

## 7.3 Challan Business Logic

The following business rules are mandatory.

### Confirmed Challan

When a challan is confirmed:

- Stock must be reduced.
- Stock must not become negative.
- The API must reject the operation when available stock is insufficient.

### Insufficient Stock

If requested quantity is greater than available stock:

- The challan must not incorrectly reduce stock.
- The API must return a proper error.
- The user must receive a clear error message.

### Product Snapshot

The challan must store product snapshot data, not only the product ID.

This preserves the product information associated with the challan at the time it was created.

---

# 8. REST API Requirements

The backend must provide clean REST APIs.

The case study specifies examples such as:

```text
POST /auth/login
GET  /customers
```

The final API structure must cover all required modules.

## 8.1 API Standards

All APIs must include:

- Input validation
- Proper HTTP status codes
- Clear error messages
- Pagination where needed
- Search/filter where needed

## 8.2 API Areas

The API layer must cover:

- Authentication
- Customers
- Customer follow-ups
- Products
- Inventory
- Stock movements
- Sales challans

---

# 9. Database Design

PostgreSQL will be used as the application database.

The database must support the relationships required by:

- Users
- Roles
- Customers
- Customer follow-ups
- Products
- Stock
- Stock movements
- Sales challans
- Challan products/items

The database design must support the required business logic, particularly:

- Customer management
- Product management
- Inventory tracking
- Stock movement history
- Challan management
- Stock reduction during challan confirmation

Stock-changing operations must maintain data consistency.

---

# 10. Frontend

## 10.1 Frontend Technology

The frontend will be built using:

- React
- HTML
- CSS
- JavaScript/TypeScript

## 10.2 UI Requirement

The application must provide a clean admin-style UI.

The UI must be responsive.

## 10.3 Required Frontend Areas

The frontend should provide interfaces for:

- Login
- Customer management
- Customer details
- Customer follow-ups
- Product management
- Inventory/stock
- Stock movement history
- Sales challan creation
- Sales challan listing/details
- Role-based application access

## 10.4 Frontend Behavior

The UI should provide:

- Form validation
- Search
- Filters where required
- Useful error messages
- Loading states
- Clear success/error feedback
- Responsive layouts

---

# 11. Project Structure

The project should be organized clearly so that frontend and backend responsibilities remain separated.

Recommended structure:

```text
mini-erp-crm/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── ...
│
├── .github/
│   └── workflows/
│
├── README.md
└── ...
```

The exact internal folder structure can follow the selected implementation architecture.

---

# 12. Validation and Error Handling

The backend must handle invalid input and business errors correctly.

Examples include:

| Situation | Expected Result |
|---|---|
| Missing required field | Validation error |
| Invalid input format | Validation error |
| Invalid credentials | Authentication error |
| Missing authentication | Unauthorized response |
| Insufficient permissions | Forbidden response |
| Resource does not exist | Not Found response |
| Insufficient stock | Clear business error |
| Invalid quantity | Validation error |
| Invalid request | Bad Request response |
| Unexpected server failure | Proper server error without exposing sensitive internals |

Errors returned by the API must be understandable and useful to the frontend.

---

# 13. Search, Filter and Pagination

The case study requires search/filter and pagination where needed.

These should be applied primarily to list-based resources such as:

- Customers
- Products
- Stock movements
- Challans

The implementation should avoid loading unnecessarily large datasets into the frontend.

---

# 14. Deployment

The application will use the following deployment architecture:

```text
React Frontend
      |
      v
    Vercel
      |
      | HTTPS / REST API
      v
Node.js + Express Backend
      |
      v
    Render
      |
      v
PostgreSQL Database
      |
      v
     Neon
```

## 14.1 Frontend Deployment

The React frontend will be deployed on:

**Vercel**

The final submission must contain the live frontend URL.

## 14.2 Backend Deployment

The Node.js + Express backend will be deployed on:

**Render**

The final submission must contain the live backend API URL.

## 14.3 Database Deployment

The PostgreSQL database will be hosted on:

**Neon**

The backend will connect to the Neon PostgreSQL database through environment configuration.

---

# 15. Environment Variables

Environment variables must be used for configuration and sensitive values.

Sensitive values must not be committed to GitHub.

Typical backend configuration includes:

```text
DATABASE_URL=...
JWT_SECRET=...
PORT=...
```

Frontend configuration should contain only values that are safe to expose to the browser, such as the public backend API URL when required by the frontend framework.

The actual secret values must remain in the local environment and deployment platform configuration.

---

# 16. Git and GitHub Development Strategy

The project should not be submitted as one large commit.

Development should be divided into meaningful milestones.

The goal is to show a clean and professional development history.

## 16.1 Recommended Commit Sequence

### Project Setup

```text
chore: initialize full stack project
```

### Backend

```text
feat: initialize TypeScript Express backend
```

### Database

```text
feat: configure PostgreSQL database
```

```text
feat: add database schema and migrations
```

### Authentication

```text
feat: implement JWT authentication
```

### Authorization

```text
feat: add role based authorization
```

### CRM

```text
feat: implement customer CRM module
```

```text
feat: add customer management interface
```

### Inventory

```text
feat: implement product management
```

```text
feat: implement inventory and stock movements
```

### Challans

```text
feat: implement sales challan module
```

```text
feat: add challan stock validation
```

### Frontend Integration

```text
feat: connect frontend with backend APIs
```

### Testing and Fixes

```text
test: add API validation tests
```

```text
fix: prevent negative stock during challan confirmation
```

### Documentation

```text
docs: add project setup and API documentation
```

### Deployment

```text
docs: add deployment instructions
```

### Bonus

```text
build: add Docker configuration
```

```text
ci: add GitHub Actions workflow
```

## 16.2 Commit Rules

Do:

- Commit meaningful features.
- Commit completed modules.
- Commit important fixes.
- Commit tests.
- Commit documentation.
- Use clear commit messages.

Do not:

- Create fake commits.
- Create empty commits.
- Create dozens of commits only to increase the count.
- Use messages such as `update`, `final`, `final2`, or `changes`.

A professional commit history is more valuable than a high commit count.

---

# 17. AI VS Code Agent Development Workflow

The project may be developed using an AI VS Code coding agent.

The agent should work incrementally instead of generating the complete application and committing everything at once.

The agent should follow this workflow:

```text
Plan
  ↓
Implement one logical feature
  ↓
Run checks/tests
  ↓
Fix errors
  ↓
Commit
  ↓
Push
  ↓
Move to next feature
```

## 17.1 Agent Instructions

Use the following instruction with the AI coding agent:

```text
Build this project incrementally by logical milestones.

Do not implement the entire project in one step.

After completing each meaningful milestone:
1. Review the implementation.
2. Run the relevant tests/checks.
3. Fix errors.
4. Verify that the milestone works.
5. Create a meaningful Git commit.
6. Push the commit to GitHub when the repository is configured.

Do not create artificial, empty, or cosmetic commits.
Do not commit secrets or .env files.
Keep the Git history clean and professional.

Do not move to the next major module until the current module is functional.

Follow the project requirements exactly.
Do not add unrelated features unless explicitly requested.
```

---

# 18. Development Order

The recommended implementation order is:

## Phase 1 — Project Setup

- Create GitHub repository.
- Create frontend.
- Create backend.
- Configure TypeScript.
- Configure environment variables.
- Configure basic project structure.

Commit:

```text
chore: initialize full stack project
```

---

## Phase 2 — PostgreSQL

- Configure PostgreSQL.
- Configure database access.
- Create database schema.
- Create migrations.
- Create required relationships.

Commit:

```text
feat: configure PostgreSQL database
```

---

## Phase 3 — Authentication

- Create user model.
- Implement password hashing.
- Implement login.
- Implement JWT authentication.
- Protect required APIs.

Commit:

```text
feat: implement JWT authentication
```

---

## Phase 4 — Roles

Implement:

- Admin
- Sales
- Warehouse
- Accounts

Add backend role authorization.

Commit:

```text
feat: add role based authorization
```

---

## Phase 5 — Customer CRM

Implement:

- Customer creation
- Customer editing
- Customer search
- Customer detail
- Follow-up notes

Commit:

```text
feat: implement customer CRM module
```

---

## Phase 6 — Product and Inventory

Implement:

- Product creation
- Product editing
- Current stock
- Minimum stock alert quantity
- Warehouse/location
- Stock movement log
- IN movements
- OUT movements

Commit:

```text
feat: implement product and inventory module
```

---

## Phase 7 — Sales Challan

Implement:

- Customer selection
- Multiple products
- Product quantities
- Automatic challan number
- Draft status
- Confirmed status
- Cancelled status
- Created by
- Created date

Commit:

```text
feat: implement sales challan module
```

---

## Phase 8 — Stock Business Logic

Implement:

- Stock availability validation
- Prevention of negative stock
- Stock reduction on confirmation
- Stock movement record
- Product snapshot data

Commit:

```text
feat: add challan stock validation
```

---

## Phase 9 — Frontend

Build:

- Login
- Dashboard/admin layout
- Customer pages
- Product pages
- Inventory pages
- Challan pages
- Role-based navigation
- Responsive UI

Commit meaningful UI changes separately.

---

## Phase 10 — Frontend + Backend Integration

Connect all required React screens to the REST APIs.

Verify:

- Login
- Authentication
- Customer operations
- Product operations
- Inventory operations
- Challan creation
- Challan confirmation
- Stock validation

Commit:

```text
feat: connect frontend with backend APIs
```

---

# 19. Testing and Verification

Before deployment, verify the complete business flow.

## Authentication

- Login works.
- Invalid credentials fail.
- Protected endpoints require authentication.
- Roles are respected.

## CRM

- Customer can be created.
- Customer can be edited.
- Customer can be searched.
- Customer details can be viewed.
- Follow-up notes can be added.

## Inventory

- Product can be created.
- Product can be edited.
- Stock is displayed correctly.
- Stock movement is recorded.
- IN and OUT movements are tracked.

## Challan

- Customer can be selected.
- Multiple products can be added.
- Quantity can be entered.
- Challan number is generated.
- Draft challan can be saved.
- Confirmed challan reduces stock.
- Negative stock is prevented.
- Insufficient stock produces an API error.
- Product snapshot information is stored.

---

# 20. Postman Collection

A Postman collection must be prepared for API testing.

It should cover the important API flows.

## Authentication

```text
POST /auth/login
```

Test:

- Admin login
- Sales login
- Warehouse login
- Accounts login

## Customers

Test:

- Create customer
- Get customers
- Search customers
- Get customer details
- Edit customer
- Add follow-up note

## Products

Test:

- Create product
- Get products
- Edit product

## Inventory

Test:

- Record stock movement
- Get stock movement history

## Challans

Test:

- Create draft challan
- Get challan
- Confirm challan
- Cancel challan
- Insufficient stock scenario

The Postman collection must be included with the submission or clearly documented.

---

# 21. README

The GitHub repository README must contain:

## Project Information

- Project name
- Project overview
- Business context
- Main features

## Technology

- Frontend stack
- Backend stack
- Database
- Authentication
- Hosting

## Setup

- Prerequisites
- Clone instructions
- Install dependencies
- Environment variables
- Database setup
- Run frontend
- Run backend

## API

- API overview
- Authentication
- Important endpoints
- Postman collection

## Deployment

Document:

```text
Frontend → Vercel
Backend  → Render
Database → Neon
```

## Test Credentials

Provide working test credentials for:

- Admin
- Sales
- Warehouse
- Accounts

## Architecture

Explain:

```text
React
  ↓
REST API
  ↓
Node + Express
  ↓
PostgreSQL
```

## Limitations

List only the features that are actually incomplete at the time of submission.

---

# 22. Docker Bonus

Docker is a bonus feature.

It should be implemented after the core application is stable.

## Docker Components

The project can contain:

```text
frontend/
    Dockerfile

backend/
    Dockerfile

docker-compose.yml
```

The Docker configuration should allow the application environment to be built and started consistently.

## Docker Verification

Verify:

- Frontend image builds.
- Backend image builds.
- Containers start successfully.
- Backend can connect to PostgreSQL.
- Environment variables are configured correctly.
- README contains Docker instructions.

Commit:

```text
build: add Docker configuration
```

---

# 23. GitHub Actions Bonus

GitHub Actions is a bonus feature.

A workflow should be added under:

```text
.github/workflows/
```

Example:

```text
.github/
└── workflows/
    └── ci.yml
```

## Recommended Workflow

```text
Git push
   ↓
GitHub Actions
   ↓
Install dependencies
   ↓
Run tests
   ↓
Build frontend
   ↓
Build/check backend
   ↓
Workflow succeeds
```

The workflow should run automatically when appropriate changes are pushed to GitHub.

If deployment is included in the workflow, deployment should happen only after the required checks pass.

---

# 24. Deployment and CI/CD Relationship

Vercel and Render can provide automatic deployment when connected directly to GitHub.

This is separate from GitHub Actions.

The project can therefore have:

```text
GitHub
   │
   ├── Vercel → Frontend deployment
   │
   └── Render → Backend deployment
```

And additionally:

```text
GitHub
   ↓
GitHub Actions
   ↓
Tests / Build / CI
```

The GitHub Actions workflow should be present in the repository when claiming the GitHub Actions bonus.

---

# 25. Final Architecture

```text
                         ┌─────────────────────┐
                         │       GitHub        │
                         │   Source Control    │
                         └─────────┬───────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
                  ▼                                 ▼
          ┌───────────────┐                 ┌────────────────┐
          │    Vercel     │                 │ GitHub Actions │
          │ React Frontend│                 │  CI / Checks   │
          └───────┬───────┘                 └────────────────┘
                  │
                  │ HTTPS / REST
                  ▼
          ┌───────────────┐
          │    Render     │
          │ Node + Express│
          │    Backend    │
          └───────┬───────┘
                  │
                  │ PostgreSQL
                  ▼
          ┌───────────────┐
          │     Neon      │
          │  PostgreSQL   │
          └───────────────┘
```

---

# 26. Implementation Plan

- Repository setup
- Frontend setup
- Backend setup
- TypeScript setup
- PostgreSQL connection

- Database schema
- Migrations
- User model
- Authentication

- Roles
- Authorization
- Protected APIs


- Customer CRM
- Customer APIs
- Customer UI


- Product module
- Inventory
- Stock movement


- Sales challan
- Challan items
- Stock validation
- Product snapshots


- Frontend integration
- Responsive admin UI
- Loading/error states


- Testing
- Bug fixes
- API validation


- Deploy frontend to Vercel
- Deploy backend to Render
- Configure Neon PostgreSQL


- Postman collection
- README
- Test credentials
- Architecture documentation


- Docker bonus


- GitHub Actions bonus


- Final testing
- Verify deployment URLs
- Verify credentials
- Verify Postman
- Verify README
- Verify GitHub repository
- Final submission

If the required application is incomplete, prioritize required functionality over bonus features.

---

# 27. Submission Checklist

Before submitting, verify every item below.

## Required

- [ ] GitHub repository link
- [ ] Clean Git history
- [ ] Working frontend
- [ ] Working backend
- [ ] PostgreSQL database
- [ ] Authentication
- [ ] Admin role
- [ ] Sales role
- [ ] Warehouse role
- [ ] Accounts role
- [ ] Customer CRM
- [ ] Product management
- [ ] Inventory management
- [ ] Stock movement log
- [ ] Sales challan
- [ ] Stock validation
- [ ] Product snapshot data
- [ ] Input validation
- [ ] Proper HTTP status codes
- [ ] Error messages
- [ ] Search/filter where needed
- [ ] Pagination where needed
- [ ] Responsive frontend
- [ ] Live frontend URL
- [ ] Live backend API URL
- [ ] Test login credentials for all roles
- [ ] Postman collection/API documentation
- [ ] README
- [ ] Architecture explanation
- [ ] Environment variable documentation
- [ ] Server setup documentation
- [ ] Deployment documentation
- [ ] Known limitations

## Bonus

- [ ] Docker
- [ ] GitHub Actions deployment/CI workflow
- [ ] Invoice PDF export
- [ ] Product image upload to AWS S3

---

# 28. Final Project Completion Criteria

The project is ready for submission when:

1. The application runs successfully.
2. Authentication works.
3. All four required roles work.
4. Customer CRM works.
5. Product and inventory management works.
6. Stock movement logging works.
7. Sales challan creation works.
8. Confirming a challan correctly reduces stock.
9. Stock cannot become negative.
10. Insufficient stock produces a proper API error.
11. Challan product snapshot data is stored.
12. Frontend and backend communicate correctly.
13. PostgreSQL is working through Neon.
14. Frontend is deployed on Vercel.
15. Backend is deployed on Render.
16. Postman APIs are tested.
17. README is complete.
18. GitHub repository contains meaningful commits.
19. Docker works if included.
20. GitHub Actions works if included.
21. Final submission links and credentials are verified.

---

# 29. Final Submission Structure

The final submission should provide:

```text
GitHub Repository
        +
Live Frontend URL
        +
Live Backend API URL
        +
Test Credentials
        +
Postman Collection / API Documentation
        +
README
        +
Architecture Explanation
        +
Known Limitations
```

The project should demonstrate the required ERP/CRM business flow clearly and should prioritize correctness, clean implementation, validation, business logic, documentation, and deployment.
