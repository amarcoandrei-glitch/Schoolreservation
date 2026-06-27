EquipHub – Complete System Integration, UI Enhancement & Missing Functionality Prompt

Your task is to complete and polish my EquipHub – School Equipment Reservation System. The project already uses Next.js, React, TypeScript, Firebase Authentication, Cloud Firestore, and Cloudinary, but several pages still contain placeholders, mock data, or partially implemented features.

The goal is to make the application 100% functional, fully integrated with Firebase, and have a modern, professional UI suitable for deployment.

High Priority Fixes
1. Remove All "Coming Soon" Pages

Several pages still display "Coming Soon" placeholders.

Replace every placeholder page with a fully functional implementation connected to Firebase.

Examples include:

Admin Settings
User Profile
Other unfinished pages

There should be no placeholder pages remaining.

2. Complete Dashboard Integration

Authentication already works correctly, but many dashboard statistics are still using mock or static data.

Replace every dashboard card with real Firestore data.

Student Dashboard

Display real-time:

Active Reservations
Pending Reservations
Approved Reservations
Returned Equipment
Total Borrowed Equipment
Upcoming Returns
Recent Reservations
Latest Notifications
Faculty Dashboard

Display real-time:

Total Equipment Owned
Active Reservations
Pending Requests
Approved Requests
Returned Equipment
Equipment Added
Notifications
Recent Student Requests

Faculty should only see information related to their own equipment.

Admin Dashboard

Display real-time:

Total Equipment
Total Students
Total Faculty
Total Reservations
Pending Approvals
Borrowed Equipment
Returned Equipment
Low Stock Equipment
Recently Added Equipment
Recent Activities

Every statistic must come from Firestore.

3. Browse Equipment

The equipment list already appears.

However, clicking an equipment card currently does nothing or does not load properly.

Implement:

Click equipment card
Open Equipment Details page
Load equipment using Firestore document ID
Display:

• Equipment Image

• Equipment Name

• Description

• Category

• Department

• Owner

• Available Quantity

• Borrowed Quantity

• Condition

• Location

Students should be able to reserve equipment directly from this page.

Related equipment should also be displayed.

4. User Profile System

Build a complete profile system.

Every logged-in user should have a real profile page.

Supported roles:

Student
Faculty
Admin

Load data from:

Firebase Authentication




Firestore Users Collection

Display:

Profile Picture
Full Name
Email
Role
Department
Student ID
Employee ID
Course
Year Level
Section
Position
Office
Phone Number
Address
Registration Date
Account Status
Editable Information

Allow users to edit:

First Name
Last Name
Phone Number
Address
Profile Picture

Faculty:

Office
Position

Students:

Phone
Address

Admins:

Phone
Address

Save updates to Firestore.

Synchronize display name with Firebase Authentication.

5. User Information Across the System

User information should appear throughout the application.

For example:

Top Navigation

Display:

User avatar
User full name
Role

Dashboard Welcome Card

Example:

"Welcome back, Josh Real"

Display:

Name
Role
Department

Reservation pages

Instead of IDs, display:

Student Name
Faculty Name

Equipment Owner

Display faculty name instead of UID.

Notification sender

Display sender name.

History page

Display names instead of IDs.

6. Admin User Management

Improve User Management.

Admins should be able to:

View Students
View Faculty
View Admins

Each user card/table should display:

Profile Picture
Full Name
Email
Role
Department
Account Status
Date Registered

Actions:

View Profile
Edit User
Disable Account
Enable Account
Delete User

Changes should immediately update Firestore.

7. Admin Settings

Replace the "Coming Soon" page.

Build a complete Admin Settings module.

Include:

General
School Name
Logo
Contact Email
Reservation Settings
Maximum Reservation Days
Maximum Equipment per Reservation
Auto Cancel Pending Requests
Notification Settings

Enable/Disable:

Email Notifications
Reservation Notifications
Approval Notifications
Security
Change Password
Session Information
Email Verification

Save everything in Firestore.

8. Improve UI Design

Completely polish the interface.

The application should resemble modern software such as:

Notion
GitHub
Google Workspace
Microsoft 365
Linear

Improve:

Sidebar
Top Navigation
Cards
Tables
Modals
Buttons
Forms
Empty States
Loading Skeletons
Toast Notifications
Hover Effects
Page Transitions
Responsive Design
Consistent Spacing
Better Typography
Better Color Palette
Better Icons

Support:

Light Mode
Dark Mode
9. Notifications

Ensure every notification is functional.

Students receive:

Reservation Approved
Reservation Rejected
Return Reminder

Faculty receive:

Reservation Requests
Returned Equipment

Admins receive:

Pending Approvals
New Equipment
System Alerts

Notification badges should always display the real unread count.

10. Search & Filters

Make every search bar functional.

Support:

Equipment

Search by Name
Category
Department

Reservations

Student
Faculty
Status

Users

Name
Role
Department

Notifications

Search
Read
Unread
11. Performance

Use:

Firestore real-time listeners (onSnapshot) where appropriate
Pagination for large tables
Optimized Firestore queries
Lazy loading
Image optimization
Proper cleanup of listeners
Loading indicators
Error handling