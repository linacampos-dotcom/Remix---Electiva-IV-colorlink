import { COLORLINKOrder, CartItem, UserSession } from '../types';
import { sendPaymentOtpEmail, verifyPaymentOtp, sendOrderReceiptEmail } from './emailService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { persistShippingAddress } from './ordersService';

export interface PaymentProcessParams {
  order: COLORLINKOrder;
  userEmail: string;
  customerName: string;
}

export interface PaymentProcessResult {
  success: boolean;
  order?: COLORLINKOrder;
  receiptSent?: boolean;
  previewUrl?: string;
  error?: string;
}

/**
 * Servicio de Pagos Transaccionales con Validación OTP y Recibo Oficial
 */
export const paymentService = {
  /**
   * Solicita el código OTP de 6 dígitos al correo del cliente
   */
  async requestOtp(
    email: string,
    customerName: string,
    totalCOP: number,
    orderNumber: string
  ) {
    return sendPaymentOtpEmail(email, customerName, totalCOP, orderNumber);
  },

  /**
   * Valida el código OTP ingresado por el usuario
   */
  async verifyOtp(email: string, otp: string) {
    return verifyPaymentOtp(email, otp);
  },

  /**
   * Procesa la aprobación final del pago, actualiza Supabase con estado 'paid'
   * y despacha el recibo oficial por correo electrónico.
   */
  async completeOrderPayment(params: PaymentProcessParams): Promise<PaymentProcessResult> {
    const { order, userEmail, customerName } = params;
    const cleanEmail = userEmail.trim().toLowerCase();

    // 1. Establecer el estado oficial de la orden como 'paid'
    const paidOrder: COLORLINKOrder = {
      ...order,
      estado: 'paid',
      customerEmail: cleanEmail,
      customerName: customerName || order.customerName || 'Cliente Pintuco',
    };

    // 2. Persistir en la tabla 'orders' de Supabase con status 'paid'
    if (isSupabaseConfigured) {
      try {
        const payload = {
          order_number: paidOrder.numeroOrden,
          user_email: cleanEmail,
          customer_name: paidOrder.customerName,
          customer_phone: paidOrder.customerPhone || '',
          customer_document: paidOrder.customerDocument || '',
          shipping_address: paidOrder.direccionEntrega || 'Dirección registrada',
          city: paidOrder.ciudadEntrega || 'Colombia',
          department: paidOrder.departamentoEntrega || '',
          delivery_mode: (paidOrder.form as any)?.modalidad_entrega || 'domicilio',
          items: paidOrder.items || [],
          total: paidOrder.total || 0,
          status: 'paid',
          created_at: paidOrder.fechaCreacion || new Date().toISOString(),
        };

        const { error } = await supabase.from('orders').upsert([payload], { onConflict: 'order_number' });
        if (error) {
          console.warn('Nota: Inserción en Supabase orders (paid):', error.message);
        }
      } catch (dbErr) {
        console.warn('Error guardando orden pagada en Supabase:', dbErr);
      }
    }

    // 3. Persistir en localStorage para sincronización instantánea
    try {
      const stored = localStorage.getItem('colorlink_orders');
      const existing: COLORLINKOrder[] = stored ? JSON.parse(stored) : [];
      const updated = [paidOrder, ...existing.filter((o) => o.numeroOrden !== paidOrder.numeroOrden)];
      localStorage.setItem('colorlink_orders', JSON.stringify(updated));
      localStorage.setItem('colorlink_last_order', JSON.stringify(paidOrder));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Error guardando orden local:', e);
    }

    // 4. Persistir dirección de envío si aplica
    if (paidOrder.direccionEntrega) {
      persistShippingAddress(
        paidOrder.direccionEntrega,
        paidOrder.ciudadEntrega || '',
        cleanEmail,
        paidOrder.customerDocument
      );
    }

    // 5. Despachar el SEGUNDO correo electrónico con el Recibo Oficial
    let receiptSent = false;
    let previewUrl: string | undefined;

    try {
      const receiptResult = await sendOrderReceiptEmail(cleanEmail, paidOrder);
      receiptSent = receiptResult.success;
      previewUrl = receiptResult.previewUrl;
    } catch (mailErr) {
      console.warn('No se pudo enviar el recibo por correo:', mailErr);
    }

    return {
      success: true,
      order: paidOrder,
      receiptSent,
      previewUrl,
    };
  },
};

export default paymentService;
