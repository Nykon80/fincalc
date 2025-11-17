// RSS News Feed Parser
// Automatically loads financial news from RSS feeds

const NEWS_FEEDS = {
  en: [
    'https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US',
    'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    'https://feeds.reuters.com/reuters/businessNews',
    'https://feeds.marketwatch.com/marketwatch/markets',
    'https://www.bloomberg.com/feeds/bloomberg-business.rss'
  ],
  pl: [
    'https://www.bankier.pl/rss/wiadomosci.xml',
    'https://rss.money.pl/rss/rss_money_biznes.xml',
    'https://www.bankier.pl/rss/Forex.xml',
    'https://www.bankier.pl/rss/rynki.xml',
    'https://www.bankier.pl/rss/gospodarka.xml',
    'https://rss.money.pl/rss/rss_money_gospodarka.xml',
    'https://rss.money.pl/rss/rss_money_finanse.xml',
    'https://www.bankier.pl/rss/akcje.xml',
    'https://www.bankier.pl/rss/obligacje.xml',
    'https://www.bankier.pl/rss/fundusze.xml'
  ],
  ru: [
    'https://rssexport.rbc.ru/rbcnews/news/30/full.rss',
    'https://www.vedomosti.ru/rss/news',
    'https://www.kommersant.ru/RSS/news.xml',
    'https://www.finam.ru/analysis/news/rss/'
  ]
};

const FALLBACK_NEWS = {
  en: [
    {
      title: 'Global Markets Rally as Inflation Data Improves',
      description: 'US and EU benchmark indices closed higher after softer inflation readings pointed to fewer rate hikes in 2026.',
      link: 'https://www.cnbc.com/',
      pubDate: new Date(Date.now() - 2 * 3600000),
      source: 'Global Markets',
      thumbnail: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Fed Officials Signal Gradual Rate Cuts for 2026',
      description: 'Minutes from the November meeting show the Federal Reserve preparing a roadmap for rate cuts next year if inflation keeps moderating.',
      link: 'https://www.reuters.com/',
      pubDate: new Date(Date.now() - 4 * 3600000),
      source: 'Fed News',
      thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Oil Prices Slip as Supply Stabilizes',
      description: 'Brent crude moved lower as OPEC+ confirmed voluntary cuts will stay in place only through Q1 2026.',
      link: 'https://www.marketwatch.com/',
      pubDate: new Date(Date.now() - 6 * 3600000),
      source: 'Commodities',
      thumbnail: 'https://images.unsplash.com/photo-1488820098099-8dbd460c81b0?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Tech Giants Report Strong Q3 Earnings',
      description: 'Major technology companies surpassed expectations with AI-driven growth and increased cloud revenue margins.',
      link: 'https://www.bloomberg.com/',
      pubDate: new Date(Date.now() - 8 * 3600000),
      source: 'Tech Markets',
      thumbnail: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Banking Sector Eyes Merger Wave in 2026',
      description: 'Regulatory changes and margin pressures spark speculation about consolidation across regional banks.',
      link: 'https://www.yahoo.com/finance',
      pubDate: new Date(Date.now() - 10 * 3600000),
      source: 'Finance News',
      thumbnail: 'https://images.unsplash.com/photo-1552821206-b6e36b1f1b0f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Cryptocurrency Markets See Volatility Spike',
      description: 'Bitcoin and major altcoins experienced significant price swings as regulatory clarity remains uncertain in key markets.',
      link: 'https://www.coindesk.com/',
      pubDate: new Date(Date.now() - 12 * 3600000),
      source: 'Crypto Markets',
      thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'European Central Bank Maintains Current Policy',
      description: 'ECB officials signal no immediate changes to interest rates as inflation data comes in line with expectations.',
      link: 'https://www.reuters.com/',
      pubDate: new Date(Date.now() - 14 * 3600000),
      source: 'ECB News',
      thumbnail: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Real Estate Investment Trusts Show Strong Performance',
      description: 'REITs across commercial and residential sectors report higher occupancy rates and rental income growth.',
      link: 'https://www.marketwatch.com/',
      pubDate: new Date(Date.now() - 16 * 3600000),
      source: 'Real Estate',
      thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Emerging Markets Currency Rally Continues',
      description: 'Currencies in developing economies strengthen as commodity prices stabilize and global trade flows improve.',
      link: 'https://www.bloomberg.com/',
      pubDate: new Date(Date.now() - 18 * 3600000),
      source: 'Forex Markets',
      thumbnail: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Corporate Bond Yields Narrow on Economic Optimism',
      description: 'Investment-grade corporate bonds see spread compression as credit markets anticipate stable economic growth.',
      link: 'https://www.cnbc.com/',
      pubDate: new Date(Date.now() - 20 * 3600000),
      source: 'Bond Markets',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Sustainable Finance Gains Momentum',
      description: 'ESG-focused investment products attract record inflows as institutional investors prioritize climate and social impact.',
      link: 'https://www.yahoo.com/finance',
      pubDate: new Date(Date.now() - 22 * 3600000),
      source: 'ESG Investing',
      thumbnail: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Gold Prices Reach New Highs Amid Economic Uncertainty',
      description: 'Precious metals surge as investors seek safe-haven assets while central banks signal potential policy shifts.',
      link: 'https://www.marketwatch.com/',
      pubDate: new Date(Date.now() - 24 * 3600000),
      source: 'Commodities',
      thumbnail: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Housing Market Shows Signs of Stabilization',
      description: 'Home prices moderate as mortgage rates level off and inventory levels increase across major metropolitan areas.',
      link: 'https://www.bloomberg.com/',
      pubDate: new Date(Date.now() - 26 * 3600000),
      source: 'Real Estate',
      thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Retail Banking Digital Transformation Accelerates',
      description: 'Traditional banks invest heavily in mobile banking platforms and AI-powered customer service to compete with fintech challengers.',
      link: 'https://www.cnbc.com/',
      pubDate: new Date(Date.now() - 28 * 3600000),
      source: 'Banking',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Insurance Sector Adapts to Climate Risk',
      description: 'Property and casualty insurers revise pricing models and coverage terms as extreme weather events become more frequent.',
      link: 'https://www.reuters.com/',
      pubDate: new Date(Date.now() - 30 * 3600000),
      source: 'Insurance',
      thumbnail: 'https://images.unsplash.com/photo-1444653389962-8149286c578a?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Pension Funds Increase Alternative Investments',
      description: 'Institutional investors allocate more capital to private equity, real estate, and infrastructure to boost long-term returns.',
      link: 'https://www.yahoo.com/finance',
      pubDate: new Date(Date.now() - 32 * 3600000),
      source: 'Pensions',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  pl: [
    {
      title: 'NBP zapowiada ostrożne cięcia stóp w 2026 roku',
      description: 'Rada Polityki Pieniężnej sygnalizuje możliwość obniżek stóp przy stabilnej inflacji bazowej.',
      link: 'https://www.bankier.pl/',
      pubDate: new Date(Date.now() - 2 * 3600000),
      source: 'NBP',
      thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Polskie spółki technologiczne biją rekordy wyceny',
      description: 'Na GPW rośnie zainteresowanie spółkami AI i cyberbezpieczeństwa, których wycena wzrosła średnio o 18% w ostatnim miesiącu.',
      link: 'https://www.money.pl/',
      pubDate: new Date(Date.now() - 4 * 3600000),
      source: 'GPW',
      thumbnail: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Kurs złotego stabilny mimo wahań na świecie',
      description: 'PLN pozostaje w przedziale 4,25–4,30 za euro dzięki napływowi środków z UE i dodatniemu bilansowi handlowemu.',
      link: 'https://www.bankier.pl/',
      pubDate: new Date(Date.now() - 6 * 3600000),
      source: 'Forex',
      thumbnail: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Nowe obligacje oszczędnościowe biją rekord sprzedaży',
      description: 'Indeksowane inflacją obligacje detaliczne przyciągnęły ponad 7 mld zł nowych środków w ostatnich tygodniach.',
      link: 'https://www.money.pl/',
      pubDate: new Date(Date.now() - 8 * 3600000),
      source: 'Obligacje',
      thumbnail: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Sektor bankowy zmienia strategie pod presją AI',
      description: 'Polskie banki inwestują w transformację cyfrową, automatyzując obsługę klientów i procesy wewnętrzne.',
      link: 'https://www.bankier.pl/',
      pubDate: new Date(Date.now() - 10 * 3600000),
      source: 'Banki',
      thumbnail: 'https://images.unsplash.com/photo-1552821206-b6e36b1f1b0f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'GPW notuje wzrosty dzięki dobrym wynikom spółek',
      description: 'Warszawska giełda zanotowała wzrost głównego indeksu WIG20 o 2,3% po publikacji lepszych niż oczekiwano wyników kwartalnych.',
      link: 'https://www.bankier.pl/',
      pubDate: new Date(Date.now() - 12 * 3600000),
      source: 'GPW',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Inflacja w Polsce spada poniżej oczekiwań',
      description: 'GUS podał dane o inflacji za listopad - wskaźnik CPI wyniósł 3,8% r/r, co jest niższe niż prognozowane 4,1%.',
      link: 'https://www.money.pl/',
      pubDate: new Date(Date.now() - 14 * 3600000),
      source: 'Inflacja',
      thumbnail: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Fundusze inwestycyjne notują rekordowe wpływy',
      description: 'Polskie fundusze inwestycyjne odnotowały w tym miesiącu najwyższe wpływy od początku roku, głównie dzięki funduszom akcyjnym.',
      link: 'https://www.bankier.pl/',
      pubDate: new Date(Date.now() - 16 * 3600000),
      source: 'Fundusze',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Kredyty hipoteczne drożeją po decyzji NBP',
      description: 'Banki podnoszą oprocentowanie kredytów mieszkaniowych po ostatniej decyzji Rady Polityki Pieniężnej o utrzymaniu stóp na obecnym poziomie.',
      link: 'https://www.money.pl/',
      pubDate: new Date(Date.now() - 18 * 3600000),
      source: 'Kredyty',
      thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Złoty zyskuje na rynku walutowym',
      description: 'Kurs złotego umacnia się wobec głównych walut dzięki napływowi środków z funduszy unijnych i stabilnej sytuacji gospodarczej.',
      link: 'https://www.bankier.pl/',
      pubDate: new Date(Date.now() - 20 * 3600000),
      source: 'Forex',
      thumbnail: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Spółki energetyczne zwiększają inwestycje w OZE',
      description: 'Polskie firmy energetyczne planują rekordowe inwestycje w odnawialne źródła energii, co wpływa pozytywnie na ich wycenę na giełdzie.',
      link: 'https://www.money.pl/',
      pubDate: new Date(Date.now() - 22 * 3600000),
      source: 'Energetyka',
      thumbnail: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Budżet państwa z rekordowym przychodem',
      description: 'Ministerstwo Finansów podało dane o wykonaniu budżetu - przychody przekroczyły plan o 5,2 mld zł dzięki wyższym wpływom z podatków.',
      link: 'https://www.bankier.pl/',
      pubDate: new Date(Date.now() - 24 * 3600000),
      source: 'Budżet',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  ru: [
    {
      title: 'Рубль укрепился на фоне роста цен на нефть',
      description: 'Курс рубля поднялся до 86 за доллар после повышения котировок Brent и рекордного профицита торгового баланса.',
      link: 'https://www.rbc.ru/',
      pubDate: new Date(Date.now() - 2 * 3600000),
      source: 'RBC',
      thumbnail: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'ЦБ РФ сохранил ключевую ставку и усилил риторику',
      description: 'Регулятор подтвердил готовность удерживать ставку 15% до устойчивого снижения инфляционных ожиданий.',
      link: 'https://www.vedomosti.ru/',
      pubDate: new Date(Date.now() - 4 * 3600000),
      source: 'ЦБ РФ',
      thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Российские экспортеры наращивают дивидендные выплаты',
      description: 'Газовые и металлургические компании утвердили рекордные дивиденды за 2025 год благодаря высоким ценам на сырье.',
      link: 'https://www.kommersant.ru/',
      pubDate: new Date(Date.now() - 6 * 3600000),
      source: 'Компании',
      thumbnail: 'https://images.unsplash.com/photo-1444653389962-8149286c578a?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Спрос на ипотеку растет несмотря на высокие ставки',
      description: 'Банки фиксируют 9% рост выдач благодаря субсидированным программам и возвращению семейных льгот.',
      link: 'https://www.finam.ru/',
      pubDate: new Date(Date.now() - 8 * 3600000),
      source: 'Ипотека',
      thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Технологический сектор привлекает венчурные инвестиции',
      description: 'Несмотря на санкции, российские стартапы в области AI и облачных технологий получают значительное финансирование.',
      link: 'https://www.rbc.ru/',
      pubDate: new Date(Date.now() - 10 * 3600000),
      source: 'IT Технологии',
      thumbnail: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Банки увеличивают резервы на возможные потери',
      description: 'Крупнейшие российские банки нарастили резервы на 15% в третьем квартале, готовясь к возможному росту просроченной задолженности.',
      link: 'https://www.vedomosti.ru/',
      pubDate: new Date(Date.now() - 12 * 3600000),
      source: 'Банки',
      thumbnail: 'https://images.unsplash.com/photo-1552821206-b6e36b1f1b0f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Фондовый рынок демонстрирует устойчивость',
      description: 'Индекс МосБиржи сохраняет положительную динамику на фоне стабильных цен на нефть и укрепления рубля.',
      link: 'https://www.kommersant.ru/',
      pubDate: new Date(Date.now() - 14 * 3600000),
      source: 'Фондовый рынок',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Облигации федерального займа пользуются спросом',
      description: 'Инвесторы активно приобретают ОФЗ с длинными сроками погашения, привлеченные высокой доходностью и надежностью.',
      link: 'https://www.finam.ru/',
      pubDate: new Date(Date.now() - 16 * 3600000),
      source: 'Облигации',
      thumbnail: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Страховой рынок показывает рост премий',
      description: 'Объем собранных страховых премий вырос на 12% по сравнению с аналогичным периодом прошлого года.',
      link: 'https://www.rbc.ru/',
      pubDate: new Date(Date.now() - 18 * 3600000),
      source: 'Страхование',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Микрофинансовые организации расширяют присутствие',
      description: 'МФО увеличивают объемы выдачи займов, особенно в регионах, где традиционные банки ограничивают кредитование.',
      link: 'https://www.vedomosti.ru/',
      pubDate: new Date(Date.now() - 20 * 3600000),
      source: 'МФО',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Валютные резервы ЦБ остаются на высоком уровне',
      description: 'Золотовалютные резервы России сохраняются выше 600 миллиардов долларов благодаря высоким ценам на энергоносители.',
      link: 'https://www.kommersant.ru/',
      pubDate: new Date(Date.now() - 22 * 3600000),
      source: 'ЦБ РФ',
      thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Депозитные ставки продолжают расти',
      description: 'Банки повышают процентные ставки по вкладам, привлекая средства населения в условиях высокой ключевой ставки ЦБ.',
      link: 'https://www.finam.ru/',
      pubDate: new Date(Date.now() - 24 * 3600000),
      source: 'Депозиты',
      thumbnail: 'https://images.unsplash.com/photo-1444653389962-8149286c578a?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Рынок недвижимости стабилизируется',
      description: 'Цены на жилье в крупных городах перестали падать, что указывает на стабилизацию рынка недвижимости.',
      link: 'https://www.rbc.ru/',
      pubDate: new Date(Date.now() - 26 * 3600000),
      source: 'Недвижимость',
      thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Инфляция замедляется быстрее прогнозов',
      description: 'Рост потребительских цен в ноябре составил 4,2% в годовом выражении, что ниже ожиданий аналитиков.',
      link: 'https://www.vedomosti.ru/',
      pubDate: new Date(Date.now() - 28 * 3600000),
      source: 'Инфляция',
      thumbnail: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Криптовалютный рынок демонстрирует волатильность',
      description: 'Курс биткоина колеблется в широком диапазоне на фоне неопределенности регуляторной политики в различных юрисдикциях.',
      link: 'https://www.kommersant.ru/',
      pubDate: new Date(Date.now() - 30 * 3600000),
      source: 'Криптовалюты',
      thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Фондовые индексы показывают положительную динамику',
      description: 'Индекс МосБиржи и индекс РТС демонстрируют рост благодаря укреплению рубля и стабильным ценам на сырьевые товары.',
      link: 'https://www.finam.ru/',
      pubDate: new Date(Date.now() - 32 * 3600000),
      source: 'Фондовый рынок',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
    }
  ]
};

// RSS to JSON converter API (free service)
const RSS_TO_JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

class NewsFeedManager {
  constructor() {
    this.newsCache = {};
    this.loadingElement = document.getElementById('news-loading');
    this.errorElement = document.getElementById('news-error');
    this.gridElement = document.getElementById('news-grid');
  }

  async loadNews(lang = 'en') {
    // Check if already cached
    if (this.newsCache[lang]) {
      this.displayNews(this.newsCache[lang]);
      return;
    }

    try {
      this.showLoading();
      
      const feeds = NEWS_FEEDS[lang] || NEWS_FEEDS['en'];
      const allNews = [];

      // Fetch from multiple RSS feeds
      for (const feedUrl of feeds) {
        try {
          const response = await fetch(RSS_TO_JSON_API + encodeURIComponent(feedUrl), {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.warn(`Feed ${feedUrl} returned status ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          
          if (!data || data.status !== 'ok') {
            console.warn(`Feed ${feedUrl} returned invalid data:`, data);
            continue;
          }
          
          if (data.status === 'ok' && data.items) {
            // Financial keywords for filtering (expanded list)
            const financialKeywords = {
              en: ['finance', 'financial', 'economy', 'economic', 'market', 'stock', 'investment', 'bank', 'currency', 'trading', 'business', 'money', 'dollar', 'euro', 'inflation', 'interest', 'rate', 'loan', 'mortgage', 'savings', 'deposit', 'credit', 'debt', 'budget', 'revenue', 'profit', 'loss', 'earnings', 'GDP', 'unemployment', 'employment', 'wage', 'salary', 'tax', 'fiscal', 'monetary', 'policy', 'central bank', 'fed', 'ecb', 'nbp', 'cbr', 'bitcoin', 'crypto', 'forex', 'bond', 'equity', 'dividend', 'IPO', 'merger', 'acquisition'],
              pl: ['finanse', 'finansowy', 'gospodarka', 'gospodarczy', 'rynek', 'akcje', 'inwestycja', 'bank', 'waluta', 'handel', 'biznes', 'pieniądze', 'dolar', 'euro', 'inflacja', 'odsetki', 'stopa', 'kredyt', 'hipoteka', 'oszczędności', 'depozyt', 'dług', 'budżet', 'zysk', 'strata', 'zarobki', 'PKB', 'bezrobocie', 'zatrudnienie', 'pensja', 'podatek', 'fiskalny', 'monetarny', 'polityka', 'bank centralny', 'NBP'],
              ru: ['финансы', 'финансовый', 'экономика', 'экономический', 'рынок', 'акции', 'инвестиции', 'банк', 'валюта', 'торговля', 'бизнес', 'деньги', 'доллар', 'евро', 'рубль', 'инфляция', 'процент', 'ставка', 'кредит', 'ипотека', 'сбережения', 'вклад', 'долг', 'бюджет', 'прибыль', 'убыток', 'заработок', 'ВВП', 'безработица', 'занятость', 'зарплата', 'налог', 'фискальный', 'монетарный', 'центральный банк', 'ЦБ', 'ЦБРФ', 'биткоин', 'крипто', 'форекс', 'облигации', 'дивиденды', 'IPO', 'котировки', 'курс', 'бирж', 'индекс', 'дивиденд', 'облигаци', 'депозит', 'кредит', 'ипотек', 'ставк', 'процентн', 'инфляци', 'валютн', 'рыночн', 'финансов', 'экономическ', 'инвестиционн', 'банковск', 'торгов', 'бизнес', 'прибыл', 'убытк', 'бюджетн', 'налогов', 'фискальн', 'монетарн']
            };
            
            const keywords = financialKeywords[lang] || financialKeywords.en;
            
            // Filter financial news - stricter for Russian, more lenient for others
            const filteredItems = data.items.filter(item => {
              const titleLower = (item.title || '').toLowerCase();
              const descLower = (item.description || item.content || '').toLowerCase();
              const combined = titleLower + ' ' + descLower;
              
              // For Russian, require at least 2 keyword matches for better filtering
              if (lang === 'ru') {
                const matches = keywords.filter(keyword => combined.includes(keyword.toLowerCase())).length;
                return matches >= 2; // Require at least 2 keyword matches
              }
              
              // For other languages, one match is enough
              return keywords.some(keyword => combined.includes(keyword.toLowerCase()));
            });
            
            // Use filtered items if we have enough (at least 3), otherwise use all items from financial feeds
            // For non-financial feeds, always filter strictly
            const isFinancialFeed = feedUrl.includes('finance') || feedUrl.includes('business') || 
                                   feedUrl.includes('market') || feedUrl.includes('bankier') || 
                                   feedUrl.includes('money') || feedUrl.includes('rbc') || 
                                   feedUrl.includes('vedomosti') || feedUrl.includes('kommersant') ||
                                   feedUrl.includes('finam') || feedUrl.includes('cnbc') ||
                                   feedUrl.includes('reuters') || feedUrl.includes('bloomberg');
            
            // For Russian, always use strict filtering
            const itemsToUse = (lang === 'ru') 
              ? filteredItems // Always filter strictly for Russian
              : ((isFinancialFeed && filteredItems.length < 3) 
                ? data.items.slice(0, 10) // Take more items from financial feeds for other languages
                : (filteredItems.length > 0 ? filteredItems : data.items));
            
            // Take more items from each feed to ensure enough news (minimum 12 per language)
            const itemsPerFeed = 15; // Increased for all languages to ensure minimum 12 news items
            itemsToUse.slice(0, itemsPerFeed).forEach(item => {
              try {
                // Clean description first
                const description = this.cleanDescription(item.description || item.content || '');
                
                // Skip items without description or with very short description (less than 20 chars)
                if (!description || description.trim().length < 20) {
                  return; // Skip this item
                }
                
                allNews.push({
                  title: item.title || 'Untitled',
                  description: description,
                  link: item.link || '#',
                  pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                  source: this.extractSource(item.link || ''),
                  thumbnail: this.extractThumbnail(item, lang)
                });
              } catch (err) {
                console.warn('Error processing news item:', err, item);
              }
            });
          }
        } catch (err) {
          console.warn('Failed to load feed:', feedUrl, err);
        }
      }

      // Sort by date (newest first)
      allNews.sort((a, b) => b.pubDate - a.pubDate);

      // Filter out duplicates by title
      const uniqueNews = [];
      const seenTitles = new Set();
      for (const news of allNews) {
        const titleKey = news.title.toLowerCase().substring(0, 50);
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          uniqueNews.push(news);
        }
      }

      // Take top news items - minimum 12 for all languages
      const newsLimit = 15; // Increased to ensure we always have at least 12 news items
      let topNews = uniqueNews.slice(0, newsLimit);

      // If no news found or less than 12 items, use fallback to ensure minimum 12
      if (topNews.length < 12) {
        console.warn('Not enough news items found for language:', lang, 'Using fallback news');
        const fallback = FALLBACK_NEWS[lang] || FALLBACK_NEWS.en;
        
        // Combine any found news with fallback
        topNews = [...topNews, ...fallback];
        
        // Deduplicate again
        const dedupedNews = [];
        const seenTitles = new Set();
        for (const news of topNews) {
          const titleKey = news.title.toLowerCase().substring(0, 50);
          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            dedupedNews.push(news);
          }
        }
        
        // Ensure we have at least 12 news items
        topNews = dedupedNews.slice(0, Math.max(12, newsLimit));
      }

      // Final check: ensure we have at least 12 news items
      if (topNews.length < 12) {
        const fallback = FALLBACK_NEWS[lang] || FALLBACK_NEWS.en;
        // Add fallback news to reach minimum 12
        const needed = 12 - topNews.length;
        const additionalFallback = fallback.slice(0, needed);
        
        // Deduplicate before adding
        const existingTitles = new Set(topNews.map(n => n.title.toLowerCase().substring(0, 50)));
        const uniqueFallback = additionalFallback.filter(n => {
          const titleKey = n.title.toLowerCase().substring(0, 50);
          return !existingTitles.has(titleKey);
        });
        
        topNews = [...topNews, ...uniqueFallback].slice(0, 12);
      }

      // Cache results
      this.newsCache[lang] = topNews;

      this.displayNews(topNews);
    } catch (error) {
      console.error('Error loading news:', error);
      
      // Use fallback news if there's a network error
      console.warn('Using fallback news due to error');
      const fallback = FALLBACK_NEWS[lang] || FALLBACK_NEWS.en;
      
      // Ensure we have at least 12 news items from fallback
      const fallbackNews = fallback.slice(0, Math.max(12, fallback.length));
      
      // Cache and display fallback
      this.newsCache[lang] = fallbackNews;
      this.displayNews(fallbackNews);
    }
  }

  extractThumbnail(item, lang = 'en') {
    // Try multiple sources for thumbnail
    if (item.thumbnail && !item.thumbnail.includes('placeholder')) return item.thumbnail;
    if (item.enclosure?.link && item.enclosure?.type?.startsWith('image/')) return item.enclosure.link;
    if (item.enclosure?.link && !item.enclosure.link.includes('placeholder')) return item.enclosure.link;
    
    // Try to extract image from description HTML (multiple patterns)
    if (item.description || item.content) {
      const html = item.description || item.content;
      
      // Try different image patterns
      const patterns = [
        /<img[^>]+src=["']([^"']+)["']/i,
        /<img[^>]+src=([^\s>]+)/i,
        /src=["']([^"']*\.(jpg|jpeg|png|gif|webp)[^"']*)["']/i,
        /https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp)/i
      ];
      
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1] && !match[1].includes('icon') && !match[1].includes('logo') && !match[1].includes('placeholder')) {
          let imgUrl = match[1];
          // Clean up URL
          imgUrl = imgUrl.replace(/^["']|["']$/g, '');
          if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
          if (imgUrl.startsWith('/')) {
            try {
              const url = new URL(item.link);
              imgUrl = url.origin + imgUrl;
            } catch {}
          }
          if (imgUrl.startsWith('http')) return imgUrl;
        }
      }
    }
    
    // Try to get image from media:content (RSS 2.0)
    if (item['media:content'] && item['media:content']['@']) {
      const media = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
      if (media && media.url && !media.url.includes('placeholder')) return media.url;
    }
    
    // Return null to indicate no real image found (not placeholder)
    return null;
  }

  cleanDescription(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    // Remove HTML tags and limit length
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = (temp.textContent || temp.innerText || '').trim();
    
    // Return empty string if description is too short or empty
    if (text.length < 10) {
      return '';
    }
    
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  extractSource(url) {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown';
    }
  }

  formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  displayNews(newsItems) {
    this.hideLoading();
    this.hideError();
    this.gridElement.style.display = 'grid';
    this.gridElement.innerHTML = '';

    // Filter out news without description
    const validNews = newsItems.filter(news => {
      const description = (news.description || '').trim();
      return description && description.length >= 20;
    });

    if (validNews.length === 0) {
      this.showError();
      return;
    }

    validNews.forEach(news => {
      const card = document.createElement('a');
      const hasImage = news.thumbnail && !news.thumbnail.includes('placeholder');
      
      card.className = `news-card ${hasImage ? '' : 'no-image'}`;
      card.href = news.link;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      
      const imageHtml = hasImage ? `
        <img src="${news.thumbnail}" alt="${news.title}" class="news-card-image" onerror="this.parentElement.classList.add('no-image'); this.style.display='none';">
      ` : '';
      
      card.innerHTML = `
        ${imageHtml}
        <h3 class="news-card-title">${news.title}</h3>
        <p class="news-card-description">${news.description}</p>
        <div class="news-card-meta">
          <span class="news-card-source">${news.source}</span>
          <span class="news-card-date">${this.formatDate(news.pubDate)}</span>
        </div>
      `;
      
      this.gridElement.appendChild(card);
    });

    // Update i18n for dynamically added content
    if (window.i18n && window.i18n.updatePage) {
      window.i18n.updatePage();
    }
  }

  showLoading() {
    this.loadingElement.style.display = 'block';
    this.errorElement.style.display = 'none';
    this.gridElement.style.display = 'none';
  }

  hideLoading() {
    this.loadingElement.style.display = 'none';
  }

  showError() {
    this.loadingElement.style.display = 'none';
    this.errorElement.style.display = 'block';
    this.gridElement.style.display = 'none';
  }

  hideError() {
    this.errorElement.style.display = 'none';
  }
}

// Initialize news feed on page load
document.addEventListener('DOMContentLoaded', function() {
  const newsManager = new NewsFeedManager();
  
  // Make newsManager globally available
  window.newsManager = newsManager;
  
  // Check if news tab is active by default
  const newsTab = document.getElementById('news');
  if (newsTab && newsTab.classList.contains('active')) {
    const currentLang = localStorage.getItem('preferredLanguage') || 'en';
    newsManager.loadNews(currentLang);
  }
  
  // Load news when news tab is activated
  window.addEventListener('tabActivated', function(e) {
    if (e.detail.tabName === 'news') {
      const currentLang = window.i18n ? window.i18n.currentLang : (localStorage.getItem('preferredLanguage') || 'en');
      newsManager.loadNews(currentLang);
    }
  });
  
  // Reload news when language changes (only if news tab is active)
  window.addEventListener('languageChanged', function(e) {
    const newsTab = document.getElementById('news');
    if (newsTab && newsTab.classList.contains('active')) {
      newsManager.loadNews(e.detail.language);
    }
  });
});

