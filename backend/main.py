from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from Agent.agent_manager import AgentManager

app = FastAPI()
agent = AgentManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/query")
async def websocket_query(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        query = data.get("query")
        if not query:
            await websocket.send_json({"error": "Query not provided"})
            return

        await agent.process_query(query, websocket)
        await websocket.send_json({"status": "done"})

    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()
