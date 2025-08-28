# Pet Store Tycoon

## Overview

Pet Store Tycoon is a React-based idle clicker game where players build and manage their own pet store empire. Players collect money by opening different types of eggs to obtain pets with varying rarities and income generation rates. The game features multiple store types with different capacities and a progression system where players can upgrade their stores to accommodate more pets and generate higher income.

The application uses a modern full-stack architecture with React frontend, Express.js backend, and PostgreSQL database with Drizzle ORM for data persistence. Game state is currently managed locally but includes infrastructure for cloud saves and multiplayer features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the main application framework
- **Vite** as the build tool and development server with hot module replacement
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and API caching
- **Tailwind CSS** with CSS custom properties for styling and theming
- **Shadcn/ui** component library built on Radix UI primitives for consistent UI components

### Backend Architecture
- **Express.js** server with TypeScript for API endpoints
- **RESTful API** design with `/api` prefix for all backend routes
- **In-memory storage** implementation with interface for future database integration
- **Session management** using connect-pg-simple for PostgreSQL session store
- **Error handling** middleware with structured error responses

### Data Storage Solutions
- **PostgreSQL** database configured via Neon Database serverless driver
- **Drizzle ORM** with migrations for type-safe database operations
- **Game state persistence** with JSON storage for complex pet arrays
- **Local storage fallback** for offline gameplay experience

### Component Architecture
- **Atomic design** principles with reusable UI components
- **Custom hooks** for mobile detection and toast notifications
- **Form handling** with React Hook Form and Zod validation
- **Modal system** for game interactions and notifications

### Game Logic Design
- **Idle clicker mechanics** with automatic income generation
- **Rarity-based pet system** with different income rates and probabilities
- **Progressive store upgrades** from shack to mansion with increasing capacity
- **Real-time money calculation** with per-second and exponential income types

## External Dependencies

### UI and Styling
- **Radix UI** primitives for accessible component foundations
- **Tailwind CSS** for utility-first styling approach
- **Lucide React** for consistent iconography
- **Class Variance Authority** for component variant management

### Development Tools
- **Replit integration** with development banner and cartographer plugin
- **ESBuild** for production bundling and optimization
- **PostCSS** with Autoprefixer for CSS processing

### Database and Backend Services
- **Neon Database** as the PostgreSQL hosting provider
- **Drizzle Kit** for database migrations and schema management
- **Express session** handling with PostgreSQL store

### Game Enhancement Libraries
- **Date-fns** for time calculations and formatting
- **Embla Carousel** for potential UI carousels and galleries
- **Nanoid** for generating unique identifiers

The architecture supports both single-player local gameplay and multiplayer cloud-based features through its modular storage interface design.