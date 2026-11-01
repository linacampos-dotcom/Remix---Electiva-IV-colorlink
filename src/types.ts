export type CorporateRole = 
  | 'tesoreria'  // Tesorería y Contabilidad (Garantías de pago, facturación electrónica, flujo de caja)
  | 'compras'    // Compras y Abastecimiento (Órdenes de insumos, gestión de proveedores)
  | 'logistica'  // Logística y Bodega (Estado de preparación, despacho de guías y flotas)
  | 'ventas'     // Ventas y Comercial (Cotizaciones activas, margen por proyecto B2B)
  | 'sac'        // SAC y Atención al Cliente (Gestión de PQRS y seguimiento)
  | 'gerencia';  // Gerencia / Analytics (Indicadores KPI y volumen de ventas)

export type AppRole = 'cliente' | CorporateRole | 'admin';

export type ClientNavigationTab = 
  | 'home'          // Inicio (Bienvenida breve, Banners y Trayectoria resumida)
  | 'catalog'       // Catálogo de Productos (Filtros laterales a la izquierda y tarjetas organizadas a la derecha)
  | 'cotizador'     // Calculadora y Cotizador (Sección dedicada y despejada)
  | 'cobertura'     // Cobertura y Tiendas (Mapa interactivo completo)
  | 'nosotros'      // ¿Quiénes Somos? (Reseña institucional, Misión y Visión)
  | 'timeline'      // Línea de Tiempo y Trayectoria de Pintuco
  | 'favorites'     // Mis Favoritos (Productos guardados vinculados al usuario)
  | 'tracking'      // Rastrear Pedido / Trazabilidad
  | 'funcionarios'; // Portal Funcionarios (Acceso corporativo)

export type TipoDocumento = 'NIT' | 'CC' | 'CE' | 'RUT' | 'Pasaporte' | 'Cédula de Ciudadanía' | 'Cédula de Extranjería';

export type CanalEntrada = 
  | 'Asesor Comercial' 
  | 'Línea WhatsApp' 
  | 'Tienda Pintumarket' 
  | 'Portal Web B2B' 
  | 'Correo Directo'
  | 'Call Center';

export type SuperficieTipo = 
  | 'Mampostería'
  | 'Rugosa'
  | 'Pañete / Revoque Liso'
  | 'Drywall / Yeso'
  | 'Concreto Vaciado'
  | 'Pintura Existente'
  | 'Madera'
  | 'Metal / Estructura';

export type AmbienteTipo = 
  | 'Interior'
  | 'Exterior Fachada'
  | 'Zonas Húmedas / Baños y Cocinas'
  | 'Alto Tráfico / Institucional'
  | 'Marítimo / Costero'
  | 'Techos / Cielorrasos'
  | 'Industrial / Pisos';

export type CondicionPared = 
  | 'Obra Nueva / Revoque'
  | 'Nueva'
  | 'Superficie con Humedad'
  | 'Con Humedad'
  | 'Fisurada / Con Grietas'
  | 'Superficie Porosa / Pañete'
  | 'Buen Estado / Repinte'
  | 'Regular / Descascarada'
  | 'Con Manchas / Grasa'
  | string;

export type MetodoAplicacion = 
  | 'Rodillo Convencional (+5% desperdicio)'
  | 'Brocha / Trabajo Detallado (+10% desperdicio)'
  | 'Equipo Airless / Pistola (+15% desperdicio)'
  | string;

export interface FMVFormData {
  tipo_documento: TipoDocumento;
  documento: string;
  nombre_razon_social: string;
  responsable_contacto: string;
  canal_entrada: CanalEntrada;
  ciudad: string;
  tipo_obra: string;
  area_m2: number;
  alto_metros?: number;
  ancho_metros?: number;
  manos_capas?: number;
  fecha_requerida: string;
  producto_deseado?: string;
  superficie: SuperficieTipo | string;
  ambiente: AmbienteTipo | string;
  condicion: CondicionPared | string;
  incluir_sellador_forzado?: boolean;
  color_acabado: string;
  metodo_aplicacion?: MetodoAplicacion;
  foto_obra_url?: string;
  foto_pared_url?: string;
  departamento?: string;
  modalidad_entrega?: 'domicilio' | 'retiro_tienda';
  sede_retiro?: string;
  costo_flete?: number;
  tiempo_estimado_flete?: string;
  telefono?: string;
  correo_electronico?: string;
  direccion_obra?: string;
}

export interface CalculationResult {
  rendimientoBase: number; // 30 m² / galón a 2 manos
  factorCorreccion: number; // 1.15 for Mampostería / Rugosa, 1.0 for others
  esSuperficieRugosa: boolean;
  requiereSellador: boolean; // true if Nueva, Humedad, Fisuras, Porosa/Pañete or Com/Ind or forced
  rendimientoSellador: number; // 40 m² / galón
  metodoAplicacion: string;
  margenDesperdicioPct: number; // 5, 10, 15
  factorDesperdicio: number; // 1.05, 1.10, 1.15
  consumoPinturaNeto: number; // sin desperdicio
  galonesPintura: number; // con desperdicio redondeado al alza
  galonesSellador: number; // con desperdicio redondeado al alza
  productoSugerido: string;
  productoSelladorSugerido: string;
  lineaProducto: 'Pintuco' | 'Color In';
  tratamientoPrevio: string;
  prioridad: 'Alta' | 'Normal';
  diasRestantes: number;
  alertaDespacho: string;
  markdownOutput: string;
  cuñetesPintura: number; // 5 galones por cuñete
  galonesSueltosPintura: number;
  cuñetesSellador: number;
  galonesSueltosSellador: number;
  skuPinturaSugerido: string;
  skuSelladorSugerido: string;
  total_galones?: number;
  productoNombre?: string;
  cunetes_5gal?: number;
  costo_total_estimado?: number;
  costo_flete?: number;
  costo_flete_original?: number;
  es_flete_gratis?: boolean;
  tiempo_entrega_estimado?: string;
  modalidad_entrega?: 'domicilio' | 'retiro_tienda';
  hub_despacho?: string;
  tipo_zona_logistica?: string;
}

export interface AIAnalysis {
  diagnosticoDetallado: string;
  pasosPreparacion: string[];
  herramientasRequeridas: string[];
  condicionesClimaticas: string;
  tiemposSecado: string;
  precaucionesSeguridad: string[];
}

export interface COLORLINKOrder {
  id: string;
  numeroOrden: string;
  fechaCreacion: string;
  form?: FMVFormData;
  calculo?: CalculationResult;
  aiAnalysis?: AIAnalysis;
  estado: 
    | 'Cotizado' 
    | 'Cotización'
    | 'Cotización Guardada'
    | 'Pendiente Alistamiento' 
    | 'En Bodega'
    | 'En Procesamiento'
    | 'En Producción' 
    | 'Listo para Despacho' 
    | 'Despachado' 
    | 'Entregado'
    | string;
  observacionesBodega?: string;
  responsableAlistamiento?: string;
  guiaDespacho?: string;
  customerDocument?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  direccionEntrega?: string;
  ciudadEntrega?: string;
  departamentoEntrega?: string;
  items?: CartItem[];
  total?: number;
}

export interface ProductVariant {
  id: string;
  nombre: string;
  medida: string;
  precio: number;
  sku: string;
  color?: string;
  presentacion?: string;
  stock?: number;
  stockMinimo?: number;
  disponible?: boolean;
  imagenUrl?: string;
}

export type CatalogCategoryKey = 
  | 'interiores'
  | 'exteriores'
  | 'metales_madera'
  | 'herramientas'
  | 'especiales';

export interface CatalogProduct {
  id: string;
  nombre: string;
  marca: 'Pintuco' | 'Color In';
  linea: string;
  tipoPintura: string;
  ambienteIdeal: string[];
  acabado: string;
  garantia: string;
  garantiaAnos?: number;
  lavabilidad: string;
  voc: string;
  rendimientoEstimado: string;
  rendimientoBaseM2: number; // e.g. 30 m2/gal
  descripcion: string;
  skuBase: string;
  imagenUrl: string;
  imagenCuneteUrl?: string;
  imagenVariantes?: { [variantId: string]: string };
  presetSuperficie?: SuperficieTipo;
  presetAmbiente?: AmbienteTipo;
  // Precios de referencia
  precioGalon?: number;
  precioCunete?: number;
  precioCuarto?: number;
  precioUnidad?: number;
  // Campos técnicos NTC 1335
  secadoAlTacto?: string;       // e.g. '1 - 2 horas'
  secadoSegundaMano?: string;   // e.g. '3 - 4 horas'
  secadoCuradoTotal?: string;   // e.g. '24 horas / 7 días lavado'
  tipoUso?: string[];
  coloresCertificados?: string[];
  presentacionesDisponibles?: string[];
  // Categorización y variantes
  categoriaCatalogo?: CatalogCategoryKey;
  variantes?: ProductVariant[];
  // Promociones y Ofertas reales
  enOferta?: boolean;
  badgeOferta?: string;
  descuentoPorcentaje?: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  nombre: string;
  marca: 'Pintuco' | 'Color In';
  categoria: 'Pintura Fachada' | 'Pintura Interior' | 'Zonas Húmedas' | 'Selladores' | 'Esmaltes';
  stockGalones: number;
  stockCuñetes: number;
  stockMinimoGalones: number;
  ubicacionBodega: string;
  costoUnitarioGL: number;
  precioVentaGL: number;
  ultimoLote: string;
}

export interface CartItem {
  id: string;
  nombre: string;
  sku: string;
  presentacion: 'Galón' | 'Cuñete (5 Gal)' | 'Cuarto (1/4 Gal)' | 'Caneca' | 'Unidad';
  cantidad: number;
  precioUnitario: number;
  colorSeleccionado?: string;
  imagenUrl?: string;
  marca?: string;
  subtotal?: number;
  varianteSeleccionada?: string;
  tiempoEstimadoEntrega?: string;
  esPersonalizado?: boolean;
  acabado?: 'Mate' | 'Satinado' | 'Semibrillante' | 'Brillante' | string;
}

export type UserRoleType = 'cliente' | 'funcionario' | 'distribuidor' | 'administrador' | 'transportista';

export interface UserAddress {
  id: string;
  etiqueta: string; // ej. "Casa", "Oficina", "Obra / Proyecto Santa Marta", "Bodega Principal"
  direccion: string;
  ciudad: string;
  departamento?: string;
  detalles?: string;
  esPredeterminada: boolean;
}

export interface UserSession {
  id?: string;
  nombre: string;
  email: string;
  documento: string;
  cedula?: string;
  tipoDocumento: TipoDocumento;
  ciudad: string;
  direccion?: string;
  address?: string;
  telefono: string;
  userType?: UserRoleType;
  isLoggedIn: boolean;
  isCorporate?: boolean;
  corporateRole?: CorporateRole;
  departamento?: string;
  cargo?: string;
  isSuperAdmin?: boolean;
  direcciones?: UserAddress[];
  sessionToken?: string;
}

export interface OmniNotificationEvent {
  orderId: string;
  numeroOrden: string;
  clienteNombre: string;
  telefono: string;
  email: string;
  ciudad: string;
  nuevoEstado: 'Recibido' | 'En Bodega' | 'En Camino' | 'Entregado';
  fecha: string;
  guiaTransporte?: string;
  placaCamion?: string;
  totalCOP?: number;
}

