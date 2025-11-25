// RSS News Feed Parser v2.1
// Только финансовые новости с приоритетом изображений

const NEWS_CONFIG = {
  cacheLifetimeMs: 30 * 60 * 1000,
  autoRefreshMs: 30 * 60 * 1000,
  maxNewsAge: 7,
  newsLimit: 15,
  minNewsCount: 12,
  compactLimit: 6,
  minKeywordMatches: 2, // Минимум совпадений ключевых слов
  prioritizeWithImages: true // Приоритет новостям с фото
};

// RSS источники - ТОЛЬКО финансовые
const NEWS_FEEDS = {
  en: [
    { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US', name: 'Yahoo Finance', isFinance: true },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC Markets', isFinance: true },
    { url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/', name: 'MarketWatch', isFinance: true },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', isFinance: true },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', name: 'NY Times Business', isFinance: true },
    { url: 'https://www.investing.com/rss/news.rss', name: 'Investing.com', isFinance: true }
  ],
  pl: [
    { url: 'https://www.bankier.pl/rss/wiadomosci.xml', name: 'Bankier', isFinance: true },
    { url: 'https://www.bankier.pl/rss/rynki.xml', name: 'Bankier Rynki', isFinance: true },
    { url: 'https://www.bankier.pl/rss/gospodarka.xml', name: 'Bankier Gospodarka', isFinance: true },
    { url: 'https://www.money.pl/rss/rss.xml', name: 'Money.pl', isFinance: true },
    { url: 'https://www.parkiet.com/rss.xml', name: 'Parkiet', isFinance: true },
    { url: 'https://stooq.pl/rss/?q=news', name: 'Stooq', isFinance: true }
  ],
  ru: [
    { url: 'https://rssexport.rbc.ru/rbcnews/news/30/full.rss', name: 'РБК Финансы', isFinance: true },
    { url: 'https://www.vedomosti.ru/rss/news', name: 'Ведомости', isFinance: true },
    { url: 'https://www.kommersant.ru/RSS/news.xml', name: 'Коммерсантъ', isFinance: true },
    { url: 'https://www.finam.ru/analysis/news/rss/', name: 'Финам', isFinance: true },
    { url: 'https://1prime.ru/rss.xml', name: 'Прайм', isFinance: true }
  ]
};

const RSS_APIS = [
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=', name: 'rss2json' },
  { url: 'https://api.allorigins.win/raw?url=', name: 'allorigins', isProxy: true }
];

// Расширенные ключевые слова для финансов
const FINANCE_KEYWORDS = {
  en: [
    'stock', 'market', 'share', 'trading', 'investor', 'investment', 'portfolio',
    'dow', 'nasdaq', 's&p', 'nyse', 'ftse', 'dax', 'index', 'indices',
    'bank', 'banking', 'loan', 'mortgage', 'credit', 'debt', 'interest rate',
    'fed', 'federal reserve', 'central bank', 'ecb', 'monetary policy',
    'inflation', 'deflation', 'gdp', 'economy', 'economic', 'recession',
    'bond', 'treasury', 'yield', 'fixed income',
    'crypto', 'bitcoin', 'ethereum', 'cryptocurrency', 'blockchain',
    'oil', 'gold', 'silver', 'commodity', 'crude', 'brent',
    'forex', 'currency', 'dollar', 'euro', 'yen', 'pound', 'exchange rate',
    'earnings', 'revenue', 'profit', 'dividend', 'ipo', 'merger', 'acquisition',
    'etf', 'mutual fund', 'hedge fund', 'asset', 'wealth',
    'fintech', 'payment', 'financi', 'wall street'
  ],
  pl: [
    'akcje', 'giełda', 'gpw', 'wig', 'wig20', 'inwestor', 'inwestycja', 'portfel',
    'bank', 'kredyt', 'hipoteka', 'pożyczka', 'oprocentowanie', 'stopa procentowa',
    'nbp', 'rpp', 'polityka pieniężna',
    'inflacja', 'pkb', 'gospodarka', 'recesja', 'wzrost',
    'obligacje', 'skarbowe', 'rentowność',
    'kryptowaluta', 'bitcoin', 'ethereum',
    'ropa', 'złoto', 'srebro', 'surowce',
    'waluta', 'kurs', 'złoty', 'euro', 'dolar', 'forex',
    'zysk', 'przychód', 'dywidenda', 'fuzja', 'przejęcie',
    'fundusz', 'etf', 'tfi', 'aktywa',
    'finanse', 'finansow', 'rynki', 'notowania'
  ],
  ru: [
    'акции', 'биржа', 'мосбиржа', 'ртс', 'индекс', 'инвестор', 'инвестици', 'портфель',
    'банк', 'кредит', 'ипотека', 'займ', 'процентн', 'ставка', 'вклад', 'депозит',
    'цб', 'центробанк', 'центральный банк', 'ключевая ставка', 'денежно-кредитн',
    'инфляци', 'ввп', 'экономик', 'рецессия', 'рост',
    'облигаци', 'офз', 'доходност', 'купон',
    'криптовалют', 'биткоин', 'эфириум', 'блокчейн',
    'нефть', 'золото', 'серебро', 'сырье', 'брент',
    'валют', 'курс', 'рубль', 'доллар', 'евро', 'форекс',
    'прибыль', 'выручка', 'дивиденд', 'слияни', 'поглощени',
    'фонд', 'etf', 'пиф', 'актив',
    'финанс', 'рынок', 'торг', 'котировк', 'сбер', 'газпром', 'лукойл'
  ]
};

// Слова-исключения (политика, война и т.д.)
const EXCLUDE_KEYWORDS = {
  en: ['war', 'military', 'troops', 'invasion', 'missile', 'bomb', 'soldier', 'ukraine conflict', 'taiwan strait', 'political', 'election', 'vote', 'campaign', 'democrat', 'republican', 'celebrity', 'entertainment', 'sport', 'football', 'movie', 'music'],
  pl: ['wojna', 'wojsk', 'żołnierz', 'atak', 'rakiet', 'polityk', 'wybor', 'głosow', 'partia', 'celebryta', 'rozrywka', 'sport', 'piłka', 'film', 'muzyka'],
  ru: ['война', 'военн', 'солдат', 'ракет', 'атак', 'удар', 'политик', 'выбор', 'голосов', 'партия', 'депутат', 'дума', 'украин', 'крым', 'донбасс', 'нато', 'санкци', 'знаменит', 'шоу-бизнес', 'спорт', 'футбол', 'кино', 'музык']
};

// Fallback новости - финансовые с фото
const FALLBACK_NEWS = {
  en: [
    { title: 'Stock Markets Rally on Fed Rate Decision', description: 'Major indices closed higher as investors welcomed the Federal Reserve\'s decision on interest rates. The S&P 500 gained 1.2% while Nasdaq led with 1.8% growth.', link: 'https://finance.yahoo.com/', source: 'Markets', pubDate: new Date(Date.now() - 2*3600000), thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80' },
    { title: 'Banking Sector Reports Strong Quarterly Earnings', description: 'Major banks exceeded expectations with robust loan growth and improved net interest margins. JPMorgan, Bank of America, and Wells Fargo all beat analyst estimates.', link: 'https://www.cnbc.com/', source: 'Banking', pubDate: new Date(Date.now() - 4*3600000), thumbnail: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Oil Prices Surge on OPEC+ Production Cuts', description: 'Crude oil jumped 3% after OPEC+ announced deeper production cuts to support prices amid global demand concerns. Brent crude topped $85 per barrel.', link: 'https://www.marketwatch.com/', source: 'Commodities', pubDate: new Date(Date.now() - 6*3600000), thumbnail: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=800&q=80' },
    { title: 'Bitcoin Rebounds Above $45,000 Mark', description: 'Cryptocurrency markets recovered as Bitcoin gained 5% in 24 hours. Institutional buying and ETF inflows drove the rally across digital assets.', link: 'https://www.coindesk.com/', source: 'Crypto', pubDate: new Date(Date.now() - 8*3600000), thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80' },
    { title: 'Treasury Yields Rise on Inflation Data', description: '10-year Treasury yield climbed to 4.5% after inflation figures came in above expectations. Bond investors reassess rate cut timing expectations.', link: 'https://www.wsj.com/', source: 'Bonds', pubDate: new Date(Date.now() - 10*3600000), thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Gold Hits New Record High Amid Dollar Weakness', description: 'Gold prices surged to all-time high of $2,150 per ounce as the dollar weakened and safe-haven demand increased amid economic uncertainty.', link: 'https://www.kitco.com/', source: 'Gold', pubDate: new Date(Date.now() - 12*3600000), thumbnail: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80' },
    { title: 'Tech Giants Lead Market with AI Investments', description: 'Apple, Microsoft, and Google shares rose as companies announced increased AI spending. Tech sector outperformed broader market indices.', link: 'https://www.bloomberg.com/', source: 'Tech Stocks', pubDate: new Date(Date.now() - 14*3600000), thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
    { title: 'European Markets Close Higher on ECB Signals', description: 'European equities gained as ECB signaled potential rate cuts. DAX rose 0.8%, CAC 40 added 1.1%, and FTSE 100 climbed 0.6%.', link: 'https://www.reuters.com/', source: 'Europe', pubDate: new Date(Date.now() - 16*3600000), thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' },
    { title: 'Mortgage Rates Drop to 6-Month Low', description: '30-year fixed mortgage rate fell to 6.8%, spurring refinancing activity. Home buyers see improved affordability as rates trend lower.', link: 'https://www.forbes.com/', source: 'Real Estate', pubDate: new Date(Date.now() - 18*3600000), thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80' },
    { title: 'Dollar Index Weakens Against Major Currencies', description: 'The DXY fell 0.5% as traders price in Fed rate cuts. Euro strengthened to 1.10 while yen gained ground against the greenback.', link: 'https://www.dailyfx.com/', source: 'Forex', pubDate: new Date(Date.now() - 20*3600000), thumbnail: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80' },
    { title: 'Retail Investors Drive ETF Inflows to Record', description: 'Exchange-traded funds attracted $50 billion in monthly inflows. Index funds and dividend ETFs led the surge in retail investor interest.', link: 'https://www.morningstar.com/', source: 'ETFs', pubDate: new Date(Date.now() - 22*3600000), thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
    { title: 'Corporate Bond Spreads Tighten on Risk Appetite', description: 'Investment-grade corporate bonds rallied as credit spreads narrowed. Companies with strong balance sheets see improved borrowing costs.', link: 'https://www.ft.com/', source: 'Credit', pubDate: new Date(Date.now() - 24*3600000), thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Hedge Funds Increase Equity Exposure', description: 'Major hedge funds raised stock holdings to highest level in 18 months. Tech and healthcare sectors attract most institutional capital.', link: 'https://www.bloomberg.com/', source: 'Hedge Funds', pubDate: new Date(Date.now() - 26*3600000), thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Emerging Markets Currencies Rally', description: 'EM currencies strengthened as risk sentiment improved. Brazilian real and Mexican peso led gains against the dollar.', link: 'https://www.investing.com/', source: 'EM Markets', pubDate: new Date(Date.now() - 28*3600000), thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80' },
    { title: 'IPO Market Rebounds with Tech Listings', description: 'Initial public offerings surge as market conditions improve. Several fintech and AI companies prepare for listings in coming weeks.', link: 'https://www.cnbc.com/', source: 'IPOs', pubDate: new Date(Date.now() - 30*3600000), thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80' }
  ],
  pl: [
    { title: 'WIG20 Zamknął Sesję na Plusie', description: 'Główny indeks warszawskiej giełdy zyskał 1,5% dzięki wzrostom spółek bankowych i energetycznych. Obroty przekroczyły 1,2 mld złotych.', link: 'https://www.bankier.pl/', source: 'GPW', pubDate: new Date(Date.now() - 2*3600000), thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80' },
    { title: 'NBP Utrzymał Stopy Procentowe', description: 'Rada Polityki Pieniężnej zdecydowała o utrzymaniu stóp na niezmienionym poziomie. Główna stopa referencyjna wynosi 5,75%.', link: 'https://www.money.pl/', source: 'NBP', pubDate: new Date(Date.now() - 4*3600000), thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Złoty Umocnił Się Wobec Euro', description: 'Polska waluta zyskała 0,3% do euro, osiągając poziom 4,32 PLN/EUR. Analitycy wskazują na poprawę nastrojów na rynkach wschodzących.', link: 'https://www.bankier.pl/', source: 'Forex', pubDate: new Date(Date.now() - 6*3600000), thumbnail: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80' },
    { title: 'Inflacja w Polsce Spadła do 4,5%', description: 'GUS podał dane o inflacji - wskaźnik CPI wyniósł 4,5% r/r, poniżej oczekiwań rynkowych. Ceny żywności pozostają głównym czynnikiem.', link: 'https://businessinsider.com.pl/', source: 'Inflacja', pubDate: new Date(Date.now() - 8*3600000), thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80' },
    { title: 'PKO BP Ogłosił Rekordowy Zysk', description: 'Największy polski bank zaraportował zysk netto 8,2 mld zł za trzy kwartały. Wzrost napędzany wysoką marżą odsetkową i niższymi rezerwami.', link: 'https://www.parkiet.com/', source: 'Banki', pubDate: new Date(Date.now() - 10*3600000), thumbnail: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Ceny Mieszkań Stabilizują Się', description: 'Raport NBP wskazuje na wyhamowanie wzrostu cen nieruchomości w dużych miastach. Średnia cena metra kwadratowego wynosi 12 500 zł.', link: 'https://www.money.pl/', source: 'Nieruchomości', pubDate: new Date(Date.now() - 12*3600000), thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80' },
    { title: 'Obligacje Skarbowe Biją Rekordy Sprzedaży', description: 'Ministerstwo Finansów sprzedało obligacje za 5 mld zł w listopadzie. Inwestorzy wybierają papiery indeksowane inflacją.', link: 'https://www.pb.pl/', source: 'Obligacje', pubDate: new Date(Date.now() - 14*3600000), thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Fundusze Akcyjne z Napływami', description: 'TFI zanotowały 1,5 mld zł napływów do funduszy akcyjnych. Rosnące indeksy przyciągają kapitał do polskich akcji.', link: 'https://www.bankier.pl/', source: 'Fundusze', pubDate: new Date(Date.now() - 16*3600000), thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
    { title: 'Oprocentowanie Kredytów Hipotecznych Spada', description: 'Banki obniżają marże kredytów mieszkaniowych. Średnie oprocentowanie spadło do 7,8% przy malejącej stawce WIBOR.', link: 'https://www.money.pl/', source: 'Kredyty', pubDate: new Date(Date.now() - 18*3600000), thumbnail: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=800&q=80' },
    { title: 'KGHM i Orlen Liderami Wzrostów', description: 'Spółki surowcowe zyskały po wzroście cen miedzi i ropy. KGHM wzrósł o 3,2%, Orlen o 2,8% na zamknięciu sesji.', link: 'https://stooq.pl/', source: 'Spółki', pubDate: new Date(Date.now() - 20*3600000), thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80' },
    { title: 'PKB Polski Wzrósł o 3,1%', description: 'Wstępne dane GUS pokazują wzrost PKB o 3,1% r/r w trzecim kwartale. Konsumpcja prywatna głównym motorem wzrostu.', link: 'https://businessinsider.com.pl/', source: 'PKB', pubDate: new Date(Date.now() - 22*3600000), thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Dywidendy Spółek Giełdowych Rosną', description: 'Analitycy prognozują rekordowe dywidendy za 2024 rok. Banki i spółki energetyczne zapowiadają wysokie wypłaty dla akcjonariuszy.', link: 'https://www.parkiet.com/', source: 'Dywidendy', pubDate: new Date(Date.now() - 24*3600000), thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80' },
    { title: 'PPK z Rekordowymi Wpływami', description: 'Pracownicze Plany Kapitałowe przyciągnęły 2 mld zł nowych składek. Liczba uczestników przekroczyła 3,5 miliona osób.', link: 'https://www.pb.pl/', source: 'PPK', pubDate: new Date(Date.now() - 26*3600000), thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80' },
    { title: 'Ceny Energii dla Firm Stabilne', description: 'Rynek energii elektrycznej stabilizuje się po okresie wzrostów. Firmy negocjują kontrakty na 2025 rok po niższych cenach.', link: 'https://www.bankier.pl/', source: 'Energia', pubDate: new Date(Date.now() - 28*3600000), thumbnail: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Rynek IPO Ożywia Się', description: 'Giełda w Warszawie przygotowuje się na nowe debiuty. Kilka spółek technologicznych planuje oferty publiczne w I kwartale.', link: 'https://www.money.pl/', source: 'IPO', pubDate: new Date(Date.now() - 30*3600000), thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80' }
  ],
  ru: [
    { title: 'Индекс МосБиржи Вырос на 1,8%', description: 'Российский фондовый рынок закрылся в плюсе благодаря росту нефтегазового сектора. Объем торгов составил 85 млрд рублей.', link: 'https://www.rbc.ru/', source: 'МосБиржа', pubDate: new Date(Date.now() - 2*3600000), thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80' },
    { title: 'ЦБ Сохранил Ключевую Ставку 16%', description: 'Банк России оставил ставку без изменений, ссылаясь на сохраняющееся инфляционное давление. Следующее заседание в декабре.', link: 'https://www.vedomosti.ru/', source: 'ЦБ РФ', pubDate: new Date(Date.now() - 4*3600000), thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Курс Доллара Опустился до 88 Рублей', description: 'Российская валюта укрепилась на фоне высоких нефтяных цен и продаж валютной выручки экспортерами перед налоговым периодом.', link: 'https://www.kommersant.ru/', source: 'Валюта', pubDate: new Date(Date.now() - 6*3600000), thumbnail: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80' },
    { title: 'Инфляция Замедлилась до 7,5%', description: 'Росстат зафиксировал снижение годовой инфляции. Продовольственные товары показали наименьший рост цен за полгода.', link: 'https://www.finam.ru/', source: 'Инфляция', pubDate: new Date(Date.now() - 8*3600000), thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Сбербанк Увеличил Чистую Прибыль', description: 'Крупнейший банк страны заработал 1,5 трлн рублей за 9 месяцев. Рост обеспечен высокой процентной маржой и комиссионными доходами.', link: 'https://www.rbc.ru/', source: 'Банки', pubDate: new Date(Date.now() - 10*3600000), thumbnail: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Цены на Жилье в Москве Стабильны', description: 'Средняя стоимость квадратного метра в столице составляет 320 тыс. рублей. Рынок новостроек показывает умеренный спрос.', link: 'https://www.vedomosti.ru/', source: 'Недвижимость', pubDate: new Date(Date.now() - 12*3600000), thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80' },
    { title: 'Нефть Brent Превысила $85 за Баррель', description: 'Котировки нефти выросли после решения ОПЕК+ продлить ограничения добычи. Российская Urals торгуется с дисконтом $8.', link: 'https://www.kommersant.ru/', source: 'Нефть', pubDate: new Date(Date.now() - 14*3600000), thumbnail: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=800&q=80' },
    { title: 'Доходность ОФЗ Достигла 14,5%', description: 'Государственные облигации показывают высокую доходность на фоне жесткой политики ЦБ. Инвесторы наращивают позиции.', link: 'https://www.finam.ru/', source: 'Облигации', pubDate: new Date(Date.now() - 16*3600000), thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Ипотечные Ставки Достигли 18%', description: 'Средняя ставка по рыночной ипотеке выросла до 18% годовых. Льготные программы остаются основным драйвером спроса.', link: 'https://www.rbc.ru/', source: 'Ипотека', pubDate: new Date(Date.now() - 18*3600000), thumbnail: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Газпром Анонсировал Дивиденды', description: 'Совет директоров рекомендовал дивиденды в размере 52 рубля на акцию. Закрытие реестра назначено на декабрь.', link: 'https://www.vedomosti.ru/', source: 'Дивиденды', pubDate: new Date(Date.now() - 20*3600000), thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Ставки по Вкладам Выросли до 20%', description: 'Банки предлагают рекордные проценты по депозитам. Максимальные ставки доступны по вкладам сроком от года.', link: 'https://www.finam.ru/', source: 'Депозиты', pubDate: new Date(Date.now() - 22*3600000), thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
    { title: 'ВВП России Вырос на 4,1%', description: 'Экономика показала устойчивый рост в третьем квартале. Промышленное производство и потребительский спрос остаются сильными.', link: 'https://www.kommersant.ru/', source: 'ВВП', pubDate: new Date(Date.now() - 24*3600000), thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Лукойл Увеличил Добычу Нефти', description: 'Компания нарастила добычу на 2,5% год к году. Акции выросли на 1,8% после публикации операционных результатов.', link: 'https://www.rbc.ru/', source: 'Нефтегаз', pubDate: new Date(Date.now() - 26*3600000), thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80' },
    { title: 'ПИФы Показали Рост Стоимости', description: 'Паевые инвестиционные фонды акций прибавили в среднем 15% с начала года. Облигационные фонды отстают из-за роста ставок.', link: 'https://www.vedomosti.ru/', source: 'ПИФы', pubDate: new Date(Date.now() - 28*3600000), thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80' },
    { title: 'Золото Подорожало до $2,100', description: 'Цена на золото обновила исторический максимум. Российские инвесторы увеличивают вложения в драгметаллы.', link: 'https://www.finam.ru/', source: 'Золото', pubDate: new Date(Date.now() - 30*3600000), thumbnail: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80' }
  ]
};

class NewsFeedManager {
  constructor() {
    this.newsCache = {};
    this.cacheTimestamps = {};
    this.isLoading = false;
    this.autoRefreshInterval = null;
    
    this.loadingElement = document.getElementById('news-loading');
    this.errorElement = document.getElementById('news-error');
    this.gridElement = document.getElementById('news-grid');
    this.compactLoadingElement = document.getElementById('news-compact-loading');
    this.compactErrorElement = document.getElementById('news-compact-error');
    this.compactGridElement = document.getElementById('news-compact-grid');
    
    this.startAutoRefresh();
  }

  startAutoRefresh() {
    if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
    
    this.autoRefreshInterval = setInterval(() => {
      const lang = window.i18n?.currentLang || localStorage.getItem('preferredLanguage') || 'en';
      this.invalidateCache(lang);
      
      const newsTab = document.getElementById('news');
      const calculatorsTab = document.getElementById('calculators');
      
      if (newsTab?.classList.contains('active') || calculatorsTab?.classList.contains('active')) {
        this.loadNews(lang, true);
      }
    }, NEWS_CONFIG.autoRefreshMs);
  }

  isCacheValid(lang) {
    return this.newsCache[lang] && this.cacheTimestamps[lang] && 
           (Date.now() - this.cacheTimestamps[lang]) < NEWS_CONFIG.cacheLifetimeMs;
  }

  invalidateCache(lang) {
    delete this.newsCache[lang];
    delete this.cacheTimestamps[lang];
  }

  async loadNews(lang = 'en', forceRefresh = false) {
    if (this.isLoading) return;
    
    if (!forceRefresh && this.isCacheValid(lang)) {
      this.displayFromCache(lang);
      return;
    }
    
    this.isLoading = true;
    
    try {
      this.showLoadingState();
      
      const feeds = NEWS_FEEDS[lang] || NEWS_FEEDS.en;
      const allNews = [];
      
      const feedPromises = feeds.map(feed => this.fetchFeed(feed, lang));
      const results = await Promise.allSettled(feedPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allNews.push(...result.value);
        }
      });
      
      let processedNews = this.processNews(allNews, lang);
      
      if (processedNews.length < NEWS_CONFIG.minNewsCount) {
        processedNews = this.mergeFallback(processedNews, lang);
      }
      
      processedNews = processedNews.slice(0, NEWS_CONFIG.newsLimit);
      
      this.newsCache[lang] = processedNews;
      this.cacheTimestamps[lang] = Date.now();
      
      this.displayFromCache(lang);
      
    } catch (error) {
      console.error('Error loading news:', error);
      this.useFallback(lang);
    } finally {
      this.isLoading = false;
    }
  }

  async fetchFeed(feed, lang) {
    for (const api of RSS_APIS) {
      try {
        const newsItems = await this.fetchWithApi(feed, api, lang);
        if (newsItems?.length > 0) return newsItems;
      } catch (error) {
        console.warn(`API ${api.name} failed for ${feed.name}:`, error.message);
      }
    }
    return [];
  }

  async fetchWithApi(feed, api, lang) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    try {
      const url = api.url + encodeURIComponent(feed.url);
      const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
      
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      if (api.isProxy) {
        const text = await response.text();
        return this.parseRssXml(text, feed, lang);
      } else {
        const data = await response.json();
        if (data.status === 'ok' && data.items) {
          return this.processRssItems(data.items, feed, lang);
        }
      }
      return [];
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  parseRssXml(xmlText, feed, lang) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const items = doc.querySelectorAll('item');
      
      const newsItems = [];
      items.forEach(item => {
        const title = item.querySelector('title')?.textContent;
        const description = item.querySelector('description')?.textContent;
        const link = item.querySelector('link')?.textContent;
        const pubDate = item.querySelector('pubDate')?.textContent;
        
        let thumbnail = null;
        const enclosure = item.querySelector('enclosure[type^="image"]');
        if (enclosure) thumbnail = enclosure.getAttribute('url');
        
        const mediaContent = item.querySelector('media\\:content, content');
        if (!thumbnail && mediaContent) thumbnail = mediaContent.getAttribute('url');
        
        // Извлечь изображение из description
        if (!thumbnail && description) {
          const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && !imgMatch[1].includes('icon') && !imgMatch[1].includes('logo')) {
            thumbnail = imgMatch[1];
          }
        }
        
        if (title && description) {
          newsItems.push({
            title: this.cleanText(title),
            description: this.cleanDescription(description),
            link: link || feed.url,
            pubDate: pubDate ? new Date(pubDate) : new Date(),
            source: feed.name,
            thumbnail: thumbnail
          });
        }
      });
      
      return this.filterFinancialNews(newsItems, lang);
    } catch (error) {
      return [];
    }
  }

  processRssItems(items, feed, lang) {
    const newsItems = items.map(item => ({
      title: this.cleanText(item.title || ''),
      description: this.cleanDescription(item.description || item.content || ''),
      link: item.link || feed.url,
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      source: feed.name,
      thumbnail: this.extractThumbnail(item)
    })).filter(item => item.title && item.description.length >= 30);
    
    return this.filterFinancialNews(newsItems, lang);
  }

  // Строгая фильтрация финансовых новостей
  filterFinancialNews(items, lang) {
    const keywords = FINANCE_KEYWORDS[lang] || FINANCE_KEYWORDS.en;
    const excludeWords = EXCLUDE_KEYWORDS[lang] || EXCLUDE_KEYWORDS.en;
    
    return items.filter(item => {
      const text = (item.title + ' ' + item.description).toLowerCase();
      
      // Проверить исключения - пропустить если есть запрещенные слова
      const hasExcluded = excludeWords.some(word => text.includes(word.toLowerCase()));
      if (hasExcluded) return false;
      
      // Подсчитать финансовые ключевые слова
      const matches = keywords.filter(kw => text.includes(kw.toLowerCase()));
      return matches.length >= NEWS_CONFIG.minKeywordMatches;
    });
  }

  // Обработка новостей с приоритетом фото
  processNews(allNews, lang) {
    // Удаление дубликатов
    const unique = [];
    const seen = new Set();
    
    for (const news of allNews) {
      const key = news.title.toLowerCase().substring(0, 50);
      if (!seen.has(key)) {
        seen.add(key);
        
        const ageMs = Date.now() - news.pubDate.getTime();
        const ageDays = ageMs / (24 * 60 * 60 * 1000);
        
        if (ageDays <= NEWS_CONFIG.maxNewsAge) {
          unique.push(news);
        }
      }
    }
    
    // Сортировка: сначала с фото, потом по дате
    if (NEWS_CONFIG.prioritizeWithImages) {
      unique.sort((a, b) => {
        const aHasImage = a.thumbnail ? 1 : 0;
        const bHasImage = b.thumbnail ? 1 : 0;
        
        // Сначала по наличию изображения
        if (bHasImage !== aHasImage) return bHasImage - aHasImage;
        
        // Потом по дате
        return b.pubDate - a.pubDate;
      });
    } else {
      unique.sort((a, b) => b.pubDate - a.pubDate);
    }
    
    return unique;
  }

  mergeFallback(news, lang) {
    const fallback = FALLBACK_NEWS[lang] || FALLBACK_NEWS.en;
    const combined = [...news];
    const existingTitles = new Set(news.map(n => n.title.toLowerCase().substring(0, 30)));
    
    for (const fb of fallback) {
      if (!existingTitles.has(fb.title.toLowerCase().substring(0, 30))) {
        combined.push(fb);
      }
      if (combined.length >= NEWS_CONFIG.newsLimit) break;
    }
    
    return combined;
  }

  useFallback(lang) {
    const fallback = FALLBACK_NEWS[lang] || FALLBACK_NEWS.en;
    this.newsCache[lang] = fallback.slice(0, NEWS_CONFIG.newsLimit);
    this.cacheTimestamps[lang] = Date.now();
    this.displayFromCache(lang);
  }

  displayFromCache(lang) {
    const news = this.newsCache[lang];
    if (!news) return;
    
    const newsTab = document.getElementById('news');
    const calculatorsTab = document.getElementById('calculators');
    
    if (newsTab?.classList.contains('active')) {
      this.displayNews(news);
    } else if (calculatorsTab?.classList.contains('active')) {
      this.displayCompactNews(news, NEWS_CONFIG.compactLimit);
    }
  }

  cleanText(text) {
    return text ? text.replace(/<[^>]*>/g, '').trim() : '';
  }

  cleanDescription(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = (temp.textContent || '').trim();
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  extractThumbnail(item) {
    if (item.thumbnail) return item.thumbnail;
    if (item.enclosure?.link && (item.enclosure.link.includes('.jpg') || item.enclosure.link.includes('.png') || item.enclosure.link.includes('.webp'))) {
      return item.enclosure.link;
    }
    
    const html = item.description || item.content || '';
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && !match[1].includes('icon') && !match[1].includes('logo') && !match[1].includes('avatar')) {
      return match[1];
    }
    
    return null;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  showLoadingState() {
    const newsTab = document.getElementById('news');
    const calculatorsTab = document.getElementById('calculators');
    
    if (newsTab?.classList.contains('active')) {
      if (this.loadingElement) this.loadingElement.style.display = 'block';
      if (this.gridElement) this.gridElement.style.display = 'none';
      if (this.errorElement) this.errorElement.style.display = 'none';
    } else if (calculatorsTab?.classList.contains('active')) {
      if (this.compactLoadingElement) this.compactLoadingElement.style.display = 'block';
      if (this.compactGridElement) this.compactGridElement.style.display = 'none';
      if (this.compactErrorElement) this.compactErrorElement.style.display = 'none';
    }
  }

  displayNews(newsItems) {
    if (this.loadingElement) this.loadingElement.style.display = 'none';
    if (this.errorElement) this.errorElement.style.display = 'none';
    if (!this.gridElement) return;
    
    this.gridElement.style.display = 'grid';
    this.gridElement.innerHTML = '';

    const validNews = newsItems.filter(n => n.description?.length >= 30);

    if (validNews.length === 0) {
      if (this.errorElement) this.errorElement.style.display = 'block';
      return;
    }

    validNews.forEach(news => {
      const card = document.createElement('a');
      const hasImage = news.thumbnail && !news.thumbnail.includes('placeholder');
      
      card.className = `news-card ${hasImage ? '' : 'no-image'}`;
      card.href = news.link;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      
      card.innerHTML = `
        ${hasImage ? `<img src="${news.thumbnail}" alt="${this.escapeHtml(news.title)}" class="news-card-image" loading="lazy" onerror="this.parentElement.classList.add('no-image'); this.style.display='none';">` : ''}
        <h3 class="news-card-title">${this.escapeHtml(news.title)}</h3>
        <p class="news-card-description">${this.escapeHtml(news.description)}</p>
        <div class="news-card-meta">
          <span class="news-card-source">${this.escapeHtml(news.source)}</span>
          <span class="news-card-date">${this.formatDate(news.pubDate)}</span>
        </div>
      `;
      
      this.gridElement.appendChild(card);
    });
  }

  displayCompactNews(newsItems, limit = 6) {
    if (this.compactLoadingElement) this.compactLoadingElement.style.display = 'none';
    if (this.compactErrorElement) this.compactErrorElement.style.display = 'none';
    if (!this.compactGridElement) return;
    
    this.compactGridElement.style.display = 'grid';
    this.compactGridElement.innerHTML = '';

    const validNews = newsItems.filter(n => n.description?.length >= 30).slice(0, limit);

    if (validNews.length === 0) {
      if (this.compactErrorElement) this.compactErrorElement.style.display = 'block';
      return;
    }

    validNews.forEach(news => {
      const card = document.createElement('a');
      const hasImage = news.thumbnail && !news.thumbnail.includes('placeholder');
      
      card.className = `news-card ${hasImage ? '' : 'no-image'}`;
      card.href = news.link;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      
      card.innerHTML = `
        ${hasImage ? `<img src="${news.thumbnail}" alt="${this.escapeHtml(news.title)}" class="news-card-image" loading="lazy" onerror="this.parentElement.classList.add('no-image'); this.style.display='none';">` : ''}
        <h3 class="news-card-title">${this.escapeHtml(news.title)}</h3>
        <p class="news-card-description">${this.escapeHtml(news.description)}</p>
        <div class="news-card-meta">
          <span class="news-card-source">${this.escapeHtml(news.source)}</span>
          <span class="news-card-date">${this.formatDate(news.pubDate)}</span>
        </div>
      `;
      
      this.compactGridElement.appendChild(card);
    });
  }

  refresh() {
    const lang = window.i18n?.currentLang || localStorage.getItem('preferredLanguage') || 'en';
    this.invalidateCache(lang);
    this.loadNews(lang, true);
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
  const newsManager = new NewsFeedManager();
  window.newsManager = newsManager;
  
  const calculatorsTab = document.getElementById('calculators');
  const newsTab = document.getElementById('news');
  
  if (calculatorsTab?.classList.contains('active') || newsTab?.classList.contains('active')) {
    const lang = localStorage.getItem('preferredLanguage') || 'en';
    newsManager.loadNews(lang);
  }
  
  window.addEventListener('tabActivated', e => {
    const lang = window.i18n?.currentLang || localStorage.getItem('preferredLanguage') || 'en';
    if (e.detail.tabName === 'news' || e.detail.tabName === 'calculators') {
      newsManager.loadNews(lang);
    }
  });
  
  window.addEventListener('languageChanged', e => {
    newsManager.invalidateCache(e.detail.language);
    const newsTab = document.getElementById('news');
    const calculatorsTab = document.getElementById('calculators');
    if (newsTab?.classList.contains('active') || calculatorsTab?.classList.contains('active')) {
      newsManager.loadNews(e.detail.language, true);
    }
  });
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const lang = window.i18n?.currentLang || localStorage.getItem('preferredLanguage') || 'en';
      const newsTab = document.getElementById('news');
      const calculatorsTab = document.getElementById('calculators');
      
      if ((newsTab?.classList.contains('active') || calculatorsTab?.classList.contains('active')) && !newsManager.isCacheValid(lang)) {
        newsManager.loadNews(lang, true);
      }
    }
  });
});
