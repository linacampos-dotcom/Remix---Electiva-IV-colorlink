import * as XLSX from 'xlsx';
import { COLORLINKOrder } from '../types';

export function exportOrdersToExcel(orders: COLORLINKOrder[]) {
  if (!orders || orders.length === 0) {
    alert('No hay órdenes registradas para exportar.');
    return;
  }

  // Map each order to the specified column structure
  const formattedData = orders.map((order, index) => {
    const totalGalones = (order.calculo.galonesPintura || 0) + (order.calculo.galonesSellador || 0);

    return {
      'No.': index + 1,
      'ID Proyecto / Orden': order.numeroOrden || order.id,
      'Cliente (Razón Social)': order.form.nombre_razon_social || 'N/A',
      'Tipo Documento': order.form.tipo_documento || 'NIT',
      'Documento': order.form.documento || 'N/A',
      'Contacto / Responsable': order.form.responsable_contacto || 'N/A',
      'Canal de Entrada': order.form.canal_entrada || 'N/A',
      'Ciudad': order.form.ciudad || 'N/A',
      'Tipo de Obra': order.form.tipo_obra || 'N/A',
      'Área (m²)': order.form.area_m2 || 0,
      'Superficie': order.form.superficie || 'N/A',
      'Ambiente': order.form.ambiente || 'N/A',
      'Condición Pared': order.form.condicion || 'N/A',
      'Color / Acabado': order.form.color_acabado || 'N/A',
      'Producto Seleccionado': order.calculo.productoSugerido || 'N/A',
      'Línea / Marca': order.calculo.lineaProducto || 'Pintuco',
      'Galones Pintura': order.calculo.galonesPintura || 0,
      'Cuñetes Pintura (5 GL)': order.calculo.cuñetesPintura || 0,
      'Galones Sueltos Pintura': order.calculo.galonesSueltosPintura || 0,
      'Galones Sellador': order.calculo.galonesSellador || 0,
      'Cuñetes Sellador (5 GL)': order.calculo.cuñetesSellador || 0,
      'Galones Totales (Pintura + Sellador)': totalGalones,
      'Prioridad': order.calculo.prioridad || 'Normal',
      'Fecha Creación': new Date(order.fechaCreacion).toLocaleDateString('es-CO'),
      'Fecha Requerida': order.form.fecha_requerida || 'N/A',
      'Estado del Pedido': order.estado || 'Pendiente Alistamiento',
      'Responsable Alistamiento': order.responsableAlistamiento || 'Sin asignar',
      'Guía / Despacho': order.guiaDespacho || 'Pendiente',
      'Observaciones de Bodega': order.observacionesBodega || '',
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Auto-size columns
  const columnWidths = [
    { wch: 6 },  // No.
    { wch: 20 }, // ID Proyecto
    { wch: 32 }, // Cliente
    { wch: 15 }, // Tipo Doc
    { wch: 18 }, // Doc
    { wch: 25 }, // Contacto
    { wch: 18 }, // Canal
    { wch: 16 }, // Ciudad
    { wch: 24 }, // Tipo Obra
    { wch: 12 }, // Área m2
    { wch: 20 }, // Superficie
    { wch: 22 }, // Ambiente
    { wch: 20 }, // Condicion
    { wch: 25 }, // Color
    { wch: 36 }, // Producto Sugerido
    { wch: 14 }, // Marca
    { wch: 16 }, // Galones Pintura
    { wch: 22 }, // Cuñetes Pintura
    { wch: 22 }, // Galones Sueltos Pintura
    { wch: 16 }, // Galones Sellador
    { wch: 22 }, // Cuñetes Sellador
    { wch: 32 }, // Galones Totales
    { wch: 12 }, // Prioridad
    { wch: 15 }, // Fecha Creación
    { wch: 15 }, // Fecha Requerida
    { wch: 22 }, // Estado
    { wch: 28 }, // Responsable
    { wch: 24 }, // Guía
    { wch: 40 }, // Observaciones
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado Proyectos');

  // Generate filename with timestamp
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `COLORLINK_Reporte_Proyectos_Pintuco_${dateStr}.xlsx`;

  // Download
  XLSX.writeFile(workbook, filename);
}
