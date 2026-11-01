import { FMVFormData, CalculationResult } from '../types';
import { calculateShipping } from '../data/colombiaLogistics';

export function calculateMaterials(form: FMVFormData): CalculationResult {
  const area = Math.max(0, Number(form.area_m2) || 0);
  const manos = Math.max(1, Number(form.manos_capas) || 2);
  
  // 1. Rendimiento Teórico Base: 30 m² por galón a 2 manos (o 60 m² a 1 mano)
  // Por lo tanto, para N manos: Rendimiento = 60 / N m²/galón
  // O en fórmula equivalente: consumoPinturaNeto = (area * (manos / 2) / 30) * factorCorreccion
  const rendimientoBase = 30; // base a 2 manos estándar NTC 1335
  const factorManos = manos / 2;

  // 2. Factor de Corrección por Superficie:
  // Si la superficie es "Mampostería" o "Rugosa", incrementa el consumo un 15% (multiplica por 1.15)
  // Para las demás superficies, usa el rendimiento base (multiplica por 1.0)
  const supLower = (form.superficie || '').toLowerCase();
  const esSuperficieRugosa = 
    supLower.includes('mampostería') || 
    supLower.includes('mamposteria') || 
    supLower.includes('rugosa') ||
    supLower.includes('bloque a la vista') ||
    supLower.includes('ladrillo');
  
  const factorCorreccion = esSuperficieRugosa ? 1.15 : 1.0;

  // Selección de Producto Sugerido de Pintura
  const desiredProd = form.producto_deseado?.trim();
  const hasSpecificProduct = desiredProd && 
    desiredProd !== 'Recomendación Automática por IA/Sustrato' && 
    desiredProd !== 'Recomendación Automática' &&
    desiredProd !== '';

  let productoSugerido = 'Viniltex Avanzado Máxima Lavabilidad';
  let lineaProducto: 'Pintuco' | 'Color In' = 'Pintuco';
  let skuPinturaSugerido = 'PIN-VTX-01-GL';

  const ambLower = (form.ambiente || '').toLowerCase();
  const condLower = (form.condicion || '').toLowerCase();
  const tipoObraLower = (form.tipo_obra || '').toLowerCase();

  if (hasSpecificProduct) {
    productoSugerido = desiredProd;
    if (desiredProd.toLowerCase().includes('intervinil') || desiredProd.toLowerCase().includes('color in')) {
      lineaProducto = 'Color In';
    } else {
      lineaProducto = 'Pintuco';
    }

    const prodLower = desiredProd.toLowerCase();
    if (prodLower.includes('koraza doble vida')) skuPinturaSugerido = 'PIN-KRZ-DV-GL';
    else if (prodLower.includes('koraza')) skuPinturaSugerido = 'PIN-KRZ-10-GL';
    else if (prodLower.includes('baños') || prodLower.includes('banos')) skuPinturaSugerido = 'PIN-VTX-BC-GL';
    else if (prodLower.includes('viniltex ultra')) skuPinturaSugerido = 'PIN-VTX-ULT-GL';
    else if (prodLower.includes('viniltex')) skuPinturaSugerido = 'PIN-VTX-01-GL';
    else if (prodLower.includes('aquablock')) skuPinturaSugerido = 'PIN-AQB-SEL-GL';
    else if (prodLower.includes('pintuco fill')) skuPinturaSugerido = 'PIN-FIL-01-GL';
    else if (prodLower.includes('imprimante')) skuPinturaSugerido = 'PIN-IMP-ACR-GL';
    else if (prodLower.includes('intervinil')) skuPinturaSugerido = 'CIN-INT-CL-GL';
    else if (prodLower.includes('pintulux')) skuPinturaSugerido = 'PIN-PLX-MAX-GL';
    else skuPinturaSugerido = 'PIN-GEN-01-GL';
  } else {
    if (ambLower.includes('exterior') || ambLower.includes('fachada')) {
      productoSugerido = 'Koraza Doble Vida Protección Clima Extremo';
      skuPinturaSugerido = 'PIN-KRZ-DV-GL';
    } else if (ambLower.includes('húmeda') || ambLower.includes('humeda') || ambLower.includes('baño') || ambLower.includes('cocina')) {
      productoSugerido = 'Viniltex Baños y Cocinas Antibacterial';
      skuPinturaSugerido = 'PIN-VTX-BC-GL';
    } else if (ambLower.includes('marítimo') || ambLower.includes('costero')) {
      productoSugerido = 'Koraza 10 Años Alta Resistencia a la Salinidad y Hongos';
      skuPinturaSugerido = 'PIN-KRZ-10-GL';
    } else if (ambLower.includes('alto tráfico') || ambLower.includes('institucional')) {
      productoSugerido = 'Viniltex Ultra Lavable Acrílica Premium';
      skuPinturaSugerido = 'PIN-VTX-ULT-GL';
    } else if (ambLower.includes('techo') || ambLower.includes('cielorraso')) {
      productoSugerido = 'Intervinil Cielos Mate Antirreflejo';
      skuPinturaSugerido = 'CIN-INT-CL-GL';
      lineaProducto = 'Color In';
    } else if (ambLower.includes('industrial') || ambLower.includes('piso')) {
      productoSugerido = 'Esmalte Pintulux Máxima Durabilidad / Tráfico';
      skuPinturaSugerido = 'PIN-PLX-IND-GL';
    } else {
      // Interior estándar
      productoSugerido = 'Viniltex Avanzado Máxima Lavabilidad';
      skuPinturaSugerido = 'PIN-VTX-01-GL';
    }
  }

  // 3. REGLAS DE ASIGNACIÓN Y CÁLCULO DE SELLADOR / IMPRIMANTE
  // Regla de activación obligatoria:
  // - Condición "Obra Nueva / Revoque", "Nueva", "Superficie con Humedad", "Con Humedad", "Con Fisuras" o "Superficie Porosa / Pañete"
  // - O tipo de obra "Comercial" / "Industrial" (estándar de preparación)
  // - O switch/checkbox de "incluir_sellador_forzado" activado por el usuario
  const esCondicionSelladorObligatorio = 
    condLower.includes('obra nueva') ||
    condLower.includes('nueva') || 
    condLower.includes('humed') || 
    condLower.includes('fisura') || 
    condLower.includes('grieta') || 
    condLower.includes('porosa') || 
    condLower.includes('pañete') ||
    condLower.includes('panete') ||
    condLower.includes('revoque') ||
    supLower.includes('pañete') ||
    supLower.includes('revoque');

  const esObraComercialIndustrial = 
    tipoObraLower.includes('comercial') || 
    tipoObraLower.includes('industrial');

  const requiereSellador = 
    esCondicionSelladorObligatorio || 
    esObraComercialIndustrial || 
    Boolean(form.incluir_sellador_forzado);

  const rendimientoSellador = 40; // 1 galón cada 40 m²

  // Asignación automática del producto Sellador Pintuco específico:
  // 1) Si el ambiente es EXTERIOR o el producto es Koraza: Asigna "Pintuco Fill Imprimante / Sellador Exterior".
  // 2) Si la condición es "NUEVA", "CON HUMEDAD" o "PAÑETE / REVOQUE": Asigna "Sellador Acrílico Pintuco 100% Interiores/Exteriores" (o Aquablock en humedad severa).
  // 3) Si el tipo de obra es "COMERCIAL" o "INDUSTRIAL": Recomienda "Sellador Pintuco de Alta Adherencia y Resistencia".
  let productoSelladorSugerido = 'Sellador Acrílico Pintuco 100% Interiores/Exteriores';
  let skuSelladorSugerido = 'PIN-IMP-ACR-GL';

  const esExteriorOKoraza = 
    ambLower.includes('exterior') || 
    ambLower.includes('fachada') || 
    productoSugerido.toLowerCase().includes('koraza');

  if (esExteriorOKoraza) {
    productoSelladorSugerido = 'Pintuco Fill Imprimante / Sellador Exterior';
    skuSelladorSugerido = 'PIN-FIL-IMP-GL';
  } else if (condLower.includes('humedad')) {
    productoSelladorSugerido = 'Sellador Antihumedad Aquablock / Silicona Hidrófuga';
    skuSelladorSugerido = 'PIN-AQB-SEL-GL';
  } else if (condLower.includes('nueva') || condLower.includes('porosa') || condLower.includes('pañete') || supLower.includes('pañete')) {
    productoSelladorSugerido = 'Sellador Acrílico Pintuco 100% Interiores/Exteriores';
    skuSelladorSugerido = 'PIN-IMP-ACR-GL';
  } else if (esObraComercialIndustrial) {
    productoSelladorSugerido = 'Sellador Pintuco de Alta Adherencia y Resistencia';
    skuSelladorSugerido = 'PIN-SEL-ADH-GL';
  } else if (condLower.includes('fisura') || condLower.includes('grieta')) {
    productoSelladorSugerido = 'Pintuco Fill Imprimante / Sellador Sellagrietas';
    skuSelladorSugerido = 'PIN-FIL-IMP-GL';
  } else {
    productoSelladorSugerido = 'Sellador Acrílico Pintuco 100% Interiores/Exteriores';
    skuSelladorSugerido = 'PIN-IMP-ACR-GL';
  }

  // 4. Método de Aplicación y Margen de Desperdicio:
  // - Rodillo Convencional: +5% desperdicio (factor 1.05)
  // - Brocha / Trabajo Detallado: +10% desperdicio (factor 1.10)
  // - Equipo Airless / Pistola: +15% desperdicio (factor 1.15)
  const metodoRaw = (form.metodo_aplicacion || 'Rodillo Convencional (+5% desperdicio)').toLowerCase();
  let metodoAplicacion = 'Rodillo Convencional (+5% desperdicio)';
  let margenDesperdicioPct = 5;
  let factorDesperdicio = 1.05;

  if (metodoRaw.includes('airless') || metodoRaw.includes('pistola') || metodoRaw.includes('15%')) {
    metodoAplicacion = 'Equipo Airless / Pistola (+15% desperdicio)';
    margenDesperdicioPct = 15;
    factorDesperdicio = 1.15;
  } else if (metodoRaw.includes('brocha') || metodoRaw.includes('detalle') || metodoRaw.includes('10%')) {
    metodoAplicacion = 'Brocha / Trabajo Detallado (+10% desperdicio)';
    margenDesperdicioPct = 10;
    factorDesperdicio = 1.10;
  } else {
    metodoAplicacion = 'Rodillo Convencional (+5% desperdicio)';
    margenDesperdicioPct = 5;
    factorDesperdicio = 1.05;
  }

  // 5. Fórmulas de Cálculo con Desperdicio:
  // Consumo Pintura Neto = (Área m² / 30) * Factor de Superficie * Factor de Manos
  // Galones Pintura = Math.ceil(Consumo Pintura Neto * Factor de Desperdicio)
  // Galones Sellador = Math.ceil((Área m² / 40) * Factor de Desperdicio)
  const consumoPinturaNeto = area > 0 ? (area / rendimientoBase) * factorCorreccion * factorManos : 0;
  const galonesPintura = area > 0 ? Math.ceil(consumoPinturaNeto * factorDesperdicio) : 0;
  
  const consumoSelladorNeto = (requiereSellador && area > 0) ? (area / rendimientoSellador) : 0;
  const galonesSellador = (requiereSellador && area > 0) ? Math.ceil(consumoSelladorNeto * factorDesperdicio) : 0;

  // Desglose en Cuñetes (5 galones) y Galones sueltos
  const cuñetesPintura = Math.floor(galonesPintura / 5);
  const galonesSueltosPintura = galonesPintura % 5;

  const cuñetesSellador = Math.floor(galonesSellador / 5);
  const galonesSueltosSellador = galonesSellador % 5;

  // Tratamiento Previo
  let tratamientoPrevio = 'Superficie limpia, seca y libre de polvo o grasa. Lijado suave para promover adherencia.';

  if (condLower.includes('humedad')) {
    tratamientoPrevio = 'Aplicar 1 capa uniforme de Sellador Antihumedad Aquablock / Silicona Hidrófuga Pintuco. Corregir filtraciones antes de pintar.';
  } else if (condLower.includes('nueva') || condLower.includes('porosa') || condLower.includes('pañete')) {
    tratamientoPrevio = 'Curado completo del revoque (mínimo 28 días) y aplicación de Sellador Acrílico Pintuco 100% para fijar alcalinidad y homogenizar absorción.';
  } else if (condLower.includes('descascarada') || condLower.includes('regular')) {
    tratamientoPrevio = 'Raspar y retirar toda la pintura suelta con espátula, lijar y nivelar con Estuco Acrílico Exterior/Interior Pintuco antes de aplicar capa base.';
  } else if (condLower.includes('fisurada') || condLower.includes('grieta')) {
    tratamientoPrevio = 'Abrir fisuras en "V", limpiar y sellar con Masilla Elastomérica Pintuco Fill + Cinta de Malla en juntas críticas.';
  }

  // Prioridad y Alerta Despacho
  let prioridad: 'Alta' | 'Normal' = 'Normal';
  let diasRestantes = 7;

  if (form.fecha_requerida) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(form.fecha_requerida);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diasRestantes <= 3) {
      prioridad = 'Alta';
    } else {
      prioridad = 'Normal';
    }
  }

  const estadoStockAlerta = `Generar orden de alistamiento para despacho en ${form.ciudad || 'Bodega Principal'} antes de ${form.fecha_requerida || 'fecha programada'}.`;

  // Cálculo de Subtotal Estimado de Materiales y Logística Nacional según Producto Seleccionado
  let precioRefPinturaGL = 115000;
  const prodNameLower = productoSugerido.toLowerCase();
  if (prodNameLower.includes('koraza doble')) precioRefPinturaGL = 142000;
  else if (prodNameLower.includes('koraza')) precioRefPinturaGL = 138000;
  else if (prodNameLower.includes('baños') || prodNameLower.includes('banos')) precioRefPinturaGL = 128000;
  else if (prodNameLower.includes('aquablock')) precioRefPinturaGL = 135000;
  else if (prodNameLower.includes('viniltex ultra')) precioRefPinturaGL = 125000;
  else if (prodNameLower.includes('pintulux')) precioRefPinturaGL = 118000;
  else if (prodNameLower.includes('intervinil') || prodNameLower.includes('color in')) precioRefPinturaGL = 89000;
  else if (prodNameLower.includes('viniltex')) precioRefPinturaGL = 115000;

  let precioRefSelladorGL = 75000;
  if (productoSelladorSugerido.toLowerCase().includes('aquablock')) precioRefSelladorGL = 135000;
  else if (productoSelladorSugerido.toLowerCase().includes('fill')) precioRefSelladorGL = 85000;

  // Beneficio económico al comprar por Cuñete (5 galones = aprox 4.6x precio de galón individual)
  const precioCunetePintura = Math.round(precioRefPinturaGL * 4.6);
  const subtotalPintura = (cuñetesPintura * precioCunetePintura) + (galonesSueltosPintura * precioRefPinturaGL);
  
  const precioCuneteSellador = Math.round(precioRefSelladorGL * 4.6);
  const subtotalSellador = (cuñetesSellador * precioCuneteSellador) + (galonesSueltosSellador * precioRefSelladorGL);
  
  const subtotalMateriales = subtotalPintura + subtotalSellador;
  const totalGalones = galonesPintura + galonesSellador;

  const modalidad = form.modalidad_entrega || 'domicilio';
  const shipping = calculateShipping(
    form.departamento || 'Bogotá D.C.',
    form.ciudad || 'Bogotá D.C.',
    totalGalones,
    modalidad,
    subtotalMateriales
  );

  const costoTotalEstimado = subtotalMateriales + shipping.costoFlete;

  // Construcción del texto Markdown
  const markdownOutput = `### 1. Resumen de la Solicitud
- *Cliente:* ${form.nombre_razon_social || 'No especificado'} (Doc: ${form.tipo_documento || 'NIT'} ${form.documento || 'No especificado'})
- *Proyecto:* ${form.tipo_obra || 'Obra General'} en ${form.ciudad || 'No especificada'} (${form.departamento || 'Colombia'}) | *Área:* ${area} m²
- *Contacto:* ${form.responsable_contacto || 'No especificado'} via ${form.canal_entrada || 'Directo'}
- *Método de Aplicación:* ${metodoAplicacion}

### 2. Diagnóstico Técnico y Producto Recomendado
- *Producto Sugerido:* ${productoSugerido}
- *Sellador / Imprimante Asignado:* ${requiereSellador ? productoSelladorSugerido : 'No requerido (Superficie en buen estado)'}
- *Tratamiento Previo:* ${tratamientoPrevio}

### 3. Explosión de Insumos (BOM)
- *Pintura Base (Galones):* ${galonesPintura} Galones de ${productoSugerido} (${cuñetesPintura} Cuñetes + ${galonesSueltosPintura} Gal) en color ${form.color_acabado || 'Blanco Estándar'}. Consumo neto: ${consumoPinturaNeto.toFixed(1)} GL + ${margenDesperdicioPct}% desperdicio.
- *Sellador / Imprimante (Galones):* ${galonesSellador > 0 ? `${galonesSellador} Galones de ${productoSelladorSugerido} (${cuñetesSellador} Cuñetes + ${galonesSueltosSellador} Gal a 40 m²/gal con ${margenDesperdicioPct}% margen)` : '0 si no aplica'}.

### 4. Cobertura Logística y Despacho
- *Modalidad:* ${modalidad === 'retiro_tienda' ? `Retiro en Sede Pintuco (${form.sede_retiro || shipping.hubDespacho})` : 'Envío Directo a Pie de Obra'}
- *Hub / CEDI Asignado:* ${shipping.hubDespacho} (${shipping.tipoZona})
- *Tiempo Estimado de Entrega:* ${shipping.tiempoEstimado}
- *Costo de Flete:* ${shipping.esFleteGratis ? '¡FLETE BONIFICADO B2B ($0 COP)!' : `$${shipping.costoFlete.toLocaleString('es-CO')} COP`}
- *Prioridad de Alistamiento:* ${prioridad}`;

  return {
    rendimientoBase,
    factorCorreccion,
    esSuperficieRugosa,
    requiereSellador,
    rendimientoSellador,
    metodoAplicacion,
    margenDesperdicioPct,
    factorDesperdicio,
    consumoPinturaNeto,
    galonesPintura,
    galonesSellador,
    productoSugerido,
    productoSelladorSugerido,
    lineaProducto,
    tratamientoPrevio,
    prioridad,
    diasRestantes,
    alertaDespacho: estadoStockAlerta,
    markdownOutput,
    cuñetesPintura,
    galonesSueltosPintura,
    cuñetesSellador,
    galonesSueltosSellador,
    skuPinturaSugerido,
    skuSelladorSugerido: requiereSellador ? skuSelladorSugerido : 'N/A',
    costo_total_estimado: costoTotalEstimado,
    costo_flete: shipping.costoFlete,
    costo_flete_original: shipping.costoFleteOriginal,
    es_flete_gratis: shipping.esFleteGratis,
    tiempo_entrega_estimado: shipping.tiempoEstimado,
    modalidad_entrega: modalidad,
    hub_despacho: shipping.hubDespacho,
    tipo_zona_logistica: shipping.tipoZona,
  };
}
