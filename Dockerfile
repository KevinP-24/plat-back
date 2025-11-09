# 1. Usar una imagen oficial de Node.js (v18 es una buena opción)
FROM node:18-alpine

# 2. Crear y definir el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiar el package.json y package-lock.json
# Usamos
COPY package*.json ./

# 4. Instalar las dependencias de producción
RUN npm install --only=production

# 5. Copiar el resto del código de tu aplicación
COPY . .

# 6. Tu app corre en el puerto 3000 según tu .env (aunque Cloud Run lo maneja)
# El comando para iniciar tu app es "node server.js"
CMD [ "node", "server.js" ]