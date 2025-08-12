/**
 * Romanian Administrative Divisions Data
 * Provides county (județ) and major cities data for location selection
 */

export interface County {
  code: string;
  name: string;
  cities: string[];
  hasDistricts?: boolean;
}

export const ROMANIAN_COUNTIES: County[] = [
  {
    code: 'AB',
    name: 'Alba',
    cities: ['Alba Iulia', 'Sebeș', 'Aiud', 'Cugir', 'Blaj', 'Ocna Mureș', 'Zlatna', 'Câmpeni', 'Teiuș', 'Abrud']
  },
  {
    code: 'AR',
    name: 'Arad',
    cities: ['Arad', 'Pecica', 'Sântana', 'Lipova', 'Ineu', 'Chișineu-Criș', 'Nădlac', 'Curtici', 'Pâncota', 'Sebis']
  },
  {
    code: 'AG',
    name: 'Argeș',
    cities: ['Pitești', 'Mioveni', 'Câmpulung', 'Curtea de Argeș', 'Ștefănești', 'Costești', 'Topoloveni']
  },
  {
    code: 'BC',
    name: 'Bacău',
    cities: ['Bacău', 'Onești', 'Moinești', 'Comănești', 'Buhuși', 'Dărmănești', 'Târgu Ocna', 'Slănic-Moldova']
  },
  {
    code: 'BH',
    name: 'Bihor',
    cities: ['Oradea', 'Salonta', 'Marghita', 'Beiuș', 'Valea lui Mihai', 'Aleșd', 'Ștei', 'Vașcău', 'Nucet']
  },
  {
    code: 'BN',
    name: 'Bistrița-Năsăud',
    cities: ['Bistrița', 'Beclean', 'Sângeorz-Băi', 'Năsăud']
  },
  {
    code: 'BT',
    name: 'Botoșani',
    cities: ['Botoșani', 'Dorohoi', 'Darabani', 'Flămânzi', 'Săveni', 'Ștefănești', 'Bucecea']
  },
  {
    code: 'BR',
    name: 'Brăila',
    cities: ['Brăila', 'Ianca', 'Însurăței', 'Făurei']
  },
  {
    code: 'BV',
    name: 'Brașov',
    cities: ['Brașov', 'Făgăraș', 'Săcele', 'Zărnești', 'Codlea', 'Râșnov', 'Victoria', 'Rupea', 'Ghimbav', 'Predeal']
  },
  {
    code: 'B',
    name: 'București',
    cities: ['București'],
    hasDistricts: true
  },
  {
    code: 'BZ',
    name: 'Buzău',
    cities: ['Buzău', 'Râmnicu Sărat', 'Nehoiu', 'Pogoanele', 'Pătârlagele', 'Beceni']
  },
  {
    code: 'CL',
    name: 'Călărași',
    cities: ['Călărași', 'Oltenița', 'Budești', 'Fundulea', 'Lehliu Gară']
  },
  {
    code: 'CS',
    name: 'Caraș-Severin',
    cities: ['Reșița', 'Caransebeș', 'Bocșa', 'Moldova Nouă', 'Oravița', 'Oțelu Roșu', 'Anina', 'Băile Herculane']
  },
  {
    code: 'CJ',
    name: 'Cluj',
    cities: ['Cluj-Napoca', 'Turda', 'Dej', 'Câmpia Turzii', 'Gherla', 'Huedin']
  },
  {
    code: 'CT',
    name: 'Constanța',
    cities: ['Constanța', 'Mangalia', 'Medgidia', 'Năvodari', 'Cernavodă', 'Ovidiu', 'Murfatlar', 'Hârșova', 'Eforie', 'Techirghiol']
  },
  {
    code: 'CV',
    name: 'Covasna',
    cities: ['Sfântu Gheorghe', 'Târgu Secuiesc', 'Covasna', 'Baraolt', 'Întorsura Buzăului']
  },
  {
    code: 'DB',
    name: 'Dâmbovița',
    cities: ['Târgoviște', 'Moreni', 'Pucioasa', 'Găești', 'Titu', 'Fieni', 'Răcari']
  },
  {
    code: 'DJ',
    name: 'Dolj',
    cities: ['Craiova', 'Băilești', 'Calafat', 'Filiași', 'Dăbuleni', 'Segarcea', 'Bechet']
  },
  {
    code: 'GL',
    name: 'Galați',
    cities: ['Galați', 'Tecuci', 'Târgu Bujor', 'Berești']
  },
  {
    code: 'GR',
    name: 'Giurgiu',
    cities: ['Giurgiu', 'Bolintin-Vale', 'Mihăilești']
  },
  {
    code: 'GJ',
    name: 'Gorj',
    cities: ['Târgu Jiu', 'Motru', 'Rovinari', 'Bumbești-Jiu', 'Târgu Cărbunești', 'Turceni', 'Tismana', 'Novaci']
  },
  {
    code: 'HR',
    name: 'Harghita',
    cities: ['Miercurea Ciuc', 'Odorheiu Secuiesc', 'Gheorgheni', 'Toplița', 'Cristuru Secuiesc', 'Vlăhița', 'Băile Tușnad', 'Borsec']
  },
  {
    code: 'HD',
    name: 'Hunedoara',
    cities: ['Deva', 'Hunedoara', 'Petroșani', 'Vulcan', 'Lupeni', 'Orăștie', 'Brad', 'Simeria', 'Călan', 'Hațeg', 'Uricani', 'Petrila', 'Aninoasa']
  },
  {
    code: 'IL',
    name: 'Ialomița',
    cities: ['Slobozia', 'Fetești', 'Urziceni', 'Țăndărei', 'Amara', 'Fierbinți-Târg', 'Căzănești']
  },
  {
    code: 'IS',
    name: 'Iași',
    cities: ['Iași', 'Pașcani', 'Hârlău', 'Târgu Frumos', 'Podu Iloaiei']
  },
  {
    code: 'IF',
    name: 'Ilfov',
    cities: ['Voluntari', 'Pantelimon', 'Buftea', 'Popești-Leordeni', 'Bragadiru', 'Chitila', 'Otopeni', 'Măgurele']
  },
  {
    code: 'MM',
    name: 'Maramureș',
    cities: ['Baia Mare', 'Sighetu Marmației', 'Borșa', 'Baia Sprie', 'Vișeu de Sus', 'Târgu Lăpuș', 'Șomcuta Mare', 'Seini', 'Ulmeni', 'Tăuții-Măgherăuș', 'Cavnic', 'Săliștea de Sus', 'Dragomirești']
  },
  {
    code: 'MH',
    name: 'Mehedinți',
    cities: ['Drobeta-Turnu Severin', 'Strehaia', 'Orșova', 'Baia de Aramă', 'Vânju Mare']
  },
  {
    code: 'MS',
    name: 'Mureș',
    cities: ['Târgu Mureș', 'Reghin', 'Sighișoara', 'Târnăveni', 'Luduș', 'Sovata', 'Iernut', 'Sângeorgiu de Pădure', 'Sărmaș', 'Ungheni', 'Miercurea Nirajului']
  },
  {
    code: 'NT',
    name: 'Neamț',
    cities: ['Piatra Neamț', 'Roman', 'Târgu Neamț', 'Bicaz', 'Roznov']
  },
  {
    code: 'OT',
    name: 'Olt',
    cities: ['Slatina', 'Caracal', 'Balș', 'Corabia', 'Scornicești', 'Drăgănești-Olt', 'Piatra-Olt', 'Potcoava']
  },
  {
    code: 'PH',
    name: 'Prahova',
    cities: ['Ploiești', 'Câmpina', 'Băicoi', 'Breaza', 'Mizil', 'Comarnic', 'Vălenii de Munte', 'Boldești-Scăeni', 'Urlați', 'Sinaia', 'Bușteni', 'Plopeni', 'Slănic', 'Azuga']
  },
  {
    code: 'SJ',
    name: 'Sălaj',
    cities: ['Zalău', 'Șimleu Silvaniei', 'Jibou', 'Cehu Silvaniei']
  },
  {
    code: 'SM',
    name: 'Satu Mare',
    cities: ['Satu Mare', 'Carei', 'Negrești-Oaș', 'Tășnad', 'Livada', 'Ardud']
  },
  {
    code: 'SB',
    name: 'Sibiu',
    cities: ['Sibiu', 'Mediaș', 'Cisnădie', 'Avrig', 'Agnita', 'Dumbrăveni', 'Tălmaciu', 'Copșa Mică', 'Săliște', 'Miercurea Sibiului', 'Ocna Sibiului']
  },
  {
    code: 'SV',
    name: 'Suceava',
    cities: ['Suceava', 'Fălticeni', 'Rădăuți', 'Câmpulung Moldovenesc', 'Vatra Dornei', 'Siret', 'Gura Humorului', 'Solca', 'Broșteni', 'Liteni', 'Salcea', 'Vicovu de Sus', 'Dolhasca', 'Cajvana', 'Frasin', 'Milișăuți']
  },
  {
    code: 'TR',
    name: 'Teleorman',
    cities: ['Alexandria', 'Roșiori de Vede', 'Turnu Măgurele', 'Zimnicea', 'Videle']
  },
  {
    code: 'TM',
    name: 'Timiș',
    cities: ['Timișoara', 'Lugoj', 'Sânnicolau Mare', 'Jimbolia', 'Recaș', 'Făget', 'Buziaș', 'Deta', 'Gătaia', 'Ciacova']
  },
  {
    code: 'TL',
    name: 'Tulcea',
    cities: ['Tulcea', 'Babadag', 'Măcin', 'Isaccea', 'Sulina']
  },
  {
    code: 'VL',
    name: 'Vâlcea',
    cities: ['Râmnicu Vâlcea', 'Drăgășani', 'Băbeni', 'Călimănești', 'Horezu', 'Brezoi', 'Bălcești', 'Berbești', 'Băile Olănești', 'Ocnele Mari', 'Băile Govora']
  },
  {
    code: 'VS',
    name: 'Vaslui',
    cities: ['Vaslui', 'Bârlad', 'Huși', 'Negrești', 'Murgeni']
  },
  {
    code: 'VN',
    name: 'Vrancea',
    cities: ['Focșani', 'Adjud', 'Mărășești', 'Panciu', 'Odobești']
  }
];

export const BUCHAREST_DISTRICTS = [
  'Sector 1',
  'Sector 2', 
  'Sector 3',
  'Sector 4',
  'Sector 5',
  'Sector 6'
];

export const RESIDENCE_TYPES = [
  { value: 'urban', label: 'Urban' },
  { value: 'rural', label: 'Rural' }
];

/**
 * Helper function to get cities for a specific county
 */
export function getCitiesForCounty(countyCode: string): string[] {
  const county = ROMANIAN_COUNTIES.find(c => c.code === countyCode);
  return county ? county.cities : [];
}

/**
 * Helper function to get county by name
 */
export function getCountyByName(name: string): County | undefined {
  return ROMANIAN_COUNTIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

/**
 * Helper function to check if location has districts (București)
 */
export function hasDistricts(countyCode: string): boolean {
  const county = ROMANIAN_COUNTIES.find(c => c.code === countyCode);
  return county?.hasDistricts || false;
}