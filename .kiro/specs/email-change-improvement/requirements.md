# Requirements: Email Change Improvement

## Overview
This document specifies the requirements for improving the email change functionality in the social media application. The current implementation has a stub function that only shows an alert, and the email change buttons have inconsistent styling. This feature will implement a secure email change flow with verification and improve the user interface.

## Functional Requirements

### FR1: Enhanced Email Change Button Styling
**Description**: Update the CSS for email change buttons to match the overall application style consistently.

**Acceptance Criteria**:
- [ ] Email change buttons use consistent styling across all instances
- [ ] Button styles match the application's design system (colors, borders, spacing)
- [ ] Buttons have proper hover, focus, and active states
- [ ] Buttons are accessible with sufficient color contrast and proper sizing
- [ ] Header button and edit form button have slightly different sizing but same visual style

**Technical Specifications**:
- CSS classes: `.btn-email-change` (new), update existing `.btn-email-stub`
- Use CSS variables from design system: `--accent`, `--border`, `--bg-card`, etc.
- Responsive design: buttons adapt to different screen sizes
- Accessibility: minimum 4.5:1 contrast ratio, proper focus indicators

### FR2: Header Button Navigation
**Description**: The email change button in the profile header should navigate to the profile edit tab.

**Acceptance Criteria**:
- [ ] Clicking header email button changes active tab to 'edit'
- [ ] Page scrolls smoothly to email field in edit form
- [ ] Email change modal opens automatically after navigation
- [ ] User remains on same profile page (no page reload)
- [ ] Navigation works correctly for both own profile and other users' profiles

**Technical Specifications**:
- Use React Router for navigation within same page
- Implement smooth scrolling to `.edit-email-row` element
- Set `tab` state to `'edit'` in ProfilePage component
- Open `EmailChangeModal` after navigation completes

### FR3: Email Change Request Flow
**Description**: Implement backend API for requesting email change with token generation.

**Acceptance Criteria**:
- [ ] POST `/api/users/me/email-change-request` endpoint accepts new email
- [ ] Endpoint validates email format and uniqueness
- [ ] Generates JWT token with 24-hour expiration
- [ ] Stores token in database for verification
- [ ] Returns success response with token (in development) or confirmation message
- [ ] Rate limits: maximum 3 requests per hour per user

**Technical Specifications**:
- Request body: `{ new_email: string }`
- Response: `{ success: boolean, message: string, token?: string }`
- Database table: `email_change_tokens` with columns: `id`, `user_id`, `new_email`, `token`, `expires_at`, `created_at`
- Token format: JWT with payload `{ user_id, new_email, type: 'email_change', exp, iat }`

### FR4: Email Sending with Test Content
**Description**: Send verification email with test content and token information.

**Acceptance Criteria**:
- [ ] In development: log token to console with clear message
- [ ] In production: send actual email with verification link
- [ ] Email contains clear instructions for token usage
- [ ] Email includes the verification token or link
- [ ] Email template matches application branding
- [ ] Fallback: display token in UI if email sending fails

**Technical Specifications**:
- Development mode: `console.log(`[DEV] Email change token: ${token}`)`
- Production: Integrate with email service (Nodemailer, SendGrid, etc.)
- Email content: Include application name, user name, token, expiration time
- Token placeholder: `{{TOKEN}}` in email template

### FR5: Token Verification and Email Update
**Description**: Implement backend API for verifying token and updating user email.

**Acceptance Criteria**:
- [ ] POST `/api/users/me/email-change-confirm` endpoint accepts token
- [ ] Validates token signature and expiration
- [ ] Verifies token matches stored database record
- [ ] Updates user email in `users` table
- [ ] Invalidates used token (delete or mark as used)
- [ ] Sends confirmation emails to old and new email addresses
- [ ] Returns updated user data in response

**Technical Specifications**:
- Request body: `{ token: string }`
- Response: `{ success: boolean, user: UserObject, message: string }`
- Database update: `UPDATE users SET email = $1 WHERE id = $2`
- Token cleanup: `DELETE FROM email_change_tokens WHERE token = $1`

### FR6: Frontend Email Change Modal
**Description**: Create React modal component for email change workflow.

**Acceptance Criteria**:
- [ ] Modal with two-step flow: email input → token verification
- [ ] Shows current email address
- [ ] Validates email format in real-time
- [ ] Displays loading states during API calls
- [ ] Shows success/error messages appropriately
- [ ] Closes automatically on success with callback to parent
- [ ] Accessible with keyboard navigation and screen reader support

**Technical Specifications**:
- Component: `EmailChangeModal` with props `isOpen`, `onClose`, `currentEmail`, `onSuccess`
- State management: `step`, `newEmail`, `token`, `loading`, `error`, `tokenSent`
- Form validation: email regex, required fields, error display
- API integration: `requestEmailChange()`, `confirmEmailChange()` functions

### FR7: User Guidance on Token Usage
**Description**: Provide clear instructions on what token to insert and where.

**Acceptance Criteria**:
- [ ] Modal shows "Check your email for verification token" message
- [ ] In development: displays token directly in UI with copy button
- [ ] Instructions: "Enter the 6-digit code from your email"
- [ ] Placeholder text: "Paste token from email"
- [ ] Help text: "Token expires in 24 hours"
- [ ] Option to resend email if token not received

**Technical Specifications**:
- UI elements: instructional text, token input field, help text
- Development feature: `{process.env.NODE_ENV === 'development' && <TokenDisplay />}`
- Copy functionality: `navigator.clipboard.writeText(token)`
- Resend functionality: call `requestEmailChange()` again with same email

## Non-Functional Requirements

### NFR1: Performance Requirements
- Email change request response time: < 500ms
- Token verification response time: < 300ms
- Modal open/close animation: < 200ms
- Bundle size impact: < 10KB additional (gzipped)
- Database query performance: indexed lookups for tokens

### NFR2: Security Requirements
- Token expiration: 24 hours maximum
- Rate limiting: 3 requests per hour per user
- Input validation: all email inputs sanitized
- CSRF protection: tokens only in authenticated requests
- Audit logging: all email change attempts logged
- Password confirmation: optional for sensitive operations

### NFR3: Accessibility Requirements
- WCAG 2.1 AA compliance for all new UI elements
- Keyboard navigation support for modal
- Screen reader announcements for state changes
- Sufficient color contrast (4.5:1 minimum)
- Focus management: trap focus in modal, return focus on close

### NFR4: Compatibility Requirements
- Browser support: Chrome, Firefox, Safari, Edge (last 2 versions)
- Mobile responsive: works on screens ≥ 320px width
- React compatibility: React 18+
- API compatibility: maintains backward compatibility with existing endpoints

## User Stories

### US1: As a user, I want to change my email address
**Scenario**: User wants to update their email address to a new one
**Given** I am logged into my account
**When** I navigate to my profile page
**And** I click the "Change Email" button
**Then** I should see a modal to enter my new email address
**And** I should receive a verification email with a token

### US2: As a user, I want to verify my new email address
**Scenario**: User receives verification email and wants to confirm change
**Given** I have requested an email change
**And** I have received a verification email
**When** I enter the token from the email
**Then** my email should be updated in the system
**And** I should see a confirmation message

### US3: As a user, I want consistent button styling
**Scenario**: User notices email change buttons look different from other buttons
**Given** I am viewing the profile page
**When** I look at the email change buttons
**Then** they should match the style of other buttons in the app
**And** they should have proper hover and focus states

### US4: As a user, I want clear navigation to email change
**Scenario**: User wants to change email from profile header
**Given** I am viewing my profile header
**When** I click the email change button next to my email
**Then** I should be taken to the edit tab
**And** the email field should be in view
**And** the email change modal should open automatically

## API Specifications

### Endpoint 1: Request Email Change
```
POST /api/users/me/email-change-request
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "new_email": "newuser@example.com"
}

Response (200):
{
  "success": true,
  "message": "Verification email sent to newuser@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // development only
}

Response (400):
{
  "success": false,
  "error": "Invalid email format"
}

Response (409):
{
  "success": false,
  "error": "Email already registered"
}
```

### Endpoint 2: Confirm Email Change
```
POST /api/users/me/email-change-confirm
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200):
{
  "success": true,
  "user": {
    "id": 1,
    "nick": "alice",
    "email": "newuser@example.com",
    "role": "user",
    "avatar_url": null,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Email updated successfully"
}

Response (400):
{
  "success": false,
  "error": "Invalid or expired token"
}
```

## Data Contracts

### EmailChangeRequest DTO
```typescript
interface EmailChangeRequestDTO {
  new_email: string; // Required, valid email format, not same as current
}

interface EmailChangeResponseDTO {
  success: boolean;
  message: string;
  token?: string; // Optional, only in development
}
```

### EmailChangeConfirmation DTO
```typescript
interface EmailChangeConfirmationDTO {
  token: string; // Required, valid JWT token
}

interface EmailChangeConfirmationResponseDTO {
  success: boolean;
  user?: UserDTO; // Updated user object
  message: string;
}
```

### User DTO
```typescript
interface UserDTO {
  id: number;
  nick: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}
```

## UI/UX Requirements

### Design System Updates
- **Button Styles**: Consistent with `.btn-subscribe` and `.auth-btn`
- **Color Palette**: Use `--accent` for primary actions, `--border` for outlines
- **Spacing**: Consistent padding (8px/16px), margins, and gaps
- **Typography**: Use system font stack with consistent sizes (13px/14px/15px)
- **Border Radius**: `var(--radius-sm)` (8px) for inputs and buttons

### Modal Design
- **Overlay**: Semi-transparent dark overlay (rgba(0,0,0,0.5))
- **Content Area**: White/light background with card styling
- **Header**: Title with close button
- **Form Fields**: Consistent with `.auth-input` styling
- **Buttons**: Primary action button styled as `.auth-btn`
- **Transitions**: Fade in/out with 200ms duration

### Responsive Design
- **Mobile (< 768px)**: Full-width modal, stacked form fields
- **Tablet (768px-1024px)**: Modal width 80% of screen, max 500px
- **Desktop (> 1024px)**: Modal width 500px fixed, centered

### Accessibility Features
- **Focus Trap**: Tab key cycles within modal only
- **Escape Key**: Closes modal
- **ARIA Labels**: Proper roles and labels for screen readers
- **Focus Management**: Returns focus to triggering element on close
- **Error Announcements**: Live region for error messages

## Database Schema Updates

### New Table: email_change_tokens
```sql
CREATE TABLE email_change_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email VARCHAR(100) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_email_change_tokens_user_id (user_id),
  INDEX idx_email_change_tokens_expires_at (expires_at),
  INDEX idx_email_change_tokens_token (token)
);
```

### Index Recommendations
- Existing `users.email`: Already has UNIQUE constraint
- New indexes for performance on `email_change_tokens` table

## Migration Strategy
1. Create `email_change_tokens` table with migration script
2. Deploy backend with new API endpoints
3. Update frontend with new components and styling
4. Test complete flow in development environment
5. Deploy to production with feature flag if needed
6. Monitor for issues and rollback plan available