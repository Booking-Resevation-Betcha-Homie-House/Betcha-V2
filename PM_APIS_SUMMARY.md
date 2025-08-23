# PM APIs Summary - All APIs Used in Property Monitoring Functions

## Overview
This document lists all the APIs used in the Property Monitoring (PM) functions, their purposes, request/response formats, and expected outputs.

## API Base URL
```
https://betcha-api.onrender.com
```

---

## 1. Role Privileges API

### **Endpoint**
```
GET /role/{roleID}
```

### **Purpose**
Fetch user role privileges for access control and sidebar filtering

### **Request**
- **Method**: GET
- **Headers**: `Content-Type: application/json`
- **Parameters**: `roleID` in URL path

### **Expected Response**
```json
{
  "role": {
    "_id": "role-id",
    "name": "Role Name",
    "privileges": ["PM", "PSR", "TK", "TS"]
  }
}
```

### **Used In**
- `fetchRolePrivileges()` function
- `checkRolePrivileges()` function
- `filterSidebarByPrivileges()` function

### **Status Codes**
- `200`: Success
- `404`: Role not found
- `500`: Server error

---

## 2. PM Check-in Today API

### **Endpoint**
```
POST /pm/bookings/checkinToday
```

### **Purpose**
Fetch today's check-ins and check-outs for specified properties

### **Request**
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "propertyIds": ["property-id-1", "property-id-2"]
}
```

### **Expected Response**
```json
[
  {
    "_id": "booking-id-1",
    "nameOfProperty": "Property Name",
    "nameOfGuest": "Guest Name",
    "checkIn": "2025-01-15",
    "checkOut": "2025-01-17",
    "timeIn": "2:00 PM",
    "timeOut": "11:00 AM",
    "status": "Reserved"
  },
  {
    "_id": "booking-id-2",
    "nameOfProperty": "Another Property",
    "nameOfGuest": "Another Guest",
    "checkIn": "2025-01-15",
    "checkOut": "2025-01-16",
    "timeIn": "3:00 PM",
    "timeOut": "11:00 AM",
    "status": "Checked-Out"
  }
]
```

### **Used In**
- `fetchTodaysCheckins()` function
- `loadTodaysCheckins()` function
- Main data source for check-in/check-out tabs

### **Status Codes**
- `200`: Success
- `400`: Bad request (invalid property IDs)
- `500`: Server error

---

## 3. Booking Status Check API

### **Endpoint**
```
GET /booking/{bookingId}
```

### **Purpose**
Check current status of a specific booking

### **Request**
- **Method**: GET
- **Headers**: `Content-Type: application/json`
- **Parameters**: `bookingId` in URL path

### **Expected Response**
```json
{
  "booking": {
    "_id": "booking-id",
    "status": "Checked-In",
    "nameOfProperty": "Property Name",
    "nameOfGuest": "Guest Name",
    "checkIn": "2025-01-15",
    "checkOut": "2025-01-17"
  }
}
```

### **Used In**
- `checkBookingStatus()` function
- Real-time status updates for booking elements

### **Status Codes**
- `200`: Success
- `404`: Booking not found
- `500`: Server error

---

## 4. Booking Status Update API

### **Endpoint**
```
PATCH /booking/update-status/{bookingId}
```

### **Purpose**
Update booking status (e.g., to "Checked-In")

### **Request**
- **Method**: PATCH
- **Headers**: `Content-Type: application/json`
- **Parameters**: `bookingId` in URL path
- **Body**:
```json
{
  "status": "Checked-In"
}
```

### **Expected Response**
```json
{
  "message": "Booking status updated successfully",
  "booking": {
    "_id": "booking-id",
    "status": "Checked-In",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### **Used In**
- `updateBookingStatus()` function
- Check-in confirmation process

### **Status Codes**
- `200`: Success
- `400`: Bad request (invalid status)
- `404`: Booking not found
- `500`: Server error

---

## 5. PM Bookings by Date API

### **Endpoint**
```
POST /pm/bookings/byDateAndProperties
```

### **Purpose**
Fetch bookings for a specific date and properties

### **Request**
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "checkIn": "2025-01-15",
  "propertyIds": ["property-id-1", "property-id-2"]
}
```

### **Expected Response**
```json
[
  {
    "_id": "booking-id-1",
    "nameOfProperty": "Property Name",
    "nameOfGuest": "Guest Name",
    "checkIn": "2025-01-15",
    "checkOut": "2025-01-17",
    "timeIn": "2:00 PM",
    "timeOut": "11:00 AM",
    "status": "Confirmed"
  }
]
```

### **Used In**
- `loadBookingsByDate()` function
- Calendar date selection functionality

### **Status Codes**
- `200`: Success
- `400`: Bad request (invalid date or property IDs)
- `500`: Server error

---

## API Response Structure Analysis

### **Common Response Patterns**

1. **Array Response**: Most PM APIs return arrays of booking objects
2. **Object Response**: Some APIs return single objects with nested data
3. **Error Response**: Standard error format with message and status

### **Booking Object Structure**
```json
{
  "_id": "unique-booking-id",
  "nameOfProperty": "Property Name",
  "nameOfGuest": "Guest Name",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "timeIn": "HH:MM AM/PM",
  "timeOut": "HH:MM AM/PM",
  "status": "Status Value",
  "bookingId": "alternative-id",
  "transNo": "transaction-number"
}
```

### **Status Values Found**
- `Reserved`
- `Confirmed`
- `Checked-In`
- `Checked-Out`
- `Complete`
- `Finished`
- `Ended`
- `Pending`
- `Cancelled`

---

## Testing and Validation

### **Test Files Created**
1. **`pm-api-outputs-test.html`** - Comprehensive API testing tool
2. **`pm-debug-test.html`** - Filtering logic testing tool

### **How to Test APIs**
1. Open the test file in a browser
2. Set appropriate test data (Property ID, Role ID, etc.)
3. Click "Test All APIs" to see all responses
4. Or test individual APIs for specific functionality

### **Expected Test Results**
- **Role API**: Should return role privileges or 404 for invalid IDs
- **Check-in Today API**: Should return array of today's bookings
- **Booking Status API**: Should return booking details or 404 for invalid IDs
- **Update Status API**: Should update status or return error
- **By Date API**: Should return bookings for specified date

---

## Error Handling

### **Common Error Scenarios**
1. **Invalid IDs**: 404 responses for non-existent records
2. **Missing Data**: 400 responses for incomplete requests
3. **Server Issues**: 500 responses for internal errors
4. **Network Issues**: Connection timeouts and fetch errors

### **Error Response Format**
```json
{
  "error": "Error message",
  "status": "error",
  "code": "ERROR_CODE"
}
```

---

## Integration Points

### **Frontend Integration**
- All APIs are called from JavaScript functions
- Responses are processed and displayed in UI components
- Error handling shows user-friendly messages

### **Data Flow**
1. **Role Check** → Sidebar filtering
2. **Check-in Today** → Tab population
3. **Status Updates** → Real-time UI updates
4. **Date Selection** → Calendar functionality

---

## Performance Considerations

### **API Call Frequency**
- **Role API**: Called once on page load
- **Check-in Today**: Called on page load and refresh
- **Status Check**: Called for individual bookings
- **Update Status**: Called on user action
- **By Date**: Called on calendar date selection

### **Caching Strategy**
- Role privileges cached in memory
- Property IDs cached in localStorage
- Booking data refreshed on demand

---

## Security and Access Control

### **Authentication**
- APIs may require authentication tokens
- Role-based access control implemented
- Privilege checking for sensitive operations

### **Data Validation**
- Input validation on frontend
- Server-side validation for all requests
- Sanitization of user inputs

---

## Future Enhancements

### **Potential Improvements**
1. **Batch Operations**: Combine multiple API calls
2. **Real-time Updates**: WebSocket integration for live data
3. **Offline Support**: Service worker for offline functionality
4. **API Versioning**: Version control for API endpoints

### **Monitoring and Analytics**
- API response time tracking
- Error rate monitoring
- Usage pattern analysis
- Performance optimization

---

## Conclusion

The PM functions use 5 main APIs to provide comprehensive property monitoring functionality. Each API serves a specific purpose and returns structured data that is processed and displayed in the user interface. The filtering issue was resolved by improving the data processing logic to handle various status formats and response structures.

For testing and debugging, use the provided test files to verify API responses and ensure proper functionality.
