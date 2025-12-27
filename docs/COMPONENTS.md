# Documentación de Componentes

Detalle técnico de los componentes de interfaz de usuario implementados en `src/scripts/components` y su clase base.

## Clase Base: `Component`

Ubicación: `src/scripts/core/Component.js`

La clase `Component` proporciona una estructura estandarizada para crear elementos del DOM dinámicos.

### Métodos Principales

- **`setState(newState)`**: Actualiza el estado interno (`this.state`) y dispara automáticamente una actualización de la vista.
- **`render()`**: _Abstracto_. Debe devolver una cadena de texto con el HTML del componente.
- **`create()`**: Genera el elemento DOM real a partir del string HTML retornado por `render()`. Llama a `afterRender()`.
- **`afterRender()`**: Hook de ciclo de vida. Ideal para añadir `EventListeners` a los elementos recién creados.
- **`mount(container)`**: Añade el componente a un elemento padre.

---

## Componentes de la Aplicación

### 1. Sidebar (`Sidebar.js`)

El contenedor principal que se desliza desde la izquierda o se integra en la barra lateral.

- **Responsabilidad**: Estructura general, botones de acción principales (Crear Carpeta, Buscar, Configuración), y contenedores para las sub-secciones.
- **Estado**: Controla qué sección está visible (`create-folder-container`, `search-conversations-container`).
- **Plantilla**: Utiliza un literal de plantilla (Template String) que reemplaza al antiguo `sidebar.html` cargado asíncronamente.

### 2. FolderList (`FolderList.js`)

Renderiza la lista jerárquica de carpetas.

- **Responsabilidad**: Recorrer el objeto de carpetas y generar un elemento `<li>` por cada una.
- **Hijos**: Instancia un `ConversationList` para cada carpeta.
- **Interacción**: Maneja la expansión/contracción de carpetas y delega el modo de edición de nombre a `EventHandler`.

### 3. ConversationList (`ConversationList.js`)

Renderiza la lista de conversaciones dentro de una carpeta.

- **Responsabilidad**: Mostrar títulos de conversaciones, manejar el Drag & Drop (inicio y fin), y botones de eliminación.
- **Drag & Drop**: Configura los eventos `dragstart`, `dragover`, `drop` en los elementos `<li>` y el contenedor `<ul>` para permitir reordenamiento y movimiento entre carpetas.
- **Navegación**: Contiene la lógica crítica `openChat(id)` que simula la navegación en la SPA de Gemini buscando el elemento en el historial o recargando la página si no se encuentra.

### 4. FolderIndicator (`FolderIndicatorComponents.js` - _No Refactorizado a Clase Component_)

Muestra una pequeña etiqueta visual en la parte superior del chat indicando a qué carpeta pertenece la conversación actual.

---

## Servicios Auxiliares

### GeminiAdapter (`src/scripts/services/GeminiAdapter.js`)

Servicio singleton que aísla los selectores CSS.

- `getSidebarInsertionPoint()`: Devuelve el nodo DOM exacto donde debe inyectarse el botón de la extensión.
- `selectors`: Objeto que mapea nombres lógicos a selectores CSS (ej: `myStuffButton` -> `side-nav-entry-button[...]`).

### EventHandler (`src/scripts/eventHandler.js`)

(Legacy/Híbrido) Clase que centraliza la asignación de muchos listeners globales. En futuras iteraciones, gran parte de esta lógica podría moverse directamente a los métodos `afterRender()` de los componentes correspondientes para mejorar la encapsulación.
