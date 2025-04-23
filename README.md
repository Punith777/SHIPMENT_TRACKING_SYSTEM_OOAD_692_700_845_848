# Logistics Management System

A comprehensive logistics management system built with Spring Boot (backend) and React (frontend) for efficient management of warehouses, shipments, and delivery trucks.

## Features

- ✅ User authentication (Login/Signup) - **Implemented and Working**
- ✅ Role-based access control (Admin, Logistics Manager, Warehouse Staff, Delivery Driver) - **Implemented**
- Warehouse management (Planned)
- Shipment tracking (Planned)
- Delivery truck management (Planned)

## Technology Stack

### Backend
- Java 21
- Spring Boot 3.3.10
- Spring Security with JWT Authentication
- Spring Data JPA
- MySQL Database
- Maven

### Frontend
- React
- React Router
- Bootstrap
- Axios

## Design Patterns Used

1. **Repository Pattern**: Used in UserRepository to abstract data access logic
2. **Singleton Pattern**: Used in Spring's dependency injection system
3. **Builder Pattern**: Used with Lombok's @Builder annotation for creating objects
4. **DTO (Data Transfer Object) Pattern**: Used for transferring data between layers (SignupRequest, LoginRequest, AuthResponse)
5. **Adapter Pattern**: UserDetailsImpl adapts our User entity to Spring Security's UserDetails interface
6. **Factory Method Pattern**: UserDetailsImpl.build() creates UserDetails from User entity

## Project Structure

### Backend
```
src/main/java/com/logistics/logistics/
├── controller/
│   └── AuthController.java        # Handles authentication endpoints
├── dto/
│   ├── AuthenticationRequest.java  # Login request payload
│   ├── AuthenticationResponse.java # Authentication response with JWT token
│   ├── RegistrationRequest.java    # Registration request payload
├── model/
│   ├── User.java                  # User entity with role-based permissions
│   └── UserRole.java              # Enum for user roles (Admin, Logistics Manager, etc.)
├── repository/
│   └── UserRepository.java        # Data access layer for User entity
├── security/
│   ├── JwtAuthenticationFilter.java # Intercepts and validates JWT tokens
│   ├── JwtService.java            # Handles JWT token generation and validation
│   ├── SecurityConfig.java        # Spring Security configuration
├── service/
│   ├── AuthService.java           # Authentication business logic
│   └── JwtService.java            # JWT token service
└── LogisticsApplication.java      # Main application entry point
```

### Frontend
```
frontend/
├── public/
└── src/
    ├── components/
    │   ├── DashboardRouter.js     # Routes to role-specific dashboards
    │   ├── Home.js                # Landing page component
    │   ├── Login.js               # Login form component
    │   ├── Profile.js             # User profile component
    │   ├── Register.js            # Registration form component
    │   └── dashboards/            # Role-specific dashboard components
    │       ├── AdminDashboard.js
    │       ├── DeliveryDriverDashboard.js
    │       ├── LogisticsManagerDashboard.js
    │       └── WarehouseStaffDashboard.js
    ├── services/
    │   └── authService.js         # Authentication API service
    ├── App.css                    # Global styles
    ├── App.js                     # Main application component
    └── index.js                   # Application entry point
```

## Getting Started

### Prerequisites
- Java 21
- Node.js and npm
- MySQL

### Backend Setup
1. Configure MySQL database in `application.properties`
2. Run the Spring Boot application:
   ```
   mvn spring-boot:run
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the React application:
   ```
   npm start
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Authenticate a user and receive JWT token

## Implementation Status

### Completed
- ✅ User authentication system with JWT
- ✅ Role-based access control with four distinct user roles
- ✅ Secure password hashing
- ✅ Frontend login and registration forms with validation
- ✅ Role-specific dashboard routing


### Future Enhancements
- Warehouse inventory management
- Shipment creation and tracking
- Delivery truck assignment and route optimization
- Real-time tracking updates
- Reporting and analytics dashboard
