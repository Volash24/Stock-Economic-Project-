# services/news.py

import feedparser
from config import Config

# === Fetches latest articles from Seeking Alpha ===
def get_sa_news(limit=10):
    """
    Fetch Seeking Alpha's latest RSS news articles.

    Returns:
        List of dicts: [{title, link, published, summary}, ...]
    """
    feed_url = 'https://seekingalpha.com/feed.xml'
    feed = feedparser.parse(feed_url)
    news_entries = []

    if feed.bozo:
        raise Exception("Error parsing RSS feed.")

    for entry in feed.entries[:limit]:
        news_entries.append({
            'title': entry.title,
            'link': entry.link,
            'published': entry.get('published', ''),
            'summary': entry.get('summary', '')
        })

    return news_entries

# === Unified access point for Flask route ===
def get_news():
    try:
        return {"news": get_sa_news()}
    except Exception as e:
        return {"error": f"Failed to fetch news: {str(e)}"}
