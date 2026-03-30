import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: 'electronics', nameKa: 'ელექტრონიკა', nameEn: 'Electronics', icon: '⚡', sortOrder: 1 },
  { slug: 'clothing',    nameKa: 'ტანსაცმელი',  nameEn: 'Clothing',     icon: '✦', sortOrder: 2 },
  { slug: 'books',       nameKa: 'წიგნები',      nameEn: 'Books',        icon: '▤', sortOrder: 3 },
  { slug: 'furniture',   nameKa: 'ავეჯი',        nameEn: 'Furniture',    icon: '▣', sortOrder: 4 },
  { slug: 'sports',      nameKa: 'სპორტი',       nameEn: 'Sports',       icon: '●', sortOrder: 5 },
  { slug: 'gaming',      nameKa: 'გეიმინგი',     nameEn: 'Gaming',       icon: '◎', sortOrder: 6 },
  { slug: 'kids',        nameKa: 'საბავშვო',     nameEn: 'Kids',         icon: '◉', sortOrder: 7 },
  { slug: 'other',       nameKa: 'სხვა',         nameEn: 'Other',        icon: '◇', sortOrder: 8 },
  { slug: 'cars',        nameKa: 'ავტომობილები', nameEn: 'Cars',         icon: '🚗', sortOrder: 9 },
];

const USERS = [
  { email: 'giorgi@swapbox.ge',   username: 'giorgi_m',    displayName: 'გიორგი მამულაძე',    city: 'თბილისი',    bio: 'ტექნიკის მოყვარული, ვაგდებ ძველ გაჯეტებს' },
  { email: 'nino@swapbox.ge',     username: 'nino_k',      displayName: 'ნინო კვარაცხელია',   city: 'თბილისი',    bio: 'წიგნების მოყვარული, ვცვლი და ვაჩუქებ' },
  { email: 'luka@swapbox.ge',     username: 'luka_b',      displayName: 'ლუკა ბერიძე',        city: 'ბათუმი',     bio: 'სპორტსმენი, ვცვლი სპორტ ინვენტარს' },
  { email: 'mariam@swapbox.ge',   username: 'mariam_j',    displayName: 'მარიამ ჯაფარიძე',    city: 'ქუთაისი',    bio: 'მოდის მოყვარული, ვყიდი ბავშვის ნივთებს' },
  { email: 'davit@swapbox.ge',    username: 'davit_ts',    displayName: 'დავით წიკლაური',     city: 'თბილისი',    bio: 'გეიმერი, ვცვლი კონსოლებსა და თამაშებს' },
  { email: 'ana@swapbox.ge',      username: 'ana_g',       displayName: 'ანა გვენეტაძე',      city: 'თბილისი',    bio: 'ინტერიერის დიზაინერი, ვყიდი ავეჯს' },
  { email: 'nika@swapbox.ge',     username: 'nika_ch',     displayName: 'ნიკა ჩიქოვანი',      city: 'რუსთავი',    bio: 'ელექტრონიკის სპეციალისტი' },
  { email: 'tamar@swapbox.ge',    username: 'tamar_ab',    displayName: 'თამარ აბულაძე',      city: 'გორი',       bio: 'ვაჩუქებ შვილების ძველ ნივთებს' },
  { email: 'sandro@swapbox.ge',   username: 'sandro_kh',   displayName: 'სანდრო ხარაიძე',     city: 'ზუგდიდი',    bio: 'ველოსიპედის მოყვარული' },
  { email: 'keti@swapbox.ge',     username: 'keti_mts',    displayName: 'კეტი მცხვეთელი',     city: 'თბილისი',    bio: 'ვაგდებ სახლის ნივთებს, ვიყენებ მინიმალიზმს' },
  { email: 'irakli@swapbox.ge',   username: 'irakli_v',    displayName: 'ირაკლი ვარდოსანიძე', city: 'თბილისი',    bio: 'ფოტოგრაფი, ვცვლი კამერებს' },
  { email: 'salome@swapbox.ge',   username: 'salome_d',    displayName: 'სალომე დარჩიაშვილი', city: 'ბათუმი',     bio: 'ბავშვების ნივთები, სათამაშოები' },
  { email: 'zura@swapbox.ge',     username: 'zura_sh',     displayName: 'ზურა შენგელია',      city: 'ქუთაისი',    bio: 'მანქანის მოყვარული, ვცვლი ნაწილებს' },
  { email: 'maka@swapbox.ge',     username: 'maka_tv',     displayName: 'მაკა ტვალჭრელიძე',  city: 'თბილისი',    bio: 'სახლის ინტერიერი, ხელნაკეთობები' },
  { email: 'tornike@swapbox.ge',  username: 'tornike_g',   displayName: 'თორნიკე გიორგაძე',   city: 'რუსთავი',    bio: 'IT სპეციალისტი, ლეპტოპები და კომპიუტერები' },
  { email: 'elene@swapbox.ge',    username: 'elene_b',     displayName: 'ელენე ბაქრაძე',      city: 'გორი',       bio: 'წიგნები, მუსიკა, კულტურა' },
  { email: 'beka@swapbox.ge',     username: 'beka_n',      displayName: 'ბეკა ნოზაძე',        city: 'ზუგდიდი',    bio: 'სპორტი და ფიტნესი' },
  { email: 'nana@swapbox.ge',     username: 'nana_ch',     displayName: 'ნანა ჩოჩელი',        city: 'თბილისი',    bio: 'სამზარეულოს ნივთები, ყავის მოყვარული' },
  { email: 'dato@swapbox.ge',     username: 'dato_ts',     displayName: 'დათო ცაგარეიშვილი',  city: 'ბათუმი',     bio: 'გეიმინგი და ტექნიკა' },
  { email: 'sopio@swapbox.ge',    username: 'sopio_m',     displayName: 'სოფიო მეგრელიძე',    city: 'ქუთაისი',    bio: 'ბავშვის ტანსაცმელი და სათამაშოები' },
  { email: 'giorgi2@swapbox.ge',  username: 'giorgi_p',    displayName: 'გიორგი ფანჯიკიძე',   city: 'თბილისი',    bio: 'ძველი ნივთები, ანტიკვარიატი' },
  { email: 'mariam2@swapbox.ge',  username: 'mariam_k',    displayName: 'მარიამ კვირიკაშვილი',city: 'რუსთავი',    bio: 'მოდა და სტილი' },
  { email: 'levan@swapbox.ge',    username: 'levan_kob',   displayName: 'ლევან კობახიძე',     city: 'გორი',       bio: 'ელექტრო ინსტრუმენტები, სარემონტო' },
  { email: 'tamuna@swapbox.ge',   username: 'tamuna_gh',   displayName: 'თამუნა ღვინიაშვილი', city: 'თბილისი',    bio: 'სახლის ნივთები, ავეჯი' },
  { email: 'shota@swapbox.ge',    username: 'shota_r',     displayName: 'შოთა რუსიეშვილი',    city: 'ბათუმი',     bio: 'სპორტი, ველოსიპედი, ლაშქრობა' },
];

const CONDITIONS = ['new', 'like_new', 'good', 'fair'] as const;
const TYPES = ['swap', 'gift'] as const;
const CITIES = ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'ფოთი'];

// ─── ITEM TEMPLATES PER CATEGORY ─────────────────────────────────────────────

const ITEMS_BY_CATEGORY: Record<string, { titles: string[]; descs: string[]; wants: string[] }> = {
  electronics: {
    titles: [
      'iPhone 13 Pro', 'Samsung Galaxy S22', 'MacBook Air M2', 'iPad Pro 11"',
      'Sony WH-1000XM5 ყურსასმენი', 'Apple Watch Series 8', 'Xiaomi Mi 11',
      'Dell XPS 15 ლეპტოპი', 'Canon EOS R50 კამერა', 'Sony PlayStation 5',
      'Nintendo Switch OLED', 'GoPro Hero 11', 'DJI Mini 3 დრონი',
      'Samsung 4K TV 55"', 'Bose QuietComfort 45', 'Logitech MX Master 3',
      'Razer BlackWidow კლავიატურა', 'LG UltraWide მონიტორი', 'Anker პავერბანკი',
      'JBL Charge 5 სპიკერი',
    ],
    descs: [
      'შესანიშნავ მდგომარეობაში, სრული კომპლექტაცია, ყუთი და ყველა აქსესუარი.',
      'ნახმარია 6 თვე, სახედავი სახე არ აქვს, ეკრანი ორიგინალია.',
      'ხარვეზი: პატარა ნაკაწრი კორპუსზე, მუშაობს შეუფერხებლად.',
      'ყიდულობ ახლიდან — ბატარეა 95%, ყველა ფუნქცია მუშაობს.',
      'ოჯახში არ გვჭირდება, ვიყენებდით სულ 3 თვე.',
    ],
    wants: ['iPhone 14', 'ლეპტოპი', 'ტაბლეტი', 'ფოტოკამერა', 'ყურსასმენი'],
  },
  clothing: {
    titles: [
      'Nike Air Max 270 კედები', 'Adidas Ultraboost 22', 'Levi\'s 501 ჯინსი',
      'Zara ზამთრის პალტო', 'H&M ზაფხულის კაბა', 'Tommy Hilfiger პოლო',
      'North Face ქურთუკი', 'Under Armour სპორტული ტანსაცმელი',
      'Gucci ქამარი', 'Ray-Ban Aviator სათვალე', 'Hugo Boss კოსტუმი',
      'Mango ვეჩერნი კაბა', 'Calvin Klein ჯინსი', 'Converse All Star',
      'New Balance 574', 'Polo Ralph Lauren შარფი', 'Versace სუნამო',
      'Burberry ქუდი', 'Lacoste მაისური', 'Puma ტრენინგი',
    ],
    descs: [
      'ერთხელ გამოცმული, შესანიშნავ მდგომარეობაში, სუფთა.',
      'ზომა M/L, ფერი შავი, ევროპული ბრენდი.',
      'ნათქვამ ზომაზე პატარაა, ამიტომ ვყიდი, 2 თვე ნახმარი.',
      'ზამთრის სეზონისთვის, ძალიან თბილი, ახალ ტოლია.',
      'კარგ მდგომარეობაში, ზომა S, ორიგინალი.',
    ],
    wants: ['ზომა L ქურთუკი', 'სპორტული ფეხსაცმელი', 'ჯინსი', 'სუნამო', 'ჩანთა'],
  },
  books: {
    titles: [
      'ჰარი პოტერი — სრული კოლექცია', 'გვემე ემეჩე — ყველაფერი დაიმსხვრება',
      'ჯ. ტოლკინი — ბეჭდების მბრძანებელი', 'სტივ ჯობსი — ბიოგრაფია',
      'ათასი მზიანი დღე', 'ალქიმიკოსი', 'მამა მდიდარი მამა ღარიბი',
      'პიტერ დრაკერი — მენეჯმენტი', 'Clean Code', 'Design Patterns',
      'JavaScript: The Good Parts', 'Atomic Habits', 'Sapiens',
      'The Lean Startup', '48 Laws of Power', 'Think and Grow Rich',
      'Dale Carnegie — მეგობრების მოპოვება', 'ფსიქოლოგია გაყიდვებში',
      'გრაფი მონტე-კრისტო', 'ომი და მშვიდობა',
    ],
    descs: [
      'კარგ მდგომარეობაში, გვერდები სუფთა, ყდა მთლიანი.',
      'ერთხელ წაკითხული, ხაზი ცოტა გასმული, ყდა კარგია.',
      'ახალი, ოდნავ ფხვნილია ყდა, შინაარსი ნაწერი არ არის.',
      'სრული კომპლექტი, ყველა ტომი ერთად.',
      'ქართული გამოცემა, 2022 წ., შესანიშნავ მდგომარეობაში.',
    ],
    wants: ['სხვა წიგნი', 'კლასიკური ლიტერატურა', 'ბიზნეს წიგნი', 'ფსიქოლოგია'],
  },
  furniture: {
    titles: [
      'IKEA სამ-ადგილიანი დივანი', 'სასადილო მაგიდა 6 სკამით',
      'საძინებელი კომოდი', 'სამუშაო მაგიდა', 'წიგნების თარო',
      'ბავშვის საწოლი', 'ტელევიზორის კარადა', 'კუთხის სოფა',
      'ბარის სკამი x2', 'ოფისის სკამი', 'ყვავილის სტენდი',
      'სამზარეულოს კარადა', 'სარკე სრული სიგრძის', 'ხის ყუთი-ლარნაკი',
      'შეიდი ჩრდილ-შტორა', 'პლასტმასის სკამი x4', 'ქოლგის საკიდი',
      'პატარა თარო კედელზე', 'ბავშვის მაგიდა-სკამი', 'სამსახურის მოლბერტი',
    ],
    descs: [
      'ვიყენებდი 2 წელი, სახე კარგია, გადაბარება თბილისში.',
      'IKEA-დან ყიდულობდი, ასაწყობი, ინსტრუქცია გვაქვს.',
      'სახე კარგია, ოდნავ ნახმარი, ფერი თეთრი.',
      'ახლი ბინა, ახალი ავეჯი, ამიტომ ვყიდი ძველს.',
      'ხის, ძლიერი, ჯანმრთელი, ნახმარია 5 წელი.',
    ],
    wants: ['სხვა ავეჯი', 'ელექტრონიკა', 'ფული', 'ნებისმიერი'],
  },
  sports: {
    titles: [
      'ველოსიპედი Trek Marlin 5', 'ფეხბურთის კარი', 'ბადმინტონის კომპლექტი',
      'იოგას ხალიჩა + ბლოკები', 'სიმძიმეების სეტი 30 კგ', 'სარბენი ბილიკი',
      'Decathlon ჩხიკვური', 'ჩოგბურთის ჩოგანი x2', 'ბასკეტბოლის ბურთი',
      'ფეხბურთის ბუცი Nike', 'სათხილამურო კომპლექტი', 'გოლფის ჩხირები',
      'კემპინგის კარავი', 'საცურაო სათვალე Speedo', 'ფიტნეს ბენდი x5',
      'ბოქსის ხელთათმანები', 'ჩოგბურთის ქამარი', 'ევო-ბუმბულის ბურთი',
      'სკეიტბორდი', 'მთის კომპასი',
    ],
    descs: [
      'სეზონი ვთამაშე, ახლა არ მჭირდება, კარგ მდგომარეობაში.',
      'ბავშვი გაიზარდა, ვაჩუქებ ახალ ოჯახს.',
      'ევროპული ბრენდი, ხარისხიანი, ოდნავ ნახმარი.',
      'სახე კარგია, ყველა ნაწილი მუშაობს.',
      'მხოლოდ ზაფხულში გამოვიყენეთ, ახლიდან არ განსხვავდება.',
    ],
    wants: ['სხვა სპორტ ინვენტარი', 'ელექტრონიკა', 'ტანსაცმელი', 'ნებისმიერი'],
  },
  gaming: {
    titles: [
      'PlayStation 5 + 3 თამაში', 'Xbox Series X', 'Nintendo Switch OLED',
      'PS5 DualSense კონტროლერი', 'Xbox Elite Controller v2',
      'God of War Ragnarök', 'Elden Ring', 'FIFA 24',
      'Call of Duty MW3', 'Spider-Man 2', 'Hogwarts Legacy',
      'Gaming Chair Secretlab', 'Razer Headset BlackShark V2',
      'Logitech G502 მაუსი', 'Gaming Monitor 144Hz',
      'Capture Card Elgato HD60', 'Steam Deck 512GB',
      'Oculus Quest 2 VR', 'Arcade Joystick', 'PS4 Pro 1TB',
    ],
    descs: [
      'შვილმა გადააგდო ინტერესი, ვყიდი სრულ კომპლექტს.',
      'ყველა ფუნქცია მუშაობს, კარგ მდგომარეობაში.',
      'ახლი სერია გამოვიდა, ვცვლი ძველს.',
      'ნაწიბური ცოტა კორპუსზე, ყველაფერი სხვა ახლია.',
      'ლიცენზიური, ყველა DLC ჩათვლით.',
    ],
    wants: ['PS5 თამაში', 'Xbox თამაში', 'კონტროლერი', 'Gaming ყურსასმენი'],
  },
  kids: {
    titles: [
      'LEGO City კომპლექტი', 'Barbie სრული კოლექცია', 'ბავშვის ველოსიპედი',
      'კარევანი სათამაშო სახლი', 'Hot Wheels ტრეკი', 'Playmobil ზოოპარკი',
      'ბავშვის სამოქმედო ხელოვნება', 'ელ. კლავიატურა ბავშვის',
      'Wooden Railway Thomas', 'Nerf Elite ბლასტერი',
      'Frozen სამოსი', 'Spiderman კოსტუმი', 'Baby Alive თოჯინა',
      'Rubik\'s Cube 3x3', 'Marble Run კომპლექტი',
      'Microscope Set ბავშვის', 'Kinetic Sand ყუთი',
      'Slime Making Kit', 'Board Game Monopoly', 'UNO კარტები',
    ],
    descs: [
      'ბავშვმა გაიზარდა, ნივთი კარგ მდგომარეობაშია.',
      'სრული კომპლექტი, ყველა ნაწილი, ყუთიანად.',
      'ბავშვი 5 წლის, ახლა ეს ზომა პატარაა.',
      'ერთხელ გამოიყენეს, ახლის ტოლია.',
      'შეძენილი, ბავშვს არ შეუყვარდა, ვაჩუქებ.',
    ],
    wants: ['სხვა სათამაშო', 'წიგნი', 'ველოსიპედი', 'ნებისმიერი'],
  },
  other: {
    titles: [
      'Singer-ის შესაკერი მანქანა', 'ჩაის სახელობო კომპლექტი',
      'ხელნაკეთი კერამიკა', 'ფოტო ჩარჩო კოლექცია',
      'პლასტმასის სათბური ყვავილებისთვის', 'მუზეუმის რეპროდუქცია',
      'ქართული ხელოვნება — ნახატი', 'ვაზა კრისტალის',
      'სამკულინარო ნაკრები Pro', 'ყავის მანქანა DeLonghi',
      'Dyson V15 მტვერსასრუტი', 'Instant Pot Duo', 'Nespresso ვერტუო',
      'AirFryer 5L', 'KitchenAid სტენდ-მიქსერი', 'Vitamix ბლენდერი',
      'ქინძი — დასაწყისის ნაკრები', 'სახატავი ბლოკნოტი A3',
      'მუსიკის ინსტრუმენტი — უკულელე', 'Polaroid კამერა',
    ],
    descs: [
      'კარგ მდგომარეობაში, იყენებდი სულ ცოტა.',
      'სახლი გადავდი, ეს ნივთები ზედმეტია.',
      'ხელნაკეთი, უნიკალური, ერთი ეგზემპლარი.',
      'ახლი სახე, ფაბრიკული შეფუთვა.',
      'ოდნავ ნახმარი, ყველა ნაწილი შეუვალი.',
    ],
    wants: ['ნებისმიერი', 'ელექტრონიკა', 'სახლის ნივთი', 'ანაზღაურება'],
  },
  cars: {
    titles: [
      'Toyota Camry 2018', 'Mercedes-Benz E200 2016', 'BMW 520d 2017',
      'Volkswagen Passat B8 2019', 'Hyundai Tucson 2020', 'Kia Sportage 2021',
      'Toyota RAV4 2019', 'Honda CR-V 2018', 'Nissan X-Trail 2017',
      'Lexus RX 350 2016', 'Ford Mustang GT 2018', 'Chevrolet Malibu 2017',
      'Audi A4 2018', 'Subaru Forester 2019', 'Mitsubishi Outlander 2018',
      'Skoda Octavia 2017', 'SEAT Leon 2018', 'Mazda CX-5 2020',
      'Jeep Wrangler 2019', 'Land Rover Freelander 2016',
      'Toyota Prius Hybrid 2018', 'Honda Civic 2019', 'Volkswagen Golf 2018',
      'Renault Megane 2017', 'Peugeot 308 2018', 'Opel Astra 2017',
      'Ford Focus 2018', 'Toyota Corolla 2020', 'Hyundai Elantra 2019',
      'Kia Cerato 2018',
    ],
    descs: [
      'ძრავი შესანიშნავ მდგომარეობაში, ახლახან გავიარე ტექდათვალიერება. სრული ქართული დოკუმენტაცია.',
      'ერთი პატრონი, გარბენი 80,000 კმ. სუფთა სალონი, ყველა ფუნქცია მუშაობს.',
      'ავარიის ისტორია არ გააჩნია, სრულად სერვისდება ოფიციალურ სერვისში.',
      'ახლახანს გაცვლილი ზეთი, ბლოკი, ფილტრები. ეკონომიური ძრავი.',
      'ელ. გასამრავლებელი, ელ. სარკეები, კლიმატ-კონტროლი, განათება LED.',
      'ვყიდი გამოსვლის გამო, ფასი საპრეტო, ტორგი შესაძლებელია.',
      'კარგ მდგომარეობაში, ბეწვი გამოცვლილია, ახალი საბურავები.',
      'ყველა საბუთი წესრიგში, ტექდათვალიერება გავლილი 2024 წელს.',
    ],
    wants: ['სხვა მანქანა', 'BMW', 'Mercedes', 'Toyota', 'ფული'],
  },
};


// ─── HELPERS ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function imageUrl(_slug: string, lock: number, w = 800, h = 600) {
  return `https://picsum.photos/seed/${lock}/${w}/${h}`;
}

function avatarUrl(lock: number) {
  return `https://picsum.photos/seed/avatar${lock}/200/200`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // 0. Cleanup
  await prisma.itemImage.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing data');

  // 1. Categories
  const createdCats: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    createdCats[cat.slug] = c.id;
  }
  console.log(`✅ ${CATEGORIES.length} categories`);

  // 2. Users
  const hashedPassword = await bcrypt.hash('123456', 10);
  const createdUsers: string[] = [];

  for (const [i, u] of USERS.entries()) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      createdUsers.push(existing.id);
      continue;
    }
    const user = await prisma.user.create({
      data: {
        email: u.email,
        username: u.username,
        displayName: u.displayName,
        password: hashedPassword,
        city: u.city,
        bio: u.bio,
        avatarUrl: avatarUrl(i + 1),
        rating: parseFloat((4 + Math.random()).toFixed(1)),
        totalReviews: Math.floor(Math.random() * 30),
        isVerified: Math.random() > 0.5,
      },
    });
    createdUsers.push(user.id);
  }
  console.log(`✅ ${createdUsers.length} users`);

  // 3. Items — 1 per category (10 total for fast seeding)
  const mainSlugs = ['electronics', 'clothing', 'books', 'furniture', 'sports', 'gaming', 'kids', 'other'];
  const perCategory = 1;
  let totalItems = 0;
  let seedOffset = 0;

  for (const slug of mainSlugs) {
    const catId = createdCats[slug];
    const tpl = ITEMS_BY_CATEGORY[slug];
    const count = perCategory;

    for (let i = 0; i < count; i++) {
      const type = pick(TYPES);
      const imgCount = Math.floor(Math.random() * 3) + 1;
      const images = Array.from({ length: imgCount }, (_, idx) => ({
        url: imageUrl(slug, seedOffset * 3 + idx),
        filename: `seed-${slug}-${seedOffset}-${idx}.webp`,
        sortOrder: idx,
        isPrimary: idx === 0,
      }));

      await prisma.item.create({
        data: {
          userId: pick(createdUsers),
          categoryId: catId,
          title: pick(tpl.titles) + (Math.random() > 0.6 ? ` (${Math.floor(Math.random() * 5) + 1})` : ''),
          description: pick(tpl.descs),
          type,
          condition: pick(CONDITIONS),
          city: pick(CITIES),
          wantsDescription: type === 'swap' ? pick(tpl.wants) : null,
          viewCount: Math.floor(Math.random() * 200),
          saveCount: Math.floor(Math.random() * 30),
          images: { create: images },
        },
      });

      seedOffset++;
      totalItems++;
    }

    await prisma.category.update({ where: { id: catId }, data: { itemCount: count } });
    console.log(`  📦 ${count} items in ${slug}`);
  }

  // 4. Cars — 1000 items
  const carsCatId = createdCats['cars'];
  const carsTpl = ITEMS_BY_CATEGORY['cars'];
  const YEARS = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
  const MILEAGES = ['45,000 კმ', '68,000 კმ', '92,000 კმ', '120,000 კმ', '55,000 კმ', '78,000 კმ', '30,000 კმ', '105,000 კმ'];
  const ENGINES = ['1.6 ბენზინი', '2.0 ბენზინი', '1.8 ჰიბრიდი', '2.0 დიზელი', '2.5 ბენზინი', '3.0 ბენზინი', '1.5 ტურბო'];

  for (let i = 0; i < 2; i++) {
    const year = pick(YEARS);
    const mileage = pick(MILEAGES);
    const engine = pick(ENGINES);
    const baseTitle = pick(carsTpl.titles);
    const title = `${baseTitle} ${year} — ${engine}`;
    const desc = `${pick(carsTpl.descs)} გარბენი: ${mileage}.`;
    const imgCount = Math.floor(Math.random() * 3) + 2; // 2-4 სურათი მანქანებზე
    const images = Array.from({ length: imgCount }, (_, idx) => ({
      url: imageUrl('cars', seedOffset * 3 + idx),
      filename: `seed-cars-${seedOffset}-${idx}.webp`,
      sortOrder: idx,
      isPrimary: idx === 0,
    }));

    await prisma.item.create({
      data: {
        userId: pick(createdUsers),
        categoryId: carsCatId,
        title,
        description: desc,
        type: 'swap',
        condition: pick(CONDITIONS),
        city: pick(CITIES),
        wantsDescription: pick(carsTpl.wants),
        viewCount: Math.floor(Math.random() * 500),
        saveCount: Math.floor(Math.random() * 80),
        images: { create: images },
      },
    });

    seedOffset++;
    totalItems++;
  }

  await prisma.category.update({ where: { id: carsCatId }, data: { itemCount: 1000 } });
  console.log(`  🚗 1000 items in cars`);

  console.log(`✅ ${totalItems} items total`);
  console.log('\n🔑 Login credentials:');
  console.log('   Email: giorgi@swapbox.ge');
  console.log('   Password: 123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
