# Play Review Dashboard - Implementation Summary

## Overview
Created a new Play Review Dashboard component for coaches to review AI-generated plays before publishing them to the team.

## File Created
**Path**: `src/app/coach/review/page.tsx`

## Features Implemented

### 1. Draft Plays List View
- Displays all plays with `status: 'draft'`
- Shows key metadata: play name, formation, type, creation date
- Visual indicators for draft status
- Click to select and review individual plays

### 2. Detailed Play Review Interface
**Play Information:**
- Play name and short name
- Play type (PASS, RUN, RPO, SCREEN) with color coding
- Formation name and concept
- Creation timestamp
- Current status

**AI-Generated Content:**
- Expandable AI Insights section showing AI analysis
- Generated flashcards with:
  - Question and answer pairs
  - Difficulty levels (beginner, intermediate, advanced)
  - Position relevance
  - Category tags
  - Card count indicator

### 3. Review Actions
**Approve & Publish:**
- Updates play status to 'approved'
- Sets `isPublished: true`
- Makes play visible to players
- Removes from review queue
- Optional review notes

**Reject:**
- Updates play status to 'rejected'
- Requires review notes (reason for rejection)
- Keeps play as draft for regeneration
- Does not publish

### 4. Review Notes
- Text area for coach feedback
- Required for rejections
- Optional for approvals
- Stored per-play basis during review session

### 5. Empty State
- Friendly "All Caught Up" message when no drafts
- Explains where reviewed plays will appear

## Technical Details

### Hooks Used
- `useAuth()` - Get orgId, session, user role
- `usePlays({ status: 'draft' })` - Fetch draft plays
- `useUpdatePlayStatus()` - Approve/reject actions
- `useFlashcards({ playId })` - Fetch flashcards for selected play

### API Endpoints Used
- `GET /api/plays?status=draft` - List draft plays
- `GET /api/flashcards?playId=xxx` - Get flashcards for play
- `PATCH /api/plays/:id/status` - Update play status (approve/reject)

### State Management
- Selected play tracking
- Expandable sections (insights, flashcards)
- Review notes per play
- Loading and error states

### UI/UX Features
- Responsive layout with sidebar list + detail view
- Color-coded play types
- Expandable/collapsible content sections
- Sticky action buttons at bottom
- Loading states with spinner
- Error handling with retry button
- Confirmation dialogs for actions
- Visual feedback for status changes

## User Flow

### Review Process
1. Coach navigates to `/coach/review`
2. See list of all draft plays pending review
3. Click on a play to view details
4. Review AI insights and generated flashcards
5. Add optional notes about the play
6. Choose action:
   - **Approve & Publish**: Play goes live immediately
   - **Reject**: Play stays as draft with notes for regeneration

### After Approval
- Play status changes to 'approved'
- Play is published (`isPublished: true`)
- Play appears in coach playbook
- Play is visible to players
- Removed from review queue

### After Rejection
- Play status changes to 'rejected'
- Play stays in drafts
- Coach notes preserved for reference
- Can be regenerated later
- Not visible to players

## Styling
- Uses consistent glass-card design pattern
- Color scheme matches app theme:
  - Primary: #00F6E5 (cyan)
  - Background: #0A0F12 (dark)
  - Cards: #1B1E20 (dark gray)
  - Borders: #2A2E30 (lighter gray)
- Hover states and transitions
- Proper spacing and typography

## Integration Points

### Navigation
Add link to sidebar navigation (in SidebarLayout component):
```tsx
{
  name: 'Review Plays',
  href: '/coach/review',
  icon: CheckCircleIcon,
  badge: draftCount, // Number of pending reviews
}
```

### Notifications
Could add:
- Badge showing count of plays pending review
- Email/push notifications when new plays need review
- Dashboard widget showing review queue size

## Future Enhancements

### Short Term
1. Batch operations (approve/reject multiple plays at once)
2. Filters (by play type, formation, date range)
3. Search functionality
4. Sort options (newest first, by play type, etc.)
5. Edit play metadata inline
6. Regenerate play button

### Medium Term
1. Preview play assignments
2. Compare multiple versions of same play
3. Collaborate with other coaches (comments, tags)
4. Analytics on approval/rejection rates
5. Auto-approve based on confidence scores

### Long Term
1. AI-assisted review suggestions
2. A/B testing framework for plays
3. Player performance tracking post-approval
4. Automated quality checks before review
5. Integration with video analysis

## Testing Checklist

### Manual Testing
- [ ] Page loads correctly for authenticated coach
- [ ] Draft plays list displays properly
- [ ] Selecting a play shows correct details
- [ ] AI insights display correctly
- [ ] Flashcards load and display
- [ ] Review notes can be entered
- [ ] Approve action works (status updates, play published)
- [ ] Reject action works (requires notes, status updates)
- [ ] Empty state shows when no drafts
- [ ] Error states handled gracefully
- [ ] Loading states display properly
- [ ] Responsive layout works on different screen sizes

### Integration Testing
- [ ] Approved play appears in coach playbook
- [ ] Approved play visible to players
- [ ] Rejected play stays as draft
- [ ] Flashcards remain associated with play after approval
- [ ] Play assignments remain associated with play after approval
- [ ] Review action triggers re-fetch of plays list
- [ ] Selected play deselects after action completes

### Edge Cases
- [ ] No plays pending review (empty state)
- [ ] Single play pending review
- [ ] Many plays (20+) pending review
- [ ] Play with no flashcards generated
- [ ] Play with no AI insights
- [ ] Network error during approval
- [ ] Auth token expired during review
- [ ] Multiple coaches reviewing same play simultaneously

## Security Considerations

### Authorization
- Only coaches can access this page
- Players redirected or shown error
- Admins can also access (inherited coach permissions)

### Data Validation
- Play ID validated before actions
- Status transitions validated on backend
- Auth token required for all API calls
- Org-scoped access enforced

### Rate Limiting
- Consider rate limiting for approve/reject actions
- Prevent spam or abuse

## Performance

### Optimizations
- Only fetches flashcards for selected play (not all plays)
- Uses React hooks for efficient re-rendering
- Lazy loading of content sections (expandable)
- Debounce review notes input if implementing auto-save

### Potential Issues
- Large number of draft plays (100+) could slow list rendering
  - Solution: Implement pagination or virtual scrolling
- Large number of flashcards per play (50+) could slow detail view
  - Solution: Implement pagination for flashcards

## Metrics to Track

### Usage Metrics
- Number of plays reviewed per coach per day
- Average time spent reviewing each play
- Approval vs rejection rate
- Time from draft creation to approval

### Quality Metrics
- Player performance on approved plays
- Flashcard accuracy rates
- Play usage frequency after approval
- Re-generation requests after rejection

## Documentation Links
- API Documentation: `COMPLETE_API_TESTING_GUIDE.md`
- Frontend Integration Status: `FRONTEND_INTEGRATION_STATUS.md`
- Play Recognition Refactoring: `PLAY_RECOGNITION_REFACTORING_SUMMARY.md`

---

**Created**: 2024-01-25
**Status**: ✅ Complete - Ready for Testing
**Next**: Add navigation link to sidebar, test with real data
