# Button Web UI Fixes - Centered, Proper Width

## Problem
All buttons were stretching from left to right across the full width on web, making the UI look unprofessional.

## Solution
Added web-specific constraints to all button styles using `Platform.OS === 'web'` checks.

## Pattern Applied

### 1. Buttons with width: '100%'
```typescript
buttonStyle: {
  width: '100%',
  // ... other styles
  ...(Platform.OS === 'web' && {
    maxWidth: 400, // or 200-300 for smaller buttons
    alignSelf: 'center',
    width: 'auto',
  }),
}
```

### 2. Buttons with flex: 1
```typescript
buttonStyle: {
  flex: 1,
  // ... other styles
  ...(Platform.OS === 'web' && {
    flex: 0, // Override flex on web
    maxWidth: 200, // or 300-400
    alignSelf: 'center',
    minWidth: 150, // Ensure minimum readable width
  }),
}
```

### 3. Button Component (components/Button.tsx)
Updated base button component to have web constraints:
```typescript
buttonWeb: {
  cursor: 'pointer',
  maxWidth: 400,
  alignSelf: 'center',
  minWidth: 120,
}
```

## Max Width Guidelines

- **Primary Action Buttons** (Login, Register, Submit): 400px
- **Secondary Buttons** (Message, Connect, Join): 200-300px
- **Small Action Buttons** (Schedule, Request): 200px
- **Create/Add Buttons**: 300px

## Pages Updated

✅ `components/Button.tsx` - Base button component
✅ `app/(auth)/login.tsx` - Login button
✅ `app/(auth)/register.tsx` - Register button
✅ `app/(auth)/reset-password.tsx` - Submit button
✅ `app/(auth)/email-verified.tsx` - Login button
✅ `app/(auth)/check-email-reset.tsx` - Login button
✅ `app/(tabs)/feed.tsx` - Create button
✅ `app/(tabs)/webinars.tsx` - Create and Join buttons
✅ `app/(tabs)/startup-profile.tsx` - Save button
✅ `app/(tabs)/sessions.tsx` - Message and Reschedule buttons
✅ `app/(tabs)/investor-dashboard.tsx` - Connect button
✅ `app/(tabs)/startup-discovery.tsx` - Connect button
✅ `app/(tabs)/mentorship.tsx` - Message and Request buttons
✅ `app/(tabs)/funding-status.tsx` - Message and Schedule buttons

## Remaining Pages to Update

Apply the same pattern to any remaining buttons:
- Check all `TouchableOpacity` with button styles
- Look for `width: '100%'` or `flex: 1` in button styles
- Add web constraints using the pattern above

## How to Apply

1. Find button style definitions with `width: '100%'` or `flex: 1`
2. Add web constraint pattern:
   ```typescript
   ...(Platform.OS === 'web' && {
     maxWidth: 200-400, // Based on button type
     alignSelf: 'center',
     width: 'auto', // If replacing width: '100%'
     flex: 0, // If overriding flex: 1
     minWidth: 150, // Optional, for readability
   }),
   ```
3. Ensure `Platform` is imported from `react-native`

## Notes

- Buttons are now centered and properly sized on web
- Mobile remains unchanged (full width or flex as needed)
- All buttons have readable, professional widths
- No more stretched buttons from edge to edge
