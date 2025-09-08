document.addEventListener('DOMContentLoaded', () => {
    const storage = new Storage('geminiConversations');
    const syncToggle = document.getElementById('sync-toggle-checkbox');
    const statusMessage = document.getElementById('status-message');

    // Función para guardar la preferencia
    const saveOptions = async () => {
        const syncEnabled = syncToggle.checked;
        await storage.setSyncEnabled(syncEnabled);
        
        // Muestra un mensaje de confirmación
        statusMessage.textContent = '¡Configuración guardada!';
        statusMessage.classList.add('show');
        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 2000);
    };

    // Función para cargar la preferencia guardada
    const restoreOptions = async () => {
        const syncEnabled = await storage.getSyncEnabled();
        syncToggle.checked = syncEnabled;
    };

    // Asignamos los eventos
    syncToggle.addEventListener('change', saveOptions);
    restoreOptions();
});