const PDFDocument = require('pdfkit');

class PDFService {
  static generateInvoicePDF(sale, companyInfo) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [80, 200], // Tamaño térmico 80mm
          margins: { top: 10, bottom: 10, left: 5, right: 5 },
          bufferPages: true
        });

        const buffers = [];
        doc.on('data', buffer => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Configuración de fuentes
        doc.font('Helvetica');

        // Encabezado - Nombre de la empresa
        doc.fontSize(10).font('Helvetica-Bold').text(companyInfo.nombre || 'MI NEGOCIO', { align: 'center' });
        doc.moveDown(0.2);

        // NIT y dirección
        doc.fontSize(7).font('Helvetica').text(`NIT: ${companyInfo.nit || '900123456-7'}`, { align: 'center' });
        doc.text(companyInfo.direccion || 'Dirección', { align: 'center' });
        doc.text(`Tel: ${companyInfo.telefono || ''}`, { align: 'center' });
        doc.moveDown(0.5);

        // Línea separadora
        doc.moveTo(5, doc.y).lineTo(75, doc.y).stroke();
        doc.moveDown(0.3);

        // Título de factura
        doc.fontSize(9).font('Helvetica-Bold').text('FACTURA DE VENTA', { align: 'center' });
        doc.moveDown(0.2);

        // Número de venta y fecha
        doc.fontSize(7).font('Helvetica').text(`Venta #: ${sale.saleNumber}`, { align: 'left' });
        const fecha = new Date(sale.saleDate).toLocaleString('es-CO');
        doc.text(`Fecha: ${fecha}`, { align: 'right' });
        doc.moveDown(0.3);

        // Información del cliente si existe
        if (sale.customer && sale.customer.name) {
          doc.fontSize(7).font('Helvetica-Bold').text('CLIENTE:');
          doc.fontSize(7).font('Helvetica').text(sale.customer.name);
          if (sale.customer.document) {
            doc.text(`Doc: ${sale.customer.document}`);
          }
          doc.moveDown(0.3);
        }

        // Línea separadora
        doc.moveTo(5, doc.y).lineTo(75, doc.y).stroke();
        doc.moveDown(0.3);

        // Encabezados de tabla
        doc.fontSize(7).font('Helvetica-Bold');
        doc.text('CANT', 5, doc.y, { width: 10 });
        doc.text('DESCRIPCION', 15, doc.y, { width: 35 });
        doc.text('TOTAL', 55, doc.y, { width: 20, align: 'right' });
        doc.moveDown(0.2);

        // Línea separadora
        doc.moveTo(5, doc.y).lineTo(75, doc.y).stroke();
        doc.moveDown(0.2);

        // Ítems
        doc.fontSize(6).font('Helvetica');
        sale.items.forEach((item, index) => {
          const y = doc.y;
          
          doc.text(item.quantity.toString(), 5, y, { width: 10 });
          
          const description = item.productName.length > 20 
            ? item.productName.substring(0, 20) + '...' 
            : item.productName;
          doc.text(description, 15, y, { width: 35 });
          
          doc.text(`$${item.subtotal.toLocaleString('es-CO')}`, 55, y, { width: 20, align: 'right' });
          
          doc.moveDown(0.3);
          
          // Verificar si necesitamos nueva página
          if (doc.y > 180) {
            doc.addPage();
          }
        });

        // Línea separadora
        doc.moveTo(5, doc.y).lineTo(75, doc.y).stroke();
        doc.moveDown(0.3);

        // Totales
        doc.fontSize(7).font('Helvetica');
        doc.text(`Subtotal:`, 5, doc.y, { width: 40 });
        doc.text(`$${sale.subtotal.toLocaleString('es-CO')}`, 45, doc.y, { width: 30, align: 'right' });
        doc.moveDown(0.2);

        doc.text(`IVA (${(sale.taxRate * 100).toFixed(0)}%):`, 5, doc.y, { width: 40 });
        doc.text(`$${sale.tax.toLocaleString('es-CO')}`, 45, doc.y, { width: 30, align: 'right' });
        doc.moveDown(0.3);

        doc.fontSize(8).font('Helvetica-Bold');
        doc.text(`TOTAL:`, 5, doc.y, { width: 40 });
        doc.text(`$${sale.total.toLocaleString('es-CO')}`, 45, doc.y, { width: 30, align: 'right' });
        doc.moveDown(0.3);

        // Método de pago
        doc.fontSize(7).font('Helvetica');
        const metodoPago = {
          'cash': 'Efectivo',
          'card': 'Tarjeta',
          'credit': 'Crédito',
          'transfer': 'Transferencia'
        };
        doc.text(`Pago: ${metodoPago[sale.paymentMethod] || sale.paymentMethod}`, { align: 'center' });
        
        if (sale.paymentMethod === 'cash') {
          doc.text(`Pagado: $${sale.paidAmount.toLocaleString('es-CO')}`, { align: 'center' });
          doc.text(`Cambio: $${sale.changeAmount.toLocaleString('es-CO')}`, { align: 'center' });
        }
        doc.moveDown(0.3);

        // Línea separadora
        doc.moveTo(5, doc.y).lineTo(75, doc.y).stroke();
        doc.moveDown(0.3);

        // Mensaje final
        doc.fontSize(6).font('Helvetica').text('¡Gracias por su compra!', { align: 'center' });
        doc.text(companyInfo.mensaje || 'Vuelva pronto', { align: 'center' });
        doc.moveDown(0.3);

        // Resolución DIAN (placeholder)
        doc.fontSize(5).font('Helvetica').text('Resolución DIAN: 18764000000001', { align: 'center' });

        // Finalizar documento
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static generateInvoicePDFA4(sale, companyInfo) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const buffers = [];
        doc.on('data', buffer => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Encabezado
        doc.fontSize(20).font('Helvetica-Bold').text(companyInfo.nombre || 'MI NEGOCIO', 50, 50);
        doc.fontSize(10).font('Helvetica').text(`NIT: ${companyInfo.nit || '900123456-7'}`, 50, 75);
        doc.text(companyInfo.direccion || 'Dirección', 50, 90);
        doc.text(`Tel: ${companyInfo.telefono || ''}`, 50, 105);
        doc.text(companyInfo.ciudad || 'Ciudad', 50, 120);

        // Título
        doc.fontSize(16).font('Helvetica-Bold').text('FACTURA DE VENTA', 400, 50);
        doc.fontSize(10).font('Helvetica').text(`Venta #: ${sale.saleNumber}`, 400, 75);
        const fecha = new Date(sale.saleDate).toLocaleString('es-CO');
        doc.text(`Fecha: ${fecha}`, 400, 90);

        // Información del cliente
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DEL CLIENTE');
        doc.fontSize(10).font('Helvetica');
        if (sale.customer && sale.customer.name) {
          doc.text(`Nombre: ${sale.customer.name}`);
          if (sale.customer.document) {
            doc.text(`Documento: ${sale.customer.documentType || 'CC'} ${sale.customer.document}`);
          }
        } else {
          doc.text('Cliente: Consumidor Final');
        }

        // Tabla de ítems
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').text('DETALLE DE LA VENTA');
        doc.moveDown(0.5);

        // Encabezados de tabla
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('CANT', 50, tableTop);
        doc.text('DESCRIPCIÓN', 100, tableTop);
        doc.text('PRECIO UNIT.', 300, tableTop);
        doc.text('SUBTOTAL', 450, tableTop);

        // Línea
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Ítems
        doc.fontSize(10).font('Helvetica');
        let y = tableTop + 25;
        sale.items.forEach((item) => {
          doc.text(item.quantity.toString(), 50, y);
          doc.text(item.productName, 100, y);
          doc.text(`$${item.unitPrice.toLocaleString('es-CO')}`, 300, y);
          doc.text(`$${item.subtotal.toLocaleString('es-CO')}`, 450, y);
          y += 20;
        });

        // Totales
        doc.moveDown(1);
        const totalsY = doc.y;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Subtotal:`, 350, totalsY);
        doc.text(`$${sale.subtotal.toLocaleString('es-CO')}`, 450, totalsY);
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`IVA (${(sale.taxRate * 100).toFixed(0)}%):`, 350, totalsY + 20);
        doc.text(`$${sale.tax.toLocaleString('es-CO')}`, 450, totalsY + 20);

        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`TOTAL:`, 350, totalsY + 45);
        doc.text(`$${sale.total.toLocaleString('es-CO')}`, 450, totalsY + 45);

        // Método de pago
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica');
        const metodoPago = {
          'cash': 'Efectivo',
          'card': 'Tarjeta',
          'credit': 'Crédito',
          'transfer': 'Transferencia'
        };
        doc.text(`Método de Pago: ${metodoPago[sale.paymentMethod] || sale.paymentMethod}`);
        
        if (sale.paymentMethod === 'cash') {
          doc.text(`Monto Pagado: $${sale.paidAmount.toLocaleString('es-CO')}`);
          doc.text(`Cambio: $${sale.changeAmount.toLocaleString('es-CO')}`);
        }

        // Mensaje final
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica').text('¡Gracias por su compra!', { align: 'center' });
        doc.text(companyInfo.mensaje || 'Vuelva pronto', { align: 'center' });

        // Pie de página
        doc.fontSize(8).text('Resolución DIAN: 18764000000001', 50, 750, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFService;
