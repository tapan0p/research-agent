import os
from langchain_core.tools import tool
from langchain_community.utilities import SerpAPIWrapper
from dotenv import load_dotenv
from pprint import pprint
from typing import List,Dict,Optional
load_dotenv()



@tool
def search_paper(
    query: str,
    num: Optional[int] = 5,
    qdr: Optional[str] = None,
    as_ylo: Optional[str] = None,
    as_yhi: Optional[str] = None
) -> List[Dict[str, str]]:
    """
    Search for academic papers using SerpAPI (e.g., from arxiv.org or paperswithcode.com).

    Parameters:
        query (str): Your search query (e.g., "LLM safety")
        num (int, optional): Number of results (default: 5)
        qdr (str, optional): Recency filter (e.g., 'd'=day, 'w'=week, 'm'=month, 'y'=year)
        as_ylo (str, optional): From year (e.g., '2019')
        as_yhi (str, optional): To year (e.g., '2024')
    
    Returns:
        List of dicts with 'title', 'link', 'snippet' and 'author'
    
    """
    serp_api_key = os.getenv("SERPAPI_API_KEY")
    if not serp_api_key:
        raise ValueError("SERPAPI_API_KEY not set in environment")

    params = {
        "num": str(num or 5),
        "hl": "en"
    }

    if qdr:
        params["tbs"] = f"qdr:{qdr}"
    if as_ylo:
        params["as_ylo"] = as_ylo
    if as_yhi:
        params["as_yhi"] = as_yhi

    search = SerpAPIWrapper(serpapi_api_key=serp_api_key, params=params)
    full_query = f"{query} site:arxiv.org OR site:paperswithcode.com"
    results = search.results(query=full_query)
    papers = []
    for item in results.get("organic_results", []):
        snippet = item.get("snippet","")
        snippet = snippet.split(":")[1] if ":" in snippet else snippet
        papers.append({
            "title": item.get("title", ""),
            "link": item.get("link", ""),
            "snippet": snippet,
            "author": item.get("author","")
        })

    return papers[:num or 5]


@tool 
def search_web(
    query: str,
    num: Optional[int] = 5
) -> List[Dict[str, str]]:
    """
    Search the web using SerpAPI.
    
    Parameters:
        query (str): Search string (required).
        num (int, optional): Number of results to return (default: 5).
    
    Returns:
        List of results with 'title', 'link', and 'snippet'.
    """
    serp_api_key = os.getenv("SERPAPI_API_KEY")
    if not serp_api_key:
        raise ValueError("SERPAPI_API_KEY not set in environment")

    search = SerpAPIWrapper(
        serpapi_api_key=serp_api_key,
        params={
            "num": str(num or 5),
            "hl": "en"
        }
    )

    results = search.results(query=query)

    output = []
    for item in results.get("organic_results", []):
        output.append({
            "title": item.get("title", ""),
            "link": item.get("link", ""),
            "snippet": item.get("snippet", "")
        })

    return output[:num or 5]


if __name__ == "__main__":
    query = "papers on LLM safety"
    result = search_paper.invoke({
        "query": query,
        "num": 10,
        "qdr": "m"
    })

    pprint(result)

    result = search_web.invoke({
        "query": "Latest breakthroughs in AI safety",
        "num": 3
    })
    pprint(result)





