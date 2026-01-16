# Sistema de Liquidación Salarial Profesional - Uruguay

## Arquitectura del Sistema

### 1. Modelo de Datos

#### Empleado (Extendido)
- Información básica existente
- **Nuevos campos:**
  - `cargo` (String): Cargo del empleado
  - `tipoRemuneracion` (Enum): "MENSUAL" | "JORNAL"
  - `sueldoBaseMensual` (Float?): Si es mensual
  - `valorJornal` (Float?): Si es jornal
  - `valorHoraNormal` (Float): Valor por hora normal
  - `valorHoraExtra` (Float): Valor por hora extra
  - `ticketAlimentacion` (Boolean): Derecho a ticket
  - `valorTicketDiario` (Float?): Valor del ticket si aplica

#### EventoMensual
Eventos que afectan solo la liquidación del mes (NO alteran la base):
- `id`
- `empleadoId`
- `restauranteId`
- `mes` (Int): 1-12
- `anio` (Int)
- `tipoEvento` (Enum):
  - `HORAS_EXTRA`
  - `FALTA`
  - `ADELANTO_EFECTIVO`
  - `ADELANTO_CONSUMICIONES`
  - `DESCUENTO_MANUAL`
- `cantidad` (Float): Horas, días, monto según tipo
- `valorUnitario` (Float?): Para horas extra
- `monto` (Float): Monto del evento
- `observacion` (String?)
- `fecha` (DateTime)

#### Liquidacion
Liquidación mensual completa:
- `id`
- `empleadoId`
- `restauranteId`
- `mes` (Int)
- `anio` (Int)
- `fechaCierre` (DateTime)

**HABERES:**
- `sueldoBasico` (Float)
- `jornalesDescontados` (Float)
- `horasExtras` (Float)
- `montoHorasExtras` (Float)
- `ticketAlimentacion` (Float)
- `diasTicket` (Int)
- `totalHaberes` (Float)
- `totalGravado` (Float)

**DESCUENTOS LEGALES:**
- `aporteJubilatorio` (Float) // 15%
- `frl` (Float) // 0.1%
- `seguroEnfermedad` (Float) // 3%
- `snis` (Float) // 1.5%
- `irpfBaseImponible` (Float)
- `irpfAdelantado` (Float?)
- `irpfMesesSinIRPF` (Int?)
- `irpfMonto` (Float)
- `totalDescuentosLegales` (Float)

**DESCUENTOS GENERALES:**
- `adelantosEfectivo` (Float)
- `adelantosConsumiciones` (Float)
- `descuentosManuales` (Float)
- `totalDescuentosGenerales` (Float)

**TOTALES:**
- `totalDescuentos` (Float)
- `liquidoACobrar` (Float)
- `redondeo` (Float?)

- `observaciones` (String?)
- `createdAt`, `updatedAt`

### 2. Cálculos (Uruguay)

#### Descuentos Legales
- **Aporte Jubilatorio**: 15% del total gravado
- **FRL**: 0.1% del total gravado
- **Seguro por Enfermedad**: 3% del total gravado
- **SNIS**: 1.5% del total gravado
- **IRPF**: Según tabla de BPS (se implementará lógica básica)

#### Lógica de Liquidación
1. Calcular haberes base (sueldo/jornales)
2. Aplicar eventos del mes (horas extra, faltas)
3. Calcular total gravado
4. Aplicar descuentos legales
5. Aplicar descuentos generales
6. Calcular líquido

### 3. APIs

#### `/api/eventos-mensuales`
- GET: Listar eventos (filtros: empleado, mes, año)
- POST: Crear evento

#### `/api/eventos-mensuales/[id]`
- GET: Obtener evento
- PUT: Actualizar evento
- DELETE: Eliminar evento

#### `/api/liquidaciones`
- GET: Listar liquidaciones
- POST: Generar liquidación

#### `/api/liquidaciones/[id]`
- GET: Obtener liquidación completa

### 4. Páginas

#### `/liquidaciones-profesionales`
- Listado de liquidaciones

#### `/liquidaciones-profesionales/nuevo`
- Formulario para generar nueva liquidación

#### `/liquidaciones-profesionales/[id]`
- Recibo de sueldo completo

#### `/eventos-mensuales`
- Gestión de eventos del mes
