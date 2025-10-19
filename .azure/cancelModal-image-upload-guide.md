# Cancel Modal Image Upload Feature

## Overview
Added an image file input with preview functionality to the `cancelModal` in all admin pages. This allows admins to attach images when reviewing cancellation requests.

## Features

### 1. **File Upload Button**
- Drag-and-drop style button with icon
- Hover effects with color transition
- Opens file picker on click

### 2. **Image Preview**
- Displays uploaded image with proper sizing (max 300px height)
- Shows image filename and file size
- Dark overlay at bottom for better text visibility
- Remove button (X) in top-right corner

### 3. **Validation**
- Only accepts image files (image/*)
- Maximum file size: 5MB
- Shows error notifications for invalid files

### 4. **User Experience**
- Upload button hides when image is selected
- Preview shows immediately after selection
- Easy removal with X button
- Auto-resets when modal closes
- Smooth transitions and hover effects

## Implementation Details

### JavaScript Functions Added

#### `initializeCancelModalImageUpload(modal)`
- Dynamically creates the image upload UI
- Adds event listeners for upload, preview, and removal
- Validates file type and size
- Stores selected file for later access

#### `formatFileSize(bytes)`
- Helper function to display file sizes in human-readable format
- Converts bytes to KB, MB, GB automatically

### Accessing the Uploaded Image

To get the uploaded image file from other code:

```javascript
// Method 1: Via modal reference
const cancelModal = document.getElementById('cancelModal');
const imageFile = cancelModal?.getCancelImage();

// Method 2: Via global function
const imageFile = window.AdminNotifications.getCancelModalImage();

if (imageFile) {
    console.log('Image selected:', imageFile.name, imageFile.size);
    // Use the file for upload, FormData, etc.
    const formData = new FormData();
    formData.append('cancellationImage', imageFile);
}
```

## UI Structure

```html
<div id="cancelImageUploadContainer">
  <label>Attach Image (Optional):</label>
  
  <!-- Hidden file input -->
  <input type="file" id="cancelImageInput" accept="image/*" />
  
  <!-- Upload button (visible when no image) -->
  <button id="cancelImageUploadBtn">
    [Icon] Click to upload image
  </button>
  
  <!-- Preview container (visible when image selected) -->
  <div id="cancelImagePreviewContainer">
    <img id="cancelImagePreview" />
    <button id="cancelImageRemoveBtn">[X]</button>
    <div class="image-info">
      <p id="cancelImageFileName">filename.jpg</p>
      <p id="cancelImageFileSize">1.2 MB</p>
    </div>
  </div>
</div>
```

## Styling Classes Used

- `border-dashed` - Dashed border for upload button
- `hover:border-primary` - Primary color on hover
- `group` / `group-hover:` - Parent-child hover effects
- `rounded-lg` - Rounded corners for preview
- `shadow-lg` - Shadow for remove button
- `bg-gradient-to-t` - Gradient overlay for image info
- `transition-all duration-300` - Smooth animations

## Browser Support

- Works in all modern browsers
- Uses FileReader API for image preview
- Supports drag-and-drop file input
- Mobile-friendly with responsive design

## Future Enhancements

Consider adding:
1. Multiple image upload support
2. Image compression before upload
3. Crop/rotate functionality
4. Drag-and-drop directly on preview area
5. Progress indicator for large files
6. Image format conversion (e.g., HEIC to JPEG)

## Notes

- Image is stored in memory until modal closes or removed
- No automatic upload - you need to handle submission
- Image resets when modal closes (prevents accidental reuse)
- Works across all admin pages consistently
