Replace every hardcoded notification badge (red badge displaying values like "3" or "5") with real-time data from Firebase Firestore.

General Requirements
Remove all mock notification counts.
Connect badges to Firestore.
Use onSnapshot() for real-time updates.
Display badges only when the count is greater than 0.
Hide badges when the count equals 0.
Update badges instantly whenever Firestore data changes.
No page refresh should be required.
Use reusable notification badge components.
Badge Design

Keep the current UI.

Requirements

Red circular badge
White bold text
Auto-resize for 1–3 digits
Display 99+ if the count exceeds 99
Proper alignment with sidebar menu items
Smooth count animation when the value changes
Approval Badge

For the Admin dashboard:

Count all reservation requests where:

status == "pending"

Display the total beside the Approvals sidebar item.

Automatically decrease the badge when an approval or rejection occurs.

Student Notification Badge

For Students:

Count unread notifications assigned to the logged-in student.

Example notification types:

Reservation Approved
Reservation Rejected
Reservation Reminder
Return Reminder
Equipment Available
Overdue Reminder

Query example:

notifications
where userId == currentUser.uid
where isRead == false

Display the unread count beside the Notifications sidebar item.

Faculty Notification Badge

Faculty users should receive notifications for:

Equipment approval
Reservation updates
Borrow requests
Return requests
Faculty equipment approvals

Only unread notifications should be counted.

Admin Notification Badge

Admin notifications include:

Pending approvals
New equipment submissions
New reservation requests
Return confirmations
Overdue equipment
Low-stock alerts
System notifications

Each notification type should be expandable for future features.

Firestore Structure

Example

notifications
   notificationId
      userId
      role
      title
      message
      type
      isRead
      createdAt

Reservation example

reservations
   reservationId
      status
      studentId
      facultyId
      equipmentId
Notification Page

The Notifications page should display all notifications for the logged-in user.

Include:

Notification icon
Title
Message
Timestamp
Read/Unread indicator

Actions:

Mark as Read
Mark All as Read
Delete Notification
Filter by Type
Filter by Read/Unread

Unread notifications should automatically update the badge count.

Performance
Use Firestore onSnapshot()
Clean up listeners on component unmount
Avoid downloading unnecessary documents
Use reusable hooks for notification counts
Minimize Firestore reads
Expected Result

Every notification badge across Student, Faculty, and Admin dashboards should always display the correct unread or pending count in real time without requiring a page refresh.

PART 2 — Profile Settings Module

Replace the current "Coming Soon" Profile page with a complete profile management system.

The page must work for:

Student
Faculty
Admin
Load User Information

Retrieve user information from:

Firebase Authentication
Firestore

Display:

Profile Picture
Full Name
Email
Role
Department
Student ID
Employee ID
Phone Number
Address
Date Joined
Account Status

Role, Student ID, and Employee ID are read-only.

Editable Personal Information

Allow users to edit:

First Name
Last Name
Phone Number
Address
Department (if permitted)
Profile Picture

Email should remain read-only unless an email change feature with reauthentication is implemented.

Before saving:

Validate inputs
Display confirmation dialog

After saving:

Update Firestore
Update Firebase Authentication display name if necessary
Show success notification
Change Password

Create a secure password change section.

Fields:

Current Password
New Password
Confirm Password

Requirements:

Reauthenticate the user
Validate password strength
Minimum 8 characters
One uppercase letter
One lowercase letter
One number
Show/Hide password toggle
Display success and error messages
Profile Picture Upload

Use Cloudinary.

Features:

Upload image
Drag-and-drop support
Image preview
Replace existing image
Delete previous Cloudinary image when replaced
Upload progress indicator
Save Cloudinary URL to Firestore

Accepted formats:

JPG
PNG
WEBP

Maximum size:

5 MB

Account Information

Display read-only information:

UID
Email
Role
Registration Date
Last Login
Email Verification Status
Account Status
Security Section

Display:

Email Verified
Last Login
Last Password Change
Active Session

Future placeholder:

Two-Factor Authentication (2FA)
Preferences

Allow users to configure:

Theme

Light
Dark
System

Notification Preferences

Reservation Updates
Approval Notifications
Return Reminders
Equipment Availability
Email Notifications

Save preferences to Firestore.

Student-Specific Section

Display:

Student ID
Course
Year Level
Section

Students may edit:

Phone Number
Address

Student ID, Course, Year Level, and Section remain read-only.

Faculty-Specific Section

Display:

Employee ID
Department
Position
Office

Faculty may edit:

Office
Phone Number
Address

Employee ID remains read-only.

Admin-Specific Section

Display:

Role:

Admin

Permissions (read-only):

Manage Users
Manage Equipment
Approve Reservations
Reject Reservations
Manage Categories
View Reports
View Audit Logs
Firestore Structure
users
   uid
      firstName
      lastName
      fullName
      email
      role
      department
      studentId
      employeeId
      course
      yearLevel
      section
      office
      phone
      address
      photoURL
      preferences
      createdAt
      updatedAt

Always update:

updatedAt = serverTimestamp()
Firebase Authentication

Synchronize:

Display Name

updateProfile()

Password

updatePassword()

Require reauthentication before changing passwords.

UI/UX Requirements

Create a modern settings page similar to Google Workspace, Microsoft 365, GitHub, or Notion.

Include:

Large profile avatar
Upload Photo button
Card-based layout
Responsive grid
Editable forms
Save Changes button
Cancel button
Security section
Preferences section
Loading skeletons
Toast notifications
Confirmation dialog before saving
Smooth animations
Validation
Name fields cannot be empty
Phone number must be valid
Images must be under 5 MB
Passwords must meet security requirements
Prevent duplicate submissions
Display inline validation messages
Performance
Fetch profile once on page load
Use Firestore onSnapshot() for real-time profile updates
Cache user data where appropriate
Update only modified fields
Clean up listeners on unmount