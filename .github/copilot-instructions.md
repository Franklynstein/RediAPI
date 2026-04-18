# AI Coding Agent Instructions for SMM Project

## Project Overview

The SMM Project is a React-based web application built with Vite that displays a catalog of social media accounts/services fetched from the Rediprofiles API. The app shows service names, prices in NGN, stock quantities, and purchase buttons.

## Architecture

- **Frontend**: React application using Vite as the build tool
- **Backend Proxy**: Express server to handle API requests and avoid CORS issues
- **API Integration**: Fetches service data from Rediprofiles API (https://api.rediprofiles.com/api/v1/services/) via proxy
- **Authentication**: Uses X-API-KEY header for API requests (configured in server.js)
	- Supports `GET /api/services` and `POST /api/orders` proxy routes
- **Styling**: CSS with responsive grid layout for service cards
- **State Management**: React hooks (useState, useEffect) for managing service data, loading, and error states

## Developer Workflows

- **Development**: Run `npm run dev` to start the Vite development server, and `node server.js` to start the proxy server
	- Start frontend with `npm run dev` and proxy with `npm run proxy`
- **Build**: Run `npm run build` to create a production build
- **Preview**: Run `npm run preview` to preview the production build locally
- **Dependencies**: Managed via npm; install with `npm install`
	- Use `.env` for `REDIPROFILES_API_KEY`; `.env.example` is provided as a template
  
Environment:
	- Proxy server uses `REDIPROFILES_API_KEY` from `.env` via dotenv
	- Do not hardcode API keys in source; `.env` is ignored via `.gitignore`
	- Use `.env.example` as a template for local setup

## Conventions and Patterns

- **Component Structure**: Main App component handles data fetching and rendering
- **API Calls**: Use fetch API with X-API-KEY header in useEffect hooks
- **Styling**: Class-based styling; responsive design with CSS Grid
- **Error Handling**: Display user-friendly error messages for API failures
- **Loading States**: Show loading indicators during API requests
- **Data Mapping**: Services have {id, name, final_price, quantity_in_stock} structure

## Integration Points

- **External API**: Rediprofiles API for service catalog
- **Authentication**: API key required (stored securely, not in client code)
	- **Authentication**: API key required and injected via proxy server environment variable
- **Currency**: Prices in NGN with ₦ symbol
- **No backend**: Pure frontend application consuming external services