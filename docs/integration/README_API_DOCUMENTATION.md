# Civica API Documentation

## Overview
The Civica API is a comprehensive RESTful API that powers the civic engagement platform for Romanian citizens. It provides endpoints for issue reporting, user management, gamification, and administrative functions.

## API Documentation Access

### Swagger UI
The API documentation is available through Swagger UI at:
- **Development**: `http://localhost:8080/swagger`
- **Production**: `https://your-railway-domain.up.railway.app/swagger`

### OpenAPI Specification
The raw OpenAPI specification (JSON) is available at:
- `/swagger/v1/swagger.json`

## Features

### 🔐 Authentication
- JWT Bearer token authentication via Supabase
- Role-based authorization (User, Admin)
- Secure profile management

### 📝 Issue Management
- Create and track civic issues
- Upload photos and location data
- Email campaign tracking
- Advanced filtering and search

### 🎮 Gamification
- Points and level system
- Badges and achievements
- Leaderboards
- Progress tracking

### 👨‍💼 Administration
- Issue moderation workflow
- Bulk operations
- System statistics
- User management

### 🏥 Health Monitoring
- Database connectivity checks
- Supabase service health
- Overall system status

## Authentication

All protected endpoints require a JWT Bearer token obtained through Supabase Auth.

### Getting a Token
1. Register/login through Supabase Auth
2. Obtain the JWT token from the auth response
3. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Using Swagger UI for Authentication
1. Click the "Authorize" button in Swagger UI
2. Enter your JWT token (without the "Bearer" prefix)
3. Click "Authorize"
4. All subsequent requests will include the token

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Issue creation**: 10 requests per hour per user
- **File uploads**: Maximum 5MB per file, 5 files per issue

## Response Formats

### Success Response
```json
{
  "data": {...},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "requestId": "unique-request-id",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Paginated Response
```json
{
  "items": [...],
  "totalCount": 100,
  "page": 1,
  "pageSize": 12,
  "totalPages": 9,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Endpoint Groups

### 1. Authentication (`/api/auth`)
- User profile management
- Notification preferences
- Account settings

### 2. Issues (`/api/issues`)
- Browse approved issues
- Create new issues
- Track email campaigns
- View issue details

### 3. Admin (`/api/admin`)
- Review pending issues
- Approve/reject issues
- View statistics
- Bulk operations

### 4. User (`/api/user`)
- View user issues
- Gamification progress
- Personal statistics

### 5. Gamification (`/api/gamification`)
- Leaderboards
- Achievements
- Badges
- Points history

### 6. Health (`/api/health`)
- System health status
- Database connectivity
- Service availability

## Development

### Running Locally
```bash
cd Civica.Api
dotnet run
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/civica
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
PORT=8080
```

### Docker Support
```bash
docker build -t civica-api .
docker run -p 8080:8080 civica-api
```

## Testing the API

### Using Swagger UI
1. Navigate to `/swagger`
2. Select an endpoint
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

### Using cURL
```bash
# Health check
curl http://localhost:8080/api/health

# Get issues (public)
curl http://localhost:8080/api/issues

# Create issue (authenticated)
curl -X POST http://localhost:8080/api/issues \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Issue Title",
    "description": "Issue Description",
    "category": "Infrastructure",
    "district": "Sector 1",
    "address": "Street Address",
    "latitude": 44.4268,
    "longitude": 26.1025,
    "urgency": "High"
  }'
```

### Using Postman
1. Import the OpenAPI specification from `/swagger/v1/swagger.json`
2. Set up environment variables for base URL and token
3. Use the generated collection

## Security

- All data transmission uses HTTPS in production
- JWT tokens expire after configured duration
- Sensitive data is never logged
- SQL injection protection via parameterized queries
- XSS protection through input validation
- CORS configured for allowed origins only

## Support

For API support or questions:
- Email: support@civica.ro
- Documentation: This README and Swagger UI
- Issues: Report via GitHub repository

## Version History

### v1.0.0 (Current)
- Initial API release
- Core functionality for issue reporting
- User authentication and profiles
- Admin moderation tools
- Gamification system
- Email campaign tracking