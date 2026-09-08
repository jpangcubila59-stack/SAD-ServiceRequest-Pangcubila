# ICT Service Request Management System

## Problem Statement
The university ICT office currently receives technical support requests through various informal channels including verbal communication, text messages, and social media. This decentralized approach leads to forgotten requests, duplicate entries, and lack of proper monitoring. The Service Request Management System provides a centralized platform where authorized users can record, track, and manage technical support requests efficiently.

## System Features
- User Authentication (Login/Logout)
- Dashboard with Request Statistics
- CRUD Operations for Service Requests
- Search and Filter Functionality
- Data Validation and Business Rules

## Technology Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Supabase (PostgreSQL + Authentication)
- Hosting: GitHub Pages

## Setup Instructions

### Supabase Configuration
1. Create a Supabase account and project
2. Run the SQL script to create the `service_requests` table
3. Enable Row Level Security (RLS)
4. Create RLS policies for authenticated users
5. Update `js/supabase.js` with your project URL and anon key

### GitHub Deployment
1. Fork or clone this repository
2. Enable GitHub Pages in repository Settings
3. Deploy from main branch / root folder

## Database Schema

### service_requests Table
| Column | Type | Constraint |
|--------|------|------------|
| id | bigint | PRIMARY KEY |
| requester_name | text | NOT NULL |
| department | text | NOT NULL |
| category | text | NOT NULL |
| description | text | NOT NULL |
| priority | text | NOT NULL |
| status | text | DEFAULT 'Pending' |
| created_at | timestamptz | DEFAULT NOW() |
| user_id | uuid | REFERENCES auth.users(id) |

## Requirements Traceability Matrix

| Req. ID | Requirement | System Feature | Test |
|---------|-------------|----------------|------|
| FR-01 | User can log in | Login Page | TC-01 |
| FR-02 | User can create request | Request Form | TC-02 |
| FR-03 | User can view requests | Request Table | TC-03 |
| FR-04 | User can update request | Edit Function | TC-04 |
| FR-05 | User can delete request | Delete Function | TC-05 |
| FR-06 | User can search | Search Function | TC-06 |
| FR-07 | User can filter | Filter Function | TC-07 |
| FR-08 | System displays summaries | Dashboard | TC-08 |

## Testing Results

| Test ID | Test Scenario | Expected Result | Result |
|---------|---------------|-----------------|--------|
| TC-01 | Login using valid account | Dashboard appears | PASS |
| TC-02 | Submit valid request | Request saved | PASS |
| TC-03 | Display requests | Existing records appear | PASS |
| TC-04 | Modify request | Changes saved | PASS |
| TC-05 | Delete request | Confirmation appears and record removed | PASS |
| TC-06 | Search requester | Matching records displayed | PASS |
| TC-07 | Filter Pending requests | Only Pending records displayed | PASS |
| TC-08 | Open deployed URL | Application loads online | PASS |

## Business Rules Implemented
- BR-01: Requester name cannot be empty
- BR-02: Department must be provided
- BR-03: Category must be selected
- BR-04: Description must contain sufficient information
- BR-05: Priority must be Low, Medium, or High
- BR-06: New requests automatically receive Pending status
- BR-07: Users must log in before managing requests
- BR-08: Confirmation appears before deleting a record
- BR-09: Date requested is automatically recorded
- BR-10: Unauthorized database modification is prevented

## Live Demo
[GitHub Pages URL]

## Author
[Your Name]
[Course/Section]