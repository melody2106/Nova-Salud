import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { default as pool } from '../config/db.js';
import { sendSuccess, handleError } from '../utils/responses.js';

/**
 * GET /api/reportes/alertas
 * Obtiene alertas de inventario: lotes por vencer y productos con stock bajo
 */
export async function obtenerAlertas(req: Request, res: Response): Promise<void> {
  try {
    const [lotes]: any = await pool.execute(`
      SELECT
        p.nombre_comercial,
        l.codigo_lote,
        l.fecha_vencimiento,
        l.stock_actual_lote,
        l.id_producto
      FROM Lotes l
      INNER JOIN Productos p ON l.id_producto = p.id_producto
      WHERE l.fecha_vencimiento < DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
        AND l.stock_actual_lote > 0
      ORDER BY l.fecha_vencimiento ASC
    `);

    const [productos]: any = await pool.execute(`
      SELECT
        id_producto,
        nombre_comercial,
        stock_actual_unidades,
        stock_minimo_unidades
      FROM Productos
      WHERE stock_actual_unidades <= stock_minimo_unidades
      ORDER BY stock_actual_unidades ASC
    `);

    sendSuccess(
      res,
      { lotesPorVencer: lotes, productosStockBajo: productos },
      'Alertas de inventario obtenidas exitosamente'
    );
  } catch (error) {
    handleError(res, error, 'Error al obtener alertas de inventario');
  }
}

/**
 * GET /api/reportes/pdf/:id_venta
 * Genera y descarga el comprobante de venta en formato PDF
 */
export async function descargarComprobantePDF(req: Request, res: Response): Promise<void> {
    try {
        const { id_venta } = req.params;

        // 1. Obtener la cabecera de la venta (Corregido con nombre_documento e id_tipo_comprobante)
        const [ventas]: any = await pool.execute(
            `SELECT v.id_venta, v.serie_documento, v.numero_documento, v.fecha_hora, v.total, v.metodo_pago,
                    c.nombres, c.apellidos, c.dni,
                    tc.nombre_documento as tipo_comprobante
             FROM ventas v
             INNER JOIN clientes c ON v.id_cliente = c.id_cliente
             INNER JOIN tipos_comprobantes tc ON v.id_tipo_comprobante = tc.id_tipo_comprobante
             WHERE v.id_venta = ? LIMIT 1`,
            [id_venta]
        );

        if (!ventas || ventas.length === 0) {
            res.status(404).json({ message: 'Venta no encontrada' });
            return;
        }
        const venta = ventas[0];

        // 2. Obtener los detalles de la venta (Corregido con precio_unitario y nombre_comercial)
        const [detalles]: any = await pool.execute(
            `SELECT dv.cantidad, dv.precio_unitario as precio, dv.subtotal, p.nombre_comercial as producto_nombre
             FROM detalle_ventas dv
             INNER JOIN productos p ON dv.id_producto = p.id_producto
             WHERE dv.id_venta = ?`,
            [id_venta]
        );

        // 3. Crear el diseño de la boleta en HTML
        let filasProductos = '';
        detalles.forEach((item: any) => {
            filasProductos += `
                <tr>
                    <td style="text-align: center;">${item.cantidad}</td>
                    <td>${item.producto_nombre}</td>
                    <td style="text-align: right;">S/ ${Number(item.precio).toFixed(2)}</td>
                    <td style="text-align: right;">S/ ${Number(item.subtotal).toFixed(2)}</td>
                </tr>
            `;
        });

        const htmlTemplate = `
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; line-height: 1.4; }
                    .header { text-align: center; border-bottom: 3px solid #00A65A; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { margin: 0; color: #00A65A; font-size: 28px; }
                    .info-box { display: flex; justify-content: space-between; margin-bottom: 25px; }
                    .client-info { width: 60%; font-size: 14px; }
                    .voucher-box { 
                        width: 35%; 
                        border: 2px solid #00A65A; 
                        text-align: center; 
                        padding: 10px; 
                        border-radius: 10px;
                    }
                    .voucher-box h2 { margin: 5px 0; font-size: 18px; color: #00A65A; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background-color: #00A65A; color: white; padding: 10px; text-align: left; font-size: 13px; }
                    td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
                    .total-container { margin-top: 25px; text-align: right; border-top: 2px solid #eee; padding-top: 10px; }
                    .total-row { font-size: 20px; font-weight: bold; color: #00A65A; }
                    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>NOVA SALUD</h1>
                    <p style="margin: 5px 0;">Tu salud, nuestra prioridad</p>
                </div>
                
                <div class="info-box">
                    <div class="client-info">
                        <p><strong>CLIENTE:</strong> ${venta.nombres} ${venta.apellidos}</p>
                        <p><strong>DNI/RUC:</strong> ${venta.dni}</p>
                        <p><strong>FECHA:</strong> ${new Date(venta.fecha_hora).toLocaleString()}</p>
                        <p><strong>MÉTODO DE PAGO:</strong> ${venta.metodo_pago.toUpperCase()}</p>
                    </div>
                    <div class="voucher-box">
                        <p style="margin: 0; font-weight: bold; letter-spacing: 1px;">R.U.C. 20123456789</p>
                        <h2>${venta.tipo_comprobante.toUpperCase()}</h2>
                        <p style="margin: 0; font-weight: bold;">${venta.serie_documento} - ${venta.numero_documento}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%; text-align: center;">CANT.</th>
                            <th style="width: 50%;">DESCRIPCIÓN</th>
                            <th style="width: 20%; text-align: right;">P. UNITARIO</th>
                            <th style="width: 20%; text-align: right;">SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasProductos}
                    </tbody>
                </table>

                <div class="total-container">
                    <span class="total-row">TOTAL A PAGAR: S/ ${Number(venta.total).toFixed(2)}</span>
                </div>

                <div class="footer">
                    <p>Gracias por su compra en Nova Salud.</p>
                    <p>Este documento es una representación impresa de un comprobante electrónico.</p>
                </div>
            </body>
            </html>
        `;

        // 4. Iniciar Puppeteer para generar el PDF
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        // 5. Enviar el PDF al cliente
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${venta.serie_documento}-${venta.numero_documento}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);

    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).json({ message: "Error interno al generar el comprobante" });
    }
}
