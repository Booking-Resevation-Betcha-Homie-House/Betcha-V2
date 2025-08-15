function amenitiesHandler() {
  return {
    amenities: [],
    newAmenity: '',
    addAmenity() {
      if (this.newAmenity.trim() !== '') {
        this.amenities.push({ name: this.newAmenity.trim(), checked: false });
        this.newAmenity = '';
      }
    },
    removeAmenity(index) {
      this.amenities.splice(index, 1);
    }
  }
}