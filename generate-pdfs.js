import PDFDocument from 'pdfkit'
import { createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, 'storage', 'contracts')

const contracts = [
  {
    filename: '01-arrendamiento-nave-b14-zf-americas.pdf',
    title: 'CONTRATO DE ARRENDAMIENTO DE NAVE INDUSTRIAL',
    subtitle: 'Zona Franca Las Américas – Unidad B-14',
    body: `En la ciudad de Santiago de los Caballeros, República Dominicana, a los quince (15) días del mes de marzo del año dos mil veinticuatro (2024), comparecen:

ARRENDADOR: ZONA FRANCA LAS AMÉRICAS S.A., RNC No. 1-30-12847-5, representada por su Gerente General Eduardo Montero Ávila, en adelante "EL ARRENDADOR".

ARRENDATARIO: IMPORTACIONES DEL CARIBE S.R.L., RNC No. 1-30-98234-1, representada por su Directora General Patricia Villanueva Soto, en adelante "EL ARRENDATARIO".

PRIMERO – OBJETO DEL CONTRATO
EL ARRENDADOR cede en arrendamiento a EL ARRENDATARIO la Nave Industrial identificada como Unidad B-14, con una superficie de dos mil cuatrocientos metros cuadrados (2,400 m²), ubicada dentro del parque industrial de la Zona Franca Las Américas, Santiago, para uso exclusivo de almacenamiento de mercancías textiles destinadas a exportación, conforme a la Ley No. 8-90 sobre Fomento de las Zonas Francas.

SEGUNDO – PLAZO
El presente contrato tendrá una vigencia de tres (3) años, iniciando el primero (1°) de abril de 2024 y venciendo el treinta y uno (31) de marzo de 2027. Las partes podrán renovar el contrato por períodos iguales y sucesivos de un (1) año, siempre que ninguna de las partes notifique su intención de no renovar con al menos noventa (90) días de anticipación al vencimiento.

TERCERO – CANON DE ARRENDAMIENTO
El canon mensual pactado es de cuatro mil ochocientos dólares estadounidenses (USD 4,800.00), pagaderos dentro de los primeros cinco (5) días hábiles de cada mes. El incumplimiento en el pago generará un interés moratorio del uno punto cinco por ciento (1.5%) mensual sobre el saldo insoluto, sin perjuicio del derecho de EL ARRENDADOR a resolver el contrato tras dos (2) mensualidades consecutivas impagadas.

CUARTO – DEPÓSITO DE GARANTÍA
EL ARRENDATARIO entregará un depósito equivalente a dos (2) meses de canon, es decir, nueve mil seiscientos dólares (USD 9,600.00), al momento de la firma. Dicho depósito será devuelto dentro de los treinta (30) días siguientes a la entrega del inmueble en condiciones adecuadas.

QUINTO – OBLIGACIONES DEL ARRENDATARIO
EL ARRENDATARIO se obliga a: (i) mantener la nave en buen estado de conservación; (ii) no realizar modificaciones estructurales sin autorización escrita; (iii) cumplir con todas las regulaciones aduaneras y de la zona franca; (iv) contratar y mantener vigente un seguro de responsabilidad civil por un mínimo de USD 500,000.00.

SEXTO – PENALIDAD POR TERMINACIÓN ANTICIPADA
La rescisión anticipada por parte de EL ARRENDATARIO conllevará el pago de una penalidad equivalente a tres (3) meses de canon.

SÉPTIMO – LEY APLICABLE
El presente contrato se rige por la legislación dominicana. Las controversias serán sometidas a arbitraje ante CERTUS.

Firmado en dos originales de igual valor, en la fecha indicada en el encabezado.

_______________________          _______________________
EL ARRENDADOR                    EL ARRENDATARIO
Eduardo Montero Ávila            Patricia Villanueva Soto`
  },
  {
    filename: '02-servicios-logisticos-3pl-zf-norte.pdf',
    title: 'CONTRATO DE PRESTACIÓN DE SERVICIOS LOGÍSTICOS',
    subtitle: 'Operador 3PL – Zona Franca Industrial del Norte',
    body: `En Bogotá, D.C., República de Colombia, a los tres (3) días del mes de enero del año dos mil veinticinco (2025):

PRESTADOR: ANDINA LOGÍSTICA INTEGRAL S.A.S., NIT 900.234.871-3, representada por Camilo Restrepo Lara, en adelante "EL PRESTADOR".

CLIENTE: MANUFACTURAS GLOBALES DE COLOMBIA S.A., NIT 800.198.432-7, representada por Luciana Fernández Ospina, en adelante "EL CLIENTE".

PRIMERA – OBJETO
EL PRESTADOR se compromete a prestar servicios logísticos integrales 3PL dentro de las instalaciones de la Zona Franca Industrial del Norte: recepción de mercancías, almacenamiento en estanterías de alta densidad, gestión de inventarios en sistema WMS, preparación de pedidos (picking y packing), y despacho hacia destinos nacionales e internacionales.

SEGUNDA – VIGENCIA
El contrato regirá desde el primero (1°) de febrero de 2025 hasta el treinta y uno (31) de enero de 2027, con posibilidad de renovación automática por períodos anuales si ninguna de las partes manifiesta lo contrario mediante comunicación escrita con sesenta (60) días de anticipación.

TERCERA – TARIFAS Y FORMA DE PAGO
Las tarifas aplicables se establecen en el Anexo Tarifario No. 1. EL PRESTADOR emitirá facturas quincenales. EL CLIENTE dispondrá de quince (15) días calendario para el pago. Los pagos vencidos causarán un recargo del dos por ciento (2%) mensual.

CUARTA – NIVELES DE SERVICIO (SLA)
EL PRESTADOR garantiza: (a) precisión de inventario mínima del 99.5%; (b) despacho de órdenes dentro de las veinticuatro (24) horas siguientes a su confirmación; (c) disponibilidad del sistema WMS del 98% mensual. El incumplimiento reiterado por dos (2) períodos consecutivos otorga a EL CLIENTE el derecho a resolver el contrato sin penalidad.

QUINTA – RESPONSABILIDAD POR DAÑOS
EL PRESTADOR responderá por pérdidas o daños hasta un límite de quinientos dólares (USD 500.00) por evento de negligencia comprobada, salvo cobertura adicional contratada.

SEXTA – CONFIDENCIALIDAD
Ambas partes mantienen reserva absoluta sobre información comercial. Esta obligación subsistirá por dos (2) años tras la terminación del contrato.

SÉPTIMA – TERMINACIÓN
Por incumplimiento grave con requerimiento escrito y plazo de treinta (30) días para subsanar.

OCTAVA – SOLUCIÓN DE CONTROVERSIAS
Conciliación ante la Cámara de Comercio de Bogotá como requisito previo a cualquier acción judicial.

Suscrito en la ciudad y fecha indicadas, en dos ejemplares originales.

_______________________          _______________________
EL PRESTADOR                     EL CLIENTE
Camilo Restrepo Lara             Luciana Fernández Ospina`
  },
  {
    filename: '03-almacenamiento-distribucion-zf-colon.pdf',
    title: 'CONTRATO DE ALMACENAMIENTO Y DISTRIBUCIÓN',
    subtitle: 'Zona Franca de Colón – República de Panamá',
    body: `En la ciudad de Colón, República de Panamá, a los veintidós (22) días del mes de julio de dos mil veinticuatro (2024):

DEPOSITARIO: COLÓN FREE ZONE WAREHOUSING CORP., inscrita en la ficha 887234, representada por Marco Aurelio Pittí, en adelante "EL DEPOSITARIO".

DEPOSITANTE: ELECTRODOMÉSTICOS DEL ISTMO S.A., inscrita bajo la ficha 654110, representada por Rebeca Chong Lim, en adelante "EL DEPOSITANTE".

CLÁUSULA PRIMERA – OBJETO
EL DEPOSITARIO recibirá, custodiará y distribuirá mercancías de la categoría de electrodomésticos y electrónica de consumo, almacenadas en la bodega No. 7-C del complejo de Zona Franca de Colón, con una capacidad asignada de ochocientas (800) posiciones de pallet.

CLÁUSULA SEGUNDA – PLAZO
La vigencia del contrato es de dieciocho (18) meses, desde el primero (1°) de agosto de 2024 hasta el treinta y uno (31) de enero de 2026. Vencido dicho plazo, el contrato se prorrogará automáticamente por períodos de seis (6) meses, salvo aviso contrario con cuarenta y cinco (45) días de antelación.

CLÁUSULA TERCERA – TARIFAS
USD 25.00 por posición de pallet ocupada/mes, con un mínimo garantizado de cuatrocientas (400) posiciones. Los servicios de distribución local se facturarán por entrega según el Anexo B. Facturación mensual, vencimiento a los diez (10) días calendario.

CLÁUSULA CUARTA – OBLIGACIONES DEL DEPOSITARIO
(i) Mantener las instalaciones con temperatura controlada entre 15°C y 25°C; (ii) proporcionar acceso al sistema de trazabilidad en línea; (iii) emitir reportes de inventario semanales; (iv) gestionar los despachos dentro de las cuarenta y ocho (48) horas de recibida la orden de entrega.

CLÁUSULA QUINTA – PENALIDADES POR INCUMPLIMIENTO
El retraso en despachos superiores a cuarenta y ocho (48) horas generará un descuento automático del cinco por ciento (5%) sobre la factura del mes correspondiente por cada evento. Los daños por manejo incorrecto serán cubiertos al cien por ciento (100%) del valor CIF declarado de las mercancías afectadas.

CLÁUSULA SEXTA – SEGURO
EL DEPOSITANTE deberá mantener seguro de carga vigente sobre las mercancías almacenadas por el valor total del inventario.

CLÁUSULA SÉPTIMA – RESCISIÓN ANTICIPADA
La rescisión por parte de EL DEPOSITANTE conllevará el pago de la tarifa mínima garantizada por los meses restantes del período vigente, sin descuento alguno.

CLÁUSULA OCTAVA – JURISDICCIÓN
Tribunales Civiles de la ciudad de Colón.

Firmado en Colón, en la fecha indicada.

_______________________          _______________________
EL DEPOSITARIO                   EL DEPOSITANTE
Marco Aurelio Pittí              Rebeca Chong Lim`
  },
  {
    filename: '04-operacion-aduanera-zofri-chile.pdf',
    title: 'CONTRATO DE SERVICIOS DE OPERACIÓN ADUANERA',
    subtitle: 'Zona Franca de Iquique (ZOFRI) – Chile',
    body: `En Iquique, Chile, a los cinco (5) días del mes de septiembre de dos mil veintitrés (2023):

AGENTE: ZOFRI CUSTOMS SERVICES LIMITADA, licencia No. 00412 del Servicio Nacional de Aduanas, representada por Rodrigo Valenzuela Ibáñez, en adelante "EL AGENTE".

MANDANTE: MINERA ATACAMA EXPORT LTDA., RUT 76.345.219-8, representada por Jorge Espinoza Tapia, en adelante "EL MANDANTE".

PRIMERA – OBJETO DEL MANDATO
EL MANDANTE encomienda a EL AGENTE la realización de todas las gestiones aduaneras necesarias para la importación y exportación de insumos mineros a través de la Zona Franca de Iquique: presentación de declaraciones de ingreso y salida, clasificación arancelaria, coordinación con el Servicio Nacional de Aduanas, gestión de certificados de origen y resolución de observaciones aduaneras.

SEGUNDA – VIGENCIA
El contrato tendrá una duración de dos (2) años contados desde el primero (1°) de octubre de 2023 hasta el treinta (30) de septiembre de 2025. Se renovará automáticamente por períodos anuales salvo notificación escrita con noventa (90) días de anticipación. NOTA: Este contrato se encuentra vencido a la fecha.

TERCERA – HONORARIOS
Honorarios conforme a la escala del Anexo de Tarifas No. 1. Pago mínimo mensual garantizado: ochocientos cincuenta dólares (USD 850.00). Pago dentro de los veinte (20) días siguientes a la recepción de factura.

CUARTA – OBLIGACIONES DE EL AGENTE
(i) Actuar con diligencia y pericia en todas las gestiones encomendadas; (ii) mantener al MANDANTE informado en cuatro (4) horas hábiles de cualquier evento relevante; (iii) conservar la documentación aduanera por un período mínimo de cinco (5) años; (iv) responder personalmente ante el Servicio Nacional de Aduanas por las declaraciones presentadas.

QUINTA – RESPONSABILIDAD Y MULTAS
EL AGENTE asumirá el costo de las multas impuestas por el Servicio Nacional de Aduanas cuando sean consecuencia directa de errores u omisiones imputables al propio AGENTE. Las multas derivadas de información incorrecta proporcionada por EL MANDANTE serán de cargo exclusivo de este último.

SEXTA – EXCLUSIVIDAD
Durante la vigencia del contrato, EL MANDANTE se compromete a canalizar el cien por ciento (100%) de sus operaciones aduaneras en ZOFRI a través de EL AGENTE.

SÉPTIMA – TERMINACIÓN POR JUSTA CAUSA
El incumplimiento grave de las obligaciones de cualquier parte facultará a la otra para resolver el contrato con quince (15) días de preaviso escrito. La pérdida o suspensión de la licencia aduanera de EL AGENTE producirá la resolución automática e inmediata del contrato.

OCTAVA – DERECHO APLICABLE
Este contrato se rige por la Ley Orgánica del Servicio Nacional de Aduanas y el Código de Comercio de Chile.

Firmado en Iquique, en la fecha indicada, en dos ejemplares.

_______________________          _______________________
EL AGENTE                        EL MANDANTE
Rodrigo Valenzuela Ibáñez        Jorge Espinoza Tapia`
  },
  {
    filename: '05-suministro-energia-electrica-zf-montevideo.pdf',
    title: 'CONTRATO DE SUMINISTRO DE ENERGÍA ELÉCTRICA',
    subtitle: 'Zona Franca Montevideo – Uruguay | Con Penalidades SLA',
    body: `En Montevideo, República Oriental del Uruguay, a los doce (12) días del mes de noviembre de dos mil veinticuatro (2024):

SUMINISTRADOR: ENERGÍA INDUSTRIAL ZFM S.A., habilitada por URSEA resolución No. 2019/441, RUT 21.456.789.0012, representada por Marcelo Hurtado Pereyra, en adelante "EL SUMINISTRADOR".

USUARIO: ZONA FRANCA MONTEVIDEO OPERACIONES S.A., RUT 21.987.654.0023, representada por Daniela Acosta Ferreiro, en adelante "EL USUARIO".

CLÁUSULA PRIMERA – OBJETO
EL SUMINISTRADOR se obliga a proveer energía eléctrica de forma continua y estable a las instalaciones industriales de EL USUARIO ubicadas en la Zona Franca Montevideo, con una potencia contratada de dos megavatios (2 MW) en media tensión (15 kV).

CLÁUSULA SEGUNDA – PLAZO
Vigencia de tres (3) años, desde el primero (1°) de diciembre de 2024 hasta el treinta (30) de noviembre de 2027. La renovación será automática por períodos bianuales, salvo comunicación fehaciente de rescisión con ciento veinte (120) días de anticipación al vencimiento de cada período.

CLÁUSULA TERCERA – PRECIO Y FACTURACIÓN
Tarifa MT-3 regulada por URSEA vigente al momento de la facturación, con un cargo fijo mensual por potencia contratada de tres mil quinientos dólares (USD 3,500.00). Facturación mensual, vencimiento a quince (15) días calendario desde la emisión.

CLÁUSULA CUARTA – NIVELES DE SERVICIO Y PENALIDADES (SLA)
EL SUMINISTRADOR garantiza los siguientes indicadores:

- Disponibilidad mínima: 99.7% mensual (máximo 2.2 horas de interrupción acumulada/mes).
- Tiempo máximo de restablecimiento: cuatro (4) horas para interrupciones no programadas.
- Calidad de tensión: variación máxima de ±5% respecto a la tensión nominal (norma IEC 61000).

PENALIDADES AUTOMÁTICAS (aplicadas como descuento en factura):
- Por cada hora de interrupción que exceda el límite mensual: descuento de USD 500.00.
- Por cada evento de calidad de tensión fuera de norma documentado: descuento de USD 200.00.
- Si la disponibilidad mensual cae por debajo del 98%: EL USUARIO podrá resolver el contrato sin penalidad + indemnización de USD 20,000.00.

CLÁUSULA QUINTA – INTERRUPCIONES PROGRAMADAS
Máximo ocho (8) horas acumuladas por trimestre, con un mínimo de setenta y dos (72) horas de aviso previo. Las interrupciones programadas dentro de estos límites no computarán para el cálculo de penalidades.

CLÁUSULA SEXTA – FUERZA MAYOR
Las interrupciones causadas por eventos de fuerza mayor debidamente certificados por URSEA quedan excluidas del régimen de penalidades. EL SUMINISTRADOR deberá notificar la ocurrencia dentro de las seis (6) horas del evento.

CLÁUSULA SÉPTIMA – MEDICIÓN Y AUDITORÍA
Los consumos se medirán mediante medidor bidireccional homologado. EL USUARIO tiene derecho a solicitar auditorías de medición con periodicidad semestral.

CLÁUSULA OCTAVA – RESOLUCIÓN ANTICIPADA POR EL USUARIO
La rescisión anticipada sin causa justificada conllevará el pago de una penalidad equivalente al cargo fijo mensual multiplicado por los meses restantes del período contractual en curso, con un máximo de doce (12) mensualidades.

CLÁUSULA NOVENA – DERECHO APLICABLE Y JURISDICCIÓN
Ley No. 16.832, resoluciones de URSEA y Código Civil de Uruguay. Controversias ante el Tribunal Arbitral del Uruguay (TAU).

Suscrito en Montevideo, en la fecha y lugar indicados, en dos ejemplares originales.

_______________________          _______________________
EL SUMINISTRADOR                 EL USUARIO
Marcelo Hurtado Pereyra          Daniela Acosta Ferreiro`
  }
]

function createPDF(contract) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' })
    const outputPath = join(OUTPUT_DIR, contract.filename)
    const stream = createWriteStream(outputPath)

    doc.pipe(stream)

    // Header
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(contract.title, { align: 'center' })
      .fontSize(11)
      .font('Helvetica')
      .text(contract.subtitle, { align: 'center' })
      .moveDown(1.5)

    // Divider
    doc
      .moveTo(60, doc.y)
      .lineTo(535, doc.y)
      .strokeColor('#cccccc')
      .stroke()
      .moveDown(1)

    // Body
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#1a1a1a')
      .text(contract.body, {
        align: 'justify',
        lineGap: 4
      })

    // Footer
    doc
      .moveDown(2)
      .fontSize(8)
      .fillColor('#999999')
      .text('Documento generado para uso demostrativo – ContractOS', { align: 'center' })

    doc.end()
    stream.on('finish', () => resolve(outputPath))
    stream.on('error', reject)
  })
}

console.log('Generating PDFs...')
const results = await Promise.all(contracts.map(c => createPDF(c)))
results.forEach(p => console.log('✓', p))
console.log('Done.')
