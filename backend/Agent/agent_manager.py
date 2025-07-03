import os
from typing import Dict, List, Optional
from langchain_core.tools import tool
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv
import json
from Agent.tools.document_loader import load_pdf_from_url, load_document_from_web
from Agent.tools.search_tools import search_paper, search_web
from Agent.tools.summarizer import summarize_content, summarize_content_from_urls
from fastapi import WebSocket

load_dotenv()

class AgentManager:
    """
    A cyclic agent that processes a query by generating and executing one step at a time,
    up to a maximum of 10 steps, for a researcher-focused AI agent. Maintains a history
    of executed steps (limited to 5000 words) and uses LangChain tools.
    """
    def __init__(self):
        # Define tools for LangChain
        self.tools = [
            load_pdf_from_url,
            load_document_from_web,
            search_paper,
            search_web,
            summarize_content,
            summarize_content_from_urls
        ]
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-preview-04-17", temperature=0.1).bind_tools(self.tools)

        self.llm_QA =ChatGoogleGenerativeAI(model="gemini-2.5-flash-preview-04-17", temperature=0.8)
        self.max_steps = 10
        self.max_history_words = 5000
        self.tool_map = {tool.name: tool for tool in self.tools}

    def extract_json_from_response(self,content: str) -> dict:
        # Remove Markdown code block wrapping if present and return in json format.
        content = content.strip()
        if content.startswith("```json"):
            content = content[len("```json"):].strip()
        if content.startswith("```"):
            content = content[len("```"):].strip()
        if content.endswith("```"):
            content = content[:-3].strip()
        return json.loads(content)

    def truncate_history(self, history: str) -> str:
        """
        Truncates history to a maximum of 5000 words, removing from the beginning if needed.

        Args:
            history (str): The history string to truncate.

        Returns:
            str: Truncated history string.
        """
        words = history.split()
        if len(words) > self.max_history_words:
            words = words[-self.max_history_words:]
        return " ".join(words)

    def generate_next_step(self, original_query: str, history: str, step_number: int) -> Dict[str, any]:
        """
        Generates the next step in the execution plan based on the query and history.

        Args:
            original_query (str): The original complex query.
            history (str): The history of previous steps and their results.
            step_number (int): The current step number.

        Returns:
            Dict: A single step in the format {"query": "...", "tool": "... or null", "parameters": "..."}.
        """
        # Define a prompt for generating the next step with escaped curly braces
        prompt = PromptTemplate.from_template(
            """
            You are an AI assistant designed to help researchers. Given a query, the history of previous steps, and the current step number, generate the next step to address the query. Select a tool from the available tools 
            (load_pdf_from_url,
            load_document_from_web,
            search_paper,
            search_web,
            summarize_content,
            summarize_content_from_urls) 
            or set tool to null if no tool is needed (e.g., for general knowledge questions). Provide parameters for the tool or query execution. Consider the history to avoid redundant steps and ensure progress toward solving the query. If the query appears resolved or no further steps are needed, return an empty step {{}} to indicate completion.

            Return the step in the following JSON format:
            {{
                "query": "<simple query for this step>",
                "tool": "<tool_name or null>",
                "parameters": "<specific instructions or parameters>"
            }}

            In case user asking general question return in the following format:
            {{
            
            "query": "<original_query>",
            "tool":"null",
            "parameters":"null"
            }}

            Original query: {original_query}
            History: {history}
            Current step number: {step_number}
            Maximum steps allowed: {max_steps}
            """
        )

        # Truncate history if needed
        truncated_history = self.truncate_history(history)

        # Create a chain to generate the next step
        chain = prompt | self.llm | RunnablePassthrough()
        
        try:
            response = chain.invoke({
                "original_query": original_query,
                "history": truncated_history,
                "step_number": step_number,
                "max_steps": self.max_steps
            })
            print(response.content)
            step = self.extract_json_from_response(response.content)
        except Exception as e:
            print(f"JSON parsing error in step {step_number}: {e}")
            step = {}
        return step

    def execute_step(self, step: Dict[str, any], previous_results: Dict[str, any]) -> Dict[str, any]:
        """
        Executes a single step and returns its result.

        Args:
            step (Dict): The step to execute, with query, tool, and parameters.
            previous_results (Dict): Results from previous steps for dependency resolution.

        Returns:
            Dict: Result of the step execution, with the query as the key.
        """
        if not step:  # Empty step indicates completion
            return {}

        query = step["query"]
        tool_name = step["tool"]
        parameters = step["parameters"]
        result = {}

        if isinstance(tool_name,str) and tool_name == 'null':
            tool_name=None
        try:
            if tool_name is not None:
                tool = self.tool_map.get(tool_name)
                if not tool:
                    result[query] = {"error": f"Tool {tool_name} not found"}
                    return result


                result[query] = {"result": tool.invoke(parameters)}
    
            else:
                # Handle general query without a tool using the LLM directly
                response = self.llm_QA.invoke(query)
                result[query] = {"result": response.content}

        except Exception as e:
            result[query] = {"error": str(e)}

        return result

    async def process_query(self, query: str, websocket: Optional[WebSocket] = None) -> Dict[str, any]:
        history = ""
        results = {}

        for step_number in range(1, self.max_steps + 1):
            step = self.generate_next_step(query, history, step_number)
            if websocket:
                await websocket.send_json({
                    "step_number": step_number,
                    "step": step
                })

            print(f"===============generated step {step_number} ===================")
            print(step)

            if not step or step == {}:
                print(f"Query processing completed at step {step_number - 1}")
                break

            step_result = self.execute_step(step, results)
            if websocket:
                await websocket.send_json({
                    "step_number": step_number,
                    "result": step_result
                })
            print(f"==============Step {step_number} result====================")
            print(step_result)


            if not step_result:
                print(f"Step {step_number} returned no result, stopping")
                break

            # Update results
            results.update(step_result)

            # Update history
            history += f"\nStep {step_number}: Query: {step['query']}, Tool: {step['tool'] or 'null'}, Parameters: {step['parameters']}, Result: {json.dumps(step_result)}"
            history = self.truncate_history(history)

        return {
            "query": query,
            "results": results,
            "history": history
        }

if __name__ == "__main__":
    # Example usage
    agent = AgentManager()
    query = "Summarize latest 3 papers on image classification."
    result = agent.process_query(query)