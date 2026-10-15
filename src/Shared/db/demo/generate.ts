// Genera los JSON de la demo de la presentación en demo/data/. Determinístico: la misma semilla da los mismos datos.
// Correr: pnpm build && pnpm demo:generate   (DEMO_ANCHOR=2026-10-23, DEMO_RESERVATIONS=15000, DEMO_SEED=2310, DEMO_OUT=demo/data)
// Las reservas destacadas del día de la presentación están en demo/featured.json (a mano) y se ubican primero.
// Todas cumplen las reglas de la API: horario y duración de la sucursal, empleado de turno (R-01), sin feriado adherido,
// plaza del tipo libre con el margen (R-22, R-30) y un vehículo sin dos reservas a la vez.
import fs from 'node:fs';
import path from 'node:path';
import { MOTOS } from '../seeders/vehicleSeeder.js';
import { INSURANCES } from '../seeders/vehicleSeeder.js';
import { demoCategory } from './reset.js';
import type { DemoMeta, DemoParking, DemoReservation, DemoServiceCatalog, DemoStaff, DemoUsers, DemoVehicle, Person } from './data.js';
import type { VehicleCategory } from '../../utils/vehicleTypes.js';

const ANCHOR = process.env.DEMO_ANCHOR ?? '2026-10-23';
const TOTAL = Number(process.env.DEMO_RESERVATIONS ?? 15000);
const SEED = Number(process.env.DEMO_SEED ?? 2310);
const OUT = path.resolve(process.env.DEMO_OUT ?? 'demo/data');
const FEATURED = path.resolve('demo/featured.json');
const FROM = -30, TO = 31; // un mes antes y uno después del ancla
const COUNTS = { owners: 20, clients: 200, vehicles: 250, employees: 150 };

// ---------- azar con semilla ----------
let state = SEED >>> 0;
const rnd = () => { state = (state + 0x6d2b79f5) >>> 0; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
const chance = (p: number) => rnd() < p;
const weighted = <T>(pairs: readonly (readonly [T, number])[]): T => {
  const total = pairs.reduce((a, [, w]) => a + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) { r -= w; if (r < 0) return v; }
  return pairs[pairs.length - 1]![0];
};
const shuffle = <T>(xs: T[]) => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j]!, xs[i]!]; } return xs; };
const round50 = (n: number) => Math.round(n / 50) * 50;

// ---------- fechas ----------
const [AY, AM, AD] = ANCHOR.split('-').map(Number) as [number, number, number];
const dateOf = (day: number) => new Date(Date.UTC(AY, AM - 1, AD + day));
const isoOf = (day: number) => dateOf(day).toISOString().slice(0, 10);
const dowOf = (day: number) => dateOf(day).getUTCDay(); // 0 domingo
const dayOfIso = (iso: string) => Math.round((Date.parse(iso + 'T00:00:00Z') - Date.UTC(AY, AM - 1, AD)) / 86_400_000);
const toMin = (t: string) => (t === '23:59' ? 1440 : +t.slice(0, 2) * 60 + +t.slice(3, 5));
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MON_FRI = DAYS.slice(1, 6), SAT_SUN = ['SATURDAY', 'SUNDAY'];

// ---------- personas ----------
const WOMEN = ['Sofía', 'Valentina', 'Martina', 'Camila', 'Lucía', 'Julieta', 'Florencia', 'Agustina', 'Micaela', 'Carolina', 'Paula', 'Romina', 'Natalia', 'Daniela', 'Gabriela', 'Victoria', 'Milagros', 'Rocío', 'Belén', 'Antonella', 'Lorena', 'Silvina', 'Mariana', 'Verónica', 'Cecilia', 'Laura', 'Andrea', 'Soledad', 'Noelia', 'Jimena', 'Pilar', 'Delfina', 'Abril', 'Malena', 'Celeste', 'Eugenia'];
const MEN = ['Juan', 'Lucas', 'Mateo', 'Santiago', 'Tomás', 'Nicolás', 'Martín', 'Facundo', 'Federico', 'Gonzalo', 'Matías', 'Agustín', 'Joaquín', 'Ignacio', 'Franco', 'Diego', 'Pablo', 'Sebastián', 'Leandro', 'Ezequiel', 'Rodrigo', 'Hernán', 'Maximiliano', 'Emiliano', 'Bruno', 'Fernando', 'Gustavo', 'Marcelo', 'Alejandro', 'Ramiro', 'Germán', 'Cristian', 'Damián', 'Lautaro', 'Valentín', 'Iván'];
const SURNAMES = ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina', 'Suárez', 'Herrera', 'Aguirre', 'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Silva', 'Castro', 'Rojas', 'Ortiz', 'Núñez', 'Luna', 'Juárez', 'Cabrera', 'Ríos', 'Ferreyra', 'Godoy', 'Morales', 'Domínguez', 'Moreno', 'Peralta', 'Vega', 'Carrizo', 'Quiroga', 'Castillo', 'Ledesma', 'Muñoz', 'Ojeda', 'Ponce', 'Vera', 'Vázquez', 'Villalba', 'Cardozo', 'Navarro', 'Ramos', 'Arias', 'Coronel', 'Córdoba', 'Figueroa', 'Correa', 'Cáceres', 'Vargas', 'Maldonado', 'Mendoza', 'Paz', 'Bustos', 'Ibáñez', 'Rossi', 'Bianchi', 'Romano', 'Colombo', 'Ferrari', 'Bruno', 'Costa', 'Lombardi', 'Galli', 'Marino'];
const DOMAINS = [['gmail.com', 8], ['hotmail.com', 3], ['yahoo.com.ar', 1], ['outlook.com', 2]] as const;

const used = { dni: new Set<string>(), phone: new Set<string>(), email: new Set<string>(), plate: new Set<string>() };
const slug = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z]/g, '');
const unique = (set: Set<string>, make: () => string) => { let v = make(); while (set.has(v)) v = make(); set.add(v); return v; };
const reserve = (set: Set<string>, v: string) => { if (set.has(v)) throw new Error(`Repetido: ${v}`); set.add(v); return v; };

function person(area: string, age: [number, number], fixed?: Partial<Person>): Person {
  const woman = chance(0.5);
  const name = fixed?.name ?? pick(woman ? WOMEN : MEN), last_name = fixed?.last_name ?? pick(SURNAMES);
  const born = 2026 - int(age[0], age[1]);
  // DNI según la edad: ~1 millón por año desde 1970 (30 M) hasta hoy.
  const dni = fixed?.dni ? reserve(used.dni, fixed.dni) : unique(used.dni, () => String(Math.max(10_000_000, (born - 1940) * 1_000_000 + int(0, 999_999))));
  const phone = fixed?.phone ? reserve(used.phone, fixed.phone) : unique(used.phone, () => area + String(int(10 ** (9 - area.length), 10 ** (10 - area.length) - 1)));
  const email = fixed?.email ? reserve(used.email, fixed.email)
    : unique(used.email, () => `${slug(name)}${pick(['.', '', '_'])}${slug(last_name)}${chance(0.4) ? int(1, 99) : ''}@${weighted(DOMAINS)}`);
  const birth = `${born}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`;
  return { email, dni, name, last_name, birth, phone };
}

// ---------- ciudades ----------
type Hood = { name: string; lat: number; lng: number; cp: string };
type City = { key: string; province: string; locality: string; area: string; hoods: Hood[]; streets: string[]; price: [number, number]; branches: number; owners: number };
const CITIES: City[] = [
  {
    key: 'ros', province: 'Santa Fe', locality: 'Rosario', area: '341', price: [1800, 2400], branches: 13, owners: 6,
    hoods: [{ name: 'Centro', lat: -32.9468, lng: -60.6393, cp: '2000' }, { name: 'Pichincha', lat: -32.9375, lng: -60.6505, cp: '2000' }, { name: 'Echesortu', lat: -32.9545, lng: -60.6680, cp: '2000' }, { name: 'Fisherton', lat: -32.9290, lng: -60.7290, cp: '2000' }, { name: 'Barrio Martin', lat: -32.9535, lng: -60.6295, cp: '2000' }, { name: 'Abasto', lat: -32.9600, lng: -60.6450, cp: '2000' }, { name: 'Alberdi', lat: -32.9010, lng: -60.6880, cp: '2000' }, { name: 'Lourdes', lat: -32.9520, lng: -60.6720, cp: '2000' }, { name: 'Puerto Norte', lat: -32.9240, lng: -60.6690, cp: '2000' }],
    streets: ['Córdoba', 'San Martín', 'Santa Fe', 'Pellegrini', 'Bv. Oroño', 'Mendoza', 'San Lorenzo', 'Rioja', 'Entre Ríos', 'Mitre', 'Sarmiento', 'Corrientes', 'Paraguay', 'Italia', 'España', 'Av. Francia', 'Av. Alberdi', 'Tucumán', 'Urquiza'],
  },
  {
    key: 'cba', province: 'Córdoba', locality: 'Córdoba', area: '351', price: [1700, 2300], branches: 12, owners: 5,
    hoods: [{ name: 'Centro', lat: -31.4167, lng: -64.1840, cp: '5000' }, { name: 'Nueva Córdoba', lat: -31.4280, lng: -64.1870, cp: '5000' }, { name: 'Güemes', lat: -31.4250, lng: -64.1960, cp: '5000' }, { name: 'Alberdi', lat: -31.4100, lng: -64.2000, cp: '5000' }, { name: 'General Paz', lat: -31.4080, lng: -64.1640, cp: '5004' }, { name: 'Cerro de las Rosas', lat: -31.3700, lng: -64.2300, cp: '5009' }, { name: 'Alta Córdoba', lat: -31.3930, lng: -64.1810, cp: '5001' }, { name: 'Barrio Jardín', lat: -31.4500, lng: -64.1850, cp: '5016' }],
    streets: ['Av. Colón', 'Bv. San Juan', 'Av. Vélez Sarsfield', '27 de Abril', 'Deán Funes', 'Ituzaingó', 'Obispo Trejo', 'Chacabuco', 'Av. Rafael Núñez', 'Rondeau', 'Belgrano', 'Av. Hipólito Yrigoyen', 'Independencia', 'Tucumán'],
  },
  {
    key: 'caba', province: 'Ciudad Autónoma de Buenos Aires', locality: 'Ciudad de Buenos Aires', area: '11', price: [3000, 4000], branches: 12, owners: 5,
    hoods: [{ name: 'Palermo', lat: -34.5880, lng: -58.4300, cp: '1425' }, { name: 'Recoleta', lat: -34.5875, lng: -58.3974, cp: '1113' }, { name: 'Belgrano', lat: -34.5627, lng: -58.4580, cp: '1428' }, { name: 'San Nicolás', lat: -34.6037, lng: -58.3800, cp: '1043' }, { name: 'Caballito', lat: -34.6180, lng: -58.4410, cp: '1405' }, { name: 'Almagro', lat: -34.6100, lng: -58.4200, cp: '1172' }, { name: 'Villa Crespo', lat: -34.5990, lng: -58.4380, cp: '1414' }, { name: 'Núñez', lat: -34.5450, lng: -58.4630, cp: '1429' }, { name: 'San Telmo', lat: -34.6210, lng: -58.3730, cp: '1103' }],
    streets: ['Av. Santa Fe', 'Av. Córdoba', 'Av. Corrientes', 'Av. Cabildo', 'Av. Rivadavia', 'Thames', 'Gorriti', 'Juncal', 'Av. Callao', 'Lavalle', 'Av. Las Heras', 'Av. Juramento', 'Charcas', 'Av. Pueyrredón', 'Defensa'],
  },
  {
    key: 'mza', province: 'Mendoza', locality: 'Mendoza', area: '261', price: [1600, 2100], branches: 8, owners: 4,
    hoods: [{ name: 'Centro', lat: -32.8895, lng: -68.8458, cp: '5500' }, { name: 'Cuarta Sección', lat: -32.8800, lng: -68.8400, cp: '5500' }, { name: 'Quinta Sección', lat: -32.8930, lng: -68.8560, cp: '5500' }, { name: 'Sexta Sección', lat: -32.8850, lng: -68.8610, cp: '5500' }, { name: 'Barrio Bombal', lat: -32.8985, lng: -68.8410, cp: '5501' }],
    streets: ['Av. San Martín', 'Sarmiento', 'Av. Las Heras', 'Belgrano', 'Av. Colón', 'Godoy Cruz', 'Rivadavia', 'Necochea', 'Mitre', 'Patricias Mendocinas', 'Av. Emilio Civit', '9 de Julio'],
  },
];
const IMAGES = [
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1617886903355-93547526a666?auto=format&fit=crop&w=800&q=80',
];
const SERVICES: DemoServiceCatalog = [
  { name: 'Lavado exterior', description: 'Lavado a mano de carrocería, llantas y vidrios' },
  { name: 'Lavado completo', description: 'Lavado exterior e interior con aspirado' },
  { name: 'Control de neumáticos', description: 'Control de presión e inflado de las cuatro ruedas' },
  { name: 'Carga de batería', description: 'Carga lenta de batería mientras el vehículo está estacionado' },
  { name: 'Aspirado interior', description: 'Aspirado de butacas, alfombras y baúl' },
];
const SERVICE_PRICE: Record<string, number> = { 'Lavado exterior': 5500, 'Lavado completo': 10000, 'Control de neumáticos': 1500, 'Carga de batería': 3800, 'Aspirado interior': 3000 };

// ---------- personas fijas para mostrar ----------
const ADMIN = person('341', [40, 45], { email: 'admin@cocheras.com', name: 'Administrador', last_name: 'Sistema', dni: '30111222', phone: '3414001111' });
const SHOW_OWNER = { email: 'dueno@cocheras.com', name: 'Laura', last_name: 'Benítez', dni: '27456789', phone: '3415123456' };
const SHOW_EMPLOYEE = { email: 'empleado@cocheras.com', name: 'Lucas', last_name: 'Ferreyra', dni: '38123456', phone: '3416234567' };
// Clientes de las reservas destacadas (demo/featured.json), con vehículos fijos.
const SHOW_CLIENTS: { p: Partial<Person>; city: string; cars: Omit<DemoVehicle, 'client' | 'since'>[] }[] = [
  { p: { email: 'cliente@cocheras.com', name: 'Sofía', last_name: 'Martínez', dni: '39876543', phone: '3415987654' }, city: 'ros', cars: [
    { plate: 'AF512KD', brand: 'PEUGEOT', model: '', type: 'AUTO', color: 'Gris plata', year: 2022, insurance: 'San Cristóbal' },
    { plate: 'A457MRT', brand: 'HONDA', model: 'WAVE 110 S', type: 'MOTO', color: 'Rojo', year: 2023, insurance: 'Federación Patronal' },
    { plate: 'AD718PQ', brand: 'FORD', model: '', type: 'CAMIONETA', color: 'Blanco', year: 2019, insurance: 'La Caja Seguros' },
  ] },
  { p: { email: 'martin.gomez@gmail.com', name: 'Martín', last_name: 'Gómez' }, city: 'ros', cars: [{ plate: 'AC301LB', brand: 'CHEVROLET', model: '', type: 'AUTO', color: 'Negro', year: 2018, insurance: 'Sancor Seguros' }] },
  { p: { email: 'paula.rossi@hotmail.com', name: 'Paula', last_name: 'Rossi' }, city: 'ros', cars: [{ plate: 'AE904TN', brand: 'FIAT', model: '', type: 'AUTO', color: 'Blanco', year: 2021, insurance: 'La Caja Seguros' }] },
  { p: { email: 'diego.acosta@gmail.com', name: 'Diego', last_name: 'Acosta' }, city: 'ros', cars: [{ plate: 'A902KZX', brand: 'YAMAHA', model: 'YBR 125', type: 'MOTO', color: 'Azul', year: 2020, insurance: null }] },
  { p: { email: 'carolina.vega@gmail.com', name: 'Carolina', last_name: 'Vega' }, city: 'ros', cars: [{ plate: 'AG215FH', brand: 'NISSAN', model: '', type: 'AUTO', color: 'Gris oscuro', year: 2024, insurance: 'Zurich Seguros' }] },
];
// Sucursales vitrina: mucha actividad, 40 plazas, 5 empleados. La primera es la de la presentación.
const SHOWCASE = [
  { city: 'ros', name: 'Estacionamiento Central Plaza', hood: 'Centro', address: 'San Martín 750', lat: -32.9472, lng: -60.6385 },
  { city: 'ros', name: 'Cochera Pichincha', hood: 'Pichincha', address: 'Bv. Oroño 1180', lat: -32.9381, lng: -60.6498 },
  { city: 'cba', name: 'Estacionamiento Nueva Córdoba', hood: 'Nueva Córdoba', address: 'Obispo Trejo 850', lat: -31.4278, lng: -64.1868 },
  { city: 'caba', name: 'Parking Palermo Soho', hood: 'Palermo', address: 'Gorriti 4850', lat: -34.5875, lng: -58.4310 },
  { city: 'mza', name: 'Cochera Peatonal Sarmiento', hood: 'Centro', address: 'Sarmiento 250', lat: -32.8895, lng: -68.8420 },
];

// ---------- catálogo de modelos (el mismo que siembra vehicleSeeder) ----------
type CatalogModel = { brand: string; model: string; type: VehicleCategory };
const catalog: CatalogModel[] = [];
for (const b of JSON.parse(fs.readFileSync(path.resolve('vehiculos.json'), 'utf-8')) as { marca: string; modelos: { nombre: string; tipoOriginal?: string }[] }[]) {
  for (const m of b.modelos) catalog.push({ brand: b.marca, model: m.nombre, type: demoCategory(m.tipoOriginal ?? '') });
}
for (const [brand, models] of MOTOS) for (const model of models) catalog.push({ brand, model, type: 'MOTO' });
const POPULAR: Record<string, number> = { FIAT: 10, VOLKSWAGEN: 10, CHEVROLET: 9, TOYOTA: 9, RENAULT: 9, FORD: 8, PEUGEOT: 8, CITROEN: 5, NISSAN: 4, HONDA: 4, JEEP: 3, YAMAHA: 6, MOTOMEL: 5, ZANELLA: 4 };
const modelFor = (type: VehicleCategory, brand?: string): CatalogModel => {
  const pool = catalog.filter((m) => m.type === type && (!brand || m.brand === brand));
  if (!pool.length) throw new Error(`Sin modelos ${brand ?? ''} ${type} en vehiculos.json`);
  const brands = [...new Set(pool.map((m) => m.brand))];
  const b = weighted(brands.map((x) => [x, POPULAR[x] ?? 1] as const));
  return pick(pool.filter((m) => m.brand === b));
};
const COLORS = [['Blanco', 6], ['Gris plata', 6], ['Negro', 4], ['Gris oscuro', 3], ['Rojo', 2], ['Azul', 2], ['Bordó', 1], ['Beige', 1], ['Verde', 1]] as const;
const L = 'ABCDEFGHIJKLMNOPRSTUVWXYZ';
const letters = (n: number) => Array.from({ length: n }, () => pick([...L])).join('');
const digits = (n: number) => String(int(0, 10 ** n - 1)).padStart(n, '0');
// Patente según el año: Mercosur desde 2016 (AA, AB… por año; motos A123BCD) y la vieja antes (ABC123; motos 123ABC).
const plateFor = (type: VehicleCategory, year: number) => unique(used.plate, () => {
  if (year >= 2016) return type === 'MOTO' ? `A${digits(3)}${letters(3)}` : `A${L[Math.min(year - 2016, 8)]}${digits(3)}${letters(2)}`;
  return type === 'MOTO' ? `${digits(3)}${letters(3)}` : `${L[Math.max(0, year - 2008) + 6]}${letters(2)}${digits(3)}`;
});

// ---------- dueños, sucursales y personal ----------
const users: DemoUsers = { admin: ADMIN, owners: [], clients: [] };
const parkings: (DemoParking & { city: string; showcase: boolean; weekday: [string, string][]; weekend: [string, string][] })[] = [];
const staff: DemoStaff[] = [];

// Nombres únicos en todo el país: los JSON se refieren a las sucursales por nombre.
const names = new Set<string>(SHOWCASE.map((s) => s.name));
for (const city of CITIES) {
  const owners = Array.from({ length: city.owners }, (_, i) =>
    person(city.area, [38, 65], city.key === 'ros' && i === 0 ? SHOW_OWNER : undefined));
  users.owners.push(...owners);
  const showcase = SHOWCASE.filter((s) => s.city === city.key);
  // Cada dueño tiene entre 1 y 4; las vitrinas, de dueños distintos (cada una la primera de su dueño).
  const perOwner = owners.map(() => 1);
  for (let left = city.branches - owners.length; left > 0; left--) {
    const i = pick(perOwner.map((n, k) => (n < 4 ? k : -1)).filter((k) => k >= 0));
    perOwner[i]!++;
  }

  owners.forEach((owner, oi) => {
    for (let k = 0; k < perOwner[oi]!; k++) {
      const sc = k === 0 ? showcase[oi] : undefined;
      const hood = sc ? city.hoods.find((h) => h.name === sc.hood)! : pick(city.hoods);
      const street = pick(city.streets), number = int(1, 48) * 50 + int(0, 49);
      const name = sc?.name ?? unique(names, () => weighted([
        [`Cochera ${hood.name}`, 3], [`Estacionamiento ${street.replace(/^(Av\.|Bv\.) /, '')}`, 3], [`Parking ${hood.name}`, 2],
        [`Garage ${street.replace(/^(Av\.|Bv\.) /, '')} ${number}`, 1], [`Cocheras ${owner.last_name}`, 1],
      ] as const));
      names.add(name);
      const hours = sc ? ['07:00', '23:00'] : pick([['07:00', '23:00'], ['08:00', '22:00'], ['07:00', '21:00'], ['08:00', '20:00']]);
      const total = sc ? 40 : int(15, 60);
      const moto = Math.round(total * 0.15), noTruck = !sc && chance(0.2);
      const truck = noTruck ? 0 : Math.max(1, Math.round(total * 0.1));
      const base = round50(int(city.price[0], city.price[1]) * (sc ? 1.15 : 1));
      const expires = int(-22, -15); // la tarifa anterior vence a principios de octubre
      const prices: DemoParking['prices'] = [];
      const priced: [VehicleCategory, number][] = [['AUTO', base], ['MOTO', round50(base * 0.45)], ['CAMIONETA', round50(base * 1.4)]];
      for (const [type, price] of priced) {
        if (type === 'CAMIONETA' && !truck) continue;
        prices.push({ type, price: round50(price * 0.88), from: -150, to: expires }, { type, price, from: expires, to: null });
      }
      const services = sc ? SERVICES.slice(0, 3) : shuffle([...SERVICES]).slice(0, int(0, 3));
      const mid = (toMin(hours[0]!) + toMin(hours[1]!)) / 2;
      const split = hhmm(Math.round(mid / 60) * 60);
      parkings.push({
        name, owner: owner.email, province: city.province, locality: city.locality, neighborhood: hood.name, postalCode: hood.cp,
        address: sc?.address ?? `${street} ${number}`,
        latitude: sc?.lat ?? +(hood.lat + (rnd() - 0.5) * 0.008).toFixed(6), longitude: sc?.lng ?? +(hood.lng + (rnd() - 0.5) * 0.008).toFixed(6),
        openingTime: hours[0]!, closingTime: hours[1]!, minReservationHours: 1, maxReservationHours: sc ? 12 : pick([8, 10, 12]),
        reservationMargin: sc ? 30 : pick([15, 30, 30, 30, 45, 60]), isActive: true, imageUrl: sc ? IMAGES[SHOWCASE.indexOf(sc) % IMAGES.length]! : pick(IMAGES),
        spaces: { AUTO: total - moto - truck, MOTO: moto, CAMIONETA: truck }, maintenance: [],
        prices, services: services.map((s) => ({ name: s.name, price: round50(SERVICE_PRICE[s.name]! * (city.key === 'caba' ? 1.4 : 1) * (0.9 + rnd() * 0.2)) })),
        closedOn: [], exceptions: [], city: city.key, showcase: !!sc,
        // Turnos: sin solapes en la sucursal (R-02); las vitrinas en tres franjas de lunes a viernes.
        weekday: sc ? [['07:00', '13:00'], ['13:00', '18:00'], ['18:00', '23:00']] : [[hours[0]!, split], [split, hours[1]!]],
        weekend: [[hours[0]!, split], [split, hours[1]!]],
      });
    }
  });
}

// Variedad para el panel: dos pausadas, una con plazas de camioneta sin tarifa, plazas en mantenimiento, feriados y un día especial.
const regular = parkings.filter((p) => !p.showcase);
const [paused1, paused2, noRate, ...rest] = shuffle([...regular]);
paused1!.isActive = false; paused2!.isActive = false;
const noRateTruck = noRate!.spaces.CAMIONETA ? noRate! : rest.find((p) => p.spaces.CAMIONETA)!;
noRateTruck.prices = noRateTruck.prices.filter((p) => p.type !== 'CAMIONETA');
for (const p of [parkings[0]!, ...rest.slice(0, 3)]) p.maintenance = [`A-${String(p.spaces.AUTO).padStart(2, '0')}`];
const HOLIDAY_OCT = dayOfIso('2026-10-12'), HOLIDAY_NOV = dayOfIso('2026-11-23');
for (const p of shuffle([...regular]).slice(0, 10)) if (HOLIDAY_OCT >= FROM) p.closedOn.push(HOLIDAY_OCT);
for (const p of [...shuffle([...regular]).slice(0, 7), parkings.find((x) => x.name === 'Estacionamiento Nueva Córdoba')!]) if (HOLIDAY_NOV <= TO && !p.closedOn.includes(HOLIDAY_NOV)) p.closedOn.push(HOLIDAY_NOV);
// Feriado propio del dueño de la vitrina de Córdoba: su sucursal de vitrina trabaja; otra suya, si tiene, cierra.
const cbaOwner = parkings.find((x) => x.name === 'Estacionamiento Nueva Córdoba')!.owner;
const ownHoliday = 14;
users.owners.find((o) => o.email === cbaOwner)!.holidays = [{ day: ownHoliday, name: 'Aniversario de la empresa' }];
parkings.find((x) => x.owner === cbaOwner && !x.showcase)?.closedOn.push(ownHoliday);

// Personal: vitrinas 5 (tres franjas de lunes a viernes y dos el fin de semana), 5 sucursales con 4 y el resto con 3.
const fourStaff = new Set(shuffle([...regular]).slice(0, 5).map((p) => p.name));
for (const p of parkings) {
  const city = CITIES.find((c) => c.key === p.city)!;
  const crew: DemoStaff[] = [];
  const add = (shifts: DemoStaff['shifts'], fixed?: Partial<Person>) => {
    const s = { ...person(city.area, [20, 45], fixed), parking: p.name, shifts };
    crew.push(s);
    return s;
  };
  const [wm, wt, we] = p.weekday as [[string, string], [string, string], [string, string]?];
  const [sm, st] = p.weekend as [[string, string], [string, string]];
  if (p.showcase) {
    add([{ days: MON_FRI, from: wm[0], to: wm[1] }], p === parkings[0] ? SHOW_EMPLOYEE : undefined);
    add([{ days: MON_FRI, from: wt[0], to: wt[1] }]);
    add([{ days: MON_FRI, from: we![0], to: we![1] }]);
    add([{ days: SAT_SUN, from: sm[0], to: sm[1] }]);
    add([{ days: SAT_SUN, from: st[0], to: st[1] }]);
  } else if (fourStaff.has(p.name)) {
    add([{ days: MON_FRI, from: wm[0], to: wm[1] }]);
    add([{ days: MON_FRI, from: wt[0], to: wt[1] }]);
    add([{ days: SAT_SUN, from: sm[0], to: sm[1] }]);
    add([{ days: SAT_SUN, from: st[0], to: st[1] }]);
  } else {
    add([{ days: MON_FRI, from: wm[0], to: wm[1] }, { days: ['SUNDAY'], from: st[0], to: st[1] }]);
    add([{ days: [...MON_FRI, 'SATURDAY'], from: wt[0], to: wt[1] }]);
    add([{ days: SAT_SUN, from: sm[0], to: sm[1] }]);
  }
  staff.push(...crew);
}
if (staff.length !== COUNTS.employees) throw new Error(`Empleados: ${staff.length}, se esperaban ${COUNTS.employees}`);
// Día especial (D-02) en la vitrina de la presentación: atiende un solo empleado de 8 a 20, con un cierre al mediodía.
parkings[0]!.exceptions.push({ day: 12, shifts: [{ employee: SHOW_EMPLOYEE.email, from: '08:00', to: '20:00' }], closures: [{ from: '13:00', to: '14:00' }] });

// Horas abiertas y cubiertas de una sucursal ese día (sin cierres), o null si cierra.
const coveredRanges = (p: DemoParking & { weekday: [string, string][]; weekend: [string, string][] }, day: number): [number, number][] | null => {
  if (p.closedOn.includes(day)) return null;
  const ex = p.exceptions.find((e) => e.day === day);
  if (ex) {
    const out: [number, number][] = [];
    for (const s of ex.shifts) {
      let ranges: [number, number][] = [[toMin(s.from), toMin(s.to)]];
      for (const c of ex.closures) ranges = ranges.flatMap(([a, b]) => [[a, Math.min(b, toMin(c.from))], [Math.max(a, toMin(c.to)), b]] as [number, number][]).filter(([a, b]) => a < b);
      out.push(...ranges);
    }
    return out;
  }
  return [[toMin(p.openingTime), toMin(p.closingTime)]];
};

// ---------- clientes y vehículos ----------
// Cada ciudad recibe clientes y vehículos según cuántas reservas va a tener.
const baseDemand = (p: (typeof parkings)[number], day: number) => {
  if (!p.isActive && day > -8) return 0; // pausada hace una semana
  if (!coveredRanges(p, day)) return 0;
  const taper = (a: number, b: number) => a + ((b - a) * (day - 1)) / (TO - 1);
  const base = p.showcase ? (day < 0 ? 38 : day === 0 ? 50 : taper(30, 10)) : (day < 0 ? 5.5 : day === 0 ? 3 : taper(4.5, 1.5));
  const dow = dowOf(day);
  return base * (dow === 6 ? 0.75 : dow === 0 ? 0.5 : dow === 5 ? 1.1 : 1) * (0.8 + rnd() * 0.4);
};
const demand = new Map<string, number[]>();
for (const p of parkings) demand.set(p.name, Array.from({ length: TO - FROM + 1 }, (_, i) => baseDemand(p, FROM + i)));
const cityDemand = Object.fromEntries(CITIES.map((c) => [c.key, parkings.filter((p) => p.city === c.key).reduce((a, p) => a + demand.get(p.name)!.reduce((x, y) => x + y, 0), 0)]));
const totalDemand = Object.values(cityDemand).reduce((a, b) => a + b, 0);
const share = (n: number) => { // reparte n por ciudad, proporcional a la demanda
  const raw = CITIES.map((c) => (n * cityDemand[c.key]!) / totalDemand);
  const out = raw.map(Math.floor);
  for (let left = n - out.reduce((a, b) => a + b, 0), i = 0; left > 0; left--, i++) out[i % out.length]!++;
  return Object.fromEntries(CITIES.map((c, i) => [c.key, out[i]!]));
};

type Car = DemoVehicle & { city: string; weight: number; busy: [number, number][] };
const cars: Car[] = [];
const clientCity = new Map<string, string>();
for (const sc of SHOW_CLIENTS) {
  const city = CITIES.find((c) => c.key === sc.city)!;
  const c = person(city.area, [25, 45], sc.p);
  users.clients.push(c);
  clientCity.set(c.email, city.key);
  for (const car of sc.cars) {
    const m = car.model ? { brand: car.brand, model: car.model } : modelFor(car.type, car.brand);
    reserve(used.plate, car.plate);
    cars.push({ ...car, model: m.model, client: c.email, since: -int(60, 400), city: city.key, weight: 1, busy: [] });
  }
}
const clientsPerCity = share(COUNTS.clients - SHOW_CLIENTS.length);
for (const city of CITIES) {
  for (let i = 0; i < clientsPerCity[city.key]!; i++) {
    const c = person(city.area, [19, 75]);
    users.clients.push(c);
    clientCity.set(c.email, city.key);
  }
}
// Un vehículo por cliente y los que sobran, a clientes al azar de la misma ciudad (algunos tienen 2 o 3).
const owned = new Map<string, number>(cars.map((c) => [c.client, SHOW_CLIENTS.find((s) => s.p.email === c.client)!.cars.length]));
const typeMix = [['AUTO', 190], ['MOTO', 35], ['CAMIONETA', 25]] as const;
const typesLeft: Record<VehicleCategory, number> = { AUTO: 190, MOTO: 35, CAMIONETA: 25 };
for (const c of cars) typesLeft[c.type]--;
const nextType = (): VehicleCategory => weighted(typeMix.map(([t]) => [t, Math.max(0, typesLeft[t])] as const));
const regularClients = users.clients.filter((c) => !owned.has(c.email));
const owners2 = [...regularClients, ...shuffle([...regularClients]).slice(0, COUNTS.vehicles - cars.length - regularClients.length)];
if (owners2.length !== COUNTS.vehicles - cars.length) throw new Error('Reparto de vehículos');
for (const c of owners2) {
  const type = nextType();
  typesLeft[type]--;
  const year = weighted([[int(2008, 2012), 1], [int(2013, 2016), 2], [int(2017, 2021), 4], [int(2022, 2025), 3]] as const);
  const m = modelFor(type);
  cars.push({
    plate: plateFor(type, year), client: c.email, brand: m.brand, model: m.model, type, color: weighted(COLORS), year,
    insurance: chance(0.85) ? pick(INSURANCES) : null, since: -int(35, 900), city: clientCity.get(c.email)!,
    weight: weighted([[0.5, 3], [1, 5], [2, 2], [3, 1]] as const), busy: [],
  });
}

// ---------- reservas ----------
type P = (typeof parkings)[number];
const spaceBusy = new Map<string, [number, number][]>(); // `${sucursal}|${plaza}` → intervalos ocupados (minutos absolutos)
const abs = (day: number, min: number) => (day - FROM) * 1440 + min;
const overlaps = (list: [number, number][] | undefined, a: number, b: number) => !!list?.some(([x, y]) => x < b && a < y);
const spacesOf = (p: P, type: VehicleCategory) => {
  const prefix = type[0];
  return Array.from({ length: p.spaces[type] }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`).filter((c) => !p.maintenance.includes(c));
};
const hasRate = (p: P, type: VehicleCategory) => p.spaces[type] > 0 && p.prices.some((x) => x.type === type);
const freeSpace = (p: P, type: VehicleCategory, a: number, b: number) =>
  spacesOf(p, type).find((code) => !overlaps(spaceBusy.get(`${p.name}|${code}`), a - p.reservationMargin, b + p.reservationMargin));
const occupy = (p: P, space: string, car: Car, a: number, b: number) => {
  const key = `${p.name}|${space}`;
  spaceBusy.set(key, [...(spaceBusy.get(key) ?? []), [a, b]]);
  car.busy.push([a, b]);
};

const reservations: DemoReservation[] = [];

// Primero las destacadas (a mano), así las generadas no les ocupan la plaza.
const featured: DemoReservation[] = fs.existsSync(FEATURED) ? JSON.parse(fs.readFileSync(FEATURED, 'utf-8')) : [];
for (const f of featured) {
  const p = parkings.find((x) => x.name === f.parking), car = cars.find((c) => c.plate === f.plate);
  if (!p || !car) throw new Error(`Destacada sin sucursal o vehículo: ${f.parking} ${f.plate}`);
  const a = abs(f.day, toMin(f.start));
  // El que se pasó de hora sigue adentro: su plaza queda tomada hasta las 14 para las generadas.
  const b = f.outcome === 'overstay' ? abs(f.day, 14 * 60) : a + f.hours * 60 + Math.max(0, f.exit ?? 0);
  if (overlaps(spaceBusy.get(`${p.name}|${f.space}`), a - p.reservationMargin, b + p.reservationMargin) && f.outcome !== 'overstay') {
    // La plaza de la destacada que llega después de un "se pasó de hora" es la misma a propósito (R-21).
    if (!featured.some((o) => o.outcome === 'overstay' && o.parking === f.parking && o.space === f.space)) throw new Error(`Destacada superpuesta: ${f.plate}`);
  }
  occupy(p, f.space, car, a, b);
  reservations.push(f);
}

const START_WEIGHT: Record<number, number> = { 6: 1, 7: 3, 8: 6, 9: 6, 10: 4, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 4, 17: 5, 18: 5, 19: 4, 20: 3, 21: 2, 22: 1 };
const DURATION = [[1, 22], [2, 30], [3, 20], [4, 12], [5, 6], [6, 4], [8, 4], [10, 1], [12, 1]] as const;
const PAY = [['EFECTIVO', 30], ['TARJETA_DEBITO', 25], ['MERCADO_PAGO', 25], ['TARJETA_CREDITO', 12], ['TRANSFERENCIA', 8]] as const;
const sumDemand = [...demand.values()].reduce((a, d) => a + d.reduce((x, y) => x + y, 0), 0);
const scale = (TOTAL - featured.length) / sumDemand;
let skipped = 0;

for (let day = FROM; day <= TO; day++) {
  for (const p of parkings) {
    const want = demand.get(p.name)![day - FROM]! * scale;
    let n = Math.floor(want) + (chance(want % 1) ? 1 : 0);
    const ranges = coveredRanges(p, day);
    if (!ranges) continue;
    const types = (['AUTO', 'MOTO', 'CAMIONETA'] as const).filter((t) => hasRate(p, t) && spacesOf(p, t).length);
    const pool = cars.filter((c) => c.city === p.city);
    for (; n > 0; n--) {
      let placed = false;
      for (let attempt = 0; attempt < 12 && !placed; attempt++) {
        const hours = weighted(DURATION.filter(([h]) => h <= p.maxReservationHours));
        const range = pick(ranges.filter(([a, b]) => b - a >= hours * 60));
        if (!range) continue;
        const hoursOk = Object.entries(START_WEIGHT).map(([h, w]) => [+h, w] as const).filter(([h]) => h * 60 >= range[0] && h * 60 + hours * 60 <= range[1]);
        if (!hoursOk.length) continue;
        const walkIn = day <= 0 && chance(0.08);
        const startMin = weighted(hoursOk) * 60 + (walkIn ? int(1, 55) : 0);
        if (startMin + hours * 60 > range[1]) continue;
        const type = weighted(types.map((t) => [t, t === 'AUTO' ? 78 : t === 'MOTO' ? 14 : 8] as const));
        const candidates = pool.filter((c) => c.type === type);
        if (!candidates.length) continue;
        const car = weighted(candidates.map((c) => [c, c.weight] as const));
        const a = abs(day, startMin), b = a + hours * 60;
        if (overlaps(car.busy, a - 60, b + 60)) continue;
        const space = freeSpace(p, type, a, b);
        if (!space) continue;

        const outcome = walkIn ? 'done' : weighted([['done', 87], ['cancel', 9], ['noshow', 4]] as const);
        const r: DemoReservation = { parking: p.name, space, plate: car.plate, day, start: hhmm(startMin), hours, outcome, lead: 0 };
        let end = b;
        if (outcome === 'done') {
          r.arrive = walkIn ? 0 : int(-Math.min(15, p.reservationMargin), 12);
          r.exit = weighted([[-int(5, 50), 6], [int(0, 9), 3]] as const);
          // Si sale unos minutos después del fin (dentro de la gracia), la plaza sigue ocupada hasta que sale.
          if (r.exit > 0) {
            if (overlaps(spaceBusy.get(`${p.name}|${space}`), b, b + r.exit + p.reservationMargin)) r.exit = -int(5, 30);
            else end = b + r.exit;
          }
          // Hora extra (R-14): solo si la plaza y el vehículo siguen libres y no pasa del cierre.
          if (chance(0.1)) {
            const extra = chance(0.2) ? 2 : 1, exit = (extra - 1) * 60 + 20, out = b + exit;
            if (out <= abs(day, range[1]) && !overlaps(spaceBusy.get(`${p.name}|${space}`), b, out + p.reservationMargin) && !overlaps(car.busy, b, out + 60)) {
              r.extra = extra; r.exit = exit; end = out;
            }
          }
          r.pay = weighted(PAY);
          if (chance(0.04)) r.unpaid = true;
          if (chance(0.35)) r.rating = weighted([[5, 55], [4, 30], [3, 10], [2, 5]] as const);
          if (p.services.length && chance(0.12)) r.services = shuffle(p.services.map((s) => s.name)).slice(0, chance(0.2) ? 2 : 1);
          if (walkIn) r.walkIn = true;
        }
        r.lead = walkIn ? 0 : weighted([[int(30, 360), 35], [int(1440, 4320), 40], [int(5760, 20160), 25]] as const);
        if (outcome === 'cancel') r.cancelLead = int(30, Math.max(31, r.lead - 10));
        if (!walkIn && outcome !== 'cancel' && chance(0.2)) r.assigned = true;
        occupy(p, space, car, a, end);
        reservations.push(r);
        placed = true;
      }
      if (!placed) skipped++;
    }
  }
}

// ---------- salida ----------
const meta: DemoMeta = {
  anchor: ANCHOR, seed: SEED, from: FROM, to: TO,
  counts: { owners: users.owners.length, parkings: parkings.length, employees: staff.length, clients: users.clients.length, vehicles: cars.length, reservations: reservations.length, skipped },
};
fs.mkdirSync(OUT, { recursive: true });
const write = (file: string, data: unknown, perLine = false) => {
  const text = perLine && Array.isArray(data) ? `[\n${data.map((x) => JSON.stringify(x)).join(',\n')}\n]\n` : JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(path.join(OUT, file), text);
};
write('meta.json', meta);
write('services.json', SERVICES);
write('users.json', users);
write('parkings.json', parkings.map(({ city, showcase, weekday, weekend, ...p }) => p));
write('staff.json', staff, true);
write('vehicles.json', cars.map(({ city, weight, busy, ...c }) => c), true);
write('reservations.json', reservations, true);
console.log(`Demo generada en ${OUT} (ancla ${ANCHOR}):`, meta.counts);
