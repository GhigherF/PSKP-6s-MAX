# Tasks: Email Change Improvement

## Phase 1: Create Design
- [x] Create design document with comprehensive technical specifications
- [x] Include architecture diagrams and sequence diagrams
- [x] Define components, interfaces, and data models
- [x] Specify algorithms with formal pre/post-conditions
- [x] Document correctness properties and error handling
- [x] Outline testing strategy and security considerations

## Phase 2: Derive Requirements
- [x] Analyze design to extract functional requirements
- [x] Document non-functional requirements (performance, security)
- [x] Create user stories and acceptance criteria
- [x] Define API specifications and data contracts
- [x] Specify UI/UX requirements and design system updates

## Phase 3: Create Implementation Tasks
- [x] Break down requirements into executable tasks
- [x] Create backend implementation tasks (API endpoints, database)
- [x] Create frontend implementation tasks (components, styling)
- [x] Define testing tasks (unit, integration, property-based)
- [x] Create deployment and migration tasks


## Implementation Tasks Breakdown

### Backend Implementation Tasks

#### Task B1: Database Migration
- [ ] Create migration script for `email_change_tokens` table
- [ ] Add indexes for performance optimization
- [ ] Test migration rollback procedure
- [ ] Update database initialization script (`db/init.sql`)

#### Task B2: Email Change Request Endpoint
- [ ] Implement POST `/api/users/me/email-change-request` endpoint
- [ ] Add input validation for email format
- [ ] Check email uniqueness against existing users
- [ ] Generate JWT token with 24-hour expiration
- [ ] Store token in `email_change_tokens` table
- [ ] Implement rate limiting (3 requests per hour)
- [ ] Add logging for audit trail

#### Task B3: Email Sending Implementation
- [ ] Set up email service configuration (development/production)
- [ ] Create email template with token placeholder
- [ ] Implement development mode: log token to console
- [ ] Implement production mode: send actual email
- [ ] Add error handling for email sending failures
- [ ] Create email content with clear instructions

#### Task B4: Email Change Confirmation Endpoint
- [ ] Implement POST `/api/users/me/email-change-confirm` endpoint
- [ ] Validate JWT token signature and expiration
- [ ] Verify token exists in database and matches user
- [ ] Update user email in `users` table
- [ ] Delete used token from database
- [ ] Send confirmation emails to old and new addresses
- [ ] Return updated user data in response

#### Task B5: Backend Testing
- [ ] Write unit tests for email validation logic
- [ ] Write integration tests for API endpoints
- [ ] Test token generation and verification
- [ ] Test rate limiting functionality
- [ ] Test database operations and error cases
- [ ] Test email sending (mock implementation)

### Frontend Implementation Tasks

#### Task F1: CSS Styling Updates
- [ ] Create new `.btn-email-change` CSS class
- [ ] Update existing `.btn-email-stub` references
- [ ] Ensure consistent styling with design system
- [ ] Add hover, focus, and active states
- [ ] Implement responsive design for mobile
- [ ] Verify accessibility (contrast, sizing, focus)

#### Task F2: ProfilePage Component Updates
- [ ] Update header email button with new styling
- [ ] Update edit form email button with new styling
- [ ] Implement navigation from header to edit tab
- [ ] Add smooth scrolling to email field
- [ ] Integrate EmailChangeModal component
- [ ] Update user email in UI after successful change

#### Task F3: EmailChangeModal Component
- [ ] Create React component with two-step flow
- [ ] Implement email input with real-time validation
- [ ] Implement token input field with copy functionality
- [ ] Add loading states and error display
- [ ] Integrate with backend API endpoints
- [ ] Implement success/error handling and callbacks
- [ ] Add accessibility features (focus trap, ARIA)

#### Task F4: Token Display and Guidance
- [ ] Add development mode token display
- [ ] Implement copy-to-clipboard functionality
- [ ] Add clear instructions for token usage
- [ ] Create placeholder text for token input
- [ ] Add help text about token expiration
- [ ] Implement resend email functionality

#### Task F5: Frontend Testing
- [ ] Write unit tests for EmailChangeModal component
- [ ] Test form validation and error handling
- [ ] Test API integration with mocked responses
- [ ] Test navigation and scrolling functionality
- [ ] Test accessibility features
- [ ] Test responsive design across screen sizes

### Integration and Deployment Tasks

#### Task I1: Environment Configuration
- [ ] Add environment variables for email service
- [ ] Configure development vs production email settings
- [ ] Set up feature flags if needed
- [ ] Update deployment configuration (Docker, etc.)

#### Task I2: Integration Testing
- [ ] Test complete email change flow end-to-end
- [ ] Test error scenarios (network failures, invalid tokens)
- [ ] Test rate limiting behavior
- [ ] Test concurrent requests handling
- [ ] Test database consistency after operations

#### Task I3: Deployment Preparation
- [ ] Create deployment checklist
- [ ] Prepare rollback plan
- [ ] Set up monitoring and alerting
- [ ] Update documentation for new feature
- [ ] Train support team on new functionality

#### Task I4: Post-Deployment Verification
- [ ] Verify feature works in production environment
- [ ] Monitor error rates and performance metrics
- [ ] Collect user feedback on new flow
- [ ] Address any issues discovered in production
- [ ] Optimize based on usage patterns