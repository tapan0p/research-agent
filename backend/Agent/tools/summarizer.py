
from langchain_core.tools import tool
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from pprint import pprint
from typing import List
from .document_loader import load_document_from_web, load_pdf_from_url

load_dotenv()


@tool
def summarize_content(content: str) -> str:
    """
    Generate a concise academic summary for a given body of text.

    Args:
        content (str): The full text content (e.g., article, paper, or webpage) to be summarized.

    Returns:
        str: A short academic-style summary of the input content.
    
    Example Use:
        Useful when a user provides a large chunk of research text and requests a summarized version.
    """

    prompt = PromptTemplate.from_template(
        "Summarize the following content into a short academic summary:\n\n{content}"
    )


    llm = llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-preview-04-17", temperature=0.8)
    chain = prompt | llm
    return chain.invoke(content).content

@tool 
def summarize_content_from_urls(url_list: List[str]) -> str:
    """
    Summarize academic documents from a list of URLs (e.g., PDFs or web pages). Usefull when summarizing documets directly from given urls and no need to load the entire content.

    This tool first loads the content from each URL (PDF for arXiv links, HTML for other links) then summarize the content

    Args:
        url_list (List[str]): A list of URLs pointing to academic papers or articles.
                              Supports both arXiv PDF URLs and general web pages.

    Returns:
        str: A combined summary string containing summaries for each document in the list,
             prefixed by their order in the list.

    """
    result = ""
    for index,url in enumerate(url_list):
        if "arxiv" in url.lower():
            content = load_pdf_from_url.invoke({"url":url})
        else:
            content = load_document_from_web.invoke({"url":url})
        
        content = summarize_content.invoke({"content":content})
        result += f"summary for document {index+1} \n {content} \n"
    
    return result.strip()
