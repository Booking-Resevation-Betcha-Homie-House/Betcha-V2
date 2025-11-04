# Nearest Properties Feature

## Overview
This feature allows users to discover properties near their current location by requesting geolocation access and displaying the 5 closest properties from the Betcha API.

## Features

### 🗺️ Geolocation Integration
- **Permission Detection**: Automatically checks if location permission is already granted
- **Smart Prompting**: Shows location request UI only when needed
- **Permission Handling**: Gracefully handles all permission states (granted, denied, prompt)

### 📍 Location-Based Search
- **Current Location**: Uses HTML5 Geolocation API to get user's coordinates
- **Distance Calculation**: Haversine formula to calculate accurate distances
- **Smart Sorting**: Automatically sorts properties by proximity

### 🏠 Property Cards
- **Rich Cards**: Beautiful property cards matching the site's design
- **Distance Display**: Shows exact distance from user location
- **Property Details**: Includes photos, ratings, prices, and capacity
- **Interactive**: Click cards to view property details

### 🎨 UI States
- **Permission Request**: Clean UI prompting for location access
- **Loading State**: Elegant loading animation while fetching data
- **Error Handling**: User-friendly error messages for various failure scenarios
- **Success State**: Horizontal scrolling carousel of nearby properties

## How It Works

### 1. Permission Check
```javascript
// Automatically checks permission status on page load
const permission = await navigator.permissions.query({ name: 'geolocation' });
```

### 2. Location Acquisition
```javascript
// Gets user's current coordinates with high accuracy
const position = await navigator.geolocation.getCurrentPosition(options);
```

### 3. API Integration
```javascript
// Fetches all properties from Betcha API
const response = await fetch('https://betcha-api.onrender.com/property/display');
```

### 4. Coordinate Extraction
The system extracts coordinates from Google Maps embed URLs using multiple patterns:
- `2s14.6874574,121.0877186` format
- `!2d121.0877186!3d14.6874574` format  
- `!3d14.6874574!2d121.0877186` format
- `center=14.6874574,121.0877186` format
- `q=14.6874574,121.0877186` format

### 5. Distance Calculation
Uses the Haversine formula for accurate distance calculation:
```javascript
const distance = calculateDistance(userLat, userLng, propertyLat, propertyLng);
```

### 6. Display
Shows the 5 nearest properties in an interactive carousel with:
- Property photos
- Star ratings
- Distance badges
- Price information
- Capacity details

## Usage

### HTML Structure
```html
<div id="nearestPropertiesSection">
  <!-- Location permission button -->
  <button id="locationPermissionBtn">Enable Location</button>
  
  <!-- Various UI states -->
  <div id="locationPermissionRequired">...</div>
  <div id="nearestPropertiesLoading">...</div>
  <div id="nearestPropertiesError">...</div>
  
  <!-- Property carousel -->
  <div id="nearestPropertiesCarousel">
    <div id="nearestPropertiesContainer">
      <!-- Property cards populated by JS -->
    </div>
  </div>
</div>
```

### JavaScript Integration
```html
<!-- Required scripts -->
<script type="module" src="/src/sideScrollCarousel.js"></script>
<script type="module" src="/src/nearestProperties.js"></script>
```

### CSS Dependencies
The feature uses Tailwind CSS classes and custom utilities:
```css
/* Line clamp utilities for text truncation */
.line-clamp-1 { /* ... */ }
.line-clamp-2 { /* ... */ }
```

## Browser Support

### Geolocation API
- ✅ Chrome 5+
- ✅ Firefox 3.5+
- ✅ Safari 5+
- ✅ Edge 12+
- ✅ iOS Safari 3.2+
- ✅ Android Browser 2.1+

### Permissions API
- ✅ Chrome 43+
- ✅ Firefox 46+
- ✅ Safari 16+
- ⚠️ Fallback for older browsers

## Error Handling

### Permission Denied
- Shows clear message explaining the need for location access
- Provides retry button
- Suggests checking browser settings

### Location Unavailable
- Handles GPS/network issues gracefully
- Provides retry functionality
- Shows helpful error messages

### API Failures
- Graceful degradation when API is unavailable
- User-friendly error messages
- Retry mechanisms

## Testing

### Test Page
A dedicated test page is available at `/test-nearest-properties.html` for development and debugging.

### Manual Testing
1. **Permission Grant**: Allow location when prompted
2. **Permission Deny**: Deny location and verify error handling
3. **Distance Accuracy**: Check if distance calculations are reasonable
4. **Card Interaction**: Verify cards link to property details correctly

## Files Modified

### Core Files
- `index.html` - Added nearest properties section
- `src/nearestProperties.js` - Main functionality
- `src/index.css` - Added line-clamp utilities

### Dependencies
- `src/sideScrollCarousel.js` - Carousel functionality
- Tailwind CSS - Styling framework
- Google Maps embed URLs - Coordinate extraction

## API Dependencies

### Betcha API
- **Endpoint**: `https://betcha-api.onrender.com/property/display`
- **Method**: GET
- **Response**: Array of property objects
- **Required Fields**: `mapLink`, `name`, `address`, `photoLinks`, `rating`, `packagePrice`

### Example API Response
```json
[
  {
    "_id": "68e884d58705c6444cfd5f1c",
    "name": "Ystella Room",
    "address": "Sandiganbayan Centennial Building, Commonwealth Avenue...",
    "mapLink": "<iframe src=\"https://www.google.com/maps/embed?pb=!1m18...\"",
    "photoLinks": ["https://drive.google.com/thumbnail?id=..."],
    "rating": 5,
    "packagePrice": 1199,
    "maxCapacity": 4
  }
]
```

## Performance Considerations

### Optimization
- **Coordinate Caching**: Extracted coordinates are cached per property
- **Distance Caching**: User location is cached for 5 minutes
- **Lazy Loading**: Property images load on demand
- **Efficient Sorting**: Single-pass distance calculation and sorting

### Bandwidth
- Only fetches necessary property data
- Optimized image sizes from Google Drive thumbnails
- Minimal API calls (single request for all properties)

## Future Enhancements

### Possible Improvements
- **Map Integration**: Show properties on an interactive map
- **Filter Options**: Filter by price, rating, capacity
- **Search Radius**: Let users adjust search radius
- **Favorites**: Save preferred properties
- **Offline Support**: Cache nearest properties for offline viewing