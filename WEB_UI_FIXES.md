# Web UI Fixes - Proper Sizing and Constraints

## Problem
Pages were stretching horizontally on web with no max-width constraints, making inputs and content too wide.

## Solution
Added web-specific constraints using `Platform.OS === 'web'` checks in StyleSheet definitions.

## Pattern Applied

### 1. Search Containers
```typescript
searchContainer: {
  // ... existing styles
  ...(Platform.OS === 'web' && {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  }),
}
```

### 2. Header/Content Sections
```typescript
headerContent: {
  padding: SPACING.lg,
  gap: SPACING.lg,
  ...(Platform.OS === 'web' && {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  }),
}
```

### 3. Scroll Content
```typescript
scrollContent: {
  padding: SPACING.lg,
  gap: SPACING.xl,
  ...(Platform.OS === 'web' && {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  }),
}
```

### 4. Search Sections
```typescript
searchSection: {
  flexDirection: 'row',
  padding: SPACING.lg,
  // ... existing styles
  ...(Platform.OS === 'web' && {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  }),
}
```

## Max Width Guidelines

- **Main Content**: 1200px
- **Search Inputs**: 600px
- **Forms**: 600-800px
- **Cards/Modals**: 800-1000px

## Pages Updated

✅ `app/(tabs)/funding.tsx` - Search container and header content
✅ `app/(tabs)/network.tsx` - Search section and search bar
✅ `components/Input.tsx` - Removed fixed max-width (now handled by containers)
✅ `components/WebContainer.tsx` - New utility component for web constraints
✅ `utils/webStyles.ts` - Utility functions for web styling

## Remaining Pages to Update

Apply the same pattern to:
- `app/(tabs)/feed.tsx`
- `app/(tabs)/help.tsx`
- `app/(tabs)/mentorship.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/settings.tsx`
- `app/(tabs)/webinars.tsx`
- `app/(tabs)/subscription.tsx`
- `app/(tabs)/startup-profile.tsx`
- `app/(tabs)/startup-discovery.tsx`
- `app/(tabs)/startup-detail.tsx`
- `app/(tabs)/sessions.tsx`
- All other pages with `scrollContent` or `searchSection` styles

## How to Apply

1. Find `searchSection`, `searchContainer`, `scrollContent`, or `headerContent` in styles
2. Add the web constraint pattern:
   ```typescript
   ...(Platform.OS === 'web' && {
     maxWidth: 1200, // or 600 for inputs
     alignSelf: 'center',
     width: '100%',
   }),
   ```
3. Ensure `Platform` is imported from `react-native`

## Notes

- These constraints only apply on web (Platform.OS === 'web')
- Mobile remains unchanged (full width)
- All content is centered on web
- Inputs are constrained to readable widths
