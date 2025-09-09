const path = require('path');

module.exports = {
  // 1. Punto de entrada: El archivo principal que carga todo lo demás.
  entry: './src/scripts/app.js',

  // 2. Salida: Dónde colocar el archivo final empaquetado.
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },

  // 3. Modo: Desarrollo para que sea legible, o 'production' para comprimirlo.
  mode: 'development',

  // Opcional: Source maps para facilitar la depuración.
  devtool: 'cheap-module-source-map',
};