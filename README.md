# HEG Compass

Absolutely. And I want this prompt to be much more than “build me a CRM.” The application we're designing is essentially an HEG commercial + operational intelligence platform that sits around Trimble/TMW and becomes the institutional memory of the company.

Below is the master prompt I would give Lovable for a brand-new project. I would paste it as the initial project prompt rather than sending it in pieces.

Important: Don't have Lovable import or invent your real data yet. First build the architecture, database, security model, UI system, and workflows. After that, we'll inspect the result together and then bring your real Excel/CSV information into a controlled import pipeline.

MASTER LOVABLE BUILD PROMPT

HEG Commercial Intelligence Hub

Build a production-minded, enterprise-grade internal web application called:

HEG Commercial Intelligence Hub

for HazMat Environmental Group Inc. (HEG).

This is an internal application for a hazardous-material/environmental transportation company.

It is not a generic CRM, not a generic ERP, not a simple spreadsheet replacement, and not an AI-looking dashboard.

The purpose is to create a centralized commercial and operational intelligence system that connects customers, sites, products/materials, routes, rates, bids, opportunities, equipment, capacity, safety information, contracts, documents, requirements, and historical activity.

The application should become the company's commercial source of truth and institutional memory, while existing operational systems such as Trimble/TMW remain authoritative for the operational data they already manage.

The system should be designed so that the company can progressively migrate knowledge currently scattered across Excel workbooks, emails, documents, individual employee knowledge, and different operational systems.

1. COMPANY CONTEXT

HEG is a specialized hazardous-material/environmental carrier.

HEG does not simply accept every customer or every load.

The company works with selected customers because of:

hazardous-material requirements

environmental transportation requirements

regulatory obligations

customer-specific requirements

equipment requirements

driver qualification requirements

route requirements

safety expectations

site-specific operating procedures

insurance/safety considerations

DOT/FMCSA safety considerations

specialized equipment

specialized driver experience

HEG's business is constrained not only by sales demand but also by qualified capacity.

There may be customers who want HEG to haul additional loads, but HEG may not have enough qualified drivers/equipment/capacity to support that demand.

HEG therefore needs to understand:

Where is qualified demand? Where is qualified capacity? Where are we losing business because of capacity? Which opportunities are actually appropriate for HEG?

The sales team is small and currently consists of:

VP of Sales

Account/Sales Manager

Account/Sales Manager / Business Development Manager

Other departments include:

Dispatch

Customer Service

Safety & Compliance

EH&S

Operations

Site Managers

Area Management

Finance/CFO

President/Executive Management

The application should therefore be designed primarily for commercial intelligence but should provide controlled visibility into operational and safety information when appropriate.

2. CORE BUSINESS OBJECTIVE

The system must help HEG answer questions such as:

Customer

Who is this customer?

What sites do they have?

Who are their contacts?

What do they ship?

What lanes do we serve?

What rates do we charge?

What were the historical rates?

When did rates change?

What contracts exist?

What equipment is associated with them?

What customer-specific requirements exist?

What open issues exist?

What business have we lost?

What opportunities are currently open?

Site

Where is the site?

Who owns it?

What materials/products are involved?

What are the site's operating hours?

What PPE is required?

What safety requirements exist?

What equipment is required?

What route is used?

What access/security restrictions exist?

When was the site last assessed?

When is the next assessment due?

Are there open incidents?

Are there special loading/unloading instructions?

Rate

What is the current rate?

When did it become effective?

What was the previous rate?

Why did it change?

What is the historical trend?

What customer/site/lane/product does it apply to?

Are there accessorials?

Are there fuel components?

Is this a quote, contract rate, or historical rate?

Who approved it?

What source supports it?

Bid

What RFPs are active?

Which are due soon?

Which are overdue?

What requirements must be satisfied?

Which lanes/sites are involved?

Who owns the bid?

What documents are required?

What pricing is needed?

What questions are outstanding?

What happened to the bid?

Why was it won/lost?

Capacity

Which opportunities cannot currently be serviced?

Why?

Driver shortage?

Equipment shortage?

Qualification issue?

Geographic issue?

Schedule issue?

Customer requirement?

Safety requirement?

What revenue might be recoverable if capacity changes?

Safety

What incidents are open?

What corrective actions are overdue?

Which sites require assessment?

Which assessments are expiring?

What safety trends exist?

What issues occurred by customer/site/equipment/driver?

What was the resolution?

Was the customer notified?

What follow-up is required?

3. IMPORTANT ARCHITECTURAL PRINCIPLE

Do not build this as one giant table.

Build a proper relational PostgreSQL/Supabase database.

Use relationships/foreign keys.

For example:

Customer
↓
Sites
↓
Lanes
↓
Rates
↓
Bids
↓
Opportunities
↓
Lost Business

and:

Customer
↓
Site
↓
Equipment Assignment
↓
Equipment
↓
Compliance
↓
Technology

and:

Site
↓
Assessment
↓
Incident
↓
Corrective Action
↓
Document

Everything should be connected.

The UI should make those relationships easy to navigate without requiring users to understand the database.

4. TECHNOLOGY STACK

Use Lovable's current production stack.

Preferred architecture:

Frontend

React

TypeScript

Tailwind CSS

shadcn/ui or equivalent mature component library

reusable components

responsive desktop-first design

accessible controls

keyboard-friendly workflows

Backend

Supabase

PostgreSQL

Supabase Auth

Row Level Security

database functions/triggers where appropriate

storage for documents/attachments

audit logging

Architecture

Separate:

presentation

business logic

data access

validation

permissions

reusable UI components

Do not put business logic directly into random page components.

5. SOURCE OF TRUTH STRATEGY

This application should become the commercial intelligence source of truth.

However, do not pretend it replaces Trimble/TMW.

Design a future integration architecture:

HEG operational systems
→ Trimble/TMW
→ Commercial Intelligence Hub

The Hub should eventually be able to ingest:

customers

loads

lanes

operational activity

equipment

driver/capacity information

relevant status information

from Trimble/TMW where technically possible.

Do not fake an integration.

Create an integration-ready architecture.

Every imported record should retain:

source system

source table

source record ID

source file

source sheet

source row

import batch

imported timestamp

last synchronized timestamp

sync status

6. DATABASE MODEL

Create a normalized schema.

CUSTOMERS

Fields:

customer_id

legal_name

DBA_name

customer_type

industry

status

qualification_status

account_owner

primary_contact

billing_contact

operations_contact

safety_contact

customer_since

website

headquarters_address

commercial_notes

qualification_notes

risk_notes

strategic_priority

source_system

source_record_id

created_at

updated_at

created_by

updated_by

archived_at

Customer status:

Prospect

Qualified Prospect

Active

On Hold

Inactive

Lost

Archived

Qualification:

Not Reviewed

Under Review

Qualified

Conditional

Not Qualified

7. CONTACTS

Fields:

contact_id

customer_id

site_id

first_name

last_name

title

department

email

phone

mobile

preferred_contact_method

contact_type

active

notes

created_at

updated_at

Do not collect unnecessary personal information.

8. SITES

Fields:

site_id

customer_id

site_name

site_code

site_type

status

address

city

state

ZIP

country

latitude

longitude

operating_hours

appointment_required

emergency_contact

site_contact

access_requirements

security_requirements

PPE_requirements

loading_requirements

unloading_requirements

safety_requirements

environmental_requirements

route_notes

parking_notes

special_instructions

active

created_at

updated_at

Site types should be configurable.

9. SITE REQUIREMENTS

Create a separate reusable requirements table.

A requirement may apply to:

customer

site

product

lane

equipment

driver

Categories:

Safety

PPE

Operations

Scheduling

Routing

Equipment

Documentation

Security

Environmental

Customer-specific

Other

Fields:

requirement_id

category

requirement

description

mandatory

effective_date

expiration_date

source_document

owner

status

notes

This is extremely important.

Do not bury every requirement in one giant notes field.

10. PRODUCTS / MATERIALS

Fields:

product_id

customer_id

product_name

customer_product_code

material_description

hazard_classification

UN_number

packing_group

physical_state

handling_requirements

equipment_requirements

driver_requirements

special_instructions

active

source

notes

IMPORTANT:

Do not invent hazardous classifications.

If data is unknown, show:

Unknown / Needs Verification

rather than guessing.

11. LANES / ROUTES

Fields:

lane_id

customer_id

origin_site_id

destination_site_id

lane_name

origin_description

destination_description

route_description

states_traversed

mileage

route_restrictions

permit_requirements

seasonal_notes

equipment_requirements

driver_requirements

site_requirements

active

notes

Allow one lane to have:

multiple historical rates

multiple bids

multiple products

multiple equipment requirements

12. RATES

Rates must be historical.

Never simply overwrite an existing rate.

Fields:

rate_id

customer_id

site_id

lane_id

product_id

rate_type

amount

unit

currency

effective_date

expiration_date

fuel_surcharge

fuel_method

minimum_charge

accessorials

quote_reference

contract_id

status

source

approved_by

approval_date

notes

Rate status:

Draft

Quoted

Pending Approval

Active

Expired

Rejected

Superseded

13. RATE HISTORY

Create immutable history.

Fields:

rate_history_id

rate_id

previous_amount

new_amount

percentage_change

effective_date

reason

source

approved_by

notes

created_at

Create a visual timeline.

Example:

Jan 2026 — $1,250

↓

Jun 2026 — $1,325 (+6%)

↓

Jan 2027 — $1,410 (+6.4%)

14. BIDS / RFPS

Fields:

bid_id

customer_id

opportunity_id

bid_name

bid_type

status

issue_date

question_deadline

due_date

decision_date

owner

qualification_status

pricing_status

document_status

estimated_revenue

estimated_loads

lanes

requirements

outcome

loss_reason

notes

Statuses:

Identified

Qualification

Preparing

Waiting on Information

Pricing

Internal Review

Submitted

Won

Lost

Withdrawn

Cancelled

Create clear visual indicators:

🔴 Overdue

🟠 Due Soon

🟢 Submitted

🔵 Waiting

15. OPPORTUNITIES

Fields:

opportunity_id

customer_id

site_id

owner

name

stage

estimated_loads

estimated_revenue

probability

expected_close_date

qualification

next_action

next_action_date

source

loss_reason

competitor

capacity_status

notes

Stages:

New

Qualification

Qualified

Proposal

Negotiation

Won

Lost

On Hold

16. LOST LOADS / LOST BUSINESS

This is a major HEG intelligence feature.

Fields:

lost_business_id

customer_id

site_id

lane_id

product_id

opportunity_id

date

estimated_loads

estimated_revenue

reason_category

reason_detail

competitor

rate_issue

capacity_issue

driver_issue

equipment_issue

qualification_issue

service_issue

customer_issue

recoverable

recovery_plan

owner

status

notes

Reason categories:

Capacity

Driver

Equipment

Rate

Qualification

Safety

Service

Customer Decision

Competitor

Route

Scheduling

Other

Build reporting around this.

17. EQUIPMENT MASTER

Fields:

equipment_id

unit_number

category

equipment_type

color

certified_weight

capacity

year

make

serial_number

VIN

NY_plate_number

status

ownership_type

current_customer_id

current_site_id

notes

source_sheet

source_row

source_record

data_quality_status

needs_review

review_reason

import_notes

created_at

updated_at

Categories:

Tractor

Tank Trailer

Van Trailer

Dry Bulk

Dump

Vacuum Tank

Other

18. EQUIPMENT ASSIGNMENTS

Fields:

assignment_id

equipment_id

customer_id

site_id

assignment_type

lane_id

product_id

start_date

end_date

status

notes

Assignment types:

HEG Internal

Customer Assigned

Customer-Owned Hauled by HEG

Leased to Customer

Other

Never destroy assignment history.

19. EQUIPMENT LEASES

Fields:

lease_id

equipment_id

customer_id

lease_type

start_date

end_date

rate

contract_id

status

documents

notes

20. EQUIPMENT COMPLIANCE

Fields:

compliance_id

equipment_id

jurisdiction

requirement

registration_type

plate_number

effective_date

expiration_date

status

required

document

notes

Support jurisdictions such as:

New York

New Jersey

Delaware

Wisconsin

Miami-Dade County

other future jurisdictions

Do not create fake records.

21. EQUIPMENT TECHNOLOGY

Fields:

technology_id

equipment_id

technology_type

device_id

cable_id

installation_date

removal_date

status

notes

Technology choices:

Omnitracs

Cable

Telematics

Other

22. DRIVERS

Create a driver master but minimize sensitive information.

Fields:

driver_id

employee_reference

status

hire_date

qualification_status

general_notes

Do not expose sensitive driver information to Sales by default.

23. DRIVER QUALIFICATIONS

Fields:

qualification_id

driver_id

qualification_type

status

issue_date

expiration_date

verification_date

verification_source

notes

Qualification types should support concepts such as:

Hazmat

Doubles/Triples

Trailer Experience

Customer Qualification

Site Qualification

Other

Do not assume or fabricate qualification requirements.

24. DRIVER SAFETY

Create restricted safety records.

Fields:

event_id

driver_id

event_date

category

severity

status

source

resolution

review_date

notes

Use strict access controls.

25. CONTRACTS

Fields:

contract_id

customer_id

contract_number

contract_name

status

effective_date

expiration_date

renewal_date

owner

commercial_terms_summary

document_id

notes

Automatically flag:

Renewal due in 90 days

Renewal due in 30 days

Expired

26. INCIDENTS

Fields:

incident_id

incident_date

incident_type

severity

customer_id

site_id

equipment_id

driver_id

lane_id

status

description

immediate_action

root_cause

corrective_action

owner

due_date

resolution

customer_communication

customer_notified

closed_date

review_date

documents

notes

Statuses:

Open

In Process

Resolved

Closed

27. CORRECTIVE ACTIONS

Fields:

corrective_action_id

incident_id

action

owner

due_date

status

completion_date

completion_evidence

notes

Automatically flag overdue actions.

28. SITE ASSESSMENTS

Fields:

assessment_id

site_id

assessment_type

assessment_date

next_review_date

assessor

status

approval_status

findings

restrictions

corrective_actions

document_id

notes

Show:

Current Assessment

Previous Assessment

Next Review

Expired

Due Soon

29. DOCUMENT MANAGEMENT

Create a document metadata system.

Fields:

document_id

document_name

document_type

linked_entity_type

linked_entity_id

version

effective_date

expiration_date

owner

source

storage_path

status

notes

Document types:

Contract

Rate Sheet

RFP

Site Assessment

Safety Procedure

Customer Requirement

Equipment Document

Compliance Document

Training

Insurance

Other

Use Supabase Storage for actual files.

30. TASKS / ACTIONS

Create a universal task system.

Fields:

task_id

title

description

owner

linked_entity

due_date

priority

status

completed_date

created_by

Priorities:

Critical

High

Normal

Low

Statuses:

Open

In Progress

Waiting

Completed

Cancelled

31. MEETINGS / REVIEWS

Create a meeting/review system.

Types:

Daily 10-Minute Review

Participants may include:

Site Managers

Area Manager

VP

Sales

Account Management

Operations

President

CFO

Customer Service

Weekly Monday Review

Track:

loads down

incidents

call-offs

customer issues

sales changes

bids

opportunities

capacity issues

action items

Monthly Safety Review

Annual Safety Review

Track:

incidents

customers

sites

drivers

equipment

corrective actions

trends

findings

decisions

Every meeting should generate actionable follow-up tasks.

32. IMPORT CENTER

This is critical.

HEG currently has information in Excel/CSV and other sources.

Create:

Import Center

Workflow:

Upload

↓

Choose Source

↓

Preview

↓

Map Fields

↓

Validate

↓

Detect Duplicates

↓

Review Conflicts

↓

Approve

↓

Import

↓

Import Summary

Never silently overwrite master records.

Every import should create:

Import Batch

batch_id

filename

source

imported_by

imported_at

status

records_processed

records_created

records_updated

records_rejected

records_needing_review

Import Staging

Fields:

source_sheet

source_row

source_record

matched_record

match_method

confidence

data_quality_status

review_reason

import_decision

import_notes

Matching methods:

Serial/VIN

Plate

Unit Number

Customer + Site

Name

Manual Match

No Match

Confidence:

High

Medium

Low

Unknown

33. EXCEL / SPREADSHEET STRATEGY

The application must be able to replace Excel gradually.

Do NOT assume everything must be migrated immediately.

Design for:

Phase 1

Excel remains the source.

Import into staging.

Phase 2

Validated information becomes authoritative in Hub.

Phase 3

Users stop maintaining duplicate spreadsheets.

Phase 4

Trimble/TMW integrations automate operational synchronization.

The application should also allow users to export filtered tables to CSV when necessary.

34. CUSTOMER 360

This should be one of the best screens in the application.

Header:

Customer Name

Status

Account Owner

Qualification

Primary Contact

Quick actions:

Add Opportunity

Add Bid

Add Site

Add Contact

Add Rate

Add Task

Below that use tabs:

Overview

Sites

Contacts

Products

Lanes

Rates

Bids

Opportunities

Lost Business

Equipment

Contracts

Incidents

Documents

Requirements

Activity

Don't force the user to navigate away unnecessarily.

35. SITE 360

Header:

Site Name

Customer

Address

Status

Assessment status

Quick actions.

Tabs:

Overview

Requirements

Contacts

Products

Lanes

Equipment

Assessments

Incidents

Documents

Tasks

Activity

Include a map/location section.

36. EQUIPMENT 360

Show:

Equipment identity

Unit number

Type

Category

Status

Ownership

Current Assignment

Customer

Site

Lane

History

Assignments

Leases

Compliance

Technology

Documents

Timeline

Installation

Assignments

Compliance renewals

Lease events

Status changes

37. COMMAND CENTER

Build a highly useful home screen.

Do not create 25 meaningless cards.

Show:

Today

overdue tasks

bids due soon

contract renewals

assessments due

open incidents

corrective actions

important customer issues

Sales

open opportunities

qualified opportunities

pipeline

high-value opportunities

opportunities blocked by capacity

Capacity

lost loads

capacity-related lost business

equipment constraints

driver qualification constraints

Safety

open incidents

overdue actions

assessments expiring

Recent Activity

Show meaningful changes.

38. SALES CONTROL CENTER

Views:

Pipeline

Kanban/table.

Follow-ups

Tasks grouped by due date.

Bids

Calendar/list.

Rates

Rate changes.

Lost Business

Revenue/capacity analysis.

Customers

Customer intelligence.

39. BID CONTROL CENTER

Create a powerful bid calendar.

Columns:

Customer

Bid

Owner

Due Date

Status

Qualification

Pricing

Requirements

Estimated Revenue

Provide filters:

Owner

Status

Due date

Customer

Bid type

Views:

List

Calendar

Kanban

40. RATE INTELLIGENCE

Provide:

Current Rates

Rate History

Recent Changes

Expiring Rates

Rates by Customer

Rates by Lane

Rates by Product

Allow a rate record to display:

Current: $X

Previous: $Y

Change: +X%

Effective: DATE

Reason: X

41. CAPACITY INTELLIGENCE

Do not pretend the system knows actual capacity until integrated with operational systems.

Instead model:

Demand

vs.

Qualified Capacity

vs.

Unserved Demand

Show confidence/source.

Example:

Capacity constraint recorded by Sales

rather than:

HEG has 7 available drivers

unless actual data supports it.

42. SAFETY CONTROL CENTER

Views:

Open Incidents

Overdue Corrective Actions

Assessments Due

Expired Assessments

Equipment Compliance

Driver Qualification Exceptions

Safety Trends

Customer/Site Safety

43. KNOWLEDGE HUB

Build an internal searchable knowledge base.

Categories:

Customer Procedures

Site Procedures

Safety

Operations

Sales

Bidding

Rates

Equipment

Compliance

Training

Lessons Learned

Terminology

Every article should have:

title

category

owner

version

effective date

review date

status

related customer

related site

document

content

notes

Do not fabricate articles.

44. GLOBAL SEARCH

This is extremely important.

Create a global search/command interface.

Users should be able to search:

“Acme”

and see:

Customers

Sites

Contacts

Bids

Rates

Equipment

Documents

Incidents

Knowledge

Use keyboard shortcut such as:

⌘/Ctrl + K

for the command palette.

45. NAVIGATION

Keep the sidebar simple.

Primary navigation:

Command Center

Sales

Customers

Bids

Operations

Equipment

Safety

Reports

Knowledge

Administration — only for authorized users.

Avoid a huge sidebar containing every table.

Tables are implementation details.

Users should think in terms of:

Customers

Sites

Bids

Equipment

Safety

not:

tbl_customer_master

tbl_site_requirements

etc.

46. DESIGN SYSTEM

This is extremely important.

The application should feel like a mature enterprise application, not an AI-generated website.

Take inspiration from the usability philosophy of Apple/iOS:

clarity

hierarchy

simplicity

consistency

progressive disclosure

predictable controls

excellent typography

restrained visual design

minimal cognitive load

Do NOT literally copy Apple's branding.

Do NOT use excessive:

gradients

glassmorphism

glowing cards

huge rounded rectangles

decorative illustrations

floating blobs

unnecessary animations

giant dashboard numbers

AI-style purple gradients

Use a sophisticated HEG enterprise aesthetic.

47. COLOR SYSTEM

Use HEG branding where appropriate.

Use color primarily for:

status

warnings

alerts

navigation emphasis

important actions

Semantic colors:

Success

Warning

Danger

Information

Neutral

Do not turn every card into a different color.

48. TYPOGRAPHY

Use a highly legible modern sans-serif.

Strong hierarchy:

Page title

Section heading

Record title

Field label

Body

Secondary information

Metadata

Avoid excessive bold text.

Tables should be highly readable.

49. COMPONENT SYSTEM

Create reusable:

buttons

badges

status chips

tables

filters

date pickers

search

drawers

dialogs

forms

tabs

breadcrumbs

cards

timeline

activity feed

command palette

confirmation dialogs

empty states

loading states

error states

50. FORMS

Forms should be extremely easy.

Do not present users with 50 fields at once.

Use sections:

Basic Information

Commercial

Operational

Safety

Documents

Notes

Use progressive disclosure.

Required fields should be obvious.

Use validation before submission.

Use friendly language.

For example:

Instead of:

customer_id

display:

Customer

Instead of:

effective_date

display:

Effective date

Never expose database field names to users.

51. QUICK CREATE

From anywhere:

+ New

should allow:

Customer

Site

Contact

Opportunity

Bid

Rate

Equipment

Incident

Task

Document

Use drawers or modal sheets for quick records.

52. TABLE EXPERIENCE

Tables are going to be heavily used.

Provide:

sorting

filtering

column selection

search

pagination

saved views

export

bulk actions where safe

sticky headers

row actions

contextual navigation

Don't make tables visually overwhelming.

53. RECORD DETAIL EXPERIENCE

A record should have:

Header

Status

Key fields

Actions

Tabs

Related records

Timeline

Documents

Activity

Avoid forcing users through multiple screens for simple information.

54. ACTIVITY TIMELINE

Important entities should have timelines.

Example:

Sep 8

Rate updated

Sep 5

Customer contact added

Sep 2

Bid created

Aug 29

Site assessment completed

This gives the application institutional memory.

55. AUDIT LOG

Create audit tracking for important changes.

Track:

user

timestamp

entity

record

action

field

old value

new value

Especially:

rates

contracts

safety records

equipment

customer qualification

requirements

permissions

56. AUTHENTICATION

Implement Supabase authentication.

Support:

email/password initially

password reset

session management

logout

user profile

role

Architecture should allow future:

Microsoft/Google SSO

MFA

corporate identity provider

Do not store passwords yourself.

57. USER ROLES

Create:

Admin

Full access.

Sales

Customers

Sites

Contacts

Opportunities

Bids

Rates

Lost Business

Commercial documents

Limited operational/safety information.

Operations

Sites

Lanes

Equipment

Operational requirements

Tasks

Appropriate incident visibility.

Safety / Compliance

Incidents

Assessments

Driver qualifications

Equipment compliance

Safety documents.

Management

Broad read access and reporting.

Read Only

View only.

Use Row Level Security.

58. SECURITY

Implement:

Supabase RLS

role-based permissions

least privilege

secure storage policies

protected documents

audit logs

server-side validation

input validation

secure API usage

no secrets in frontend

environment variables

no exposed service-role keys

safe file upload validation

Sensitive safety/driver information must not automatically appear to Sales users.

59. DOCUMENT SECURITY

Documents may contain sensitive operational information.

Create access rules.

Potential classifications:

Public Internal

Commercial

Operations

Safety

Confidential

Restricted

60. NOTIFICATIONS

Eventually support:

bid deadlines

contract renewals

assessment renewals

corrective actions

overdue tasks

rate expiration

equipment compliance expiration

Start with in-app notifications.

Architecture should allow future:

email

Microsoft Teams

Slack

Do not fake external notifications.

61. AUTOMATION

Create architecture for:

Bid

Due in 7 days

→ notification

Due in 2 days

→ escalation

Overdue

→ alert

Assessment

90 days

→ reminder

30 days

→ warning

Expired

→ critical

Contract

90 days

→ renewal reminder

30 days

→ escalation

Corrective Action

Due soon

→ reminder

Overdue

→ escalation

62. REPORTING

Create a reporting section.

Reports:

Sales

pipeline

won/lost

revenue

opportunities

customer growth

Bids

win rate

bid volume

upcoming deadlines

lost reasons

Rates

current rates

historical changes

rate increases

expiring rates

Capacity

lost business due to capacity

lost revenue

demand trends

Customers

customer concentration

site count

revenue where available

activity

Safety

incidents

corrective actions

assessments

trends

63. DATA VISUALIZATION

Use charts only where they answer real questions.

Prefer:

line charts

bar charts

small trend charts

timelines

simple KPI summaries

Avoid dashboards containing 20 charts.

64. EMPTY STATES

Because the initial application will not have real HEG data:

Do not show fake numbers.

Example:

No active bids yet

Import or create your first bid to start tracking deadlines.

Not:

27 Active Bids

unless it is clearly marked DEMO.

65. DEMO MODE

If demonstration data is necessary, create a clearly separated:

DEMO MODE

Never mix demo records with production data.

Use fictional customers such as:

Demo Industrial Services

Never invent actual HEG customer data.

66. DATA QUALITY

Every imported record should have a data-quality state.

Options:

Verified

Needs Review

Conflicting Source

Missing Information

Imported — Unverified

Allow users to open a Data Quality Review Queue.

67. DUPLICATE DETECTION

Potential duplicate matching:

Customer:

legal name

DBA

address

Site:

customer

site name

address

Equipment:

unit number

VIN

serial number

plate

Contact:

email

customer

name

Do not automatically merge uncertain matches.

68. DATA PROVENANCE

Every imported record should know:

Where did this information come from?

Example:

Source:

Equipment Workbook

Sheet:

Equipment List(DO NOT DELETE)

Row:

37

Imported:

09/09/2026

Status:

Imported — Unverified

This is extremely important for HEG.

69. EXCEL MIGRATION

Build the architecture so we can eventually import the equipment workbook and other spreadsheets.

Potential source sheets include:

Equipment List

Miami-Dade County renewal

Delaware renewal/reporting

New York renewal

New Jersey hazardous/solid waste information

Wisconsin information

Omnitracs tractor/cable list

Do not assume all of these belong in Equipment Master.

Some should map to:

Equipment Compliance

Equipment Technology

Equipment Assignments

or other related tables.

70. MAPS

Site records should support map visualization.

Show:

site location

customer

address

route information

Do not build a complicated GIS system initially.

Use maps where they improve usability.

71. MOBILE / TABLET

Desktop is primary.

But:

forms

incidents

quick tasks

site information

field updates

should work well on tablets and phones.

This may eventually allow drivers/site personnel to submit structured information.

72. DRIVER / FIELD FORMS

Future-ready architecture should allow:

Driver or field employee

↓

simple mobile form

↓

incident / inspection / status record

↓

dispatch/safety review

↓

corrective action

↓

resolution

↓

customer communication

Do not make drivers interact with the full enterprise database.

Create role-specific simplified interfaces.

73. OPERATIONS WORKFLOW

The Hub should eventually connect:

Driver/Field

↓

Operations

↓

Safety

↓

Sales

↓

Customer

without forcing everyone to use the same screen.

74. DAILY REVIEW

Create a lightweight screen:

Daily Review

Show only exceptions.

Examples:

Site issue

Incident

Call-off

Load down

Customer issue

Equipment problem

Safety issue

Bid issue

Each item should have:

Status

Owner

Next Action

Due Date

75. WEEKLY REVIEW

Create:

Monday Weekly Review

Sections:

Operational Issues

Customer Issues

Sales

Bids

Capacity

Safety

Open Actions

Allow meeting notes and action creation.

76. SAFETY REVIEW

Create flexible date filtering:

Last 7 days

Last 30 days

Last quarter

Year-to-date

Custom range

Group by:

Customer

Site

Driver

Equipment

Incident type

Severity

Status

Do not expose restricted information to unauthorized users.

77. KNOWLEDGE + DATA CONNECTION

Knowledge articles should link to:

Customer

Site

Equipment

Procedure

Document

Bid

Requirement

This creates an actual organizational knowledge graph.

Example:

Site 123

→ Site Assessment

→ PPE requirement

→ Operating procedure

→ Customer contact

→ Related document

78. FUTURE AI

Architect for future AI assistance but do not build fake AI features now.

Future possibilities:

“Tell me everything about Customer X”

“What changed at Site X?”

“Show me rate changes for this lane”

“Which bids are due this week?”

“Why did we lose this business?”

“Summarize the last safety review”

“Find all sites requiring special PPE”

The relational structure must make these future features possible.

79. AI SAFETY

If AI is eventually added:

do not let AI invent company facts

show source records

distinguish facts from suggestions

respect user permissions

never expose restricted records

maintain auditability

80. PERFORMANCE

Design for potentially:

thousands of customers

thousands of sites

thousands of rates

thousands of equipment records

thousands of historical records

many documents

years of incidents

Use:

indexes

pagination

efficient queries

lazy loading

server-side filtering where appropriate

Do not load the entire database into the browser.

81. DATABASE INDEXES

Create indexes for frequently searched fields:

customer name

customer status

site name

site customer

equipment unit number

VIN

equipment status

bid due date

opportunity stage

rate effective date

rate expiration

incident status

incident due date

assessment next review date

contract expiration

task due date

82. SOFT DELETE / ARCHIVING

Do not physically delete important records casually.

Use:

active

inactive

archived

and retain history.

For destructive actions require confirmation.

83. DESIGN FOR CHANGE

HEG's requirements will change.

Do not hardcode every dropdown.

Where appropriate use configurable reference tables.

Examples:

customer types

site types

equipment types

incident categories

bid types

rate types

requirement categories

84. ADMINISTRATION

Create an Administration area.

Only authorized users can access it.

Include:

users

roles

permissions

lookup values

import batches

data-quality queue

audit logs

system settings

85. SYSTEM HEALTH

Create an admin system-health screen eventually showing:

database status

failed imports

incomplete records

documents expiring

integration errors

failed jobs

Do not expose technical errors to normal users.

86. UX LANGUAGE

Use human language.

Bad:

RFP_DUE_DT

Good:

Bid due date

Bad:

FK_SITE_ID

Good:

Site

Bad:

OOS

Good:

Out of service

Bad:

Needs_Review = TRUE

Good:

Needs review

87. ERROR HANDLING

Errors should say what happened and what the user can do.

Bad:

500 Internal Server Error

Good:

We couldn't save this customer. Check the required fields and try again.

For technical failures, provide a reference ID to admins.

88. ACCESSIBILITY

Follow modern accessibility standards.

Ensure:

keyboard navigation

adequate contrast

visible focus

semantic labels

screen-reader friendly controls

accessible forms

error messages

no color-only status communication

89. APPLICATION SHELL

Build:

Left sidebar

Top global search

User profile

Notifications

Main content

Contextual actions

Use responsive sidebar collapse.

Remember the sidebar should remain simple.

90. HOME PAGE DESIGN

Do not create a generic SaaS landing page.

The user should enter directly into the application.

Command Center should feel like:

What needs my attention?

rather than:

Welcome to your AI-powered business platform.

91. RECORD RELATIONSHIP UX

If a user is viewing:

Customer → Site → Lane → Rate

they should be able to move through these relationships naturally.

Example:

Customer 360

↓

Sites

↓

Site 360

↓

Lanes

↓

Lane detail

↓

Rates

↓

Rate history

↓

Bid

↓

Opportunity

↓

Lost Business

and always have an easy way back.

92. BREADCRUMBS

Use when helpful:

Customers / Acme / Buffalo Site / Lane 12

Allow clicking previous levels.

93. SIDE DRAWERS

Use drawers for:

quick edits

quick creation

related record previews

Do not use drawers for complex multi-section workflows.

94. FORMS WITH AUTOSAVE

Where appropriate:

draft bid

incident

assessment

should support drafts.

Do not lose user work.

95. CHANGE HISTORY

For critical records show:

History

Example:

Sep 9 — Rate changed from $1,200 → $1,250
Changed by: User
Reason: Contract increase

96. CUSTOMER QUALIFICATION

Create a clear qualification workflow:

Prospect

↓

Initial Review

↓

Safety/Operational Review

↓

Commercial Review

↓

Qualified / Conditional / Not Qualified

This should not automatically qualify anyone.

97. BID QUALIFICATION

Before spending time pricing a bid, allow Sales to record:

customer fit

safety fit

equipment fit

route fit

capacity fit

driver qualification

commercial fit

Then:

Qualified to Bid

or

Do Not Pursue

with reason.

98. CAPACITY GATE

Create a concept of:

Commercially attractive

but

Operationally constrained

This is a major HEG business distinction.

Opportunity status could show:

🟢 Serviceable

🟡 Capacity Review

🔴 Currently Not Serviceable

99. RATE APPROVAL

Rates should optionally require approval based on configuration.

Workflow:

Draft

→ Review

→ Approved

→ Active

→ Superseded

100. DOCUMENT EXPIRATION

Create a centralized expiration monitor.

Show:

expired

due within 30 days

due within 60 days

due within 90 days

Across:

contracts

assessments

equipment compliance

certifications

documents

101. IMPORTANT: DO NOT OVERBUILD

For the initial implementation:

Prioritize:

Tier 1

Authentication

Database

Customers

Contacts

Sites

Lanes

Products

Rates

Bids

Opportunities

Equipment

Incidents

Assessments

Contracts

Tasks

Documents metadata

Tier 2

Customer 360

Site 360

Equipment 360

Command Center

Sales Control Center

Bid Control Center

Safety Control Center

Tier 3

Import Center

Data Quality

Audit history

Knowledge Hub

Reporting

Tier 4

Future integrations:

Trimble/TMW

email

Teams

automated notifications

mobile field workflows

AI assistant

Do not sacrifice the database architecture to build flashy dashboards.

102. DEVELOPMENT PROCESS

Build in stages.

After each major stage:

test

inspect

fix

continue

Do not create hundreds of components without validating the foundation.

Use migrations.

Do not destroy existing data during schema changes.

103. FIRST BUILD REQUIREMENT

For this first build, create:

A. Application shell

B. Design system

C. Authentication architecture

D. Supabase/PostgreSQL schema

E. Roles/security architecture

F. Customers

G. Sites

H. Contacts

I. Products

J. Lanes

K. Rates

L. Bids

M. Opportunities

N. Equipment

O. Incidents

P. Site Assessments

Q. Contracts

R. Tasks

S. Documents metadata

T. Customer 360

U. Site 360

V. Equipment 360

W. Command Center

Do not fabricate HEG data.

Use empty states.

If demo data is required to demonstrate interactions, create a separate clearly labeled DEMO mode.

104. FINAL QUALITY BAR

Before considering the first build complete, inspect the application as if you were:

A new HEG Business Development Manager

Can I understand it immediately?

Can I find a customer?

Can I see everything related to that customer?

Can I create an opportunity?

Can I track a bid?

Can I find a rate?

Can I understand rate history?

Can I see why business was lost?

Can I find a site?

Can I understand site requirements?

Can I find equipment?

Can I understand equipment ownership/assignment/compliance?

Can I find an incident?

Can I see what needs attention?

Can I create a task?

Can I search the entire system?

Then inspect it as:

A VP of Sales

Can I see the pipeline?

Can I see upcoming bids?

Can I see capacity-related lost business?

Can I see important customer issues?

Can I understand rate trends?

Then as:

Safety / Compliance

Can I find incidents?

Can I see corrective actions?

Can I see assessments?

Can I see equipment compliance?

Can I see safety trends?

Are sensitive records protected?

Then as:

Operations

Can I understand site requirements?

Can I find equipment?

Can I see assignments?

Can I see operational requirements?

105. MOST IMPORTANT DESIGN PRINCIPLE

The system should make complex information feel simple.

HEG's business is complicated.

The application should not be.

The user should see:

Customer → Site → What matters

Bid → What is due → What needs to happen

Rate → What is current → What changed

Equipment → Where is it → Who uses it → What is required

Incident → What happened → Who owns it → What happens next

Opportunity → Is it qualified → Can we actually service it?

The complexity should exist in the data model, not in the user's experience.

Build the application with this philosophy throughout.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5eadb64d-1846-40b1-b127-f465e49c68aa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
