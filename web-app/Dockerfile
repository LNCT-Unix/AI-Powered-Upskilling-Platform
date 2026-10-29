# ==============================================================================
# Development / Preview Container for React 19 + Vite Frontend
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Cache package dependencies layer
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

EXPOSE 5173

# Run Vite dev server bound to 0.0.0.0 so it is reachable from host browser
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

