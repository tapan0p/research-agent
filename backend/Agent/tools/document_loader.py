from langchain_core.tools import tool
from langchain_community.document_loaders import WebBaseLoader
import fitz
import requests
from dotenv import load_dotenv
import os

load_dotenv()


DOCUMENTS_DIR = "documents"
os.makedirs(DOCUMENTS_DIR, exist_ok=True)

def download_pdf(url: str) -> str:
    filename = url.split("/")[-1]
    if not filename.endswith(".pdf"):
        filename += ".pdf"
    filepath = os.path.join(DOCUMENTS_DIR, filename)

    if not os.path.exists(filepath):
        response = requests.get(url)
        if response.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(response.content)
        else:
            raise Exception(f"Failed to download PDF. Status code: {response.status_code}")
    
    return filepath

def read_pdf(filepath: str) -> str:
    text = ""
    with fitz.open(filepath) as doc:
        for page in doc:
            text += page.get_text()
    os.remove(filepath)
    return text

@tool
def load_pdf_from_url(url: str) -> str:
    """
    Downloads a PDF file from the provided URL, saves it locally in the 'documents' directory,
    reads its content using PyMuPDF, and returns the extracted text.

    Args:
        url (str): The direct URL to the PDF file (e.g., a link from arXiv or another repository).

    Returns:
        str: The full text content extracted from the PDF.

    Raises:
        Exception: If the PDF download fails due to an invalid URL or non-200 HTTP response.
    """
    url = url.replace("abs", "pdf")
    filepath = download_pdf(url)
    return read_pdf(filepath)

@tool
def load_document_from_web(url: str) -> str:
    """
    Loads and returns the plain text content from a web page URL using LangChain's WebBaseLoader.

    Args:
        url (str): The URL of the web page to load.

    Returns:
        str: Extracted plain text content from the web page.
    """
    loader = WebBaseLoader(url)
    docs = loader.load()
    return "\n\n".join([doc.page_content for doc in docs])

if __name__ == "__main__":
    # Convert arXiv abstract URL to PDF URL
    # path = 'https://arxiv.org/abs/2506.02442'.replace("abs", "pdf") + ".pdf"
    # print(f"Downloading from: {path}")
    
    # try:
    #     result = load_pdf_from_url.invoke({"url": path})
    #     print(f"Successfully loaded PDF. Content length: {len(result)} characters")
    #     print("\nFirst 300 characters of content:")
    #     print(result[:300] + "..." if len(result) > 300 else result)
    # except Exception as e:
    #     print(f"Error: {e}")

    path = 'https://www.theaireport.ai/articles/crucial-ai-safety-breakthrough'
    result = load_document_from_web.invoke({"url":path})
    print(result)