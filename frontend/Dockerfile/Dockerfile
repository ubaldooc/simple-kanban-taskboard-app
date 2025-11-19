# Etapa 1: Construcción (Build)
FROM node:18-alpine AS build

WORKDIR /app

# Copiamos package.json y package-lock.json para instalar dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto de los archivos del frontend
COPY . .

# Construimos la aplicación para producción
RUN npm run build

# Etapa 2: Servidor de producción (Serve)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]