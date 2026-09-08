// Nepal administrative divisions (Provinces → Districts → Municipalities).
// Covers all 7 provinces and 77 districts with major municipalities listed.
// Users can also free-type the Tole (street/area).

export type NepalData = Record<string, Record<string, string[]>>;

export const NEPAL_ADDRESS: NepalData = {
  "Koshi": {
    "Bhojpur": ["Bhojpur", "Shadananda", "Tyamke Maiyum", "Ramprasad Rai", "Aamchok", "Arun", "Pauwadungma", "Salpasilichho", "Hatuwagadhi"],
    "Dhankuta": ["Dhankuta", "Pakhribas", "Mahalaxmi", "Sangurigadhi", "Chaubise", "Sahidbhumi", "Khalsa Chhintang Sahidbhumi"],
    "Ilam": ["Ilam", "Deumai", "Mai", "Suryodaya", "Fakphokthum", "Mai Jogmai", "Sandakpur", "Rong", "Mangsebung", "Chulachuli"],
    "Jhapa": ["Mechinagar", "Damak", "Bhadrapur", "Birtamod", "Kankai", "Arjundhara", "Shivasatakshi", "Gauradaha", "Buddhashanti", "Haldibari", "Kachankawal", "Barhadashi", "Jhapa", "Gauriganj", "Kamal"],
    "Khotang": ["Halesi Tuwachung", "Diktel Rupakot Majhuwagadhi", "Aiselukharka", "Jantedhunga", "Khotehang", "Diprung", "Sakela", "Rawa Besi", "Barahapokhari", "Kepilasagadhi"],
    "Morang": ["Biratnagar", "Sundar Haraicha", "Belbari", "Pathari Shanishchare", "Urlabari", "Rangeli", "Letang Bhogateni", "Sunwarshi", "Ratuwamai", "Kanepokhari", "Gramthan", "Budhiganga", "Katahari", "Dhanpalthan", "Jahada", "Kerabari", "Miklajung"],
    "Okhaldhunga": ["Siddhicharan", "Khijidemba", "Champadevi", "Manebhanjyang", "Molung", "Likhu", "Sunkoshi", "Champadevi"],
    "Panchthar": ["Phidim", "Hilihang", "Kummayak", "Miklajung", "Phalelung", "Phalgunanda", "Tumbewa", "Yangwarak"],
    "Sankhuwasabha": ["Khandbari", "Chainpur", "Dharmadevi", "Madi", "Panchakhapan", "Bhotkhola", "Chichila", "Makalu", "Sabhapokhari", "Silichong"],
    "Solukhumbu": ["Solududhkunda", "Khumbu Pasanglhamu", "Necha Salyan", "Maha Kulung", "Likhu Pike", "Sotang", "Thulung Dudhkoshi", "Dudhakaushika"],
    "Sunsari": ["Itahari", "Dharan", "Inaruwa", "Duhabi", "Ramdhuni", "Barah", "Bhokraha Narsingh", "Koshi", "Gadhi", "Barju", "Dewanganj", "Harinagar"],
    "Taplejung": ["Phungling", "Aathrai Tribeni", "Maiwakhola", "Meringden", "Mikwakhola", "Pathivara Yangwarak", "Phaktanglung", "Sidingba", "Sirijangha"],
    "Terhathum": ["Myanglung", "Laligurans", "Aathrai", "Chhathar", "Phedap", "Menchayayem"],
    "Udayapur": ["Triyuga", "Katari", "Chaudandigadhi", "Belaka", "Udayapurgadhi", "Rautamai", "Tapli", "Sunkoshi", "Limchungbung"],
  },
  "Madhesh": {
    "Bara": ["Kalaiya", "Jeetpur Simara", "Kolhabi", "Nijgadh", "Mahagadhimai", "Simraungadh", "Pacharauta", "Pheta", "Bishrampur", "Prasauni", "Parwanipur", "Bara Gadhi", "Karaiyamai", "Devtal", "Adarsh Kotwal", "Suwarna"],
    "Dhanusha": ["Janakpur", "Chhireshwarnath", "Ganeshman Charnath", "Dhanusadham", "Nagarain", "Bideha", "Mithila", "Sahidnagar", "Sabaila", "Kamala", "Mithila Bihari", "Hansapur", "Janaknandini", "Bateshwar", "Mukhiyapatti Musharniya", "Lakshminya", "Aaurahi", "Dhanauji"],
    "Mahottari": ["Jaleshwar", "Bardibas", "Gaushala", "Loharpatti", "Ramgopalpur", "Manara Shiswa", "Matihani", "Bhangaha", "Balwa", "Aurahi", "Ekdara", "Mahottari", "Pipara", "Samsi", "Sonama"],
    "Parsa": ["Birgunj", "Pokhariya", "Bahudarmai", "Parsagadhi", "Bindabasini", "Dhobini", "Chhipaharmai", "Jagarnathpur", "Jirabhawani", "Kalikamai", "Pakaha Mainpur", "Paterwa Sugauli", "Sakhuwa Prasauni", "Thori"],
    "Rautahat": ["Chandrapur", "Garuda", "Gaur", "Brindaban", "Dewahi Gonahi", "Gadhimai", "Gujara", "Ishanath", "Katahariya", "Madhav Narayan", "Maulapur", "Paroha", "Phatuwa Bijayapur", "Rajdevi", "Rajpur", "Yamunamai"],
    "Saptari": ["Rajbiraj", "Kanchanrup", "Dakneshwari", "Bode Barsain", "Khadak", "Surunga", "Shambhunath", "Hanumannagar Kankalini", "Saptakoshi", "Agnisair Krishna Savaran", "Balan Bihul", "Belhi Chapena", "Bishnupur", "Chhinnamasta", "Mahadeva", "Rajgadh", "Rupani", "Tilathi Koiladi", "Tirhut"],
    "Sarlahi": ["Malangwa", "Ishworpur", "Lalbandi", "Haripur", "Hariwan", "Barahathwa", "Godaita", "Bagmati", "Balara", "Brahmapuri", "Bishnu", "Chakraghatta", "Chandranagar", "Dhankaul", "Haripurwa", "Kabilasi", "Kaudena", "Parsa", "Ramnagar", "Basbariya"],
    "Siraha": ["Lahan", "Siraha", "Mirchaiya", "Golbazar", "Dhangadhimai", "Sukhipur", "Kalyanpur", "Karjanha", "Bhagwanpur", "Aurahi", "Bishnupur", "Bariyarpatti", "Lakshmipur Patari", "Naraha", "Sakhuwanankarkatti", "Arnama", "Nawarajpur"],
  },
  "Bagmati": {
    "Bhaktapur": ["Bhaktapur", "Madhyapur Thimi", "Changunarayan", "Suryabinayak"],
    "Chitwan": ["Bharatpur", "Kalika", "Khairahani", "Madi", "Ratnanagar", "Rapti", "Ichchhakamana"],
    "Dhading": ["Nilkantha", "Dhunibesi", "Khaniyabas", "Gajuri", "Galchhi", "Gangajamuna", "Jwalamukhi", "Netrawati Dabjong", "Rubi Valley", "Siddhalek", "Thakre", "Tripura Sundari", "Benighat Rorang"],
    "Dolakha": ["Bhimeshwar", "Jiri", "Charikot", "Kalinchok", "Melung", "Bigu", "Gaurishankar", "Baiteshwar", "Tamakoshi"],
    "Kathmandu": ["Kathmandu", "Kageshwari Manohara", "Kirtipur", "Gokarneshwar", "Chandragiri", "Tokha", "Tarakeshwar", "Dakshinkali", "Nagarjun", "Shankharapur", "Budhanilkantha"],
    "Kavrepalanchok": ["Dhulikhel", "Banepa", "Panauti", "Panchkhal", "Mandandeupur", "Namobuddha", "Khanikhola", "Chauri Deurali", "Bethanchok", "Bhumlu", "Mahabharat", "Roshi", "Temal"],
    "Lalitpur": ["Lalitpur", "Mahalaxmi", "Godawari", "Konjyosom", "Bagmati", "Mahankal"],
    "Makwanpur": ["Hetauda", "Thaha", "Bhimphedi", "Manahari", "Indrasarowar", "Kailash", "Bakaiya", "Bagmati", "Makawanpurgadhi", "Raksirang"],
    "Nuwakot": ["Bidur", "Belkotgadhi", "Kakani", "Panchakanya", "Likhu", "Dupcheshwar", "Shivapuri", "Tadi", "Tarkeshwar", "Suryagadhi", "Kispang", "Myagang"],
    "Ramechhap": ["Manthali", "Ramechhap", "Umakunda", "Khandadevi", "Doramba", "Gokulganga", "Likhu Tamakoshi", "Sunapati"],
    "Rasuwa": ["Uttargaya", "Kalika", "Naukunda", "Gosaikunda", "Aamachhodingmo"],
    "Sindhuli": ["Kamalamai", "Dudhauli", "Sunkoshi", "Hariharpurgadhi", "Tinpatan", "Marin", "Golanjor", "Phikkal", "Ghyanglekh"],
    "Sindhupalchok": ["Chautara Sangachok Gadhi", "Bahrabise", "Melamchi", "Indrawati", "Jugal", "Panchpokhari Thangpal", "Helambu", "Tripurasundari", "Lisangkhu Pakhar", "Bhotekoshi", "Sunkoshi", "Balefi"],
  },
  "Gandaki": {
    "Baglung": ["Baglung", "Galkot", "Jaimuni", "Dhorpatan", "Bareng", "Khathekhola", "Tamankhola", "Tarakhola", "Nisikhola", "Badigad"],
    "Gorkha": ["Gorkha", "Palungtar", "Sulikot", "Siranchok", "Ajirkot", "Aarughat", "Bhimsen", "Shahid Lakhan", "Gandaki", "Chum Nubri", "Dharche"],
    "Kaski": ["Pokhara", "Annapurna", "Machhapuchchhre", "Madi", "Rupa"],
    "Lamjung": ["Besisahar", "Madhya Nepal", "Rainas", "Sundarbazar", "Dordi", "Marsyangdi", "Dudhpokhari", "Kwholasothar"],
    "Manang": ["Chame", "Narpa Bhumi", "Nashon", "Manang Ngisyang"],
    "Mustang": ["Gharapjhong", "Thasang", "Lomanthang", "Lo-Ghekar Damodarkunda", "Baragung Muktichhetra"],
    "Myagdi": ["Beni", "Annapurna", "Mangala", "Malika", "Raghuganga", "Dhaulagiri"],
    "Nawalpur": ["Kawasoti", "Gaindakot", "Devchuli", "Madhyabindu", "Bulingtar", "Baudikali", "Hupsekot", "Binayi Tribeni"],
    "Parbat": ["Kushma", "Phalebas", "Modi", "Jaljala", "Paiyun", "Mahashila", "Bihadi"],
    "Syangja": ["Putalibazar", "Galyang", "Chapakot", "Bhirkot", "Waling", "Arjun Chaupari", "Aandhikhola", "Biruwa", "Harinas", "Kaligandaki", "Phedikhola"],
    "Tanahun": ["Byas", "Shuklagandaki", "Bhanu", "Bhimad", "Anbukhaireni", "Devghat", "Bandipur", "Rishing", "Ghiring", "Myagde"],
  },
  "Lumbini": {
    "Arghakhanchi": ["Sandhikharka", "Bhumikasthan", "Sitganga", "Chhatradev", "Panini", "Malarani"],
    "Banke": ["Nepalgunj", "Kohalpur", "Khajura", "Janaki", "Duduwa", "Rapti Sonari", "Baijanath", "Narainapur"],
    "Bardiya": ["Gulariya", "Rajapur", "Madhuwan", "Thakurbaba", "Bansgadhi", "Barbardiya", "Geruwa", "Badhaiyatal"],
    "Dang": ["Ghorahi", "Tulsipur", "Lamahi", "Banglachuli", "Dangisharan", "Gadhawa", "Rajpur", "Rapti", "Shantinagar", "Babai"],
    "Eastern Rukum": ["Putha Uttarganga", "Bhume", "Sisne"],
    "Gulmi": ["Resunga", "Musikot", "Isma", "Kaligandaki", "Satyawati", "Chandrakot", "Ruru", "Chhatrakot", "Malika", "Dhurkot", "Madane", "Gulmi Darbar"],
    "Kapilvastu": ["Kapilvastu", "Banganga", "Buddhabhumi", "Krishnanagar", "Maharajgunj", "Shivaraj", "Mayadevi", "Yashodhara", "Suddhodhan", "Bijayanagar"],
    "Nawalparasi (Bardaghat-Susta West)": ["Ramgram", "Sunwal", "Bardaghat", "Susta", "Pratappur", "Sarawal", "Palhinandan"],
    "Palpa": ["Tansen", "Rampur", "Rainadevi Chhahara", "Ribdikot", "Bagnaskali", "Mathagadhi", "Nisdi", "Purbakhola", "Tinau", "Tinau"],
    "Parasi": ["Ramgram", "Sunwal", "Bardaghat", "Susta", "Pratappur", "Sarawal", "Palhinandan"],
    "Pyuthan": ["Pyuthan", "Sworgadwari", "Mandavi", "Mallarani", "Naubahini", "Jhimruk", "Gaumukhi", "Sarumarani", "Airawati"],
    "Rolpa": ["Rolpa", "Triveni", "Suwarnabati", "Lungri", "Sunchhahari", "Thawang", "Pariwartan", "Madi", "Runtigadhi", "Sukidaha"],
    "Rupandehi": ["Butwal", "Tilottama", "Devdaha", "Lumbini Sanskritik", "Sainamaina", "Siddharthanagar (Bhairahawa)", "Gaidahawa", "Kotahimai", "Marchawari", "Mayadevi", "Omsatiya", "Rohini", "Sammarimai", "Siyari", "Suddhodhan", "Kanchan"],
  },
  "Karnali": {
    "Dailekh": ["Narayan", "Dullu", "Chamunda Bindrasaini", "Aathbis", "Bhagawatimai", "Gurans", "Dungeshwar", "Naumule", "Mahabu", "Bhairavi", "Thantikandh"],
    "Dolpa": ["Thuli Bheri", "Tripurasundari", "Dolpo Buddha", "Shey Phoksundo", "Jagadulla", "Mudkechula", "Kaike", "Chharka Tangsong"],
    "Humla": ["Simkot", "Namkha", "Kharpunath", "Sarkegad", "Chankheli", "Adanchuli", "Tanjakot"],
    "Jajarkot": ["Bheri", "Chhedagad", "Tribeni Nalgad", "Kushe", "Junichande", "Barekot", "Shivalaya"],
    "Jumla": ["Chandannath", "Kanaka Sundari", "Sinja", "Hima", "Tila", "Guthichaur", "Tatopani", "Patarasi"],
    "Kalikot": ["Khandachakra", "Raskot", "Tilagufa", "Pachaljharana", "Sanni Triveni", "Mahawai", "Naraharinath", "Shubha Kalika", "Palata"],
    "Mugu": ["Chhayanath Rara", "Mugum Karmarong", "Khatyad", "Soru"],
    "Salyan": ["Sharada", "Bagchaur", "Bangad Kupinde", "Kalimati", "Tribeni", "Kapurkot", "Chhatreshwari", "Darma", "Kumakh Malika", "Siddha Kumakh"],
    "Surkhet": ["Birendranagar", "Bheriganga", "Gurbhakot", "Panchapuri", "Lekbeshi", "Chaukune", "Barahatal", "Chingad", "Simta"],
    "Western Rukum": ["Musikot", "Chaurjahari", "Aathbiskot", "Banphikot", "Sanibheri", "Tribeni"],
  },
  "Sudurpashchim": {
    "Achham": ["Mangalsen", "Kamalbazar", "Sanphebagar", "Panchadewal Binayak", "Chaurpati", "Mellekh", "Dhakari", "Bannigadhi Jayagadh", "Ramaroshan", "Turmakhand"],
    "Baitadi": ["Dasharathchand", "Patan", "Melauli", "Purchaudi", "Surnaya", "Sigas", "Shivanath", "Pancheshwar", "Dogadakedar", "Dilasaini"],
    "Bajhang": ["Jaya Prithvi", "Bungal", "Talkot", "Masta", "Khaptadchhanna", "Thalara", "Bitthadchir", "Surma", "Chhabis Pathivera", "Durgathali", "Kedarsyu", "Saipal"],
    "Bajura": ["Badimalika", "Triveni", "Budhinanda", "Budhiganga", "Khaptad Chhededaha", "Jagannath", "Swami Kartik Khapar", "Himali", "Pandav Gufa"],
    "Dadeldhura": ["Amargadhi", "Parashuram", "Aalital", "Bhageshwar", "Navadurga", "Ganyapadhura", "Ajaymeru"],
    "Darchula": ["Mahakali", "Shailyashikhar", "Malikarjun", "Apihimal", "Duhun", "Naugad", "Marma", "Lekam", "Byas"],
    "Doti": ["Dipayal Silgadhi", "Shikhar", "Purbichauki", "Badikedar", "Jorayal", "Sayal", "Adarsha", "K.I. Singh", "Bogtan"],
    "Kailali": ["Dhangadhi", "Tikapur", "Ghodaghodi", "Lamki Chuha", "Bhajani", "Godawari", "Gauriganga", "Janaki", "Kailari", "Bardagoriya", "Mohanyal", "Chure"],
    "Kanchanpur": ["Bhimdatta", "Bedkot", "Mahakali", "Shuklaphanta", "Belauri", "Krishnapur", "Punarbas", "Laljhadi", "Beldandi"],
  },
};

export const PROVINCES = Object.keys(NEPAL_ADDRESS);
export const districtsOf = (p: string) => Object.keys(NEPAL_ADDRESS[p] ?? {});
export const municipalitiesOf = (p: string, d: string) => NEPAL_ADDRESS[p]?.[d] ?? [];

export type MunicipalityEntry = { municipality: string; district: string; province: string };

export const ALL_MUNICIPALITIES: MunicipalityEntry[] = Object.entries(NEPAL_ADDRESS).flatMap(
  ([province, districts]) =>
    Object.entries(districts).flatMap(([district, munis]) =>
      munis.map((municipality) => ({ municipality, district, province })),
    ),
);

export function lookupMunicipality(name: string): MunicipalityEntry | undefined {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;
  return ALL_MUNICIPALITIES.find((m) => m.municipality.toLowerCase() === key);
}
