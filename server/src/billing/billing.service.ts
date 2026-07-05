import { Injectable, Logger } from '@nestjs/common';
import { ObservabilityService } from '../observability/observability.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  
  constructor(private readonly observabilityService: ObservabilityService) {}

  /**
   * Dispersión de fondos a través de Stripe Connect (Escrow/Connected Account)
   * @param stripeAccountId ID de la cuenta conectada del complejo deportivo (B2B)
   * @param amount Monto a transferir (neto del 10% de comisión de SportMatch Connect)
   */
  async triggerStripePayout(stripeAccountId: string, amount: number): Promise<{ success: boolean; transferId: string }> {
    const startTime = Date.now();
    this.logger.log(`Iniciando dispersión de fondos (Payout) de S/. ${amount} a cuenta Stripe: ${stripeAccountId}`);

    // Simulación del cobro y transferencia
    // En producción:
    // const transfer = await this.stripe.transfers.create({
    //   amount: Math.round(amount * 100), // Stripe procesa en centavos
    //   currency: 'pen',
    //   destination: stripeAccountId,
    //   description: 'Dispersión de reserva de cancha SportMatch Connect',
    // });
    
    // Simular latencia de red de la API de Stripe Connect
    await new Promise((resolve) => setTimeout(resolve, 80)); 
    
    const duration = Date.now() - startTime;
    this.observabilityService.trackPerformance('StripeConnect Payout API Call', duration);

    const mockTransferId = `tr_mock_${Math.random().toString(36).substring(2, 15)}`;
    this.logger.log(`Dispersión exitosa. Transfer ID generado: ${mockTransferId}`);
    
    return {
      success: true,
      transferId: mockTransferId,
    };
  }

  /**
   * Emisión automática de boleta/factura electrónica mediante la API de un PSE (Proveedor de Servicios Electrónicos) para SUNAT
   * @param invoiceData Datos estructurados del cobro de la comisión (10%)
   */
  async emitElectronicInvoice(invoiceData: {
    rucOrDni: string;
    customerName: string;
    concept: string;
    subtotal: number;
  }): Promise<{ success: boolean; invoiceNumber: string; qrUrl: string }> {
    const startTime = Date.now();
    this.logger.log(`Enviando transacción de facturación a SUNAT (vía PSE) para: ${invoiceData.customerName}`);

    // Estructuración del JSON requerido por los PSE homologados en el Perú (ej. Nubefact, PSE.pe)
    const igvRate = 0.18;
    const igv = Number((invoiceData.subtotal * igvRate).toFixed(2));
    const total = Number((invoiceData.subtotal + igv).toFixed(2));

    const psePayload = {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: invoiceData.rucOrDni.length === 11 ? 'FACTURA' : 'BOLETA',
      serie: invoiceData.rucOrDni.length === 11 ? 'F001' : 'B001',
      cliente_tipo_documento: invoiceData.rucOrDni.length === 11 ? '6' : '1', // 6 = RUC, 1 = DNI
      cliente_numero_documento: invoiceData.rucOrDni,
      cliente_denominacion: invoiceData.customerName,
      fecha_de_emision: new Date().toISOString().split('T')[0],
      moneda: '1', // 1 = Soles (PEN)
      porcentaje_de_igv: 18.0,
      total_igv: igv,
      total_gravada: invoiceData.subtotal,
      total: total,
      items: [
        {
          unidad_de_medida: 'ZZ', // ZZ = Servicio
          codigo: 'SERV001',
          descripcion: invoiceData.concept,
          cantidad: 1,
          valor_unitario: invoiceData.subtotal,
          precio_unitario: total,
          subtotal: invoiceData.subtotal,
          tipo_de_igv: 1, // 1 = Gravado - Operación Onerosa
          igv: igv,
          total: total,
        },
      ],
    };

    // Simular llamada http externa a la API del PSE
    this.logger.debug(`PSE Payload estructurado: ${JSON.stringify(psePayload)}`);
    await new Promise((resolve) => setTimeout(resolve, 120));

    const duration = Date.now() - startTime;
    this.observabilityService.trackPerformance('SUNAT PSE E-Invoice API Call', duration);

    const mockInvoiceNumber = `F001-${Math.floor(100000 + Math.random() * 900000)}`;
    this.logger.log(`Comprobante electrónico emitido con éxito: ${mockInvoiceNumber}`);

    return {
      success: true,
      invoiceNumber: mockInvoiceNumber,
      qrUrl: `https://cdn.sportmatch.pe/invoices/qr/${mockInvoiceNumber}.png`,
    };
  }
}
