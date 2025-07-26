Civica User Journey - Civic Engagement Platform
🎯 Overview
Civica is a web application designed to empower Romanian citizens to collectively pressure local authorities into addressing community issues through coordinated email campaigns.
👥 User Personas
Primary Users

Active Citizen - Someone who notices local problems and wants to take action
Supporting Citizen - Someone who wants to help resolve existing issues in their community
Issue Creator - A user who documents and publishes new community problems

🗺️ User Journey Map
1. Entry & Location Selection
User Goal: Access issues in my local area
Landing Page → Location Selection
├── Dropdown 1: Județ (County) - [Bucharest] *hardcoded*
├── Dropdown 2: Oraș (City) - [Bucharest] *hardcoded*
└── Dropdown 3: Cartier (District) - [Sector 5] *hardcoded*
    └── [Continue] → Issues List Page
Key Elements:

Clean, simple interface
Pre-selected values for MVP
Clear call-to-action to proceed


2. Issues Discovery
User Goal: Find and understand local problems I can help with
Issues List Page
├── Header: "Active Issues in [Sector 5, Bucharest]"
├── Filter/Sort Options
│   ├── Sort by: Date (Newest/Oldest)
│   ├── Sort by: Urgency
│   └── Sort by: Number of emails sent
├── Issue Cards (Preview Mode)
│   ├── Issue Title
│   ├── Issue Photo (thumbnail)
│   ├── Brief Description (truncated)
│   ├── Location Tag
│   ├── Date Created
│   ├── Email Counter: "X emails sent"
│   └── [View Details] button
└── [+ Create New Issue] button (future feature)
Interaction Flow:

Scroll through active issues
Click on any issue card to view details
Visual indicators for issue urgency/popularity


3. Issue Detail View
User Goal: Understand the problem fully and decide if I want to help
Issue Detail Page
├── Back Navigation [← Back to Issues]
├── Issue Header
│   ├── Issue Title
│   ├── Status Badge [OPEN]
│   └── Creation Date
├── Photo Gallery
│   ├── Main Photo (large)
│   └── Additional Photos (thumbnails)
├── Location Section
│   ├── Interactive Map (showing exact location)
│   └── Address/Location Description
├── Problem Description
│   ├── Detailed Description
│   ├── Current Situation
│   ├── Desired Outcome
│   └── Impact on Community
├── Statistics Bar
│   ├── "X people have sent emails"
│   ├── "Y days since reported"
│   └── "Z authorities notified"
└── Action Section
    └── "Help Resolve This Issue" (prominent CTA)
        └── → Authority Selection

4. Authority Selection & Email Generation
User Goal: Send emails to relevant authorities quickly and easily
Authority Email Section (same page, expanded view)
├── Instructions: "Select which authorities to contact"
├── Authority Buttons (pre-selected during issue creation)
│   ├── [📧 Primăria Sector 5] 
│   ├── [📧 Administrația Străzilor]
│   ├── [📧 Poliția Locală]
│   └── [📧 Other Relevant Authority]
│
└── On Button Click → Email Template Modal
    ├── Modal Header: "Email to [Authority Name]"
    ├── User Input Fields
    │   ├── Your Name: [___________] *required*
    │   ├── Your Email: [___________] *required*
    │   ├── Your Phone: [___________] *optional*
    │   └── Additional Comments: [___________] *optional*
    ├── Generated Email Preview
    │   ├── To: [authority@email.ro] (copy button)
    │   ├── Subject: [Pre-filled subject] (copy button)
    │   └── Email Body: [Generated template with user details] (copy button)
    ├── Instructions Panel
    │   ├── "1. Copy the email address"
    │   ├── "2. Copy the subject line"
    │   ├── "3. Copy the email body"
    │   └── "4. Send from your email client"
    └── Action Buttons
        ├── [Copy All & Open Email Client] *primary*
        ├── [Copy Individual Elements] *secondary*
        └── [Close]
Email Template Structure:
Subject: [URGENT] Request for Action - [Issue Title] - Sector 5, București

Dear [Authority Name],

I am writing to bring to your attention an issue requiring immediate action in our community.

Issue Details:
- Location: [Specific Address/Area]
- Problem: [Brief Description]
- Impact: [How it affects citizens]
- Requested Action: [What needs to be done]

This issue was reported on [Date] and has already been brought to your attention by [X] concerned citizens. As a resident of this area, I kindly request your urgent intervention to resolve this matter.

I am available to provide additional information if needed.

Contact Details:
Name: [User Name]
Email: [User Email]
Phone: [User Phone if provided]

Thank you for your attention to this matter.

Respectfully,
[User Name]

---
Reference ID: [ISSUE-ID]
Reported via Civica Platform

5. Post-Email Actions
User Goal: Confirm my participation and see impact
After Email Modal Closes
├── Success Message: "Thank you for taking action!"
├── Update Issue Counter (+1 email sent)
├── Option to contact another authority
└── Share Option (future feature)
    ├── Share on Social Media
    └── Invite friends to participate

🔄 User Flow Scenarios
Scenario A: First-time User Supporting an Issue

Lands on homepage → Sees location selector
Confirms Sector 5 → Views issue list
Attracted by "Broken sidewalk" issue → Clicks to view
Reviews photos and description → Decides to help
Clicks "Primăria Sector 5" → Modal opens
Fills in personal details → Reviews generated email
Copies email components → Sends via personal email
Sees success message → Returns to issue list

Scenario B: Returning User Checking Progress

Direct link to issues page → Sees familiar issues
Notices increased email count on supported issue
Checks for new issues → Finds relevant problem
Quickly sends email (details saved) → Done in 2 minutes


📱 Mobile Optimization Considerations

Touch-friendly buttons (minimum 44px height)
Swipeable photo galleries
Collapsible sections for long descriptions
One-thumb navigation for key actions
Easy copy buttons with visual feedback
Responsive cards that stack vertically
Bottom sheet modals for email generation


🚀 Future Enhancements

User Accounts

Save personal details
Track contributed issues
Receive updates on issue resolution


Issue Creation Flow

Photo upload
Location picker
Authority selector
Problem categorization


Gamification

Citizen points
Community leaderboard
Achievement badges


Resolution Tracking

Before/after photos
Authority responses
Issue closure workflow


Expansion Features

Multiple neighborhoods
City-wide issues
National campaigns




🎨 UI/UX Principles

Simplicity First - Minimize steps to send an email
Visual Impact - Photos drive emotional connection
Social Proof - Show participation numbers prominently
Accessibility - Clear CTAs, readable fonts, high contrast
Trust Building - Professional appearance, clear privacy handling


📊 Success Metrics

Time from landing to email sent: < 3 minutes
Email participation rate: > 30% of visitors
Return user rate: > 40%
Issues with 10+ emails: > 50%
Authority response rate: Track over time


🔐 Privacy & Trust Elements

No account required for basic participation
Clear data usage explanation
Optional fields marked clearly
No spam - one email per authority per user per issue
Transparent email counter (no fake numbers)