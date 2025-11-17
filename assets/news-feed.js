// RSS News Feed Parser
// Automatically loads financial news from RSS feeds

const NEWS_FEEDS = {
  en: [
    'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    'https://feeds.finance.yahoo.com/rss/2.0/headline'
  ],
  pl: [
    'https://www.bankier.pl/rss/wiadomosci.xml',
    'https://rss.money.pl/rss/rss_money_biznes.xml'
  ],
  ru: [
    'https://rssexport.rbc.ru/rbcnews/news/30/full.rss'
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
          const response = await fetch(RSS_TO_JSON_API + encodeURIComponent(feedUrl));
          const data = await response.json();
          
          if (data.status === 'ok' && data.items) {
            // Take first 5 items from each feed
            allNews.push(...data.items.slice(0, 5).map(item => ({
              title: item.title,
              description: this.cleanDescription(item.description || item.content),
              link: item.link,
              pubDate: new Date(item.pubDate),
              source: this.extractSource(item.link),
              thumbnail: item.thumbnail || item.enclosure?.link || null
            })));
          }
        } catch (err) {
          console.warn('Failed to load feed:', feedUrl, err);
        }
      }

      // Sort by date (newest first)
      allNews.sort((a, b) => b.pubDate - a.pubDate);

      // Take top 12 news items
      const topNews = allNews.slice(0, 12);

      // Cache results
      this.newsCache[lang] = topNews;

      this.displayNews(topNews);
    } catch (error) {
      console.error('Error loading news:', error);
      this.showError();
    }
  }

  cleanDescription(html) {
    // Remove HTML tags and limit length
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
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

    newsItems.forEach(news => {
      const card = document.createElement('article');
      card.className = 'news-card';
      
      card.innerHTML = `
        ${news.thumbnail ? `<img src="${news.thumbnail}" alt="${news.title}" class="news-card-image" onerror="this.style.display='none'">` : ''}
        <h3 class="news-card-title">${news.title}</h3>
        <p class="news-card-description">${news.description}</p>
        <div class="news-card-meta">
          <span class="news-card-source">${news.source}</span>
          <span class="news-card-date">${this.formatDate(news.pubDate)}</span>
        </div>
        <a href="${news.link}" target="_blank" rel="noopener noreferrer" class="news-card-link">
          <span data-i18n="news.read_more">Read More</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
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
  
  // Load news based on current language
  const currentLang = localStorage.getItem('preferredLanguage') || 'en';
  newsManager.loadNews(currentLang);
  
  // Reload news when language changes
  window.addEventListener('languageChanged', function(e) {
    newsManager.loadNews(e.detail.language);
  });
  
  // Make newsManager globally available
  window.newsManager = newsManager;
});

