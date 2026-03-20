"""Wikipedia service for fetching random articles."""
import re
import urllib.parse
import unicodedata
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from fastapi import HTTPException, status


class WikipediaService:
    """Service for fetching random Wikipedia articles."""

    BASE_URL = "https://{language}.wikipedia.org/api/rest_v1"

    async def get_random_article(
        self, language: str = "ru", min_length: int = 100, max_length: int = 2000
    ) -> dict[str, str]:
        """
        Get a random Wikipedia article.
        
        Args:
            language: Wikipedia language code (default: 'ru')
            min_length: Minimum text length in characters
            max_length: Maximum text length in characters
        
        Returns:
            Dictionary with 'title', 'content', 'url', 'language'
        
        Raises:
            HTTPException: If Wikipedia API is unavailable or article is too short
        """
        try:
            # Wikipedia API requires User-Agent header
            # Format: AppName/Version (URL; email)
            # Using a more standard format that Wikipedia accepts
            headers = {
                "User-Agent": "TypingTrainer/1.0 (https://typingtrainer.app; admin@typingtrainer.app) Python/3.12",
                "Accept": "application/json",
                "Accept-Language": f"{language},en;q=0.9",
            }
            
            async with httpx.AsyncClient(timeout=15.0, headers=headers, follow_redirects=True) as client:
                # Try to get random summary directly first (simpler)
                try:
                    random_url = f"{self.BASE_URL.format(language=language)}/page/random/summary"
                    response = await client.get(random_url)
                    
                    if response.status_code == 200:
                        summary_data = response.json()
                        title = summary_data.get("title", "")
                        content = summary_data.get("extract", "")
                        
                        if title and content:
                            # Success!
                            pass
                        else:
                            raise ValueError("Empty response")
                    elif response.status_code == 403:
                        # 403 Forbidden - try alternative method
                        raise httpx.HTTPStatusError(
                            "403 Forbidden",
                            request=response.request,
                            response=response
                        )
                    else:
                        response.raise_for_status()
                except (httpx.HTTPStatusError, ValueError) as e:
                    # Fallback: Get random title first, then get summary
                    if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 403:
                        # Try with different User-Agent format
                        headers["User-Agent"] = "Mozilla/5.0 (compatible; TypingTrainer/1.0; +https://typingtrainer.app)"
                    
                    random_title_url = f"{self.BASE_URL.format(language=language)}/page/random/title"
                    title_response = await client.get(random_title_url, headers=headers)
                    
                    if title_response.status_code == 403:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail="Wikipedia API returned 403 Forbidden. This may be due to rate limiting, IP blocking, or User-Agent requirements. Please try again later or contact administrator."
                        )
                    
                    title_response.raise_for_status()
                    
                    title_data = title_response.json()
                    # The response format is: {"items": [{"title": "..."}]}
                    items = title_data.get("items", [])
                    if not items:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail="Failed to get random article title"
                        )
                    
                    title = items[0].get("title", "")
                    if not title:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail="Failed to get random article title"
                        )
                    
                    # Now get summary for this title
                    encoded_title = urllib.parse.quote(title.replace(' ', '_'))
                    summary_url = f"{self.BASE_URL.format(language=language)}/page/summary/{encoded_title}"
                    summary_response = await client.get(summary_url, headers=headers)
                    
                    if summary_response.status_code == 403:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail="Wikipedia API returned 403 Forbidden. This may be due to rate limiting or IP blocking. Please try again later."
                        )
                    
                    summary_response.raise_for_status()
                    
                    summary_data = summary_response.json()
                    content = summary_data.get("extract", "")
                    
                    if not content:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail="Failed to get article content"
                        )
                
                # If summary is too short, try to get more content
                if len(content) < min_length:
                    # Try to get full article content
                    full_content = await self._get_full_article(
                        client, language, title
                    )
                    if full_content and len(full_content) > len(content):
                        content = full_content
                
                # Clean and process content
                content = self._clean_text(content)
                
                # Check length
                if len(content) < min_length:
                    # Try one more time with a different article
                    return await self.get_random_article(language, min_length, max_length)
                
                # Trim to max_length (by sentences)
                if len(content) > max_length:
                    content = self._trim_to_length(content, max_length)
                
                # Build URL (encode title properly)
                encoded_title = urllib.parse.quote(title.replace(' ', '_'))
                url = f"https://{language}.wikipedia.org/wiki/{encoded_title}"
                
                return {
                    "title": title,
                    "content": content,
                    "url": url,
                    "language": language,
                }
                
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Wikipedia API timeout"
            )
        except httpx.HTTPStatusError as e:
            error_detail = f"Wikipedia API error: {e.response.status_code}"
            if e.response.status_code == 403:
                error_detail += " (Forbidden - check User-Agent header)"
            elif e.response.status_code == 404:
                error_detail += " (Article not found)"
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=error_detail
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch Wikipedia article: {str(e)}"
            )

    async def _get_full_article(
        self, client: httpx.AsyncClient, language: str, title: str
    ) -> str:
        """Get full article content."""
        # Encode title for URL
        encoded_title = urllib.parse.quote(title.replace(' ', '_'))
        article_url = f"{self.BASE_URL.format(language=language)}/page/html/{encoded_title}"
        response = await client.get(article_url)
        
        if response.status_code != 200:
            return ""
        
        # Parse HTML and extract text
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "header", "footer"]):
            script.decompose()
        
        # Get text from main content
        content_div = soup.find("div", {"class": "mw-parser-output"})
        if content_div:
            text = content_div.get_text(separator=" ", strip=True)
        else:
            text = soup.get_text(separator=" ", strip=True)
        
        return text

    def _clean_text(self, text: str) -> str:
        """Clean Wikipedia text from markup and references."""
        # Remove reference links like [1], [2], [источник?]
        text = re.sub(r'\[\d+\]', '', text)
        text = re.sub(r'\[[^\]]*\]', '', text)

        # Normalize dashes for easier typing: em/en/minus/non-breaking hyphen -> regular hyphen
        text = re.sub(r"[—–−‑]", "-", text)

        # Remove coordinate patterns (e.g. 55°45′21″N 37°37′04″E)
        text = re.sub(
            r"\b\d{1,3}(?:[.,]\d+)?\s*°\s*\d{0,2}(?:[.,]\d+)?\s*[′'’]?\s*"
            r"\d{0,2}(?:[.,]\d+)?\s*[″\"”]?\s*[NSEWСЮВЗ]\.?"
            r"(?:\s+\d{1,3}(?:[.,]\d+)?\s*°\s*\d{0,2}(?:[.,]\d+)?\s*[′'’]?\s*"
            r"\d{0,2}(?:[.,]\d+)?\s*[″\"”]?\s*[NSEWСЮВЗ]\.?)?",
            "",
            text,
            flags=re.IGNORECASE,
        )
        # Remove decimal coordinates (e.g. 55.7558, 37.6176)
        text = re.sub(r"\b-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+\b", "", text)

        # Remove apostrophe-like marks and stress marks above letters
        text = re.sub(r"[`´'’ʼ]", "", text)
        text = unicodedata.normalize("NFKD", text)
        text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
        
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing whitespace
        text = text.strip()
        
        return text

    def _trim_to_length(self, text: str, max_length: int) -> str:
        """Trim text to max_length, cutting at sentence boundary."""
        if len(text) <= max_length:
            return text
        
        # Find last sentence boundary before max_length
        trimmed = text[:max_length]
        last_period = max(
            trimmed.rfind('.'),
            trimmed.rfind('!'),
            trimmed.rfind('?'),
        )
        
        if last_period > max_length * 0.7:  # If we found a sentence boundary reasonably close
            return text[:last_period + 1].strip()
        
        # Otherwise just trim at max_length
        return trimmed.strip()

