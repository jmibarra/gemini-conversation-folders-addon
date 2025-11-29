export async function fetchTemplate(templatePath) {
    const url = chrome.runtime.getURL(templatePath);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error al cargar el template: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`No se pudo obtener el template: ${templatePath}`, error);
        return ''; // Devuelve una cadena vacía para evitar romper la UI
    }
}
