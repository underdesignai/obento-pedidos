/* =========================================================
   OBENTO — DATOS DE LA CARTA (editable)
   ========================================================= */

export const CATEGORIES = [
  { slug: 'entrantes', label: 'Entrantes' },
  { slug: 'sushi', label: 'Sushi' },
  { slug: 'calientes', label: 'Calientes' },
  { slug: 'postres', label: 'Postres' },
  { slug: 'bebidas', label: 'Bebidas' },
];

export const SUSHI_SUBCATEGORIES = [
  { slug: 'nigiri', label: 'Nigiri' },
  { slug: 'uramaki', label: 'Uramaki' },
  { slug: 'futomaki', label: 'Futomaki' },
  { slug: 'maki', label: 'Maki' },
];

export const PLACEHOLDER_IMG = "/images/placeholder.jpg";

export const MENU = [
  { id: '42', cat: 'bebidas', nombre: "Coca-Cola", descripcion: "", precio: 2.20, alergenos: [] },
  { id: '43', cat: 'bebidas', nombre: "Coca-Cola Zero", descripcion: "", precio: 2.20, alergenos: [] },
  { id: '44', cat: 'bebidas', nombre: "Aquarius", descripcion: "", precio: 2.20, alergenos: [] },
  { id: '45', cat: 'bebidas', nombre: "Fanta Naranja", descripcion: "", precio: 2.20, alergenos: [] },
  { id: '46', cat: 'bebidas', nombre: "Nestea", descripcion: "", precio: 2.20, alergenos: [] },
  { id: '47', cat: 'bebidas', nombre: "Cerveza Asahi", descripcion: "", precio: 3.50, alergenos: ["gluten"] },
  { id: '48', cat: 'bebidas', nombre: "Cerveza Kirin", descripcion: "", precio: 3.50, alergenos: ["gluten"] },
  { id: '49', cat: 'bebidas', nombre: "Agua pequeña", descripcion: "", precio: 1.20, alergenos: [] },
  { id: '34', cat: 'calientes', nombre: "Arroz con ternera", descripcion: "Arroz salteado con ternera, zanahoria, pimiento verde, pimiento rojo, cebolla, espárrago y pepino.", precio: 12.50, imagen: "/images/arrozternera.jpg", alergenos: ["soja"] },
  { id: '35', cat: 'calientes', nombre: "Arroz con pollo", descripcion: "Arroz salteado con pollo, zanahoria, pimiento verde, pimiento rojo, cebolla, espárrago y pepino.", precio: 11.20, imagen: "/images/arrozpollo.jpg", alergenos: ["soja"] },
  { id: '36', cat: 'calientes', nombre: "Yakisoba de langostino", descripcion: "Fideos salteados con langostino, col, aceite de sésamo, pepino y soja.", precio: 13.20, imagen: "/images/yakisobalangostino.jpg", alergenos: ["gluten","crustaceos","soja","sesamo"] },
  { id: '37', cat: 'calientes', nombre: "Yakisoba de ternera", descripcion: "Fideos salteados con ternera, col, aceite de sésamo, pepino y soja.", precio: 12.90, imagen: "/images/yakisobaternera.jpg", alergenos: ["gluten","soja","sesamo"] },
  { id: '38', cat: 'calientes', nombre: "Yakisoba de pollo", descripcion: "Fideos salteados con pollo, col, aceite de sésamo, pepino y soja.", precio: 11.90, imagen: "/images/yakisobapollo.jpg", alergenos: ["gluten","soja","sesamo"] },
  { id: '1', cat: 'entrantes', nombre: "Ensalada wakame", descripcion: "Alga wakame marinada en salsa aojiso, salmón y toque de sésamo.", precio: 6.90, imagen: "/images/ensaladawakame.jpg", alergenos: ["sesamo","soja","pescado"] },
  { id: '2', cat: 'entrantes', nombre: "Ebi Fry", descripcion: "Langostinos empanados crujientes con salsa Sweetchili verde (3und).", precio: 5.50, imagen: "/images/ebifry.jpg", alergenos: ["gluten","crustaceos","huevo"] },
  { id: '3', cat: 'entrantes', nombre: "Edamame", descripcion: "Vainas de soja salteadas con aceite de humo y toque de shichimi y sal en escamas.", precio: 4.50, imagen: "/images/edamame.jpg", alergenos: ["soja"] },
  { id: '4', cat: 'entrantes', nombre: "Gyozas de pollo (4und)", descripcion: "Empanadillas japonesas a la plancha, rellenas de pollo.", precio: 4.50, imagen: "/images/gyozaspollo.jpg", alergenos: ["gluten","soja"] },
  { id: '5', cat: 'entrantes', nombre: "Gyozas de verdura (4 und)", descripcion: "Empanadillas japonesas a la plancha, relleno vegetal.", precio: 4.50, imagen: "/images/gyozasverdura.jpg", alergenos: ["gluten","soja"] },
  { id: '6', cat: 'entrantes', nombre: "Gyozas de langostino", descripcion: "Empanadillas japonesas a la plancha, relleno de langostino (4 und).", precio: 5.50, imagen: "/images/gyozaslangostino.jpg", alergenos: ["gluten","soja","crustaceos"] },
  { id: '7', cat: 'entrantes', nombre: "Samosas", descripcion: "Deliciosos crujientes de hojaldre con relleno de pollo al curry y nuestra mayo buldak miel y toque de sésamo (3 und).", precio: 6.50, imagen: "/images/samosas.jpg", alergenos: ["gluten","sesamo","huevo"] },
  { id: '8', cat: 'entrantes', nombre: "Takoyaki", descripcion: "Bolitas de pulpo rebozadas, salsa takoyaki, katsuobushi y hojuelas de bonito (3 und).", precio: 4.50, imagen: "/images/takoyaki.jpg", alergenos: ["gluten","huevo","moluscos","pescado"] },
  { id: '39', cat: 'postres', nombre: "Mochi de tarta de queso", descripcion: "Masa de arroz con helado de tarta de queso.", precio: 4.50, imagen: "/images/mochifresa.jpg", alergenos: ["lacteos"] },
  { id: '40', cat: 'postres', nombre: "Mochi de mango", descripcion: "Masa de arroz de Fruta de la pasión relleno de helado de mango.", precio: 4.50, imagen: "/images/mochimango.jpg", alergenos: ["lacteos"] },
  { id: '41', cat: 'postres', nombre: "Mochi de chocolate", descripcion: "Masa de arroz relleno de helado de chocolate.", precio: 4.50, imagen: "/images/mochichocolate.jpg", alergenos: ["lacteos"] },
  { id: '9', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de atún", descripcion: "Atún Rojo Ricardo Fuentes (2und).", precio: 6.20, imagen: "/images/nigiriatun.jpg", alergenos: ["pescado"] },
  { id: '10', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de atún con foie", descripcion: "Atún Rojo coronado con foie, sal marinada y punto de teriyaki (2und).", precio: 7.80, imagen: "/images/nigiriatunfoie.jpg", alergenos: ["pescado","soja"] },
  { id: '11', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de salmón", descripcion: "Salmón (2und).", precio: 5.50, imagen: "/images/nigirisalmon.jpg", alergenos: ["pescado"] },
  { id: '12', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de salmón flambeado", descripcion: "Salmón sellado al soplete, con salsa kimchi y azúcar moreno (2und).", precio: 6.20, imagen: "/images/nigirisalmonf.jpg", alergenos: ["pescado"] },
  { id: '13', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de chutoro", descripcion: "Atún sellado al soplete, toque de sal en escamas, pimienta negra y cebolleta (2und).", precio: 10.50, imagen: "/images/nigirichutoro.jpg", alergenos: ["pescado"] },
  { id: '14', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de vieira", descripcion: "Vieira sellada con soplete, mayo kimchi, sal en escamas, shichimi y toque de lima (2und).", precio: 9.90, imagen: "/images/nigirivieira.jpg", alergenos: ["moluscos","huevo"] },
  { id: '15', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de anguila", descripcion: "Anguila glaseada en salsa teriyaki y toque de cebolleta finamente cortada (2und).", precio: 7.20, imagen: "/images/nigirianguila.jpg", alergenos: ["pescado","soja"] },
  { id: '16', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de hamachi", descripcion: "Pez limón (hamachi) (2und).", precio: 8.90, imagen: "/images/nigirihamachi.jpg", alergenos: ["pescado"] },
  { id: '17', cat: 'sushi', sub: 'nigiri', nombre: "Nigiri de atún toro con trufa", descripcion: "Mayo trufada, cebolleta finamente cortada y atún toro rojo (2und).", precio: 10.90, imagen: "/images/atuntoro.jpg", alergenos: ["pescado","huevo"] },
  { id: '18', cat: 'sushi', sub: 'uramaki', nombre: "Jōnetsu Tuna", descripcion: "Arroz con sésamo kimchi. Queso crema, aguacate, cebollino y pepino holandés con cobertura de atún, foie flambeado con punto de teriyaki. (8 uds)", precio: 14.20, imagen: "/images/rolloatun.jpg", alergenos: ["pescado","lacteos","sesamo","soja"] },
  { id: '19', cat: 'sushi', sub: 'uramaki', nombre: "Sakura Roll", descripcion: "Queso crema, aguacate, cebollino y pepino holandés con cobertura de salmón flambeado, acabado con mayo kimchi y punto de teriyaki. (8 uds)", precio: 12.50, imagen: "/images/uramakisalmon.jpg", alergenos: ["pescado","lacteos","huevo","soja"] },
  { id: '20', cat: 'sushi', sub: 'uramaki', nombre: "Chicken roll", descripcion: "Pollo karaage, queso crema, cebollino, cobertura de aguacate y nuestra salsa acebichada (8 uds).", precio: 11.50, imagen: "/images/uramakipollo.jpg", alergenos: ["gluten","soja","huevo","lacteos"] },
  { id: '21', cat: 'sushi', sub: 'uramaki', nombre: "Aurora Roll (Vegetal)", descripcion: "Uramaki de micro mezclum, pepino y mango, guacamole trufado, punto de salsa Aojiso y coronado con cebolleta finamente cortada. (8 uds)", precio: 10.50, imagen: "/images/rollovegetal.jpg", alergenos: ["soja"] },
  { id: '22', cat: 'sushi', sub: 'uramaki', nombre: "Black Dragon", descripcion: "Espárrago, cebollino, gamba tempurizada, cobertura de atún, mayo buldak miel, decorado con boniato crujiente.", precio: 15.20, imagen: "/images/rolloblack.jpg", alergenos: ["pescado","soja","crustaceos","gluten","huevo"] },
  { id: '23', cat: 'sushi', sub: 'uramaki', nombre: "Shinigami crab", descripcion: "Arroz negro, brotes de soja, mango, cangrejo real, cobertura de lubina y salsa spicy mango.", precio: 11.50, imagen: "/images/uramakicangrejo.jpg", alergenos: ["crustaceos","huevo","pescado","soja"] },
  { id: '24', cat: 'sushi', sub: 'uramaki', nombre: "Rollo Tartar de salmón", descripcion: "Aguacate, queso crema, cebollino y pepino, con tartar de salmón y salsa Aojiso.", precio: 11.30, imagen: "/images/rollosalmon1.jpg", alergenos: ["pescado","lacteos","soja"] },
  { id: '25', cat: 'sushi', sub: 'uramaki', nombre: "Rollo Tartar de atún", descripcion: "Aguacate, queso crema, cebollino y pepino, con tartar de atún y mayo kimchi.", precio: 13.80, imagen: "/images/rolloatun1.jpg", alergenos: ["pescado","lacteos","huevo","soja"] },
  { id: '26', cat: 'sushi', sub: 'uramaki', nombre: "Rollo Tartar de lubina", descripcion: "Aguacate, queso crema, cebollino y pepino, con tartar de lubina y salsa acebichada.", precio: 11.90, imagen: "/images/rollolubina.jpg", alergenos: ["pescado","lacteos"] },
  { id: '27', cat: 'sushi', sub: 'futomaki', nombre: "Futomaki de salmón", descripcion: "Relleno de salmón, queso crema y salsa aojiso (8 und).", precio: 9.90, imagen: "/images/futomaki.jpg", alergenos: ["pescado","lacteos","soja"] },
  { id: '28', cat: 'sushi', sub: 'futomaki', nombre: "Futomaki de gamba trufada", descripcion: "Gamba en tempura, ikura, cebollino y mayonesa trufada (12 und).", precio: 12.20, imagen: "/images/rollogamba.jpg", alergenos: ["crustaceos","soja","gluten","huevo","pescado"] },
  { id: '29', cat: 'sushi', sub: 'futomaki', nombre: "Futomaki karaage", descripcion: "Relleno de pollo karaage rebozado, mango, acompañado de mayo buldak miel (12 und).", precio: 10.50, imagen: "/images/futokara.jpg", alergenos: ["soja","gluten","huevo"] },
  { id: '30', cat: 'sushi', sub: 'maki', nombre: "Maki de salmón", descripcion: "Salmón (8 und).", precio: 6.20, imagen: "/images/maki2.jpg", alergenos: ["pescado"] },
  { id: '31', cat: 'sushi', sub: 'maki', nombre: "Maki de chutoro", descripcion: "Ventresca de atún rojo Ricardo Fuentes (8 und).", precio: 10.50, imagen: "/images/makichu.jpg", alergenos: ["pescado"] },
  { id: '32', cat: 'sushi', sub: 'maki', nombre: "Maki de atún", descripcion: "Atún fresco (8 und).", precio: 7.20, imagen: "/images/makiatun.jpg", alergenos: ["pescado"] },
  { id: '33', cat: 'sushi', sub: 'maki', nombre: "Maki de aguacate", descripcion: "Aguacate (8 und).", precio: 5.20, imagen: "/images/maki4.jpg", alergenos: [] }
];

export const ABOUT_INFO = {
  lead: 'En OBENTO elaboramos cada pieza a mano, al momento, con los mejores ingredientes seleccionados y con plena pasión. Cocina de calidad, sushi hecho al momento, cortado al punto para que disfrutes cada bocado.',
  valores: [
    { titulo: 'Cuidado y calidad del pescado', desc: 'Seleccionamos nuestro pescado cuidadosamente y seguimos un proceso de conservación y congelación adecuado para garantizar su seguridad y mantener al máximo su calidad, sabor y textura.', ico: '<path d="M3 12c4-5 10-6 14-2 2 2 3 3 4 2-1 3-3 5-4 2-4 4-10 3-14-2z"/><circle cx="7.2" cy="11.2" r="0.8" fill="currentColor" stroke="none"/>' },
    { titulo: 'Atún rojo, de Ricardo Fuentes', desc: 'Trabajamos con Ricardo Fuentes para nuestro atún rojo, una garantía de origen y de la mejor calidad pieza a pieza.', ico: '<path d="M4 12c3-4 8-5 11-2 1.5 1.5 2.5 2 3.5 1.5-1 2-2 3.5-3.5 1.5-3 3-8 2-11-2z"/>' },
    { titulo: 'Salmón noruego y materia prima seleccionada', desc: 'Usamos salmón noruego y otros pescados de alta calidad, con un corte perfecto para disfrutar de cada bocado.', ico: '<path d="M7 12c0-4 2-7 5-7s5 3 5 7"/><path d="M4 12h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>' },
    { titulo: 'Hecho a mano, al momento', desc: 'Cada nigiri y cada maki se prepara cuando entra tu pedido, no antes.', ico: '<path d="M7 12c0-4 2-7 5-7s5 3 5 7"/><path d="M4 12h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>' },
    { titulo: 'Arroz elaborado en casa', desc: 'Cocido y aderezado siguiendo la técnica tradicional, punto clave de un buen sushi.', ico: '<circle cx="8" cy="9" r="1.4"/><circle cx="13" cy="7" r="1.4"/><circle cx="16" cy="11" r="1.4"/><circle cx="10" cy="13" r="1.4"/><circle cx="14" cy="15" r="1.4"/>' },
  ],
  direccion: 'C. Amargura, 3',
  ciudad: '30830 La Ñora, Murcia',
  horario1: 'Recoger en tienda: miércoles a domingo',
  horario2: '18:00–23:30',
  horarioLlevar1: 'Para llevar: miércoles a domingo',
  horarioLlevar2: '20:00–23:30',
  telefono: '613 927 596',
  mapsUrl: 'https://maps.google.com/?q=Obento+Japanese+Food',
  zonasReparto: ['La Ñora', 'Guadalupe', 'Rincón de Beniscornia', 'Jabalí Viejo', 'Jabalí Nuevo', 'Puebla de Soto'],
};

export const HORARIOS = {
  recoger: {
    L: null,
    M: null,
    X: ['18:00', '23:30'],
    J: ['18:00', '23:30'],
    V: ['18:00', '23:30'],
    S: ['18:00', '23:30'],
    D: ['18:00', '23:30'],
  },
  llevar: {
    L: null,
    M: null,
    X: ['20:00', '23:30'],
    J: ['20:00', '23:30'],
    V: ['20:00', '23:30'],
    S: ['20:00', '23:30'],
    D: ['20:00', '23:30'],
  },
};

export const ALLERGENS = {
  gluten: {
    label: 'Gluten',
    short: 'Gl',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M12 6.5l3-2M12 6.5l-3-2"/><path d="M12 10l3-2M12 10l-3-2"/><path d="M12 13.5l3-2M12 13.5l-3-2"/><path d="M12 17l2.4-1.6M12 17l-2.4-1.6"/></svg>'
  },
  soja: {
    label: 'Soja',
    short: 'So',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4.5c-3 3-3.5 8.5-.5 11.5s8.5 2.5 11.5-.5"/><circle cx="9.6" cy="9" r="1.5"/><circle cx="12.8" cy="12" r="1.5"/><circle cx="16" cy="15.2" r="1.5"/></svg>'
  },
  pescado: {
    label: 'Pescado',
    short: 'Pe',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12c4-5 11-6.5 15-2.5 2 2 3 2.5 4 2.5-1 1.5-2 2-4 2-4 4-11 2.5-15-2z"/><circle cx="7.2" cy="11.2" r="0.8" fill="currentColor" stroke="none"/></svg>'
  },
  crustaceos: {
    label: 'Crustáceos',
    short: 'Cr',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17c-1.5-4 0-10 6-11 4-.7 8 2 8 6 0 2-1.3 3.2-3 3.2"/><path d="M17 11.5l3-1.2M17.5 14l3 .8"/><path d="M6.5 16.5l-2.3 1M8 18.5l-1.5 2"/><circle cx="7" cy="6.8" r="1"/></svg>'
  },
  huevo: {
    label: 'Huevo',
    short: 'Hu',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 4-6.5 9-6.5 12.5A6.5 6.5 0 0 0 12 22a6.5 6.5 0 0 0 6.5-6.5C18.5 12 16 7 12 3z"/></svg>'
  },
  frutos_secos: {
    label: 'Frutos de cáscara',
    short: 'Fs',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8c0-1.6 1.3-3 3-3s3 1.4 3 3"/><path d="M7.5 8h9c0 5.5-2 9.5-4.5 12.5C9.5 17.5 7.5 13.5 7.5 8z"/><path d="M12 8v6"/></svg>'
  },
  lacteos: {
    label: 'Lácteos',
    short: 'La',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 3h5l1 3.2V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V6.2L9.5 3z"/><path d="M8.5 6.2h7"/></svg>'
  },
  sesamo: {
    label: 'Sésamo',
    short: 'Se',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="7.5" cy="9" rx="2.1" ry="1.1" transform="rotate(-25 7.5 9)"/><ellipse cx="13.5" cy="6.5" rx="2.1" ry="1.1" transform="rotate(15 13.5 6.5)"/><ellipse cx="17" cy="12" rx="2.1" ry="1.1" transform="rotate(-10 17 12)"/><ellipse cx="9" cy="15.5" rx="2.1" ry="1.1" transform="rotate(25 9 15.5)"/><ellipse cx="15" cy="17.5" rx="2.1" ry="1.1" transform="rotate(-20 15 17.5)"/></svg>'
  },
  moluscos: {
    label: 'Moluscos',
    short: 'Mo',
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a8.5 8.5 0 1 1 8.5-8.5"/><path d="M12 21a5.3 5.3 0 1 1 5.3-5.3"/><path d="M12 21a2.2 2.2 0 1 1 2.2-2.2"/></svg>'
  },
};
