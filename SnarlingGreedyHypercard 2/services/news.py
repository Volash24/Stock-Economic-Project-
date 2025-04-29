# services/news.py
import feedparser

from config import Config

# Function to fetch top news from Seeking Alpha RSS feed
# Requires `feedparser` package: install with `pip install feedparser`

def get_sa_news(limit=10):
    """
    Fetches the latest articles from Seeking Alpha's main RSS feed.

    :param limit: Number of articles to return
    :return: List of dicts with keys 'title', 'link', 'published', 'summary'
    """
    feed_url = 'https://seekingalpha.com/feed.xml'
    feed = feedparser.parse(feed_url)
    news_entries = []

    for entry in feed.entries[:limit]:
        news_entries.append({
            'title': entry.title,
            'link': entry.link,
            'published': entry.get('published', ''),
            'summary': entry.get('summary', '')
        })

    return news_entries
