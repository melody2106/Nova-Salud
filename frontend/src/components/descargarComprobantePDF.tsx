const descargarComprobantePDF = async (idVenta: number) => {
  try {
    // Asegúrate de usar la URL/puerto correcto de tu backend
    const response = await fetch(`http://localhost:3000/api/reportes/pdf/${idVenta}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener el documento');
    }

    // Convertimos la respuesta a un archivo Blob (datos binarios del PDF)
    const blob = await response.blob();
    
    // Creamos un enlace invisible para forzar la descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Comprobante_NovaSalud_${idVenta}.pdf`);
    document.body.appendChild(link);
    
    // Simulamos el clic y luego limpiamos la basura
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Error al descargar el PDF:", error);
    // Aquí puedes usar tu sistema de notificaciones (toast) en lugar de un alert
    alert("Venta guardada, pero hubo un error al descargar el PDF."); 
  }
};