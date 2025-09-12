function amenitiesHandler() {
  return {
    amenities: [],
    newAmenity: '',
    
    addAmenity() {
      const trimmedAmenity = this.newAmenity.trim();
      
      // Validate input
      if (trimmedAmenity === '') {
        console.warn('⚠️ Cannot add empty amenity');
        return;
      }
      
      if (trimmedAmenity.length > 50) {
        console.warn('⚠️ Amenity name too long (max 50 characters)');
        return;
      }
      
      // Check if the amenity already exists (case-insensitive)
      if (this.amenities.some(amenity => amenity.name.toLowerCase() === trimmedAmenity.toLowerCase())) {
        console.warn('⚠️ Amenity already exists:', trimmedAmenity);
        // You could trigger a toast notification here
        this.newAmenity = ''; // Clear the input
        return;
      }
      
      // Add the new amenity
      this.amenities.push({ 
        name: trimmedAmenity, 
        checked: false 
      });
      this.newAmenity = '';
      console.log('✅ Custom amenity added:', trimmedAmenity);
      
      // You could trigger a success toast notification here
    },
    
    removeAmenity(index) {
      if (index >= 0 && index < this.amenities.length) {
        const removedAmenity = this.amenities[index];
        this.amenities.splice(index, 1);
        console.log('🗑️ Custom amenity removed:', removedAmenity.name);
      }
    },
    
    // Method to load existing custom amenities when editing a property
    loadCustomAmenities(customAmenities) {
      if (Array.isArray(customAmenities)) {
        this.amenities = customAmenities.map(amenity => ({
          name: typeof amenity === 'string' ? amenity : amenity.name,
          checked: typeof amenity === 'object' ? (amenity.checked || false) : false
        }));
        console.log('📋 Loaded custom amenities:', this.amenities);
      }
    },
    
    // Method to get all checked custom amenities
    getCheckedAmenities() {
      return this.amenities.filter(amenity => amenity.checked).map(amenity => amenity.name);
    },
    
    // Method to get all custom amenities (for saving)
    getAllCustomAmenities() {
      return this.amenities.map(amenity => ({
        name: amenity.name,
        checked: amenity.checked
      }));
    },
    
    // Helper method to check if an amenity name is valid
    isValidAmenityName(name) {
      const trimmed = name.trim();
      return trimmed.length > 0 && 
             trimmed.length <= 50 && 
             !this.amenities.some(amenity => amenity.name.toLowerCase() === trimmed.toLowerCase());
    }
  }
}